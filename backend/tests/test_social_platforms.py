"""X, Facebook, Instagram en TikTok: koppelen (met nagebootste API's), PKCE, tokens verversen, wizard en publiceren."""

import base64
import hashlib
import json
import uuid
from datetime import UTC, datetime, timedelta
from urllib.parse import parse_qs, urlparse

import httpx
import pytest
from sqlalchemy.orm import Session

from app.models import Brand, Platform, Post, SocialAccount
from app.publishers.facebook import FacebookPublisher
from app.publishers.media_required import MediaRequiredPublisher
from app.publishers.x import XPublisher
from app.services import connections as connection_service
from app.services import crypto
from app.services.social.base import SocialError
from app.services.social.meta import FacebookOAuth, InstagramOAuth
from app.services.social.tiktok import TikTokOAuth
from app.services.social.x import XOAuth
from tests.test_brands import BRAND


@pytest.fixture
def platform_settings(settings):
    """Alle platforms 'ingesteld' met testgegevens."""
    for key, value in {
        "x_client_id": "x-id",
        "x_client_secret": "x-secret",
        "meta_app_id": "fb-id",
        "meta_app_secret": "fb-secret",
        "instagram_app_id": "ig-id",
        "instagram_app_secret": "ig-secret",
        "tiktok_client_key": "tt-key",
        "tiktok_client_secret": "tt-secret",
    }.items():
        setattr(settings, key, value)
    return settings


def mock(handler) -> httpx.Client:
    return httpx.Client(transport=httpx.MockTransport(handler))


def query(url: str) -> dict[str, str]:
    return {k: v[0] for k, v in parse_qs(urlparse(url).query).items()}


# ---------- X ----------


def test_x_start_uses_pkce_and_hides_the_verifier(client, auth_headers, platform_settings):
    owner = auth_headers()
    brand = client.post("/brands", json=BRAND, headers=owner).json()
    url = client.post(f"/brands/{brand['id']}/connections/x/start", headers=owner).json()["authorization_url"]
    params = query(url)
    assert url.startswith("https://x.com/i/oauth2/authorize?")
    assert params["code_challenge_method"] == "S256" and params["client_id"] == "x-id"
    assert set(params["scope"].split()) == {"tweet.read", "tweet.write", "users.read", "offline.access"}

    state = crypto.verify_state(params["state"], platform_settings)
    verifier = crypto.decrypt(state["cv"], platform_settings)  # versleuteld, niet leesbaar in de URL
    assert verifier not in url
    expected = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    assert params["code_challenge"] == expected


def test_x_complete_and_refresh(platform_settings):
    seen = []

    def handler(request: httpx.Request):
        seen.append(request)
        if request.url.path == "/2/oauth2/token":
            form = parse_qs(request.content.decode())
            assert request.headers["Authorization"] == "Basic " + base64.b64encode(b"x-id:x-secret").decode()
            if form["grant_type"] == ["authorization_code"]:
                assert form["code_verifier"] == ["geheime-verifier"]
                return httpx.Response(200, json={"access_token": "AT1", "refresh_token": "RT1", "expires_in": 7200, "scope": "tweet.write"})
            assert form["refresh_token"] == ["RT1"]
            return httpx.Response(200, json={"access_token": "AT2", "refresh_token": "RT2", "expires_in": 7200})
        assert request.headers["Authorization"] == "Bearer AT1"
        return httpx.Response(200, json={"data": {"id": "42", "name": "Bram", "username": "bramv", "profile_image_url": "https://pic"}})

    oauth = XOAuth(platform_settings, http=mock(handler))
    connected = oauth.complete("code", "https://api.test/cb", "geheime-verifier")
    assert connected.profile.external_account_id == "42" and connected.profile.display_name == "Bram (@bramv)"
    assert connected.tokens.refresh_token == "RT1"
    refreshed = oauth.refresh(connected.tokens)
    assert (refreshed.access_token, refreshed.refresh_token) == ("AT2", "RT2")

    with pytest.raises(SocialError):
        oauth.complete("code", "https://api.test/cb", None)  # zonder verifier: geweigerd


# ---------- TikTok ----------


def test_tiktok_complete(platform_settings):
    def handler(request: httpx.Request):
        if request.url.path == "/v2/oauth/token/":
            form = parse_qs(request.content.decode())
            assert form["client_key"] == ["tt-key"] and form["grant_type"] == ["authorization_code"]
            return httpx.Response(200, json={"access_token": "TAT", "expires_in": 86400, "open_id": "oid", "refresh_token": "TRT", "scope": "user.info.basic"})
        assert request.url.params["fields"] == "open_id,display_name,avatar_url"
        return httpx.Response(200, json={"data": {"user": {"open_id": "oid", "display_name": "Bram op TikTok", "avatar_url": "https://a"}}})

    oauth = TikTokOAuth(platform_settings, http=mock(handler))
    assert query(oauth.authorization_url("s", "https://api.test/cb"))["client_key"] == "tt-key"
    connected = oauth.complete("code", "https://api.test/cb")
    assert connected.profile.display_name == "Bram op TikTok" and connected.tokens.refresh_token == "TRT"


