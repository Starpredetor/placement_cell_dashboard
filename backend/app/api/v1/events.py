from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user_legacy as get_current_user
from app.schemas.common import PaginatedResponse
from app.schemas.generic import GenericItem

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[GenericItem])
def list_events(_current_user: dict = Depends(get_current_user)) -> PaginatedResponse[GenericItem]:
    items = [
        GenericItem(id=1, name="Placement Orientation"),
        GenericItem(id=2, name="Resume Workshop"),
    ]
    return PaginatedResponse[GenericItem](count=len(items), next=None, previous=None, results=items)


@router.get("/{event_id}/")
def event_detail(
    event_id: int, _current_user: dict = Depends(get_current_user)
) -> dict[str, int | str]:
    return {"id": event_id, "name": f"Event {event_id}"}


@router.get("/{event_id}/attendees/")
def event_attendees(
    event_id: int, _current_user: dict = Depends(get_current_user)
) -> list[dict[str, str | int]]:
    return [{"id": 1, "name": "Aarav Patil", "event_id": event_id}]


@router.post("/{event_id}/register/")
def register_event(
    event_id: int, _current_user: dict = Depends(get_current_user)
) -> dict[str, str | int]:
    if event_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid event id")
    return {"detail": "Registered", "event_id": event_id}
