# Placement Cell Dashboard — Functional Rewrite Plan

**Status:** Proposed
**Date:** 2026-08-07
**Supersedes:** `CRM_MIGRATION_MASTER_PLAN.md` (retained as the product/feature reference; its Django/DRF/microservices architecture is superseded by this document)

---

## 1. Context and goal

This project was originally scoped for a real college deployment. That deployment was archived. **The goal now is to finish it as a fully functional portfolio piece**: a system that runs locally against a live SQLite database seeded with realistic dummy data, where every feature genuinely works — real authentication, real role-based access, real eligibility rules, real analytics computed from real rows.

Two consequences shape this plan:

- **Functionality is not reduced.** Every module in the original vision gets built for real. Nothing is faked, stubbed at the UI layer, or hardcoded. A visitor clicking through the app exercises actual backend logic.
- **Operations are deferred, not cut.** Backups, restore drills, load testing, PII encryption at rest, AV scanning, and production deployment are out of scope for now. They are collected in §10 so they can be picked up if the project is ever hosted, rather than deleted and forgotten.

Hosting is **explicitly deferred**. The plan keeps the database layer portable so that choosing a host later (Turso, Postgres, or anything else) is a connection-string change and not a rewrite — see §2.5, which is the constraint that buys that option.

---

## 2. Why a rewrite

The repository is a UI prototype wired to a mock server. The gap is structural, not a matter of missing features.

### 2.1 Audit of the current codebase

Measured against the tree at commit `34036da`.

**Backend — ~1,100 LOC, FastAPI**

| Finding | Detail |
| --- | --- |
| No database | `app/db/fake_db.py` (480 lines) is a module-level list of dicts. Writes mutate process memory and vanish on restart. |
| No real authentication | `app/core/auth.py` is five lines: `secrets.token_urlsafe(32)`. Tokens live in a dict, never expire, are not signed. |
| Passwords in plaintext | `fake_db.USERS` holds `"password": "admin1234"`; login does `user["password"] != payload.password`. |
| No authorization | Every endpoint depends on `get_current_user`, which only proves *someone* is logged in. No endpoint reads `user["role"]`. A `STUDENT` token can call `PATCH /auth/users/{id}/` and change any account's role. |
| Open CORS | `allow_origins=["*"]` with `allow_credentials=True`. |
| Most domains are literal stubs | `analytics.py` returns the constant `{"total_students": 1248, "placement_rate": 74}`. `common.py` returns hardcoded branch/company lists. `placements.py`, `events.py`, `communications.py` return fixed `GenericItem(id=1, name="…")` and accept `_payload: dict` unvalidated. |
| Only three modules have logic | `auth`, `students`, `training` — all operating on in-memory lists. |
| No tests | `pytest` and `httpx` are in `requirements.txt`; there is no `tests/` directory. |

**Frontend — ~7,500 LOC, React 19 on CRA**

| Finding | Detail |
| --- | --- |
| Dead toolchain | `react-scripts@5.0.1`, unmaintained, running against React 19 and Tailwind 4. |
| Oversized pages | `PlacementsPage.tsx` 1,275 lines, `PlacementOpportunityCreatePage.tsx` 1,003, `EventsPage.tsx` 564, `TrainingPage.tsx` 554. |
| No component layer | Two components total (`AppShell`, `StudentsServiceNav`). Tables, forms, filters, modals are re-implemented inline in every page. |
| Mock data in the UI | Six pages carry hardcoded arrays, so screens render plausible content regardless of backend state. |
| Unused data layer | `react-query@3` is installed; pages call `axios` directly in `useEffect`. No caching, no dedup, ad-hoc loading/error handling. |
| Build output committed | `frontend/build/` is tracked in git. |
| No tests | One file: the CRA default `App.test.tsx`. |

**Repository** — `docs/` was empty; `docker-compose.yml` provisions services no code connects to; five overlapping status documents (`README`, `QUICK_START`, `SETUP_GUIDE`, `SETUP_COMPLETE`, `SYSTEM_WORKING_GUIDE`) describe capabilities the code does not have.

### 2.2 What is worth keeping

The rewrite is not starting from zero:

- **The domain model in `CRM_MIGRATION_MASTER_PLAN.md` §8** — table shapes, field lists, and the lateral-entry progression rules are sound and become the SQLAlchemy models nearly verbatim.
- **The Pydantic schemas** in `backend/app/schemas/` — `students.py`, `training.py`, `auth.py` encode real field requirements and survive as the API contract layer.
- **The API surface** — `/api/v1/<domain>/` with trailing slashes, `PaginatedResponse{count,next,previous,results}`, bearer auth. Keeping these stable means `services/api.ts` does not churn.
- **The UI screens** — 17 pages representing real workflow design (fast-mark attendance, drive creation, student directory). Refactored, not discarded.

### 2.3 Decisions taken

| Decision | Choice | Rationale |
| --- | --- | --- |
| Backend | **FastAPI + SQLAlchemy 2.0 + Alembic** | Retains existing routers and schemas. The missing work is persistence and auth, not the framework. Supersedes the master plan's DRF proposal. |
| Database | **SQLite, local file, seeded with dummy data** | Zero setup, committed alongside the code, instantly runnable by anyone cloning the repo. Accessed only through SQLAlchemy so it stays swappable (§2.5). |
| Scope | **Full functionality; ops deferred** | Every feature module built for real. Email/SMS/ATS behind ports with working local adapters. Hardening collected in §10. |
| Frontend | **Migrate CRA → Vite, then refactor incrementally** | Toolchain replaced once, early; pages rewritten domain by domain so the app stays runnable throughout. |
| Deployment | **Deferred** | Runs locally via `uvicorn` + `vite dev`. §2.5 keeps hosting options open without spending effort on them now. |
| Demo access | **Dev-only one-click role switcher** | Real auth underneath; convenience login buttons rendered only when `APP_ENV=development`. |

### 2.4 Standing assumptions

