# CRM Dashboard Backend

FastAPI backend scaffold for the CRM Dashboard.

## Setup Instructions

### 1. Create Virtual Environment
```bash
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
source venv/bin/activate      # Unix/Mac
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Development Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server will be available at: `http://localhost:8000`
API docs: `http://localhost:8000/api/docs`
OpenAPI schema: `http://localhost:8000/api/schema`

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py
│   │   ├── router.py
│   │   └── v1/
│   │       ├── auth.py
│   │       ├── students.py
│   │       ├── placements.py
│   │       ├── training.py
│   │       ├── events.py
│   │       ├── communications.py
│   │       ├── analytics.py
│   │       └── common.py
│   ├── core/
│   │   └── auth.py
│   ├── db/
│   │   └── fake_db.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── students.py
│   │   ├── common.py
│   │   └── generic.py
│   └── main.py
├── .env.example
├── requirements.txt
└── README.md
```

## Current Scope

- In-memory data store for users and students
- Token-based auth flow for frontend integration
- Endpoints mirrored from the existing frontend service layer
- DRF-style paginated payload shape where frontend expects it

## API Endpoints

- Auth: `/api/v1/auth/`
- Students: `/api/v1/students/`
- Placements: `/api/v1/placements/`
- Training: `/api/v1/training/`
- Events: `/api/v1/events/`
- Communications: `/api/v1/communications/`
- Analytics: `/api/v1/analytics/`
- Common: `/api/v1/common/`

## Default Demo Accounts

- admin@college.edu / admin1234
- student@college.edu / student1234
- tpo@college.edu / tpo12345

## Next Steps

1. Replace in-memory store with SQLAlchemy models and Alembic migrations.
2. Replace mock tokens with proper JWT issuance and refresh.
3. Add role-based authorization checks per endpoint.
4. Add tests for auth, students CRUD, and pagination behavior.
