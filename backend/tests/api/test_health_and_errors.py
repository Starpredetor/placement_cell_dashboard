"""Application wiring: health, CORS, and the uniform error envelope."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.errors import ConflictError, NotFoundError


def test_health_check(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_unknown_route_uses_error_envelope(client: TestClient) -> None:
    response = client.get("/api/v1/does-not-exist/")
    assert response.status_code == 404

    body = response.json()
    assert set(body) == {"error"}
    assert body["error"]["code"] == "NOT_FOUND"
    assert "message" in body["error"]
    assert body["error"]["details"] == {}


def test_app_error_maps_to_envelope(app: FastAPI, client: TestClient) -> None:
    @app.get("/_test/conflict")
    def _raise() -> None:
        raise ConflictError(
            "Already applied.",
            code="DUPLICATE_APPLICATION",
            details={"opportunity_id": 7},
        )

    response = client.get("/_test/conflict")

    assert response.status_code == 409
    assert response.json() == {
        "error": {
            "code": "DUPLICATE_APPLICATION",
            "message": "Already applied.",
            "details": {"opportunity_id": 7},
        }
    }


def test_not_found_error_default_code(app: FastAPI, client: TestClient) -> None:
    @app.get("/_test/missing")
    def _raise() -> None:
        raise NotFoundError("Student not found.")

    response = client.get("/_test/missing")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_validation_error_reports_fields(app: FastAPI, client: TestClient) -> None:
    from pydantic import BaseModel

    class Payload(BaseModel):
        count: int

    @app.post("/_test/validate")
    def _validate(payload: Payload) -> dict[str, int]:
        return {"count": payload.count}

    response = client.post("/_test/validate", json={"count": "not-a-number"})

    assert response.status_code == 422
    body = response.json()["error"]
    assert body["code"] == "VALIDATION_ERROR"
    assert body["details"]["fields"], "field-level detail should be reported"


def test_cors_is_not_a_wildcard(client: TestClient, settings) -> None:  # type: ignore[no-untyped-def]
    """The previous config paired allow_origins=['*'] with credentials."""
    assert "*" not in settings.cors_origins

    allowed = settings.cors_origins[0]
    response = client.get("/health", headers={"Origin": allowed})
    assert response.headers.get("access-control-allow-origin") == allowed
