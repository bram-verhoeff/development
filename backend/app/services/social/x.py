"""X (Twitter): OAuth 2.0 met PKCE. Toegangstokens gelden 2 uur en worden ververst via offline.access.

Documentatie: docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code
"""

from urllib.parse import urlencode

import httpx

from app.config import Settings
from app.services.social.base import Connected, OAuthProvider, Profile, SocialError, TokenSet, expires_in

AUTHORIZE_URL = "https://x.com/i/oauth2/authorize"
TOKEN_URL = "https://api.x.com/2/oauth2/token"
ME_URL = "https://api.x.com/2/users/me"
TWEETS_URL = "https://api.x.com/2/tweets"
SCOPES = "tweet.read tweet.write users.read offline.access"


class XOAuth(OAuthProvider):
    platform = "x"
    uses_pkce = True

    def __init__(self, settings: Settings, http: httpx.Client | None = None):
        super().__init__(http)
        self.client_id = settings.x_client_id
        self.client_secret = settings.x_client_secret

    @property
    def configured(self) -> bool:
        return bool(self.client_id and self.client_secret)

    def _auth(self) -> httpx.BasicAuth:
        # "Confidential client": client-ID en geheim als Basic-authenticatie
        return httpx.BasicAuth(self.client_id, self.client_secret)

    def authorization_url(self, state, redirect_uri, code_challenge=None):
        query = urlencode(
            {
                "response_type": "code",
                "client_id": self.client_id,
                "redirect_uri": redirect_uri,
                "scope": SCOPES,
                "state": state,
                "code_challenge": code_challenge,
                "code_challenge_method": "S256",
            }
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
        if not code_verifier:
            raise SocialError("connect_state_invalid")
        data = self._request(
            "POST",
            TOKEN_URL,
            auth=self._auth(),
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "code_verifier": code_verifier,
                "client_id": self.client_id,
            },
        )
        tokens = self._tokens(data)
        me = self._request(
            "GET", ME_URL, params={"user.fields": "profile_image_url"}, headers={"Authorization": f"Bearer {tokens.access_token}"}
        )["data"]
        return Connected(tokens, Profile(external_account_id=me["id"], display_name=f"{me.get('name', '')} (@{me.get('username', '')})", avatar_url=me.get("profile_image_url")))

    def refresh(self, tokens):
        if not tokens.refresh_token:
            return None
        data = self._request(
            "POST",
            TOKEN_URL,
            error="connection_expired",
            auth=self._auth(),
            data={"grant_type": "refresh_token", "refresh_token": tokens.refresh_token, "client_id": self.client_id},
        )
        return self._tokens(data)
