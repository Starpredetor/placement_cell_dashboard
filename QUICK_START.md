# Quick Start - CRM Dashboard

## 🚀 Get Running in 2 Minutes

### Terminal 1: Start Backend

```bash
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
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
| Backend Health | http://localhost:8000/health | API status endpoint |
| API Docs | http://localhost:8000/api/docs | Swagger documentation |
| API Schema | http://localhost:8000/api/schema | OpenAPI schema |

---

## 🔑 Default Demo Credentials

The FastAPI scaffold ships with in-memory demo users:

- `admin@college.edu / admin1234`
- `student@college.edu / student1234`
- `tpo@college.edu / tpo12345`

---

## 📁 Project Structure

```
placement_cell_dashboard/
├── backend/              # FastAPI
│   ├── app/
│   │   ├── api/v1/      # Endpoint routers
│   │   ├── db/          # In-memory data store
│   │   └── schemas/     # Pydantic schemas
│   └── requirements.txt
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
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest
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
   - Define schemas in `app/schemas/`
   - Add endpoints in `app/api/v1/`
   - Add route dependencies in `app/api/deps.py`
   - Register routers in `app/api/router.py`

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
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

**Import errors after adding packages:**
```bash
pip install -r requirements.txt --force-reinstall
```

**Backend import errors after adding packages:**
```bash
pip install -r requirements.txt --force-reinstall
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

- ✅ FastAPI scaffold with versioned routers
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
   - Run backend: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
   - Run frontend: `npm start`

3. **Create first model**
   - Define schema in `app/schemas/`
   - Persist data in a real DB layer (next step)

4. **Create first API**
   - Create a router module
   - Add input/output schema
   - Register router in `app/api/router.py`
   - Test with Swagger at `/api/docs/`

5. **Build first page**
   - Create component in `src/components/`
   - Add to page in `src/pages/`
   - Fetch data using `src/services/api.ts`
   - Test in browser

---

## 💡 Tips

- Use Swagger API docs (`/api/docs/`) to test endpoints
- Keep schemas simple and move business logic into services/dependencies
- Use React Query for data fetching
- Use TailwindCSS for styling

---

**Ready to build? Start with `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` and `npm start`!** 🚀
