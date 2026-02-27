# Quick Start Guide

Get the Zero Trust Security Platform running in 5 minutes.

## Prerequisites
- Node.js 18+ and pnpm
- Python 3.9+
- Docker & Docker Compose (optional, for containerized setup)
- MongoDB Atlas account ([create free tier](https://www.mongodb.com/cloud/atlas))

## Step 1: Get MongoDB Connection String (5 minutes)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a cluster (choose free M0 tier)
4. Add your IP to network access
5. Create a database user
6. Copy your connection string

Full instructions: [MongoDB Setup Guide](./MONGODB_SETUP.md)

## Step 2: Clone and Setup Project

```bash
# Clone the repository
git clone <your-repo> zero-trust-security
cd zero-trust-security

# Create environment file
cp .env.example .env.local

# Edit .env.local with your MongoDB connection string
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
nano .env.local  # or use your editor
```

## Step 3: Install Dependencies

```bash
# Frontend dependencies
pnpm install

# Backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

## Step 4: Initialize MongoDB

```bash
cd backend
python scripts/init-mongodb.py
cd ..
```

Expected output:
```
[✓] Successfully connected to MongoDB
[*] Setting up 'users' collection...
[✓] Initialization Complete!
```

## Step 5: Run Development Servers

### Option A: Using Docker Compose (Recommended)
```bash
docker-compose up
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- MongoDB: localhost:27017 (via compose)

### Option B: Manual Startup

Terminal 1 - Backend:
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Terminal 2 - Frontend:
```bash
pnpm dev
```

Access:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs (FastAPI Swagger UI)

## Step 6: Test the Application

### Create an Account
1. Go to http://localhost:3000
2. Click "Sign Up"
3. Enter email: `test@example.com`
4. Enter password: `TestPassword123!`
5. Click "Sign Up"

### Log In
1. Click "Log In"
2. Use the credentials from signup
3. You'll be redirected to the admin dashboard

### Try the Demo
1. In the admin dashboard, click "Run Demo Simulation"
2. Watch synthetic behaviors get created and analyzed
3. See risk scores update in real-time
4. Check the Incidents page for detected anomalies

## Deployed URLs

Once deployed to production, update:

```env
# For local development
NEXT_PUBLIC_API_URL=http://localhost:8000

# For production (Cloud Run)
NEXT_PUBLIC_API_URL=https://your-backend-url.run.app
```

## Project Structure

```
.
├── app/                      # Next.js frontend
│   ├── login/               # Authentication pages
│   ├── register/
│   └── dashboard/           # Admin dashboards
├── backend/                 # Python FastAPI backend
│   ├── main.py             # FastAPI app
│   ├── models.py           # Data models
│   ├── risk_engine.py      # ML anomaly detection
│   └── requirements.txt     # Python dependencies
├── components/             # React components
├── docs/                   # Documentation
│   ├── MONGODB_SETUP.md   # MongoDB Atlas setup
│   ├── GCP_SETUP.md       # Google Cloud deployment
│   └── QUICK_START.md     # This file
└── docker-compose.yml      # Multi-container setup
```

## Common Commands

```bash
# Start all services
docker-compose up

# Restart services
docker-compose restart

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Reset database
RESET_DB=true python backend/scripts/init-mongodb.py

# Install new Python packages
pip install <package> -r backend/requirements.txt

# Update frontend dependencies
pnpm add <package>
```

## API Examples

### Register
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Get User Profile
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/api/users/me
```

### Run Demo Simulation
```bash
curl -X POST http://localhost:8000/api/demo/simulate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## Troubleshooting

### MongoDB Connection Error
```
ConnectionFailure: Connection refused
```
**Solution:**
1. Check MongoDB Atlas is running
2. Verify connection string in `.env.local`
3. Check network access whitelist in MongoDB Atlas
4. Test connection: `python -c "from db import get_db; get_db()"`

### Port Already in Use
```
OSError: [Errno 48] Address already in use
```
**Solution:**
```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Use different port
uvicorn main:app --port 8001
```

### Frontend Can't Connect to Backend
**Solution:**
1. Verify backend is running: `curl http://localhost:8000/api/health`
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Restart frontend: `pnpm dev`

### Python Dependency Issues
**Solution:**
```bash
# Create fresh virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Next Steps

1. **Customize**: Edit the risk engine thresholds in `backend/risk_engine.py`
2. **Deploy**: Follow [GCP Setup Guide](./GCP_SETUP.md) for production deployment
3. **Monitor**: Set up alerts in Cloud Console
4. **Integrate**: Add your own data sources to the behavior logging system

## Support Resources

- **FastAPI Docs**: http://localhost:8000/docs
- **Next.js Docs**: https://nextjs.org/docs
- **MongoDB Docs**: https://docs.mongodb.com
- **GCP Docs**: https://cloud.google.com/docs
- **Project README**: See [README.md](../README.md)

## What's Next?

Once you're running locally:

1. **Test the features**: Try anomaly detection with the demo simulator
2. **Connect your data**: Integrate your authentication logs
3. **Tune the engine**: Adjust risk thresholds based on your needs
4. **Deploy to production**: Use the GCP setup guide
5. **Monitor and improve**: Use the dashboards to refine policies

Happy securing! 🔐
