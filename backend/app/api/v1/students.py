from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user_legacy as get_current_user
from app.db.fake_db import STUDENTS
from app.schemas.common import PaginatedResponse
from app.schemas.students import StudentProfile, StudentProfileUpdate

router = APIRouter()


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("/", response_model=PaginatedResponse[StudentProfile])
def list_students(
    page: int = Query(default=1, ge=1),
    search: str = "",
    _current_user: dict = Depends(get_current_user),
) -> PaginatedResponse[StudentProfile]:
    page_size = 20
    term = search.strip().lower()

    if term:
        filtered = [
            s
            for s in STUDENTS
            if term in s.full_name.lower()
            or term in s.email.lower()
            or term in s.college_roll_no.lower()
            or term in s.branch.lower()
        ]
    else:
        filtered = STUDENTS

    start = (page - 1) * page_size
    end = start + page_size
    results = filtered[start:end]
    return PaginatedResponse[StudentProfile](
        count=len(filtered), next=None, previous=None, results=results
    )


@router.get("/me/", response_model=StudentProfile)
def me(current_user: dict = Depends(get_current_user)) -> StudentProfile:
    # Accounts now live in the database while these profiles are still the
    # pre-rewrite fixtures, so their `linked_user_id` no longer matches the
    # seeded user ids. Email is stable across both and does not couple the seed
    # order to a fixture. Phase 2 replaces this endpoint with a real FK join.
    student = next(
        (
            s
            for s in STUDENTS
            if s.linked_user_id == current_user["id"]
            or s.email.lower() == str(current_user["email"]).lower()
        ),
        None,
    )
    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found"
        )
    return student


@router.get("/{student_id}/", response_model=StudentProfile)
def detail(student_id: int, _current_user: dict = Depends(get_current_user)) -> StudentProfile:
    student = next((s for s in STUDENTS if s.id == student_id), None)
    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student


@router.post("/", response_model=StudentProfile)
def create(
    student: StudentProfile, _current_user: dict = Depends(get_current_user)
) -> StudentProfile:
    if any(s.id == student.id for s in STUDENTS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Student id already exists"
        )

    now = _utc_now_iso()
    stored = student.model_copy(update={"created_at": now, "updated_at": now})
    STUDENTS.append(stored)
    return stored


@router.patch("/{student_id}/", response_model=StudentProfile)
def update(
    student_id: int, payload: StudentProfileUpdate, _current_user: dict = Depends(get_current_user)
) -> StudentProfile:
    if _current_user["role"] == "STUDENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students are not allowed to update student details.",
        )

    student = next((s for s in STUDENTS if s.id == student_id), None)
    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    updated = student.model_copy(
        update={**payload.model_dump(exclude_unset=True), "updated_at": _utc_now_iso()}
    )
    idx = STUDENTS.index(student)
    STUDENTS[idx] = updated
    return updated


@router.delete("/{student_id}/")
def delete(student_id: int, _current_user: dict = Depends(get_current_user)) -> dict[str, str]:
    if _current_user["role"] not in ["SUPER_ADMIN", "TPO", "HOD"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete student profiles.",
        )

    student = next((s for s in STUDENTS if s.id == student_id), None)
    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    STUDENTS.remove(student)
    return {"detail": "Deleted"}
