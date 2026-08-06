"""Authentication: login, refresh rotation, logout, password changes."""

from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import timedelta

from sqlalchemy.orm import Session

from app.core.clock import to_storage, utc_now
from app.core.errors import AuthenticationError, ConflictError, ValidationError
from app.core.security import (
    TokenError,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    needs_rehash,
    verify_password,
)
from app.models.user import RefreshToken, User
from app.repositories import users as users_repo
from app.services import audit

MAX_LOGIN_ATTEMPTS = 5
LOGIN_WINDOW = timedelta(minutes=15)

#: Recent failed attempts per email. In-process and therefore reset on
#: restart, which is adequate for a single-process deployment; a shared store
#: would be needed behind multiple workers (REWRITE_PLAN §10).
_failed_attempts: dict[str, deque[float]] = defaultdict(deque)


@dataclass(frozen=True)
class TokenPair:
    access: str
    refresh: str
    user: User


def _throttle_key(email: str) -> str:
    return email.strip().lower()


def _prune_attempts(key: str) -> deque[float]:
    cutoff = (utc_now() - LOGIN_WINDOW).timestamp()
    attempts = _failed_attempts[key]
    while attempts and attempts[0] < cutoff:
        attempts.popleft()
    return attempts


def _assert_not_throttled(email: str) -> None:
    if len(_prune_attempts(_throttle_key(email))) >= MAX_LOGIN_ATTEMPTS:
        raise AuthenticationError(
            "Too many failed sign-in attempts. Try again in a few minutes.",
            code="TOO_MANY_ATTEMPTS",
            status_code=429,
        )


def _record_failure(email: str) -> None:
    _failed_attempts[_throttle_key(email)].append(utc_now().timestamp())


def _clear_failures(email: str) -> None:
    _failed_attempts.pop(_throttle_key(email), None)


def reset_throttle() -> None:
    """Clear all recorded attempts. Tests only."""
    _failed_attempts.clear()


def _issue_tokens(db: Session, user: User) -> TokenPair:
    access = create_access_token(user.id, user.role.value)
    refresh, expires_at = create_refresh_token(user.id)

    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_token(refresh),
            expires_at=to_storage(expires_at),
            created_at=to_storage(utc_now()),
        )
    )
    return TokenPair(access=access, refresh=refresh, user=user)


def login(db: Session, email: str, password: str) -> TokenPair:
    _assert_not_throttled(email)

    user = users_repo.get_by_email(db, email)

    # One message and one code for every failure mode. Distinguishing "no such
    # user" from "wrong password" would turn this endpoint into an account
    # enumeration oracle. The password is verified against a dummy hash when
    # the user is missing so the timing does not leak it either.
    if user is None:
        verify_password(password, _DUMMY_HASH)
        _record_failure(email)
        raise AuthenticationError("Incorrect email or password.", code="INVALID_CREDENTIALS")

    if not verify_password(password, user.hashed_password) or not user.is_active:
        _record_failure(email)
        raise AuthenticationError("Incorrect email or password.", code="INVALID_CREDENTIALS")

    # Transparently upgrade hashes when argon2 parameters change.
    if needs_rehash(user.hashed_password):
        user.hashed_password = hash_password(password)

    _clear_failures(email)
    pair = _issue_tokens(db, user)
    db.commit()
    return pair


def refresh_tokens(db: Session, refresh_token: str) -> TokenPair:
    """Rotate a refresh token: the presented one is revoked and replaced.

    Rotation means a stolen token is usable at most once, and its reuse after
    the legitimate holder has rotated is detectable.
    """
    try:
        payload = decode_token(refresh_token, "refresh")
    except TokenError as exc:
        raise AuthenticationError(str(exc), code="INVALID_REFRESH_TOKEN") from exc

    stored = users_repo.get_refresh_token(db, hash_token(refresh_token))
    if stored is None:
        raise AuthenticationError("Refresh token is not recognised.", code="INVALID_REFRESH_TOKEN")

    now = utc_now()
    # expires_at is stored naive-UTC, so compare against the same form.
    if not stored.is_usable(to_storage(now)):
        raise AuthenticationError(
            "Refresh token has expired or been revoked.", code="INVALID_REFRESH_TOKEN"
        )

    user = users_repo.get_by_id(db, int(payload["sub"]))
    if user is None or not user.is_active:
        raise AuthenticationError("Account is no longer active.", code="INACTIVE_ACCOUNT")

    stored.revoked_at = to_storage(now)
    pair = _issue_tokens(db, user)
    db.commit()
    return pair


def logout(db: Session, user: User) -> int:
    """Revoke every refresh token for the user."""
    revoked = users_repo.revoke_all_for_user(db, user.id, now=to_storage(utc_now()))
    db.commit()
    return revoked


def change_password(
    db: Session, user: User, current_password: str, new_password: str, confirm_password: str
) -> None:
    if not verify_password(current_password, user.hashed_password):
        raise ValidationError("Current password is incorrect.", code="INCORRECT_PASSWORD")
    if new_password != confirm_password:
        raise ValidationError("New passwords do not match.", code="PASSWORD_MISMATCH")
    if new_password == current_password:
        raise ConflictError(
            "New password must differ from the current one.", code="PASSWORD_UNCHANGED"
        )

    user.hashed_password = hash_password(new_password)

    # Changing a password must end other sessions, or a stolen token keeps
    # working after the user has taken the one action meant to stop it.
    users_repo.revoke_all_for_user(db, user.id, now=to_storage(utc_now()))
    audit.record(db, actor=user, action="password_changed", entity_type="user", entity_id=user.id)
    db.commit()


#: A valid argon2 hash of a throwaway value, used to equalise login timing when
#: the email does not exist.
_DUMMY_HASH = hash_password("dummy-password-for-timing-equalisation")
