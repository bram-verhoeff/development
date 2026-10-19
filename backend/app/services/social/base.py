"""Gedeelde interface voor het koppelen van social-media-accounts via OAuth 2.0.

Een platform toevoegen = een subklasse van `OAuthProvider` + registreren in `registry.py`.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime

import httpx


class SocialError(Exception):
    """Fout met een vertaalbare code, bijv. "connect_denied"."""

    def __init__(self, code: str, status: int = 502):
        super().__init__(code)
        self.code = code
        self.status = status


@dataclass(frozen=True)
class TokenSet:
    access_token: str
    expires_at: datetime | None
    refresh_token: str | None = None
    scopes: str = ""


@dataclass(frozen=True)
class Profile:
    external_account_id: str
    display_name: str
    avatar_url: str | None = None


class OAuthProvider(ABC):
    platform: str

    def __init__(self, http: httpx.Client | None = None):
        # Eigen client meegeven kan in tests (httpx.MockTransport)
        self.http = http or httpx.Client(timeout=20)

    @property
    @abstractmethod
    def configured(self) -> bool:
        """Zijn client-ID en geheim ingesteld?"""

    @abstractmethod
    def authorization_url(self, state: str, redirect_uri: str) -> str: ...

    @abstractmethod
    def exchange_code(self, code: str, redirect_uri: str) -> TokenSet: ...

    @abstractmethod
    def fetch_profile(self, access_token: str) -> Profile: ...
