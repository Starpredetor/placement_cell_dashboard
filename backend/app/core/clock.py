"""The single source of "now".

Every timestamp in the application comes from here so that time-dependent
logic — academic-year rollover, token expiry, application deadlines — can be
tested deterministically instead of depending on when the suite happens to run.

SQLite has no timezone-aware column type (see docs/REWRITE_PLAN.md §3.2), so
values are stored naive-UTC. ``utc_now`` returns the aware value for logic;
``to_storage`` strips the tzinfo at the persistence boundary.
"""

from __future__ import annotations

from datetime import UTC, date, datetime

_frozen_at: datetime | None = None


def utc_now() -> datetime:
    """Timezone-aware current UTC time, or the frozen value inside tests."""
    if _frozen_at is not None:
        return _frozen_at
    return datetime.now(UTC)


def today() -> date:
    return utc_now().date()


def to_storage(value: datetime) -> datetime:
    """Normalise to naive UTC for persistence.

    A naive input is assumed to already be UTC; assuming local time here would
    silently shift every timestamp by the developer's offset.
    """
    if value.tzinfo is None:
        return value
    return value.astimezone(UTC).replace(tzinfo=None)


def from_storage(value: datetime) -> datetime:
    """Attach UTC to a value read back from the database."""
    if value.tzinfo is not None:
        return value
    return value.replace(tzinfo=UTC)


def freeze(at: datetime) -> None:
    """Pin ``utc_now`` to a fixed instant. Tests only."""
    global _frozen_at
    _frozen_at = at if at.tzinfo else at.replace(tzinfo=UTC)


def unfreeze() -> None:
    global _frozen_at
    _frozen_at = None
