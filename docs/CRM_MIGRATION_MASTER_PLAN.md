# CRM Dashboard Migration Master Plan

## 1. Goal
Build a full CRM-style Training and Placement dashboard that supports end-to-end student lifecycle activities (training, placement, events, communications, documents, analytics), while preserving and evolving the current attendance-driven system.

## 2. Current Implementation Style (As-Is)

### 2.1 Architecture Snapshot
- Backend is a Django monolith.
- UI is mostly server-rendered using Django templates.
- Domain is app-sliced (`accounts`, `attendance`, `students`, `lectures`, `notifications`, `reports`, `auditlog`).
- Authentication and role checks are Django-native (Admin and Volunteer roles).
- Attendance and student records are core implemented flows.

### 2.2 Current Strengths
- Stable Django auth/admin foundation.
- Existing student, lecture, and attendance data model.
- Basic reports and audit logging in place.
- Low operational complexity in one deployable unit.

### 2.3 Current Gaps Against CRM Vision
- No dedicated API layer for a decoupled frontend.
- No full placement workflow (opportunities, rounds, applications, HR export).
- No deep student profile (academic + compliance + documents + progression timeline).
- No microservice boundaries for ATS scoring/SMS/email orchestration.
- Analytics is limited and attendance-focused.

## 3. Target Architecture (To-Be)

### 3.1 High-Level Stack
- Frontend: React JS (SPA).
- Backend API: Django REST Framework (DRF).
- Database: PostgreSQL.
- Async workers: Celery + Redis for notifications, ATS processing, exports.
- Microservices/integration services:
  - Email service
  - SMS/WhatsApp service
  - ATS scoring service

### 3.2 Architectural Style
- Modular monolith backend with clear bounded contexts and API namespaces.
- Event-driven async tasks for long-running side effects.
- Role-based access control and eligibility-based content exposure.
- API-first design for all user-facing workflows.

### 3.3 Proposed Contexts
- Identity and Access
- Student Profile and Documents
- Training Operations
- Placement Operations
- Event and Seminar Operations
- Communications (Email/SMS)
- Analytics and Reporting

## 4. Product Modules and Feature Plan

## 4.1 Placement Activities (CRM Core)
- Add and manage placement opportunities.
- Auto email alerts for newly posted opportunities.
- Eligibility engine to restrict visibility to only eligible students.
- Student application management lifecycle:
  - Applied
  - Shortlisted
  - Rejected
  - Offer Received
  - Joined/Declined
- Multi-round management (aptitude/GD/technical/HR/custom rounds).
- Student filtering per round based on rules and outcomes.
- Placement-day attendance tracking.
- Export applicant and result data to share with HR.
- Placement analytics dashboard with filters:
  - Year, branch, company, role, CTC range, status, round, date range
  - Funnel and conversion metrics

## 4.2 Student Profile
- Resume upload with ATS scoring pipeline.
- Multi-year student record support.
- Admission-year tracking to derive current academic year correctly.
- Support for lateral-entry diploma students who join one year late and complete graduation in 3 years.
- Attendance tracking across training, placement, seminar, and event activities.
- Marks/scoring for training and assessments.
- Searchable student table with profile drill-down for TPO.

## 4.3 Training Activities
- Enrolled student segmentation into batches.
- Training slot management and student registration.
- Daily attendance for each training session.
- Parent email notifications for attendance records.
- Test score uploading for training sessions.

## 4.4 Seminar and Event Activities
- Event and seminar announcements with posting board.
- Enrollment workflow (Enroll button and roster generation).
- Event attendance tracking.

## 5. Backend API Plan (DRF)

### 5.1 API Domains and Endpoints (Representative)
- Auth and user:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
- Students:
  - `GET /api/v1/students`
  - `POST /api/v1/students`
  - `GET /api/v1/students/{id}`
  - `PATCH /api/v1/students/{id}`
  - `POST /api/v1/students/{id}/documents`
  - `GET /api/v1/students/{id}/timeline`
