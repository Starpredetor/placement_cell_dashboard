"""Authentication and user administration."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_roles
from app.core.clock import to_storage, utc_now
from app.core.config import get_settings
from app.core.errors import ConflictError, NotFoundError, PermissionDeniedError
from app.core.rbac import USER_ADMIN_ROLES, Role
from app.core.security import hash_password
from app.models.user import User
from app.repositories import users as users_repo
from app.schemas.auth import (
    AuthUser,
    ChangePasswordRequest,
    CreateUserRequest,
    DemoAccount,
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    RefreshResponse,
    UpdateMeRequest,
    UpdateUserRequest,
)
from app.services import audit
from app.services import auth as auth_service
from app.services.demo_accounts import DEMO_ACCOUNTS

router = APIRouter()

require_user_admin = require_roles(*USER_ADMIN_ROLES)


@router.post("/login/", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    pair = auth_service.login(db, payload.email, payload.password)
    return LoginResponse(
        access=pair.access,
        refresh=pair.refresh,
        user=AuthUser.model_validate(pair.user),
    )


@router.post("/token/refresh/", response_model=RefreshResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> RefreshResponse:
    pair = auth_service.refresh_tokens(db, payload.refresh)
    return RefreshResponse(access=pair.access, refresh=pair.refresh)


@router.post("/logout/")
def logout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, str | int]:
    revoked = auth_service.logout(db, current_user)
    return {"detail": "Logged out", "revoked_sessions": revoked}


@router.get("/me/", response_model=AuthUser)
def me(current_user: User = Depends(get_current_user)) -> AuthUser:
    return AuthUser.model_validate(current_user)


@router.patch("/me/", response_model=AuthUser)
def update_me(
    payload: UpdateMeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AuthUser:
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)

    if "username" in changes:
        existing = users_repo.get_by_username(db, changes["username"])
        if existing is not None and existing.id != current_user.id:
            raise ConflictError("That username is taken.", code="DUPLICATE_USERNAME")

    before = {field: getattr(current_user, field) for field in changes}
    for field, value in changes.items():
        setattr(current_user, field, value)

    changed_before, changed_after = audit.diff(before, changes)
    if changed_after:
        audit.record(
            db,
            actor=current_user,
            action="profile_updated",
            entity_type="user",
            entity_id=current_user.id,
            before=changed_before,
            after=changed_after,
        )
    db.commit()
    return AuthUser.model_validate(current_user)


@router.post("/change-password/")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    auth_service.change_password(
        db,
        current_user,
        payload.current_password,
        payload.new_password,
        payload.confirm_password,
    )
    return {"detail": "Password updated. Other sessions have been signed out."}


# --- User administration (SUPER_ADMIN only) ---------------------------------


@router.get("/users/", response_model=list[AuthUser])
def list_users(
    search: str = "",
    db: Session = Depends(get_db),
    _admin: User = Depends(require_user_admin),
) -> list[AuthUser]:
    stmt = users_repo.list_users_stmt(search=search or None)
    return [AuthUser.model_validate(u) for u in db.execute(stmt).scalars().all()]


@router.post("/users/", response_model=AuthUser, status_code=201)
def create_user(
    payload: CreateUserRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_user_admin),
) -> AuthUser:
    if users_repo.get_by_email(db, payload.email) is not None:
        raise ConflictError("That email is already registered.", code="DUPLICATE_EMAIL")
    if users_repo.get_by_username(db, payload.username) is not None:
        raise ConflictError("That username is taken.", code="DUPLICATE_USERNAME")

    user = User(
        username=payload.username,
        email=payload.email,
        first_name=payload.first_name,
        last_name=payload.last_name,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        branch_id=payload.branch_id,
        is_active=payload.is_active,
    )
    db.add(user)
    db.flush()

    audit.record(
        db,
        actor=admin,
        action="user_created",
        entity_type="user",
        entity_id=user.id,
        after={"email": user.email, "role": user.role.value},
    )
    db.commit()
    return AuthUser.model_validate(user)


@router.patch("/users/{user_id}/", response_model=AuthUser)
def update_user(
    user_id: int,
    payload: UpdateUserRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_user_admin),
) -> AuthUser:
    user = users_repo.get_by_id(db, user_id)
    if user is None:
        raise NotFoundError("User not found.")

    changes = payload.model_dump(exclude_unset=True)

    # An admin demoting or deactivating themselves would lock the last
    # administrator out of the system with no way back in through the UI.
    if user.id == admin.id:
        if changes.get("role") not in (None, Role.SUPER_ADMIN):
            raise PermissionDeniedError("You cannot change your own role.", code="SELF_ROLE_CHANGE")
        if changes.get("is_active") is False:
            raise PermissionDeniedError(
                "You cannot deactivate your own account.", code="SELF_DEACTIVATION"
            )

    if changes.get("email"):
        existing = users_repo.get_by_email(db, changes["email"])
        if existing is not None and existing.id != user.id:
            raise ConflictError("That email is already registered.", code="DUPLICATE_EMAIL")

    if changes.get("username"):
        existing = users_repo.get_by_username(db, changes["username"])
        if existing is not None and existing.id != user.id:
            raise ConflictError("That username is taken.", code="DUPLICATE_USERNAME")

    before = {field: getattr(user, field) for field in changes}
    for field, value in changes.items():
        setattr(user, field, value)

    # Revoking a role or deactivating an account must end its live sessions,
    # otherwise the change only takes effect when the token happens to expire.
    if changes.get("is_active") is False or "role" in changes:
        users_repo.revoke_all_for_user(db, user.id, now=_now_naive())

    changed_before, changed_after = audit.diff(before, changes)
    if changed_after:
        audit.record(
            db,
            actor=admin,
            action="user_updated",
            entity_type="user",
            entity_id=user.id,
            before=changed_before,
            after=changed_after,
        )
    db.commit()
    return AuthUser.model_validate(user)


# --- Demo convenience (development only) ------------------------------------


@router.get("/demo-accounts/", response_model=list[DemoAccount])
def demo_accounts() -> list[DemoAccount]:
    """Seeded sign-in shortcuts for the portfolio demo.

    Returns 404 outside development so the credential list is never served by a
    deployed instance. The buttons this feeds perform an ordinary login against
    real authentication — it is a convenience, not a bypass.
    """
    if not get_settings().is_development:
        raise NotFoundError("Not found.")

    return [
        DemoAccount(
            role=spec.role,
            email=spec.email,
            password=spec.password,
            label=spec.label,
            description=spec.description,
        )
        for spec in DEMO_ACCOUNTS
    ]


def _now_naive() -> datetime:
    return to_storage(utc_now())
