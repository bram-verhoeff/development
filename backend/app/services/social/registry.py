"""Welke OAuth-koppeling hoort bij welk platform."""

from app.config import Settings
from app.services.social.base import OAuthProvider, SocialError
from app.services.social.linkedin import LinkedInOAuth
from app.services.social.meta import FacebookOAuth, InstagramOAuth
from app.services.social.tiktok import TikTokOAuth
from app.services.social.x import XOAuth

_PROVIDERS = {
    "linkedin": LinkedInOAuth,
    "x": XOAuth,
    "facebook": FacebookOAuth,
    "instagram": InstagramOAuth,
    "tiktok": TikTokOAuth,
}

# Platforms waarvoor koppelen gebouwd is
SUPPORTED = tuple(_PROVIDERS)


def get_oauth_provider(platform: str, settings: Settings) -> OAuthProvider:
    try:
        return _PROVIDERS[platform](settings)
    except KeyError:
        raise SocialError("platform_not_supported", status=404)
