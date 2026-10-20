"""Eén post plaatsen op het gekoppelde account. Gedeeld door "Nu plaatsen" en de scheduler."""

import logging
from datetime import datetime, timedelta

from sqlalchemy import ColumnElement, or_, update
from sqlalchemy.orm import Session

from app.config import Settings
from app.database import utcnow
from app.models import Post
from app.publishers import registry as publisher_registry
from app.publishers.base import PublishResult
from app.services import connections as connection_service
from app.services.crypto import CryptoError
from app.services.social.base import SocialError

logger = logging.getLogger(__name__)

# Een vergrendeling die zo lang bestaat, hoort bij een vastgelopen poging en mag worden overgenomen
LOCK_TIMEOUT = timedelta(minutes=10)


def claim(db: Session, post_id: int, now: datetime, *conditions: ColumnElement[bool]) -> bool:
    """Vergrendelt de post in één atomaire update, zodat hij nooit dubbel geplaatst wordt.

    Lukt alleen als de post nog niet online staat, niemand anders er al mee bezig is
    en aan de extra voorwaarden voldoet. Geeft True als deze aanroep de post heeft.
    """
    result = db.execute(
        update(Post)
        .where(
            Post.id == post_id,
            Post.published_at.is_(None),
            or_(Post.publishing_started_at.is_(None), Post.publishing_started_at < now - LOCK_TIMEOUT),
            *conditions,
        )
        .values(publishing_started_at=now)
        .execution_options(synchronize_session=False)
    )
    db.commit()
    return result.rowcount == 1


def release(db: Session, post: Post) -> None:
    post.publishing_started_at = None
    db.commit()


def attempt_publish(db: Session, post: Post, settings: Settings) -> PublishResult:
    """Plaatst een (vergrendelde) post en werkt de publicatievelden bij.

    Gooit geen uitzonderingen voor platform- of koppelingsfouten: die komen als foutcode terug.
    """
    result = _publish(db, post, settings)
    if result.success:
        post.published_at = utcnow()
        post.external_post_id = result.external_id
        post.external_url = result.url
        post.publish_error = None
        post.publish_attempts = 0
        post.next_attempt_at = None
        post.scheduled_at = None  # staat nu online; niet meer "gepland"
    else:
        post.publish_error = result.error or "publish_failed"
    db.commit()
    return result


def _publish(db: Session, post: Post, settings: Settings) -> PublishResult:
    account = connection_service.get_account(db, post.brand_id, post.platform)
    if account is None:
        return PublishResult(success=False, error="not_connected")
    if connection_service.is_expired(account):
        return PublishResult(success=False, error="connection_expired")
    try:
        publisher = publisher_registry.get_publisher(post.platform)
    except publisher_registry.PublisherNotAvailable:
        return PublishResult(success=False, error="platform_not_supported")

    try:
        # Ververst het token eerst als dat nodig is (X: elke 2 uur, TikTok: elke dag)
        credentials = connection_service.fresh_credentials(db, account, settings)
        return publisher.publish(post, credentials)
    except SocialError as exc:
        return PublishResult(success=False, error=exc.code, retryable=exc.status >= 500)
    except CryptoError:
        return PublishResult(success=False, error="secret_not_configured")
    except Exception:
        # Onverwachte fout (netwerk, bug in een publisher): later opnieuw proberen
        logger.exception("Publiceren van post %s mislukt", post.id)
        return PublishResult(success=False, error="publish_failed", retryable=True)
