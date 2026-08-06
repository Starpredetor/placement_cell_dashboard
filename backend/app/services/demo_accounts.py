"""The seeded demo accounts.

One definition, used by both ``scripts/seed.py`` (to create the accounts) and
``GET /auth/demo-accounts/`` (to offer one-click sign-in). Keeping them in one
place is what stops the login screen advertising credentials that the seed no
longer creates.

These are fixtures for a portfolio demo, not secrets: the passwords are
intentionally visible, and the endpoint that serves them is disabled outside
``APP_ENV=development``.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.core.rbac import Role


@dataclass(frozen=True)
class DemoAccountSpec:
    role: Role
    username: str
    email: str
    password: str
    first_name: str
    last_name: str
    label: str
    description: str


DEMO_ACCOUNTS: tuple[DemoAccountSpec, ...] = (
    DemoAccountSpec(
        role=Role.SUPER_ADMIN,
        username="admin",
        email="admin@college.edu",
        password="admin1234",
        first_name="Super",
        last_name="Admin",
        label="Super Admin",
        description="Full access, including user administration and the audit log.",
    ),
    DemoAccountSpec(
        role=Role.TPO,
        username="tpo",
        email="tpo@college.edu",
        password="tpo12345",
        first_name="Priya",
        last_name="Sharma",
        label="Training & Placement Officer",
        description="Runs placements and training across every branch.",
    ),
    DemoAccountSpec(
        role=Role.HOD,
        username="hod",
        email="hod@college.edu",
        password="hod12345",
        first_name="Ramesh",
        last_name="Iyer",
        label="Head of Department",
        description="Scoped to a single branch — a good way to see row-level access.",
    ),
    DemoAccountSpec(
        role=Role.VOLUNTEER,
        username="volunteer",
        email="volunteer@college.edu",
        password="volunteer1234",
        first_name="Rohan",
        last_name="Joshi",
        label="Volunteer",
        description="Marks attendance; cannot create drives or edit students.",
    ),
    DemoAccountSpec(
        role=Role.STUDENT,
        username="student",
        email="student@college.edu",
        password="student1234",
        first_name="Aarav",
        last_name="Patil",
        label="Student",
        description="Sees only their own record and opportunities they qualify for.",
    ),
)
