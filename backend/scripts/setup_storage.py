"""Maakt de publieke buckets aan in Supabase Storage: logo's en gegenereerde media (eenmalig per project).

Gebruik (in de map backend, met de virtuele omgeving actief):  python -m scripts.setup_storage
"""

from app.config import get_settings
from app.services.storage import SupabaseStorage, media_storage

if __name__ == "__main__":
    settings = get_settings()
    for storage in (SupabaseStorage(settings), media_storage(settings)):
        created = storage.ensure_bucket()
        print(f"Bucket '{storage.bucket}' {'aangemaakt' if created else 'bestond al'}.")
