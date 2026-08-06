"""Declarative base and shared column conventions.

Every model in ``app.models`` inherits from ``Base`` so that a single
``Base.metadata`` drives both Alembic autogeneration and the test schema.

Naming conventions are set explicitly because SQLite otherwise emits unnamed
constraints, which Alembic's batch mode (required on SQLite — see
docs/REWRITE_PLAN.md §3.2) cannot drop or alter later. Without this, the first
migration that changes a constraint fails with an unnamed-constraint error.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, MetaData
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core.clock import to_storage, utc_now

NAMING_CONVENTION = {
    "ix": "ix_%(table_name)s_%(column_0_N_name)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_N_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


def _now_naive_utc() -> datetime:
    return to_storage(utc_now())


class TimestampMixin:
    """``created_at`` / ``updated_at``, stored as naive UTC.

    Defaults are applied in Python rather than via ``server_default`` so the
    values come from ``app.core.clock`` and can be frozen in tests.
    """

    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now_naive_utc, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=_now_naive_utc, onupdate=_now_naive_utc, nullable=False
    )
