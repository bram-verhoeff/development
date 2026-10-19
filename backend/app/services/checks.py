"""Controles op een post: lengte, aantal hashtags en woorden die het merk wil vermijden."""

import re

from app.models import Brand, Platform
from app.services.ai.platforms import RULES, full_text


def post_warnings(platform: str, hook: str, body: str, hashtags: list[str], brand: Brand) -> list[dict]:
    """Geeft waarschuwingen als codes + gegevens, zodat de frontend ze kan vertalen."""
    warnings: list[dict] = []
    rules = RULES.get(Platform(platform))
    if rules is None:
        return warnings

    length = len(full_text(hook, body, hashtags))
    if length > rules.max_chars:
        warnings.append({"code": "too_long", "length": length, "max": rules.max_chars})
    if len(hashtags) > rules.hashtags[1]:
        warnings.append({"code": "too_many_hashtags", "count": len(hashtags), "max": rules.hashtags[1]})

    text = f"{hook}\n{body}\n{' '.join(hashtags)}".lower()
    found = [term for term in brand.avoid_terms if _contains(text, term.lower())]
    if found:
        warnings.append({"code": "avoid_terms", "terms": found})
    return warnings


def _contains(text: str, term: str) -> bool:
    # Losse woorden matchen aan het begin van een woord, zodat ook samenstellingen ("goedkoopste") opvallen
    # maar niet stukjes midden in een ander woord. Zinsdelen gewoon als tekst.
    if re.fullmatch(r"[\w-]+", term):
        return re.search(rf"(?<![\w-]){re.escape(term)}", text) is not None
    return term in text
