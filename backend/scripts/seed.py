"""Deterministic demo dataset generator.

The dataset is reproducible: everything derives from ``SEED_RANDOM_SEED`` in
config, so ``reset_db.py`` produces identical data on every run. Phase 7's
analytics tests assert hand-computed values against it, which only works if it
never drifts.

Dates are generated *relative to today* rather than hardcoded, so the demo does
not decay into a screen of expired drives (docs/REWRITE_PLAN.md Phase 9).

Each phase extends this script with its own domain data.
"""

from __future__ import annotations

import argparse
import random
import sys

from sqlalchemy import func, inspect, select, table
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import engine, session_scope
from app.core.security import hash_password
from app.models.reference import (
    AcademicYear,
    Batch,
    Branch,
    Company,
    Division,
    JobRole,
)
from app.models.user import User
from app.services.demo_accounts import DEMO_ACCOUNTS

BRANCHES = [
    ("CE", "Computer Engineering"),
    ("IT", "Information Technology"),
    ("EXTC", "Electronics & Telecommunication"),
    ("MECH", "Mechanical Engineering"),
    ("CIVIL", "Civil Engineering"),
]

DIVISIONS = ["A", "B", "C"]

COMPANIES = [
    ("TechNova", "https://technova.example.com"),
    ("InfiSpark", "https://infispark.example.com"),
    ("ByteBridge", "https://bytebridge.example.com"),
    ("Quantiva Analytics", "https://quantiva.example.com"),
    ("Northwind Systems", "https://northwind.example.com"),
    ("Helios Software", "https://helios.example.com"),
    ("Arcadia Fintech", "https://arcadia.example.com"),
    ("Vertex Robotics", "https://vertex.example.com"),
]

JOB_ROLES = [
    "Software Engineer",
    "Data Analyst",
    "QA Engineer",
    "DevOps Engineer",
    "Business Analyst",
    "Embedded Engineer",
    "Graduate Engineer Trainee",
]


def is_database_populated() -> bool:
    """True if any domain table holds rows.

    Guards against silently doubling the dataset by re-running the seed.
    """
    inspector = inspect(engine)
    tables = [t for t in inspector.get_table_names() if t != "alembic_version"]
    if not tables:
        return False

    with engine.connect() as conn:
        return any(
            conn.execute(select(func.count()).select_from(table(name))).scalar_one() > 0
            for name in tables
        )


def seed_reference_data(db: Session) -> dict[str, Branch]:
    """Reference tables. Returns branches by code, for linking users later."""
    branches: dict[str, Branch] = {}
    for order, (code, name) in enumerate(BRANCHES):
        branch = Branch(code=code, name=name, sort_order=order)
        db.add(branch)
        branches[code] = branch

    for order, name in enumerate(DIVISIONS):
        db.add(Division(name=name, sort_order=order))

    for order, (name, website) in enumerate(COMPANIES):
        db.add(Company(name=name, website=website, sort_order=order))

    for order, name in enumerate(JOB_ROLES):
        db.add(JobRole(name=name, sort_order=order))

    # Academic years span the current cohort's range, derived from today so the
    # demo stays current without editing this file.
    settings = get_settings()
    from app.core.clock import today

    current = today()
    rolled_over = current.month >= settings.academic_year_start_month
    current_start = current.year if rolled_over else current.year - 1

    for offset in range(-3, 2):
        start = current_start + offset
        db.add(
            AcademicYear(
                name=f"{start}-{str(start + 1)[-2:]}",
                start_year=start,
                is_current=(offset == 0),
                sort_order=offset + 3,
            )
        )

    # Training batches, named for the cohort's graduation year.
    for order, offset in enumerate(range(0, 4)):
        year = current_start + offset
        db.add(Batch(name=f"Batch {year}", sort_order=order))

    db.flush()
    return branches


def seed_users(db: Session, branches: dict[str, Branch]) -> None:
    """One account per role.

    The HOD is bound to a branch on purpose: without one, ``can_access_branch``
    fails closed and the role would appear broken in the demo rather than
    scoped.
    """
    for spec in DEMO_ACCOUNTS:
        db.add(
            User(
                username=spec.username,
                email=spec.email,
                first_name=spec.first_name,
                last_name=spec.last_name,
                hashed_password=hash_password(spec.password),
                role=spec.role,
                is_active=True,
                branch_id=branches["CE"].id if spec.role.value == "HOD" else None,
            )
        )
    db.flush()


def seed_all(db: Session, rng: random.Random) -> None:
    """Populate every domain, in dependency order.

    Phases append their own step here:
        Phase 2  seed_students
        Phase 4  seed_training
        Phase 5  seed_placements
        Phase 6  seed_events
    """
    del rng  # Used from Phase 2, where generated students need randomness.
    branches = seed_reference_data(db)
    seed_users(db, branches)


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
    print(f"  {len(BRANCHES)} branches, {len(COMPANIES)} companies, {len(JOB_ROLES)} job roles")
    print(f"  {len(DEMO_ACCOUNTS)} accounts:")
    for spec in DEMO_ACCOUNTS:
        print(f"    {spec.role.value:<12} {spec.email:<26} {spec.password}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
