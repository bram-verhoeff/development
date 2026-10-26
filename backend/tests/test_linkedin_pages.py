"""LinkedIn-bedrijfspagina's: koppelen (nagebootste API), standaardpagina, "plaatsen als" en publiceren als pagina."""

import json
from datetime import UTC, datetime, timedelta
from urllib.parse import parse_qs, urlparse

import httpx
import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Brand, Platform, Post, SocialPage
from app.publishers import registry as publisher_registry
from app.publishers.base import PublishResult
from app.publishers.linkedin import LinkedInPublisher
from app.routers import connections as connections_router
from app.services.social.base import Connected, Page, Profile, SocialError, TokenSet
from app.services.social.linkedin import LinkedInPagesOAuth
from tests.test_brands import BRAND


@pytest.fixture
def owner(auth_headers):
    return auth_headers()


@pytest.fixture
def brand(client, owner):
    return client.post("/brands", json=BRAND, headers=owner).json()


@pytest.fixture
def pages_settings(settings):
    settings.linkedin_pages_client_id = "lp-client"
    settings.linkedin_pages_client_secret = "lp-secret"
    return settings


def mock(handler) -> httpx.Client:
    return httpx.Client(transport=httpx.MockTransport(handler))


# ---------- OAuth met de nagebootste LinkedIn-API ----------


def test_pages_authorization_url_uses_the_second_app(pages_settings):
    url = LinkedInPagesOAuth(pages_settings).authorization_url("st", "https://api.test/connections/linkedin_pages/callback")
    query = parse_qs(urlparse(url).query)
    assert query["client_id"] == ["lp-client"]
    assert set(query["scope"][0].split()) == {"rw_organization_admin", "w_organization_social"}


def test_pages_complete_lists_pages_you_can_post_on(pages_settings):
    def handler(request: httpx.Request):
        if request.url.path == "/oauth/v2/accessToken":
            assert parse_qs(request.content.decode())["client_id"] == ["lp-client"]
            return httpx.Response(200, json={"access_token": "AT", "expires_in": 5184000, "refresh_token": "RT", "scope": "w_organization_social"})
        assert request.headers["Authorization"] == "Bearer AT" and request.headers["X-Restli-Protocol-Version"] == "2.0.0"
        if request.url.path == "/rest/organizationAcls":
            assert request.url.params["q"] == "roleAssignee" and request.url.params["state"] == "APPROVED"
            return httpx.Response(200, json={"elements": [
                {"role": "ADMINISTRATOR", "organization": "urn:li:organization:111", "roleAssignee": "urn:li:person:me", "state": "APPROVED"},
                {"role": "ANALYST", "organization": "urn:li:organization:222", "roleAssignee": "urn:li:person:me", "state": "APPROVED"},
                {"role": "CONTENT_ADMINISTRATOR", "organizationTarget": "urn:li:organization:333", "roleAssignee": "urn:li:person:me", "state": "APPROVED"},
            ]})
        if request.url.path == "/rest/organizations/111":
            return httpx.Response(200, json={"id": 111, "localizedName": "Agevo"})
        if request.url.path == "/rest/organizations/333":
            return httpx.Response(403, json={"message": "no admin"})
        raise AssertionError(request.url)

    connected = LinkedInPagesOAuth(pages_settings, mock(handler)).complete("code", "https://api.test/cb")
    assert connected.tokens.refresh_token == "RT"
    # Analist mag niet posten; naam die niet op te halen is, krijgt een nette vervanging
    assert connected.pages == (Page("111", "Agevo"), Page("333", "Pagina 333"))
    assert connected.profile.external_account_id == "me"


def test_pages_complete_without_pages(pages_settings):
    def handler(request: httpx.Request):
        if request.url.path == "/oauth/v2/accessToken":
            return httpx.Response(200, json={"access_token": "AT", "expires_in": 60})
        return httpx.Response(200, json={"elements": [{"role": "ANALYST", "organization": "urn:li:organization:9"}]})

    with pytest.raises(SocialError) as exc:
        LinkedInPagesOAuth(pages_settings, mock(handler)).complete("code", "https://api.test/cb")
    assert exc.value.code == "no_linkedin_page"


