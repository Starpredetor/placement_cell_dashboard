"""Reference data endpoints.

Previously these returned hardcoded Python lists of strings. They now read the
reference tables, and the payloads carry an ``id`` because students and
opportunities reference these rows by foreign key.

Reads are open to any signed-in user (every form needs the dropdowns); writes
require a reference manager.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import ValidationError as PydanticValidationError
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_authenticated, require_roles
from app.core.errors import ValidationError
from app.core.rbac import REFERENCE_MANAGER_ROLES, Role
from app.models.user import User
from app.schemas.reference import (
    AcademicYearCreateRequest,
    BranchCreateRequest,
    CompanyCreateRequest,
    ReferenceCreateRequest,
    ReferenceUpdateRequest,
)
from app.services import reference as reference_service

router = APIRouter()

require_reference_manager = require_roles(*REFERENCE_MANAGER_ROLES)

#: URL segment -> request model for creation, so each kind validates its own
#: extra fields (a branch needs a code, an academic year a start year).
CREATE_SCHEMAS: dict[str, type[ReferenceCreateRequest]] = {
    "branches": BranchCreateRequest,
    "companies": CompanyCreateRequest,
    "academic-years": AcademicYearCreateRequest,
    "divisions": ReferenceCreateRequest,
    "batches": ReferenceCreateRequest,
    "job-roles": ReferenceCreateRequest,
}


def _serialise(item: Any) -> dict[str, Any]:
    """Return the columns a client needs, without leaking timestamps."""
    data: dict[str, Any] = {
        "id": item.id,
        "name": item.name,
        "is_active": item.is_active,
        "sort_order": item.sort_order,
    }
    for optional in ("code", "website", "start_year", "is_current"):
        if hasattr(item, optional):
            data[optional] = getattr(item, optional)
    return data


@router.get("/roles/")
def list_roles(_user: User = Depends(require_authenticated)) -> list[str]:
    """The role vocabulary, for account-management dropdowns.

    Declared before the generic ``/{kind}/`` route: FastAPI matches in
    declaration order, so the wildcard would otherwise swallow this path and
    return a 404 for an unknown reference type.
    """
    return [role.value for role in Role]


@router.get("/{kind}/")
def list_reference(
    kind: str,
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    _user: User = Depends(require_authenticated),
) -> list[dict[str, Any]]:
    items = reference_service.list_items(db, kind, include_inactive=include_inactive)
    return [_serialise(item) for item in items]


@router.post("/{kind}/", status_code=201)
def create_reference(
    kind: str,
    payload: dict[str, Any],
    db: Session = Depends(get_db),
    actor: User = Depends(require_reference_manager),
) -> dict[str, Any]:
    reference_service.resolve_model(kind)  # 404 before validating the body
    schema = CREATE_SCHEMAS.get(kind, ReferenceCreateRequest)

    # Validating by hand (the schema depends on `kind`, which FastAPI cannot
    # express in a signature) means pydantic's own error escapes as a 500
    # unless it is converted here — FastAPI only wraps errors it raised itself.
    try:
        validated = schema.model_validate(payload)
    except PydanticValidationError as exc:
        raise ValidationError(
            "The request body failed validation.",
            details={
                "fields": [
                    {
                        "location": list(err.get("loc", ())),
                        "message": err.get("msg", ""),
                        "type": err.get("type", ""),
                    }
                    for err in exc.errors()
                ]
            },
        ) from exc

    item = reference_service.create_item(
        db, kind, validated.model_dump(exclude_unset=False), actor=actor
    )
    return _serialise(item)


@router.patch("/{kind}/{item_id}/")
def update_reference(
    kind: str,
    item_id: int,
    payload: ReferenceUpdateRequest,
    db: Session = Depends(get_db),
    actor: User = Depends(require_reference_manager),
) -> dict[str, Any]:
    changes = payload.model_dump(exclude_unset=True)

    # Drop fields the target model does not define, so a stray `code` on a
    # division is rejected rather than silently set as an attribute.
    model = reference_service.resolve_model(kind)
    changes = {k: v for k, v in changes.items() if hasattr(model, k)}

    item = reference_service.update_item(db, kind, item_id, changes, actor=actor)
    return _serialise(item)


@router.delete("/{kind}/{item_id}/")
def deactivate_reference(
    kind: str,
    item_id: int,
    db: Session = Depends(get_db),
    actor: User = Depends(require_reference_manager),
) -> dict[str, Any]:
    item = reference_service.deactivate_item(db, kind, item_id, actor=actor)
    return _serialise(item)
