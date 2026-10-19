"""Instellingen uit omgevingsvariabelen of backend/.env (nooit hardcoded)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database: lokaal SQLite, online de Postgres-URL van Supabase
    database_url: str = "sqlite:///./contentroom.db"

    # Kommagescheiden lijst van frontend-adressen die de API mogen aanroepen
    cors_origins: str = "http://localhost:3000"

    # Claude API
    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-5-5"

    # Supabase (auth en opslag)
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    storage_bucket: str = "logos"

    # Alleen deze e-mailadressen mogen een account hebben (kommagescheiden)
    allowed_emails: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def allowed_email_set(self) -> set[str]:
        return {e.strip().lower() for e in self.allowed_emails.split(",") if e.strip()}


@lru_cache
def get_settings() -> Settings:
    return Settings()
