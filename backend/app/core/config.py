"""Application configuration.

Settings are read from the environment (and a local ``.env`` file). Two values
have deliberately no default: ``SECRET_KEY`` and ``DATABASE_URL``. An
unconfigured application must refuse to start rather than boot with a key an
attacker could guess from the source tree.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Required -----------------------------------------------------------
    secret_key: str = Field(min_length=16)
    database_url: str = Field(min_length=1)

    # --- Optional -----------------------------------------------------------
    app_env: str = "development"
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    academic_year_start_month: int = Field(default=7, ge=1, le=12)

    storage_root: Path = BACKEND_DIR / "var" / "uploads"
    seed_random_seed: int = 20260807

    @field_validator("secret_key")
    @classmethod
    def _reject_placeholder_secret(cls, value: str) -> str:
        if value.startswith("replace-me"):
            raise ValueError(
                "SECRET_KEY is still the placeholder from .env.example. "
                'Generate one with: python -c "import secrets; '
                'print(secrets.token_urlsafe(48))"'
            )
        return value

    @property
    def is_development(self) -> bool:
        """Gates the demo role-switcher endpoint. Fail closed on anything else."""
        return self.app_env.strip().lower() == "development"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")


@lru_cache
def get_settings() -> Settings:
    """Cached so the .env file is read once per process."""
    return Settings()
