from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.schemas.common import PaginatedResponse
from app.schemas.generic import GenericItem

router = APIRouter()


@router.post("/send-email/")
def send_email(_payload: dict, _current_user: dict = Depends(get_current_user)) -> dict[str, str]:
    return {"detail": "Email queued"}


@router.post("/send-sms/")
def send_sms(_payload: dict, _current_user: dict = Depends(get_current_user)) -> dict[str, str]:
    return {"detail": "SMS queued"}


@router.get("/notifications/", response_model=PaginatedResponse[GenericItem])
def notifications(_current_user: dict = Depends(get_current_user)) -> PaginatedResponse[GenericItem]:
    return PaginatedResponse[GenericItem](count=0, next=None, previous=None, results=[])
