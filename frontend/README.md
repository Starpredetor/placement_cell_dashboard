# CRM Dashboard Frontend

React-based frontend for the CRM Dashboard.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm start
```

Server will be available at: `http://localhost:3000`

### 3. Build for Production
```bash
npm build
```

## Project Structure

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   └── features/
│   ├── pages/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── students/
│   │   ├── placements/
│   │   ├── training/
│   │   ├── events/
│   │   └── analytics/
│   ├── services/
│   │   └── api.ts
│   ├── hooks/
│   ├── context/
│   ├── styles/
│   ├── App.tsx
│   ├── index.tsx
│   └── index.css
├── package.json
└── README.md
```

## Available Scripts

### Development
```bash
npm start       # Start dev server
npm test        # Run tests
```

### Production
```bash
npm build       # Build for production
npm eject       # Eject from create-react-app (irreversible)
```

## Environment Variables

Create a `.env` file in the frontend directory:

```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_VERSION=v1
```

## Key Features

- **Authentication**: JWT-based login/register
- **Student Management**: Student directory and profiles
- **Placement Operations**: Opportunities, applications, rounds
- **Training Management**: Programs, slots, attendance
- **Event Management**: Events/seminars and enrollment
- **Analytics**: Dashboard with charts and reports
- **Responsive Design**: Mobile-friendly UI with TailwindCSS

## Technologies

- **React 18**: UI framework
- **React Router v6**: Client-side routing
- **React Query**: Server state management
- **Axios**: HTTP client
- **TailwindCSS**: Styling
- **React Hook Form**: Form management
- **Zod**: Schema validation
- **TypeScript**: Type safety

## API Integration

All API calls go through the `/src/services/api.ts` module using Axios. The API is configured to:
- Use JWT tokens from localStorage
- Automatically refresh tokens
- Handle errors gracefully
- Base URL from environment variable

## Development Workflow

1. Create a new branch for features
2. Create components in `/src/components`
3. Create pages in `/src/pages`
4. Use custom hooks for reusable logic
5. Use React Query for data fetching
6. Style with TailwindCSS utility classes

## Deployment

Build files are created in the `build/` directory. These can be served by:
- Nginx
- Apache
- Django static files
- S3 + CloudFront
- Vercel
- Netlify

## Troubleshooting

### Port 3000 already in use
```bash
PORT=3001 npm start
```

### CORS errors
Ensure backend CORS settings include `http://localhost:3000`

### API not responding
Check backend is running on `http://localhost:8000`
