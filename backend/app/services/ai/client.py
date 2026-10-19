"""Claude-aanroepen voor het genereren en herschrijven van posts, met gestructureerde (gevalideerde) output."""

import logging
import re
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from typing import Protocol

import anthropic
from fastapi import Depends
from pydantic import BaseModel, field_validator

from app.config import Settings, get_settings
from app.models import Brand, Platform
from app.services.ai import prompts

logger = logging.getLogger(__name__)

MAX_TOKENS = 16_000
# Weigert het model een verzoek, dan probeert de API het zelf opnieuw met een passend ander model
FALLBACK_BETA = "server-side-fallback-2026-07-01"


class DraftPost(BaseModel):
    """De vorm waarin Claude een post teruggeeft."""

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

    def add(self, usage) -> None:
        self.input_tokens += usage.input_tokens or 0
        self.output_tokens += usage.output_tokens or 0


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


class PostWriter(Protocol):
    def generate(
        self, brand: Brand, platforms: list[Platform], count: int, source_text: str | None, instructions: str | None
    ) -> GenerationResult: ...

    def regenerate(
        self, brand: Brand, platform: Platform, hook: str, body: str, hashtags: list[str], instructions: str
    ) -> RegenerationResult: ...


class ClaudeWriter:
    def __init__(self, settings: Settings):
        if not settings.anthropic_api_key:
            raise AIError("ai_not_configured", status=503)
        self.model = settings.claude_model
        self.effort = settings.claude_effort
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key, timeout=180.0)

    def _ask(self, prompt: str, output_format: type[BaseModel]):
        try:
            response = self.client.beta.messages.parse(
                model=self.model,
                max_tokens=MAX_TOKENS,
                system=prompts.load_prompt("system"),
                messages=[{"role": "user", "content": prompt}],
                output_format=output_format,
                output_config={"effort": self.effort},
                betas=[FALLBACK_BETA],
                fallbacks="default",
            )
        except anthropic.AuthenticationError:
            raise AIError("ai_auth_failed", status=503)
        except anthropic.PermissionDeniedError:
            raise AIError("ai_auth_failed", status=503)
        except anthropic.RateLimitError:
            raise AIError("ai_rate_limited", status=429)
        except anthropic.BadRequestError as e:
            logger.error("Claude weigerde het verzoek (400): %s", e.message)
            raise AIError("ai_bad_request")
        except anthropic.APIStatusError as e:
            logger.error("Claude API-fout %s: %s", e.status_code, e.message)
            raise AIError("ai_unavailable", status=503)
        except anthropic.APIConnectionError:
            raise AIError("ai_unavailable", status=503)

        if response.stop_reason == "refusal":
            raise AIError("ai_refused", status=422)
        if response.stop_reason == "max_tokens":
            raise AIError("ai_truncated")
        if response.parsed_output is None:
            raise AIError("ai_invalid_output")
        return response

    def generate(self, brand, platforms, count, source_text, instructions) -> GenerationResult:
        usage = Usage(model=self.model)

        def one(platform: Platform):
            prompt = prompts.generate_prompt(brand, platform, count, source_text, instructions)
            return platform, self._ask(prompt, DraftPosts)

        # Eén aanroep per platform, tegelijk: sneller en elke prompt blijft gericht
        with ThreadPoolExecutor(max_workers=len(platforms)) as pool:
            results = list(pool.map(one, platforms))

        posts: dict[Platform, list[DraftPost]] = {}
        for platform, response in results:
            usage.add(response.usage)
            posts[platform] = response.parsed_output.posts[:count]
        return GenerationResult(posts=posts, usage=usage)

    def regenerate(self, brand, platform, hook, body, hashtags, instructions) -> RegenerationResult:
        prompt = prompts.regenerate_prompt(brand, platform, hook, body, hashtags, instructions)
        response = self._ask(prompt, DraftPost)
        usage = Usage(model=self.model)
        usage.add(response.usage)
        return RegenerationResult(post=response.parsed_output, usage=usage)


def get_writer(settings: Settings = Depends(get_settings)) -> PostWriter:
    """FastAPI-dependency; tests vervangen dit door een nep-schrijver."""
    return ClaudeWriter(settings)
