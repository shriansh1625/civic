"""
CivicLens AI — Async Database Engine & Session
Uses SQLAlchemy 2.0 async with aiosqlite for the prototype.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    connect_args={"timeout": 15},
)


@event.listens_for(engine.sync_engine, "connect")
def _set_sqlite_wal(dbapi_conn, connection_record):
    """Enable WAL mode for SQLite — allows concurrent readers + single writer."""
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA busy_timeout=5000")
    cursor.close()

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""
    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency — yields an async DB session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Create all tables (used at startup for prototype)."""
    async with engine.begin() as conn:
        from app.models import user, scheme, alert, subscription  # noqa: ensure models are imported
        await conn.run_sync(Base.metadata.create_all)
