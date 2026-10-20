"""Databasemodellen. Codes (status, platform) zijn Engelse strings; de frontend vertaalt ze."""

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import JSON, ForeignKey, Integer, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, UTCDateTime, utcnow


class Platform(StrEnum):
    INSTAGRAM = "instagram"
    LINKEDIN = "linkedin"
    TIKTOK = "tiktok"
    X = "x"
    FACEBOOK = "facebook"


class PostStatus(StrEnum):
    CONCEPT = "concept"
    APPROVED = "approved"
    REJECTED = "rejected"


class SourceType(StrEnum):
    NONE = "none"
    URL = "url"
    TEXT = "text"


class MediaKind(StrEnum):
    IMAGE = "image"
    VIDEO = "video"


class MediaStatus(StrEnum):
    PENDING = "pending"  # video wordt nog gemaakt
    READY = "ready"
    FAILED = "failed"


class VersionOrigin(StrEnum):
    GENERATED = "generated"
    EDITED = "edited"
    REGENERATED = "regenerated"


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)


class Brand(TimestampMixin, Base):
    """Merkprofiel; hoort bij één gebruiker (Supabase user id)."""

    __tablename__ = "brands"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, index=True)
    name: Mapped[str] = mapped_column(String(200))
    website_url: Mapped[str | None] = mapped_column(String(500))
    target_audience: Mapped[str] = mapped_column(Text, default="")
    tone_of_voice: Mapped[str] = mapped_column(Text, default="")
    usps: Mapped[list[str]] = mapped_column(JSON, default=list)
    colors: Mapped[list[str]] = mapped_column(JSON, default=list)
    logo_url: Mapped[str | None] = mapped_column(String(1000))
    avoid_terms: Mapped[list[str]] = mapped_column(JSON, default=list)
    content_language: Mapped[str] = mapped_column(String(5), default="nl")

    posts: Mapped[list["Post"]] = relationship(back_populates="brand", cascade="all, delete-orphan", passive_deletes=True)
    generation_runs: Mapped[list["GenerationRun"]] = relationship(
        back_populates="brand", cascade="all, delete-orphan", passive_deletes=True
    )
    social_accounts: Mapped[list["SocialAccount"]] = relationship(
        back_populates="brand", cascade="all, delete-orphan", passive_deletes=True
    )


class GenerationRun(Base):
    """Eén generatie-opdracht: bron, instructies en verbruik."""

    __tablename__ = "generation_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    brand_id: Mapped[int] = mapped_column(ForeignKey("brands.id", ondelete="CASCADE"), index=True)
    source_type: Mapped[str] = mapped_column(String(10), default=SourceType.NONE)
    source_url: Mapped[str | None] = mapped_column(String(1000))
    source_text: Mapped[str | None] = mapped_column(Text)
    instructions: Mapped[str | None] = mapped_column(Text)
    platforms: Mapped[list[str]] = mapped_column(JSON, default=list)
    model: Mapped[str] = mapped_column(String(100))
    input_tokens: Mapped[int] = mapped_column(Integer, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)

    brand: Mapped[Brand] = relationship(back_populates="generation_runs")


class Post(TimestampMixin, Base):
    """Een post voor één platform, met goedkeuringsstatus en optionele planning."""

    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    brand_id: Mapped[int] = mapped_column(ForeignKey("brands.id", ondelete="CASCADE"), index=True)
    generation_run_id: Mapped[int | None] = mapped_column(
        ForeignKey("generation_runs.id", ondelete="SET NULL"), index=True
    )
    platform: Mapped[str] = mapped_column(String(20), index=True)
    hook: Mapped[str] = mapped_column(Text, default="")
    body: Mapped[str] = mapped_column(Text, default="")
    hashtags: Mapped[list[str]] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(20), default=PostStatus.CONCEPT, index=True)
    scheduled_at: Mapped[datetime | None] = mapped_column(UTCDateTime, index=True)

    # Publicatie op het platform (fase 2)
    published_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    external_post_id: Mapped[str | None] = mapped_column(String(200))
    external_url: Mapped[str | None] = mapped_column(String(1000))
    publish_error: Mapped[str | None] = mapped_column(String(100))

    brand: Mapped[Brand] = relationship(back_populates="posts")
    versions: Mapped[list["PostVersion"]] = relationship(
        back_populates="post", cascade="all, delete-orphan", passive_deletes=True, order_by="PostVersion.id"
    )
    media: Mapped[list["PostMedia"]] = relationship(
        back_populates="post", cascade="all, delete-orphan", passive_deletes=True, order_by="PostMedia.id.desc()"
    )


class PostVersion(Base):
    """Eerdere versie van een post, zodat bewerken of opnieuw genereren niets kwijtmaakt."""

    __tablename__ = "post_versions"

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), index=True)
    hook: Mapped[str] = mapped_column(Text, default="")
    body: Mapped[str] = mapped_column(Text, default="")
    hashtags: Mapped[list[str]] = mapped_column(JSON, default=list)
    origin: Mapped[str] = mapped_column(String(20))
    instructions: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)

    post: Mapped[Post] = relationship(back_populates="versions")


class SocialAccount(TimestampMixin, Base):
    """Gekoppeld social-media-account van een merk. Tokens staan versleuteld opgeslagen."""

    __tablename__ = "social_accounts"
    __table_args__ = (UniqueConstraint("brand_id", "platform", name="uq_social_accounts_brand_platform"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    brand_id: Mapped[int] = mapped_column(ForeignKey("brands.id", ondelete="CASCADE"), index=True)
    platform: Mapped[str] = mapped_column(String(20))
    external_account_id: Mapped[str] = mapped_column(String(200))
    display_name: Mapped[str] = mapped_column(String(300), default="")
    avatar_url: Mapped[str | None] = mapped_column(String(1000))
    access_token_encrypted: Mapped[str] = mapped_column(Text)
    refresh_token_encrypted: Mapped[str | None] = mapped_column(Text)
    expires_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    scopes: Mapped[str] = mapped_column(String(500), default="")

    brand: Mapped[Brand] = relationship(back_populates="social_accounts")


class PostMedia(TimestampMixin, Base):
    """Gegenereerde afbeelding of video bij een post. Video's worden op de achtergrond gemaakt."""

    __tablename__ = "post_media"

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(10))
    status: Mapped[str] = mapped_column(String(10), default=MediaStatus.PENDING)
    url: Mapped[str | None] = mapped_column(String(1000))
    mime_type: Mapped[str | None] = mapped_column(String(50))
    aspect_ratio: Mapped[str] = mapped_column(String(10), default="1:1")
    prompt: Mapped[str] = mapped_column(Text, default="")
    instructions: Mapped[str | None] = mapped_column(Text)
    model: Mapped[str] = mapped_column(String(100), default="")
    # Naam van de langlopende taak bij de AI-dienst (alleen video)
    operation_name: Mapped[str | None] = mapped_column(String(300))
    error: Mapped[str | None] = mapped_column(String(100))

    post: Mapped[Post] = relationship(back_populates="media")
