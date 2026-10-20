"""Posts bekijken, bewerken, goedkeuren/afwijzen, herschrijven en inplannen."""

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import CurrentUser, get_current_user
from app.config import Settings, get_settings
from app.database import get_db, utcnow
from app.models import Brand, GenerationRun, Platform, Post, PostStatus, VersionOrigin
from app.schemas import (
    PostDetailOut,
    PostOut,
    PostScheduleIn,
    PostStatusIn,
    PostUpdateIn,
    RegenerateIn,
)
from app.services import posts as post_service
from app.services import publishing, scheduler
from app.services.ai.writer import BaseWriter, get_writer

router = APIRouter(prefix="/posts", tags=["posts"])

# Een klein beetje speling, zodat "nu" inplannen niet faalt door klokverschil
SCHEDULE_GRACE = timedelta(minutes=5)

# Foutcodes van publiceren die geen platformfout (502) zijn
PUBLISH_ERROR_STATUS = {
    "not_connected": status.HTTP_409_CONFLICT,
    "connection_expired": status.HTTP_409_CONFLICT,
    "platform_not_supported": status.HTTP_501_NOT_IMPLEMENTED,
    "secret_not_configured": status.HTTP_503_SERVICE_UNAVAILABLE,
}


@router.get("", response_model=list[PostOut])
def list_posts(
    brand_id: int | None = None,
    generation_run_id: int | None = None,
    platform: list[Platform] = Query(default=[]),
    status_: list[PostStatus] = Query(default=[], alias="status"),
    scheduled: bool | None = None,
    start: datetime | None = Query(default=None, description="Ingepland vanaf (met tijdzone)"),
    end: datetime | None = Query(default=None, description="Ingepland tot (met tijdzone)"),
    limit: int = Query(default=200, ge=1, le=500),
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    query = select(Post).join(Brand).where(Brand.user_id == user.id)
    if brand_id is not None:
        query = query.where(Post.brand_id == brand_id)
    if generation_run_id is not None:
        query = query.where(Post.generation_run_id == generation_run_id)
    if platform:
        query = query.where(Post.platform.in_(platform))
    if status_:
        query = query.where(Post.status.in_(status_))
    if scheduled is not None:
        query = query.where(Post.scheduled_at.is_not(None) if scheduled else Post.scheduled_at.is_(None))
    if start is not None:
        query = query.where(Post.scheduled_at >= start)
    if end is not None:
        query = query.where(Post.scheduled_at < end)

    # Ingeplande posts op volgorde van moment, de rest nieuwste eerst
    order = Post.scheduled_at.asc() if (scheduled or start or end) else Post.created_at.desc()
    posts = db.scalars(query.order_by(order, Post.id.desc()).limit(limit)).all()
    return [post_service.to_out(p) for p in posts]


@router.get("/{post_id}", response_model=PostDetailOut)
def get_post(post_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    return post_service.to_detail(post_service.get_owned_post(post_id, db, user))


@router.patch("/{post_id}", response_model=PostDetailOut)
def update_post(
    post_id: int, data: PostUpdateIn, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)
):
    """Tekst zelf aanpassen. De status blijft gelijk: jij hebt het zelf geschreven."""
    post = post_service.get_owned_post(post_id, db, user)
    hashtags = list(dict.fromkeys(data.hashtags))
    post_service.set_content(post, data.hook, data.body, hashtags, VersionOrigin.EDITED)
    db.commit()
    return post_service.to_detail(post)


@router.post("/{post_id}/status", response_model=PostDetailOut)
def set_status(
    post_id: int, data: PostStatusIn, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)
):
    post = post_service.get_owned_post(post_id, db, user)
    post.status = data.status
    if data.status != PostStatus.APPROVED:
        post.scheduled_at = None  # alleen goedgekeurde posts staan in de kalender
    db.commit()
    return post_service.to_detail(post)


@router.put("/{post_id}/schedule", response_model=PostDetailOut)
def schedule_post(
    post_id: int, data: PostScheduleIn, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)
):
    post = post_service.get_owned_post(post_id, db, user)
    if data.scheduled_at is not None:
        if post.status != PostStatus.APPROVED:
            raise HTTPException(status.HTTP_409_CONFLICT, "post_not_approved")
        if data.scheduled_at < utcnow() - SCHEDULE_GRACE:
            raise HTTPException(422, "schedule_in_past")
    post.scheduled_at = data.scheduled_at.astimezone(UTC) if data.scheduled_at else None
    scheduler.reset_attempts(post)
    db.commit()
    return post_service.to_detail(post)


@router.post("/{post_id}/regenerate", response_model=PostDetailOut)
def regenerate_post(
    post_id: int,
    data: RegenerateIn,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    writer: BaseWriter = Depends(get_writer),
):
    """Laat Claude de post herschrijven. Nieuwe tekst = opnieuw beoordelen, dus terug naar concept."""
    post = post_service.get_owned_post(post_id, db, user)
    post_service.ensure_within_limit(db, user, settings)

    result = writer.regenerate(
        post.brand, Platform(post.platform), post.hook, post.body, post.hashtags, data.instructions
    )
    db.add(
        GenerationRun(
            brand_id=post.brand_id,
            instructions=data.instructions or None,
            platforms=[post.platform],
            model=result.usage.model,
            input_tokens=result.usage.input_tokens,
            output_tokens=result.usage.output_tokens,
        )
    )
    draft = result.post
    post_service.set_content(
        post, draft.hook, draft.body, draft.hashtags, VersionOrigin.REGENERATED, data.instructions or None
    )
    post.status = PostStatus.CONCEPT
    post.scheduled_at = None
    db.commit()
    return post_service.to_detail(post)


@router.post("/{post_id}/versions/{version_id}/restore", response_model=PostDetailOut)
def restore_version(
    post_id: int, version_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)
):
    post = post_service.get_owned_post(post_id, db, user)
    version = next((v for v in post.versions if v.id == version_id), None)
    if version is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "version_not_found")
    post_service.set_content(post, version.hook, version.body, list(version.hashtags), VersionOrigin.EDITED)
    db.commit()
    return post_service.to_detail(post)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    db.delete(post_service.get_owned_post(post_id, db, user))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{post_id}/publish", response_model=PostDetailOut)
def publish_post(
    post_id: int,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Plaatst een goedgekeurde post nu meteen op het gekoppelde account."""
    post = post_service.get_owned_post(post_id, db, user)
    if post.status != PostStatus.APPROVED:
        raise HTTPException(status.HTTP_409_CONFLICT, "post_not_approved")
    if post.published_at is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "already_published")
    # Vergrendelen, zodat de scheduler deze post niet tegelijk ook plaatst
    if not publishing.claim(db, post.id, utcnow()):
        raise HTTPException(status.HTTP_409_CONFLICT, "publish_in_progress")
    db.refresh(post)
    try:
        result = publishing.attempt_publish(db, post, settings)
        if result.success:
            return post_service.to_detail(post)
        raise HTTPException(PUBLISH_ERROR_STATUS.get(result.error, status.HTTP_502_BAD_GATEWAY), result.error or "publish_failed")
    finally:
        publishing.release(db, post)
