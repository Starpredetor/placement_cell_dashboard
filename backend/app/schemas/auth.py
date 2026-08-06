from typing import Literal

from pydantic import BaseModel, EmailStr, Field

Role = Literal["SUPER_ADMIN", "TPO", "HOD", "VOLUNTEER", "STUDENT"]


class AuthUser(BaseModel):
    id: int
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    is_active: bool
    role: Role


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=4)


class LoginResponse(BaseModel):
    access: str
    refresh: str
    user: AuthUser


class RefreshRequest(BaseModel):
    refresh: str


class RefreshResponse(BaseModel):
    access: str


class UpdateMeRequest(BaseModel):
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)
    confirm_password: str = Field(min_length=8)


class UpdateUserRequest(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    role: Role | None = None
    is_active: bool | None = None
