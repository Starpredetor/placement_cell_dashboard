"""Login, refresh rotation, revocation, and password changes."""

from __future__ import annotations

from collections.abc import Callable

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.rbac import Role
from app.models.user import User
from tests.conftest import DEFAULT_PASSWORD


def login(client: TestClient, email: str, password: str):  # type: ignore[no-untyped-def]
    return client.post("/api/v1/auth/login/", json={"email": email, "password": password})


class TestLogin:
    def test_successful_login_returns_tokens_and_user(
        self, client: TestClient, users: dict[Role, User]
    ) -> None:
        response = login(client, users[Role.TPO].email, DEFAULT_PASSWORD)

        assert response.status_code == 200
        body = response.json()
        assert body["access"] and body["refresh"]
        assert body["user"]["role"] == "TPO"
        assert "password" not in body["user"]
        assert "hashed_password" not in body["user"]

    def test_wrong_password_is_rejected(self, client: TestClient, users: dict[Role, User]) -> None:
        response = login(client, users[Role.TPO].email, "not-the-password")
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"

    def test_unknown_email_is_indistinguishable_from_a_wrong_password(
        self, client: TestClient, users: dict[Role, User]
    ) -> None:
        """Otherwise the endpoint is an account-enumeration oracle."""
        unknown = login(client, "nobody@test.edu", "whatever")
        wrong = login(client, users[Role.TPO].email, "whatever")

        assert unknown.status_code == wrong.status_code == 401
        assert unknown.json()["error"] == wrong.json()["error"]

    def test_inactive_account_cannot_log_in(
        self, client: TestClient, make_user: Callable[..., User]
    ) -> None:
        user = make_user(Role.TPO, email="dormant@test.edu", is_active=False)
        assert login(client, user.email, DEFAULT_PASSWORD).status_code == 401

    def test_email_match_is_case_insensitive(
        self, client: TestClient, users: dict[Role, User]
    ) -> None:
        assert login(client, users[Role.TPO].email.upper(), DEFAULT_PASSWORD).status_code == 200

    def test_password_is_never_stored_in_plaintext(
        self, db: Session, users: dict[Role, User]
    ) -> None:
        """The concrete regression: the old store held `"password": "admin1234"`."""
        stored = db.get(User, users[Role.SUPER_ADMIN].id)
        assert stored is not None
        assert stored.hashed_password != DEFAULT_PASSWORD
        assert stored.hashed_password.startswith("$argon2")


class TestLoginThrottle:
    def test_repeated_failures_are_throttled(
        self, client: TestClient, users: dict[Role, User]
    ) -> None:
        email = users[Role.TPO].email
        for _ in range(5):
            assert login(client, email, "wrong").status_code == 401

        blocked = login(client, email, "wrong")
        assert blocked.status_code == 429
        assert blocked.json()["error"]["code"] == "TOO_MANY_ATTEMPTS"

    def test_throttle_blocks_even_the_correct_password(
        self, client: TestClient, users: dict[Role, User]
    ) -> None:
        """Otherwise the lockout does nothing against an online guessing attack."""
        email = users[Role.TPO].email
        for _ in range(5):
            login(client, email, "wrong")

        assert login(client, email, DEFAULT_PASSWORD).status_code == 429

    def test_throttle_is_per_email(self, client: TestClient, users: dict[Role, User]) -> None:
        """One account being attacked must not lock everyone else out."""
        for _ in range(5):
            login(client, users[Role.TPO].email, "wrong")

        assert login(client, users[Role.HOD].email, DEFAULT_PASSWORD).status_code == 200

    def test_successful_login_clears_the_counter(
        self, client: TestClient, users: dict[Role, User]
    ) -> None:
        email = users[Role.TPO].email
        for _ in range(4):
            login(client, email, "wrong")

        assert login(client, email, DEFAULT_PASSWORD).status_code == 200
        for _ in range(4):
            assert login(client, email, "wrong").status_code == 401


class TestRefreshRotation:
    def test_refresh_returns_a_new_pair(self, client: TestClient, users: dict[Role, User]) -> None:
        tokens = login(client, users[Role.TPO].email, DEFAULT_PASSWORD).json()
        response = client.post("/api/v1/auth/token/refresh/", json={"refresh": tokens["refresh"]})

        assert response.status_code == 200
        assert response.json()["refresh"] != tokens["refresh"], "token should rotate"

    def test_used_refresh_token_is_revoked(
        self, client: TestClient, users: dict[Role, User]
    ) -> None:
        """Rotation makes a stolen refresh token usable at most once."""
        tokens = login(client, users[Role.TPO].email, DEFAULT_PASSWORD).json()
        client.post("/api/v1/auth/token/refresh/", json={"refresh": tokens["refresh"]})

        replay = client.post("/api/v1/auth/token/refresh/", json={"refresh": tokens["refresh"]})
        assert replay.status_code == 401
        assert replay.json()["error"]["code"] == "INVALID_REFRESH_TOKEN"

    def test_new_access_token_works(self, client: TestClient, users: dict[Role, User]) -> None:
        tokens = login(client, users[Role.TPO].email, DEFAULT_PASSWORD).json()
        refreshed = client.post(
            "/api/v1/auth/token/refresh/", json={"refresh": tokens["refresh"]}
        ).json()

        me = client.get(
            "/api/v1/auth/me/", headers={"Authorization": f"Bearer {refreshed['access']}"}
        )
        assert me.status_code == 200

    @pytest.mark.parametrize("bad", ["", "garbage", "a.b.c"])
    def test_malformed_refresh_token_is_rejected(self, client: TestClient, bad: str) -> None:
        assert client.post("/api/v1/auth/token/refresh/", json={"refresh": bad}).status_code == 401

    def test_access_token_is_not_accepted_as_a_refresh_token(
        self, client: TestClient, users: dict[Role, User]
    ) -> None:
        tokens = login(client, users[Role.TPO].email, DEFAULT_PASSWORD).json()
        response = client.post("/api/v1/auth/token/refresh/", json={"refresh": tokens["access"]})
        assert response.status_code == 401


