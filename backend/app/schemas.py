"""Pydantic-schema's voor in- en uitvoer van de API."""

import re
from datetime import datetime
from typing import Annotated, Literal

from pydantic import (
    AfterValidator,
    AwareDatetime,
    BaseModel,
    ConfigDict,
    Field,
    HttpUrl,
    StringConstraints,
    field_validator,
    model_validator,
)

from app.models import Platform, PostStatus, SourceType, VersionOrigin

HEX_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")


def _clean_list(values: list[str]) -> list[str]:
    """Spaties weg, lege items weg, dubbele weg (hoofdletterongevoelig, volgorde blijft)."""
    result, seen = [], set()
    for value in (v.strip() for v in values):
        if value and value.lower() not in seen:
            seen.add(value.lower())
            result.append(value)
    return result


CleanList = Annotated[list[Annotated[str, Field(max_length=300)]], Field(max_length=30), AfterValidator(_clean_list)]


class BrandIn(BaseModel):
    """Velden die je bij aanmaken en bewerken van een merk invult."""

    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
    website_url: HttpUrl | None = None
    target_audience: Annotated[str, StringConstraints(strip_whitespace=True, max_length=4000)] = ""
    tone_of_voice: Annotated[str, StringConstraints(strip_whitespace=True, max_length=4000)] = ""
    usps: CleanList = []
    colors: CleanList = []
    avoid_terms: CleanList = []
    content_language: Literal["nl", "en"] = "nl"

    @field_validator("colors")
    @classmethod
    def _hex_colors(cls, colors: list[str]) -> list[str]:
        for color in colors:
            if not HEX_COLOR.match(color):
                raise ValueError(f"Geen geldige kleur (verwacht #RRGGBB): {color}")
        return [c.upper() for c in colors]


class BrandOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    website_url: str | None
    target_audience: str
    tone_of_voice: str
    usps: list[str]
    colors: list[str]
    avoid_terms: list[str]
    content_language: str
    logo_url: str | None
    created_at: datetime
    updated_at: datetime


# ---------- Posts ----------

Text = Annotated[str, StringConstraints(strip_whitespace=True, max_length=10_000)]
Hashtag = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100, pattern=r"^#\S+$")]


class PostWarning(BaseModel):
    code: str
    length: int | None = None
    max: int | None = None
    count: int | None = None
    terms: list[str] | None = None


class PostOut(BaseModel):
    id: int
    brand_id: int
    brand_name: str
    platform: Platform
    hook: str
    body: str
    hashtags: list[str]
    status: PostStatus
    scheduled_at: datetime | None
    created_at: datetime
    updated_at: datetime
    char_count: int
    max_chars: int
    warnings: list[PostWarning]
    published_at: datetime | None = None
    external_url: str | None = None
    publish_error: str | None = None
    # Wanneer de scheduler het na een tijdelijke fout opnieuw probeert
    next_attempt_at: datetime | None = None
    # Eerste klare afbeelding (of video) voor in overzichten
    thumbnail_url: str | None = None
    thumbnail_kind: str | None = None


class PostVersionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    hook: str
    body: str
    hashtags: list[str]
    origin: VersionOrigin
    instructions: str | None
    created_at: datetime


class PostMediaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kind: str
    status: str
    url: str | None
    mime_type: str | None
    aspect_ratio: str
    instructions: str | None
    error: str | None
    created_at: datetime


class GenerateMediaIn(BaseModel):
    kind: Literal["image", "video"]
    instructions: Annotated[str, StringConstraints(strip_whitespace=True, max_length=1000)] = ""


class PostDetailOut(PostOut):
    versions: list[PostVersionOut]
    media: list[PostMediaOut] = []
    # Gekoppeld account voor het platform van deze post (nodig om te publiceren)
    connection: "ConnectionOut | None" = None


class PostUpdateIn(BaseModel):
    hook: Text
    body: Text
    hashtags: Annotated[list[Hashtag], Field(max_length=30)] = []


class PostStatusIn(BaseModel):
    status: PostStatus


class PostScheduleIn(BaseModel):
    # Met tijdzone verplicht, zodat er nooit verwarring is over het moment
    scheduled_at: AwareDatetime | None


class RegenerateIn(BaseModel):
    instructions: Annotated[str, StringConstraints(strip_whitespace=True, max_length=2000)] = ""


# ---------- Genereren ----------


class GenerateIn(BaseModel):
    brand_id: int
    platforms: Annotated[list[Platform], Field(min_length=1, max_length=5)]
    posts_per_platform: Annotated[int, Field(ge=1, le=5)] = 3
    source_type: SourceType = SourceType.NONE
    source_url: HttpUrl | None = None
    source_text: Annotated[str, StringConstraints(strip_whitespace=True, max_length=20_000)] | None = None
    instructions: Annotated[str, StringConstraints(strip_whitespace=True, max_length=2000)] | None = None

    @field_validator("platforms")
    @classmethod
    def _unique(cls, platforms: list[Platform]) -> list[Platform]:
        return list(dict.fromkeys(platforms))

    @model_validator(mode="after")
    def _source_present(self):
        if self.source_type == SourceType.URL and not self.source_url:
            raise ValueError("source_url is verplicht bij source_type 'url'")
        if self.source_type == SourceType.TEXT and not self.source_text:
            raise ValueError("source_text is verplicht bij source_type 'text'")
        return self


class GenerateOut(BaseModel):
    run_id: int
    posts: list[PostOut]


# ---------- Dashboard ----------


class DashboardOut(BaseModel):
    brands: int
    concept: int
    approved_unscheduled: int
    scheduled_upcoming: int
    rejected: int
    generations_today: int
    generation_daily_limit: int
    upcoming: list[PostOut]
    recent_concepts: list[PostOut]


# ---------- Koppelingen ----------


class ConnectionOut(BaseModel):
    platform: Platform
    display_name: str
    avatar_url: str | None
    expires_at: datetime | None
    expired: bool
    connected_at: datetime


class AvailablePlatformOut(BaseModel):
    platform: Platform
    supported: bool  # al gebouwd in PostPilot
    configured: bool  # client-ID/geheim ingesteld in de backend


class ConnectionsOut(BaseModel):
    platforms: list[AvailablePlatformOut]
    connections: list[ConnectionOut]


class ConnectStartOut(BaseModel):
    authorization_url: str


PostDetailOut.model_rebuild()
