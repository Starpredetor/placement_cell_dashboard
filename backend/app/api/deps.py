"""Shared FastAPI dependencies: database session, current user, authorization.

``require_roles`` is the router-level guard. The pre-rewrite version of this
module had only ``get_current_user``, which proved a caller was logged in and
nothing more — no endpoint inspected the role, so any authenticated token could
reach every endpoint including user administration.
"""

from __future__ import annotations

from collections.abc import Callable

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.errors import AuthenticationError, PermissionDeniedError
from app.core.rbac import Role
from app.core.security import TokenError, decode_token
from app.models.user import User
from app.repositories import users as users_repo

# Re-exported, deliberately not wrapped. FastAPI keys dependency overrides on
# the exact callable, so wrapping this would create a second function that
# ``dependency_overrides[core.db.get_db]`` does not match — tests would then
# silently hit the real database instead of the fixture session.
__all__ = [
    "get_current_user",
    "get_current_user_legacy",
    "get_db",
    "require_authenticated",
    "require_roles",
]


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AuthenticationError("Authentication credentials were not provided.")

    token = authorization.split(" ", 1)[1].strip()

    try:
        payload = decode_token(token, "access")
    except TokenError as exc:
        raise AuthenticationError(str(exc)) from exc

    try:
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError) as exc:
        raise AuthenticationError("Token subject is malformed.") from exc

    user = users_repo.get_by_id(db, user_id)
    if user is None:
        raise AuthenticationError("Account no longer exists.")
    if not user.is_active:
        # Checked on every request, not just at login: deactivating an account
        # must take effect immediately rather than when its token expires.
        raise AuthenticationError("Account is inactive.", code="INACTIVE_ACCOUNT")

    return user


def require_roles(*allowed: Role) -> Callable[[User], User]:
    """Dependency factory rejecting callers outside ``allowed``.

    Use in place of ``get_current_user`` so authentication and authorization
    are declared together::

        @router.get("/", dependencies=[Depends(require_roles(Role.TPO))])

    or, when the endpoint needs the user::

        def handler(user: User = Depends(require_roles(Role.TPO))): ...
    """
    allowed_set = frozenset(allowed)

    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_set:
            raise PermissionDeniedError(
                "Your role does not permit this action.",
                details={
                    "required_roles": sorted(role.value for role in allowed_set),
                    "your_role": current_user.role.value,
                },
            )
        return current_user

    return dependency


def require_authenticated(current_user: User = Depends(get_current_user)) -> User:
    """Any signed-in user, regardless of role."""
    return current_user


def get_current_user_legacy(
    current_user: User = Depends(get_current_user),
) -> dict[str, object]:
    """Dict-shaped view of the current user, for pre-rewrite routers.

    ``students.py`` and ``training.py`` still index the user (``user["role"]``)
    because they were written against the in-memory store. Rather than edit
    modules that Phases 2 and 4 replace outright, they depend on this adapter.

    Authentication is fully real underneath — the same JWT verification as
    ``get_current_user``. Delete this when the last of those routers is
    rewritten.
    """
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "is_active": current_user.is_active,
        "role": current_user.role.value,
        "branch_id": current_user.branch_id,
    }
