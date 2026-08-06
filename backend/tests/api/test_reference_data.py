"""Reference data endpoints.

These replaced hardcoded string lists. The behaviour that matters: they are
backed by real rows, they carry ids so other tables can reference them, and
they soft-delete rather than breaking foreign keys.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.rbac import Role
from app.models.reference import Branch, Company

KINDS = ["branches", "divisions", "batches", "companies", "job-roles", "academic-years"]


@pytest.fixture
def seeded(db: Session, branch: Branch) -> Branch:
    db.add(Company(name="TechNova", website="https://technova.example.com"))
    db.flush()
    return branch


class TestReads:
    def test_branches_return_objects_with_ids(
        self, client: TestClient, seeded: Branch, auth_headers
    ) -> None:
        """The old endpoint returned bare strings, which nothing can reference."""
        response = client.get("/api/v1/common/branches/", headers=auth_headers(Role.STUDENT))

        assert response.status_code == 200
        item = response.json()[0]
        assert item["id"] == seeded.id
        assert item["name"] == "Computer Engineering"
        assert item["code"] == "CE"

    @pytest.mark.parametrize("kind", KINDS)
    def test_every_kind_is_reachable(
        self, client: TestClient, seeded: Branch, kind: str, auth_headers
    ) -> None:
        response = client.get(f"/api/v1/common/{kind}/", headers=auth_headers(Role.STUDENT))
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_unknown_kind_is_a_404_not_a_500(self, client: TestClient, auth_headers) -> None:
        response = client.get("/api/v1/common/unicorns/", headers=auth_headers(Role.TPO))
        assert response.status_code == 404
        assert response.json()["error"]["code"] == "NOT_FOUND"

    def test_roles_endpoint_lists_the_role_vocabulary(
        self, client: TestClient, auth_headers
    ) -> None:
        """Declared before the wildcard route, or it would 404."""
        response = client.get("/api/v1/common/roles/", headers=auth_headers(Role.STUDENT))
        assert response.status_code == 200
        assert set(response.json()) == {r.value for r in Role}

    def test_inactive_entries_are_hidden_by_default(
        self, client: TestClient, db: Session, seeded: Branch, auth_headers
    ) -> None:
        db.add(Branch(code="OLD", name="Discontinued Branch", is_active=False))
        db.flush()

        visible = client.get("/api/v1/common/branches/", headers=auth_headers(Role.TPO)).json()
        assert [b["code"] for b in visible] == ["CE"]

        everything = client.get(
            "/api/v1/common/branches/?include_inactive=true", headers=auth_headers(Role.TPO)
        ).json()
        assert {b["code"] for b in everything} == {"CE", "OLD"}


class TestWrites:
    def test_tpo_can_create_a_branch(self, client: TestClient, auth_headers) -> None:
        response = client.post(
            "/api/v1/common/branches/",
            json={"name": "Aeronautical", "code": "AERO"},
            headers=auth_headers(Role.TPO),
        )
        assert response.status_code == 201
        assert response.json()["code"] == "AERO"

    def test_duplicate_name_is_a_conflict_not_a_500(
        self, client: TestClient, seeded: Branch, auth_headers
    ) -> None:
        response = client.post(
            "/api/v1/common/branches/",
            json={"name": "Computer Engineering", "code": "CE2"},
            headers=auth_headers(Role.TPO),
        )
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "DUPLICATE_REFERENCE"

    def test_branch_requires_a_code(self, client: TestClient, auth_headers) -> None:
        response = client.post(
            "/api/v1/common/branches/",
            json={"name": "No Code Here"},
            headers=auth_headers(Role.TPO),
        )
        assert response.status_code == 422

    def test_update_renames(self, client: TestClient, seeded: Branch, auth_headers) -> None:
        response = client.patch(
            f"/api/v1/common/branches/{seeded.id}/",
            json={"name": "Computer Science & Engineering"},
            headers=auth_headers(Role.TPO),
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Computer Science & Engineering"

    def test_fields_foreign_to_the_model_are_ignored(
        self, client: TestClient, db: Session, auth_headers
    ) -> None:
        """A `code` on a division must not be set as a stray attribute."""
        from app.models.reference import Division

        division = Division(name="A")
        db.add(division)
        db.flush()

        response = client.patch(
            f"/api/v1/common/divisions/{division.id}/",
            json={"name": "A1", "code": "NOPE"},
            headers=auth_headers(Role.TPO),
        )
        assert response.status_code == 200
        assert "code" not in response.json()

    def test_delete_deactivates_rather_than_removing(
        self, client: TestClient, db: Session, seeded: Branch, auth_headers
    ) -> None:
        """Hard deletion would orphan every student pointing at the branch."""
        response = client.delete(
            f"/api/v1/common/branches/{seeded.id}/", headers=auth_headers(Role.TPO)
        )

        assert response.status_code == 200
        assert response.json()["is_active"] is False
        assert db.get(Branch, seeded.id) is not None, "the row must still exist"

    def test_update_of_a_missing_entry_is_a_404(self, client: TestClient, auth_headers) -> None:
        response = client.patch(
            "/api/v1/common/branches/9999/", json={"name": "X"}, headers=auth_headers(Role.TPO)
        )
        assert response.status_code == 404


class TestAuditTrail:
    def test_reference_changes_are_audited(
        self, client: TestClient, db: Session, auth_headers
    ) -> None:
        from app.models.user import AuditLog

        client.post(
            "/api/v1/common/companies/",
            json={"name": "Newly Added Corp"},
            headers=auth_headers(Role.TPO),
        )

        entries = db.query(AuditLog).filter(AuditLog.action == "reference_created").all()
        assert len(entries) == 1
        assert entries[0].entity_type == "companies"
        assert entries[0].actor_user_id is not None
