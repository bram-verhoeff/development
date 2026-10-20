"""Scheduler: ingeplande posts automatisch plaatsen, opnieuw proberen en nooit dubbel plaatsen."""

from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.orm import Session

from app.config import get_settings
from app.main import app
from app.models import Post
from app.publishers.base import PublishResult
from app.services import publishing, scheduler
from tests.test_connections import brand, connect, linkedin_post, owner, provider, use_publisher  # noqa: F401

CRON_SECRET = "cron-geheim-" + "z" * 30


@pytest.fixture
def cron_settings(client, settings):
    configured = settings.model_copy(update={"cron_secret": CRON_SECRET})
    app.dependency_overrides[get_settings] = lambda: configured
    return configured


@pytest.fixture
def scheduled(client, owner, brand, linkedin_post, provider):
    """Een goedgekeurde, gekoppelde LinkedIn-post, ingepland over een minuut."""
    connect(client, owner, brand["id"])
    url = f"/posts/{linkedin_post['id']}"
    client.post(f"{url}/status", json={"status": "approved"}, headers=owner)
    at = datetime.now(UTC) + timedelta(minutes=1)
    assert client.put(f"{url}/schedule", json={"scheduled_at": at.isoformat()}, headers=owner).status_code == 200
    return linkedin_post["id"], at


def run(engine, settings, at: datetime) -> scheduler.RunSummary:
    with Session(engine, expire_on_commit=False) as db:
        return scheduler.run_due(db, settings, now=at)


def load(engine, post_id) -> Post:
    with Session(engine) as db:
        return db.get(Post, post_id)


def test_endpoint_requires_configured_secret(client, settings, monkeypatch):
    app.dependency_overrides[get_settings] = lambda: settings  # zonder CRON_SECRET
    assert client.post("/internal/run-scheduler").json()["detail"] == "scheduler_not_configured"


def test_endpoint_checks_secret(client, cron_settings):
    assert client.post("/internal/run-scheduler").status_code == 401
    assert client.post("/internal/run-scheduler", headers={"X-Cron-Secret": "fout"}).status_code == 401
    ok = client.post("/internal/run-scheduler", headers={"X-Cron-Secret": CRON_SECRET})
    assert ok.status_code == 200 and ok.json() == {"published": [], "retrying": [], "failed": []}
    # Vercel Cron stuurt een GET met "Authorization: Bearer <CRON_SECRET>"
    assert client.get("/internal/run-scheduler", headers={"Authorization": f"Bearer {CRON_SECRET}"}).status_code == 200


def test_publishes_due_post_once(client, owner, scheduled, cron_settings, engine, monkeypatch):
    post_id, at = scheduled
    fake = use_publisher(monkeypatch, PublishResult(success=True, external_id="urn:li:share:9", url="https://li.test/9"))

    assert run(engine, cron_settings, at - timedelta(seconds=30)).published == []  # nog niet aan de beurt
    assert fake.calls == []

    summary = client.post("/internal/run-scheduler", headers={"X-Cron-Secret": CRON_SECRET}).json()
    assert summary["published"] == []  # echte klok: nog een minuut te vroeg
    assert run(engine, cron_settings, at + timedelta(seconds=5)).published == [post_id]
    assert run(engine, cron_settings, at + timedelta(minutes=1)).published == []  # niet nog eens
    assert len(fake.calls) == 1

    post = load(engine, post_id)
    assert post.published_at is not None and post.external_url == "https://li.test/9"
    assert post.scheduled_at is None and post.publishing_started_at is None


def test_skips_posts_that_are_not_approved(client, owner, scheduled, cron_settings, engine, monkeypatch):
    post_id, at = scheduled
    fake = use_publisher(monkeypatch, PublishResult(success=True))
    client.post(f"/posts/{post_id}/status", json={"status": "concept"}, headers=owner)
    assert run(engine, cron_settings, at + timedelta(minutes=5)).published == []
    assert fake.calls == []


