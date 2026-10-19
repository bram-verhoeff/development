"""Gedeelde test-fixtures: verse in-memory database, testinstellingen en testtokens."""

import time
import uuid
from types import SimpleNamespace

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app import auth, models  # noqa: F401  (models registreert tabellen)
from app.config import Settings, get_settings
from app.database import Base, get_db, make_engine
from app.main import app

SUPABASE_URL = "https://test-project.supabase.co"
ALLOWED_EMAIL = "eigenaar@voorbeeld.nl"
HS_SECRET = "test-geheim-dat-lang-genoeg-is-voor-hs256"
EC_KEY = ec.generate_private_key(ec.SECP256R1())


@pytest.fixture
def settings() -> Settings:
    return Settings(
        _env_file=None,
        database_url="sqlite://",
        supabase_url=SUPABASE_URL,
        supabase_jwt_secret=HS_SECRET,
        allowed_emails=f"{ALLOWED_EMAIL}, tweede@voorbeeld.nl",
        anthropic_api_key="test-key",
    )


@pytest.fixture
def engine():
    engine = make_engine("sqlite://", poolclass=StaticPool)
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def db(engine) -> Session:
    session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)()
    yield session
    session.close()


@pytest.fixture(autouse=True)
def fake_jwks(monkeypatch):
    """Laat de JWKS-client onze test-EC-sleutel teruggeven in plaats van Supabase te bellen."""
    signing_key = SimpleNamespace(key=EC_KEY.public_key())
    fake_client = SimpleNamespace(get_signing_key_from_jwt=lambda _token: signing_key)
    monkeypatch.setattr(auth, "_jwks_client", lambda _url: fake_client)


@pytest.fixture
def make_token():
    """Maakt een token zoals Supabase dat doet; standaard ES256 en een toegestane gebruiker."""

    def _make(email: str = ALLOWED_EMAIL, user_id: uuid.UUID | None = None, alg: str = "ES256", **overrides) -> str:
        now = int(time.time())
        claims = {
            "sub": str(user_id or uuid.uuid5(uuid.NAMESPACE_DNS, email)),
            "email": email,
            "aud": "authenticated",
            "iss": f"{SUPABASE_URL}/auth/v1",
            "iat": now,
            "exp": now + 3600,
            "role": "authenticated",
        } | overrides
        key = EC_KEY if alg == "ES256" else HS_SECRET
        return jwt.encode(claims, key, algorithm=alg)

    return _make


@pytest.fixture
def client(settings, engine):
    """API-client met testinstellingen en de testdatabase."""
    session_factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def _db():
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_settings] = lambda: settings
    app.dependency_overrides[get_db] = _db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(make_token):
    def _headers(**kwargs) -> dict[str, str]:
        return {"Authorization": f"Bearer {make_token(**kwargs)}"}

    return _headers
