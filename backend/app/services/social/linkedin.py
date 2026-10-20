"""LinkedIn: koppelen via OAuth 2.0 (Sign In with LinkedIn + Share on LinkedIn) en tekst in "little"-formaat.

Documentatie: learn.microsoft.com/linkedin (authentication, sign-in-with-linkedin-v2, posts-api, little-text-format).
"""

import re
from urllib.parse import urlencode

import httpx

from app.config import Settings
from app.services.social.base import Connected, OAuthProvider, Profile, TokenSet, expires_in

AUTHORIZE_URL = "https://www.linkedin.com/oauth/v2/authorization"
TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
USERINFO_URL = "https://api.linkedin.com/v2/userinfo"
POSTS_URL = "https://api.linkedin.com/rest/posts"
# openid + profile: wie ben je (naam, foto, id); w_member_social: posten namens jou
SCOPES = "openid profile w_member_social"


class LinkedInOAuth(OAuthProvider):
    platform = "linkedin"

    def __init__(self, settings: Settings, http: httpx.Client | None = None):
        super().__init__(http)
        self.client_id = settings.linkedin_client_id
        self.client_secret = settings.linkedin_client_secret

    @property
    def configured(self) -> bool:
        return bool(self.client_id and self.client_secret)

    def authorization_url(self, state, redirect_uri, code_challenge=None):
        query = urlencode(
            {"response_type": "code", "client_id": self.client_id, "redirect_uri": redirect_uri, "state": state, "scope": SCOPES}
        )
        return f"{AUTHORIZE_URL}?{query}"

    def complete(self, code, redirect_uri, code_verifier=None):
        data = self._request(
            "POST",
            TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "client_id": self.client_id,
                "client_secret": self.client_secret,
            },
        )
        tokens = TokenSet(
            access_token=data["access_token"],
            expires_at=expires_in(data.get("expires_in")),
            # Alleen goedgekeurde partners krijgen refresh-tokens; anders is dit leeg
            refresh_token=data.get("refresh_token"),
            scopes=data.get("scope", ""),
        )
        me = self._request("GET", USERINFO_URL, headers={"Authorization": f"Bearer {tokens.access_token}"})
        return Connected(tokens, Profile(external_account_id=me["sub"], display_name=me.get("name", ""), avatar_url=me.get("picture")))


# ---------- Tekst in LinkedIns "little"-formaat ----------

# Gereserveerde tekens moeten met een backslash ge-escaped worden, anders weigert of verminkt LinkedIn de tekst
_RESERVED = re.compile(r"([\\|{}@\[\]()<>#*_~])")
# Hashtags in de lopende tekst: # gevolgd door letters/cijfers/underscore (ook accenten)
_INLINE_HASHTAG = re.compile(r"(?<![\w&])#(\w+)")


def _escape(text: str) -> str:
    return _RESERVED.sub(r"\\\1", text)


def _hashtag(tag: str) -> str:
    return "{hashtag|\\#|" + _escape(tag.lstrip("#")) + "}"


def to_little_text(hook: str, body: str, hashtags: list[str]) -> str:
    """Hook, tekst en hashtags als LinkedIn-commentary: tekens ge-escaped, hashtags als echte hashtags."""

    def convert(text: str) -> str:
        parts, last = [], 0
        for match in _INLINE_HASHTAG.finditer(text):
            parts.append(_escape(text[last : match.start()]))
            parts.append(_hashtag(match.group(1)))
            last = match.end()
        parts.append(_escape(text[last:]))
        return "".join(parts)

    blocks = [convert(hook.strip()), convert(body.strip()), " ".join(_hashtag(t) for t in hashtags if t.strip("#"))]
    return "\n\n".join(b for b in blocks if b)
