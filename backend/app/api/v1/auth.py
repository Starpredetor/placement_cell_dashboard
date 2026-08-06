from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.core.auth import new_token
from app.db.fake_db import REFRESH_TOKENS, TOKENS, USERS, public_user
from app.schemas.auth import (
    AuthUser,
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    RefreshResponse,
    UpdateMeRequest,
    UpdateUserRequest,
)

router = APIRouter()


def _find_user_by_email(email: str) -> dict | None:
    return next((u for u in USERS if u["email"].lower() == email.lower()), None)


def _find_user_by_id(user_id: int) -> dict | None:
    return next((u for u in USERS if u["id"] == user_id), None)


@router.post("/login/", response_model=LoginResponse)
def login(payload: LoginRequest) -> LoginResponse:
    user = _find_user_by_email(payload.email)
    if not user or user["password"] != payload.password or not user["is_active"]:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access = new_token()
    refresh = new_token()
    TOKENS[access] = user["id"]
    REFRESH_TOKENS[refresh] = user["id"]
    return LoginResponse(access=access, refresh=refresh, user=public_user(user))


@router.post("/logout/")
def logout(current_user: dict = Depends(get_current_user)) -> dict[str, str]:
    user_id = current_user["id"]
    stale_access = [token for token, uid in TOKENS.items() if uid == user_id]
    stale_refresh = [token for token, uid in REFRESH_TOKENS.items() if uid == user_id]
    for token in stale_access:
        del TOKENS[token]
    for token in stale_refresh:
        del REFRESH_TOKENS[token]
    return {"detail": "Logged out"}


@router.post("/token/refresh/", response_model=RefreshResponse)
def refresh(payload: RefreshRequest) -> RefreshResponse:
    user_id = REFRESH_TOKENS.get(payload.refresh)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    access = new_token()
    TOKENS[access] = user_id
    return RefreshResponse(access=access)


@router.get("/me/", response_model=AuthUser)
def me(current_user: dict = Depends(get_current_user)) -> AuthUser:
    return public_user(current_user)


@router.patch("/me/", response_model=AuthUser)
def update_me(payload: UpdateMeRequest, current_user: dict = Depends(get_current_user)) -> AuthUser:
    if payload.username is not None:
        current_user["username"] = payload.username
    if payload.first_name is not None:
        current_user["first_name"] = payload.first_name
    if payload.last_name is not None:
        current_user["last_name"] = payload.last_name
    return public_user(current_user)


@router.post("/change-password/")
def change_password(
    payload: ChangePasswordRequest, current_user: dict = Depends(get_current_user)
) -> dict[str, str]:
    if payload.current_password != current_user["password"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect"
        )
    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="New passwords do not match"
        )

    current_user["password"] = payload.new_password
    return {"detail": "Password updated"}


@router.get("/users/", response_model=list[AuthUser])
def users(_current_user: dict = Depends(get_current_user)) -> list[AuthUser]:
    return [public_user(u) for u in USERS]


@router.patch("/users/{user_id}/", response_model=AuthUser)
def update_user(
    user_id: int, payload: UpdateUserRequest, _current_user: dict = Depends(get_current_user)
) -> AuthUser:
    user = _find_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    patch = payload.model_dump(exclude_unset=True)
    for key, value in patch.items():
        user[key] = value

    return public_user(user)
