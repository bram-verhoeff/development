"""Afbeeldingen en video's genereren bij een post, en de status van een video opvragen."""

import logging
import secrets
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import CurrentUser, get_current_user
from app.config import Settings, get_settings
from app.database import get_db, utcnow
from app.models import Brand, GenerationRun, MediaKind, MediaStatus, Platform, Post, PostMedia
from app.schemas import GenerateMediaIn, PostMediaOut
from app.services import posts as post_service
from app.services.ai.media import MediaGenerator, aspect_ratio, get_media_generator, media_prompt
from app.services.ai.writer import AIError
from app.services.storage import MEDIA_EXTENSIONS, LogoStorage, StorageError, get_media_storage

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/posts/{post_id}/media", tags=["media"])


def _owned_media(post: Post, media_id: int) -> PostMedia:
    media = next((m for m in post.media if m.id == media_id), None)
    if media is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "media_not_found")
    return media


def _videos_last_24h(db: Session, user: CurrentUser) -> int:
    since = utcnow() - timedelta(hours=24)
    return db.scalar(
        select(func.count(PostMedia.id))
        .join(Post)
        .join(Brand)
        .where(Brand.user_id == user.id, PostMedia.kind == MediaKind.VIDEO, PostMedia.created_at >= since)
    ) or 0


def _store(storage: LogoStorage, user: CurrentUser, post: Post, data: bytes, mime_type: str) -> str:
    ext = MEDIA_EXTENSIONS.get(mime_type, "bin")
    try:
        return storage.upload(f"{user.id}/{post.id}-{secrets.token_hex(6)}.{ext}", data, mime_type)
    except StorageError:
        logger.exception("Media-upload mislukt")
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "storage_failed")


@router.post("", response_model=PostMediaOut, status_code=status.HTTP_201_CREATED)
def generate_media(
    post_id: int,
    data: GenerateMediaIn,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    generator: MediaGenerator = Depends(get_media_generator),
    storage: LogoStorage = Depends(get_media_storage),
):
    """Afbeelding: direct klaar. Video: start op de achtergrond (status "pending"), vraag hem op met GET."""
    post = post_service.get_owned_post(post_id, db, user)
    post_service.ensure_within_limit(db, user, settings)
    kind = MediaKind(data.kind)
    if kind == MediaKind.VIDEO and _videos_last_24h(db, user) >= settings.video_daily_limit:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "video_limit_reached")

    ratio = aspect_ratio(kind, Platform(post.platform))
    prompt = media_prompt(kind, post.brand, post, data.instructions or None, settings)
    media = PostMedia(
        post=post,
        kind=kind,
        aspect_ratio=ratio,
        prompt=prompt,
        instructions=data.instructions or None,
        model=generator.image_model if kind == MediaKind.IMAGE else generator.video_model,
    )

    if kind == MediaKind.IMAGE:
        generated = generator.generate_image(prompt, ratio)
        media.url = _store(storage, user, post, generated.data, generated.mime_type)
        media.mime_type = generated.mime_type
        media.status = MediaStatus.READY
    else:
        media.operation_name = generator.start_video(prompt, ratio)
        media.status = MediaStatus.PENDING

    # Telt mee voor de daglimiet van AI-opdrachten
    db.add(GenerationRun(brand_id=post.brand_id, instructions=f"[{kind.value}] {data.instructions}".strip(), platforms=[post.platform], model=media.model))
    db.add(media)
    db.commit()
    return media


@router.get("/{media_id}", response_model=PostMediaOut)
def get_media(
    post_id: int,
    media_id: int,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
    generator: MediaGenerator = Depends(get_media_generator),
    storage: LogoStorage = Depends(get_media_storage),
):
    """Voor een video die nog gemaakt wordt: vraagt één keer de status op en rondt hem af als hij klaar is."""
    post = post_service.get_owned_post(post_id, db, user)
    media = _owned_media(post, media_id)
    if media.status != MediaStatus.PENDING or not media.operation_name:
        return media

    try:
        result = generator.check_video(media.operation_name)
    except AIError as e:
        # Tijdelijke storing: later opnieuw proberen; blijft "pending"
        if e.status >= 500 or e.status == 429:
            return media
        result = None
        media.status, media.error = MediaStatus.FAILED, e.code
    if result is not None and result.done:
        if result.error or result.file is None:
            media.status, media.error = MediaStatus.FAILED, result.error or "media_failed"
        else:
            media.url = _store(storage, user, post, result.file.data, result.file.mime_type)
            media.mime_type = result.file.mime_type
            media.status = MediaStatus.READY
    db.commit()
    return media


@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media(
    post_id: int,
    media_id: int,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
    storage: LogoStorage = Depends(get_media_storage),
):
    post = post_service.get_owned_post(post_id, db, user)
    media = _owned_media(post, media_id)
    url = media.url
    db.delete(media)
    db.commit()
    if url:
        try:
            storage.delete(url)
        except StorageError:
            logger.warning("Mediabestand kon niet verwijderd worden: %s", url)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
