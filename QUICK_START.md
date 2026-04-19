# Quick Start - CRM Dashboard

## 🚀 Get Running in 2 Minutes

### Terminal 1: Start Backend

```bash
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver
```

**Result**: Backend running at `http://localhost:8000`

### Terminal 2: Start Frontend

```bash
cd frontend
npm start
```

**Result**: Frontend running at `http://localhost:3000`

---

## 📍 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Main application |
| Backend Admin | http://localhost:8000/admin | Django admin panel |
| API Docs | http://localhost:8000/api/docs | Swagger documentation |
| API Schema | http://localhost:8000/api/schema | OpenAPI schema |

---

## 🔑 Default Admin Credentials

**Create superuser first:**
```bash
cd backend
python manage.py createsuperuser
```

Follow the prompts to set username and password.

---

## 📁 Project Structure

```
placement_cell_dashboard/
├── backend/              # Django REST Framework
│   ├── accounts/        # User authentication
│   ├── students/        # Student management
│   ├── placement/       # Placement module
│   ├── training/        # Training module
│   ├── events/          # Events module
│   ├── communications/  # Notifications
│   ├── analytics/       # Analytics
│   └── common/          # Shared utilities
├── frontend/            # React SPA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/    # API calls
│   │   └── context/     # State management
│   └── public/
└── docs/               # Documentation
```

---

## 🛠️ Common Commands

### Backend

```bash
# Start development server
cd backend
python manage.py runserver

# Create migrations for model changes
python manage.py makemigrations

# Apply migrations to database
python manage.py migrate

# Run tests
python manage.py test

# Access Django shell
python manage.py shell

# Create admin user
python manage.py createsuperuser
```

### Frontend

```bash
# Start development server
cd frontend
npm start

# Run tests
npm test

# Build for production
npm build

# Install new package
npm install <package-name>
```

---

## 📝 Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Backend Development**
   - Edit models in `apps/*/models.py`
   - Create migrations: `python manage.py makemigrations`
   - Apply migrations: `python manage.py migrate`
   - Create serializers in `apps/*/serializers.py`
   - Create views in `apps/*/views.py`
   - Configure URLs in `apps/*/urls.py`

3. **Frontend Development**
   - Create components in `src/components/`
   - Create pages in `src/pages/`
   - Use API from `src/services/api.ts`
   - Style with TailwindCSS

4. **Test & Commit**
   ```bash
   git commit -m "Feature: description"
   git push origin feature/your-feature-name
   ```

---

## 🐛 Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
python manage.py runserver 8001
```

**Import errors after adding packages:**
```bash
pip install -r requirements.txt --force-reinstall
```

**Database errors:**
```bash
# Reset (development only)
rm backend/db.sqlite3
python manage.py migrate
```

### Frontend Issues

**Port 3000 already in use:**
```bash
PORT=3001 npm start
```

**Dependencies not installing:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**CORS errors:**
- Check backend is running on `http://localhost:8000`
- Check `.env` file has `REACT_APP_API_URL=http://localhost:8000`

---

## 📚 Documentation

- **Main README**: [README.md](./README.md)
- **Setup Guide**: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Setup Complete**: [SETUP_COMPLETE.md](./SETUP_COMPLETE.md)
- **Backend Details**: [backend/README.md](./backend/README.md)
- **Frontend Details**: [frontend/README.md](./frontend/README.md)
- **Master Plan**: [CRM_MIGRATION_MASTER_PLAN.md](./CRM_MIGRATION_MASTER_PLAN.md)

---

## ✅ What's Ready

- ✅ Django project with 8 apps
- ✅ React frontend with routing
- ✅ API layer with JWT authentication
- ✅ Database with SQLite (dev) / PostgreSQL ready
- ✅ API documentation
- ✅ Docker setup
- ✅ Static file serving
- ✅ CORS enabled

---

## 🎯 Next Steps

1. **Read the docs**
   - Review [SETUP_GUIDE.md](./SETUP_GUIDE.md)
   - Review [CRM_MIGRATION_MASTER_PLAN.md](./CRM_MIGRATION_MASTER_PLAN.md)

2. **Start the app**
   - Run backend: `python manage.py runserver`
   - Run frontend: `npm start`

3. **Create first model**
   - Define model in an app's `models.py`
   - Run `makemigrations` and `migrate`

4. **Create first API**
   - Create serializer
   - Create viewset
   - Register in URLs
   - Test with Swagger at `/api/docs/`

5. **Build first page**
   - Create component in `src/components/`
   - Add to page in `src/pages/`
   - Fetch data using `src/services/api.ts`
   - Test in browser

---

## 💡 Tips

- Use Django admin panel (`/admin/`) for quick data management
- Use Swagger API docs (`/api/docs/`) to test endpoints
- Keep models simple, business logic in serializers/views
- Use React Query for data fetching
- Use TailwindCSS for styling

---

**Ready to build? Start with `python manage.py runserver` and `npm start`!** 🚀
