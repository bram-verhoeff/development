"""Gedeelde basis voor de AI-schrijvers (Gemini, Claude): outputvorm, verbruik, foutcodes en keuze van de dienst.

Een AI-dienst toevoegen = een subklasse van `BaseWriter` die alleen `_ask` implementeert.
"""

import re
from abc import ABC, abstractmethod
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from typing import TypeVar

from fastapi import Depends
from pydantic import BaseModel, field_validator

from app.config import Settings, get_settings
from app.models import Brand, Platform
from app.services.ai import prompts


class DraftPost(BaseModel):
    """De vorm waarin het model een post teruggeeft."""

    hook: str
    body: str
    hashtags: list[str]

    @field_validator("hook", "body")
    @classmethod
    def _strip(cls, value: str) -> str:
        return value.strip()

    @field_validator("hashtags")
    @classmethod
    def _clean_hashtags(cls, tags: list[str]) -> list[str]:
        result, seen = [], set()
        for tag in tags:
            tag = "#" + re.sub(r"\s+", "", tag).lstrip("#")
            if len(tag) > 1 and tag.lower() not in seen:
                seen.add(tag.lower())
                result.append(tag)
        return result


class DraftPosts(BaseModel):
    posts: list[DraftPost]


@dataclass
class Usage:
    model: str
    input_tokens: int = 0
    output_tokens: int = 0


@dataclass
class GenerationResult:
    posts: dict[Platform, list[DraftPost]]
    usage: Usage


@dataclass
class RegenerationResult:
    post: DraftPost
    usage: Usage


class AIError(Exception):
    """Fout met een vertaalbare code voor de frontend."""

    def __init__(self, code: str, status: int = 502):
        super().__init__(code)
        self.code = code
        self.status = status


T = TypeVar("T", bound=BaseModel)


@dataclass
class Answer:
    """Wat een AI-dienst teruggeeft op één vraag: de gevalideerde output en het verbruik."""

    output: BaseModel
    input_tokens: int
    output_tokens: int
    # Welk model het antwoord gaf, als dat een ander is dan self.model (bijv. het reservemodel)
    model: str | None = None


class BaseWriter(ABC):
    model: str

    @abstractmethod
    def _ask(self, system: str, prompt: str, output_format: type[T]) -> Answer:
        """Stelt één vraag en geeft gevalideerde output terug, of gooit AIError."""

    def generate(
        self, brand: Brand, platforms: list[Platform], count: int, source_text: str | None, instructions: str | None
    ) -> GenerationResult:
        system = prompts.load_prompt("system")

        def one(platform: Platform) -> tuple[Platform, Answer]:
            prompt = prompts.generate_prompt(brand, platform, count, source_text, instructions)
            return platform, self._ask(system, prompt, DraftPosts)

        # Eén aanroep per platform, tegelijk: sneller en elke prompt blijft gericht
        with ThreadPoolExecutor(max_workers=len(platforms)) as pool:
            answers = list(pool.map(one, platforms))

        used = sorted({a.model or self.model for _, a in answers})
        usage = Usage(model=", ".join(used)[:100])
        posts: dict[Platform, list[DraftPost]] = {}
        for platform, answer in answers:
            usage.input_tokens += answer.input_tokens
            usage.output_tokens += answer.output_tokens
            posts[platform] = answer.output.posts[:count]
        return GenerationResult(posts=posts, usage=usage)

    def regenerate(
        self, brand: Brand, platform: Platform, hook: str, body: str, hashtags: list[str], instructions: str
    ) -> RegenerationResult:
        prompt = prompts.regenerate_prompt(brand, platform, hook, body, hashtags, instructions)
        answer = self._ask(prompts.load_prompt("system"), prompt, DraftPost)
        usage = Usage(model=answer.model or self.model, input_tokens=answer.input_tokens, output_tokens=answer.output_tokens)
        return RegenerationResult(post=answer.output, usage=usage)


def get_writer(settings: Settings = Depends(get_settings)) -> BaseWriter:
    """FastAPI-dependency: kiest de AI-dienst uit AI_PROVIDER. Tests vervangen dit door een nep-schrijver."""
    if settings.ai_provider == "claude":
        from app.services.ai.claude import ClaudeWriter

        return ClaudeWriter(settings)
    from app.services.ai.gemini import GeminiWriter

    return GeminiWriter(settings)
