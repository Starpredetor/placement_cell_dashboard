"""The clock is the single source of "now" and must round-trip UTC correctly."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta, timezone

from app.core import clock


def test_utc_now_is_timezone_aware() -> None:
    assert clock.utc_now().tzinfo is not None


def test_freeze_pins_now() -> None:
    pinned = datetime(2026, 7, 1, 9, 30, tzinfo=UTC)
    clock.freeze(pinned)
    assert clock.utc_now() == pinned
    assert clock.today() == pinned.date()


def test_unfreeze_restores_real_time() -> None:
    clock.freeze(datetime(2020, 1, 1, tzinfo=UTC))
    clock.unfreeze()
    assert clock.utc_now().year >= 2026


def test_to_storage_strips_tzinfo_after_converting_to_utc() -> None:
    ist = timezone(timedelta(hours=5, minutes=30))
    aware = datetime(2026, 7, 1, 14, 0, tzinfo=ist)

    stored = clock.to_storage(aware)

    assert stored.tzinfo is None
    assert stored == datetime(2026, 7, 1, 8, 30)


def test_to_storage_treats_naive_input_as_utc() -> None:
    """Assuming local time here would shift every timestamp by the dev's offset."""
    naive = datetime(2026, 7, 1, 8, 30)
    assert clock.to_storage(naive) == naive


def test_storage_round_trip_preserves_instant() -> None:
    original = datetime(2026, 7, 1, 8, 30, tzinfo=UTC)
    assert clock.from_storage(clock.to_storage(original)) == original
