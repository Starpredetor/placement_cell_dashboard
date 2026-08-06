from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user_legacy as get_current_user
from app.db.fake_db import (
    TRAINING_PROGRAMS,
    TRAINING_LECTURES,
    TRAINING_ATTENDANCE,
    STUDENTS,
    TRAINING_BATCHES,
)
from app.schemas.common import PaginatedResponse
from app.schemas.training import (
    TrainingProgram,
    TrainingProgramCreate,
    TrainingLecture,
    TrainingLectureCreate,
    TrainingAttendance,
    TrainingAttendanceBase,
    AttendanceStatus,
    TrainingBatch,
    TrainingAttendanceByRoll,
    AttendanceMarkResponse,
)

router = APIRouter()


# --- Batches Endpoints ---
@router.get("/batches/", response_model=PaginatedResponse[TrainingBatch])
def list_batches(
    _current_user: dict = Depends(get_current_user),
) -> PaginatedResponse[TrainingBatch]:
    results = [TrainingBatch(**b) for b in TRAINING_BATCHES]
    return PaginatedResponse[TrainingBatch](
        count=len(results), next=None, previous=None, results=results
    )


@router.post("/batches/", response_model=TrainingBatch, status_code=status.HTTP_201_CREATED)
def create_batch(
    payload: TrainingBatch, current_user: dict = Depends(get_current_user)
) -> TrainingBatch:
    if current_user["role"] not in ["SUPER_ADMIN", "TPO", "HOD"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can manage batches."
        )

    # Check if exists
    if any(b["name"].lower() == payload.name.lower() for b in TRAINING_BATCHES):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Batch name already exists."
        )

    new_batch = {"name": payload.name, "is_active": payload.is_active}
    TRAINING_BATCHES.append(new_batch)
    return TrainingBatch(**new_batch)


# --- Programs Endpoints ---
@router.get("/programs/", response_model=PaginatedResponse[TrainingProgram])
def list_programs(
    _current_user: dict = Depends(get_current_user),
) -> PaginatedResponse[TrainingProgram]:
    results = [TrainingProgram(**p) for p in TRAINING_PROGRAMS]
    return PaginatedResponse[TrainingProgram](
        count=len(results), next=None, previous=None, results=results
    )


@router.post("/programs/", response_model=TrainingProgram, status_code=status.HTTP_201_CREATED)
def create_program(
    payload: TrainingProgramCreate, current_user: dict = Depends(get_current_user)
) -> TrainingProgram:
    if current_user["role"] not in ["SUPER_ADMIN", "TPO", "HOD", "VOLUNTEER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and volunteers can create training programs.",
        )

    new_id = max([p["id"] for p in TRAINING_PROGRAMS], default=0) + 1
    new_prog = {
        "id": new_id,
        "name": payload.name,
        "description": payload.description,
        "start_date": payload.start_date,
        "end_date": payload.end_date,
        "batch": payload.batch,
    }
    TRAINING_PROGRAMS.append(new_prog)
    return TrainingProgram(**new_prog)


# --- Lectures Endpoints ---
@router.get("/lectures/", response_model=PaginatedResponse[TrainingLecture])
def list_lectures(
    program_id: int | None = Query(default=None), _current_user: dict = Depends(get_current_user)
) -> PaginatedResponse[TrainingLecture]:
    filtered = TRAINING_LECTURES
    if program_id is not None:
        filtered = [l for l in TRAINING_LECTURES if l["program_id"] == program_id]

    results = [TrainingLecture(**l) for l in filtered]
    return PaginatedResponse[TrainingLecture](
        count=len(results), next=None, previous=None, results=results
    )


@router.post("/lectures/", response_model=TrainingLecture, status_code=status.HTTP_201_CREATED)
def create_lecture(
    payload: TrainingLectureCreate, current_user: dict = Depends(get_current_user)
) -> TrainingLecture:
    if current_user["role"] not in ["SUPER_ADMIN", "TPO", "HOD", "VOLUNTEER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and volunteers can schedule training sessions.",
        )

    # Check program exists
    program = next((p for p in TRAINING_PROGRAMS if p["id"] == payload.program_id), None)
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Training program not found."
        )

    new_id = max([l["id"] for l in TRAINING_LECTURES], default=0) + 1
    new_lecture = {
        "id": new_id,
        "program_id": payload.program_id,
        "title": payload.title,
        "date": payload.date,
        "session_type": payload.session_type,
        "batch": payload.batch if payload.batch else program.get("batch"),
    }
    TRAINING_LECTURES.append(new_lecture)
    return TrainingLecture(**new_lecture)


# --- Attendance Endpoints ---
@router.get("/attendance/", response_model=PaginatedResponse[TrainingAttendance])
def list_attendance(
    lecture_id: int | None = Query(default=None),
    student_id: int | None = Query(default=None),
    current_user: dict = Depends(get_current_user),
) -> PaginatedResponse[TrainingAttendance]:
    # Enforce role-based segregation for student attendance lookups
    if current_user["role"] == "STUDENT":
        # Find linked student profile
        student = next((s for s in STUDENTS if s.linked_user_id == current_user["id"]), None)
        if not student:
            return PaginatedResponse[TrainingAttendance](
                count=0, next=None, previous=None, results=[]
            )
        student_id = student.id  # Force lookup filter to their own ID only

    filtered = TRAINING_ATTENDANCE
    if lecture_id is not None:
        filtered = [a for a in filtered if a["lecture_id"] == lecture_id]
    if student_id is not None:
        filtered = [a for a in filtered if a["student_id"] == student_id]

    results = []
    for a in filtered:
        student_profile = next((s for s in STUDENTS if s.id == a["student_id"]), None)
        student_name = student_profile.full_name if student_profile else "Unknown"
        student_roll = student_profile.college_roll_no if student_profile else "Unknown"

        results.append(
            TrainingAttendance(
                id=a["id"],
                lecture_id=a["lecture_id"],
                student_id=a["student_id"],
                status=a["status"],
                student_name=student_name,
                student_roll=student_roll,
            )
        )

    return PaginatedResponse[TrainingAttendance](
        count=len(results), next=None, previous=None, results=results
    )


