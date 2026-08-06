from fastapi import APIRouter, Depends

from app.api.deps import get_current_user

router = APIRouter()


@router.get("/academic-years/")
def academic_years(_current_user: dict = Depends(get_current_user)) -> list[str]:
    return ["2023-24", "2024-25", "2025-26"]


@router.get("/branches/")
def branches(_current_user: dict = Depends(get_current_user)) -> list[str]:
    return ["Computer Engineering", "Information Technology", "Electronics"]


@router.get("/divisions/")
def divisions(_current_user: dict = Depends(get_current_user)) -> list[str]:
    return ["A", "B", "C"]


@router.get("/batches/")
def batches(_current_user: dict = Depends(get_current_user)) -> list[str]:
    return ["Batch 2023", "Batch 2024"]


@router.get("/companies/")
def companies(_current_user: dict = Depends(get_current_user)) -> list[str]:
    return ["TechNova", "InfiSpark", "ByteBridge"]


@router.get("/job-roles/")
def job_roles(_current_user: dict = Depends(get_current_user)) -> list[str]:
    return ["Software Engineer", "Data Analyst", "QA Engineer"]


@router.get("/roles/")
def roles(_current_user: dict = Depends(get_current_user)) -> list[str]:
    return ["SUPER_ADMIN", "TPO", "HOD", "VOLUNTEER", "STUDENT"]
