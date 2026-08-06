"""Reference data.

These were hardcoded Python lists in ``api/v1/common.py`` — branches,
divisions, batches, companies, job roles. As tables they become admin-editable
and, more importantly, referenceable: students point at a branch, opportunities
at a company and job role. A string list cannot carry a foreign key.

All five share the same shape, so ``ReferenceMixin`` carries it.
"""

from __future__ import annotations

from sqlalchemy import Boolean, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class ReferenceMixin(TimestampMixin):
    """Shared columns for simple lookup tables."""

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    #: Controls list order in dropdowns; ties fall back to name.
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class Branch(Base, ReferenceMixin):
    """An academic department, e.g. Computer Engineering."""

    __tablename__ = "branches"
    __table_args__ = (
        UniqueConstraint("code", name="uq_branches_code"),
        UniqueConstraint("name", name="uq_branches_name"),
    )

    code: Mapped[str] = mapped_column(String(16), nullable=False)


class Division(Base, ReferenceMixin):
    """A class division within a branch, e.g. A / B / C."""

    __tablename__ = "divisions"
    __table_args__ = (UniqueConstraint("name", name="uq_divisions_name"),)


class Batch(Base, ReferenceMixin):
    """A training batch students are segmented into."""

    __tablename__ = "batches"
    __table_args__ = (UniqueConstraint("name", name="uq_batches_name"),)


class Company(Base, ReferenceMixin):
    """A recruiting company."""

    __tablename__ = "companies"
    __table_args__ = (UniqueConstraint("name", name="uq_companies_name"),)

    website: Mapped[str | None] = mapped_column(String(255), nullable=True)


class JobRole(Base, ReferenceMixin):
    """A role companies recruit for, e.g. Software Engineer."""

    __tablename__ = "job_roles"
    __table_args__ = (UniqueConstraint("name", name="uq_job_roles_name"),)


class AcademicYear(Base, ReferenceMixin):
    """An academic session, e.g. "2025-26".

    ``name`` holds the label. ``start_year`` is the calendar year the session
    opens in, which is what the rollover logic in ``services/progression``
    compares against.
    """

    __tablename__ = "academic_years"
    __table_args__ = (UniqueConstraint("name", name="uq_academic_years_name"),)

    start_year: Mapped[int] = mapped_column(Integer, nullable=False)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


#: Every simple lookup table, for the generic reference endpoints.
REFERENCE_MODELS = {
    "branches": Branch,
    "divisions": Division,
    "batches": Batch,
    "companies": Company,
    "job-roles": JobRole,
    "academic-years": AcademicYear,
}