@router.post("/attendance/mark/", response_model=TrainingAttendance)
def mark_attendance(
    payload: TrainingAttendanceBase, current_user: dict = Depends(get_current_user)
) -> TrainingAttendance:
    if current_user["role"] not in ["SUPER_ADMIN", "TPO", "HOD", "VOLUNTEER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized to mark attendance."
        )

    # Check lecture exists
    lecture = next((l for l in TRAINING_LECTURES if l["id"] == payload.lecture_id), None)
    if not lecture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Training session not found."
        )

    # Check student exists
    student_profile = next((s for s in STUDENTS if s.id == payload.student_id), None)
    if not student_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found."
        )

    # Check if attendance record already exists
    record = next(
        (
            a
            for a in TRAINING_ATTENDANCE
            if a["lecture_id"] == payload.lecture_id and a["student_id"] == payload.student_id
        ),
        None,
    )

    if record:
        record["status"] = payload.status
        target_record = record
    else:
        new_id = max([a["id"] for a in TRAINING_ATTENDANCE], default=0) + 1
        new_record = {
            "id": new_id,
            "lecture_id": payload.lecture_id,
            "student_id": payload.student_id,
            "status": payload.status,
        }
        TRAINING_ATTENDANCE.append(new_record)
        target_record = new_record

    return TrainingAttendance(
        id=target_record["id"],
        lecture_id=target_record["lecture_id"],
        student_id=target_record["student_id"],
        status=target_record["status"],
        student_name=student_profile.full_name,
        student_roll=student_profile.college_roll_no,
    )


# --- Mark Attendance by Roll Number Endpoint ---
@router.post("/attendance/mark-by-roll/", response_model=AttendanceMarkResponse)
def mark_attendance_by_roll(
    payload: TrainingAttendanceByRoll, current_user: dict = Depends(get_current_user)
) -> AttendanceMarkResponse:
    if current_user["role"] not in ["SUPER_ADMIN", "TPO", "HOD", "VOLUNTEER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized to mark attendance."
        )

    # Check lecture exists
    lecture = next((l for l in TRAINING_LECTURES if l["id"] == payload.lecture_id), None)
    if not lecture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Training session not found."
        )

    # Check student exists by roll number
    student = next(
        (
            s
            for s in STUDENTS
            if s.college_roll_no.strip().lower() == payload.college_roll_no.strip().lower()
        ),
        None,
    )
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with roll number '{payload.college_roll_no}' not found.",
        )

    # Check if student is 4th year student
    try:
        curr_yr = int(student.current_academic_year)
    except (ValueError, TypeError):
        curr_yr = 4  # Default to 4th year / graduated

    if curr_yr == 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="4th year students are placement-only and cannot be marked for training attendance.",
        )

    # Check if attendance record already exists
    record = next(
        (
            a
            for a in TRAINING_ATTENDANCE
            if a["lecture_id"] == payload.lecture_id and a["student_id"] == student.id
        ),
        None,
    )

    action = "UPDATED"
    if record:
        record["status"] = payload.status
        target_record = record
    else:
        action = "ADDED"
        new_id = max([a["id"] for a in TRAINING_ATTENDANCE], default=0) + 1
        new_record = {
            "id": new_id,
            "lecture_id": payload.lecture_id,
            "student_id": student.id,
            "status": payload.status,
        }
        TRAINING_ATTENDANCE.append(new_record)
        target_record = new_record

    return AttendanceMarkResponse(
        id=target_record["id"],
        lecture_id=target_record["lecture_id"],
        student_id=student.id,
        status=target_record["status"],
        student_roll=student.college_roll_no,
        student_name=student.full_name,
        action=action,
    )


# --- Rollover Endpoint ---
@router.post("/rollover/", status_code=status.HTTP_200_OK)
def academic_year_rollover(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["role"] not in ["SUPER_ADMIN", "TPO", "HOD"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can execute rollover."
        )

    archived_count = 0
    promoted_to_4th = 0
    promoted_to_3rd = 0
    promoted_to_2nd = 0

    for student in STUDENTS:
        # Determine the current academic year as integer or handle string
        try:
            curr_yr = int(student.current_academic_year)
        except (ValueError, TypeError):
            continue

        if curr_yr == 4:
            student.status = "GRADUATED"
            student.current_academic_year = "GRADUATED"
            archived_count += 1
        elif curr_yr == 3:
            student.current_academic_year = 4
            promoted_to_4th += 1
        elif curr_yr == 2:
            student.current_academic_year = 3
            promoted_to_3rd += 1
        elif curr_yr == 1:
            student.current_academic_year = 2
            promoted_to_2nd += 1

    return {
        "detail": "Academic Year Rollover executed successfully.",
        "archived_count": archived_count,
        "promoted_to_4th_placement_only": promoted_to_4th,
        "promoted_to_3rd_training_and_placement": promoted_to_3rd,
        "promoted_to_2nd": promoted_to_2nd,
    }
