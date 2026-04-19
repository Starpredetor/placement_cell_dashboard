# CRM Dashboard - Training and Placement Management

A comprehensive CRM-style dashboard for managing student training, placement, and event operations with end-to-end lifecycle tracking.

## Project Overview

This is a full-stack application built with:
- **Backend**: Django REST Framework (Python)
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

4. Run migrations:
```bash
python manage.py migrate
```

5. Create superuser (admin account):
```bash
python manage.py createsuperuser
```

6. Start development server:
```bash
python manage.py runserver
```

Backend will be available at: `http://localhost:8000`
Admin panel: `http://localhost:8000/admin`

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
2. **Backend Admin**: http://localhost:8000/admin
3. **API Documentation**: http://localhost:8000/api/docs/
4. **API Schema**: http://localhost:8000/api/schema/

## Project Structure

```
placement_cell_dashboard/
├── backend/                    # Django REST Framework API
│   ├── accounts/              # User authentication
│   ├── analytics/             # Analytics and reporting
│   ├── common/                # Shared models
│   ├── communications/        # Notifications
│   ├── crm_dashboard/         # Main settings
│   ├── events/                # Events management
│   ├── placement/             # Placement operations
│   ├── students/              # Student profiles
│   ├── training/              # Training management
│   ├── manage.py
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
   - Models in `apps/*/models.py`
   - Serializers in `apps/*/serializers.py`
   - Views in `apps/*/views.py`
   - URLs in `apps/*/urls.py`

3. **Frontend development**:
   - Components in `src/components/`
   - Pages in `src/pages/`
   - API calls in `src/services/api.ts`

4. **Run tests**:
```bash
# Backend
python manage.py test

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
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_VERSION=v1
```

## Deployment

### Backend (Django)
- Configure PostgreSQL database
- Set `DEBUG=False`
- Use production WSGI server (Gunicorn)
- Configure ALLOWED_HOSTS
- Enable HTTPS/SSL

### Frontend (React)
- Run `npm build` to create production build
- Serve static files from web server (Nginx, Apache)
- Configure API endpoint for production server

## Testing

### Backend
```bash
cd backend
python manage.py test
```

### Frontend
```bash
cd frontend
npm test
```

## Common Issues

### Port Already in Use
- Backend: `python manage.py runserver 8001`
- Frontend: `PORT=3001 npm start`

### CORS Errors
- Check CORS_ALLOWED_ORIGINS in backend settings
- Ensure frontend is accessing correct API URL

### Database Errors
- Reset database: `python manage.py migrate --reset`
- Create migrations: `python manage.py makemigrations`

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
- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev)
- [DRF Documentation](https://www.django-rest-framework.org/)
