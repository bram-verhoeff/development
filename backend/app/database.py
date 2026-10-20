"""Databaseverbinding: werkt met SQLite (lokaal/tests) en PostgreSQL (Supabase)."""

from collections.abc import Iterator
from datetime import UTC, datetime

from sqlalchemy import DateTime, create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.types import TypeDecorator

from app.config import get_settings


class Base(DeclarativeBase):
    pass


class UTCDateTime(TypeDecorator):
    """Slaat tijden op in UTC en geeft altijd een tijdzone-bewuste datetime terug.

    SQLite kent geen tijdzones; zo gedraagt het zich hetzelfde als PostgreSQL.
    """

    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect):
        if value is None:
            return None
        if value.tzinfo is None:
            raise ValueError("Datetime zonder tijdzone; gebruik UTC.")
        return value.astimezone(UTC)

    def process_result_value(self, value: datetime | None, dialect):
        if value is None:
            return None
        return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def utcnow() -> datetime:
    return datetime.now(UTC)


def make_engine(url: str, **kwargs) -> Engine:
    if url.startswith("sqlite"):
        return create_engine(url, connect_args={"check_same_thread": False}, pool_pre_ping=True, **kwargs)
    if "poolclass" not in kwargs:
        # Online (serverless + Supabase-pooler): weinig verbindingen per instantie, anders raakt de limiet op
        kwargs.update(pool_size=2, max_overflow=3)
    return create_engine(url, pool_pre_ping=True, pool_recycle=300, **kwargs)


@event.listens_for(Engine, "connect")
def _sqlite_foreign_keys(dbapi_connection, _record):
    # SQLite controleert foreign keys (en dus cascades) alleen als je dat aanzet
    if type(dbapi_connection).__module__.startswith("sqlite3"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


engine = make_engine(get_settings().database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """FastAPI-dependency: één sessie per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
