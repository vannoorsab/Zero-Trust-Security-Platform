# Zero Trust Security Platform

AI-powered behavioral anomaly detection and adaptive access control for enterprise security.

## Overview

Zero Trust is a comprehensive security platform that implements the zero trust model - never trust, always verify. Using machine learning-powered behavioral analysis, it detects suspicious activities in real-time and enforces dynamic access policies.

## Key Features

✨ **Real-Time Anomaly Detection**
- Isolation Forest ML algorithm analyzing user behavior
- Continuous monitoring of login patterns, device information, and activity
- Instant detection of suspicious behavior

🛡️ **Adaptive Access Control**
- Dynamic access levels (Full Access, Restricted, Blocked)
- Automatic policy enforcement based on risk scores
- Re-authentication requirements for high-risk activities

📊 **Advanced Analytics**
- Real-time risk dashboards with interactive charts
- Incident tracking and investigation
- Behavioral trend analysis
- AI-generated incident explanations

👥 **Enterprise Management**
- Admin dashboard for organizational oversight
- User management and access control
- Comprehensive incident logs
- Audit trails

🎯 **Demo Simulation**
- Generate synthetic behavioral data
- Test system with realistic scenarios
- Educational demonstrations

## Architecture

### Frontend (Next.js + React)
- Modern React 19 with TypeScript
- Dark cybersecurity-themed UI
- Responsive design for all devices
- Protected routes with JWT authentication
- Real-time charts with Recharts

### Backend (Python + FastAPI)
- High-performance ASGI server
- JWT-based authentication
- RESTful API with automatic OpenAPI docs
- MongoDB integration
- ML-powered risk engine

### Database (MongoDB)
- User profiles and credentials
- Behavior logs (login attempts, actions, devices)
- Incident records with explanations
- Indexed for performance

### Deployment
- Docker containerization
- Google Cloud Run autoscaling
- Cloud Build CI/CD pipeline
- Secrets management

## Quick Start

⚠️ **IMPORTANT: You Need Credentials First!**

Before you can run this app, you need:
1. **MongoDB Atlas** (free tier) - for the database
2. **Google Cloud Account** (free credits) - for deployment (optional for local testing)

📖 **[GETTING_CREDENTIALS.md](./docs/GETTING_CREDENTIALS.md)** - Step-by-step guide to get MongoDB and GCP credentials

