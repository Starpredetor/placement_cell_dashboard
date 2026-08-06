"""FastAPI application factory.

Phase 0 changes the wiring only: configuration, CORS, and error handling. The
v1 routers still serve the pre-rewrite in-memory data and are replaced domain
by domain from Phase 1 onward (docs/REWRITE_PLAN.md §7).
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import Settings, get_settings
from app.core.errors import register_exception_handlers


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()

    app = FastAPI(
        title="Placement Cell Dashboard API",
        version="0.1.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/schema",
    )

    # Explicit origins, not "*". The previous wildcard was paired with
    # allow_credentials=True, which browsers reject and which would have been
    # unsafe had they not.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    @app.get("/health", tags=["health"])
    def health_check() -> dict[str, str]:
        return {"status": "ok", "environment": settings.app_env}

    app.include_router(api_router, prefix="/api/v1")

    return app


app = create_app()
