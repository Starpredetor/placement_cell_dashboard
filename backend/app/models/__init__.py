"""SQLAlchemy models.

Every model module must be imported here. Alembic autogeneration and the test
schema both work from ``Base.metadata``, which is only populated as a
side-effect of importing the modules that define the tables — a model that is
not imported here is silently missing from both.

Domain modules are added by their respective phases:
    Phase 1  user          ✅
    Phase 2  reference     ✅  student
    Phase 3  student documents
    Phase 4  training
    Phase 5  placement
    Phase 6  event
    Phase 8  notification
"""

from __future__ import annotations

from app.models.base import Base, TimestampMixin
from app.models.reference import (
    REFERENCE_MODELS,
    AcademicYear,
    Batch,
    Branch,
    Company,
    Division,
    JobRole,
)
from app.models.user import AuditLog, RefreshToken, User

__all__ = [
    "REFERENCE_MODELS",
    "AcademicYear",
    "AuditLog",
    "Base",
    "Batch",
    "Branch",
    "Company",
    "Division",
    "JobRole",
    "RefreshToken",
    "TimestampMixin",
    "User",
]
