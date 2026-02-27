# 🚀 START HERE - Zero Trust Security Platform

Welcome! Before running this application, you **MUST** get credentials from MongoDB and Google Cloud.

This file is your complete roadmap from zero to running the app. Follow the steps in order.

---

## The 30-Minute Journey

### Timeline Estimate:
- **MongoDB Setup**: 10 minutes
- **Environment Configuration**: 5 minutes
- **Verification**: 2 minutes
- **First Run**: 3 minutes
- **Testing**: 10 minutes
- **Total**: ~30 minutes

---

## REQUIRED: Get MongoDB Atlas Credentials

### Why?
This app stores everything in MongoDB - user accounts, behavior logs, incidents. You need a database to run it.

### How? (10 minutes)
📖 **Follow:** [docs/GETTING_CREDENTIALS.md](./docs/GETTING_CREDENTIALS.md) → **Part 1: MongoDB Atlas**

At the end, you'll have a connection string that looks like:
```
mongodb+srv://zero_trust_admin:MySecurePassword123@zero-trust-dev.xxxxx.mongodb.net/
```

**Save this!** You'll need it in the next step.

---

## OPTIONAL: Get Google Cloud Credentials

### Why?
If you want to deploy to production on Google Cloud. You can skip this for local testing.

### How? (5 minutes)
📖 **Follow:** [docs/GETTING_CREDENTIALS.md](./docs/GETTING_CREDENTIALS.md) → **Part 2: Google Cloud**

---

## Step 1: Create Environment Configuration

### What is .env.local?
A secret file that stores your credentials. Git ignores it (never uploaded to GitHub).

### Create it:
```bash
# Copy the template
cp .env.example .env.local

# Edit .env.local and add your credentials
# (Use your favorite text editor)
```

### What to add:
```env
# REQUIRED - from MongoDB Atlas (from Part 1 above)
MONGODB_URI=mongodb+srv://zero_trust_admin:YourPasswordHere@zero-trust-dev.xxxxx.mongodb.net/

# REQUIRED - generate with: openssl rand -hex 32
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2

# REQUIRED - where is backend running?
NEXT_PUBLIC_API_URL=http://localhost:8000

# OPTIONAL - only if you did Google Cloud setup
GCP_PROJECT_ID=your-gcp-project-id
```

---

## Step 2: Verify Everything Works

### Run the verification script:
```bash
python scripts/verify-setup.py
```

### What to look for:
All checks should show ✓ PASS

Example output:
```
PASS - Environment File
PASS - Environment Variables
PASS - MongoDB Connection
PASS - Python Packages
PASS - Node.js Packages
PASS - Backend Structure
PASS - Frontend Structure

Result: 7/7 checks passed
```

### If something failed:
See the error message and check [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)

---

## Step 3: Install Dependencies

### Install frontend packages:
```bash
pnpm install
```

### Install backend packages:
```bash
cd backend
pip install -r requirements.txt
cd ..
```

### Initialize database:
```bash
python backend/scripts/init-mongodb.py
```

This creates collections in MongoDB and sets up indexes.

---

## Step 4: Start the Application

### Terminal 1 - Start Backend:
```bash
cd backend
python -m uvicorn main:app --reload
```

You should see:
```
Uvicorn running on http://127.0.0.1:8000
```

### Terminal 2 - Start Frontend:
```bash
pnpm dev
```

You should see:
```
▲ Next.js
◦ http://localhost:3000
```

---

## Step 5: Test It Works

### Open in browser:
Visit: **http://localhost:3000**

You should see the login page.

### Create an account:
1. Click "Sign Up"
2. Fill in:
   - Name: Any name
   - Email: Any email (e.g., test@example.com)
   - Password: Any password (8+ chars)
3. Click "Sign Up"
4. You'll be redirected to login
5. Log in with your credentials

### Test the platform:
1. You should see the user dashboard
2. Click **"Run Demo Simulation"**
3. Wait 5 seconds
4. You should see incidents detected
5. Click **"View Incidents"** to see them

### Success!
If you got this far, everything is working! 🎉

---

## What's Next?

### Explore the app:
- **Admin Dashboard** - See all users and their risk scores
- **Incidents Page** - View detected anomalies
- **User Dashboard** - See your personal risk level
- **Demo Simulation** - Generate test data to see the system in action

### Deploy to production:
See [docs/GCP_SETUP.md](./docs/GCP_SETUP.md) when ready

### Understand the system:
- [README.md](./README.md) - Project overview
- [SETUP.md](./SETUP.md) - Detailed setup guide
- [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) - Common issues

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `python scripts/verify-setup.py` | Check everything is configured |
| `cd backend && python -m uvicorn main:app --reload` | Start backend |
| `pnpm dev` | Start frontend |
| `python backend/scripts/init-mongodb.py` | Initialize database |
| `docker-compose up` | Run with Docker (all services) |
| `curl http://localhost:8000/docs` | View API documentation |

---

## Troubleshooting

### "net::ERR_CONNECTION_REFUSED"
Backend isn't running. Did you start it in Terminal 1?

### "MongoDB connection failed"
Check your MONGODB_URI in .env.local is correct

### "Port 3000 already in use"
Another app is using port 3000. Stop it or use `pnpm dev -- --port 3001`

### "Port 8000 already in use"
Another app is using port 8000. Use `uvicorn main:app --port 8001`

See full troubleshooting: [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)

---

## File Structure Overview

```
zero-trust-security/
├── START_HERE.md                 ← You are here
├── README.md                     ← Project overview
├── .env.example                  ← Copy to .env.local
├── .env.local                    ← Your secrets (git ignored)
│
├── frontend/
│   ├── app/                      ← Next.js pages
│   │   ├── login/
│   │   ├── register/
│   │   └── dashboard/
│   └── components/               ← React components
│
├── backend/
│   ├── main.py                   ← FastAPI server
│   ├── models.py                 ← Database models
│   ├── db.py                     ← MongoDB connection
│   ├── risk_engine.py            ← ML anomaly detection
│   └── requirements.txt           ← Python packages
│
└── docs/
    ├── GETTING_CREDENTIALS.md    ← Get MongoDB/GCP credentials
    ├── QUICK_START.md            ← Quick setup
    ├── TROUBLESHOOTING.md        ← Fix problems
    └── ...
```

---

## Support

### Documentation
- [GETTING_CREDENTIALS.md](./docs/GETTING_CREDENTIALS.md) - Get credentials
- [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) - Common issues
- [docs/RESOURCES_AND_LINKS.md](./docs/RESOURCES_AND_LINKS.md) - Useful links

### External Resources
- MongoDB Help: https://docs.mongodb.com/
- Next.js Docs: https://nextjs.org/docs
- FastAPI Docs: https://fastapi.tiangolo.com
- Google Cloud: https://cloud.google.com/docs

---

## Summary

You're now ready! Here's what you just did:

✓ Got MongoDB credentials  
✓ Created .env.local with credentials  
✓ Verified everything works  
✓ Installed dependencies  
✓ Started backend and frontend  
✓ Created your first account  
✓ Ran the demo simulation  

**Welcome to Zero Trust Security Platform! 🎉**

Next step: Explore the features and then deploy when ready.

---

**Need help? Read [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) or check [docs/RESOURCES_AND_LINKS.md](./docs/RESOURCES_AND_LINKS.md)**
