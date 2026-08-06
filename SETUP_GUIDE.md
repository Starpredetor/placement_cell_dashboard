# Project Setup Guide

Complete setup instructions for the CRM Dashboard project.

## Table of Contents
1. [Initial Setup](#initial-setup)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Running the Project](#running-the-project)
5. [Docker Deployment](#docker-deployment)
6. [Next Steps](#next-steps)

## Initial Setup

### Clone Repository
```bash
git clone <repository-url>
cd placement_cell_dashboard
```

### System Requirements
- Python 3.9 or higher
- Node.js 16 or higher
- npm or yarn
- PostgreSQL 12+ (for production)
- Redis 6+ (optional, for caching/celery)

## Backend Setup

### 1. Create Virtual Environment

**Windows:**
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Mac/Linux:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

Copy the example environment file:
```bash
copy .env.example .env  # Windows
cp .env.example .env    # Mac/Linux
```

Edit `.env` and configure:
```env
API_HOST=0.0.0.0
API_PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 4. Run Development Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server starts at: `http://localhost:8000`

### Useful Backend Commands
```bash
# Run tests
pytest

# Start API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Configuration

Copy example environment file:
```bash
copy .env.example .env  # Windows
cp .env.example .env    # Mac/Linux
```

Configure `.env`:
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_VERSION=v1
```

### 3. Run Development Server
```bash
npm start
```

Application opens at: `http://localhost:3000`

### Useful Frontend Commands
```bash
# Start development server
npm start

# Run tests
npm test

# Build for production
npm build

# Eject from Create React App (irreversible)
npm eject
```

## Running the Project

### Start Both Servers (Development)

**Terminal 1 - Backend:**
```bash
cd backend
.\venv\Scripts\Activate.ps1  # Windows
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Access Application
- Frontend: `http://localhost:3000`
- Backend Health: `http://localhost:8000/health`
- API Documentation: `http://localhost:8000/api/docs`
- API Schema: `http://localhost:8000/api/schema`

### Default Credentials (Scaffold)
- `admin@college.edu / admin1234`
- `student@college.edu / student1234`
- `tpo@college.edu / tpo12345`

## Docker Deployment

### Prerequisites
- Docker
- Docker Compose

### Build and Run
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# The existing compose file is Django-based and should be updated
# before running FastAPI in containers.
```

### Access Services
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Database: PostgreSQL on port 5432
- Redis: Port 6379

### Useful Docker Commands
```bash
# Stop services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Run backend shell
docker-compose exec backend sh

# Open shell in container
docker-compose exec backend bash
```

## Next Steps

### Backend Development

1. **Create Schemas**
   - Define request/response schemas in `app/schemas/`

2. **Create Routers**
   - Implement endpoints in `app/api/v1/*.py`
   - Register routers in `app/api/router.py`

3. **Add Auth/Dependencies**
   - Use dependencies from `app/api/deps.py`
   - Enforce role checks per module

4. **Test APIs**
   - Use API documentation: `http://localhost:8000/api/docs`
   - Create test cases in `tests/`

### Frontend Development

1. **Create Components**
   - Functional components in `src/components/`
   - Use React hooks
   - Style with TailwindCSS

2. **Create Pages**
   - Page components in `src/pages/`
   - Use React Router for navigation

3. **API Integration**
   - Use API functions from `src/services/api.ts`
   - Handle data with React Query
   - Manage state with context/hooks

4. **Forms**
   - Use React Hook Form
   - Validate with Zod
   - Handle submission and errors

5. **Testing**
   - Write tests in `*.test.tsx`
   - Run with `npm test`

## Troubleshooting

### Backend Issues

**Port 8000 Already in Use:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

**Database Errors:**
- The scaffold backend uses in-memory data; restart the server to reset seed state.
- For persistent storage, add SQLAlchemy models and Alembic migrations.

**Module Import Errors:**
```bash
pip install -r requirements.txt --force-reinstall
```

### Frontend Issues

**Port 3000 Already in Use:**
```bash
PORT=3001 npm start
```

**Dependencies Issues:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**CORS Errors:**
- Check backend CORS settings include `http://localhost:3000`
- Ensure API URL is correct in `.env`

### Common Solutions

**Clean Install:**
```bash
# Backend
rm -rf venv
python -m venv venv
pip install -r requirements.txt

# Frontend
rm -rf node_modules
npm install
```

**Check Service Health:**
```bash
# Backend
curl http://localhost:8000/api/schema/

# Frontend
curl http://localhost:3000
```

## Project Structure Overview

```
placement_cell_dashboard/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers/dependencies
│   │   ├── core/         # Core auth utilities
│   │   ├── db/           # In-memory data store
│   │   └── schemas/      # Pydantic schemas
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── hooks/
│   │   └── styles/
│   ├── public/
│   ├── package.json
│   ├── .env.example
│   ├── Dockerfile
│   └── README.md
├── docs/
├── .gitignore
├── docker-compose.yml
├── CRM_MIGRATION_MASTER_PLAN.md
└── README.md
```

## Additional Resources

- [CRM Migration Master Plan](../CRM_MIGRATION_MASTER_PLAN.md)
- [Backend README](../backend/README.md)
- [Frontend README](../frontend/README.md)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev)
- [Uvicorn Documentation](https://www.uvicorn.org/)

## Support

For questions or issues:
1. Check this guide
2. Check README files in respective directories
3. Review error logs
4. Contact the development team

---
Last Updated: April 2026
