# System Working Guide

This document describes how the current system works from a business point of view. It focuses on the operational flows, user responsibilities, and data points that matter to the attendance and student-performance process. It intentionally omits implementation details such as the technology stack and storage layer.

## 1. System Purpose

The application is a batch-based attendance and student-tracking system used to manage day-to-day lecture attendance, student performance, absentee notifications, and oversight reporting.

The business process centers on four outcomes:

1. Capture attendance for each lecture session.
2. Keep a running record of student attendance health.
3. Track student test performance alongside attendance.
4. Notify stakeholders when students are absent and provide reports for review.

## 2. Main User Roles

The system currently operates with two practical roles.

### Admin

Admins oversee the full operational picture. They can:

- Manage students, batches, lectures, reports, notifications, and audit review.
- View attendance summaries and defaulter lists.
- Review student profiles and test marks.
- Generate exports for attendance analysis.
- Send absentee notifications for selected lecture sessions.

### Volunteer

Volunteers handle day-to-day attendance marking. Their work is mainly limited to:

- Selecting or entering a student roll number.
- Marking the student present or absent for the current lecture session(s).
- Viewing the volunteer dashboard snapshot for today’s activity.

## 3. Core Business Objects

The system’s working model is built around a small set of operational objects.

### Student

A student is the central tracked person in the system. Each student belongs to a batch and has operational attributes such as active/inactive status, roll number, attendance history, and test marks.

Business significance:

- Active students are eligible for attendance marking.
- Student history is used to calculate attendance percentage, absence counts, and test analysis.

### Batch

A batch groups students together for attendance, lecture scheduling, and performance analysis.

Business significance:

- Attendance is usually reviewed by batch.
- Reports and analytics often aggregate data at batch level.

### Lecture

A lecture represents a scheduled attendance session on a specific date for a specific batch.

Business significance:

- Attendance is tied to lectures.
- A lecture is the parent record for attendance history.
- Lecture deletion removes related attendance records.

### Attendance Record

An attendance record stores whether a student was present or absent for a lecture session.

Business significance:

- This is the primary operational record used for attendance tracking.
- It drives percentages, defaulter lists, and absentee notifications.

### Test Mark / Assessment Record

Test marks track student performance in tests and assessments.

Business significance:

- Used for averages, best/worst score analysis, percentile-style comparisons, and distribution views.
- Missing or absent marks are treated differently from scored results.

### Notification Run

A notification run represents the sending of absentee messages for a lecture/date combination.

Business significance:

- Prevents repeated notification processing for the same lecture/date.
- Provides traceability for when absentee alerts were issued.

### End-of-Day Absence Run

An end-of-day run marks missing attendance as absent after the day closes.

Business significance:

- Ensures the attendance ledger is complete even if marks were not manually entered.
- Prevents attendance gaps from remaining unclassified after the daily cutoff.

## 4. End-to-End Daily Flow

The daily business process follows a predictable pattern.

### Morning or Session Start

1. A lecture exists for the batch and date.
2. A volunteer opens the attendance screen.
3. The volunteer enters or selects a student roll number.
4. The system validates that the student is active and belongs to the relevant batch.
5. Attendance is recorded for the current lecture session mode.

### Attendance Marking

Attendance can be captured in one of three session patterns:

- BOTH: both session slots are marked present.
- MS: morning session is present, afternoon session is absent.
- AS: morning session is absent, afternoon session is present.

The key business idea is that the day can be split into two session outcomes, and the app stores the session-level result accordingly.

### End of Day

At the end of the day, missing attendance can be converted into absent status so that the daily record is complete.

This matters because the downstream reporting and notification flow assumes the attendance ledger is finalized for the date.

## 5. Attendance Business Rules

Attendance is the most important operating workflow in the system.

### Validation Rules

- Only active students can be marked.
- The student must match the expected roll-number format.
- The student must belong to the batch context being processed.
- Attendance is tied to the current day’s lecture session(s).

### Status Rules

- Present and absent are the only meaningful attendance outcomes.
- Attendance is tracked at session level, not just as a vague daily presence flag.
- Missing records may be treated as absent in some summaries and end-of-day flows.

### Operational Consequences

- The attendance screen is used as a live operational input, not just a historical log.
- Attendance drives student health metrics, defaulter calculations, and absentee notifications.

## 6. Lecture Business Rules

Lectures define the attendance container for a batch and date.

### Scheduling Logic

- A lecture belongs to one batch.
- A lecture belongs to one date.
- A lecture belongs to one session type.
- A lecture has a title and a creator.

### Uniqueness Rule

A batch can have at most one lecture per date per session type.

This means the business allows, at most, one morning and one afternoon lecture for the same batch on the same day.

### Lifecycle Rule

- Lectures can be created, edited, and deleted.
- Deleting a lecture removes linked attendance records.

## 7. Student Profile And Performance Review

The student profile area is not just a static profile page. It functions as a review and correction workspace.

### Attendance Review

For a student, the system shows:

- Attendance percentage.
- Recent lecture history.
- Session-level attendance details.
- Past attendance records that can be corrected retroactively.

### Test Performance Review

The same student view also supports analysis of test performance, including:

- Average marks.
- Best test and worst test.
- Relative standing or percentile-style comparison.
- Score distribution patterns.

### Business Meaning

This page acts like a combined performance dossier for a student. It allows the admin to answer:

- Is the student attending regularly?
- Is the student improving academically?
- Is the student becoming a defaulter?
- Does the student need intervention?

## 8. Batch-Level Analysis

The system does not only work at student level. It also evaluates batches as a group.

### Batch Attendance Summary

Batch analysis is used to:

- Measure overall attendance health.
- Identify students who are falling behind.
- Compare performance across groups.

### Defaulter Logic

The admin dashboard highlights the worst attendance cases.

Current observed rule:

- Students below 75 percent attendance are considered critical defaulters for dashboard purposes.
- Only the worst five are shown in the dashboard snapshot.

### Business Meaning

This gives admins a short list of students who need attention without forcing them to inspect every record manually.

## 9. Reports And Exports

The reporting area exists to turn operational records into shareable business outputs.

### Student Attendance Export

This export provides a student-specific attendance history.

Typical business use:

- Review attendance with the student or parent.
- Print or archive a student’s attendance record.
- Compare attendance over time.

### Lecture Attendance Matrix

This export provides a lecture-by-lecture attendance view for a batch and date range.

Typical business use:

- Review attendance across a session period.
- Compare lectures within a batch.
- Identify patterns of absenteeism.

### Business Meaning

Reports are not just convenience outputs. They are the formal way the system converts raw attendance into reviewable records.

## 10. Notifications And Absentee Communication

The notification flow is designed to alert stakeholders when students are absent.

### Trigger Logic

- An admin selects a date.
- The admin chooses the lectures to process.
- The system sends absentee notifications for those lectures.

### Tracking Rule

The system records that a notification was already sent for a lecture/date combination.

This means the intended business behavior is one notification processing run per lecture per day.

### Business Meaning

The notification subsystem is the parent-facing communication layer of the product. It exists to ensure absences are communicated rather than silently stored.

## 11. Audit And Traceability

The system records important user and system events so admins can review what happened and who did it.

### Logged Events

Observed event types include:

- Login.
- Logout.
- Create.
- Update.
- Delete.
- Attendance actions.
- System actions.

### Logged Data Points

Audit records capture:

- Actor.
- Action description.
- Target object information.
- IP address.
- Timestamp.

### Business Meaning

Audit data gives the system accountability. It supports operational review, error tracing, and administrative oversight.

## 12. Dashboard Views

The dashboards are designed to answer the most immediate business questions.

### Admin Dashboard

The admin dashboard summarizes:

- Total active students.
- Today’s attendance rate.
- Critical defaulters.
- Recent audits.

Business use:

- Quick health check of the overall system.
- Shortlist of problem cases.
- Recent operational activity.

### Volunteer Dashboard

The volunteer dashboard is simpler and focuses on today’s attendance snapshot.

Business use:

- Keep the volunteer centered on the current day’s operational task.
- Reduce clutter and avoid exposing unrelated administrative areas.

## 13. Access And Navigation Behavior

Navigation is role-aware.

### Role-Based Routing

- Admin users are directed to the admin dashboard.
- Volunteers are directed to the volunteer dashboard.
- Password changes stay inside the app and return the user to the correct role dashboard.

### Business Meaning

This keeps each role inside the workflow it is meant to perform and prevents cross-role confusion.

## 14. Background And Operational Jobs

Some business actions happen outside the live user flow.

### End-of-Day Absence Processing

A scheduled job marks absent students at the daily cutoff.

Business purpose:

- Close the attendance day.
- Make missing attendance explicit.
- Support consistent reporting after hours.

### Data Import And Seeding Operations

The system also includes operational commands for:

- Creating or seeding sample data.
- Creating accounts.
- Importing students.
- Importing attendance.
- Importing marks.
- Generating test attendance data.

Business purpose:

- Bootstrap the system.
- Load legacy or external records.
- Support testing and operational setup.

## 15. Business Data Points That Matter Most

These are the data points that drive the current system’s behavior and outputs.

- Student identity and roll number.
- Student active status.
- Batch membership.
- Lecture date.
- Lecture session type.
- Attendance present/absent outcome.
- Attendance percentage.
- Absence count and defaulter status.
- Test marks and assessment outcomes.
- Notification sent status for a lecture/date.
- Audit event type, actor, timestamp, and target object.

## 16. Current Operational Constraints

The current system works, but a few parts of the live behavior show that some operational code still reflects older assumptions.

- Some background or command logic appears to reference older lecture concepts that are not part of the current model flow.
- Notification delivery currently looks more like a process log than a fully polished parent-notification workflow.
- Some dashboard calculations may depend on when the server process last loaded, so time-sensitive summaries should be interpreted with that in mind.

These do not change the core business flow, but they are relevant when interpreting the system’s outputs.

## 17. Short Summary

In business terms, the system is a daily attendance control and student-performance tracking tool. Volunteers enter attendance, admins review attendance and performance health, lectures define the daily attendance frame, reports turn records into usable exports, notifications push absences outward, and audit logs preserve accountability.
