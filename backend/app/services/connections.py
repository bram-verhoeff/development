"""Gekoppelde accounts: opslaan (versleuteld), ophalen, tokens verversen en omzetten naar API-vorm."""

from dataclasses import dataclass
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import Settings
from app.database import utcnow
from app.models import Brand, Platform, Post, SocialAccount, SocialPage
from app.schemas import ConnectionOut, PageOut
from app.services import crypto
from app.services.social.base import Connected, SocialError, TokenSet
from app.services.social.registry import LINKEDIN_PAGES, get_oauth_provider

# Ruim op tijd verversen, zodat een token niet halverwege een aanroep verloopt.
# Instagram ververst met het toegangstoken zelf; dat moet dus ruim vóór het verloopt.
REFRESH_MARGIN = timedelta(minutes=5)
REFRESH_MARGIN_PER_PLATFORM = {"instagram": timedelta(days=7)}


@dataclass(frozen=True)
class Credentials:
    """Wat een publisher nodig heeft (voldoet aan publishers.base.ConnectedAccount)."""

    platform: str
    external_account_id: str
    access_token: str


def is_expired(account: SocialAccount) -> bool:
    """Echt verlopen: tijd voorbij én geen refresh-token om automatisch te verversen."""
    if account.expires_at is None or account.expires_at > utcnow():
        return False
    return account.refresh_token_encrypted is None


def to_out(account: SocialAccount) -> ConnectionOut:
    # Bij verversbare tokens (X, TikTok) is de vervaldatum van het toegangstoken niet interessant
    refreshable = account.refresh_token_encrypted is not None
    return ConnectionOut(
        platform=account.platform,
        display_name=account.display_name,
        avatar_url=account.avatar_url,
        expires_at=None if refreshable else account.expires_at,
        expired=is_expired(account),
        connected_at=account.updated_at,
        pages=[PageOut(id=p.external_id, name=p.name, avatar_url=p.avatar_url, is_default=p.is_default) for p in account.pages],
    )


def get_account(db: Session, brand_id: int, platform: str) -> SocialAccount | None:
    return db.scalar(select(SocialAccount).where(SocialAccount.brand_id == brand_id, SocialAccount.platform == platform))


def _store_tokens(account: SocialAccount, tokens: TokenSet, settings: Settings) -> None:
    account.access_token_encrypted = crypto.encrypt(tokens.access_token, settings)
    if tokens.refresh_token:
        account.refresh_token_encrypted = crypto.encrypt(tokens.refresh_token, settings)
    account.expires_at = tokens.expires_at
    account.scopes = tokens.scopes or account.scopes


def save_account(db: Session, brand: Brand, platform: str, connected: Connected, settings: Settings) -> SocialAccount:
    """Nieuwe koppeling, of de bestaande bijwerken (opnieuw koppelen na verlopen)."""
    account = get_account(db, brand.id, platform) or SocialAccount(brand_id=brand.id, platform=platform)
    profile = connected.profile
    account.external_account_id = profile.external_account_id
    account.display_name = profile.display_name
    account.avatar_url = profile.avatar_url
    account.refresh_token_encrypted = None  # wordt hieronder gezet als het platform er een gaf
    _store_tokens(account, connected.tokens, settings)
    _store_pages(account, connected)
    account.updated_at = utcnow()
    db.add(account)
    db.commit()
    return account


def _store_pages(account: SocialAccount, connected: Connected) -> None:
    """Werkt de pagina's bij; de standaardpagina blijft staan als je hem nog steeds beheert."""
    existing = {p.external_id: p for p in account.pages}
    pages = []
    for page in connected.pages:
        row = existing.get(page.external_id) or SocialPage(external_id=page.external_id)
        row.name, row.avatar_url = page.name, page.avatar_url
        pages.append(row)
    account.pages = pages


def default_page(brand: Brand) -> SocialPage | None:
    """Standaardpagina voor nieuwe LinkedIn-posts van dit merk, of None (eigen profiel)."""
    pages = next((a.pages for a in brand.social_accounts if a.platform == LINKEDIN_PAGES), [])
    return next((p for p in pages if p.is_default), None)


def set_default_page(account: SocialAccount, page_id: str | None) -> None:
    if page_id is not None and page_id not in {p.external_id for p in account.pages}:
        raise SocialError("page_not_available", status=404)
    for page in account.pages:
        page.is_default = page.external_id == page_id


def account_for(db: Session, post: Post) -> SocialAccount | None:
    """De koppeling waarmee deze post geplaatst wordt: je profiel, of bij een bedrijfspagina de pagina-koppeling."""
    if post.platform == Platform.LINKEDIN and post.publish_as:
        return get_account(db, post.brand_id, LINKEDIN_PAGES)
    return get_account(db, post.brand_id, post.platform)


def fresh_credentials(db: Session, account: SocialAccount, settings: Settings, page_id: str | None = None) -> Credentials:
    """Geeft geldige inloggegevens; ververst het token eerst als dat (bijna) verlopen is.

    `page_id`: posten als die pagina van het account (LinkedIn-bedrijfspagina) in plaats van als het account zelf.
    """
    if page_id is not None and page_id not in {p.external_id for p in account.pages}:
        # Pagina niet meer gekoppeld (bijv. geen beheerder meer); nooit stilletjes naar je eigen profiel
        raise SocialError("page_not_available", status=409)
    margin = REFRESH_MARGIN_PER_PLATFORM.get(account.platform, REFRESH_MARGIN)
    if account.expires_at is not None and account.expires_at <= utcnow() + margin:
        current = TokenSet(
            access_token=crypto.decrypt(account.access_token_encrypted, settings),
            expires_at=account.expires_at,
            refresh_token=crypto.decrypt(account.refresh_token_encrypted, settings) if account.refresh_token_encrypted else None,
            scopes=account.scopes,
        )
        new = get_oauth_provider(account.platform, settings).refresh(current)
        if new is None:
            if account.expires_at <= utcnow():
                raise SocialError("connection_expired", status=409)
        else:
            _store_tokens(account, new, settings)
            db.commit()

    return Credentials(
        platform=account.platform,
        external_account_id=page_id or account.external_account_id,
        access_token=crypto.decrypt(account.access_token_encrypted, settings),
    )
