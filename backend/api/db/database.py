"""
Database engine, session factory, and initialization utilities.
Uses SQLAlchemy async for FastAPI compatibility.
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from fastapi import HTTPException
import logging
import re

from ..config import settings

logger = logging.getLogger(__name__)

def _normalize_db_url(url: str) -> str:
    """Convert Supabase/Railway URL formats to SQLAlchemy async format."""
    if not url:
        return ""
    # postgres:// → postgresql+asyncpg://
    url = re.sub(r'^postgres://', 'postgresql+asyncpg://', url)
    url = re.sub(r'^postgresql://', 'postgresql+asyncpg://', url)
    return url

def _get_connect_args(url: str) -> dict:
    """Get asyncpg connect_args for SSL and pgbouncer compatibility."""
    if not url:
        return {}
    if 'supabase.co' in url or 'pooler.supabase' in url:
        return {
            'ssl': 'require',
            'statement_cache_size': 0,  # required for asyncpg with pgbouncer
            'prepared_statement_cache_size': 0,  # required for SQLAlchemy asyncpg dialect
        }
    return {}

# Async engine
#
# When no database is configured (CI, local dev without .env), do not build a
# real engine. create_async_engine("") raised deep inside greenlet at request
# time, which surfaced as an opaque 500 on endpoints that are supposed to
# degrade gracefully. The routers already treat "DB unavailable" as 503, so the
# session factory raises that condition directly and `get_db` turns it into a
# 503 response instead of an exception.
class DatabaseNotConfigured(RuntimeError):
    """Raised when a DB-backed route runs without a configured database."""


db_url = _normalize_db_url(settings.database_url)
if not db_url:
    engine = None
    logger.warning(
        "DATABASE_URL is not configured; database-backed endpoints will "
        "return 503. Set it in backend/.env to enable them."
    )
else:
    engine = create_async_engine(
        db_url,
        echo=settings.debug,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        connect_args=_get_connect_args(settings.database_url),
    )

# Session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency — yields a database session.

    Raises HTTPException(503) when no database is configured, so routes
    without their own error handling degrade to "unavailable" instead of 500.
    """
    if engine is None:
        raise HTTPException(
            status_code=503,
            detail="Database is not configured (set DATABASE_URL)",
        )
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Run on application startup — verify connection."""
    if engine is None:
        logger.warning("No DATABASE_URL configured; skipping DB init")
        return
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("✓ Database connection established")
    except Exception as e:
        logger.error(f"✗ Database connection failed: {e}")
        # Don't crash — allow app to start with degraded DB
