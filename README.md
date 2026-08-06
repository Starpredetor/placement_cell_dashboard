# CRM Dashboard - Training and Placement Management

A comprehensive CRM-style dashboard for managing student training, placement, and event operations with end-to-end lifecycle tracking.

## Project Overview

This is a full-stack application built with:
- **Backend**: FastAPI (Python)
- **Frontend**: React 18 with TypeScript
- **Database**: SQLite (development), PostgreSQL (production)
- **Authentication**: JWT tokens

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- npm or yarn

### Development Setup

#### Backend

1. Navigate to backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
source venv/bin/activate      # Unix/Mac
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start development server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`
Health check: `http://localhost:8000/health`

#### Frontend

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Copy environment variables:
```bash
copy .env.example .env
```

3. Install dependencies:
```bash
npm install
```

4. Start development server:
```bash
npm start
```

Frontend will be available at: `http://localhost:3000`

### Accessing the Application

1. **Frontend**: http://localhost:3000
2. **Backend Health**: http://localhost:8000/health
3. **API Documentation**: http://localhost:8000/api/docs/
4. **API Schema**: http://localhost:8000/api/schema/

## Project Structure

```
placement_cell_dashboard/
├── backend/                    # FastAPI API
│   ├── app/
│   │   ├── api/               # Endpoint routers
│   │   ├── core/              # Core helpers/auth
│   │   ├── db/                # Data layer (in-memory scaffold)
│   │   ├── schemas/           # Pydantic schemas
│   │   └── main.py
│   ├── requirements.txt
│   └── README.md
├── frontend/                  # React SPA
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── README.md
├── docs/                      # Documentation
├── CRM_MIGRATION_MASTER_PLAN.md
└── README.md
```

## Core Features

### 1. Student Management
- Student profile with academic history
- Document management (resumes, certificates)
- ATS resume scoring
- Admission year and cohort tracking

### 2. Placement Operations
- Post placement opportunities
- Student applications and eligibility
- Multi-round management (aptitude, GD, technical, HR)
- Placement day attendance
- HR export functionality
- Conversion funnel analytics

### 3. Training Management
- Training programs and slot scheduling
- Student batch segmentation
- Attendance tracking
- Test score management
- Parent notifications

### 4. Event Management
- Event/seminar announcements
- Student enrollment
- Attendance tracking

### 5. Analytics & Reporting
- Placement funnel analysis
- Training metrics
- Attendance reports
- Conversion rate tracking

## API Documentation

### Authentication
- Endpoint: `POST /api/v1/auth/login/`
- Response includes JWT tokens (access + refresh)

### Key Endpoints
- **Students**: `GET /api/v1/students/`
- **Placements**: `GET /api/v1/placements/opportunities/`
- **Training**: `GET /api/v1/training/programs/`
- **Events**: `GET /api/v1/events/`
- **Analytics**: `GET /api/v1/analytics/placements/`

Full API documentation available at: `http://localhost:8000/api/docs/`

## Database Schema

Key models:
- `Student` - Student profile with admission year, entry mode
- `PlacementOpportunity` - Job opportunities
- `PlacementApplication` - Student applications
- `PlacementRound` - Interview rounds
- `TrainingProgram` - Training sessions
- `TrainingSlot` - Individual training slots
- `TrainingAttendance` - Attendance records

See [CRM_MIGRATION_MASTER_PLAN.md](./CRM_MIGRATION_MASTER_PLAN.md) for complete schema details.

## Development Workflow

1. **Create a feature branch**:
```bash
git checkout -b feature/your-feature-name
```

2. **Backend development**:
   - Schemas in `app/schemas/`
   - Routers in `app/api/v1/`
   - Dependencies in `app/api/deps.py`
   - App bootstrap in `app/main.py`

3. **Frontend development**:
   - Components in `src/components/`
   - Pages in `src/pages/`
   - API calls in `src/services/api.ts`

4. **Run tests**:
```bash
# Backend
pytest

# Frontend
npm test
```

5. **Commit and push**:
```bash
git commit -m "Feature: description"
git push origin feature/your-feature-name
```

## Environment Variables

### Backend (.env)
```
API_HOST=0.0.0.0
API_PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_VERSION=v1
```

## Deployment

### Backend (FastAPI)
- Replace in-memory storage with a real database
- Add JWT signing/verification for production
- Run with production ASGI server settings (Uvicorn/Gunicorn)
- Configure allowed origins and HTTPS/SSL

### Frontend (React)
- Run `npm build` to create production build
- Serve static files from web server (Nginx, Apache)
- Configure API endpoint for production server

## Testing

### Backend
```bash
cd backend
pytest
```

### Frontend
```bash
cd frontend
npm test
```

## Common Issues

### Port Already in Use
- Backend: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8001`
- Frontend: `PORT=3001 npm start`

### CORS Errors
- Check `ALLOWED_ORIGINS` in backend environment settings
- Ensure frontend is accessing correct API URL

### Database Errors
- Current backend scaffold uses in-memory data and does not require migrations.
- For persistence, add a real database layer (SQLAlchemy + Alembic).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact the development team.

## Resources

- [CRM Migration Master Plan](./CRM_MIGRATION_MASTER_PLAN.md)
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev)
- [Uvicorn Documentation](https://www.uvicorn.org/)
