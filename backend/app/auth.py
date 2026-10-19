"""Controle van Supabase-sessietokens (JWT) en de e-mail-allowlist.

Supabase ondertekent tokens met een asymmetrische sleutel (ES256/RS256, publieke sleutels via JWKS)
of, bij oudere projecten, met een gedeeld geheim (HS256). Beide worden ondersteund.
"""

import uuid
from dataclasses import dataclass
from functools import lru_cache

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import Settings, get_settings

bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    id: uuid.UUID
    email: str


@lru_cache
def _jwks_client(jwks_url: str) -> jwt.PyJWKClient:
    # Houdt de publieke sleutels in het geheugen; haalt ze opnieuw op bij een onbekende key-id
    return jwt.PyJWKClient(jwks_url, cache_keys=True)


def decode_token(token: str, settings: Settings) -> dict:
    """Geeft de claims terug, of gooit jwt.InvalidTokenError."""
    alg = jwt.get_unverified_header(token).get("alg")
    if alg == "HS256" and settings.supabase_jwt_secret:
        key = settings.supabase_jwt_secret
    elif alg in ("ES256", "RS256"):
        key = _jwks_client(settings.supabase_jwks_url).get_signing_key_from_jwt(token).key
    else:
        raise jwt.InvalidTokenError(f"Niet-ondersteund algoritme: {alg}")

    return jwt.decode(
        token,
        key,
        algorithms=[alg],
        audience="authenticated",
        issuer=settings.supabase_issuer,
        options={"require": ["exp", "sub", "aud", "iss"]},
    )


def is_email_allowed(email: str, settings: Settings) -> bool:
    return email.strip().lower() in settings.allowed_email_set


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    """FastAPI-dependency voor elke beveiligde route."""
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "not_authenticated")
    try:
        claims = decode_token(credentials.credentials, settings)
        user = CurrentUser(id=uuid.UUID(claims["sub"]), email=claims.get("email", ""))
    except (jwt.InvalidTokenError, jwt.PyJWKClientError, ValueError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid_token")

    if not is_email_allowed(user.email, settings):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "email_not_allowed")
    return user