1. **All data is fabricated.** No real student records exist and none will be imported. This removes the migration risk that dominated the previous version of this plan.
2. **Single institution, single tenant.** No `tenant_id` anywhere.
3. **Background jobs are out of scope.** Everything completes inside a request.
4. **Existing git history is kept.** Work proceeds on branches against `main`.
5. **Single-process, low-concurrency use.** One developer, or a handful of demo visitors later. This is what makes SQLite appropriate.

### 2.5 The portability constraint

SQLite is the right choice now and probably the wrong choice if this is ever hosted on serverless infrastructure, where the filesystem is ephemeral and writes do not survive a cold start. Rather than decide that now, the plan makes the decision cheap to defer:

- **All database access goes through SQLAlchemy Core/ORM.** No raw SQL strings containing SQLite-specific syntax anywhere in application code.
- **No SQLite-only features are used.** No `rowid` tricks, no `AUTOINCREMENT` reliance, no full-text search extensions, no `PRAGMA`-dependent behaviour in application logic (the pragmas in §3.1 are connection setup, not logic).
- **All Alembic migrations run in batch mode** (§3.2), which produces migrations valid on both SQLite and Postgres.
- **`DATABASE_URL` is the only place the database is named.** It comes from config with no default.

The intended payoff: switching to Turso (which speaks the same dialect) or Postgres later means changing one environment variable and, for Postgres, running the existing migrations against it. Nothing in §7's phases needs revisiting. This constraint costs almost nothing to honour while writing the code, and a great deal to retrofit.

---

## 3. Target architecture

### 3.1 Shape

A modular monolith: one FastAPI process, one SQLite file, one Vite dev server (or static bundle). Bounded contexts are enforced by module boundaries and review, not network hops.

```
┌────────────────────┐                  ┌──────────────────────────────┐
│  React SPA (Vite)  │ ───────────────▶ │  FastAPI (uvicorn)           │
│  localhost:5173    │  Bearer JWT      │  ┌────────────────────────┐  │
│                    │ ◀─────────────── │  │ api/v1  (thin routers) │  │
└────────────────────┘                  │  ├────────────────────────┤  │
                                        │  │ services (domain logic)│  │
                                        │  ├────────────────────────┤  │
                                        │  │ repositories (queries) │  │
                                        │  ├────────────────────────┤  │
                                        │  │ models (SQLAlchemy)    │  │
                                        │  └────────────────────────┘  │
                                        │         │            │       │
                                        │  ┌──────▼──────┐ ┌───▼─────┐ │
                                        │  │ notifier    │ │ storage │ │
                                        │  │ (port)      │ │ (port)  │ │
                                        │  └─────────────┘ └─────────┘ │
                                        └──────────────┬───────────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │  app.db (SQLite)│
                                              └─────────────────┘
```

**The layering rule, which the current code violates and the rewrite enforces:** routers parse and authorize; services decide; repositories query; models describe. A router never builds a query; a service never sees a `Request`. This is what makes the eligibility engine and progression rules unit-testable without HTTP or a database.

**Ports.** `Notifier` (email/SMS) and `Storage` (documents) are Protocol interfaces with working local adapters — `LoggingNotifier` writes delivery rows to the database, `LocalDiskStorage` writes files under a configured root. Both are fully functional for the demo; swapping in SMTP or S3 later touches one file each.

### 3.2 SQLite-specific setup

These are not optional details. SQLite's defaults differ from Postgres in ways that silently corrupt data or block migrations if not handled in Phase 0.

| Concern | Handling |
| --- | --- |
| **Foreign keys are OFF by default** | `PRAGMA foreign_keys=ON` on every connection via a SQLAlchemy `connect` event listener. Without this, every FK in the schema is decorative and orphan rows accumulate silently. |
| **`ALTER TABLE` is severely limited** | Alembic configured with `render_as_batch=True`. SQLite cannot drop or alter a column; batch mode emulates it by create-copy-swap. Configure this before the first migration — retrofitting it means rewriting history. |
| **No native ENUM type** | `sa.Enum(..., native_enum=False)`, producing `VARCHAR` + a `CHECK` constraint. Invalid states are still rejected by the database, and the same model definition yields a real enum on Postgres later. |
| **No native `DECIMAL`** | CTC and percentages stored as `Integer` in minor units (paise) or as `Numeric` with explicit application-side quantization. Never float arithmetic on money. |
| **Timezone-naive storage** | SQLite has no `timestamptz`. All datetimes are converted to UTC before persistence and stored naive; `services/clock.py` is the single source of "now". Formatting and local-time display are the frontend's job. |
| **Writer concurrency** | `PRAGMA journal_mode=WAL` and a busy timeout. Single-writer remains a real limit; acceptable at this scale, and noted in §10 as a hosting consideration. |
| **`LIKE` case sensitivity** | ASCII-only case-insensitivity by default and different from Postgres. Search uses explicit `func.lower(col).contains(func.lower(term))` so behaviour is identical on both. |
| **JSON columns** | SQLAlchemy `JSON` type (TEXT-backed on SQLite, native on Postgres). Filtering on JSON contents is done in Python, never in SQL, so no dialect-specific JSON operators leak in. |
| **The database file** | `app.db` is **git-ignored**; it is a build artifact. `scripts/seed.py` regenerates it deterministically from a fixed random seed, so it is reproducible without being committed. |

### 3.3 Backend layout

```
backend/
  alembic.ini
  alembic/versions/
  app/
    main.py                  # app factory, middleware, routers, exception handlers
    core/
      config.py              # pydantic-settings; NO literal default for SECRET_KEY or DATABASE_URL
      db.py                  # engine, pragmas, SessionLocal, get_db
      security.py            # argon2 hashing, JWT encode/decode
      rbac.py                # Role enum, require_roles() dependency factory
      errors.py              # AppError hierarchy → uniform JSON error envelope
      pagination.py          # Page[T], paginate()
      clock.py               # now() — injectable, so time-dependent logic is testable
    models/                  # SQLAlchemy 2.0 DeclarativeBase, one module per context
      base.py user.py reference.py student.py training.py placement.py event.py audit.py
    schemas/                 # Pydantic v2 request/response (evolved from today's files)
    repositories/            # query objects; the only place select() is written
    services/
      progression.py         # academic-year derivation (lateral entry)
      eligibility.py         # placement eligibility rule engine
      applications.py        # application + round state machine
      attendance.py          # shared marking logic across training/placement/event
      export.py              # CSV generation
      notifications/         # Notifier port + LoggingNotifier adapter
      audit.py               # write-side audit trail
    api/
      deps.py
      v1/                    # routers only — paths unchanged where possible
  scripts/
    seed.py                  # deterministic demo dataset generator
    reset_db.py              # drop, migrate, reseed — one command
  tests/
    conftest.py              # in-memory SQLite, per-test transaction rollback
    unit/ integration/ api/
```

