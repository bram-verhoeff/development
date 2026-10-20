"""Instellingen uit omgevingsvariabelen of backend/.env (nooit hardcoded)."""

from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database: lokaal SQLite, online de Postgres-URL van Supabase
    database_url: str = "sqlite:///./postpilot.db"

    @field_validator("database_url")
    @classmethod
    def _psycopg_driver(cls, url: str) -> str:
        # Supabase geeft "postgresql://..." of "postgres://..."; SQLAlchemy heeft de driver nodig
        for prefix in ("postgres://", "postgresql://"):
            if url.startswith(prefix):
                return "postgresql+psycopg://" + url.removeprefix(prefix)
        return url

    # Kommagescheiden lijst van frontend-adressen die de API mogen aanroepen
    cors_origins: str = "http://localhost:3000"

    # Welke AI-dienst de posts schrijft
    ai_provider: Literal["gemini", "claude"] = "gemini"

    # Google Gemini (aistudio.google.com → Get API key)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-flash-latest"

    # Anthropic Claude (alternatief)
    anthropic_api_key: str = ""
    claude_model: str = "claude-opus-5-5"
    # Denkdiepte van Claude: low | medium | high (hoger = grondiger, trager en duurder)
    claude_effort: str = "medium"
    # Maximaal aantal AI-opdrachten (genereren + herschrijven) per gebruiker per 24 uur
    generation_daily_limit: int = 100

    # Supabase (auth en opslag)
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    # Alleen nodig voor oudere projecten die tokens met een gedeeld geheim (HS256) ondertekenen
    supabase_jwt_secret: str = ""
    storage_bucket: str = "logos"

    # Alleen deze e-mailadressen mogen een account hebben (kommagescheiden)
    allowed_emails: str = ""

    # Geheim voor het versleutelen van platform-tokens en ondertekenen van OAuth-state.
    # Maak er een met: python -c "import secrets; print(secrets.token_urlsafe(48))"
    app_secret_key: str = ""

    # Publieke adressen: waar LinkedIn naar terugstuurt (backend) en waar de app draait (frontend)
    backend_public_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"

    # LinkedIn-app (linkedin.com/developers → My apps → Auth)
    linkedin_client_id: str = ""
    linkedin_client_secret: str = ""
    # Versie van de LinkedIn-API (JJJJMM); versies vervallen na ongeveer een jaar
    linkedin_api_version: str = "202610"

    # X-app (developer.x.com → Projects & Apps → User authentication settings, type "Web App")
    x_client_id: str = ""
    x_client_secret: str = ""

    # Meta: Facebook-app voor pagina's en Instagram-app-ID voor Instagram Login (developers.facebook.com)
    meta_app_id: str = ""
    meta_app_secret: str = ""
    instagram_app_id: str = ""
    instagram_app_secret: str = ""
    meta_graph_version: str = "v26.0"

    # TikTok-app (developers.tiktok.com → Manage apps)
    tiktok_client_key: str = ""
    tiktok_client_secret: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def supabase_issuer(self) -> str:
        return f"{self.supabase_url.rstrip('/')}/auth/v1"

    @property
    def supabase_jwks_url(self) -> str:
        return f"{self.supabase_issuer}/.well-known/jwks.json"

    @property
    def allowed_email_set(self) -> set[str]:
        return {e.strip().lower() for e in self.allowed_emails.split(",") if e.strip()}


@lru_cache
def get_settings() -> Settings:
    return Settings()
