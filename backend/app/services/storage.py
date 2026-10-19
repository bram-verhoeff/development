"""Opslag van logo's in Supabase Storage (publieke bucket), achter een kleine interface."""

import secrets
from typing import Protocol

import httpx
from fastapi import Depends

from app.config import Settings, get_settings

EXTENSIONS = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}
MAX_LOGO_BYTES = 2 * 1024 * 1024


def detect_image_type(data: bytes) -> str | None:
    """Herkent PNG/JPEG/WebP aan de eerste bytes (niet aan wat de browser beweert).

    Geen SVG: dat kan scripts bevatten.
    """
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        return "image/webp"
    return None


def logo_path(user_id: str, brand_id: int, content_type: str) -> str:
    # Willekeurig achtervoegsel, zodat een nieuw logo nooit uit een oude cache komt
    return f"{user_id}/{brand_id}-{secrets.token_hex(6)}.{EXTENSIONS[content_type]}"


class StorageError(Exception):
    pass


class LogoStorage(Protocol):
    def upload(self, path: str, data: bytes, content_type: str) -> str:
        """Slaat het bestand op en geeft de publieke URL terug."""

    def delete(self, url: str) -> None:
        """Verwijdert het bestand achter deze publieke URL (stil als het er niet is)."""


class SupabaseStorage:
    def __init__(self, settings: Settings):
        self.base = f"{settings.supabase_url.rstrip('/')}/storage/v1"
        self.bucket = settings.storage_bucket
        self.headers = {
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
        }

    @property
    def public_prefix(self) -> str:
        return f"{self.base}/object/public/{self.bucket}/"

    def upload(self, path: str, data: bytes, content_type: str) -> str:
        response = httpx.post(
            f"{self.base}/object/{self.bucket}/{path}",
            content=data,
            headers=self.headers | {"Content-Type": content_type, "x-upsert": "true"},
            timeout=30,
        )
        if response.status_code >= 400:
            raise StorageError(f"Upload mislukt ({response.status_code}): {response.text[:200]}")
        return self.public_prefix + path

    def delete(self, url: str) -> None:
        if not url.startswith(self.public_prefix):
            return  # niet van ons
        path = url.removeprefix(self.public_prefix)
        response = httpx.request(
            "DELETE",
            f"{self.base}/object/{self.bucket}",
            json={"prefixes": [path]},
            headers=self.headers,
            timeout=30,
        )
        if response.status_code >= 400:
            raise StorageError(f"Verwijderen mislukt ({response.status_code}): {response.text[:200]}")

    def ensure_bucket(self) -> bool:
        """Maakt de publieke bucket aan als die nog niet bestaat. Geeft True als hij nieuw is."""
        response = httpx.get(f"{self.base}/bucket/{self.bucket}", headers=self.headers, timeout=30)
        if response.status_code == 200:
            return False
        response = httpx.post(
            f"{self.base}/bucket",
            json={
                "id": self.bucket,
                "name": self.bucket,
                "public": True,
                "file_size_limit": MAX_LOGO_BYTES,
                "allowed_mime_types": list(EXTENSIONS),
            },
            headers=self.headers,
            timeout=30,
        )
        if response.status_code >= 400:
            raise StorageError(f"Bucket aanmaken mislukt ({response.status_code}): {response.text[:200]}")
        return True


def get_storage(settings: Settings = Depends(get_settings)) -> LogoStorage:
    """FastAPI-dependency; tests vervangen dit door een opslag in het geheugen."""
    return SupabaseStorage(settings)