### 3.4 Frontend layout

```
frontend/
  vite.config.ts  index.html  .env.example
  src/
    main.tsx
    app/           # router, providers (QueryClient, Auth, Toast), route guards
    lib/
      apiClient.ts     # axios instance, auth interceptor, refresh-once logic
      queryClient.ts
      format.ts
    components/
      ui/          # Button Input Select DataTable Modal Badge Toast Pagination
                   # FilterBar EmptyState ErrorState Skeleton FormField
      layout/      # AppShell, Sidebar, TopBar
    features/
      auth/ students/ training/ placements/ events/ analytics/ accounts/
                   # each: api.ts (typed hooks) · components/ · pages/ · types.ts
  tests/           # Vitest + Testing Library; MSW for API mocking
```

**Rule:** a page composes; it does not fetch and it does not hand-roll a table. Data access goes through a feature's `api.ts` hooks; presentation through `components/ui`. This is what stops a page reaching 1,275 lines again.

### 3.5 Cross-cutting contracts

**Error envelope** — every non-2xx response:
```json
{ "error": { "code": "ELIGIBILITY_FAILED", "message": "Human readable.", "details": {} } }
```
`code` is a stable machine-readable string. The frontend switches on `code`, never on `message`.

**Pagination** — `?page=&page_size=` (default 25, max 100), responding `{count, next, previous, results}` — unchanged from today, so the client contract holds.

**Auth** — access JWT, 30-minute expiry, carrying `sub`, `role`, `exp`, `jti`. Refresh token, 7 days, stored in a `refresh_tokens` table so logout genuinely revokes. Argon2id password hashing.

**Audit** — every mutation to a student profile, eligibility decision, round result, or role assignment writes an `audit_logs` row: actor, action, entity type/id, before/after diff, timestamp. Kept because it is visible in the UI and demonstrates real design; the *encryption* of audited PII is what moves to §10.

**Time** — all persisted datetimes are UTC, obtained through `core/clock.py` so tests can freeze it.

---

## 4. Data model

From `CRM_MIGRATION_MASTER_PLAN.md` §8 with the corrections below. Full DDL is the initial Alembic migration in Phase 2.

| Context | Tables |
| --- | --- |
| Identity | `users`, `refresh_tokens`, `audit_logs` |
| Reference | `academic_years`, `branches`, `divisions`, `batches`, `companies`, `job_roles` |
| Student | `students`, `student_academic_history`, `student_compliance`, `student_documents`, `resume_ats_scores` |
| Training | `training_programs`, `training_slots`, `training_registrations`, `training_attendance`, `training_tests`, `training_test_scores` |
| Placement | `placement_opportunities`, `placement_applications`, `placement_rounds`, `placement_round_results`, `placement_day_attendance` |
| Event | `events`, `event_enrollments`, `event_attendance` |
| Comms | `notification_templates`, `notification_logs` |

**Corrections to the master plan's schema**

1. **`students.current_academic_year` is never stored.** The master plan lists it as a column *and* as "derived at runtime." Storing it guarantees staleness every July. It is computed by `services/progression.py`; only `admission_year`, `entry_mode`, and `program_duration_years` persist. `expected_graduation_year` is likewise derived.
2. **Reference data is tables, not hardcoded lists.** Branches, divisions, batches, companies, and job roles become admin-editable rows with FKs, replacing `common.py`'s literals.
3. **`users` and `students` are separate, linked 1:0..1** via `students.user_id` (unique, nullable). A student record can exist before an account is issued; staff have no student record. Today's `linked_user_id` becomes a real FK.
4. **PII is masked in responses**, not encrypted at rest. `student_compliance.aadhaar_number` and `pan_number` are excluded from list endpoints and returned masked (`XXXX XXXX 1234`) on detail unless the caller is `SUPER_ADMIN`. Since all values are fabricated, at-rest encryption is deferred to §10 — the *access control* is what this plan builds and tests.
5. **Uniqueness and indexing**, unspecified in the master plan. Unique: `users.email`, `students.college_roll_no`, `students.email`, `(training_attendance.slot_id, student_id)`, `(placement_applications.opportunity_id, student_id)`, `(placement_round_results.round_id, student_id)`, `(event_enrollments.event_id, student_id)`. Indexed: every FK, `students.(branch_id, admission_year, status)`, `placement_opportunities.(status, application_close_at)`.
6. **Status fields are `Enum(native_enum=False)`** — VARCHAR + CHECK on SQLite, real enums on Postgres later.
7. **Soft delete.** `students` and `placement_opportunities` carry `deleted_at`; nothing referenced by history is hard-deleted.

**Derivation rules** (`services/progression.py`, unit-tested against a case table):
```
program_duration_years   = 4 if entry_mode == REGULAR else 3
expected_graduation_year = admission_year + program_duration_years - 1
current_academic_year    = clamp(academic_year_of(today) - admission_year + 1, 1, program_duration_years)
```
Beyond `program_duration_years`, the student resolves to `GRADUATED`, `EXTENDED`, or `ALUMNI` per their `status`. The academic year rolls over on **1 July**, configurable — a plain calendar-year subtraction misclassifies every student for six months of each year.

---

## 5. Role and permission matrix

Five roles, matching the existing `AuthUser` union so frontend types are unchanged: `SUPER_ADMIN`, `TPO`, `HOD`, `VOLUNTEER`, `STUDENT`.

