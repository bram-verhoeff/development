"""Social-media-accounts koppelen aan een merk (OAuth 2.0) en weer ontkoppelen."""

import logging
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.auth import CurrentUser, get_current_user
from app.config import Settings, get_settings
from app.database import get_db
from app.models import Brand, Platform
from app.routers.brands import get_owned_brand
from app.schemas import AvailablePlatformOut, ConnectionsOut, ConnectStartOut
from app.services import connections as connection_service
from app.services import crypto
from app.services.social.base import SocialError
from app.services.social.registry import SUPPORTED, get_oauth_provider

logger = logging.getLogger(__name__)
router = APIRouter(tags=["connections"])

# Foutcodes van het platform als je zelf op "annuleren" klikt
CANCELLED = {"user_cancelled_login", "user_cancelled_authorize", "access_denied"}


def _redirect_uri(platform: str, settings: Settings) -> str:
    return f"{settings.backend_public_url.rstrip('/')}/connections/{platform}/callback"


def _back_to_app(settings: Settings, brand_id: int | None, **params: str) -> RedirectResponse:
    path = f"/brands/{brand_id}" if brand_id else "/brands"
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
        for p in Platform
    ]
    return ConnectionsOut(platforms=platforms, connections=[connection_service.to_out(a) for a in brand.social_accounts])


@router.post("/brands/{brand_id}/connections/{platform}/start", response_model=ConnectStartOut)
def start_connection(
    brand_id: int,
    platform: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Geeft de inlog-URL van het platform; de frontend stuurt de browser daarheen."""
    brand = get_owned_brand(brand_id, db, user)
    provider = get_oauth_provider(platform, settings)
    if not provider.configured:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "platform_not_configured")
    state = crypto.sign_state({"uid": str(user.id), "bid": brand.id, "p": platform}, settings)
    return ConnectStartOut(authorization_url=provider.authorization_url(state, _redirect_uri(platform, settings)))


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

    if error or not code:
        return _back_to_app(settings, brand_id, connectError="connect_denied" if error in CANCELLED else "connect_failed")

    try:
        provider = get_oauth_provider(platform, settings)
        tokens = provider.exchange_code(code, _redirect_uri(platform, settings))
        profile = provider.fetch_profile(tokens.access_token)
        connection_service.save_account(db, brand, platform, tokens, profile, settings)
    except SocialError as e:
        return _back_to_app(settings, brand_id, connectError=e.code)
    except crypto.CryptoError:
        logger.error("APP_SECRET_KEY ontbreekt of is ongeldig; koppeling niet opgeslagen")
        return _back_to_app(settings, brand_id, connectError="secret_not_configured")

    return _back_to_app(settings, brand_id, connected=platform)


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