def test_linkedin_refresh_keeps_the_old_refresh_token(pages_settings):
    def handler(request: httpx.Request):
        body = parse_qs(request.content.decode())
        assert body["grant_type"] == ["refresh_token"] and body["refresh_token"] == ["RT"]
        return httpx.Response(200, json={"access_token": "AT2", "expires_in": 5184000})

    provider = LinkedInPagesOAuth(pages_settings, mock(handler))
    new = provider.refresh(TokenSet("AT", datetime.now(UTC), "RT", "s"))
    assert new.access_token == "AT2" and new.refresh_token == "RT"
    assert provider.refresh(TokenSet("AT", datetime.now(UTC))) is None  # zonder refresh-token kan het niet


def test_publisher_posts_as_organization(settings):
    def handler(request: httpx.Request):
        assert json.loads(request.content)["author"] == "urn:li:organization:111"
        return httpx.Response(201, headers={"x-restli-id": "urn:li:share:9"})

    post = Post(platform="linkedin", hook="Hook", body="Tekst", hashtags=[], brand=Brand(name="M", avoid_terms=[]))
    account = type("A", (), {"platform": "linkedin_pages", "external_account_id": "111", "access_token": "AT"})()
    result = LinkedInPublisher(settings, mock(handler)).publish(post, account)
    assert result.success and result.external_id == "urn:li:share:9"


# ---------- in de app: koppelen, standaardpagina, plaatsen als ----------


class FakeProvider:
    configured = True
    uses_pkce = False

    def __init__(self, platform: str):
        self.platform = platform
        self.pages = (Page("111", "Agevo"), Page("222", "StudyElite"))

    def authorization_url(self, state, redirect_uri, code_challenge=None):
        return f"https://linkedin.test/auth?state={state}"

    def complete(self, code, redirect_uri, code_verifier=None):
        tokens = TokenSet(access_token=f"{self.platform}-token", expires_at=datetime.now(UTC) + timedelta(days=60))
        if self.platform == "linkedin_pages":
            return Connected(tokens, Profile("me", "Agevo, StudyElite"), self.pages)
        return Connected(tokens, Profile("person1", "Bram V"))


@pytest.fixture
def providers(monkeypatch):
    fakes = {"linkedin": FakeProvider("linkedin"), "linkedin_pages": FakeProvider("linkedin_pages")}
    real = connections_router.get_oauth_provider
    monkeypatch.setattr(
        connections_router, "get_oauth_provider", lambda platform, settings: fakes.get(platform) or real(platform, settings)
    )
    return fakes


def connect(client, owner, brand_id, kind):
    url = client.post(f"/brands/{brand_id}/connections/{kind}/start", headers=owner).json()["authorization_url"]
    state = parse_qs(urlparse(url).query)["state"][0]
    response = client.get(f"/connections/{kind}/callback", params={"state": state, "code": "c"}, follow_redirects=False)
    assert response.status_code == 303 and f"connected={kind}" in response.headers["location"]


class FakePublisher:
    platform = Platform.LINKEDIN

    def __init__(self):
        self.calls = []

    def publish(self, post, account):
        self.calls.append((account.platform, account.external_account_id, account.access_token))
        return PublishResult(success=True, external_id="urn:li:share:1")


def generate_linkedin(client, owner, brand_id) -> dict:
    return client.post(
        "/generate", json={"brand_id": brand_id, "platforms": ["linkedin"], "posts_per_platform": 1}, headers=owner
    ).json()["posts"][0]


def test_pages_connection_is_listed_with_its_pages(client, owner, brand, providers):
    data = client.get(f"/brands/{brand['id']}/connections", headers=owner).json()
    assert [p["platform"] for p in data["platforms"]][:2] == ["linkedin", "linkedin_pages"]

    connect(client, owner, brand["id"], "linkedin_pages")
    connection = client.get(f"/brands/{brand['id']}/connections", headers=owner).json()["connections"][0]
    assert connection["platform"] == "linkedin_pages"
    assert connection["pages"] == [
        {"id": "111", "name": "Agevo", "avatar_url": None, "is_default": False},
        {"id": "222", "name": "StudyElite", "avatar_url": None, "is_default": False},
    ]


