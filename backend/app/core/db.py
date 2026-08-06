"""Database engine, session factory, and SQLite connection setup.

The pragmas applied here are not tuning knobs — two of them are correctness
requirements (see docs/REWRITE_PLAN.md §3.2):

``foreign_keys=ON``
    SQLite ships with foreign key enforcement **disabled**. Without this every
    FK in the schema is decorative: deleting a parent row leaves orphans and no
    error is raised. This must be set per-connection; there is no global
    setting.

``journal_mode=WAL``
    Lets readers proceed during a write. Still single-writer, but it removes
    the most common "database is locked" failure in development.

The same listener must be active in tests, or FK violations pass there and fail
in the application. ``tests/conftest.py`` uses this module's engine factory for
exactly that reason.
"""

from __future__ import annotations

import sqlite3
from collections.abc import Generator, Iterator
from contextlib import contextmanager
from typing import Any

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


def _configure_sqlite_connection(dbapi_connection: Any, _record: Any) -> None:
    """Apply required pragmas to every new SQLite connection."""
    if not isinstance(dbapi_connection, sqlite3.Connection):
        return

    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        # Wait rather than failing immediately when another writer holds the
        # lock. Milliseconds.
        cursor.execute("PRAGMA busy_timeout=5000")
    finally:
        cursor.close()


def build_engine(database_url: str | None = None, **kwargs: Any) -> Engine:
    """Create an engine with the SQLite pragmas attached.

    Always use this rather than calling ``create_engine`` directly, so no code
    path can end up with foreign keys disabled.
    """
    settings = get_settings()
    url = database_url or settings.database_url

    connect_args: dict[str, Any] = {}
    if url.startswith("sqlite"):
        # FastAPI serves requests from a thread pool; the default SQLite check
        # would reject connections reused across threads.
        connect_args["check_same_thread"] = False

    engine = create_engine(url, connect_args=connect_args, future=True, **kwargs)
    event.listen(engine, "connect", _configure_sqlite_connection)
    return engine


engine = build_engine()

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
    class_=Session,
)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a session per request.

    The session is closed on the way out. Committing is the service layer's
    responsibility, not this dependency's — an implicit commit here would make
    partial writes durable when a later step in the same request fails.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def session_scope() -> Iterator[Session]:
    """Transactional session for scripts and background work."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
