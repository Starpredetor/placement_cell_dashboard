from fastapi import APIRouter, Depends

from app.api.deps import get_current_user_legacy as get_current_user
from app.schemas.common import PaginatedResponse
from app.schemas.generic import GenericItem

router = APIRouter()


@router.get("/opportunities/", response_model=PaginatedResponse[GenericItem])
def opportunities(
    _current_user: dict = Depends(get_current_user),
) -> PaginatedResponse[GenericItem]:
    items = [
        GenericItem(id=1, name="Graduate Engineer Trainee"),
        GenericItem(id=2, name="Software Analyst"),
    ]
    return PaginatedResponse[GenericItem](count=len(items), next=None, previous=None, results=items)


@router.get("/applications/", response_model=PaginatedResponse[GenericItem])
def applications(_current_user: dict = Depends(get_current_user)) -> PaginatedResponse[GenericItem]:
    items = [GenericItem(id=1, name="Application #1")]
    return PaginatedResponse[GenericItem](count=len(items), next=None, previous=None, results=items)


@router.post("/applications/")
def create_application(
    _payload: dict, _current_user: dict = Depends(get_current_user)
) -> dict[str, str]:
    return {"detail": "Application created"}


@router.put("/applications/{application_id}/")
def update_application(
    application_id: int, _payload: dict, _current_user: dict = Depends(get_current_user)
) -> dict[str, str | int]:
    return {"detail": "Application updated", "id": application_id}
