"""Role policy — pure functions, no HTTP or database."""

from __future__ import annotations

from dataclasses import dataclass

import pytest

from app.core.rbac import (
    REFERENCE_MANAGER_ROLES,
    STAFF_ROLES,
    USER_ADMIN_ROLES,
    Role,
    can_access_branch,
    can_view_unmasked_pii,
)


@dataclass
class FakeUser:
    role: Role
    branch_id: int | None = None
    id: int = 1


class TestRoleSets:
    def test_students_are_never_staff(self) -> None:
        assert Role.STUDENT not in STAFF_ROLES

    def test_every_non_student_role_is_staff(self) -> None:
        assert set(Role) - {Role.STUDENT} == STAFF_ROLES

    def test_user_administration_is_super_admin_only(self) -> None:
        """Widening this is how privilege escalation gets reintroduced."""
        assert {Role.SUPER_ADMIN} == USER_ADMIN_ROLES

    def test_reference_management_excludes_volunteers_and_students(self) -> None:
        assert {Role.SUPER_ADMIN, Role.TPO} == REFERENCE_MANAGER_ROLES


class TestBranchScoping:
    @pytest.mark.parametrize("role", [Role.SUPER_ADMIN, Role.TPO, Role.VOLUNTEER])
    def test_unscoped_roles_see_every_branch(self, role: Role) -> None:
        assert can_access_branch(FakeUser(role), 1)
        assert can_access_branch(FakeUser(role), 999)

    def test_hod_sees_own_branch(self) -> None:
        assert can_access_branch(FakeUser(Role.HOD, branch_id=7), 7)

    def test_hod_cannot_see_another_branch(self) -> None:
        assert not can_access_branch(FakeUser(Role.HOD, branch_id=7), 8)

    def test_hod_without_a_branch_sees_nothing(self) -> None:
        """Fails closed: an unset column must never widen access."""
        assert not can_access_branch(FakeUser(Role.HOD, branch_id=None), 7)
        assert not can_access_branch(FakeUser(Role.HOD, branch_id=None), None)

    def test_students_have_no_branch_wide_access(self) -> None:
        assert not can_access_branch(FakeUser(Role.STUDENT, branch_id=7), 7)


class TestPiiVisibility:
    def test_super_admin_sees_unmasked(self) -> None:
        assert can_view_unmasked_pii(FakeUser(Role.SUPER_ADMIN), owner_user_id=42)

    def test_student_sees_their_own(self) -> None:
        assert can_view_unmasked_pii(FakeUser(Role.STUDENT, id=42), owner_user_id=42)

    def test_student_cannot_see_another_students(self) -> None:
        assert not can_view_unmasked_pii(FakeUser(Role.STUDENT, id=42), owner_user_id=43)

    @pytest.mark.parametrize("role", [Role.TPO, Role.HOD, Role.VOLUNTEER])
    def test_other_staff_do_not_see_unmasked_pii(self, role: Role) -> None:
        """Aadhaar and PAN are not needed to run placements."""
        assert not can_view_unmasked_pii(FakeUser(role), owner_user_id=42)
