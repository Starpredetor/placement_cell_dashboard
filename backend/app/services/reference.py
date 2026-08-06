"""Reference data CRUD."""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, NotFoundError
from app.models.reference import REFERENCE_MODELS
from app.models.user import User
from app.services import audit


def resolve_model(kind: str) -> Any:
    """Map a URL segment (``branches``, ``job-roles``) to its model."""
    model = REFERENCE_MODELS.get(kind)
    if model is None:
        raise NotFoundError(
            f"Unknown reference type '{kind}'.",
            details={"available": sorted(REFERENCE_MODELS)},
        )
    return model


def list_items(db: Session, kind: str, *, include_inactive: bool = False) -> list[Any]:
    model = resolve_model(kind)
    stmt = select(model)
    if not include_inactive:
        stmt = stmt.where(model.is_active.is_(True))
    stmt = stmt.order_by(model.sort_order, model.name)
    return list(db.execute(stmt).scalars().all())


def get_item(db: Session, kind: str, item_id: int) -> Any:
    model = resolve_model(kind)
    item = db.get(model, item_id)
    if item is None:
        raise NotFoundError(f"No {kind} entry with id {item_id}.")
    return item


def create_item(db: Session, kind: str, payload: dict[str, Any], *, actor: User) -> Any:
    model = resolve_model(kind)

    with _conflict_guard(db, kind, payload):
        item = model(**payload)
        db.add(item)

    audit.record(
        db,
        actor=actor,
        action="reference_created",
        entity_type=kind,
        entity_id=item.id,
        after=payload,
    )
    db.commit()
    return item


def update_item(
    db: Session, kind: str, item_id: int, payload: dict[str, Any], *, actor: User
) -> Any:
    item = get_item(db, kind, item_id)

    before = {field: getattr(item, field) for field in payload}

    with _conflict_guard(db, kind, payload):
        for field, value in payload.items():
            setattr(item, field, value)

    changed_before, changed_after = audit.diff(before, payload)
    if changed_after:
        audit.record(
            db,
            actor=actor,
            action="reference_updated",
            entity_type=kind,
            entity_id=item.id,
            before=changed_before,
            after=changed_after,
        )
    db.commit()
    return item


def deactivate_item(db: Session, kind: str, item_id: int, *, actor: User) -> Any:
    """Soft-delete.

    Reference rows are pointed at by students and opportunities, so removing
    one would either fail on the foreign key or orphan historical records.
    Deactivating keeps history intact and hides the entry from new selections.
    """
    item = get_item(db, kind, item_id)
    if not item.is_active:
        return item

    item.is_active = False
    audit.record(
        db,
        actor=actor,
        action="reference_deactivated",
        entity_type=kind,
        entity_id=item.id,
        before={"is_active": True},
        after={"is_active": False},
    )
    db.commit()
    return item


@contextmanager
def _conflict_guard(db: Session, kind: str, payload: dict[str, Any]) -> Iterator[None]:
    """Turn a unique-constraint violation into a 409 rather than a 500.

    The mutation runs inside a SAVEPOINT so a violation unwinds only this
    statement; a plain ``db.rollback()`` would discard the whole transaction,
    including the surrounding one the test fixture relies on for isolation.

    The savepoint must open *before* the caller touches the session:
    ``begin_nested()`` autoflushes, so opening it afterwards would emit the
    offending INSERT outside this ``try`` and let the IntegrityError escape.
    """
    savepoint = db.begin_nested()
    try:
        yield
        db.flush()
    except IntegrityError as exc:
        savepoint.rollback()
        raise ConflictError(
            f"A {kind} entry with that name or code already exists.",
            code="DUPLICATE_REFERENCE",
            details={"name": payload.get("name"), "code": payload.get("code")},
        ) from exc
    else:
        savepoint.commit()


def get_branch_by_code(db: Session, code: str) -> Any:
    from app.models.reference import Branch

    stmt = select(Branch).where(func.lower(Branch.code) == func.lower(code))
    return db.execute(stmt).scalar_one_or_none()
