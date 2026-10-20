"""Gedeelde interface voor het koppelen van social-media-accounts via OAuth 2.0.

Een platform toevoegen = een subklasse van `OAuthProvider` + registreren in `registry.py`.
"""

import base64
import hashlib
import logging
import secrets
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime, timedelta

import httpx

from app.database import utcnow

logger = logging.getLogger(__name__)


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


@dataclass(frozen=True)
class Connected:
    """Resultaat van een afgeronde koppeling: welke tokens horen bij welk account."""

    tokens: TokenSet
    profile: Profile


def expires_in(seconds: int | str | None) -> datetime | None:
    return utcnow() + timedelta(seconds=int(seconds)) if seconds else None


def new_pkce_pair() -> tuple[str, str]:
    """PKCE (S256): geheime verifier + afgeleide challenge die naar het platform gaat."""
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    return verifier, challenge


class OAuthProvider(ABC):
    platform: str
    # Platforms die PKCE verplichten (bijv. X) zetten dit op True
    uses_pkce: bool = False

    def __init__(self, http: httpx.Client | None = None):
        # Eigen client meegeven kan in tests (httpx.MockTransport); anders pas aanmaken bij gebruik,
        # want een client opzetten (SSL) is relatief traag en vaak niet nodig (bijv. alleen "configured")
        self._http = http

    @property
    def http(self) -> httpx.Client:
        if self._http is None:
            self._http = httpx.Client(timeout=20)
        return self._http

    @property
    @abstractmethod
    def configured(self) -> bool:
        """Zijn client-ID en geheim ingesteld?"""

    @abstractmethod
    def authorization_url(self, state: str, redirect_uri: str, code_challenge: str | None = None) -> str: ...

    @abstractmethod
    def complete(self, code: str, redirect_uri: str, code_verifier: str | None = None) -> Connected:
        """Wisselt de code in en zoekt uit welk account gekoppeld is."""

    def refresh(self, tokens: TokenSet) -> TokenSet | None:
        """Nieuw toegangstoken zonder de gebruiker lastig te vallen; None als het platform dat niet kan."""
        return None

    # ---------- hulpjes voor de subklassen ----------

    def _request(self, method: str, url: str, error: str = "connect_failed", **kwargs) -> dict:
        try:
            response = self.http.request(method, url, **kwargs)
        except httpx.HTTPError:
            raise SocialError("platform_unreachable")
        if response.status_code >= 400:
            logger.warning("%s: %s %s gaf %s: %.300s", self.platform, method, url, response.status_code, response.text)
            raise SocialError(error)
        return response.json()
