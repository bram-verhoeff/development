import uuid
from datetime import UTC, datetime, timedelta, timezone

import pytest
from sqlalchemy import select
from sqlalchemy.exc import StatementError

from app.models import Brand, Post, PostStatus, PostVersion


def make_brand(db, **kwargs) -> Brand:
    brand = Brand(user_id=uuid.uuid4(), name="Testmerk", **kwargs)
    db.add(brand)
    db.commit()
    return brand


def test_brand_defaults(db):
    brand = make_brand(db)
    assert brand.usps == [] and brand.colors == [] and brand.avoid_terms == []
    assert brand.content_language == "nl"
    assert brand.created_at.tzinfo is not None


def test_post_defaults_to_concept(db):
    brand = make_brand(db)
    post = Post(brand_id=brand.id, platform="instagram", body="Hallo", hashtags=["#test"])
    db.add(post)
    db.commit()
    assert post.status == PostStatus.CONCEPT
    assert post.scheduled_at is None


def test_scheduled_at_roundtrip_is_utc(db):
    brand = make_brand(db)
    amsterdam = timezone(timedelta(hours=2))
    planned = datetime(2026, 11, 3, 9, 30, tzinfo=amsterdam)
    db.add(Post(brand_id=brand.id, platform="linkedin", scheduled_at=planned))
    db.commit()
    db.expunge_all()

    loaded = db.scalars(select(Post)).one()
    assert loaded.scheduled_at == planned
    assert loaded.scheduled_at.tzinfo == UTC


def test_naive_datetime_is_rejected(db):
    brand = make_brand(db)
    db.add(Post(brand_id=brand.id, platform="x", scheduled_at=datetime(2026, 11, 3, 9, 30)))
    with pytest.raises(StatementError):
        db.commit()


def test_deleting_brand_cascades(db):
    brand = make_brand(db)
    post = Post(brand_id=brand.id, platform="tiktok", body="v2")
    post.versions.append(PostVersion(body="v1", origin="generated"))
    db.add(post)
    db.commit()

    db.delete(brand)
    db.commit()
    assert db.scalars(select(Post)).all() == []
    assert db.scalars(select(PostVersion)).all() == []
