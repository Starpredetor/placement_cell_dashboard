from typing import Literal
from pydantic import BaseModel

SessionType = Literal["BOTH", "MS", "AS"]
AttendanceStatus = Literal["BOTH", "MS", "AS", "ABSENT"]

class TrainingBatch(BaseModel):
    name: str
    is_active: bool = True

class TrainingProgramBase(BaseModel):
    name: str
    description: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    batch: str | None = None

class TrainingProgramCreate(TrainingProgramBase):
    pass

class TrainingProgram(TrainingProgramBase):
    id: int

class TrainingLectureBase(BaseModel):
    program_id: int
    title: str
    date: str
    session_type: SessionType = "BOTH"
    batch: str | None = None

class TrainingLectureCreate(TrainingLectureBase):
    pass

class TrainingLecture(TrainingLectureBase):
    id: int

class TrainingAttendanceBase(BaseModel):
    lecture_id: int
    student_id: int
    status: AttendanceStatus

class TrainingAttendanceUpdate(BaseModel):
    status: AttendanceStatus

class TrainingAttendance(TrainingAttendanceBase):
    id: int
    student_name: str | None = None
    student_roll: str | None = None

class TrainingAttendanceByRoll(BaseModel):
    lecture_id: int
    college_roll_no: str
    status: AttendanceStatus

class AttendanceMarkResponse(BaseModel):
    id: int
    lecture_id: int
    student_id: int
    status: str
    student_roll: str
    student_name: str
    action: Literal["ADDED", "UPDATED"]

