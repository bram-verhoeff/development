"""Welke OAuth-koppeling hoort bij welk platform."""

from app.config import Settings
from app.services.social.base import OAuthProvider, SocialError
from app.services.social.linkedin import LinkedInOAuth

# Platforms waarvoor koppelen gebouwd is (de rest volgt later)
SUPPORTED = ("linkedin",)


def get_oauth_provider(platform: str, settings: Settings) -> OAuthProvider:
    if platform == "linkedin":
        return LinkedInOAuth(settings)
    raise SocialError("platform_not_supported", status=404)
