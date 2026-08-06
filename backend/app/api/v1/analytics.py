from fastapi import APIRouter, Depends

from app.api.deps import get_current_user

router = APIRouter()


@router.get("/dashboard/")
def dashboard(_current_user: dict = Depends(get_current_user)) -> dict[str, int]:
    return {"total_students": 1248, "placement_rate": 74, "open_opportunities": 19}


@router.get("/placements/")
def placements(_current_user: dict = Depends(get_current_user)) -> dict[str, float]:
    return {"placed_percent": 74.0, "interviewed_percent": 82.4}


@router.get("/students/")
def students(_current_user: dict = Depends(get_current_user)) -> dict[str, int]:
    return {"active_students": 1200, "alumni": 48}


@router.get("/training/")
def training(_current_user: dict = Depends(get_current_user)) -> dict[str, int]:
    return {"programs_running": 2, "total_enrollments": 180}
