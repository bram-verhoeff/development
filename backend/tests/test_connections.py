"""Koppelen (OAuth), ontkoppelen en publiceren, met nagebootst LinkedIn."""

import json
from datetime import UTC, datetime, timedelta
from urllib.parse import parse_qs, urlparse

import httpx
import pytest
from sqlalchemy import select

from app.models import Brand, Platform, Post, SocialAccount
from app.publishers import registry as publisher_registry
from app.publishers.base import PublishResult
from app.publishers.linkedin import LinkedInPublisher
from app.routers import connections as connections_router
from app.services import crypto
from app.services.social.base import Profile, SocialError, TokenSet
from app.services.social.linkedin import LinkedInOAuth, to_little_text
from tests.test_brands import BRAND


@pytest.fixture
def owner(auth_headers):
    return auth_headers()


@pytest.fixture
def brand(client, owner):
    return client.post("/brands", json=BRAND, headers=owner).json()


class FakeProvider:
    platform = "linkedin"
    configured = True

    def __init__(self, fail: str | None = None):
        self.fail = fail
        self.exchanged: list[tuple[str, str]] = []

    def authorization_url(self, state, redirect_uri):
        return f"https://linkedin.test/auth?state={state}&redirect_uri={redirect_uri}"

    def exchange_code(self, code, redirect_uri):
        if self.fail:
            raise SocialError(self.fail)
        self.exchanged.append((code, redirect_uri))
        return TokenSet(access_token=f"token-{code}", expires_at=datetime.now(UTC) + timedelta(days=60), scopes="w_member_social")

    def fetch_profile(self, access_token):
        return Profile(external_account_id="abc123", display_name="Bram V", avatar_url="https://media.test/p.jpg")


@pytest.fixture
def provider(monkeypatch):
    fake = FakeProvider()
    monkeypatch.setattr(connections_router, "get_oauth_provider", lambda platform, settings: fake)
    return fake


def start_state(client, owner, brand_id) -> str:
    url = client.post(f"/brands/{brand_id}/connections/linkedin/start", headers=owner).json()["authorization_url"]
    return parse_qs(urlparse(url).query)["state"][0]


def callback(client, **params):
    return client.get("/connections/linkedin/callback", params=params, follow_redirects=False)


def connect(client, owner, brand_id, code="c0de"):
    return callback(client, state=start_state(client, owner, brand_id), code=code)


# ---------- versleuteling en state ----------


def test_encryption_roundtrip_and_wrong_key(settings):
    secret = crypto.encrypt("geheim-token", settings)
    assert "geheim-token" not in secret and crypto.decrypt(secret, settings) == "geheim-token"
    other = settings.model_copy(update={"app_secret_key": "ander-" + "y" * 40})
    with pytest.raises(crypto.CryptoError):
        crypto.decrypt(secret, other)


def test_state_is_signed_and_expires(settings, monkeypatch):
    state = crypto.sign_state({"bid": 1}, settings)
    assert crypto.verify_state(state, settings)["bid"] == 1

    # Aangepast, met een andere sleutel ondertekend, of verlopen: allemaal geweigerd
    with pytest.raises(crypto.CryptoError):
        crypto.verify_state(state[:-3] + "abc", settings)
    with pytest.raises(crypto.CryptoError):
        crypto.verify_state(crypto.sign_state({"bid": 1}, settings.model_copy(update={"app_secret_key": "z" * 40})), settings)
    monkeypatch.setattr(crypto.time, "time", lambda: 1_000_000_000)  # in 2001 ondertekend
    expired = crypto.sign_state({"bid": 1}, settings)
    monkeypatch.undo()
    with pytest.raises(crypto.CryptoError):
        crypto.verify_state(expired, settings)


def test_missing_secret_key(settings):
    with pytest.raises(crypto.CryptoError):
        crypto.encrypt("x", settings.model_copy(update={"app_secret_key": ""}))


# ---------- koppelen ----------


