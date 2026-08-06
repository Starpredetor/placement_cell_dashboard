"""Reference data contracts.

These replace ``common.py``'s hardcoded string lists. The endpoints now return
objects with an ``id``, because students and opportunities reference them by
foreign key — a bare string cannot be pointed at.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ReferenceItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    is_active: bool
    sort_order: int


class BranchItem(ReferenceItem):
    code: str


class CompanyItem(ReferenceItem):
    website: str | None = None


class AcademicYearItem(ReferenceItem):
    start_year: int
    is_current: bool


class ReferenceCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    is_active: bool = True
    sort_order: int = 0


class BranchCreateRequest(ReferenceCreateRequest):
    code: str = Field(min_length=1, max_length=16)


class CompanyCreateRequest(ReferenceCreateRequest):
    website: str | None = Field(default=None, max_length=255)


class AcademicYearCreateRequest(ReferenceCreateRequest):
    start_year: int = Field(ge=1900, le=2200)
    is_current: bool = False


class ReferenceUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    is_active: bool | None = None
    sort_order: int | None = None
    code: str | None = Field(default=None, min_length=1, max_length=16)
    website: str | None = Field(default=None, max_length=255)
    start_year: int | None = Field(default=None, ge=1900, le=2200)
    is_current: bool | None = None
