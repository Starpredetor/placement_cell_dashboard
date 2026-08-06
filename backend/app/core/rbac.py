"""Roles and access policy.

Pure policy: no FastAPI, no database. The router-level dependency that applies
it lives in ``app.api.deps`` (``require_roles``), which keeps this module
importable from ``app.models`` without a cycle and testable without HTTP.

The previous implementation had authentication but no authorization — every
endpoint depended on ``get_current_user``, which only proved *someone* was
logged in, and no endpoint read the role. A STUDENT token could rewrite any
account. See the matrix in docs/REWRITE_PLAN.md §5.
"""

from __future__ import annotations

from enum import StrEnum
from typing import Protocol


class Role(StrEnum):
    SUPER_ADMIN = "SUPER_ADMIN"
    TPO = "TPO"
    HOD = "HOD"
    VOLUNTEER = "VOLUNTEER"
    STUDENT = "STUDENT"


class HasRole(Protocol):
    """Structural type for the checks below, so they need no ORM import."""

    role: Role
    branch_id: int | None


#: Everyone who is not a student.
STAFF_ROLES = frozenset({Role.SUPER_ADMIN, Role.TPO, Role.HOD, Role.VOLUNTEER})

#: May mark attendance for training, placement, and events.
ATTENDANCE_MARKER_ROLES = STAFF_ROLES

#: May administer placement opportunities and drives.
PLACEMENT_MANAGER_ROLES = frozenset({Role.SUPER_ADMIN, Role.TPO})

#: May manage reference data (branches, companies, ...).
REFERENCE_MANAGER_ROLES = frozenset({Role.SUPER_ADMIN, Role.TPO})

#: May create and edit student records. HOD is limited to their own branch,
#: which is a row-scoped rule enforced by ``can_access_branch``.
STUDENT_EDITOR_ROLES = frozenset({Role.SUPER_ADMIN, Role.TPO, Role.HOD})

#: May read the student directory.
STUDENT_VIEWER_ROLES = STAFF_ROLES

#: May manage user accounts and role assignments.
USER_ADMIN_ROLES = frozenset({Role.SUPER_ADMIN})


def can_access_branch(user: HasRole, branch_id: int | None) -> bool:
    """Row-scoped check: HOD sees only their own branch.

    A HOD with no branch assigned sees nothing rather than everything. Failing
    closed matters here — an unset column must never widen access.
    """
    if user.role in {Role.SUPER_ADMIN, Role.TPO, Role.VOLUNTEER}:
        return True
    if user.role == Role.HOD:
        return user.branch_id is not None and user.branch_id == branch_id
    return False


def can_view_unmasked_pii(user: HasRole, owner_user_id: int | None = None) -> bool:
    """Aadhaar/PAN are visible to SUPER_ADMIN, or to the student who owns them."""
    if user.role == Role.SUPER_ADMIN:
        return True
    if user.role == Role.STUDENT and owner_user_id is not None:
        return getattr(user, "id", None) == owner_user_id
    return False
