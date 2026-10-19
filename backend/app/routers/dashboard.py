"""Overzichtscijfers voor het dashboard."""

from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import CurrentUser, get_current_user
from app.config import Settings, get_settings
from app.database import get_db, utcnow
from app.models import Brand, Post, PostStatus
from app.schemas import DashboardOut
from app.services import posts as post_service

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    own_posts = select(Post).join(Brand).where(Brand.user_id == user.id)
    now = utcnow()

    def count(query) -> int:
        return db.scalar(select(func.count()).select_from(query.subquery())) or 0

    upcoming_query = own_posts.where(Post.scheduled_at >= now, Post.scheduled_at < now + timedelta(days=7))

    return DashboardOut(
        brands=db.scalar(select(func.count(Brand.id)).where(Brand.user_id == user.id)) or 0,
        concept=count(own_posts.where(Post.status == PostStatus.CONCEPT)),
        approved_unscheduled=count(own_posts.where(Post.status == PostStatus.APPROVED, Post.scheduled_at.is_(None))),
        scheduled_upcoming=count(own_posts.where(Post.scheduled_at >= now)),
        rejected=count(own_posts.where(Post.status == PostStatus.REJECTED)),
        generations_today=post_service.generations_last_24h(db, user),
        generation_daily_limit=settings.generation_daily_limit,
        upcoming=[post_service.to_out(p) for p in db.scalars(upcoming_query.order_by(Post.scheduled_at).limit(6))],
        recent_concepts=[
            post_service.to_out(p)
            for p in db.scalars(
                own_posts.where(Post.status == PostStatus.CONCEPT).order_by(Post.created_at.desc()).limit(4)
            )
        ],
    )
