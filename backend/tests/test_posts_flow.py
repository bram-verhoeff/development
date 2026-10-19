"""Genereren, goedkeuren, bewerken, herschrijven en inplannen via de API (met nep-Claude)."""

from datetime import UTC, datetime, timedelta
from urllib.parse import quote

import pytest

from tests.test_brands import BRAND


@pytest.fixture
def owner(auth_headers):
    return auth_headers()


@pytest.fixture
def brand(client, owner):
    return client.post("/brands", json=BRAND, headers=owner).json()


def generate(client, headers, brand_id, **overrides):
    payload = {"brand_id": brand_id, "platforms": ["instagram", "x"], "posts_per_platform": 2} | overrides
    return client.post("/generate", json=payload, headers=headers)


def future(days=1) -> str:
    return (datetime.now(UTC) + timedelta(days=days)).isoformat()


def test_generate_creates_concept_posts(client, owner, brand, writer):
    response = generate(client, owner, brand["id"], instructions="Herfstactie")
    assert response.status_code == 201, response.text
    posts = response.json()["posts"]
    assert [p["platform"] for p in posts] == ["instagram", "instagram", "x", "x"]
    assert all(p["status"] == "concept" and p["brand_name"] == BRAND["name"] for p in posts)
    assert posts[0]["hashtags"] == ["#test", "#koffie"]
    assert posts[0]["max_chars"] == 2200 and posts[2]["max_chars"] == 280
    assert writer.calls[0] == ("generate", ["instagram", "x"], 2, None, "Herfstactie")

    detail = client.get(f"/posts/{posts[0]['id']}", headers=owner).json()
    assert [v["origin"] for v in detail["versions"]] == ["generated"]


def test_generate_with_text_source(client, owner, brand, writer):
    generate(client, owner, brand["id"], source_type="text", source_text="Nieuwe blend uit Ethiopie")
    assert writer.calls[0][3] == "Nieuwe blend uit Ethiopie"


def test_generate_with_url_source_uses_fetched_text(client, owner, brand, writer, monkeypatch):
    from app.routers import generate as generate_router

    monkeypatch.setattr(generate_router, "fetch_source_text", lambda url: f"Tekst van {url}")
    generate(client, owner, brand["id"], source_type="url", source_url="https://deboon.nl/blog")
    assert writer.calls[0][3] == "Tekst van https://deboon.nl/blog"


@pytest.mark.parametrize(
    "overrides",
    [
        {"platforms": []},
        {"platforms": ["myspace"]},
        {"posts_per_platform": 0},
        {"posts_per_platform": 6},
        {"source_type": "url"},
        {"source_type": "text", "source_text": ""},
    ],
)
def test_generate_validation(client, owner, brand, writer, overrides):
    assert generate(client, owner, brand["id"], **overrides).status_code == 422
    assert writer.calls == []


def test_generate_for_someone_elses_brand(client, brand, writer, auth_headers):
    other = auth_headers(email="tweede@voorbeeld.nl")
    assert generate(client, other, brand["id"]).status_code == 404
    assert writer.calls == []


def test_generation_limit(client, owner, brand, writer, settings):
    settings.generation_daily_limit = 2
    assert generate(client, owner, brand["id"]).status_code == 201
    post_id = generate(client, owner, brand["id"]).json()["posts"][0]["id"]
    third = generate(client, owner, brand["id"])
    assert third.status_code == 429 and third.json()["detail"] == "generation_limit_reached"
    assert client.post(f"/posts/{post_id}/regenerate", json={}, headers=owner).status_code == 429
    assert client.get("/dashboard", headers=owner).json()["generations_today"] == 2


def test_ai_errors_are_returned_as_codes(client, owner, brand, settings):
    settings.anthropic_api_key = ""  # echte ClaudeWriter zonder sleutel
    response = generate(client, owner, brand["id"])
    assert response.status_code == 503 and response.json()["detail"] == "ai_not_configured"


@pytest.fixture
def post(client, owner, brand, writer):
    return generate(client, owner, brand["id"], platforms=["linkedin"], posts_per_platform=1).json()["posts"][0]


def test_edit_post_keeps_history(client, owner, post):
    response = client.patch(
        f"/posts/{post['id']}",
        json={"hook": "  Eigen hook ", "body": "Eigen tekst", "hashtags": ["#a", "#a", "#b"]},
        headers=owner,
    )
    assert response.status_code == 200
    detail = response.json()
    assert detail["hook"] == "Eigen hook" and detail["hashtags"] == ["#a", "#b"]
    assert [v["origin"] for v in detail["versions"]] == ["edited", "generated"]


def test_edit_rejects_invalid_hashtags(client, owner, post):
    payload = {"hook": "h", "body": "b", "hashtags": ["geen hashtag"]}
    assert client.patch(f"/posts/{post['id']}", json=payload, headers=owner).status_code == 422


