"""Role x endpoint authorization matrix.

The highest-value test in the codebase. The pre-rewrite application had
authentication but incomplete authorization: ``PATCH /auth/users/{id}/`` and
every stub router accepted any authenticated caller, so a STUDENT token could
promote itself to SUPER_ADMIN.

Each case asserts the *whole* set of roles that may reach an endpoint, so
widening access shows up as a failure rather than passing silently.
"""

from __future__ import annotations

from collections.abc import Callable

import pytest
from fastapi.testclient import TestClient

from app.core.rbac import Role

ALL_ROLES = frozenset(Role)
STAFF = frozenset({Role.SUPER_ADMIN, Role.TPO, Role.HOD, Role.VOLUNTEER})
ADMIN_ONLY = frozenset({Role.SUPER_ADMIN})
REFERENCE_MANAGERS = frozenset({Role.SUPER_ADMIN, Role.TPO})

#: (method, path, json body, roles permitted)
MATRIX: list[tuple[str, str, dict | None, frozenset[Role]]] = [
    # Any signed-in user
    ("GET", "/api/v1/auth/me/", None, ALL_ROLES),
    ("GET", "/api/v1/common/branches/", None, ALL_ROLES),
    ("GET", "/api/v1/common/roles/", None, ALL_ROLES),
    ("GET", "/api/v1/students/", None, ALL_ROLES),
    ("GET", "/api/v1/analytics/dashboard/", None, ALL_ROLES),
    # User administration — the escalation path that was open
    ("GET", "/api/v1/auth/users/", None, ADMIN_ONLY),
    ("PATCH", "/api/v1/auth/users/1/", {"role": "SUPER_ADMIN"}, ADMIN_ONLY),
    (
        "POST",
        "/api/v1/auth/users/",
        {
            "username": "newperson",
            "email": "newperson@test.edu",
            "password": "a-long-enough-password",
            "role": "VOLUNTEER",
        },
        ADMIN_ONLY,
    ),
    # Reference data writes
    ("POST", "/api/v1/common/branches/", {"name": "Aero", "code": "AERO"}, REFERENCE_MANAGERS),
    ("PATCH", "/api/v1/common/branches/1/", {"name": "Renamed"}, REFERENCE_MANAGERS),
    ("DELETE", "/api/v1/common/branches/1/", None, REFERENCE_MANAGERS),
    # Dispatching messages must never be student-reachable
    ("POST", "/api/v1/communications/send-email/", {}, STAFF),
    ("POST", "/api/v1/communications/send-sms/", {}, STAFF),
    ("GET", "/api/v1/communications/notifications/", None, STAFF),
]


def _call(client: TestClient, method: str, path: str, body: dict | None, headers: dict) -> int:
    response = client.request(method, path, json=body, headers=headers)
    return response.status_code


@pytest.mark.parametrize(("method", "path", "body", "allowed"), MATRIX)
@pytest.mark.parametrize("role", list(Role))
def test_authorization_matrix(
    client: TestClient,
    auth_headers: Callable[[Role], dict[str, str]],
    method: str,
    path: str,
    body: dict | None,
    allowed: frozenset[Role],
    role: Role,
) -> None:
    status = _call(client, method, path, body, auth_headers(role))

    if role in allowed:
        assert status != 403, f"{role.value} should be permitted to {method} {path} but got 403"
    else:
        assert status == 403, (
            f"{role.value} must NOT be permitted to {method} {path} — got {status}"
        )


@pytest.mark.parametrize(("method", "path", "body", "_allowed"), MATRIX)
def test_every_endpoint_rejects_anonymous_callers(
    client: TestClient,
    method: str,
    path: str,
    body: dict | None,
    _allowed: frozenset[Role],
) -> None:
    """No route in the matrix may be reachable without a token."""
    assert _call(client, method, path, body, {}) == 401


@pytest.mark.parametrize(("method", "path", "body", "_allowed"), MATRIX)
def test_every_endpoint_rejects_garbage_tokens(
    client: TestClient,
    method: str,
    path: str,
    body: dict | None,
    _allowed: frozenset[Role],
) -> None:
    headers = {"Authorization": "Bearer not-a-real-jwt"}
    assert _call(client, method, path, body, headers) == 401


def test_student_cannot_escalate_own_role(
    client: TestClient,
    auth_headers: Callable[[Role], dict[str, str]],
    users: dict[Role, object],
) -> None:
    """The concrete regression: self-promotion via the user admin endpoint."""
    student = users[Role.STUDENT]
    response = client.patch(
        f"/api/v1/auth/users/{student.id}/",  # type: ignore[attr-defined]
        json={"role": "SUPER_ADMIN"},
        headers=auth_headers(Role.STUDENT),
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PERMISSION_DENIED"

    # And the role really is unchanged.
    me = client.get("/api/v1/auth/me/", headers=auth_headers(Role.STUDENT))
    assert me.json()["role"] == "STUDENT"
