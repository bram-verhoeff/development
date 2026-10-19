import uuid
from types import SimpleNamespace

import pytest

from app.models import Brand, Platform, Post
from app.publishers import registry
from app.publishers.dry_run import DryRunPublisher

ACCOUNT = SimpleNamespace(platform="x", external_account_id="123", access_token="token")


def make_post(platform="x", body="Korte post") -> Post:
    brand = Brand(user_id=uuid.uuid4(), name="Merk", avoid_terms=[])
    return Post(id=1, brand=brand, platform=platform, hook="Hook", body=body, hashtags=["#tag"])


def test_dry_run_publishes_rendered_text():
    publisher = DryRunPublisher(Platform.X)
    result = publisher.publish(make_post(), ACCOUNT)
    assert result.success and result.external_id.startswith("dry-")
    assert publisher.published == [(1, "Hook\n\nKorte post\n\n#tag")]


def test_dry_run_refuses_posts_that_break_platform_limits():
    publisher = DryRunPublisher(Platform.X)
    result = publisher.publish(make_post(body="a" * 400), ACCOUNT)
    assert not result.success and result.error == "too_long"
    assert publisher.published == []


def test_registry(monkeypatch):
    monkeypatch.setattr(registry, "_publishers", {})
    with pytest.raises(registry.PublisherNotAvailable):
        registry.get_publisher("linkedin")
    publisher = DryRunPublisher(Platform.LINKEDIN)
    registry.register(publisher)
    assert registry.get_publisher("linkedin") is publisher
    assert registry.available_platforms() == [Platform.LINKEDIN]
    with pytest.raises(registry.PublisherNotAvailable):
        registry.get_publisher("myspace")
