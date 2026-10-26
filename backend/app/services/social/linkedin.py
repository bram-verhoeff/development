"""LinkedIn: koppelen via OAuth 2.0 en tekst in "little"-formaat.

Twee koppelingen, elk met een eigen LinkedIn-app:
- `linkedin`: je eigen profiel (Sign In with LinkedIn + Share on LinkedIn).
- `linkedin_pages`: de bedrijfspagina's die je beheert (Community Management API; die moet in een
  app zonder andere producten zitten, vandaar de tweede app).

Documentatie: learn.microsoft.com/linkedin (authentication, sign-in-with-linkedin-v2, posts-api,
little-text-format, organization-access-control-by-role, organization-lookup-api).
"""

import re
from urllib.parse import urlencode

import httpx

from app.config import Settings
from app.services.social.base import Connected, OAuthProvider, Page, Profile, SocialError, TokenSet, expires_in

AUTHORIZE_URL = "https://www.linkedin.com/oauth/v2/authorization"
TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
USERINFO_URL = "https://api.linkedin.com/v2/userinfo"
POSTS_URL = "https://api.linkedin.com/rest/posts"
ORGANIZATION_ACLS_URL = "https://api.linkedin.com/rest/organizationAcls"
ORGANIZATIONS_URL = "https://api.linkedin.com/rest/organizations"
# openid + profile: wie ben je (naam, foto, id); w_member_social: posten namens jou
SCOPES = "openid profile w_member_social"
# rw_organization_admin: welke pagina's je beheert en hoe ze heten; w_organization_social: posten als pagina
PAGES_SCOPES = "rw_organization_admin w_organization_social"
# Rollen waarmee je als pagina mag posten
POSTING_ROLES = {"ADMINISTRATOR", "CONTENT_ADMINISTRATOR"}


class LinkedInOAuth(OAuthProvider):
    platform = "linkedin"
    scopes = SCOPES

    def __init__(self, settings: Settings, http: httpx.Client | None = None):
        super().__init__(http)
        self.client_id = settings.linkedin_client_id
        self.client_secret = settings.linkedin_client_secret
        self.api_version = settings.linkedin_api_version

    @property
    def configured(self) -> bool:
        return bool(self.client_id and self.client_secret)

    def authorization_url(self, state, redirect_uri, code_challenge=None):
        query = urlencode(
            {"response_type": "code", "client_id": self.client_id, "redirect_uri": redirect_uri, "state": state, "scope": self.scopes}
        )
        return f"{AUTHORIZE_URL}?{query}"

    def complete(self, code, redirect_uri, code_verifier=None):
        tokens = self._exchange({"grant_type": "authorization_code", "code": code, "redirect_uri": redirect_uri})
        me = self._request("GET", USERINFO_URL, headers={"Authorization": f"Bearer {tokens.access_token}"})
        return Connected(tokens, Profile(external_account_id=me["sub"], display_name=me.get("name", ""), avatar_url=me.get("picture")))

    def refresh(self, tokens):
        # Alleen goedgekeurde partners (zoals de Community Management API) krijgen refresh-tokens
        if not tokens.refresh_token:
            return None
        new = self._exchange({"grant_type": "refresh_token", "refresh_token": tokens.refresh_token}, error="connection_expired")
        # LinkedIn geeft niet altijd een nieuw refresh-token terug; dan blijft het oude geldig
        return new if new.refresh_token else TokenSet(new.access_token, new.expires_at, tokens.refresh_token, new.scopes or tokens.scopes)

    def _exchange(self, data: dict, error: str = "connect_failed") -> TokenSet:
        data = self._request("POST", TOKEN_URL, error, data=data | {"client_id": self.client_id, "client_secret": self.client_secret})
        return TokenSet(
            access_token=data["access_token"],
            expires_at=expires_in(data.get("expires_in")),
            refresh_token=data.get("refresh_token"),
            scopes=data.get("scope", ""),
        )

    def _rest_headers(self, access_token: str) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {access_token}",
            "LinkedIn-Version": self.api_version,
            "X-Restli-Protocol-Version": "2.0.0",
        }


class LinkedInPagesOAuth(LinkedInOAuth):
    """Koppelt de bedrijfspagina's die je beheert; welke je per post gebruikt, kies je in PostPilot."""

    platform = "linkedin_pages"
    scopes = PAGES_SCOPES

    def __init__(self, settings: Settings, http: httpx.Client | None = None):
        super().__init__(settings, http)
        self.client_id = settings.linkedin_pages_client_id
        self.client_secret = settings.linkedin_pages_client_secret

    def complete(self, code, redirect_uri, code_verifier=None):
        tokens = self._exchange({"grant_type": "authorization_code", "code": code, "redirect_uri": redirect_uri})
        headers = self._rest_headers(tokens.access_token)

        acls = self._request(
            "GET", ORGANIZATION_ACLS_URL, headers=headers, params={"q": "roleAssignee", "state": "APPROVED", "count": 100}
        ).get("elements", [])
        org_ids = list(
            dict.fromkeys(
                (acl.get("organization") or acl.get("organizationTarget") or "").rsplit(":", 1)[-1]
                for acl in acls
                if acl.get("role") in POSTING_ROLES
            )
        )
        org_ids = [i for i in org_ids if i]
        if not org_ids:
            raise SocialError("no_linkedin_page")

        # Eén voor één ophalen: in de Development-tier mag een batch-aanroep niet
        pages = tuple(Page(external_id=org_id, name=self._organization_name(org_id, headers)) for org_id in org_ids)
        member = (acls[0].get("roleAssignee") or "").rsplit(":", 1)[-1]
        profile = Profile(external_account_id=member or org_ids[0], display_name=", ".join(p.name for p in pages)[:300])
        return Connected(tokens, profile, pages)

    def _organization_name(self, org_id: str, headers: dict[str, str]) -> str:
        try:
            return self._request("GET", f"{ORGANIZATIONS_URL}/{org_id}", headers=headers).get("localizedName") or f"Pagina {org_id}"
        except SocialError:
            # Naam niet op te halen (bijv. alleen contentbeheerder): de pagina blijft bruikbaar
            return f"Pagina {org_id}"


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
