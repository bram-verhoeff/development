import time

from tests.conftest import ALLOWED_EMAIL


def test_me_requires_token(client):
    response = client.get("/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "not_authenticated"


def test_me_with_es256_token(client, auth_headers):
    response = client.get("/me", headers=auth_headers())
    assert response.status_code == 200
    assert response.json()["email"] == ALLOWED_EMAIL


def test_me_with_legacy_hs256_token(client, auth_headers):
    assert client.get("/me", headers=auth_headers(alg="HS256")).status_code == 200


def test_allowlist_is_case_insensitive(client, auth_headers):
    assert client.get("/me", headers=auth_headers(email="Tweede@Voorbeeld.NL")).status_code == 200


def test_email_not_on_allowlist_is_forbidden(client, auth_headers):
    response = client.get("/me", headers=auth_headers(email="vreemde@voorbeeld.nl"))
    assert response.status_code == 403
    assert response.json()["detail"] == "email_not_allowed"


def test_expired_token_is_rejected(client, auth_headers):
    response = client.get("/me", headers=auth_headers(exp=int(time.time()) - 10))
    assert response.status_code == 401
    assert response.json()["detail"] == "invalid_token"


def test_wrong_audience_and_issuer_are_rejected(client, auth_headers):
    assert client.get("/me", headers=auth_headers(aud="anon")).status_code == 401
    assert client.get("/me", headers=auth_headers(iss="https://ander-project.supabase.co/auth/v1")).status_code == 401


def test_garbage_token_is_rejected(client):
    assert client.get("/me", headers={"Authorization": "Bearer niet-een-jwt"}).status_code == 401


def test_unsigned_token_is_rejected(client):
    import jwt

    token = jwt.encode({"sub": "x", "email": ALLOWED_EMAIL}, key=None, algorithm="none")
    assert client.get("/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_email_allowed_endpoint(client):
    assert client.post("/auth/allowed", json={"email": ALLOWED_EMAIL}).json() == {"allowed": True}
    assert client.post("/auth/allowed", json={"email": "vreemde@voorbeeld.nl"}).json() == {"allowed": False}
    assert client.post("/auth/allowed", json={"email": "geen-email"}).status_code == 422


def test_hs256_rejected_when_no_secret_configured(client, settings, auth_headers):
    settings.supabase_jwt_secret = ""
    assert client.get("/me", headers=auth_headers(alg="HS256")).status_code == 401
