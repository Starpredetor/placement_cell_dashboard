"""Offset pagination shared by every list endpoint.

The response shape (``count``/``next``/``previous``/``results``) is carried over
from the existing API unchanged so the frontend contract does not churn — see
docs/REWRITE_PLAN.md §3.5.
"""

from __future__ import annotations

from typing import TypeVar
from urllib.parse import urlencode

from fastapi import Query, Request
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.schemas.common import PaginatedResponse

T = TypeVar("T")

DEFAULT_PAGE_SIZE = 25
MAX_PAGE_SIZE = 100


class PageParams:
    """Injectable ``?page=&page_size=`` dependency."""

    def __init__(
        self,
        page: int = Query(1, ge=1, description="1-indexed page number."),
        page_size: int = Query(
            DEFAULT_PAGE_SIZE,
            ge=1,
            le=MAX_PAGE_SIZE,
            description=f"Items per page (max {MAX_PAGE_SIZE}).",
        ),
    ) -> None:
        self.page = page
        self.page_size = page_size

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


def _page_url(request: Request | None, page: int, page_size: int) -> str | None:
    if request is None:
        return None
    params = dict(request.query_params)
    params["page"] = str(page)
    params["page_size"] = str(page_size)
    return f"{request.url.path}?{urlencode(params)}"


def paginate(
    db: Session,
    stmt: Select[tuple[T]],
    params: PageParams,
    request: Request | None = None,
) -> PaginatedResponse[T]:
    """Run ``stmt`` for one page and report the total.

    The count is computed by wrapping the statement as a subquery rather than
    fetching rows, so it stays O(1) in result size.
    """
    count_stmt = select(func.count()).select_from(stmt.order_by(None).subquery())
    total = db.execute(count_stmt).scalar_one()

    rows = list(db.execute(stmt.offset(params.offset).limit(params.page_size)).scalars().all())

    has_next = params.offset + len(rows) < total
    has_previous = params.page > 1

    return PaginatedResponse[T](
        count=total,
        next=_page_url(request, params.page + 1, params.page_size) if has_next else None,
        previous=(_page_url(request, params.page - 1, params.page_size) if has_previous else None),
        results=rows,
    )
