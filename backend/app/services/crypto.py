"""Versleuteling van platform-tokens en ondertekende OAuth-state, op basis van APP_SECRET_KEY."""

import base64
import hashlib
import secrets
import time

import jwt
from cryptography.fernet import Fernet, InvalidToken

from app.config import Settings


class CryptoError(Exception):
    pass


def _secret(settings: Settings) -> str:
    if len(settings.app_secret_key) < 32:
        raise CryptoError("APP_SECRET_KEY ontbreekt of is te kort (minimaal 32 tekens)")
    return settings.app_secret_key


def _fernet(settings: Settings) -> Fernet:
    # Aparte afgeleide sleutel voor versleuteling, zodat hij niet gelijk is aan de ondertekensleutel
    key = hashlib.sha256(b"postpilot-token-encryption:" + _secret(settings).encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key))


def encrypt(value: str, settings: Settings) -> str:
    return _fernet(settings).encrypt(value.encode()).decode()


def decrypt(value: str, settings: Settings) -> str:
    try:
        return _fernet(settings).decrypt(value.encode()).decode()
    except InvalidToken:
        raise CryptoError("Token kon niet ontsleuteld worden (is APP_SECRET_KEY veranderd?)")


STATE_AUDIENCE = "postpilot-oauth-state"
STATE_TTL_SECONDS = 10 * 60


def sign_state(data: dict, settings: Settings) -> str:
    """Korte, ondertekende state voor de OAuth-flow: wie koppelt wat, en een eenmalige nonce."""
    now = int(time.time())
    payload = data | {"nonce": secrets.token_urlsafe(12), "iat": now, "exp": now + STATE_TTL_SECONDS, "aud": STATE_AUDIENCE}
    return jwt.encode(payload, _secret(settings), algorithm="HS256")


def verify_state(state: str, settings: Settings) -> dict:
    try:
        return jwt.decode(state, _secret(settings), algorithms=["HS256"], audience=STATE_AUDIENCE)
    except jwt.InvalidTokenError:
        raise CryptoError("Ongeldige of verlopen state")