def test_list_platforms_and_configuration(client, owner, brand, settings):
    data = client.get(f"/brands/{brand['id']}/connections", headers=owner).json()
    platforms = {p["platform"]: p for p in data["platforms"]}
    assert platforms["linkedin"] == {"platform": "linkedin", "supported": True, "configured": True}
    assert platforms["instagram"]["supported"] is False
    assert data["connections"] == []

    settings.linkedin_client_secret = ""
    data = client.get(f"/brands/{brand['id']}/connections", headers=owner).json()
    assert {p["platform"]: p for p in data["platforms"]}["linkedin"]["configured"] is False


def test_start_returns_linkedin_authorization_url(client, owner, brand, settings):
    response = client.post(f"/brands/{brand['id']}/connections/linkedin/start", headers=owner)
    url = urlparse(response.json()["authorization_url"])
    query = parse_qs(url.query)
    assert f"{url.scheme}://{url.netloc}{url.path}" == "https://www.linkedin.com/oauth/v2/authorization"
    assert query["client_id"] == ["li-client"] and query["response_type"] == ["code"]
    assert query["redirect_uri"] == ["https://api.test/connections/linkedin/callback"]
    assert set(query["scope"][0].split()) == {"openid", "profile", "w_member_social"}
    state = crypto.verify_state(query["state"][0], settings)
    assert state["bid"] == brand["id"] and state["p"] == "linkedin"


def test_start_errors(client, owner, brand, settings):
    assert client.post(f"/brands/{brand['id']}/connections/myspace/start", headers=owner).json()["detail"] == "platform_not_supported"
    settings.linkedin_client_id = ""
    response = client.post(f"/brands/{brand['id']}/connections/linkedin/start", headers=owner)
    assert response.status_code == 503 and response.json()["detail"] == "platform_not_configured"


def test_callback_saves_encrypted_connection(client, owner, brand, provider, engine):
    response = connect(client, owner, brand["id"])
    assert response.status_code == 303
    assert response.headers["location"] == f"https://app.test/brands/{brand['id']}?connected=linkedin"
    assert provider.exchanged == [("c0de", "https://api.test/connections/linkedin/callback")]

    connections = client.get(f"/brands/{brand['id']}/connections", headers=owner).json()["connections"]
    assert len(connections) == 1
    assert connections[0]["display_name"] == "Bram V" and connections[0]["expired"] is False

    from sqlalchemy.orm import Session

    with Session(engine) as db:
        account = db.scalars(select(SocialAccount)).one()
        assert "token-c0de" not in account.access_token_encrypted  # nooit leesbaar opgeslagen


def test_reconnect_updates_instead_of_duplicating(client, owner, brand, provider, engine):
    connect(client, owner, brand["id"], code="eerste")
    connect(client, owner, brand["id"], code="tweede")
    from sqlalchemy.orm import Session

    with Session(engine) as db:
        assert len(db.scalars(select(SocialAccount)).all()) == 1


@pytest.mark.parametrize(
    "params, error",
    [
        ({"state": "rommel", "code": "x"}, "connect_state_invalid"),
        ({"code": "x"}, "connect_state_invalid"),
    ],
)
def test_callback_rejects_bad_state(client, provider, params, error):
    response = callback(client, **params)
    assert response.headers["location"] == f"https://app.test/brands?connectError={error}"
    assert provider.exchanged == []


def test_callback_rejects_state_for_someone_elses_brand(client, owner, brand, provider, settings):
    state = crypto.sign_state({"uid": "00000000-0000-0000-0000-000000000000", "bid": brand["id"], "p": "linkedin"}, settings)
    response = callback(client, state=state, code="x")
    assert "connect_state_invalid" in response.headers["location"] and provider.exchanged == []


def test_callback_when_user_cancels(client, owner, brand, provider):
    response = callback(client, state=start_state(client, owner, brand["id"]), error="user_cancelled_authorize")
    assert response.headers["location"].endswith(f"/brands/{brand['id']}?connectError=connect_denied")


def test_callback_when_platform_fails(client, owner, brand, provider):
    provider.fail = "connect_failed"
    response = connect(client, owner, brand["id"])
    assert response.headers["location"].endswith("connectError=connect_failed")


def test_connections_are_private(client, owner, brand, provider, auth_headers):
    connect(client, owner, brand["id"])
    other = auth_headers(email="tweede@voorbeeld.nl")
    assert client.get(f"/brands/{brand['id']}/connections", headers=other).status_code == 404
    assert client.post(f"/brands/{brand['id']}/connections/linkedin/start", headers=other).status_code == 404
    assert client.delete(f"/brands/{brand['id']}/connections/linkedin", headers=other).status_code == 404


