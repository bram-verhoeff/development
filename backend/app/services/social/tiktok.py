"""TikTok: Login Kit (OAuth 2.0). Toegangstokens gelden 24 uur, refresh-tokens 365 dagen.

Documentatie: developers.tiktok.com/doc/login-kit-web en /doc/oauth-user-access-token-management
Let op: TikTok accepteert alleen video's en foto's; zonder audit worden posts bovendien privé geplaatst.
"""

from urllib.parse import urlencode

import httpx

from app.config import Settings
from app.services.social.base import Connected, OAuthProvider, Profile, TokenSet, expires_in

AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/"
TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/"
USER_INFO_URL = "https://open.tiktokapis.com/v2/user/info/"
SCOPES = "user.info.basic,video.publish"


class TikTokOAuth(OAuthProvider):
    platform = "tiktok"

    def __init__(self, settings: Settings, http: httpx.Client | None = None):
        super().__init__(http)
        self.client_key = settings.tiktok_client_key
        self.client_secret = settings.tiktok_client_secret

    @property
    def configured(self) -> bool:
        return bool(self.client_key and self.client_secret)

    def authorization_url(self, state, redirect_uri, code_challenge=None):
        query = urlencode(
            {"client_key": self.client_key, "response_type": "code", "scope": SCOPES, "redirect_uri": redirect_uri, "state": state}
        )
        return f"{AUTHORIZE_URL}?{query}"

    def _tokens(self, data: dict) -> TokenSet:
        return TokenSet(
            access_token=data["access_token"],
            expires_at=expires_in(data.get("expires_in")),
            refresh_token=data.get("refresh_token"),
            scopes=data.get("scope", ""),
        )

    def complete(self, code, redirect_uri, code_verifier=None):
        data = self._request(
            "POST",
            TOKEN_URL,
            data={
                "client_key": self.client_key,
                "client_secret": self.client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            },
        )
        tokens = self._tokens(data)
        user = self._request(
            "GET",
            USER_INFO_URL,
            params={"fields": "open_id,display_name,avatar_url"},
            headers={"Authorization": f"Bearer {tokens.access_token}"},
        )["data"]["user"]
        return Connected(tokens, Profile(external_account_id=user.get("open_id") or data["open_id"], display_name=user.get("display_name", ""), avatar_url=user.get("avatar_url")))

    def refresh(self, tokens):
        if not tokens.refresh_token:
            return None
        data = self._request(
            "POST",
            TOKEN_URL,
            error="connection_expired",
            data={
                "client_key": self.client_key,
                "client_secret": self.client_secret,
                "grant_type": "refresh_token",
                "refresh_token": tokens.refresh_token,
            },
        )
        return self._tokens(data)