# ---------- Facebook ----------


def test_facebook_complete_uses_page_token(platform_settings):
    calls = []

    def handler(request: httpx.Request):
        calls.append(request.url.path)
        params = request.url.params
        if request.url.path.endswith("/oauth/access_token"):
            if params.get("grant_type") == "fb_exchange_token":
                assert params["fb_exchange_token"] == "SHORT"
                return httpx.Response(200, json={"access_token": "LONG"})
            return httpx.Response(200, json={"access_token": "SHORT"})
        assert request.url.path.endswith("/me/accounts") and params["access_token"] == "LONG"
        return httpx.Response(200, json={"data": [{"id": "page1", "name": "De Boon", "access_token": "PAGE", "picture": {"data": {"url": "https://pic"}}}]})

    connected = FacebookOAuth(platform_settings, http=mock(handler)).complete("code", "https://api.test/cb")
    assert connected.tokens.access_token == "PAGE" and connected.tokens.expires_at is None  # pagina-token verloopt niet
    assert connected.profile.external_account_id == "page1" and connected.profile.display_name == "De Boon"
    assert all(path.startswith("/v26.0/") for path in calls)


def test_facebook_without_page(platform_settings):
    def handler(request):
        if request.url.path.endswith("/me/accounts"):
            return httpx.Response(200, json={"data": []})
        return httpx.Response(200, json={"access_token": "T"})

    with pytest.raises(SocialError) as exc:
        FacebookOAuth(platform_settings, http=mock(handler)).complete("code", "https://api.test/cb")
    assert exc.value.code == "no_facebook_page"


# ---------- Instagram ----------


def test_instagram_complete_and_refresh(platform_settings):
    def handler(request: httpx.Request):
        if request.url.host == "api.instagram.com":
            form = parse_qs(request.content.decode())
            assert form["code"] == ["abc"]  # afsluitende "#_" is verwijderd
            return httpx.Response(200, json={"data": [{"access_token": "SHORT", "user_id": "17841"}]})
        if request.url.path == "/access_token":
            return httpx.Response(200, json={"access_token": "LONG", "expires_in": 5183944})
        if request.url.path == "/refresh_access_token":
            return httpx.Response(200, json={"access_token": "LONG2", "expires_in": 5183944})
        return httpx.Response(200, json={"user_id": "17841", "username": "deboon", "profile_picture_url": "https://p"})

    oauth = InstagramOAuth(platform_settings, http=mock(handler))
    connected = oauth.complete("abc#_", "https://api.test/cb")
    assert connected.profile.display_name == "@deboon" and connected.tokens.access_token == "LONG"
    assert connected.tokens.expires_at > datetime.now(UTC) + timedelta(days=59)
    assert oauth.refresh(connected.tokens).access_token == "LONG2"


# ---------- Tokens verversen bij publiceren ----------


def _account(db: Session, *, platform="x", expires_at, refresh_token="RT", settings) -> SocialAccount:
    brand = Brand(user_id=uuid.uuid4(), name="Merk")
    account = SocialAccount(
        brand=brand,
        platform=platform,
        external_account_id="42",
        display_name="Bram",
        access_token_encrypted=crypto.encrypt("OUD", settings),
        refresh_token_encrypted=crypto.encrypt(refresh_token, settings) if refresh_token else None,
        expires_at=expires_at,
        scopes="",
    )
    db.add(account)
    db.commit()
    return account


def test_fresh_credentials_refreshes_expiring_tokens(db, engine, platform_settings, monkeypatch):
    account = _account(db, expires_at=datetime.now(UTC) + timedelta(minutes=1), settings=platform_settings)

    class Refresher:
        def refresh(self, tokens):
            assert (tokens.access_token, tokens.refresh_token) == ("OUD", "RT")
            from app.services.social.base import TokenSet

            return TokenSet(access_token="NIEUW", expires_at=datetime.now(UTC) + timedelta(hours=2), refresh_token="RT2")

    monkeypatch.setattr(connection_service, "get_oauth_provider", lambda platform, settings: Refresher())
    creds = connection_service.fresh_credentials(db, account, platform_settings)
    assert creds.access_token == "NIEUW"
    assert crypto.decrypt(account.refresh_token_encrypted, platform_settings) == "RT2"
    assert connection_service.is_expired(account) is False


def test_fresh_credentials_without_refresh_raises_when_expired(db, engine, platform_settings, monkeypatch):
    account = _account(db, platform="linkedin", expires_at=datetime.now(UTC) - timedelta(minutes=1), refresh_token=None, settings=platform_settings)
    monkeypatch.setattr(connection_service, "get_oauth_provider", lambda platform, settings: type("P", (), {"refresh": lambda self, t: None})())
    assert connection_service.is_expired(account) is True
    with pytest.raises(SocialError) as exc:
        connection_service.fresh_credentials(db, account, platform_settings)
    assert exc.value.code == "connection_expired"


