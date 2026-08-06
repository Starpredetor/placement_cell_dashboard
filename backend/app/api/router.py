"""API v1 router assembly.

Router-level dependencies are the floor, not the whole policy. Endpoints that
need finer rules declare their own ``require_roles``; these guarantee that no
route is reachable unauthenticated, and that the clearly staff-only areas are
closed even while their modules are still pre-rewrite stubs.

Per-endpoint rules arrive with each domain's phase (docs/REWRITE_PLAN.md §5).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import require_authenticated, require_roles
from app.api.v1 import (
    analytics,
    auth,
    common,
    communications,
    events,
    placements,
    students,
    training,
)
from app.core.rbac import STAFF_ROLES

authenticated = Depends(require_authenticated)
staff_only = Depends(require_roles(*STAFF_ROLES))

api_router = APIRouter()

# Auth declares its own guards per endpoint: login and refresh must stay open,
# and user administration is SUPER_ADMIN only.
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

api_router.include_router(
    common.router, prefix="/common", tags=["common"], dependencies=[authenticated]
)
api_router.include_router(
    students.router, prefix="/students", tags=["students"], dependencies=[authenticated]
)
api_router.include_router(
    placements.router,
    prefix="/placements",
    tags=["placements"],
    dependencies=[authenticated],
)
api_router.include_router(
    training.router, prefix="/training", tags=["training"], dependencies=[authenticated]
)
api_router.include_router(
    events.router, prefix="/events", tags=["events"], dependencies=[authenticated]
)
api_router.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["analytics"],
    dependencies=[authenticated],
)

# Dispatching email and SMS is staff-only. This router was previously reachable
# by any authenticated caller, including students.
api_router.include_router(
    communications.router,
    prefix="/communications",
    tags=["communications"],
    dependencies=[staff_only],
)