def test_disconnect(client, owner, brand, provider):
    connect(client, owner, brand["id"])
    assert client.delete(f"/brands/{brand['id']}/connections/linkedin", headers=owner).status_code == 204
    assert client.get(f"/brands/{brand['id']}/connections", headers=owner).json()["connections"] == []
    assert client.delete(f"/brands/{brand['id']}/connections/linkedin", headers=owner).status_code == 404


# ---------- publiceren ----------


class FakePublisher:
    platform = Platform.LINKEDIN

    def __init__(self, result: PublishResult):
        self.result = result
        self.calls = []

    def publish(self, post, account):
        self.calls.append((post.id, account.access_token, account.external_account_id))
        return self.result


@pytest.fixture
def linkedin_post(client, owner, brand, writer):
    post = client.post(
        "/generate", json={"brand_id": brand["id"], "platforms": ["linkedin"], "posts_per_platform": 1}, headers=owner
    ).json()["posts"][0]
    return post


def use_publisher(monkeypatch, result: PublishResult) -> FakePublisher:
    fake = FakePublisher(result)
    monkeypatch.setattr(publisher_registry, "_publishers", {Platform.LINKEDIN: fake})
    return fake


def test_publish_requirements(client, owner, brand, linkedin_post, provider, monkeypatch, engine):
    use_publisher(monkeypatch, PublishResult(success=True))
    url = f"/posts/{linkedin_post['id']}/publish"
    assert client.post(url, headers=owner).json()["detail"] == "post_not_approved"
    client.post(f"/posts/{linkedin_post['id']}/status", json={"status": "approved"}, headers=owner)
    assert client.post(url, headers=owner).json()["detail"] == "not_connected"

    connect(client, owner, brand["id"])
    from sqlalchemy.orm import Session

    with Session(engine) as db:
        account = db.scalars(select(SocialAccount)).one()
        account.expires_at = datetime.now(UTC) - timedelta(minutes=1)
        db.commit()
    assert client.post(url, headers=owner).json()["detail"] == "connection_expired"
    detail = client.get(f"/posts/{linkedin_post['id']}", headers=owner).json()
    assert detail["connection"]["expired"] is True


def test_publish_success(client, owner, brand, linkedin_post, provider, monkeypatch):
    fake = use_publisher(monkeypatch, PublishResult(success=True, external_id="urn:li:share:1", url="https://www.linkedin.com/feed/update/urn:li:share:1/"))
    connect(client, owner, brand["id"], code="xyz")
    post_url = f"/posts/{linkedin_post['id']}"
    client.post(f"{post_url}/status", json={"status": "approved"}, headers=owner)

    response = client.post(f"{post_url}/publish", headers=owner)
    assert response.status_code == 200, response.text
    detail = response.json()
    assert detail["published_at"] is not None and detail["external_url"].endswith("urn:li:share:1/")
    assert detail["connection"]["display_name"] == "Bram V"
    assert fake.calls == [(linkedin_post["id"], "token-xyz", "abc123")]  # ontsleuteld token gebruikt
    assert client.post(f"{post_url}/publish", headers=owner).json()["detail"] == "already_published"


def test_publish_failure_is_stored(client, owner, brand, linkedin_post, provider, monkeypatch):
    use_publisher(monkeypatch, PublishResult(success=False, error="publish_rejected"))
    connect(client, owner, brand["id"])
    client.post(f"/posts/{linkedin_post['id']}/status", json={"status": "approved"}, headers=owner)
    response = client.post(f"/posts/{linkedin_post['id']}/publish", headers=owner)
    assert response.status_code == 502 and response.json()["detail"] == "publish_rejected"
    assert client.get(f"/posts/{linkedin_post['id']}", headers=owner).json()["publish_error"] == "publish_rejected"


# ---------- LinkedIn-specifiek (met httpx.MockTransport) ----------