- Training:
  - `POST /api/v1/training/batches`
  - `POST /api/v1/training/slots`
  - `POST /api/v1/training/registrations`
  - `POST /api/v1/training/attendance`
  - `POST /api/v1/training/tests/{id}/scores/import`
- Placement:
  - `POST /api/v1/placements/opportunities`
  - `GET /api/v1/placements/opportunities`
  - `POST /api/v1/placements/opportunities/{id}/publish`
  - `POST /api/v1/placements/opportunities/{id}/apply`
  - `POST /api/v1/placements/opportunities/{id}/rounds`
  - `POST /api/v1/placements/rounds/{id}/results`
  - `POST /api/v1/placements/{id}/attendance`
  - `GET /api/v1/placements/{id}/export/hr`
- Events:
  - `POST /api/v1/events`
  - `POST /api/v1/events/{id}/enroll`
  - `POST /api/v1/events/{id}/attendance`
- Analytics:
  - `GET /api/v1/analytics/placements`
  - `GET /api/v1/analytics/training`
  - `GET /api/v1/analytics/attendance`

### 5.2 Security and Access Rules
- Role model:
  - TPO Admin
  - Placement Coordinator
  - Trainer
  - Student
- Object-level permission checks in DRF.
- Eligibility checks before displaying or applying to opportunities.
- Strict file upload validation and storage ACL.

## 6. React Frontend Plan

### 6.1 App Shell
- React router-based SPA with protected routes.
- Shared layout: left navigation, top filter bar, workspace panel.
- Global search and quick actions.

### 6.2 Main Screens
- Dashboard (CRM overview).
- Student directory and student profile.
- Placement opportunities board.
- Placement operations workspace (rounds, attendance, exports).
- Training planner and attendance.
- Test score management.
- Event/seminar board and enrollment.
- Reports and analytics.
- Admin settings and communication templates.

### 6.3 UI State
- Server-state handling with React Query.
- Form state with schema validation.
- Reusable data-table components with advanced filters.

## 7. Microservices and Integrations

### 7.1 Email Service
- Trigger points:
  - New placement opportunity published
  - Training attendance summary sent to parents
  - Event reminders
- Template-driven emails by audience and context.

### 7.2 SMS/WhatsApp Service
- Alerts for critical updates (placement deadlines, attendance alerts).
- Opt-in and consent flags per student/parent profile.

### 7.3 ATS Scoring Service
- Resume parsing + scoring endpoint.
- Trigger on resume upload and re-score on demand.
- Store versioned score snapshots and factors.

## 8. Basic Database Design (Attendance + CRM Activities)

This design keeps attendance as a first-class capability while extending to CRM operations.

### 8.1 Core Reference Tables
- `academic_years`
- `branches`
- `batches`
- `divisions`
- `roles`
- `companies`
- `job_roles`

### 8.2 Student Profile Tables

#### `students`
- `id` (PK)
- `full_name` (required)
- `email` (required, unique)
- `college_roll_no` (required, unique)
- `admission_year` (required, integer)
- `entry_mode` (required, enum: `REGULAR`, `LATERAL_DIPLOMA`)
- `program_duration_years` (required, integer: 4 for regular, 3 for lateral diploma)
- `expected_graduation_year` (derived or stored denormalized year)
- `current_academic_year` (derived at runtime for dashboard and eligibility filters)
- `student_whatsapp_number` (required)
- `parent_whatsapp_number` (required)
- `parent_email` (required)
- `date_of_birth` (required)
- `gender` (required)
- `nationality` (required)
- `residential_address` (required)
- `residential_city` (required)
- `pin_code` (required)
- `native_place` (required)
- `current_location` (required)
- `branch_id` (FK, required)
- `major_minor_subject` (nullable or enum with `NA`)
- `division_id` (FK, required)
- `batch_id` (FK, required)
- `is_active` (default true)
- `created_at`
- `updated_at`

