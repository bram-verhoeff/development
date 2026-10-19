"""Gekoppelde accounts: opslaan (versleuteld), ophalen en omzetten naar API-vorm."""

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import Settings
from app.database import utcnow
from app.models import Brand, SocialAccount
from app.schemas import ConnectionOut
from app.services import crypto
from app.services.social.base import Profile, TokenSet


@dataclass(frozen=True)
class Credentials:
    """Wat een publisher nodig heeft (voldoet aan publishers.base.ConnectedAccount)."""

    platform: str
    external_account_id: str
    access_token: str


def is_expired(account: SocialAccount) -> bool:
    return account.expires_at is not None and account.expires_at <= utcnow()


def to_out(account: SocialAccount) -> ConnectionOut:
    return ConnectionOut(
        platform=account.platform,
        display_name=account.display_name,
        avatar_url=account.avatar_url,
        expires_at=account.expires_at,
        expired=is_expired(account),
        connected_at=account.updated_at,
    )


def get_account(db: Session, brand_id: int, platform: str) -> SocialAccount | None:
    return db.scalar(select(SocialAccount).where(SocialAccount.brand_id == brand_id, SocialAccount.platform == platform))


def save_account(db: Session, brand: Brand, platform: str, tokens: TokenSet, profile: Profile, settings: Settings) -> SocialAccount:
    """Nieuwe koppeling, of de bestaande bijwerken (opnieuw koppelen na verlopen)."""
    account = get_account(db, brand.id, platform) or SocialAccount(brand_id=brand.id, platform=platform)
    account.external_account_id = profile.external_account_id
    account.display_name = profile.display_name
    account.avatar_url = profile.avatar_url
    account.access_token_encrypted = crypto.encrypt(tokens.access_token, settings)
    account.refresh_token_encrypted = crypto.encrypt(tokens.refresh_token, settings) if tokens.refresh_token else None
    account.expires_at = tokens.expires_at
    account.scopes = tokens.scopes
    account.updated_at = utcnow()
    db.add(account)
    db.commit()
    return account


def credentials(account: SocialAccount, settings: Settings) -> Credentials:
    return Credentials(
        platform=account.platform,
        external_account_id=account.external_account_id,
        access_token=crypto.decrypt(account.access_token_encrypted, settings),
    )
