"""Social-media-accounts koppelen aan een merk (OAuth 2.0) en weer ontkoppelen."""

import logging
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.auth import CurrentUser, get_current_user
from app.config import Settings, get_settings
from app.database import get_db
from app.models import Brand
from app.routers.brands import get_owned_brand
from app.schemas import AvailablePlatformOut, ConnectionOut, ConnectionsOut, ConnectStartOut, DefaultPageIn
from app.services import connections as connection_service
from app.services import crypto
from app.services.social.base import SocialError, new_pkce_pair
from app.services.social.registry import CONNECTION_KINDS, LINKEDIN_PAGES, SUPPORTED, get_oauth_provider

logger = logging.getLogger(__name__)
router = APIRouter(tags=["connections"])

# Foutcodes van het platform als je zelf op "annuleren" klikt
CANCELLED = {"user_cancelled_login", "user_cancelled_authorize", "access_denied"}


def _redirect_uri(platform: str, settings: Settings) -> str:
    return f"{settings.backend_public_url.rstrip('/')}/connections/{platform}/callback"


def _back_to_app(settings: Settings, brand_id: int | None, wizard: bool = False, **params: str) -> RedirectResponse:
    path = f"/brands/{brand_id}" if brand_id else "/brands"
    if wizard:
        params["wizard"] = "1"  # de frontend gaat dan door met het volgende platform
    return RedirectResponse(f"{settings.frontend_url.rstrip('/')}{path}?{urlencode(params)}", status_code=303)


@router.get("/brands/{brand_id}/connections", response_model=ConnectionsOut)
def list_connections(
    brand_id: int,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    brand = get_owned_brand(brand_id, db, user)
    platforms = [
        AvailablePlatformOut(
            platform=p,
            supported=p in SUPPORTED,
            configured=p in SUPPORTED and get_oauth_provider(p, settings).configured,
        )
        for p in CONNECTION_KINDS
    ]
    return ConnectionsOut(platforms=platforms, connections=[connection_service.to_out(a) for a in brand.social_accounts])


@router.post("/brands/{brand_id}/connections/{platform}/start", response_model=ConnectStartOut)
def start_connection(
    brand_id: int,
    platform: str,
    wizard: bool = False,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Geeft de inlog-URL van het platform; de frontend stuurt de browser daarheen.

    `wizard=true`: onderdeel van "Alles koppelen", na terugkomst gaat de frontend door naar het volgende platform.
    """
    brand = get_owned_brand(brand_id, db, user)
    provider = get_oauth_provider(platform, settings)
    if not provider.configured:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "platform_not_configured")

    data = {"uid": str(user.id), "bid": brand.id, "p": platform, "w": int(wizard)}
    challenge = None
    if provider.uses_pkce:
        # De verifier reist versleuteld mee in de state, zodat alleen onze backend hem kan lezen
        verifier, challenge = new_pkce_pair()
        data["cv"] = crypto.encrypt(verifier, settings)
    state = crypto.sign_state(data, settings)
    return ConnectStartOut(authorization_url=provider.authorization_url(state, _redirect_uri(platform, settings), challenge))


@router.get("/connections/{platform}/callback", include_in_schema=False)
def connection_callback(
    platform: str,
    state: str = "",
    code: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    """Hier stuurt het platform de browser naartoe. Geen login-token: de ondertekende state zegt wie het is."""
    try:
        data = crypto.verify_state(state, settings)
    except crypto.CryptoError:
        return _back_to_app(settings, None, connectError="connect_state_invalid")

    brand_id = data.get("bid")
    brand = db.get(Brand, brand_id)
    if data.get("p") != platform or brand is None or str(brand.user_id) != data.get("uid"):
        return _back_to_app(settings, None, connectError="connect_state_invalid")

    wizard = bool(data.get("w"))
    if error or not code:
        reason = "connect_denied" if error in CANCELLED else "connect_failed"
        return _back_to_app(settings, brand_id, wizard, connectError=reason, platform=platform)

    try:
        provider = get_oauth_provider(platform, settings)
        verifier = crypto.decrypt(data["cv"], settings) if data.get("cv") else None
        connected = provider.complete(code, _redirect_uri(platform, settings), verifier)
        connection_service.save_account(db, brand, platform, connected, settings)
    except SocialError as e:
        return _back_to_app(settings, brand_id, wizard, connectError=e.code, platform=platform)
    except crypto.CryptoError:
        logger.error("APP_SECRET_KEY ontbreekt of is ongeldig; koppeling niet opgeslagen")
        return _back_to_app(settings, brand_id, wizard, connectError="secret_not_configured", platform=platform)

    return _back_to_app(settings, brand_id, wizard, connected=platform)


@router.delete("/brands/{brand_id}/connections/{platform}", status_code=status.HTTP_204_NO_CONTENT)
def delete_connection(
    brand_id: int, platform: str, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)
):
    brand = get_owned_brand(brand_id, db, user)
    account = connection_service.get_account(db, brand.id, platform)
    if account is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "connection_not_found")
    db.delete(account)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/brands/{brand_id}/connections/linkedin_pages/default", response_model=ConnectionOut)
def set_default_page(
    brand_id: int, data: DefaultPageIn, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)
):
    """Op welke bedrijfspagina nieuwe LinkedIn-posts van dit merk standaard komen (None = eigen profiel)."""
    brand = get_owned_brand(brand_id, db, user)
    account = connection_service.get_account(db, brand.id, LINKEDIN_PAGES)
    if account is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "connection_not_found")
    try:
        connection_service.set_default_page(account, data.page_id)
    except SocialError as e:
        raise HTTPException(e.status, e.code)
    db.commit()
    return connection_service.to_out(account)