#### `student_year_progression_rules` (service-level logic, optional table)
- Rule 1: Regular student progression is 4 academic years.
- Rule 2: Lateral diploma progression is 3 academic years.
- Rule 3: `expected_graduation_year = admission_year + program_duration_years - 1`.
- Rule 4: `current_academic_year = current_year - admission_year + 1`, clamped between 1 and `program_duration_years`.
- Rule 5: `admission_year` is the single source of truth for year progression and cohort mapping.
- Rule 6: Students beyond program duration can be mapped to `ALUMNI`, `EXTENDED`, or `GRADUATED` statuses.

#### `student_academic_history`
- `id` (PK)
- `student_id` (FK)
- `academic_year_id` (FK)
- `tenth_percentage`
- `tenth_year_of_passing`
- `tenth_board`
- `twelfth_or_diploma_type` (enum: `12TH`, `DIPLOMA`)
- `twelfth_or_diploma_percentage`
- `twelfth_or_diploma_year_of_passing`
- `twelfth_board`
- `btech_sem1_sgpi`
- `btech_sem2_sgpi`
- `btech_sem3_sgpi`
- `btech_sem4_sgpi`
- `se_cgpi`
- `se_percentage`
- `live_kt`
- `dead_kt`
- `drop_count`
- `gap_count`
- `courses_done_text`
- `internships_text`
- `created_at`

#### `student_compliance`
- `id` (PK)
- `student_id` (FK)
- `aadhaar_number`
- `pan_number`
- `created_at`
- `updated_at`

#### `student_documents`
- `id` (PK)
- `student_id` (FK)
- `document_type` (enum: `AADHAAR`, `PAN`, `RESUME`, `OTHER`)
- `file_path`
- `original_filename`
- `mime_type`
- `file_size`
- `is_latest`
- `uploaded_at`

#### `resume_ats_scores`
- `id` (PK)
- `student_id` (FK)
- `document_id` (FK to `student_documents`)
- `score`
- `score_breakdown_json`
- `engine_version`
- `scored_at`

### 8.3 Placement Tables

#### `placement_opportunities`
- `id` (PK)
- `company_id` (FK)
- `job_role_id` (FK)
- `title`
- `description`
- `ctc`
- `location`
- `employment_type`
- `application_open_at`
- `application_close_at`
- `eligibility_rules_json`
- `status` (draft/published/closed)
- `created_by`
- `created_at`

#### `placement_applications`
- `id` (PK)
- `opportunity_id` (FK)
- `student_id` (FK)
- `application_status`
- `applied_at`
- `eligibility_snapshot_json`

#### `placement_rounds`
- `id` (PK)
- `opportunity_id` (FK)
- `round_name`
- `round_type`
- `sequence_no`
- `scheduled_at`
- `location`

#### `placement_round_results`
- `id` (PK)
- `round_id` (FK)
- `student_id` (FK)
- `result_status` (qualified/rejected/hold)
- `remarks`
- `updated_at`

#### `placement_day_attendance`
- `id` (PK)
- `opportunity_id` (FK)
- `student_id` (FK)
- `status` (present/absent)
- `marked_by`
- `marked_at`

### 8.4 Training Tables

#### `training_programs`
- `id` (PK)
- `name`
- `description`
- `start_date`
- `end_date`
- `owner_user_id`

#### `training_slots`
- `id` (PK)
- `program_id` (FK)
- `slot_date`
- `start_time`
- `end_time`
- `venue`
- `capacity`

#### `training_registrations`
- `id` (PK)
- `slot_id` (FK)
- `student_id` (FK)
- `registration_status`
- `registered_at`

#### `training_attendance`
- `id` (PK)
- `slot_id` (FK)
- `student_id` (FK)
- `status` (present/absent/late)
- `marked_by`
- `marked_at`

#### `training_tests`
- `id` (PK)
- `program_id` (FK)
- `title`
- `max_marks`
- `test_date`

#### `training_test_scores`
- `id` (PK)
- `test_id` (FK)
- `student_id` (FK)
- `score`
- `uploaded_by`
- `uploaded_at`

### 8.5 Seminar/Event Tables