def test_refreshable_connection_is_not_shown_as_expired(db, engine, platform_settings):
    account = _account(db, expires_at=datetime.now(UTC) - timedelta(hours=1), settings=platform_settings)
    out = connection_service.to_out(account)
    assert out.expired is False and out.expires_at is None


# ---------- "Alles koppelen" (wizard) ----------


def test_wizard_flag_round_trip(client, auth_headers, platform_settings, monkeypatch):
    from app.routers import connections as connections_router
    from tests.test_connections import FakeProvider

    owner = auth_headers()
    brand = client.post("/brands", json=BRAND, headers=owner).json()
    monkeypatch.setattr(connections_router, "get_oauth_provider", lambda platform, settings: FakeProvider())

    url = client.post(f"/brands/{brand['id']}/connections/linkedin/start?wizard=true", headers=owner).json()["authorization_url"]
    state = query(url)["state"]
    ok = client.get("/connections/linkedin/callback", params={"state": state, "code": "c"}, follow_redirects=False)
    assert ok.headers["location"] == f"https://app.test/brands/{brand['id']}?connected=linkedin&wizard=1"

    cancelled = client.get("/connections/linkedin/callback", params={"state": state, "error": "user_cancelled_login"}, follow_redirects=False)
    assert "wizard=1" in cancelled.headers["location"] and "connectError=connect_denied" in cancelled.headers["location"]


# ---------- Publishers ----------


def make_post(platform: str, **overrides) -> Post:
    fields = {"id": 3, "platform": platform, "hook": "Hook", "body": "Tekst", "hashtags": ["#tag"]} | overrides
    return Post(brand=Brand(name="Merk", avoid_terms=[]), **fields)


ACCOUNT = type("A", (), {"platform": "x", "external_account_id": "page1", "access_token": "AT"})()


def test_x_publisher(settings):
    def handler(request):
        assert request.headers["Authorization"] == "Bearer AT"
        assert json.loads(request.content) == {"text": "Hook\n\nTekst\n\n#tag"}
        return httpx.Response(201, json={"data": {"id": "1850", "text": "..."}})

    result = XPublisher(http=mock(handler)).publish(make_post("x"), ACCOUNT)
    assert result.success and result.url == "https://x.com/i/web/status/1850"


@pytest.mark.parametrize("status, error", [(401, "connection_expired"), (402, "platform_payment_required"), (403, "publish_forbidden"), (429, "platform_rate_limited")])
def test_x_publisher_errors(status, error):
    result = XPublisher(http=mock(lambda r: httpx.Response(status, json={"title": "nee"}))).publish(make_post("x"), ACCOUNT)
    assert result.error == error


def test_x_publisher_blocks_long_posts():
    result = XPublisher(http=mock(lambda r: httpx.Response(201))).publish(make_post("x", body="a" * 300), ACCOUNT)
    assert result.error == "too_long"


def test_facebook_publisher(settings):
    def handler(request):
        assert request.url.path == "/v26.0/page1/feed"
        form = parse_qs(request.content.decode())
        assert form["access_token"] == ["AT"] and form["message"] == ["Hook\n\nTekst\n\n#tag"]
        return httpx.Response(200, json={"id": "page1_99"})

    result = FacebookPublisher(settings, http=mock(handler)).publish(make_post("facebook"), ACCOUNT)
    assert result.success and result.url == "https://www.facebook.com/page1_99"


@pytest.mark.parametrize("code, error", [(190, "connection_expired"), (200, "publish_forbidden"), (4, "platform_rate_limited"), (100, "publish_rejected")])
def test_facebook_publisher_errors(settings, code, error):
    response = httpx.Response(400, json={"error": {"code": code, "message": "nee"}})
    result = FacebookPublisher(settings, http=mock(lambda r: response)).publish(make_post("facebook"), ACCOUNT)
    assert result.error == error


def test_media_required_for_instagram_and_tiktok():
    for platform in (Platform.INSTAGRAM, Platform.TIKTOK):
        assert MediaRequiredPublisher(platform).publish(make_post(platform.value), ACCOUNT).error == "media_required"


def test_instagram_refreshes_a_week_ahead_and_expires_for_real(db, platform_settings, monkeypatch):
    refreshed = []

    class Refresher:
        def refresh(self, tokens):
            from app.services.social.base import TokenSet

            refreshed.append(tokens.access_token)
            return TokenSet(access_token="IG2", expires_at=datetime.now(UTC) + timedelta(days=60))

    monkeypatch.setattr(connection_service, "get_oauth_provider", lambda platform, settings: Refresher())
    soon = _account(db, platform="instagram", expires_at=datetime.now(UTC) + timedelta(days=3), refresh_token=None, settings=platform_settings)
    assert connection_service.fresh_credentials(db, soon, platform_settings).access_token == "IG2"
    assert refreshed == ["OUD"]

    gone = _account(db, platform="instagram", expires_at=datetime.now(UTC) - timedelta(days=1), refresh_token=None, settings=platform_settings)
    assert connection_service.is_expired(gone) is True
