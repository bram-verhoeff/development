"""Bouwt prompts uit de bestanden in backend/prompts/ en het merkprofiel."""

from functools import lru_cache
from pathlib import Path

from app.models import Brand, Platform
from app.services.ai.platforms import RULES

PROMPT_DIR = Path(__file__).resolve().parents[3] / "prompts"
LANGUAGES = {"nl": "Dutch (Netherlands)", "en": "English"}


@lru_cache
def load_prompt(name: str) -> str:
    return (PROMPT_DIR / f"{name}.md").read_text(encoding="utf-8").strip()


def render(template: str, **values: object) -> str:
    """Vult {{naam}}-plekken in. Bewust geen str.format: merkteksten mogen accolades bevatten."""
    for key, value in values.items():
        template = template.replace("{{" + key + "}}", str(value))
    return template


def brand_profile(brand: Brand) -> str:
    def bullet_list(items: list[str]) -> str:
        return "\n".join(f"- {item}" for item in items) if items else "(none given)"

    return "\n".join(
        [
            f"Name: {brand.name}",
            f"Website: {brand.website_url or '(none)'}",
            f"Target audience: {brand.target_audience or '(not specified)'}",
            f"Tone of voice: {brand.tone_of_voice or '(not specified)'}",
            f"Unique selling points:\n{bullet_list(brand.usps)}",
            f"Words and topics to AVOID:\n{bullet_list(brand.avoid_terms)}",
        ]
    )


def _platform_values(platform: Platform) -> dict[str, object]:
    rules = RULES[platform]
    return {
        "platform": rules.label,
        "style": rules.style,
        "target_min": rules.target_chars[0],
        "target_max": rules.target_chars[1],
        "max_chars": rules.max_chars,
        "hashtags_min": rules.hashtags[0],
        "hashtags_max": rules.hashtags[1],
    }


def generate_prompt(brand: Brand, platform: Platform, count: int, source_text: str | None, instructions: str | None) -> str:
    source_block = f"<source>\n{source_text}\n</source>\nBase the posts on this source material." if source_text else ""
    instructions_block = f"<extra_instructions>\n{instructions}\n</extra_instructions>" if instructions else ""
    return render(
        load_prompt("generate"),
        count=count,
        brand_profile=brand_profile(brand),
        source_block=source_block,
        instructions_block=instructions_block,
        language=LANGUAGES.get(brand.content_language, "Dutch (Netherlands)"),
        **_platform_values(platform),
    )


def regenerate_prompt(brand: Brand, platform: Platform, hook: str, body: str, hashtags: list[str], instructions: str) -> str:
    return render(
        load_prompt("regenerate"),
        brand_profile=brand_profile(brand),
        hook=hook,
        body=body,
        hashtags=" ".join(hashtags) or "(none)",
        instructions=instructions or "Write a fresh, clearly different version.",
        language=LANGUAGES.get(brand.content_language, "Dutch (Netherlands)"),
        **_platform_values(platform),
    )
