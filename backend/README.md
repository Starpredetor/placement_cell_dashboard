# CRM Dashboard Backend

Django REST Framework based backend for the CRM Dashboard.

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

### 3. Run Migrations
```bash
python manage.py migrate
```

### 4. Create Superuser
```bash
python manage.py createsuperuser
```

### 5. Run Development Server
```bash
python manage.py runserver
```

Server will be available at: `http://localhost:8000`
Admin panel: `http://localhost:8000/admin`
API Docs: `http://localhost:8000/api/docs`

## Project Structure

```
backend/
├── accounts/          # User authentication and profiles
├── analytics/         # Analytics and reporting
├── common/           # Shared models and utilities
├── communications/   # Email/SMS/WhatsApp services
├── crm_dashboard/    # Main project settings
├── events/           # Events and seminars
├── placement/        # Placement operations
├── students/         # Student profiles and records
├── training/         # Training activities
├── manage.py         # Django management script
└── requirements.txt  # Python dependencies
```

## API Documentation

### Available Endpoints

- **Auth**: `/api/v1/auth/`
- **Students**: `/api/v1/students/`
- **Placements**: `/api/v1/placements/`
- **Training**: `/api/v1/training/`
- **Events**: `/api/v1/events/`
- **Communications**: `/api/v1/communications/`
- **Analytics**: `/api/v1/analytics/`
- **Common**: `/api/v1/common/`

### Interactive API Documentation
- Swagger UI: `/api/docs/`
- ReDoc: `/api/redoc/`

## Configuration

Edit `.env` file to configure:
- Database connection
- CORS settings
- Redis/Celery settings
- Secret key and debug mode

## Database Models

Currently configured to use SQLite for development. For production, configure PostgreSQL in settings.py.

## Apps Overview

### accounts
- User registration and authentication
- User profiles with role-based access control
- Login attempt tracking

### students
- Student profile management
- Academic history tracking
- Document management
- Resume ATS scoring

### placement
- Placement opportunities
- Student applications
- Multi-round management
- Placement analytics

### training
- Training programs and slots
- Student registration
- Attendance tracking
- Test score management

### events
- Event/seminar management
- Student enrollment
- Event attendance tracking

### communications
- Email notifications
- SMS/WhatsApp alerts
- Notification templates

### analytics
- Placement analytics
- Training analytics
- Attendance reports

## Development Notes

- All endpoints require authentication (except register/login)
- API uses JWT tokens for authentication
- Pagination is enabled with 20 items per page
- Filtering and searching available on list endpoints

## Next Steps

1. Implement models for each app
2. Create serializers for API responses
3. Create viewsets and API views
4. Add proper permissions and authentication
5. Create migration files
6. Set up Celery tasks for async operations
