"""Deterministic demo dataset generator.

The dataset is reproducible: everything derives from ``SEED_RANDOM_SEED`` in
config, so ``reset_db.py`` produces byte-identical data on every run. Phase 7's
analytics tests assert hand-computed values against it, which only works if it
never drifts.

Dates are generated *relative to today* rather than hardcoded, so the demo does
not decay into a screen of expired drives (docs/REWRITE_PLAN.md Phase 9).

Each phase extends this script with its own domain data. Phase 0 establishes
the harness; there are no tables yet.
"""

from __future__ import annotations

import argparse
import random
import sys

from sqlalchemy import inspect
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import engine, session_scope


def is_database_populated() -> bool:
    """True if any domain table holds rows.

    Guards against silently doubling the dataset by re-running the seed.
    """
    inspector = inspect(engine)
    tables = [t for t in inspector.get_table_names() if t != "alembic_version"]
    if not tables:
        return False

    with engine.connect() as conn:
        from sqlalchemy import func, select, table

        return any(
            conn.execute(select(func.count()).select_from(table(name))).scalar_one() > 0
            for name in tables
        )


def seed_all(db: Session, rng: random.Random) -> None:
    """Populate every domain, in dependency order.

    Phases append their own step here:
        Phase 1  seed_users
        Phase 2  seed_reference_data, seed_students
        Phase 4  seed_training
        Phase 5  seed_placements
        Phase 6  seed_events
    """
    del db, rng  # No tables exist until Phase 1.


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Seed the demo dataset.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Seed even if the database already contains rows.",
    )
    args = parser.parse_args(argv)

    if is_database_populated() and not args.force:
        print(
            "Database already contains data. Re-run with --force to seed anyway, "
            "or use scripts/reset_db.py to start clean.",
            file=sys.stderr,
        )
        return 1

    settings = get_settings()
    rng = random.Random(settings.seed_random_seed)

    with session_scope() as db:
        seed_all(db, rng)

    print(f"Seeded demo dataset (random seed {settings.seed_random_seed}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
