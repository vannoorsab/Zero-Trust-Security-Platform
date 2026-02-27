# Zero Trust Security Platform - Setup Guide

## Project Structure

```
├── app/                          # Next.js app directory
│   ├── dashboard/               # Admin dashboard
│   │   ├── page.tsx            # Main admin dashboard
│   │   ├── incidents/          # Incidents management
│   │   ├── users/              # User management
│   │   └── user/               # User dashboard
│   ├── login/                  # Login page
│   ├── register/               # Registration page
│   ├── layout.tsx              # Root layout
│   ├── globals.css             # Global styles with cybersecurity theme
│   └── page.tsx                # Home page
├── backend/                      # Python FastAPI backend
│   ├── main.py                 # FastAPI application entry
│   ├── models.py               # Pydantic models and schemas
│   ├── db.py                   # MongoDB connection and initialization
│   ├── utils.py                # Utility functions (auth, hashing, etc)
│   ├── risk_engine.py          # AI anomaly detection with Isolation Forest
│   ├── demo.py                 # Demo simulation system
│   ├── requirements.txt         # Python dependencies
│   ├── Dockerfile              # Docker containerization
│   └── .dockerignore           # Docker ignore rules
├── components/                   # React components
│   ├── DashboardLayout.tsx     # Dashboard wrapper with sidebar
│   ├── ProtectedRoute.tsx      # Auth protection wrapper
│   └── ui/                     # shadcn/ui components
├── hooks/                        # Custom React hooks
│   └── useApi.ts               # API fetch hook with auth
├── lib/                          # Utility libraries
│   ├── auth.ts                 # Authentication helpers
│   └── utils.ts                # Tailwind utilities (cn function)
├── public/                       # Static assets
├── .env.example                # Environment variables template
├── docker-compose.yml          # Local development with Docker
├── cloudbuild.yaml             # GCP Cloud Build configuration
├── cloud-run-config.yaml       # Cloud Run deployment config
├── DEPLOYMENT.md               # Deployment instructions
└── SETUP.md                    # This file

## Prerequisites

### Development Environment
- Node.js 18+ and npm/pnpm
- Python 3.11+
- Docker and Docker Compose (optional, for containerized dev)
- MongoDB Atlas account or local MongoDB 7.0+

### Production Environment
- Google Cloud Project with:
  - Cloud Run enabled
  - Artifact Registry enabled
  - Secret Manager enabled
  - Cloud Build enabled
- MongoDB Atlas cluster

## Local Development Setup

### 1. Frontend Setup (Next.js)

```bash
# Install dependencies
npm install
# or
pnpm install

# Create .env.local
cp .env.example .env.local

# Update NEXT_PUBLIC_API_URL in .env.local to http://localhost:8080

# Run development server
npm run dev
# or
pnpm dev

# Open http://localhost:3000
```

### 2. Backend Setup (Python FastAPI)

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with MongoDB connection
# Update MONGODB_URI with your MongoDB Atlas connection string

# Run development server
uvicorn main:app --reload

# Server runs on http://localhost:8080
# API docs available at http://localhost:8080/docs
```

### 3. MongoDB Setup

#### Option A: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a new project and cluster
3. Create a database user with a strong password
4. Get the connection string: `mongodb+srv://user:password@cluster.mongodb.net/zerotrust`
5. Update `MONGODB_URI` in your environment

#### Option B: Local MongoDB
```bash
# Install MongoDB Community Edition
# https://docs.mongodb.com/manual/installation/

# Start MongoDB service
mongod

# Connection string: mongodb://localhost:27017/zerotrust
```

## Running with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Services:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:8080
# - MongoDB: localhost:27017
# - API Docs: http://localhost:8080/docs

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token

### Users (Admin Only)
- `GET /api/users` - List all users
- `GET /api/users/{user_id}` - Get user details
- `PUT /api/users/{user_id}` - Update user access level
- `DELETE /api/users/{user_id}` - Delete user

### Behavior & Risk
- `POST /api/behavior/log` - Log user behavior
- `GET /api/behavior/{user_id}` - Get user behavior history
- `GET /api/risk/{user_id}` - Get user risk score
- `POST /api/risk/recalculate` - Recalculate all risk scores

### Incidents (Admin Only)
- `GET /api/incidents` - List all incidents
- `GET /api/incidents/{user_id}` - Get user incidents
- `PUT /api/incidents/{incident_id}` - Update incident status

### Demo
- `POST /api/demo/simulate` - Run demo simulation with synthetic data

## Default Credentials for Testing

After running the demo simulation:
- **Admin User**: `admin@example.com` / `password123`
- **Regular User**: `user@example.com` / `password123`

## Feature Overview

### Admin Dashboard
- Real-time risk metrics and charts
- User management with access level control
- Incident tracking and analysis
- Behavioral anomaly history
- Demo simulation trigger

### User Dashboard
- Personal risk score and access level
- Recent activity log
- Behavioral recommendations
- Account settings

### AI Risk Engine
- Isolation Forest algorithm for anomaly detection
- Real-time behavioral analysis
- Risk scoring (0-100)
- Incident auto-generation

### Adaptive Policies
- Dynamic access levels:
  - **Full Access**: Normal behavior
  - **Restricted**: Requires re-authentication
  - **Blocked**: Access denied
- Automatic policy enforcement

## Debugging

### Frontend
- Browser DevTools (F12)
- Check console for errors
- Redux DevTools for state inspection
- Network tab for API calls

### Backend
- Check FastAPI logs: `uvicorn main:app --log-level debug`
- API documentation: http://localhost:8080/docs
- MongoDB Atlas Monitoring

### Database
- MongoDB Compass for local development
- MongoDB Atlas UI for production

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on:
- Deploying to Google Cloud Run
- Setting up Cloud Build pipeline
- Configuring MongoDB Atlas
- Environment variables and secrets
- Monitoring and logging

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED
```
- Ensure MongoDB is running
- Check connection string in .env
- Verify IP whitelist (for Atlas)

### CORS Error
```
Access to XMLHttpRequest blocked by CORS
```
- Update `CORS_ORIGINS` in backend/.env
- Ensure frontend URL is whitelisted

### JWT Token Expired
- Refresh token using POST `/api/auth/refresh`
- Login again to get new token

### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080
# Kill process
kill -9 <PID>
```

## Performance Tips

1. **Frontend**: Use React DevTools Profiler for component optimization
2. **Backend**: Enable query caching with Redis (future enhancement)
3. **Database**: Create indexes for frequently queried fields
4. **API**: Implement pagination for large result sets

## Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Enable HTTPS/TLS
- [ ] Set strong MongoDB passwords
- [ ] Enable IP whitelist in MongoDB Atlas
- [ ] Use environment variables for secrets
- [ ] Enable audit logging
- [ ] Regular security updates
