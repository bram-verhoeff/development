"""Welke OAuth-koppeling hoort bij welk platform."""

from app.config import Settings
from app.services.social.base import OAuthProvider, SocialError
from app.models import Platform
from app.services.social.linkedin import LinkedInOAuth, LinkedInPagesOAuth
from app.services.social.meta import FacebookOAuth, InstagramOAuth
from app.services.social.tiktok import TikTokOAuth
from app.services.social.x import XOAuth

# Koppeling voor LinkedIn-bedrijfspagina's: geen eigen platform voor posts, wel een eigen koppeling
LINKEDIN_PAGES = "linkedin_pages"

_PROVIDERS = {
    "linkedin": LinkedInOAuth,
    LINKEDIN_PAGES: LinkedInPagesOAuth,
    "x": XOAuth,
    "facebook": FacebookOAuth,
    "instagram": InstagramOAuth,
    "tiktok": TikTokOAuth,
}

# Platforms waarvoor koppelen gebouwd is
SUPPORTED = tuple(_PROVIDERS)
# Alle soorten koppelingen in de volgorde waarin de app ze toont
CONNECTION_KINDS = (Platform.LINKEDIN.value, LINKEDIN_PAGES, *(p.value for p in Platform if p != Platform.LINKEDIN))


def get_oauth_provider(platform: str, settings: Settings) -> OAuthProvider:
    try:
        return _PROVIDERS[platform](settings)
    except KeyError:
        raise SocialError("platform_not_supported", status=404)
