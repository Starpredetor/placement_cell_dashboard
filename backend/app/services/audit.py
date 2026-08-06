"""Write-side audit trail."""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy.orm import Session

from app.core.clock import to_storage, utc_now
from app.models.user import AuditLog, User


def record(
    db: Session,
    *,
    actor: User | None,
    action: str,
    entity_type: str,
    entity_id: int | None = None,
    before: dict[str, Any] | None = None,
    after: dict[str, Any] | None = None,
) -> AuditLog:
    """Append an audit row.

    The caller commits. Audit entries belong to the same transaction as the
    change they describe — committing here would leave a record of an edit that
    a later failure rolled back.
    """
    changes: str | None = None
    if before is not None or after is not None:
        changes = json.dumps({"before": before or {}, "after": after or {}}, default=str)

    entry = AuditLog(
        actor_user_id=actor.id if actor else None,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        changes=changes,
        created_at=to_storage(utc_now()),
    )
    db.add(entry)
    return entry


def diff(before: dict[str, Any], after: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    """Reduce two snapshots to only the fields that actually changed.

    Storing whole records would bury the one edited field, and would copy
    sensitive values into the audit table for no reason.
    """
    changed = {k for k in after if before.get(k) != after.get(k)}
    return ({k: before.get(k) for k in changed}, {k: after[k] for k in changed})
