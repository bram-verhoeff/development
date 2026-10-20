"""Meta: een Facebook-pagina (Facebook Login) en een Instagram professioneel account (Instagram Login).

Documentatie: developers.facebook.com/docs/pages-api/posts en
developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
"""

from urllib.parse import urlencode

import httpx

from app.config import Settings
from app.services.social.base import Connected, OAuthProvider, Profile, SocialError, TokenSet, expires_in


def graph_url(version: str) -> str:
    return f"https://graph.facebook.com/{version}"


class FacebookOAuth(OAuthProvider):
    """Koppelt een Facebook-pagina. Het opgeslagen token is het pagina-token (verloopt niet)."""

    platform = "facebook"
    SCOPES = "pages_show_list,pages_manage_posts,pages_read_engagement"

    def __init__(self, settings: Settings, http: httpx.Client | None = None):
        super().__init__(http)
        self.app_id = settings.meta_app_id
        self.app_secret = settings.meta_app_secret
        self.version = settings.meta_graph_version

    @property
    def configured(self) -> bool:
        return bool(self.app_id and self.app_secret)

    def authorization_url(self, state, redirect_uri, code_challenge=None):
        query = urlencode({"client_id": self.app_id, "redirect_uri": redirect_uri, "state": state, "scope": self.SCOPES, "response_type": "code"})
        return f"https://www.facebook.com/{self.version}/dialog/oauth?{query}"

    def complete(self, code, redirect_uri, code_verifier=None):
        base = graph_url(self.version)
        short = self._request(
            "GET",
            f"{base}/oauth/access_token",
            params={"client_id": self.app_id, "client_secret": self.app_secret, "redirect_uri": redirect_uri, "code": code},
        )
        # Langlevend gebruikerstoken, zodat het daarvan afgeleide pagina-token niet verloopt
        long = self._request(
            "GET",
            f"{base}/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": self.app_id,
                "client_secret": self.app_secret,
                "fb_exchange_token": short["access_token"],
            },
        )
        pages = self._request(
            "GET", f"{base}/me/accounts", params={"fields": "id,name,access_token,picture{url}", "access_token": long["access_token"]}
        ).get("data", [])
        if not pages:
            raise SocialError("no_facebook_page")
        # Heb je meerdere pagina's, dan koppelen we de eerste (PostPilot koppelt per merk één pagina)
        page = pages[0]
        tokens = TokenSet(access_token=page["access_token"], expires_at=None, scopes=self.SCOPES)
        avatar = ((page.get("picture") or {}).get("data") or {}).get("url")
        return Connected(tokens, Profile(external_account_id=page["id"], display_name=page.get("name", ""), avatar_url=avatar))


class InstagramOAuth(OAuthProvider):
    """Koppelt een Instagram professioneel account via Instagram Login (geen Facebook-pagina nodig)."""

    platform = "instagram"
    SCOPES = "instagram_business_basic,instagram_business_content_publish"

    def __init__(self, settings: Settings, http: httpx.Client | None = None):
        super().__init__(http)
        self.app_id = settings.instagram_app_id
        self.app_secret = settings.instagram_app_secret
        self.version = settings.meta_graph_version

    @property
    def configured(self) -> bool:
        return bool(self.app_id and self.app_secret)

    def authorization_url(self, state, redirect_uri, code_challenge=None):
        query = urlencode({"client_id": self.app_id, "redirect_uri": redirect_uri, "response_type": "code", "scope": self.SCOPES, "state": state})
        return f"https://www.instagram.com/oauth/authorize?{query}"

    def complete(self, code, redirect_uri, code_verifier=None):
        short = self._request(
            "POST",
            "https://api.instagram.com/oauth/access_token",
            data={
                "client_id": self.app_id,
                "client_secret": self.app_secret,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
                "code": code.removesuffix("#_"),
            },
        )
        short = (short.get("data") or [short])[0]
        long = self._request(
            "GET",
            "https://graph.instagram.com/access_token",
            params={"grant_type": "ig_exchange_token", "client_secret": self.app_secret, "access_token": short["access_token"]},
        )
        tokens = TokenSet(access_token=long["access_token"], expires_at=expires_in(long.get("expires_in")), scopes=self.SCOPES)
        me = self._request(
            "GET",
            f"https://graph.instagram.com/{self.version}/me",
            params={"fields": "user_id,username,profile_picture_url", "access_token": tokens.access_token},
        )
        account_id = str(me.get("user_id") or short.get("user_id"))
        return Connected(tokens, Profile(external_account_id=account_id, display_name=f"@{me.get('username', '')}", avatar_url=me.get("profile_picture_url")))

    def refresh(self, tokens):
        # Instagram ververst met het (nog geldige) toegangstoken zelf
        data = self._request(
            "GET",
            "https://graph.instagram.com/refresh_access_token",
            error="connection_expired",
            params={"grant_type": "ig_refresh_token", "access_token": tokens.access_token},
        )
        return TokenSet(access_token=data["access_token"], expires_at=expires_in(data.get("expires_in")), scopes=tokens.scopes)
