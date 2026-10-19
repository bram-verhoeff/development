"""Regels per platform: lengte, stijl en hashtags. Gebruikt in de prompt én bij de controle achteraf."""

from dataclasses import dataclass

from app.models import Platform


@dataclass(frozen=True)
class PlatformRules:
    label: str
    max_chars: int  # harde limiet van het platform (hook + tekst + hashtags)
    target_chars: tuple[int, int]  # wat we vragen: ruim binnen de limiet
    hashtags: tuple[int, int]  # min/max aantal hashtags
    style: str  # stijladvies voor het model (Engels werkt het meest precies; de output volgt de merktaal)


RULES: dict[Platform, PlatformRules] = {
    Platform.INSTAGRAM: PlatformRules(
        label="Instagram",
        max_chars=2200,
        target_chars=(400, 1200),
        hashtags=(3, 8),
        style=(
            "Visual, personal and warm. The hook is the first line and must work before the 'more' cut-off "
            "(~125 characters). Short paragraphs separated by blank lines, emoji used sparingly. "
            "End with a clear call to action (save, share, comment, link in bio). Hashtags at the end."
        ),
    ),
    Platform.LINKEDIN: PlatformRules(
        label="LinkedIn",
        max_chars=3000,
        target_chars=(700, 1800),
        hashtags=(2, 4),
        style=(
            "Professional but human; share an insight, lesson or concrete result. The hook is one or two short "
            "lines that create curiosity before 'see more' (~200 characters). Use short paragraphs and white "
            "space, optionally a short list. No clickbait, minimal emoji. End with a question or soft CTA."
        ),
    ),
    Platform.TIKTOK: PlatformRules(
        label="TikTok",
        max_chars=2200,
        target_chars=(80, 300),
        hashtags=(3, 5),
        style=(
            "Write the caption for a short video. The hook is the spoken/on-screen opening line for the first "
            "2 seconds: punchy, curiosity-driven, max ~10 words. The caption itself is short, casual and "
            "energetic, with trend-aware language where it fits the brand."
        ),
    ),
    Platform.X: PlatformRules(
        label="X",
        max_chars=280,
        target_chars=(120, 240),
        hashtags=(0, 2),
        style=(
            "One tight, standalone post. Punchy, opinionated or useful; no filler. The hook IS the start of the "
            "post. Everything (hook + body + hashtags) must fit within 280 characters. At most 2 hashtags."
        ),
    ),
    Platform.FACEBOOK: PlatformRules(
        label="Facebook",
        max_chars=63206,
        target_chars=(250, 800),
        hashtags=(0, 3),
        style=(
            "Friendly and conversational, community-oriented. A clear hook in the first sentence, a short story "
            "or useful info, and a call to action that invites comments or a click. Few or no hashtags."
        ),
    ),
}


def full_text(hook: str, body: str, hashtags: list[str]) -> str:
    """De post zoals hij gepubliceerd wordt: hook, tekst en hashtags."""
    parts = [hook.strip(), body.strip(), " ".join(hashtags).strip()]
    return "\n\n".join(p for p in parts if p)