| Capability | SUPER_ADMIN | TPO | HOD | VOLUNTEER | STUDENT |
| --- | :-: | :-: | :-: | :-: | :-: |
| Manage users & roles | ✔ | — | — | — | — |
| Manage reference data | ✔ | ✔ | — | — | — |
| Create/edit any student | ✔ | ✔ | own branch | — | — |
| View student directory | ✔ | ✔ | own branch | ✔ | — |
| View/edit own profile | ✔ | ✔ | ✔ | ✔ | ✔ |
| View PII (unmasked) | ✔ | — | — | — | own |
| Create training programs/slots | ✔ | ✔ | — | — | — |
| Mark training attendance | ✔ | ✔ | ✔ | ✔ | — |
| Upload test scores | ✔ | ✔ | ✔ | — | — |
| Create/publish opportunities | ✔ | ✔ | — | — | — |
| View opportunities | ✔ | ✔ | ✔ | ✔ | eligible only |
| Apply to opportunity | — | — | — | — | ✔ |
| Manage rounds & results | ✔ | ✔ | — | — | — |
| Mark placement-day attendance | ✔ | ✔ | ✔ | ✔ | — |
| Export to HR | ✔ | ✔ | — | — | — |
| Create events | ✔ | ✔ | ✔ | — | — |
| Enroll in event | — | — | — | — | ✔ |
| View analytics | ✔ | ✔ | own branch | — | own |
| Read audit log | ✔ | — | — | — | — |

Enforced by a `require_roles(...)` router dependency **plus object-level checks in services** for the scoped rows ("own branch", "own"). Router checks alone cannot express those, and that is exactly where this class of system leaks.

**Demo role switcher.** When `APP_ENV=development`, `GET /api/v1/auth/demo-accounts/` returns the seeded accounts and the login page renders one-click sign-in buttons per role. The endpoint returns `404` in any other environment, and the frontend control is compiled out via `import.meta.env.DEV`. It is a convenience over real auth, never a bypass of it — the buttons perform an ordinary login and receive an ordinary JWT.

---

## 6. The eligibility engine

The one piece of genuine business logic; it gets its own module and the densest tests.

**Inputs** — `opportunity.eligibility_rules_json`, validated on write against a Pydantic model:
```json
{
  "branches": [1, 2],
  "min_current_academic_year": 4,
  "entry_modes": ["REGULAR", "LATERAL_DIPLOMA"],
  "min_tenth_percentage": 60.0,
  "min_twelfth_or_diploma_percentage": 60.0,
  "min_cgpi": 6.5,
  "max_live_kt": 0,
  "max_dead_kt": 2,
  "max_gap_years": 1,
  "max_drops": 1,
  "required_courses": ["Python"],
  "allow_already_placed": false
}
```
Every key is optional; an absent key is an unconstrained dimension.

**Contract**
```python
def evaluate(student: Student, rules: EligibilityRules, *, at: datetime) -> EligibilityResult
# EligibilityResult = { eligible: bool, failed: list[RuleFailure], snapshot: dict }
```
Pure — no session, no I/O. Runs in a loop over students without N+1 queries and tests without a database.

**Evaluated at three points, with different consequences**

1. **Listing** (`GET /placements/opportunities/` as a `STUDENT`) — filters the list. Column-mappable rules are pushed into SQL; the rest evaluate in Python.
2. **Applying** (`POST .../apply/`) — hard gate. Failure returns `409` with `code: "ELIGIBILITY_FAILED"` and the full `failed` list, so the UI can explain *why*.
3. **Snapshotting** — on success the complete `EligibilityResult` freezes into `placement_applications.eligibility_snapshot_json`. Rules and marks both change over time; an application must stay auditable against the state at the moment it was made. A requirement, not an optimization.

**Application state machine** — transitions validated centrally, illegal ones rejected with `409`:
```
APPLIED → SHORTLISTED → OFFERED → JOINED
   │            │           └────→ DECLINED
   └────────────┴───────────────→ REJECTED
                             (any) → WITHDRAWN   [student-initiated only]
```

---

## 7. Phases

Each phase is an independently reviewable branch leaving `main` in a working state. Phases 1–7 are **vertical slices** — backend, frontend, and tests for one domain land together, so every phase ends with something demonstrable rather than half a stack.

**Every phase extends `scripts/seed.py`.** Adding a domain means adding its demo data in the same branch, so the app always has something real to look at and no phase ends with empty screens.

Effort is in relative units (1 unit ≈ one focused working day).

---

### Phase 0 — Foundations and guardrails · 5 units — ✅ COMPLETE

Preconditions. Nothing here is a feature; everything here prevents rework.

> **Outcome.** Both suites green: backend ruff/mypy/pytest (29 tests) and frontend
> eslint/prettier/tsc/vitest (17 tests) + production build. `uvicorn` and `vite`
> both boot; `scripts/reset_db.py` recreates the database end to end.
>
> **Deviations from the plan as written:**
> - `SYSTEM_WORKING_GUIDE.md` was **kept** (as `docs/LEGACY_SYSTEM_NOTES.md`) rather
>   than deleted — it documents the prior system's business process, which the
>   other four setup docs did not.
> - `noUnusedLocals` / `noUnusedParameters` are **off** initially (they are not part
>   of `strict`); enabling them surfaces 11 dead declarations in pre-rewrite pages.
>   Re-enable per phase as those pages are rebuilt.
> - `src/lib/legacyQuery.ts` was added to bridge react-query v3's positional
>   signature to TanStack Query v5, so 11 unrewritten pages did not have to be
>   hand-converted during a behaviour-preserving phase. Temporary; delete when the
>   last import goes.
> - Tailwind was **removed**, not migrated: no config existed and none of the 97
>   distinct class names in the app were Tailwind utilities.
>
> **Bugs found and fixed** (all invisible under CRA, which never type-checked):
> - `EventsPage` referenced an undeclared `studentsList`, throwing a
>   `ReferenceError` whenever an admin opened an event's attendee roster.
> - `PlacementsPage` carried two dead handlers (`handleCreateJob`,
>   `handleCreateDrive`, 69 lines) referencing state variables deleted in an earlier
>   refactor.
> - `TrainingPage` had two comparisons that could never be true, so a year filter
>   silently relied only on its other branch.

