"""Gedeelde interface voor het publiceren naar een platform (fase 2).

Een nieuw platform toevoegen = één subklasse van `Publisher` + registreren in `registry.py`.
De scheduler (fase 2) hoeft alleen deze interface te kennen.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Protocol

from app.models import Platform, Post
from app.services.ai.platforms import full_text
from app.services.checks import post_warnings


class ConnectedAccount(Protocol):
    """Gekoppeld social-media-account (fase 2: tabel `social_accounts` met versleutelde tokens)."""

    platform: str
    external_account_id: str
    access_token: str


@dataclass(frozen=True)
class PublishResult:
    success: bool
    external_id: str | None = None  # id van de post bij het platform
    url: str | None = None
    error: str | None = None  # vertaalbare foutcode
    retryable: bool = False  # tijdelijke fout (rate limit, storing): later opnieuw proberen


class Publisher(ABC):
    platform: Platform

    def validate(self, post: Post) -> list[str]:
        """Blokkerende problemen vóór publiceren, als codes. Standaard: te lang of te veel hashtags."""
        blocking = {"too_long", "too_many_hashtags"}
        return [
            w["code"]
            for w in post_warnings(post.platform, post.hook, post.body, post.hashtags, post.brand)
            if w["code"] in blocking
        ]

    def render(self, post: Post) -> str:
        """De tekst zoals hij geplaatst wordt; een platform kan dit overschrijven."""
        return full_text(post.hook, post.body, post.hashtags)

    @abstractmethod
    def publish(self, post: Post, account: ConnectedAccount) -> PublishResult:
        """Plaatst de post. Gooit geen uitzonderingen voor platformfouten, maar geeft PublishResult terug."""