#### `events`
- `id` (PK)
- `title`
- `description`
- `event_type` (seminar/workshop/other)
- `start_at`
- `end_at`
- `venue`
- `enrollment_open`
- `created_by`

#### `event_enrollments`
- `id` (PK)
- `event_id` (FK)
- `student_id` (FK)
- `enrolled_at`

#### `event_attendance`
- `id` (PK)
- `event_id` (FK)
- `student_id` (FK)
- `status`
- `marked_at`

### 8.6 Communication and Audit Tables
- `notification_templates`
- `notification_logs` (email/sms/whatsapp delivery status)
- `audit_logs` (reuse and expand existing audit model)

## 9. Eligibility Engine Rules (Placement Visibility)
- Rule inputs:
  - Branch list
  - Current academic year (derived from admission year + entry mode)
  - Batch/academic year
  - Minimum SGPI/CGPI/percentage thresholds
  - Live/Dead KT constraints
  - Gap/Drop constraints
  - Course or certification requirements
- Evaluation:
  - On listing opportunities for students
  - On apply action (hard validation)
  - Snapshot saved in application record for auditability

## 10. Analytics Plan

### 10.1 Placement Analytics
- Opportunity funnel: published -> applied -> shortlisted -> offered -> joined.
- Conversion rates by company/role/branch/year.
- Median and average CTC by role and branch.
- Filters must include current academic year, admission year, and entry mode.

### 10.2 Training Analytics
- Attendance trends by batch/program/slot.
- Test score progression by student and cohort.
- Parent notification coverage and delivery success.
- Compare engagement and outcomes by admission year and regular versus lateral entry.

### 10.3 Event Analytics
- Enrollment versus attendance conversion.
- Participation by branch/year.

## 11. Migration Execution Plan

### Phase 0: Foundation and Repo Migration
- Create new target directory and initialize new git repository.
- Copy codebase with history strategy decision:
  - Option A: new clean repo
  - Option B: filtered history import
- Rename project identity, docs, service names, and deployment artifacts.

### Phase 1: DRF API Baseline
- Introduce DRF and API versioning.
- Build auth, student read APIs, and attendance APIs.
- Keep old templates operational during transition.

### Phase 2: React SPA Baseline
- Scaffold React app and implement auth flow.
- Build dashboard shell, navigation, and first data screens.
- Connect React with DRF APIs.

### Phase 3: Student Profile and Documents
- Implement expanded student schema.
- Add document upload pipeline and ATS scoring integration.
- Build searchable student directory and profile pages.

### Phase 4: Placement CRM Module
- Opportunities, eligibility, applications, rounds, attendance, exports.
- Email alerts and placement analytics dashboard.

### Phase 5: Training and Event Modules
- Batch segmentation, slot registration, attendance, tests.
- Event board, enrollments, and attendance.

### Phase 6: Cutover and Hardening
- Retire legacy template pages in waves.
- Performance tuning, security review, and full UAT.

## 12. Suggested Non-Functional Requirements
- API p95 response under 400 ms for common list endpoints.
- Export generation under 60 seconds for large placement datasets.
- File upload antivirus and file-type validation.
- Full audit logging for profile edits, eligibility decisions, and result updates.
- Daily backup and restore drills.

## 13. Testing Strategy
- Unit tests for eligibility engine, scoring, and status transitions.
- API contract tests for frontend-backend compatibility.
- Integration tests for async notifications and ATS scoring.
- E2E tests for:
  - Student application journey
  - Round progression
  - Training attendance and parent notification flow
  - Event enrollment and attendance

## 14. Delivery Artifacts
- API specification (OpenAPI).
- ERD and migration scripts.
- React screen map and component inventory.
- Role-permission matrix.
- Go-live checklist and rollback plan.

## 15. Immediate Next Implementation Steps
1. Approve this schema and module boundaries.
2. Finalize role matrix, eligibility formulas, and year-progression formulas.
3. Create DRF app skeleton and API versioning conventions.
4. Generate initial migrations for core profile + placement entities, including admission-year and lateral-entry fields.
5. Scaffold React app and connect authentication flow.