**Repository**
- Untrack `frontend/build/`; add to `.gitignore`. Add `*.db`.
- Delete `docker-compose.yml` — it provisions Postgres and services nothing connects to, and there is no container story now.
- Consolidate `README`, `QUICK_START`, `SETUP_GUIDE`, `SETUP_COMPLETE`, `SYSTEM_WORKING_GUIDE` into one accurate `README.md` plus `docs/`. Delete the rest; five documents describing capabilities that do not exist is worse than none.
- Move `CRM_MIGRATION_MASTER_PLAN.md` into `docs/`, headed with a pointer to this plan.

**Backend**
- `core/config.py` on `pydantic-settings`. **No default for `SECRET_KEY` or `DATABASE_URL`** — the app refuses to start unconfigured rather than booting with a known key. `.env.example` documents every variable.
- `core/db.py`: engine, `SessionLocal`, `get_db`, and the connection-event listener applying `foreign_keys=ON`, `journal_mode=WAL`, and the busy timeout (§3.2).
- `core/clock.py`.
- Alembic initialized **with `render_as_batch=True`** before any migration exists (§3.2).
- `core/errors.py` and the handlers producing the §3.5 envelope.
- Replace `allow_origins=["*"]` with configured `ALLOWED_ORIGINS`.
- `tests/conftest.py`: in-memory SQLite with the same pragmas, per-test transaction rollback, `TestClient`, and an authenticated-client factory per role.
- `scripts/reset_db.py` — drop, migrate, reseed in one command. Used constantly from here on.
- Tooling: `ruff`, `mypy` (strict on `services/` and `models/`), `pytest-cov`.

