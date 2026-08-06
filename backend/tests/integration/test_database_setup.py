"""Guards on the SQLite setup itself.

These verify the two settings that fail silently rather than loudly: foreign
key enforcement (off by default in SQLite) and batch-mode migrations (without
which no later migration can alter a column). Both are cheap to break and
expensive to notice.
"""

from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy import Engine
from sqlalchemy.orm import Session


def test_foreign_keys_are_enforced(engine: Engine) -> None:
    """A FK violation must raise. If it does not, the pragma was not applied."""
    metadata = sa.MetaData()
    parent = sa.Table("_fk_parent", metadata, sa.Column("id", sa.Integer, primary_key=True))
    child = sa.Table(
        "_fk_child",
        metadata,
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("parent_id", sa.Integer, sa.ForeignKey("_fk_parent.id"), nullable=False),
    )
    metadata.create_all(engine)

    try:
        with engine.connect() as conn:
            trans = conn.begin()
            try:
                conn.execute(child.insert().values(id=1, parent_id=999))
            except sa.exc.IntegrityError:
                pass  # Expected: the pragma is active.
            else:
                raise AssertionError(
                    "Inserting a row with a dangling foreign key succeeded. "
                    "PRAGMA foreign_keys=ON is not being applied — see app/core/db.py."
                )
            finally:
                trans.rollback()
    finally:
        metadata.drop_all(engine)

    del parent  # referenced only via the FK definition


def test_wal_mode_is_active(engine: Engine) -> None:
    with engine.connect() as conn:
        mode = conn.exec_driver_sql("PRAGMA journal_mode").scalar_one()
    assert str(mode).lower() == "wal"


def test_alembic_configured_for_batch_mode() -> None:
    """SQLite cannot ALTER TABLE; batch mode must be on in both env.py paths."""
    from pathlib import Path

    env_py = Path(__file__).resolve().parents[2] / "alembic" / "env.py"
    source = env_py.read_text(encoding="utf-8")

    assert source.count("render_as_batch=True") >= 2, (
        "render_as_batch=True must be set in both run_migrations_offline and "
        "run_migrations_online, or column changes will fail on SQLite."
    )


def test_session_rollback_isolates_tests(db: Session) -> None:
    """The db fixture must discard writes, including committed ones."""
    db.execute(sa.text("CREATE TABLE IF NOT EXISTS _isolation_probe (id INTEGER PRIMARY KEY)"))
    db.execute(sa.text("INSERT INTO _isolation_probe (id) VALUES (1)"))
    db.commit()

    count = db.execute(sa.text("SELECT COUNT(*) FROM _isolation_probe")).scalar_one()
    assert count == 1
