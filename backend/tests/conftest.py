"""Shared test fixtures.

The database fixture uses a file-backed temporary SQLite database rather than
``:memory:``. In-memory databases are per-connection, so the app and the test
would see different schemas the moment a second connection is opened.

Both go through ``app.core.db.build_engine``, which attaches the pragma
listener. Using ``create_engine`` directly here would leave foreign keys
disabled in tests only — FK violations would pass in the suite and fail in the
application (docs/REWRITE_PLAN.md §3.2).
"""

from __future__ import annotations

import os
from collections.abc import Generator
from pathlib import Path

import pytest

# Configuration is read at import time, so the environment must be set before
# anything under app.* is imported.
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-used-in-production")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("APP_ENV", "test")

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.clock import unfreeze
from app.core.config import get_settings
from app.core.db import build_engine, get_db
from app.main import create_app
from app.models import Base


@pytest.fixture(scope="session")
def engine(tmp_path_factory: pytest.TempPathFactory) -> Generator[Engine, None, None]:
    """Session-scoped engine over a temporary database file."""
    db_path: Path = tmp_path_factory.mktemp("db") / "test.db"
    test_engine = build_engine(f"sqlite:///{db_path.as_posix()}")

    Base.metadata.create_all(test_engine)
    yield test_engine

    Base.metadata.drop_all(test_engine)
    test_engine.dispose()


@pytest.fixture
def db(engine: Engine) -> Generator[Session, None, None]:
    """Function-scoped session rolled back after each test.

    The session joins an outer transaction that is never committed, so a test's
    writes — including any the code under test commits — are discarded. This
    keeps tests isolated without recreating the schema each time.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection, expire_on_commit=False)()

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def app(db: Session) -> FastAPI:
    """Application with the request-scoped database overridden to the test session."""
    application = create_app()
    application.dependency_overrides[get_db] = lambda: db
    return application


@pytest.fixture
def client(app: FastAPI) -> Generator[TestClient, None, None]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def settings():  # type: ignore[no-untyped-def]
    return get_settings()


@pytest.fixture(autouse=True)
def _reset_clock() -> Generator[None, None, None]:
    """Ensure a frozen clock never leaks between tests."""
    yield
    unfreeze()
