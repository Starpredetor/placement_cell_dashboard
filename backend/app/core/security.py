"""Password hashing and JWT issuance.

Replaces the pre-rewrite scheme, which compared plaintext passwords and used
``secrets.token_urlsafe`` as a bearer token stored in a process dictionary:
unsigned, non-expiring, and lost on restart.
"""

from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Any, Literal

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

from app.core.clock import utc_now
from app.core.config import get_settings

ALGORITHM = "HS256"
TokenType = Literal["access", "refresh"]

_hasher = PasswordHasher()


# --- Passwords --------------------------------------------------------------


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password; never raises.

    ``VerificationError`` is the parent of ``VerifyMismatchError`` and is what
    argon2 raises for a corrupt or truncated stored hash. Letting it escape
    would turn a damaged database row into a 500 on the login endpoint rather
    than a failed sign-in.
    """
    try:
        return _hasher.verify(hashed, password)
    except (VerificationError, InvalidHashError, ValueError, TypeError):
        return False


def needs_rehash(hashed: str) -> bool:
    """True when a stored hash predates the current argon2 parameters."""
    try:
        return _hasher.check_needs_rehash(hashed)
    except (InvalidHashError, ValueError):
        return True


# --- Tokens -----------------------------------------------------------------


class TokenError(Exception):
    """Raised when a token is absent, malformed, expired, or the wrong type."""


def _encode(subject: str, token_type: TokenType, expires_in: timedelta, **claims: Any) -> str:
    settings = get_settings()
    now = utc_now()
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires_in,
        "jti": uuid.uuid4().hex,
        **claims,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def create_access_token(user_id: int, role: str) -> str:
    settings = get_settings()
    return _encode(
        str(user_id),
        "access",
        timedelta(minutes=settings.access_token_expire_minutes),
        role=role,
    )


def create_refresh_token(user_id: int) -> tuple[str, datetime]:
    """Return the token and its expiry, so the caller can persist the expiry."""
    settings = get_settings()
    expires_in = timedelta(days=settings.refresh_token_expire_days)
    token = _encode(str(user_id), "refresh", expires_in)
    return token, utc_now() + expires_in


def decode_token(token: str, expected_type: TokenType) -> dict[str, Any]:
    """Verify signature, expiry, and type.

    The type check is what stops a refresh token being presented as an access
    token: both are signed with the same key, so without it a long-lived
    refresh token would authenticate API calls directly.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise TokenError("Token has expired.") from exc
    except jwt.InvalidTokenError as exc:
        raise TokenError("Token is invalid.") from exc

    if payload.get("type") != expected_type:
        raise TokenError(f"Expected a {expected_type} token.")
    if not payload.get("sub"):
        raise TokenError("Token is missing a subject.")

    return payload


def hash_token(token: str) -> str:
    """Digest for storing a refresh token.

    Refresh tokens are long-lived credentials; storing them verbatim means a
    database read is enough to impersonate any user. Only the digest is
    persisted, and lookups hash the presented token. SHA-256 is appropriate
    here (unlike for passwords) because the input is already high-entropy.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
