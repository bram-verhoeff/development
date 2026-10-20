"""Plaatst ingeplande, goedgekeurde posts zodra hun tijd is aangebroken.

Wordt elke minuut aangeroepen via `/internal/run-scheduler` (cronjob). Elke run is los van de vorige:
er draait geen proces dat altijd aan moet staan. Dubbel plaatsen is uitgesloten door `publishing.claim`.
"""

import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta

from sqlalchemy import ColumnElement, or_, select
from sqlalchemy.orm import Session

from app.config import Settings
from app.database import utcnow
from app.models import Post, PostStatus
from app.services import publishing

logger = logging.getLogger(__name__)

MAX_ATTEMPTS = 5
# Wachttijd na de 1e, 2e, 3e en 4e mislukte poging (bij tijdelijke fouten)
BACKOFF = [timedelta(minutes=2), timedelta(minutes=10), timedelta(minutes=30), timedelta(hours=2)]
BATCH_SIZE = 25
# Ruim binnen een minuut stoppen, zodat runs elkaar niet inhalen
TIME_BUDGET_SECONDS = 45


@dataclass
class RunSummary:
    published: list[int] = field(default_factory=list)
    retrying: list[int] = field(default_factory=list)
    failed: list[int] = field(default_factory=list)


def _due(now: datetime) -> list[ColumnElement[bool]]:
    """Voorwaarden voor een post die nu geplaatst moet worden."""
    return [
        Post.status == PostStatus.APPROVED,
        Post.published_at.is_(None),
        Post.scheduled_at.is_not(None),
        Post.scheduled_at <= now,
        Post.publish_attempts < MAX_ATTEMPTS,
        or_(Post.next_attempt_at.is_(None), Post.next_attempt_at <= now),
    ]


def backoff(attempts: int) -> timedelta:
    return BACKOFF[min(attempts, len(BACKOFF)) - 1]


def run_due(db: Session, settings: Settings, now: datetime | None = None) -> RunSummary:
    now = now or utcnow()
    started = time.monotonic()
    summary = RunSummary()
    post_ids = db.scalars(select(Post.id).where(*_due(now)).order_by(Post.scheduled_at).limit(BATCH_SIZE)).all()

    for post_id in post_ids:
        if time.monotonic() - started > TIME_BUDGET_SECONDS:
            break  # de rest komt bij de volgende run
        # Opnieuw controleren bij het vergrendelen: de gebruiker kan intussen iets gewijzigd hebben
        if not publishing.claim(db, post_id, now, *_due(now)):
            continue
        post = db.get(Post, post_id, populate_existing=True)
        try:
            result = publishing.attempt_publish(db, post, settings)
            if result.success:
                summary.published.append(post_id)
                continue
            post.publish_attempts += 1
            if result.retryable and post.publish_attempts < MAX_ATTEMPTS:
                post.next_attempt_at = now + backoff(post.publish_attempts)
                summary.retrying.append(post_id)
            else:
                # Blijvende fout (bijv. koppeling verlopen): niet blijven proberen
                post.publish_attempts = MAX_ATTEMPTS
                post.next_attempt_at = None
                summary.failed.append(post_id)
                logger.warning("Post %s niet geplaatst: %s", post_id, post.publish_error)
        finally:
            publishing.release(db, post)

    return summary


def reset_attempts(post: Post) -> None:
    """Na opnieuw inplannen of handmatig plaatsen begint de scheduler weer met een schone lei."""
    post.publish_attempts = 0
    post.next_attempt_at = None
    post.publish_error = None
