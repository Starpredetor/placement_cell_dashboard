from typing import Literal

from pydantic import BaseModel, EmailStr

StudentEntryMode = Literal["REGULAR", "LATERAL_DIPLOMA"]
StudentGender = Literal["FEMALE", "MALE", "OTHER", "PREFER_NOT_TO_SAY", ""]
StudentStatus = Literal["ACTIVE", "ALUMNI", "EXTENDED", "GRADUATED"]
BoardType = Literal["12TH", "DIPLOMA", ""]


class StudentAcademicHistory(BaseModel):
    tenth_percentage: str | None = None
    tenth_year_of_passing: int | None = None
    tenth_board: str = ""
    twelfth_or_diploma_type: BoardType = ""
    twelfth_or_diploma_percentage: str | None = None
    twelfth_or_diploma_year_of_passing: int | None = None
    twelfth_board: str = ""
    btech_sem1_sgpi: str | None = None
    btech_sem2_sgpi: str | None = None
    btech_sem3_sgpi: str | None = None
    btech_sem4_sgpi: str | None = None
    se_cgpi: str | None = None
    se_percentage: str | None = None
    live_kt: int = 0
    dead_kt: int = 0
    drop_count: int = 0
    gap_count: int = 0
    courses_done_text: str = ""
    internships_text: str = ""


class StudentCompliance(BaseModel):
    aadhaar_number: str = ""
    pan_number: str = ""


class StudentProfile(BaseModel):
    id: int
    linked_user_id: int | None = None
    full_name: str
    email: EmailStr
    college_roll_no: str
    admission_year: int
    entry_mode: StudentEntryMode = "REGULAR"
    program_duration_years: int = 4
    expected_graduation_year: int
    current_academic_year: int | StudentStatus
    status: StudentStatus = "ACTIVE"
    student_whatsapp_number: str = ""
    parent_whatsapp_number: str = ""
    parent_email: str = ""
    date_of_birth: str | None = None
    gender: StudentGender = ""
    nationality: str = "Indian"
    residential_address: str = ""
    residential_city: str = ""
    pin_code: str = ""
    native_place: str = ""
    current_location: str = ""
    branch: str = ""
    major_minor_subject: str = ""
    division: str = ""
    batch: str = ""
    is_active: bool = True
    academic_history: StudentAcademicHistory | None = None
    compliance: StudentCompliance | None = None
    created_at: str
    updated_at: str


class StudentProfileUpdate(BaseModel):
    linked_user_id: int | None = None
    full_name: str | None = None
    email: EmailStr | None = None
    college_roll_no: str | None = None
    admission_year: int | None = None
    entry_mode: StudentEntryMode | None = None
    program_duration_years: int | None = None
    expected_graduation_year: int | None = None
    current_academic_year: int | StudentStatus | None = None
    status: StudentStatus | None = None
    student_whatsapp_number: str | None = None
    parent_whatsapp_number: str | None = None
    parent_email: str | None = None
    date_of_birth: str | None = None
    gender: StudentGender | None = None
    nationality: str | None = None
    residential_address: str | None = None
    residential_city: str | None = None
    pin_code: str | None = None
    native_place: str | None = None
    current_location: str | None = None
    branch: str | None = None
    major_minor_subject: str | None = None
    division: str | None = None
    batch: str | None = None
    is_active: bool | None = None
    academic_history: StudentAcademicHistory | None = None
    compliance: StudentCompliance | None = None
