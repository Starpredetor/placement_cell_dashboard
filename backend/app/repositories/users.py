"""Query objects for identity tables."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.core.rbac import Role
from app.models.user import RefreshToken, User


def get_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def get_by_email(db: Session, email: str) -> User | None:
    """Case-insensitive lookup.

    SQLite's LIKE is case-insensitive for ASCII while PostgreSQL's is not, so
    the comparison is lowered explicitly to behave identically on both
    (REWRITE_PLAN §3.2).
    """
    stmt = select(User).where(func.lower(User.email) == func.lower(email))
    return db.execute(stmt).scalar_one_or_none()


def get_by_username(db: Session, username: str) -> User | None:
    stmt = select(User).where(func.lower(User.username) == func.lower(username))
    return db.execute(stmt).scalar_one_or_none()


def list_users_stmt(
    *,
    role: Role | None = None,
    is_active: bool | None = None,
    search: str | None = None,
) -> Select[tuple[User]]:
    stmt = select(User)

    if role is not None:
        stmt = stmt.where(User.role == role)
    if is_active is not None:
        stmt = stmt.where(User.is_active.is_(is_active))
    if search:
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            func.lower(User.username).like(term)
            | func.lower(User.email).like(term)
            | func.lower(User.first_name).like(term)
            | func.lower(User.last_name).like(term)
        )

    return stmt.order_by(User.id)


# --- Refresh tokens ---------------------------------------------------------


def get_refresh_token(db: Session, token_hash: str) -> RefreshToken | None:
    stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    return db.execute(stmt).scalar_one_or_none()


def revoke_all_for_user(db: Session, user_id: int, *, now: datetime) -> int:
    """Revoke every live token for a user. Returns how many were revoked."""
    stmt = select(RefreshToken).where(
        RefreshToken.user_id == user_id,
        RefreshToken.revoked_at.is_(None),
    )
    tokens = list(db.execute(stmt).scalars().all())
    for token in tokens:
        token.revoked_at = now
    return len(tokens)
