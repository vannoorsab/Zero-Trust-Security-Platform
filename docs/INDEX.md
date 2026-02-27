# Documentation Index

Complete guide to all documentation for the Zero Trust Security Platform.

## Start Here 👇

### For First-Time Setup
1. **[Quick Start Guide](./QUICK_START.md)** (5 minutes)
   - Get the app running locally
   - Test basic functionality
   - Understand project structure

2. **[MongoDB Setup](./MONGODB_SETUP.md)** (If you haven't set up MongoDB yet)
   - Create MongoDB Atlas account
   - Get connection string
   - Configure network access

### For Deployment
3. **[GCP Setup Guide](./GCP_SETUP.md)** (Deploy to production)
   - Create GCP project
   - Deploy backend to Cloud Run
   - Deploy frontend to Vercel
   - Set up monitoring

### For Configuration
4. **[Environment Variables Reference](./ENVIRONMENT_VARIABLES.md)**
   - All available environment variables
   - Local vs production configuration
   - Security best practices

### For Problem Solving
5. **[Troubleshooting & FAQ](./TROUBLESHOOTING.md)**
   - Common errors and fixes
   - Debug mode setup
   - Performance optimization
   - FAQs

## Documentation Structure

```
docs/
├── INDEX.md                    # This file - navigation guide
├── QUICK_START.md             # Get started in 5 minutes
├── MONGODB_SETUP.md           # Configure MongoDB Atlas
├── GCP_SETUP.md               # Deploy to Google Cloud
├── ENVIRONMENT_VARIABLES.md   # Configuration reference
└── TROUBLESHOOTING.md         # Problem-solving & FAQs

root/
├── README.md                  # Project overview
├── SETUP.md                   # Detailed development setup
├── DEPLOYMENT.md              # Advanced deployment guide
├── .env.example               # Environment variables template
├── docker-compose.yml         # Local development containers
└── Makefile                   # Convenient commands
```

## By Use Case

### "I'm new, let me try this"
→ [Quick Start Guide](./QUICK_START.md)

### "I need to set up MongoDB"
→ [MongoDB Setup](./MONGODB_SETUP.md)

### "I want to deploy to production"
→ [GCP Setup Guide](./GCP_SETUP.md)

### "Something isn't working"
→ [Troubleshooting Guide](./TROUBLESHOOTING.md)

### "I want to understand the environment setup"
→ [Environment Variables Reference](./ENVIRONMENT_VARIABLES.md)

### "I need detailed local development setup"
→ [SETUP.md](../SETUP.md)

### "I want to understand the architecture"
→ [README.md](../README.md)

## External Resources

### Services Setup
- **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)** - Free database (required)
- **[Google Cloud Console](https://console.cloud.google.com/)** - Cloud deployment (for production)
- **[Vercel](https://vercel.com/)** - Frontend deployment (recommended)

### Documentation
- **[Next.js Documentation](https://nextjs.org/docs)** - Frontend framework
- **[FastAPI Documentation](https://fastapi.tiangolo.com/)** - Backend framework
- **[MongoDB Documentation](https://docs.mongodb.com/)** - Database docs
- **[GCP Documentation](https://cloud.google.com/docs)** - Cloud platform docs
- **[JWT.io](https://jwt.io)** - Authentication tokens

### Tools
- **[MongoDB Compass](https://www.mongodb.com/products/compass)** - Database GUI
- **[Postman](https://www.postman.com/)** - API testing
- **[Docker Desktop](https://www.docker.com/products/docker-desktop)** - Container management
- **[VS Code](https://code.visualstudio.com/)** - Code editor

## Quick Reference

### Common Commands

**Development:**
```bash
docker-compose up              # Start all services
pnpm dev                       # Start frontend only
python backend/main.py --reload # Start backend only
python backend/scripts/init-mongodb.py  # Initialize DB
```

**Deployment:**
```bash
docker build -t zero-trust-backend ./backend
gcloud run deploy zero-trust-backend --image zero-trust-backend
```

### Important URLs

- **Local Frontend**: http://localhost:3000
- **Local Backend**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **GCP Console**: https://console.cloud.google.com/

### Key Files

- **Frontend config**: `next.config.mjs`, `app/layout.tsx`
- **Backend config**: `backend/main.py`, `backend/.env`
- **Database**: `backend/db.py`, `backend/models.py`
- **ML Engine**: `backend/risk_engine.py`
- **Deployment**: `docker-compose.yml`, `cloudbuild.yaml`

## Architecture Overview

```
┌─────────────────────────────────────┐
│   Next.js Frontend (React)          │
│   - Auth pages                      │
│   - Admin dashboard                 │
│   - User dashboard                  │
└────────────┬────────────────────────┘
             │ REST API (HTTP)
┌────────────▼────────────────────────┐
│   FastAPI Backend (Python)          │
│   - JWT authentication              │
│   - Risk engine (ML)                │
│   - Behavior logging                │
└────────────┬────────────────────────┘
             │ MongoDB Driver
┌────────────▼────────────────────────┐
│   MongoDB Atlas (Cloud Database)    │
│   - Users collection                │
│   - Behavior logs                   │
│   - Incidents                       │
└─────────────────────────────────────┘
```

## Deployment Architecture

```
┌──────────────────────────────────────────┐
│   Vercel (Frontend)                      │
│   - Next.js deployment                   │
│   - Auto-scaling                         │
│   - CDN                                  │
└──────────────────────┬───────────────────┘
                       │
┌──────────────────────▼───────────────────┐
│   GCP Cloud Run (Backend)                │
│   - FastAPI container                    │
│   - Auto-scaling                         │
│   - Cloud Build CI/CD                    │
└──────────────────────┬───────────────────┘
                       │
┌──────────────────────▼───────────────────┐
│   GCP Secret Manager                     │
│   - MongoDB URI                          │
│   - JWT Secret                           │
└──────────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────┐
│   MongoDB Atlas (Database)               │
│   - Cloud database                       │
│   - Automated backups                    │
│   - High availability                    │
└──────────────────────────────────────────┘
```

## Feature Map

### Authentication & Authorization
- JWT-based session management
- User registration and login
- Password hashing with bcrypt
- Protected API routes
- Admin vs. regular user roles

### Behavioral Analysis
- Behavior logging (login, actions, devices)
- Isolation Forest ML algorithm
- Real-time anomaly detection
- Risk score calculation
- Incident generation

### Dashboards
- Admin dashboard with metrics
- User dashboard with personal data
- Incidents list with details
- User management panel
- Interactive charts

### Demo Features
- Synthetic data generation
- Configurable behavior patterns
- Real-time risk updates
- Incident simulation

## Performance Tips

1. **Database Optimization**: Indexes are created by init script
2. **Frontend Caching**: Next.js built-in optimization
3. **API Response**: FastAPI efficiently handles requests
4. **ML Processing**: Isolation Forest is fast for typical datasets

## Security Features

✅ Password hashing (bcrypt)
✅ JWT token-based authentication
✅ CORS protection
✅ SQL injection prevention (MongoDB)
✅ HTTPS ready (Cloud Run)
✅ Secrets management (Cloud Secret Manager)
✅ Row-level access control
✅ Audit logging

## Roadmap & Future Enhancements

- [ ] Password reset functionality
- [ ] Two-factor authentication (2FA)
- [ ] User session management
- [ ] Advanced incident filtering
- [ ] Custom risk rules engine
- [ ] Integration with SIEM tools
- [ ] Mobile app support
- [ ] Real-time WebSocket notifications

## Getting Help

### Before asking for help:
1. Check [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. Review [Environment Variables](./ENVIRONMENT_VARIABLES.md)
3. Check backend logs: `docker-compose logs -f backend`
4. Check frontend console: Press F12 in browser

### If still stuck:
- Review API documentation: http://localhost:8000/docs
- Check MongoDB connection: `python -c "from db import get_db; print(get_db().name)"`
- Look for error messages in logs

## Feedback & Contributions

Found a bug? Have a feature request?
1. Check existing documentation
2. Review troubleshooting guide
3. Open an issue with:
   - Error message
   - Steps to reproduce
   - Environment details (Python/Node versions, OS)

---

**Last Updated**: 2026-02-27  
**Status**: Production Ready  
**Support**: See troubleshooting guide
