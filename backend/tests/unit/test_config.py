"""Configuration must fail closed."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def _settings(**overrides: object) -> Settings:
    base: dict[str, object] = {
        "secret_key": "a-sufficiently-long-test-secret",
        "database_url": "sqlite:///./x.db",
    }
    base.update(overrides)
    return Settings(**base)  # type: ignore[arg-type]


@pytest.fixture
def bare_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """Remove the ambient configuration.

    Both the test environment and the developer's .env supply these values, so
    without clearing them a missing-field test can never fail.
    """
    for name in ("SECRET_KEY", "DATABASE_URL"):
        monkeypatch.delenv(name, raising=False)


def test_secret_key_is_required(bare_env: None) -> None:
    with pytest.raises(ValidationError, match="secret_key"):
        Settings(database_url="sqlite:///./x.db", _env_file=None)  # type: ignore[call-arg]


def test_database_url_is_required(bare_env: None) -> None:
    with pytest.raises(ValidationError, match="database_url"):
        Settings(secret_key="a-sufficiently-long-test-secret", _env_file=None)  # type: ignore[call-arg]


def test_both_required_fields_missing(bare_env: None) -> None:
    with pytest.raises(ValidationError) as exc_info:
        Settings(_env_file=None)  # type: ignore[call-arg]

    missing = {e["loc"][0] for e in exc_info.value.errors()}
    assert missing == {"secret_key", "database_url"}


def test_placeholder_secret_is_rejected() -> None:
    """Copying .env.example without editing it must not boot."""
    with pytest.raises(ValidationError, match="placeholder"):
        _settings(secret_key="replace-me-with-a-generated-secret")


def test_short_secret_is_rejected() -> None:
    with pytest.raises(ValidationError):
        _settings(secret_key="short")


@pytest.mark.parametrize(
    ("app_env", "expected"),
    [
        ("development", True),
        ("Development", True),
        ("  development  ", True),
        ("production", False),
        ("test", False),
        ("", False),
    ],
)
def test_is_development_fails_closed(app_env: str, expected: bool) -> None:
    """Gates the demo role switcher; anything but development must be off."""
    assert _settings(app_env=app_env).is_development is expected


def test_cors_origins_are_split_and_stripped() -> None:
    settings = _settings(allowed_origins="http://a.test , http://b.test,")
    assert settings.cors_origins == ["http://a.test", "http://b.test"]


def test_academic_year_start_month_is_bounded() -> None:
    with pytest.raises(ValidationError):
        _settings(academic_year_start_month=13)