def test_approval_and_scheduling_rules(client, owner, post):
    url = f"/posts/{post['id']}"
    # Concept kan niet ingepland worden
    response = client.put(f"{url}/schedule", json={"scheduled_at": future()}, headers=owner)
    assert response.status_code == 409 and response.json()["detail"] == "post_not_approved"

    assert client.post(f"{url}/status", json={"status": "approved"}, headers=owner).json()["status"] == "approved"

    # Zonder tijdzone of in het verleden: geweigerd
    naive = client.put(f"{url}/schedule", json={"scheduled_at": "2030-01-01T09:00:00"}, headers=owner)
    assert naive.status_code == 422
    past = client.put(f"{url}/schedule", json={"scheduled_at": future(-1)}, headers=owner)
    assert past.status_code == 422 and past.json()["detail"] == "schedule_in_past"

    planned = client.put(f"{url}/schedule", json={"scheduled_at": "2030-01-01T09:00:00+01:00"}, headers=owner)
    assert planned.json()["scheduled_at"].startswith("2030-01-01T08:00:00")  # opgeslagen in UTC

    # Afwijzen haalt hem uit de kalender
    rejected = client.post(f"{url}/status", json={"status": "rejected"}, headers=owner).json()
    assert rejected["status"] == "rejected" and rejected["scheduled_at"] is None


def test_unschedule(client, owner, post):
    url = f"/posts/{post['id']}"
    client.post(f"{url}/status", json={"status": "approved"}, headers=owner)
    client.put(f"{url}/schedule", json={"scheduled_at": future()}, headers=owner)
    assert client.put(f"{url}/schedule", json={"scheduled_at": None}, headers=owner).json()["scheduled_at"] is None


def test_regenerate_resets_to_concept(client, owner, post, writer):
    url = f"/posts/{post['id']}"
    client.post(f"{url}/status", json={"status": "approved"}, headers=owner)
    client.put(f"{url}/schedule", json={"scheduled_at": future()}, headers=owner)

    detail = client.post(f"{url}/regenerate", json={"instructions": "Korter en met een vraag"}, headers=owner).json()
    assert detail["hook"] == "Nieuwe hook" and detail["body"] == "Herschreven: Korter en met een vraag"
    assert detail["status"] == "concept" and detail["scheduled_at"] is None
    assert detail["versions"][0]["origin"] == "regenerated"
    assert detail["versions"][0]["instructions"] == "Korter en met een vraag"
    assert writer.calls[-1] == ("regenerate", "linkedin", "Korter en met een vraag")


def test_restore_version(client, owner, post):
    url = f"/posts/{post['id']}"
    client.patch(url, json={"hook": "Tijdelijk", "body": "x", "hashtags": []}, headers=owner)
    original = client.get(url, headers=owner).json()["versions"][-1]
    restored = client.post(f"{url}/versions/{original['id']}/restore", headers=owner).json()
    assert restored["hook"] == post["hook"]
    assert client.post(f"{url}/versions/99999/restore", headers=owner).status_code == 404


def test_list_filters(client, owner, brand, writer):
    platforms = ["instagram", "x", "facebook"]
    posts = generate(client, owner, brand["id"], platforms=platforms, posts_per_platform=1).json()["posts"]
    ig, x, fb = (p["id"] for p in posts)
    client.post(f"/posts/{x}/status", json={"status": "approved"}, headers=owner)
    client.put(f"/posts/{x}/schedule", json={"scheduled_at": future(3)}, headers=owner)
    client.post(f"/posts/{fb}/status", json={"status": "rejected"}, headers=owner)

    def ids(query: str) -> list[int]:
        return [p["id"] for p in client.get(f"/posts?{query}", headers=owner).json()]

    assert set(ids("")) == {ig, x, fb}
    assert ids("platform=instagram&platform=facebook") == [fb, ig]  # nieuwste eerst
    assert ids("status=concept") == [ig]
    assert ids("scheduled=true") == [x]
    assert ids(f"start={quote(future(2))}&end={quote(future(4))}") == [x]
    assert ids(f"start={quote(future(5))}") == []
    assert ids(f"brand_id={brand['id'] + 1}") == []
    run_id = generate(client, owner, brand["id"], platforms=["x"], posts_per_platform=1).json()["run_id"]
    assert len(ids(f"generation_run_id={run_id}")) == 1


def test_posts_are_private(client, owner, post, auth_headers):
    other = auth_headers(email="tweede@voorbeeld.nl")
    url = f"/posts/{post['id']}"
    assert client.get("/posts", headers=other).json() == []
    assert client.get(url, headers=other).status_code == 404
    assert client.patch(url, json={"hook": "x", "body": "y", "hashtags": []}, headers=other).status_code == 404
    assert client.post(f"{url}/status", json={"status": "approved"}, headers=other).status_code == 404
    assert client.delete(url, headers=other).status_code == 404
    assert client.get(url, headers=owner).status_code == 200


def test_delete_post(client, owner, post):
    assert client.delete(f"/posts/{post['id']}", headers=owner).status_code == 204
    assert client.get(f"/posts/{post['id']}", headers=owner).status_code == 404


def test_dashboard(client, owner, brand, writer):
    posts = generate(client, owner, brand["id"], platforms=["instagram"], posts_per_platform=3).json()["posts"]
    a, b, c = (p["id"] for p in posts)
    for pid in (a, b):
        client.post(f"/posts/{pid}/status", json={"status": "approved"}, headers=owner)
    client.put(f"/posts/{a}/schedule", json={"scheduled_at": future(2)}, headers=owner)

    data = client.get("/dashboard", headers=owner).json()
    assert data["brands"] == 1
    assert (data["concept"], data["approved_unscheduled"], data["scheduled_upcoming"]) == (1, 1, 1)
    assert [p["id"] for p in data["upcoming"]] == [a]
    assert [p["id"] for p in data["recent_concepts"]] == [c]
