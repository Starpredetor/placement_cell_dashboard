from fastapi import APIRouter

from app.api.v1 import analytics, auth, common, communications, events, placements, students, training

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(placements.router, prefix="/placements", tags=["placements"])
api_router.include_router(training.router, prefix="/training", tags=["training"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(communications.router, prefix="/communications", tags=["communications"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(common.router, prefix="/common", tags=["common"])