def test_retries_temporary_errors_with_backoff(scheduled, cron_settings, engine, monkeypatch):
    post_id, at = scheduled
    fake = use_publisher(monkeypatch, PublishResult(success=False, error="rate_limited", retryable=True))

    now = at + timedelta(seconds=5)
    assert run(engine, cron_settings, now).retrying == [post_id]
    post = load(engine, post_id)
    assert post.publish_attempts == 1 and post.publish_error == "rate_limited"
    assert post.next_attempt_at == now + scheduler.BACKOFF[0]

    assert run(engine, cron_settings, now + timedelta(minutes=1)).retrying == []  # wacht nog
    fake.result = PublishResult(success=True, external_id="urn:li:share:2")
    assert run(engine, cron_settings, now + scheduler.BACKOFF[0]).published == [post_id]
    post = load(engine, post_id)
    assert post.publish_error is None and post.publish_attempts == 0 and post.next_attempt_at is None


def test_gives_up_after_max_attempts(scheduled, cron_settings, engine, monkeypatch):
    post_id, at = scheduled
    use_publisher(monkeypatch, PublishResult(success=False, error="platform_unavailable", retryable=True))
    now = at
    for attempt in range(1, scheduler.MAX_ATTEMPTS):
        assert run(engine, cron_settings, now).retrying == [post_id]
        now += scheduler.backoff(attempt)
    assert run(engine, cron_settings, now).failed == [post_id]
    assert run(engine, cron_settings, now + timedelta(days=1)).failed == []  # stopt definitief


def test_permanent_error_stops_until_rescheduled(client, owner, scheduled, cron_settings, engine, monkeypatch):
    post_id, at = scheduled
    fake = use_publisher(monkeypatch, PublishResult(success=False, error="publish_rejected"))
    assert run(engine, cron_settings, at).failed == [post_id]
    post = load(engine, post_id)
    assert post.publish_attempts == scheduler.MAX_ATTEMPTS and post.publish_error == "publish_rejected"
    assert run(engine, cron_settings, at + timedelta(hours=3)).failed == []

    # Opnieuw inplannen = opnieuw proberen
    new_at = datetime.now(UTC) + timedelta(minutes=2)
    client.put(f"/posts/{post_id}/schedule", json={"scheduled_at": new_at.isoformat()}, headers=owner)
    assert load(engine, post_id).publish_error is None
    fake.result = PublishResult(success=True)
    assert run(engine, cron_settings, new_at).published == [post_id]


def test_missing_connection_is_a_permanent_error(client, owner, brand, linkedin_post, cron_settings, engine):
    url = f"/posts/{linkedin_post['id']}"
    client.post(f"{url}/status", json={"status": "approved"}, headers=owner)
    at = datetime.now(UTC) + timedelta(minutes=1)
    client.put(f"{url}/schedule", json={"scheduled_at": at.isoformat()}, headers=owner)
    assert run(engine, cron_settings, at).failed == [linkedin_post["id"]]
    assert load(engine, linkedin_post["id"]).publish_error == "not_connected"


def test_unexpected_exception_is_retried(scheduled, cron_settings, engine, monkeypatch):
    post_id, at = scheduled
    fake = use_publisher(monkeypatch, PublishResult(success=True))

    def boom(post, account):
        raise RuntimeError("netwerk weg")

    fake.publish = boom
    assert run(engine, cron_settings, at).retrying == [post_id]
    post = load(engine, post_id)
    assert post.publish_error == "publish_failed" and post.publishing_started_at is None


def test_locked_post_is_not_published_twice(client, owner, scheduled, cron_settings, engine, monkeypatch):
    post_id, at = scheduled
    fake = use_publisher(monkeypatch, PublishResult(success=True))
    # Een andere run (of "Nu plaatsen") is er al mee bezig
    with Session(engine) as db:
        assert publishing.claim(db, post_id, at)
        assert not publishing.claim(db, post_id, at)

    assert run(engine, cron_settings, at + timedelta(minutes=1)).published == []
    assert client.post(f"/posts/{post_id}/publish", headers=owner).json()["detail"] == "publish_in_progress"
    assert fake.calls == []

    # Een vastgelopen vergrendeling wordt na LOCK_TIMEOUT overgenomen
    later = at + publishing.LOCK_TIMEOUT + timedelta(minutes=1)
    assert run(engine, cron_settings, later).published == [post_id]
    assert len(fake.calls) == 1
