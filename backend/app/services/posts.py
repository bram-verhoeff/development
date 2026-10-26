"""Gedeelde logica voor posts: omzetten naar API-vorm, versies bijhouden, verbruikslimiet."""

from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import CurrentUser
from app.config import Settings
from app.database import utcnow
from app.models import Brand, GenerationRun, MediaStatus, Platform, Post, PostVersion, VersionOrigin
from app.schemas import PostDetailOut, PostMediaOut, PostOut, PostVersionOut, PublishOptionOut
from app.services import connections as connection_service
from app.services.social.registry import LINKEDIN_PAGES
from app.services.ai.platforms import RULES, full_text
from app.services.checks import post_warnings


def to_out(post: Post) -> PostOut:
    return PostOut(
        id=post.id,
        brand_id=post.brand_id,
        brand_name=post.brand.name,
        platform=post.platform,
        hook=post.hook,
        body=post.body,
        hashtags=post.hashtags,
        status=post.status,
        scheduled_at=post.scheduled_at,
        created_at=post.created_at,
        updated_at=post.updated_at,
        char_count=len(full_text(post.hook, post.body, post.hashtags)),
        max_chars=RULES[Platform(post.platform)].max_chars,
        warnings=post_warnings(post.platform, post.hook, post.body, post.hashtags, post.brand),
        published_at=post.published_at,
        external_url=post.external_url,
        publish_error=post.publish_error,
        next_attempt_at=post.next_attempt_at,
        publish_as=post.publish_as,
        **_thumbnail(post),
    )


def _thumbnail(post: Post) -> dict:
    ready = next((m for m in post.media if m.status == MediaStatus.READY), None)
    return {"thumbnail_url": ready.url, "thumbnail_kind": ready.kind} if ready else {}


def to_detail(post: Post) -> PostDetailOut:
    versions = [PostVersionOut.model_validate(v) for v in reversed(post.versions)]  # nieuwste eerst
    accounts = {a.platform: a for a in post.brand.social_accounts}
    as_page = post.platform == Platform.LINKEDIN and post.publish_as
    account = accounts.get(LINKEDIN_PAGES if as_page else post.platform)
    connection = connection_service.to_out(account) if account else None
    media = [PostMediaOut.model_validate(m) for m in post.media]

    label = account.display_name if account else None
    if as_page:
        page = next((p for p in account.pages if p.external_id == post.publish_as), None) if account else None
        label = page.name if page else None

    options: list[PublishOptionOut] = []
    if post.platform == Platform.LINKEDIN:
        profile = accounts.get(Platform.LINKEDIN)
        options.append(
            PublishOptionOut(
                value=None,
                label=profile.display_name if profile else "",
                kind="profile",
                avatar_url=profile.avatar_url if profile else None,
            )
        )
        pages = accounts[LINKEDIN_PAGES].pages if LINKEDIN_PAGES in accounts else []
        options += [PublishOptionOut(value=p.external_id, label=p.name, kind="page", avatar_url=p.avatar_url) for p in pages]

    return PostDetailOut(
        **to_out(post).model_dump(),
        versions=versions,
        connection=connection,
        media=media,
        publish_as_label=label,
        publish_options=options,
    )


def set_content(
    post: Post, hook: str, body: str, hashtags: list[str], origin: VersionOrigin, instructions: str | None = None
) -> None:
    """Zet nieuwe tekst en bewaart die als versie, zodat de geschiedenis compleet blijft."""
    post.hook, post.body, post.hashtags = hook, body, hashtags
    post.versions.append(
        PostVersion(hook=hook, body=body, hashtags=hashtags, origin=origin, instructions=instructions)
    )


def get_owned_post(post_id: int, db: Session, user: CurrentUser) -> Post:
    post = db.get(Post, post_id)
    if post is None or post.brand.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "post_not_found")
    return post


def generations_last_24h(db: Session, user: CurrentUser) -> int:
    since = utcnow() - timedelta(hours=24)
    return db.scalar(
        select(func.count(GenerationRun.id))
        .join(Brand)
        .where(Brand.user_id == user.id, GenerationRun.created_at >= since)
    ) or 0


def ensure_within_limit(db: Session, user: CurrentUser, settings: Settings) -> None:
    if generations_last_24h(db, user) >= settings.generation_daily_limit:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "generation_limit_reached")