**Frontend**
- **CRA → Vite migration** in one behaviour-preserving commit: `vite`, `@vitejs/plugin-react`, `index.html` to root, `process.env.REACT_APP_*` → `import.meta.env.VITE_*`, `vitest` + Testing Library + MSW replacing `react-scripts test`.
- TypeScript 4.9 → 5.x, `strict` enabled.
- TanStack Query v5 in, `react-query@3` out.
- `lib/apiClient.ts`: one axios instance, auth interceptor, refresh-once-then-logout (today's version can loop).
- ESLint + Prettier.

**CI** — GitHub Actions: backend lint + type + test; frontend lint + type + test + build. Required on every PR from Phase 1 on.

**Done when:** one documented command starts the API and one starts the frontend; `/health` responds; `reset_db.py` produces a working database; both suites are green in CI; the app builds under Vite with no functional change.

---

### Phase 1 — Identity and access · 5 units — ✅ COMPLETE

The security rewrite. Nothing else can be trusted until this lands.

> **Outcome.** 207 backend tests (up from 29) and 22 frontend tests, all green;
> ruff, mypy, eslint, prettier, tsc, and the production build clean. Argon2id
> hashing, real signed JWTs with expiry and `jti`, rotating server-revocable
> refresh tokens, `require_roles` on every route, and a 99-case role × endpoint
> authorization matrix.
>
> **Correction to the §2.1 audit.** "No endpoint reads the role" was too broad:
> `students.py` and `training.py` did check roles (dict-based). The genuinely
> unguarded paths were `PATCH /auth/users/{id}/` — the privilege-escalation
> hole — and the five stub routers, including `communications`, whose
> email/SMS dispatch any authenticated caller could reach.
>
> **Deviations:**
> - `core/rbac.py` holds pure policy only; the FastAPI dependencies live in
>   `api/deps.py`. An earlier design that put `require_roles` in `rbac.py` needed
>   a late-binding hack to avoid a circular import, which would have broken
>   silently since dependencies are captured at import time.
> - `deps.get_current_user_legacy` returns a dict-shaped user so the pre-rewrite
>   `students`/`training` routers keep working on real JWT auth without being
>   edited during a phase that does not own them. Delete it in Phase 4.
> - Login throttling (5 per email / 15 min) is in-process, so it resets on
>   restart and would need a shared store behind multiple workers. §10 covers
>   the broader production rate limiting.
>
> **Bugs found and fixed:**
> - `api/deps.py` originally re-exported `get_db` through a wrapper function.
>   FastAPI keys dependency overrides on the exact callable, so the test
>   override never applied — the suite would have silently used the real
>   database instead of the fixture session.
> - `verify_password` caught `VerifyMismatchError` but not its parent
>   `VerificationError`, which argon2 raises for a corrupt stored hash: a
>   damaged row would have 500'd the login endpoint instead of failing the
>   sign-in.
> - The frontend discarded the rotated refresh token, keeping the one the
>   server had just revoked. Sessions would have ended at the first refresh
>   rather than after 7 days.
> - `/accounts` was routed for TPO and HOD while the API restricts user
>   administration to SUPER_ADMIN; both the route and the sidebar link are now
>   SUPER_ADMIN-only rather than leading to a guaranteed 403.
> - The login page had demo credentials hardcoded in the bundle and always
>   visible. They now come from `GET /auth/demo-accounts/`, which 404s unless
>   `APP_ENV=development`, behind a second `import.meta.env.DEV` gate.

**Backend**
- `models/user.py`, `refresh_tokens`, `audit_logs`; first Alembic migration.
- `core/security.py`: Argon2id hashing, JWT encode/decode with expiry and `jti`.
- `core/rbac.py`: `Role` enum, `require_roles(*roles)` factory.
- Rewrite `api/v1/auth.py` against the database: login, rotating refresh, revoking logout, `me`, change-password, user CRUD.
- **Apply `require_roles` to every endpoint in the application**, including the not-yet-implemented ones — a stub that is publicly writable is a live hole.
- `GET /auth/demo-accounts/`, gated to `APP_ENV=development`, returning seeded accounts (§5).
- `scripts/seed.py` v1: one user per role, deterministic passwords, refusing to run against a non-empty database unless `--force`.

**Frontend**
- `features/auth`: login page, `AuthProvider` reading role from the JWT, `RequireAuth` / `RequireRole` guards, working 401 handling.
- Dev-only role-switcher buttons on the login page, behind `import.meta.env.DEV`.
- `features/accounts`: rebuild `AccountsPage` (379 lines, mock-backed) on the real endpoints.

**Tests** — hashing round-trip; token expiry and revocation; **the full role × endpoint authorization matrix** (table-driven — the single highest-value test in the codebase); refresh rotation; `demo-accounts` returning 404 outside development.

**Done when:** plaintext passwords are gone; a `STUDENT` token gets `403` from every admin endpoint; logout invalidates the refresh token; one click signs you in as any role in dev.

---

### Phase 2 — Reference data, student core, UI kit · 7 units — 🟡 PARTIAL (2a done)

> **Phase 2a — reference data — ✅ COMPLETE**, delivered alongside Phase 1 because
> it has no dependency on students and `users.branch_id` needs a real branch FK
> for HOD scoping.
>
> `branches`, `divisions`, `batches`, `companies`, `job_roles`, and
> `academic_years` are tables with ids, replacing `common.py`'s hardcoded string
> lists — a bare string cannot be pointed at by a foreign key. CRUD is
> audit-logged, writes are restricted to SUPER_ADMIN/TPO, duplicates return 409
> rather than 500, and deletion deactivates instead of removing, since these rows
> are referenced by history.
>
> Two fixes worth noting: the unique-violation guard runs inside a SAVEPOINT
> because `begin_nested()` autoflushes — opening it after the mutation let the
> `IntegrityError` escape — and hand-rolled `model_validate` (the schema depends
> on the URL segment, which FastAPI cannot express in a signature) needed its
> pydantic error converted explicitly, or it surfaced as a 500 instead of a 422.
>
> **Phase 2b — student core and the UI kit — still outstanding:** the student
> model, progression rules, CSV import, `components/ui`, and the reference-data
> admin screen. `common.py` is done; `students.py` is not.

**Backend**
- `models/reference.py`, `models/student.py`; migration.
- Repositories and services for reference and student CRUD.
- `services/progression.py` — §4's derivation rules.
- Rewrite `api/v1/common.py` against tables (deleting the hardcoded lists) and `api/v1/students.py` with real pagination, search (name/roll/email, case-insensitive per §3.2), and filters (branch, admission year, entry mode, status, division, batch).
- Audit logging on every student mutation.
- CSV import: dry-run validation returning a per-row error report, then commit.

**Frontend**
- **`components/ui` built out here** — `DataTable` (sort, paginate, select, column config), `FilterBar`, `FormField`, `Modal`, `Badge`, `EmptyState`, `ErrorState`, `Skeleton`. Every later phase consumes these; this is the phase that prevents thousand-line pages returning.
- Rebuild `StudentsPage` (313) and `StudentEditPage` (397) on `DataTable` + react-hook-form/zod.
- Reference-data admin screen.

**Seed** — branches, divisions, batches, companies, job roles, and ~300 students with realistic name/branch/year distributions including lateral-entry cohorts.

**Tests** — progression across a case table (regular, lateral, mid-year rollover, over-duration, the 30 June / 1 July boundary with a frozen clock); filter and search integration; CSV import happy and partial-failure paths.

**Done when:** students persist across restarts; the directory filters and paginates server-side; no hardcoded reference list survives anywhere; a lateral-entry student's academic year is right on both sides of 1 July.

---

### Phase 2.5 — Visual identity and design system · 3 units

Inserted after Phase 2a and **before Phase 2b's component kit**. The sequencing is the whole point: Phase 2b builds `components/ui`, which all 17 screens and every later phase consume. Redesigning after that means building the component library twice.

Full specification: [`docs/DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md).

**Why now.** The current palette was inherited from the earlier attendance-only system and does not survive contact with placement drives, rounds, and eligibility. It also contains a structural defect rather than merely a dated look: `--color-accent` and `--color-success` are the same hex (`#0d9488`), so "you can click this" and "this succeeded" are indistinguishable — and `--color-primary` (`#8b1e1e`) sits in the same hue family as `--color-error`, so every primary button competes with the "Absent" chip beside it.

**The direction.** *Colour is reserved for state; the chrome is monochrome.* In a product whose entire job is state — eligible/not, applied→shortlisted→offered→joined, present/absent, draft/published/closed — colour is data, so the interface gives it up everywhere else.

**Work**
- Replace the `:root` token block: five chrome neutrals plus one accent (`--stamp #24379B`), and a separate reserved state set (`won` / `hold` / `lost` / `open` / `draft`), each with light and dark values.
- Add the status → token map so no screen picks a colour by hand.
- Swap Outfit + Inter for **Archivo** + **JetBrains Mono**; mono carries every identifier and figure, with tabular figures for column scanning.
- Collapse radii to a single 4px; delete `--shadow-glow` and the layered card shadows in favour of hairline rules.
- Build the two primitives Phase 2b depends on: **`<StateChip>`** (resolves a domain status to its token) and **`<Funnel>`** (the signature element — Applied → Shortlisted → Offered → Joined, segment widths proportional to counts).
- Fold the existing `.badge-*` classes into `StateChip` so status colour has one source.
- Verify contrast in both themes and keyboard focus visibility.

**Deliberately unchanged:** the dark rail beside a light workspace, route layout, and information hierarchy. That structure is right for a tool staff operate all day; the distinctiveness comes from colour discipline, the mono data treatment, and the funnel, not from moving the furniture.

**Done when:** no chrome element uses a saturated colour; every status string in the §4 map renders through `StateChip`; the funnel appears on drive cards, the drive workspace header, and the dashboard; both themes pass contrast; and no `.badge-*` class remains.

---

### Phase 3 — Student profile depth · 5 units

**Backend**
- `student_academic_history`, `student_compliance`, `student_documents`, `resume_ats_scores`; migration.
- `Storage` port + `LocalDiskStorage` (config-driven root, outside any served path).
- Upload pipeline: extension and MIME allowlist, magic-byte sniff, size cap, generated filename (never the client's), per-student directory. Download streams through an authorized endpoint, never a static path.
- PII masking per §4.4.
- `GET /students/{id}/timeline/` — merged chronological feed across training, placement, and event activity.

**Frontend**
- Rebuild `StudentProfileAdminPage` (387) and `ProfilePage` (449) as tabbed views: Overview · Academics · Documents · Timeline.
- Upload component with progress, type validation, versioned history.

**Tests** — upload rejection cases (wrong type, oversized, spoofed MIME, path traversal in filename); masking per role; timeline ordering across sources.

**Done when:** a document uploads, versions, and downloads only for authorized callers; a `VOLUNTEER` cannot read another student's Aadhaar; a disallowed type is rejected on content, not extension.

---

### Phase 4 — Training operations · 6 units

**Backend**
- Six training models; migration.
- `services/attendance.py` — the shared marking service, reused unchanged by Phases 5 and 6.
- Programs, slots with capacity enforcement, registrations, attendance, tests, scores.
- **Mark-by-roll-number** endpoint backing the existing fast-mark UI: resolves roll → student, idempotent, returns the resolved student for confirmation.
- Bulk marking in one transaction.
- Test-score CSV import with a validation report.

**Frontend**
- Rebuild `TrainingPage` (554) as composed feature components.
- Rebuild `TrainingFastMarkPage` (311) — a rapid hall-entry workflow: optimistic updates, keyboard-first, explicit failed-submit queue. It must not silently drop marks.
- `TrainingSessionCreatePage` on shared form components.

**Seed** — two programs, a term of slots, registrations, and attendance history with realistic present/absent distribution.

**Tests** — double-marking is idempotent, not duplicated; capacity holds; roll resolution including unknown and ambiguous rolls; bulk marking is atomic.

**Done when:** attendance persists and is queryable by slot, student, and date range; marking twice yields one row; score import reports per-row errors without partial commits.

---

### Phase 5 — Placement operations · 11 units

The largest phase and the reason the project exists. Pre-split into two mergeable halves.

**5A — Opportunities and eligibility · 5 units**
- `placement_opportunities`; migration.
- `services/eligibility.py` per §6, with `EligibilityRules` validated on write.
- Opportunity CRUD, `publish` (draft → published, validating rules and dates), `close`.
- Student listing filtered by eligibility; staff listing unfiltered.
- Rebuild `PlacementOpportunityCreatePage` (1,003 lines) as a wizard: Company & Role → Compensation → Eligibility Rules → Schedule → Review. The eligibility step gets a **live matching-student count** — the difference between rules that are guessed and rules that are verified, and a genuinely good thing to show off.

**5B — Applications, rounds, attendance, export · 6 units**
- `placement_applications`, `placement_rounds`, `placement_round_results`, `placement_day_attendance`; migration.
- `services/applications.py` — §6's state machine, centrally validated.
- Apply endpoint: eligibility hard gate, deadline check, duplicate rejection, snapshot write.
- Round CRUD, sequencing, bulk result entry, cohort progression (round *n* qualifiers become round *n+1*'s roster).
- Placement-day attendance via the shared service.
- `services/export.py` — HR CSV, configurable columns, streamed, PII excluded by default with an audit-logged opt-in.
- Rebuild `PlacementsPage` (1,275 lines) as an opportunity board plus a drive workspace (Applicants · Rounds · Attendance · Export tabs). Rebuild `PlacementDriveCreatePage` and `PlacementDriveFastMarkPage`.

**Seed** — a dozen companies, ~20 opportunities across draft/published/closed, applications at every lifecycle stage, completed multi-round drives with results, and a believable placement rate. Analytics in Phase 7 are only demonstrable if this data has real shape.

**Tests** — the eligibility rule matrix, one case per rule plus combinations and absent keys; snapshot immutability when rules change afterward; every legal and illegal transition; duplicate and past-deadline applications; round progression; export columns and PII exclusion.

**Done when:** a student sees only eligible opportunities, is refused with reasons when not, and progresses through rounds to an offer; staff export a correct HR sheet; a snapshot taken before a rule change still reflects the original decision.

---

### Phase 6 — Events and seminars · 4 units

**Backend** — `events`, `event_enrollments`, `event_attendance`; migration. CRUD, publish, enroll/unenroll with capacity, attendance via the shared service, roster export.

**Frontend** — rebuild `EventsPage` (564, mock-backed) and `EventSeminarCreatePage` (271) on shared components.

**Seed** — past and upcoming events with enrollments and attendance.

**Tests** — capacity limits, enroll/unenroll idempotency, attendance-without-enrollment handling.

**Done when:** events persist, capacity holds, rosters export.

---

### Phase 7 — Analytics and reporting · 5 units

Replaces `analytics.py`'s hardcoded constants with real aggregation over the seeded history.

**Backend**
- `repositories/analytics.py` — aggregate SQL, no Python-side row loops.
- Placement funnel: published → applied → shortlisted → offered → joined, with conversion rates.
- CTC statistics (median, mean, min/max) by company, role, branch, year.
- Training attendance trends and score progression by cohort.
- Event enrollment-vs-attendance conversion.
- Shared filters across all endpoints: academic year, admission year, branch, entry mode, company, role, date range, status.
- Each endpoint covered by an index.

**Frontend**
- Rebuild `DashboardPage` (298, hardcoded) with role-aware content: TPO sees institution-wide, HOD sees own branch, student sees own progress.
- Analytics screens with the shared filter bar and CSV export of any view.

**Tests** — aggregation correctness against the fixed seed with hand-computed expected values (deterministic seeding is what makes this possible); role scoping (an HOD's numbers cover only their branch); empty-dataset handling — no divide-by-zero, no null rendering.

**Done when:** every number on every dashboard traces to a query; HOD figures are branch-scoped; the funnel reconciles with the underlying application rows.

---

### Phase 8 — Notifications behind a port · 3 units

**Backend**
- `Notifier` Protocol: `send(template_key, recipient, context) -> NotificationResult`.
- `LoggingNotifier` (default) writing real `notification_logs` rows, and `SMTPNotifier` (config-gated, off).
- `notification_templates` and `notification_logs`; every attempt logged with status.
- Triggers wired: opportunity published → eligible students; training attendance recorded → parent summary; event reminder; application status changed → student.
- Consent flags respected before every send.
- Sends are **fire-and-log** — a failed notification never fails the action that triggered it.

**Frontend** — template management screen; notification log viewer with delivery status. Both are real, functioning screens; only the transport is simulated.

**Tests** — trigger firing, consent suppression, template rendering, and that notifier failure leaves the triggering transaction committed.

**Done when:** every trigger produces a logged row visible in the UI, and enabling SMTP is a config change with no code change.

---

### Phase 9 — Demo dataset and portfolio polish · 4 units

The phase that turns a working system into something worth showing.

- **Scale and shape the seed**: ~300 students across branches and admission years, multi-year history so trends have slope, a believable placement rate, and edge cases deliberately present (a lateral-entry student, an ineligible applicant, a withdrawn application, a student with live KTs) so the interesting logic is reachable by clicking.
- **Dates are generated relative to `today`**, not hardcoded — so the demo never rots into a screen full of expired drives.
- **Deterministic**: fixed random seed, so the dataset is reproducible and Phase 7's expected-value tests stay valid.
- Empty, loading, and error states reviewed on every screen.
- Responsive pass; keyboard navigation on the fast-mark flows.
- `README.md`: what it is, screenshots, one-command setup, the demo accounts, an architecture summary, and an honest scope note.
- `docs/`: OpenAPI export, generated ERD, the role matrix.
- End-to-end tests (Playwright) over the four critical journeys: student application, round progression, training attendance, event enrollment.

**Done when:** a stranger clones the repo, runs two commands, signs in as any role, and reaches every feature with data that looks real.

---

### Effort summary

| Phase | Focus | Units |
| --- | --- | ---: |
| 0 | Foundations, SQLite setup, Vite migration, CI | 5 |
| 1 | Identity, access, demo role switcher | 5 |
| 2 | Reference data, student core, UI kit | 7 |
| 2.5 | Visual identity and design system | 3 |
| 3 | Student profile depth, documents | 5 |
| 4 | Training operations | 6 |
| 5 | Placement operations (5A + 5B) | 11 |
| 6 | Events | 4 |
| 7 | Analytics | 5 |
| 8 | Notifications | 3 |
| 9 | Demo dataset and polish | 4 |
| | **Total** | **58** |

**Ordering constraints.** 0 → 1 → 2 is a strict chain. Phases 3, 4, and 6 are mutually independent once 2 lands. Phase 5 needs 2 and reuses 4's attendance service. Phase 7 needs 4, 5, and 6 for real data. Phases 8 and 9 come last.

**Phase 2.5 must precede Phase 2b** — the component kit is built on its tokens and primitives.

**Earliest genuinely usable system:** end of Phase 4 — real accounts, real students, real training attendance, persisted. Phase 5 delivers the placement CRM the project is named for. **Phases 0–5 alone (42 units) make a strong portfolio piece**; 6–9 complete it.

---

## 8. Quality targets

Scaled to a portfolio project — the ones that survived are those a reader of the code would notice.

| Concern | Target |
| --- | --- |
| List endpoint latency | Comfortable at the ~300-student seed; no N+1 queries in any list endpoint |
| Backend coverage | ≥ 85% on `services/`, ≥ 70% overall |
| Frontend coverage | ≥ 60%, with the four critical journeys under E2E |
| Type safety | `mypy` strict on `services/` and `models/`; TS `strict` throughout |
| Auth | Argon2id; access 30 min; refresh 7 days, rotating and revocable |
| Uploads | Type allowlist by magic bytes, 10 MB cap, generated filenames |
| Audit | Every profile edit, eligibility decision, result update, role change |
| Determinism | `reset_db.py` reproduces an identical dataset from a fixed seed |

---

## 9. Testing strategy

Tests are written **with** each phase, not after. A phase is not done when its tests are missing.

- **Unit (fast, no I/O)** — `progression.py`, `eligibility.py`, the application state machine, CSV generation, masking. These are pure functions precisely so they can be tested this way.
- **Integration (in-memory SQLite, rolled back per test)** — repositories, transactional integrity, constraint enforcement. Note that in-memory SQLite needs the same pragmas as the file database (§3.2), or FK violations pass in tests and fail in the app.
- **API (TestClient)** — request/response contracts and the full role × endpoint authorization matrix.
- **Frontend (Vitest + Testing Library + MSW)** — `components/ui` behaviour, feature hooks, form validation, error states.
- **E2E (Playwright, Phase 9)** — the four critical journeys.

**Highest-value tests, written first in their phase:** the authorization matrix (Phase 1) and the eligibility rule matrix (Phase 5A). That is where silent, high-consequence bugs live.

---

## 10. Deferred: hosting and production hardening

Deliberately out of scope. Recorded so the decision is visible rather than forgotten, and so §2.5's portability constraint has a stated purpose.

**Before this could be hosted, decide:**

- **Where the database lives.** A committed SQLite file works for reads on serverless platforms but not for writes — the filesystem is ephemeral and per-instance, so changes vanish on the next cold start and differ between concurrent lambdas. The realistic options are Turso (hosted libSQL; same dialect, so §2.5 makes it a `DATABASE_URL` change) or managed Postgres (same migrations, one dialect change). Alternatively, host on a persistent VM where the SQLite file simply survives.
- **Where uploaded files live.** `LocalDiskStorage` needs replacing with object storage on any ephemeral host. The `Storage` port exists so this is one new adapter.

**Then implement:**

- PII encryption at rest for `student_compliance`.
- Rate limiting on login and expensive endpoints.
- Security headers, HTTPS enforcement, request-size caps, dependency audit (`pip-audit`, `npm audit`), OWASP Top 10 review.
- Structured JSON logging with request IDs; `/health` and `/ready`.
- Backups on a schedule with a **rehearsed restore** — an untested backup is not a backup.
- Load testing against a realistic dataset, and indexes added where measurement rather than intuition indicates.
- Real SMTP/SMS adapters replacing `LoggingNotifier`.
- Container build and deployment configuration.

---

## 11. Immediate next steps

1. Review and approve this document.
2. Write the detailed Phase 0 implementation plan under `docs/plans/`.
3. Branch `phase-0-foundations` and begin.

Each phase gets its implementation plan written immediately before that phase starts — not now. Plans written far ahead of execution get invalidated by what the preceding phase teaches.
