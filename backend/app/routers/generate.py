"""Posts laten genereren door Claude op basis van een merkprofiel en optionele bron."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth import CurrentUser, get_current_user
from app.config import Settings, get_settings
from app.database import get_db
from app.models import GenerationRun, Platform, Post, SourceType, VersionOrigin
from app.routers.brands import get_owned_brand
from app.schemas import GenerateIn, GenerateOut
from app.services import connections as connection_service
from app.services import posts as post_service
from app.services.ai.writer import BaseWriter, get_writer
from app.services.source_fetcher import fetch_source_text

router = APIRouter(tags=["generate"])


@router.post("/generate", response_model=GenerateOut, status_code=status.HTTP_201_CREATED)
def generate(
    data: GenerateIn,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    writer: BaseWriter = Depends(get_writer),
):
    brand = get_owned_brand(data.brand_id, db, user)
    post_service.ensure_within_limit(db, user, settings)

    # Bron bepalen: opgehaalde webpagina of geplakte tekst
    source_url = str(data.source_url) if data.source_type == SourceType.URL else None
    if source_url:
        source_text = fetch_source_text(source_url)
    elif data.source_type == SourceType.TEXT:
        source_text = data.source_text
    else:
        source_text = None

    result = writer.generate(brand, data.platforms, data.posts_per_platform, source_text, data.instructions)

    run = GenerationRun(
        brand=brand,
        source_type=data.source_type,
        source_url=source_url,
        source_text=source_text,
        instructions=data.instructions,
        platforms=list(data.platforms),
        model=result.usage.model,
        input_tokens=result.usage.input_tokens,
        output_tokens=result.usage.output_tokens,
    )
    db.add(run)
    db.flush()  # run.id beschikbaar maken

    # LinkedIn-posts komen standaard op de standaardpagina van het merk (anders je eigen profiel)
    page = connection_service.default_page(brand)
    created: list[Post] = []
    for platform in data.platforms:  # volgorde zoals gekozen
        for draft in result.posts.get(platform, []):
            post = Post(brand=brand, platform=platform, generation_run_id=run.id)
            if platform == Platform.LINKEDIN and page:
                post.publish_as = page.external_id
            post_service.set_content(post, draft.hook, draft.body, draft.hashtags, VersionOrigin.GENERATED)
            db.add(post)
            created.append(post)
    db.commit()

    return GenerateOut(run_id=run.id, posts=[post_service.to_out(p) for p in created])