def test_default_page_is_used_for_new_posts_and_survives_reconnect(client, owner, brand, providers, writer, engine):
    url = f"/brands/{brand['id']}/connections/linkedin_pages/default"
    assert client.put(url, json={"page_id": "111"}, headers=owner).json()["detail"] == "connection_not_found"

    connect(client, owner, brand["id"], "linkedin_pages")
    assert client.put(url, json={"page_id": "999"}, headers=owner).json()["detail"] == "page_not_available"
    pages = client.put(url, json={"page_id": "222"}, headers=owner).json()["pages"]
    assert [p["is_default"] for p in pages] == [False, True]

    assert generate_linkedin(client, owner, brand["id"])["publish_as"] == "222"

    # Opnieuw koppelen: standaard blijft; een pagina die je niet meer beheert verdwijnt
    providers["linkedin_pages"].pages = (Page("222", "StudyElite AI"), Page("333", "Nieuw"))
    connect(client, owner, brand["id"], "linkedin_pages")
    with Session(engine) as db:
        rows = db.scalars(select(SocialPage).order_by(SocialPage.external_id)).all()
        assert [(r.external_id, r.name, r.is_default) for r in rows] == [("222", "StudyElite AI", True), ("333", "Nieuw", False)]

    # Terug naar eigen profiel als standaard
    client.put(url, json={"page_id": None}, headers=owner)
    assert generate_linkedin(client, owner, brand["id"])["publish_as"] is None


def test_choose_publish_as_and_publish_as_page(client, owner, brand, providers, writer, monkeypatch):
    fake = FakePublisher()
    monkeypatch.setattr(publisher_registry, "_publishers", {Platform.LINKEDIN: fake})
    connect(client, owner, brand["id"], "linkedin")
    connect(client, owner, brand["id"], "linkedin_pages")
    post = generate_linkedin(client, owner, brand["id"])
    post_url = f"/posts/{post['id']}"

    detail = client.get(post_url, headers=owner).json()
    assert [(o["value"], o["label"], o["kind"]) for o in detail["publish_options"]] == [
        (None, "Bram V", "profile"), ("111", "Agevo", "page"), ("222", "StudyElite", "page")
    ]
    assert detail["publish_as_label"] == "Bram V" and detail["connection"]["platform"] == "linkedin"

    assert client.put(f"{post_url}/publish-as", json={"publish_as": "999"}, headers=owner).json()["detail"] == "page_not_available"
    detail = client.put(f"{post_url}/publish-as", json={"publish_as": "111"}, headers=owner).json()
    assert detail["publish_as"] == "111" and detail["publish_as_label"] == "Agevo"
    assert detail["connection"]["platform"] == "linkedin_pages"

    client.post(f"{post_url}/status", json={"status": "approved"}, headers=owner)
    assert client.post(f"{post_url}/publish", headers=owner).status_code == 200
    # Met het token van de pagina-koppeling, als pagina 111
    assert fake.calls == [("linkedin_pages", "111", "linkedin_pages-token")]
    assert client.put(f"{post_url}/publish-as", json={"publish_as": None}, headers=owner).json()["detail"] == "already_published"


def test_publish_as_page_you_no_longer_manage(client, owner, brand, providers, writer, monkeypatch, engine):
    fake = FakePublisher()
    monkeypatch.setattr(publisher_registry, "_publishers", {Platform.LINKEDIN: fake})
    connect(client, owner, brand["id"], "linkedin")
    connect(client, owner, brand["id"], "linkedin_pages")
    post = generate_linkedin(client, owner, brand["id"])
    client.put(f"/posts/{post['id']}/publish-as", json={"publish_as": "111"}, headers=owner)
    client.post(f"/posts/{post['id']}/status", json={"status": "approved"}, headers=owner)

    with Session(engine) as db:
        db.delete(db.scalars(select(SocialPage).where(SocialPage.external_id == "111")).one())
        db.commit()

    response = client.post(f"/posts/{post['id']}/publish", headers=owner)
    # Nooit stilletjes op je eigen profiel plaatsen
    assert response.status_code == 502 and response.json()["detail"] == "page_not_available"
    assert fake.calls == []


def test_publish_as_only_for_linkedin(client, owner, brand, providers, writer):
    post = client.post(
        "/generate", json={"brand_id": brand["id"], "platforms": ["x"], "posts_per_platform": 1}, headers=owner
    ).json()["posts"][0]
    response = client.put(f"/posts/{post['id']}/publish-as", json={"publish_as": "111"}, headers=owner)
    assert response.status_code == 422 and response.json()["detail"] == "publish_as_linkedin_only"
    assert client.get(f"/posts/{post['id']}", headers=owner).json()["publish_options"] == []