### Prerequisites
- Node.js 18+ / pnpm
- Python 3.9+
- MongoDB Atlas account ([free tier](https://www.mongodb.com/cloud/atlas)) - **REQUIRED**
- Google Cloud account ([free $300 credits](https://cloud.google.com/free)) - Optional (for GCP deployment)
- Docker & Docker Compose (optional)

### Step-by-Step Setup

**Step 1: Get Credentials** (15 minutes)
```bash
# Follow this guide to get MongoDB Atlas credentials:
# docs/GETTING_CREDENTIALS.md
# OR visit: https://www.mongodb.com/cloud/atlas
```

**Step 2: Configure Your Project** (5 minutes)
```bash
git clone <repo-url> zero-trust
cd zero-trust
cp .env.example .env.local

# Edit .env.local and add:
# - MONGODB_URI (from MongoDB Atlas)
# - JWT_SECRET (run: openssl rand -hex 32)
# - NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Step 3: Verify Setup** (2 minutes)
```bash
# Verify all credentials and dependencies are configured
python scripts/verify-setup.py
# Look for: ✓ PASS for all checks
```

**Step 4: Install & Initialize** (5 minutes)
```bash
# Install dependencies
pnpm install
cd backend && pip install -r requirements.txt && cd ..

# Initialize database
python backend/scripts/init-mongodb.py
```

**Step 5: Start the Application** (1 minute)
```bash
# Terminal 1: Start backend
cd backend
python -m uvicorn main:app --reload

# Terminal 2: Start frontend
pnpm dev

# Open in browser: http://localhost:3000
```

**Access the Application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Test the Platform
1. Sign up at http://localhost:3000
2. Log in with your credentials
3. Click "Run Demo Simulation" to generate test data
4. View detected incidents on the Incidents page

## Documentation

### Getting Started (Start Here!)
| Guide | Purpose |
|-------|---------|
| **[GETTING_CREDENTIALS.md](./docs/GETTING_CREDENTIALS.md)** | Get MongoDB & GCP credentials (step-by-step) |
| **[QUICK_START.md](./docs/QUICK_START.md)** | Fast setup guide |
| **[verify-setup.py](./scripts/verify-setup.py)** | Verify credentials are working |

### Configuration & Setup
| Guide | Purpose |
|-------|---------|
| **[ENVIRONMENT_VARIABLES.md](./docs/ENVIRONMENT_VARIABLES.md)** | All environment variables explained |
| **[SETUP.md](./SETUP.md)** | Detailed local development setup |
| **[MONGODB_SETUP.md](./docs/MONGODB_SETUP.md)** | MongoDB Atlas configuration |

### Deployment & Troubleshooting
| Guide | Purpose |
|-------|---------|
| **[GCP_SETUP.md](./docs/GCP_SETUP.md)** | Deploy to Google Cloud |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Advanced deployment options |
| **[TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)** | Common issues & solutions |
| **[RESOURCES_AND_LINKS.md](./docs/RESOURCES_AND_LINKS.md)** | Useful links & references |

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── dashboard/         # Admin dashboard
│   ├── login/            # Authentication pages
│   └── globals.css       # Dark theme styles
├── backend/              # FastAPI backend
│   ├── main.py          # API endpoints
│   ├── models.py        # Data models
│   ├── db.py            # MongoDB connection
│   ├── risk_engine.py   # ML anomaly detection
│   └── Dockerfile       # Container image
├── components/           # React components
├── hooks/               # Custom hooks
└── lib/                 # Utilities
```

## API Documentation

Interactive API documentation available at `http://localhost:8080/docs`

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login and get JWT
- `POST /api/auth/refresh` - Refresh token

### Users (Admin)
- `GET /api/users` - List all users
- `PUT /api/users/{id}` - Update user access level
- `DELETE /api/users/{id}` - Remove user

### Risk & Behavior
- `POST /api/behavior/log` - Log user action
- `GET /api/risk/{user_id}` - Get risk score
- `POST /api/risk/recalculate` - Update all scores

### Incidents (Admin)
- `GET /api/incidents` - List incidents
- `PUT /api/incidents/{id}` - Update status

### Demo
- `POST /api/demo/simulate` - Generate test data

## Risk Engine

The platform uses Isolation Forest algorithm to detect anomalies:

```
Risk Score Calculation:
1. Extract behavioral features (login patterns, device info, location)
2. Train Isolation Forest model on baseline data
3. Score new behaviors (0-1, lower = more anomalous)
4. Calculate final risk score (0-100)
5. Auto-generate incident if risk > threshold
```

## Access Level Policy

| Access Level | Behavior | Requirement |
|---|---|---|
| **Full Access** | Normal behavior | None |
| **Restricted** | Slightly anomalous | Re-authentication |
| **Blocked** | Highly anomalous | Contact admin |

## Deployment

### Deploy to Google Cloud Run

```bash
# 1. Setup GCP project with Cloud Run, Artifact Registry, Secret Manager

# 2. Create secrets
gcloud secrets create mongodb-uri --data-file=- <<< "your-connection-string"
gcloud secrets create jwt-secret --data-file=- <<< "your-secret-key"

# 3. Deploy
gcloud builds submit --config=cloudbuild.yaml

# 4. Set up frontend (Vercel recommended)
# - Connect GitHub repo
# - Set NEXT_PUBLIC_API_URL environment variable
# - Deploy
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## Development Commands

```bash
# Frontend
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint

# Backend
cd backend
uvicorn main:app --reload        # Dev server
python -m pytest tests/           # Run tests
pylint *.py                       # Lint code

# Docker
docker-compose up --build         # Start all services
docker-compose logs -f            # View logs
docker-compose down               # Stop services

# Utilities
make help            # Show available commands
make docker-dev      # Run with Docker Compose
make deploy          # Deploy to GCP
```

## Monitoring & Logging

### Development
- Browser DevTools (F12) for frontend
- FastAPI docs at `/docs`
- MongoDB Compass for database

### Production
- Cloud Logging for application logs
- Cloud Monitoring for metrics
- Cloud Trace for performance analysis

## Security Features

- ✅ JWT authentication with refresh tokens
- ✅ Password hashing with bcrypt
- ✅ CORS protection
- ✅ SQL injection prevention (MongoDB)
- ✅ Environment-based secrets
- ✅ HTTPS/TLS ready
- ✅ Audit logging
- ✅ Role-based access control

## Performance

- Frontend: ~2.5MB optimized bundle
- Backend: <100ms average API response
- Database: Indexed queries for fast lookups
- Deployment: Auto-scaling Cloud Run

## Troubleshooting

### MongoDB connection error
```
Solution: Check MONGODB_URI in .env.local
For Atlas: Ensure IP is whitelisted
```

### CORS errors
```
Solution: Update CORS_ORIGINS in backend/.env
```

### Port conflicts
```
kill -9 $(lsof -t -i:8080)  # Free port 8080
kill -9 $(lsof -t -i:3000)  # Free port 3000
```

## Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Make changes and commit
3. Push to branch
4. Create Pull Request

## License

MIT License - feel free to use in your projects

## Support

For issues or questions:
1. Check [SETUP.md](./SETUP.md) for detailed guides
2. Review [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
3. Check FastAPI docs at `/docs`
4. Open an issue on GitHub

## Roadmap

- [ ] Redis caching for performance
- [ ] GraphQL API option
- [ ] Mobile app (React Native)
- [ ] Advanced threat intelligence
- [ ] Machine learning model versioning
- [ ] Custom rule engine
- [ ] Integration with SIEM systems
- [ ] Multi-tenancy support

## Technology Stack

**Frontend:**
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Recharts
- shadcn/ui

**Backend:**
- Python 3.11
- FastAPI
- MongoDB
- Scikit-learn
- JWT
- Uvicorn

**Deployment:**
- Docker
- Google Cloud Run
- Artifact Registry
- Cloud Build
- Secret Manager

---

**Built with security in mind. Zero Trust. Always Verify.** 🔐
