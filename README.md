# Placement Cell Dashboard

A training-and-placement management system for a college placement cell: student records, training attendance, placement drives with an eligibility engine, events, and analytics.

> **Status: under active rewrite.** The project is being rebuilt phase by phase against a real database and real authentication. Phase 0 (foundations) is complete; the domain modules are being rewritten from Phase 1 onward. Screens not yet reached by a phase still read from a pre-rewrite in-memory store and are not representative. See [`docs/REWRITE_PLAN.md`](docs/REWRITE_PLAN.md) for the full plan and current phase.

## Stack

| Layer | Choice |
| --- | --- |
| Backend | FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2 |
| Database | SQLite (local file, seeded with generated demo data) |
| Frontend | React 19, TypeScript 5, Vite 7, TanStack Query v5 |
| Tests | pytest (backend), Vitest + Testing Library (frontend) |

This is a portfolio build: it runs locally against a SQLite file with fabricated data. No real student records are involved. Hosting is deliberately deferred — see [§10 of the plan](docs/REWRITE_PLAN.md) for what changing that would require.

## Prerequisites

- Python 3.11+ (developed on 3.14)
- Node.js 20+ (developed on 24)

## Setup

### Backend

```bash
cd backend

python -m venv .venv
source .venv/Scripts/activate     # Windows (Git Bash)
# source .venv/bin/activate       # macOS / Linux

pip install --no-cache-dir -r requirements-dev.txt
```

Create the configuration. `SECRET_KEY` and `DATABASE_URL` have **no defaults** — the app refuses to start without them, so it can never boot with a key that is public in the source tree.

```bash
cp .env.example .env
python -c "import secrets; print(secrets.token_urlsafe(48))"   # paste into SECRET_KEY
```

Create and seed the database:

```bash
python -m scripts.reset_db
```

Run it:

```bash
uvicorn app.main:app --reload --port 8000
```

| | |
| --- | --- |
| API | http://localhost:8000 |
| Health | http://localhost:8000/health |
| API docs | http://localhost:8000/api/docs |
| OpenAPI schema | http://localhost:8000/api/schema |

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at http://localhost:5173. The API URL resolves automatically: `localhost` normally, and the page's own host when opened from another device on the same network (useful for the fast-mark attendance flows on a phone). Override with `VITE_API_URL` in `.env.local` if needed.

### Signing in

The seed creates one account per role. In development the login page shows a
button for each, so you can switch roles in one click:

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | admin@college.edu | admin1234 |
| TPO | tpo@college.edu | tpo12345 |
| HOD | hod@college.edu | hod12345 |
| Volunteer | volunteer@college.edu | volunteer1234 |
| Student | student@college.edu | student1234 |

These are demo fixtures, not secrets. The buttons perform a real sign-in against
real authentication — the endpoint that supplies them returns 404 unless the API
runs with `APP_ENV=development`, and the control is compiled out of a production
frontend bundle.

The roles differ in what they can reach: a Student gets 403 from user
administration, a Volunteer can mark attendance but not manage reference data,
and the HOD is scoped to a single branch. Signing in as each is the quickest way
to see the access rules working.

## Common commands

### Backend (`cd backend`)

| Command | Purpose |
| --- | --- |
| `pytest` | Run tests |
| `pytest --cov=app --cov-report=term-missing` | Tests with coverage |
| `ruff check . && ruff format .` | Lint and format |
| `mypy app scripts` | Type check |
| `python -m scripts.reset_db` | Drop, migrate, and reseed |
| `python -m alembic upgrade head` | Apply migrations |
| `python -m alembic revision --autogenerate -m "..."` | Create a migration |

### Frontend (`cd frontend`)

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm test` | Run tests |
| `npm run typecheck` | Type check |
| `npm run lint` | Lint |
| `npm run format` | Format |
| `npm run build` | Production build to `dist/` |

## Project layout

```
backend/
  app/
    core/          config, database, clock, errors, pagination
    models/        SQLAlchemy models
    schemas/       Pydantic request/response contracts
    repositories/  query objects — the only place select() is written
    services/      domain logic (eligibility, progression, attendance)
    api/v1/        HTTP routers
  alembic/         migrations
  scripts/         reset_db, seed
  tests/           unit, integration, api

frontend/
  src/
    app/           router and providers
    lib/           API client, query client
    components/    shared UI and layout
    features/      per-domain hooks, components, pages
    pages/         pre-rewrite screens, migrated into features/ by phase

docs/
  REWRITE_PLAN.md              the plan: architecture, data model, phases
  CRM_MIGRATION_MASTER_PLAN.md original product/feature reference
  LEGACY_SYSTEM_NOTES.md       business process notes from the prior system
```

## Notes for anyone reading the code

A few things are deliberate and documented where they appear:

- **SQLite needs explicit setup.** Foreign key enforcement is off by default in SQLite, so `app/core/db.py` applies `PRAGMA foreign_keys=ON` on every connection; without it every foreign key in the schema is decorative. Alembic runs in batch mode because SQLite cannot `ALTER TABLE` drop or alter a column.
- **The database file is a build artifact.** It is git-ignored and regenerated deterministically by `scripts/seed.py` from a fixed random seed, so the demo dataset is reproducible.
- **Pre-rewrite modules are exempt from lint and strict typing**, listed explicitly in `backend/pyproject.toml` and `frontend/eslint.config.js`. Each phase removes its files from those lists as it rewrites them, so the exemptions shrink to nothing rather than becoming permanent.
- **`frontend/src/lib/legacyQuery.ts`** bridges react-query v3's call signature to TanStack Query v5 for pages not yet rewritten. It is temporary; do not add new usages.
