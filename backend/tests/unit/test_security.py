"""Password hashing and JWT issuance."""

from __future__ import annotations

from datetime import datetime, timedelta

import jwt
import pytest

from app.core import clock
from app.core.config import get_settings
from app.core.security import (
    ALGORITHM,
    TokenError,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
)


class TestPasswordHashing:
    def test_hash_is_not_the_plaintext(self) -> None:
        hashed = hash_password("correct horse battery staple")
        assert "correct horse" not in hashed
        assert hashed.startswith("$argon2")

    def test_verify_accepts_the_right_password(self) -> None:
        assert verify_password("s3cret-password", hash_password("s3cret-password"))

    def test_verify_rejects_the_wrong_password(self) -> None:
        assert not verify_password("wrong", hash_password("s3cret-password"))

    def test_hashes_are_salted(self) -> None:
        """Identical passwords must not produce identical hashes."""
        assert hash_password("same-password") != hash_password("same-password")

    @pytest.mark.parametrize("garbage", ["", "not-a-hash", "$argon2id$broken"])
    def test_verify_returns_false_rather_than_raising(self, garbage: str) -> None:
        """A corrupt stored hash must fail the login, not 500 the endpoint."""
        assert verify_password("anything", garbage) is False


class TestAccessTokens:
    def test_round_trip_carries_subject_and_role(self) -> None:
        payload = decode_token(create_access_token(42, "TPO"), "access")
        assert payload["sub"] == "42"
        assert payload["role"] == "TPO"

    def test_tokens_are_unique_per_issue(self) -> None:
        """Distinct jti values, so tokens can be revoked individually."""
        first = decode_token(create_access_token(1, "TPO"), "access")
        second = decode_token(create_access_token(1, "TPO"), "access")
        assert first["jti"] != second["jti"]

    def test_expired_token_is_rejected(self) -> None:
        clock.freeze(datetime(2026, 1, 1, 12, 0))
        token = create_access_token(1, "TPO")

        clock.freeze(datetime(2026, 1, 1, 12, 0) + timedelta(days=1))
        with pytest.raises(TokenError, match="expired"):
            decode_token(token, "access")

    def test_token_signed_with_another_key_is_rejected(self) -> None:
        forged = jwt.encode(
            {"sub": "1", "type": "access", "role": "SUPER_ADMIN"},
            "a-different-secret",
            algorithm=ALGORITHM,
        )
        with pytest.raises(TokenError):
            decode_token(forged, "access")

    def test_tampered_payload_is_rejected(self) -> None:
        token = create_access_token(1, "STUDENT")
        header, payload, _ = token.split(".")
        tampered = f"{header}.{payload}.bad-signature"
        with pytest.raises(TokenError):
            decode_token(tampered, "access")

    def test_unsigned_token_is_rejected(self) -> None:
        """The `alg: none` downgrade must not be accepted."""
        unsigned = jwt.encode({"sub": "1", "type": "access"}, key="", algorithm="none")
        with pytest.raises(TokenError):
            decode_token(unsigned, "access")


class TestTokenTypeSeparation:
    def test_refresh_token_cannot_be_used_as_an_access_token(self) -> None:
        """Both are signed with the same key; only the type claim separates them.

        Without the check, a 7-day refresh token would authenticate API calls
        directly, defeating the short access-token lifetime.
        """
        refresh, _ = create_refresh_token(1)
        with pytest.raises(TokenError, match="Expected a access token"):
            decode_token(refresh, "access")

    def test_access_token_cannot_be_used_as_a_refresh_token(self) -> None:
        with pytest.raises(TokenError, match="Expected a refresh token"):
            decode_token(create_access_token(1, "TPO"), "refresh")

    def test_refresh_expiry_matches_configuration(self) -> None:
        clock.freeze(datetime(2026, 1, 1, 12, 0))
        _, expires_at = create_refresh_token(1)
        expected = clock.utc_now() + timedelta(days=get_settings().refresh_token_expire_days)
        assert expires_at == expected


class TestTokenHashing:
    def test_hash_is_stable_and_not_reversible(self) -> None:
        token, _ = create_refresh_token(1)
        digest = hash_token(token)

        assert hash_token(token) == digest, "lookup requires a deterministic digest"
        assert token not in digest
        assert len(digest) == 64

    def test_different_tokens_hash_differently(self) -> None:
        first, _ = create_refresh_token(1)
        second, _ = create_refresh_token(1)
        assert hash_token(first) != hash_token(second)
