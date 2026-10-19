"""CRUD voor merken. Elke gebruiker ziet en wijzigt alleen zijn eigen merken."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import CurrentUser, get_current_user
from app.database import get_db
from app.models import Brand
from app.schemas import BrandIn, BrandOut
from app.services.storage import (
    MAX_LOGO_BYTES,
    LogoStorage,
    StorageError,
    detect_image_type,
    get_storage,
    logo_path,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/brands", tags=["brands"])


def get_owned_brand(brand_id: int, db: Session, user: CurrentUser) -> Brand:
    """Haalt een merk op; 404 als het niet bestaat óf van iemand anders is (lekt geen bestaan)."""
    brand = db.get(Brand, brand_id)
    if brand is None or brand.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "brand_not_found")
    return brand


def _apply(brand: Brand, data: BrandIn) -> None:
    values = data.model_dump()
    values["website_url"] = str(data.website_url) if data.website_url else None
    for field, value in values.items():
        setattr(brand, field, value)


def _delete_logo_quietly(storage: LogoStorage, url: str | None) -> None:
    # Een achtergebleven bestand is geen reden om de actie te laten mislukken
    if not url:
        return
    try:
        storage.delete(url)
    except StorageError:
        logger.warning("Oud logo kon niet verwijderd worden: %s", url)


@router.get("", response_model=list[BrandOut])
def list_brands(db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    return db.scalars(select(Brand).where(Brand.user_id == user.id).order_by(Brand.name)).all()


@router.post("", response_model=BrandOut, status_code=status.HTTP_201_CREATED)
def create_brand(data: BrandIn, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    brand = Brand(user_id=user.id)
    _apply(brand, data)
    db.add(brand)
    db.commit()
    return brand


@router.get("/{brand_id}", response_model=BrandOut)
def get_brand(brand_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    return get_owned_brand(brand_id, db, user)


@router.put("/{brand_id}", response_model=BrandOut)
def update_brand(
    brand_id: int, data: BrandIn, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)
):
    brand = get_owned_brand(brand_id, db, user)
    _apply(brand, data)
    db.commit()
    return brand


@router.delete("/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_brand(
    brand_id: int,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
    storage: LogoStorage = Depends(get_storage),
):
    brand = get_owned_brand(brand_id, db, user)
    logo_url = brand.logo_url
    db.delete(brand)  # posts en generaties gaan mee (cascade)
    db.commit()
    _delete_logo_quietly(storage, logo_url)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{brand_id}/logo", response_model=BrandOut)
def upload_logo(
    brand_id: int,
    file: UploadFile,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
    storage: LogoStorage = Depends(get_storage),
):
    brand = get_owned_brand(brand_id, db, user)

    data = file.file.read(MAX_LOGO_BYTES + 1)
    if len(data) > MAX_LOGO_BYTES:
        raise HTTPException(413, "logo_too_large")
    content_type = detect_image_type(data)
    if content_type is None:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "logo_invalid_type")

    try:
        new_url = storage.upload(logo_path(str(user.id), brand.id, content_type), data, content_type)
    except StorageError:
        logger.exception("Logo-upload mislukt")
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "storage_failed")

    old_url, brand.logo_url = brand.logo_url, new_url
    db.commit()
    _delete_logo_quietly(storage, old_url)
    return brand


@router.delete("/{brand_id}/logo", response_model=BrandOut)
def delete_logo(
    brand_id: int,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
    storage: LogoStorage = Depends(get_storage),
):
    brand = get_owned_brand(brand_id, db, user)
    old_url, brand.logo_url = brand.logo_url, None
    db.commit()
    _delete_logo_quietly(storage, old_url)
    return brand