def test_little_text_escapes_and_converts_hashtags():
    text = to_little_text("Nu (eindelijk) live!", "Mail @ ons, 50% *korting* #koffie_bar", ["#Utrecht", "#"])
    assert text == "Nu \\(eindelijk\\) live!\n\nMail \\@ ons, 50% \\*korting\\* {hashtag|\\#|koffie\\_bar}\n\n{hashtag|\\#|Utrecht}"


def test_linkedin_oauth_exchange_and_profile(settings):
    def handler(request: httpx.Request):
        if request.url.path == "/oauth/v2/accessToken":
            form = parse_qs(request.content.decode())
            assert form["grant_type"] == ["authorization_code"] and form["client_secret"] == ["li-secret"]
            return httpx.Response(200, json={"access_token": "AT", "expires_in": 5184000, "scope": "openid,profile,w_member_social"})
        assert request.headers["Authorization"] == "Bearer AT"
        return httpx.Response(200, json={"sub": "782bbtaQ", "name": "John Doe", "picture": "https://p"})

    oauth = LinkedInOAuth(settings, http=httpx.Client(transport=httpx.MockTransport(handler)))
    tokens = oauth.exchange_code("code", "https://api.test/cb")
    assert tokens.access_token == "AT" and tokens.expires_at > datetime.now(UTC) + timedelta(days=59)
    assert oauth.fetch_profile("AT") == Profile("782bbtaQ", "John Doe", "https://p")


def test_linkedin_oauth_failure(settings):
    oauth = LinkedInOAuth(settings, http=httpx.Client(transport=httpx.MockTransport(lambda r: httpx.Response(400, json={"error": "invalid_grant"}))))
    with pytest.raises(SocialError) as exc:
        oauth.exchange_code("oud", "https://api.test/cb")
    assert exc.value.code == "connect_failed"


def make_post(**overrides) -> Post:
    fields = {"id": 7, "platform": "linkedin", "hook": "Hook (1)", "body": "Tekst", "hashtags": ["#tag"]} | overrides
    return Post(brand=Brand(name="Merk", avoid_terms=[]), **fields)


ACCOUNT = type("A", (), {"platform": "linkedin", "external_account_id": "782bbtaQ", "access_token": "AT"})()


def test_linkedin_publisher_request_and_response(settings):
    seen = {}

    def handler(request: httpx.Request):
        seen["headers"] = request.headers
        seen["body"] = json.loads(request.content)
        return httpx.Response(201, headers={"x-restli-id": "urn:li:share:6844785523593134080"})

    publisher = LinkedInPublisher(settings, http=httpx.Client(transport=httpx.MockTransport(handler)))
    result = publisher.publish(make_post(), ACCOUNT)
    assert result.success and result.external_id == "urn:li:share:6844785523593134080"
    assert result.url == "https://www.linkedin.com/feed/update/urn:li:share:6844785523593134080/"
    assert seen["headers"]["LinkedIn-Version"] == settings.linkedin_api_version
    assert seen["headers"]["X-Restli-Protocol-Version"] == "2.0.0"
    assert seen["headers"]["Authorization"] == "Bearer AT"
    body = seen["body"]
    assert body["author"] == "urn:li:person:782bbtaQ"
    assert body["commentary"] == "Hook \\(1\\)\n\nTekst\n\n{hashtag|\\#|tag}"
    assert body["visibility"] == "PUBLIC" and body["lifecycleState"] == "PUBLISHED"


@pytest.mark.parametrize(
    "status, error, retryable",
    [(401, "connection_expired", False), (403, "publish_forbidden", False), (426, "platform_version_outdated", False),
     (429, "platform_rate_limited", True), (503, "platform_unavailable", True), (422, "publish_rejected", False)],
)
def test_linkedin_publisher_errors(settings, status, error, retryable):
    publisher = LinkedInPublisher(settings, http=httpx.Client(transport=httpx.MockTransport(lambda r: httpx.Response(status, text="nee"))))
    result = publisher.publish(make_post(), ACCOUNT)
    assert (result.success, result.error, result.retryable) == (False, error, retryable)


def test_linkedin_publisher_blocks_too_long_posts(settings):
    publisher = LinkedInPublisher(settings, http=httpx.Client(transport=httpx.MockTransport(lambda r: httpx.Response(201))))
    result = publisher.publish(make_post(body="a" * 3100), ACCOUNT)
    assert not result.success and result.error == "too_long"
