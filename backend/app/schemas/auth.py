"""Auth request/response contracts.

Field names match what the frontend already consumes (``access``, ``refresh``,
``user``) so the client contract is unchanged by the rewrite.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.rbac import Role


class AuthUser(BaseModel):
    """Public view of an account. Never includes the password hash."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    is_active: bool
    role: Role
    branch_id: int | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class LoginResponse(BaseModel):
    access: str
    refresh: str
    user: AuthUser


class RefreshRequest(BaseModel):
    refresh: str


class RefreshResponse(BaseModel):
    """Rotation returns a new refresh token alongside the access token.

    The old one is revoked on use, so a client that kept it would be signed out
    at the next refresh.
    """

    access: str
    refresh: str


class UpdateMeRequest(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=64)
    first_name: str | None = Field(default=None, max_length=120)
    last_name: str | None = Field(default=None, max_length=120)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)


class CreateUserRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(default="", max_length=120)
    last_name: str = Field(default="", max_length=120)
    role: Role
    branch_id: int | None = None
    is_active: bool = True


class UpdateUserRequest(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=64)
    email: EmailStr | None = None
    first_name: str | None = Field(default=None, max_length=120)
    last_name: str | None = Field(default=None, max_length=120)
    role: Role | None = None
    branch_id: int | None = None
    is_active: bool | None = None


class DemoAccount(BaseModel):
    """A seeded sign-in shortcut, exposed only when APP_ENV=development."""

    role: Role
    email: EmailStr
    password: str
    label: str
    description: str