class TestLogout:
    def test_logout_revokes_the_refresh_token(
        self, client: TestClient, users: dict[Role, User]
    ) -> None:
        """The old implementation could not revoke anything; this is the point."""
        tokens = login(client, users[Role.TPO].email, DEFAULT_PASSWORD).json()
        headers = {"Authorization": f"Bearer {tokens['access']}"}

        assert client.post("/api/v1/auth/logout/", headers=headers).status_code == 200

        replay = client.post("/api/v1/auth/token/refresh/", json={"refresh": tokens["refresh"]})
        assert replay.status_code == 401

    def test_logout_requires_authentication(self, client: TestClient) -> None:
        assert client.post("/api/v1/auth/logout/").status_code == 401


class TestChangePassword:
    def _change(self, client: TestClient, headers: dict, current: str, new: str, confirm: str):  # type: ignore[no-untyped-def]
        return client.post(
            "/api/v1/auth/change-password/",
            json={
                "current_password": current,
                "new_password": new,
                "confirm_password": confirm,
            },
            headers=headers,
        )

    def test_password_can_be_changed_and_used(
        self, client: TestClient, users: dict[Role, User], auth_headers
    ) -> None:
        headers = auth_headers(Role.TPO)
        new_password = "a-brand-new-password"

        changed = self._change(client, headers, DEFAULT_PASSWORD, new_password, new_password)
        assert changed.status_code == 200
        assert login(client, users[Role.TPO].email, new_password).status_code == 200
        assert login(client, users[Role.TPO].email, DEFAULT_PASSWORD).status_code == 401

    def test_wrong_current_password_is_rejected(self, client: TestClient, auth_headers) -> None:
        response = self._change(
            client, auth_headers(Role.TPO), "wrong", "new-password-1", "new-password-1"
        )
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "INCORRECT_PASSWORD"

    def test_mismatched_confirmation_is_rejected(self, client: TestClient, auth_headers) -> None:
        response = self._change(
            client, auth_headers(Role.TPO), DEFAULT_PASSWORD, "new-password-1", "new-password-2"
        )
        assert response.json()["error"]["code"] == "PASSWORD_MISMATCH"

    def test_reusing_the_current_password_is_rejected(
        self, client: TestClient, auth_headers
    ) -> None:
        response = self._change(
            client, auth_headers(Role.TPO), DEFAULT_PASSWORD, DEFAULT_PASSWORD, DEFAULT_PASSWORD
        )
        assert response.json()["error"]["code"] == "PASSWORD_UNCHANGED"

    def test_changing_password_signs_out_other_sessions(
        self, client: TestClient, users: dict[Role, User]
    ) -> None:
        """A stolen token must stop working once the user changes their password."""
        stolen = login(client, users[Role.TPO].email, DEFAULT_PASSWORD).json()
        current = login(client, users[Role.TPO].email, DEFAULT_PASSWORD).json()

        self._change(
            client,
            {"Authorization": f"Bearer {current['access']}"},
            DEFAULT_PASSWORD,
            "another-new-password",
            "another-new-password",
        )

        replay = client.post("/api/v1/auth/token/refresh/", json={"refresh": stolen["refresh"]})
        assert replay.status_code == 401


class TestAccountStateAffectsLiveTokens:
    def test_deactivating_an_account_invalidates_its_token_immediately(
        self, client: TestClient, db: Session, users: dict[Role, User], auth_headers
    ) -> None:
        """Deactivation must not wait for the access token to expire."""
        headers = auth_headers(Role.VOLUNTEER)
        assert client.get("/api/v1/auth/me/", headers=headers).status_code == 200

        users[Role.VOLUNTEER].is_active = False
        db.flush()

        response = client.get("/api/v1/auth/me/", headers=headers)
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "INACTIVE_ACCOUNT"


class TestDemoAccounts:
    def test_endpoint_is_hidden_outside_development(self, client: TestClient) -> None:
        """The suite runs with APP_ENV=test, so this must be absent."""
        assert client.get("/api/v1/auth/demo-accounts/").status_code == 404
