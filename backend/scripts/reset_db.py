"""Drop, migrate, and reseed the database in one command.

    python -m scripts.reset_db

This is the intended way to get a working database, and the fastest way back to
a known state during development. The SQLite file is a build artifact: it is
git-ignored and regenerated from migrations plus ``seed.py``.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

from app.core.config import BACKEND_DIR, get_settings


def sqlite_path(database_url: str) -> Path | None:
    """Filesystem path behind a SQLite URL, or None for other backends."""
    if not database_url.startswith("sqlite"):
        return None
    _, _, raw = database_url.partition(":///")
    if not raw or raw == ":memory:":
        return None
    path = Path(raw)
    return path if path.is_absolute() else (BACKEND_DIR / path).resolve()


def drop_database(settings_url: str) -> None:
    path = sqlite_path(settings_url)
    if path is None:
        print("Non-SQLite database: drop it yourself, then re-run.", file=sys.stderr)
        raise SystemExit(2)

    # WAL mode leaves sidecar files; a stale -wal can resurrect dropped rows.
    sidecars = (
        path,
        path.with_suffix(path.suffix + "-wal"),
        path.with_suffix(path.suffix + "-shm"),
    )
    for candidate in sidecars:
        if candidate.exists():
            candidate.unlink()
            print(f"  removed {candidate.name}")


def run(command: list[str]) -> None:
    result = subprocess.run(command, cwd=BACKEND_DIR)
    if result.returncode != 0:
        raise SystemExit(result.returncode)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Recreate the database from scratch.")
    parser.add_argument("--no-seed", action="store_true", help="Migrate but do not seed.")
    args = parser.parse_args(argv)

    settings = get_settings()

    print("Dropping database...")
    drop_database(settings.database_url)

    print("Running migrations...")
    run([sys.executable, "-m", "alembic", "upgrade", "head"])

    if not args.no_seed:
        print("Seeding...")
        run([sys.executable, "-m", "scripts.seed", "--force"])

    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
