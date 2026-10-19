"""Maakt de publieke bucket voor logo's aan in Supabase Storage (eenmalig per project).

Gebruik (in de map backend, met de virtuele omgeving actief):  python -m scripts.setup_storage
"""

from app.config import get_settings
from app.services.storage import SupabaseStorage

if __name__ == "__main__":
    settings = get_settings()
    created = SupabaseStorage(settings).ensure_bucket()
    print(f"Bucket '{settings.storage_bucket}' {'aangemaakt' if created else 'bestond al'}.")
