# Setup Checklist - Zero Trust Security Platform

Use this checklist to track your setup progress.

## Pre-Setup (Before You Start)

- [ ] You have a MongoDB Atlas account (or will create one)
- [ ] You have Node.js 18+ installed
- [ ] You have Python 3.9+ installed
- [ ] You have a text editor (VS Code, Sublime, etc.)
- [ ] You have ~30 minutes to complete setup

## Phase 1: Get Credentials (10 minutes)

### MongoDB Atlas
- [ ] Read: [docs/GETTING_CREDENTIALS.md](./docs/GETTING_CREDENTIALS.md) Part 1
- [ ] Create MongoDB Atlas account: https://www.mongodb.com/cloud/atlas
- [ ] Create project: `zero-trust-dev`
- [ ] Create cluster (M0 Sandbox - free tier)
- [ ] Set up network access (Allow your IP or 0.0.0.0/0)
- [ ] Create database user: `zero_trust_admin`
- [ ] Get connection string from MongoDB Atlas
- [ ] Saved connection string: `mongodb+srv://zero_trust_admin:PASSWORD@...`

### Google Cloud (Optional - for production deployment)
- [ ] Read: [docs/GETTING_CREDENTIALS.md](./docs/GETTING_CREDENTIALS.md) Part 2
- [ ] Create Google Cloud account: https://console.cloud.google.com
- [ ] Create project: `Zero Trust Security`
- [ ] Enable Cloud Run API
- [ ] Enable Cloud Build API
- [ ] Create service account: `zero-trust-backend`
- [ ] Download service account JSON key
- [ ] Saved GCP project ID: `_________________`

## Phase 2: Configure Project (5 minutes)

- [ ] Cloned repository to your computer
- [ ] Navigated to project directory: `cd zero-trust-security`
- [ ] Copied environment template: `cp .env.example .env.local`
- [ ] Opened .env.local in text editor
- [ ] Generated JWT secret: `openssl rand -hex 32`
- [ ] Added MONGODB_URI to .env.local
- [ ] Added JWT_SECRET to .env.local
- [ ] Set NEXT_PUBLIC_API_URL=http://localhost:8000
- [ ] (Optional) Added GCP credentials if deploying to Google Cloud
- [ ] Saved .env.local file

## Phase 3: Verify Setup (2 minutes)

- [ ] Ran verification script: `python scripts/verify-setup.py`
- [ ] All 7 checks passed: ✓
  - [ ] Environment File
  - [ ] Environment Variables
  - [ ] MongoDB Connection
  - [ ] Python Packages
  - [ ] Node.js Packages
  - [ ] Backend Structure
  - [ ] Frontend Structure

If any checks failed:
- [ ] Reviewed error messages
- [ ] Checked [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
- [ ] Fixed the issue
- [ ] Ran verification script again

## Phase 4: Install Dependencies (5 minutes)

### Frontend Dependencies
- [ ] Ran: `pnpm install`
- [ ] Completed without errors

### Backend Dependencies
- [ ] Navigated to backend: `cd backend`
- [ ] Ran: `pip install -r requirements.txt`
- [ ] Returned to root: `cd ..`
- [ ] Completed without errors

### Database Initialization
- [ ] Ran: `python backend/scripts/init-mongodb.py`
- [ ] Database collections created in MongoDB Atlas
- [ ] No connection errors

## Phase 5: Start Services (3 minutes)

### Terminal 1 - Backend
- [ ] Opened new terminal/tab
- [ ] Navigated to backend: `cd backend`
- [ ] Started backend: `python -m uvicorn main:app --reload`
- [ ] Server is running: `Uvicorn running on http://127.0.0.1:8000`
- [ ] API docs accessible: http://localhost:8000/docs

### Terminal 2 - Frontend
- [ ] Opened another new terminal/tab
- [ ] In project root (NOT backend directory)
- [ ] Started frontend: `pnpm dev`
- [ ] Server is running: `http://localhost:3000`
- [ ] No errors in terminal

## Phase 6: First Test (3 minutes)

- [ ] Opened browser to: http://localhost:3000
- [ ] Login page loaded without errors
- [ ] Clicked "Sign Up"
- [ ] Filled in registration form:
  - [ ] Name: `Test User`
  - [ ] Email: `test@example.com`
  - [ ] Password: `TestPassword123!`
  - [ ] Confirmed password
- [ ] Clicked "Sign Up"
- [ ] Redirected to login page
- [ ] Logged in with credentials
- [ ] Landed on user dashboard

## Phase 7: Demo Test (5 minutes)

- [ ] On user dashboard, clicked: **"Run Demo Simulation"**
- [ ] Button showed loading state
- [ ] Waited ~5 seconds for simulation to complete
- [ ] Clicked: **"View Incidents"** or navigated to incidents page
- [ ] Saw simulated incidents with:
  - [ ] Risk score
  - [ ] Timestamp
  - [ ] Behavior description
  - [ ] Explanation of anomaly

## Phase 8: Explore Features (Optional)

Admin Dashboard:
- [ ] Navigated to admin dashboard
- [ ] Saw user risk metrics
- [ ] Viewed user risk table
- [ ] Viewed risk score chart
- [ ] Viewed incidents chart

User Management:
- [ ] Clicked "Users" in navigation
- [ ] Saw list of all users
- [ ] Viewed risk levels
- [ ] Viewed access status

## Success Verification

If all boxes are checked, you have successfully:

✓ Set up MongoDB Atlas database  
✓ Configured environment variables  
✓ Verified all dependencies  
✓ Installed packages  
✓ Started backend and frontend  
✓ Created user account  
✓ Ran demo simulation  
✓ Explored the platform  

## Troubleshooting

If something failed:

1. Read the error message carefully
2. Check [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) for solutions
3. Verify [docs/GETTING_CREDENTIALS.md](./docs/GETTING_CREDENTIALS.md) for credential setup
4. Run verification script again: `python scripts/verify-setup.py`
5. Check log files:
   - Backend logs: Terminal showing FastAPI
   - Frontend logs: Terminal showing Next.js
   - Browser console: Press F12 in browser

## Common Issues & Quick Fixes

### "net::ERR_CONNECTION_REFUSED"
- [ ] Backend is running? (See Terminal 1 logs)
- [ ] Is it on port 8000? (Check NEXT_PUBLIC_API_URL in .env.local)

### "MongoDB connection failed"
- [ ] MongoDB connection string copied correctly?
- [ ] Password doesn't have special characters that need URL encoding?
- [ ] Network access configured in MongoDB Atlas?
- [ ] Cluster status is green/active?

### "Port 3000 already in use"
- [ ] Kill existing process on port 3000
- [ ] Or use different port: `pnpm dev -- --port 3001`

### "Dependencies not found"
- [ ] Run `pnpm install` again
- [ ] Run `pip install -r backend/requirements.txt` again
- [ ] Delete node_modules: `rm -rf node_modules`
- [ ] Reinstall: `pnpm install`

## Next Steps After Setup

1. **Explore the Platform**
   - Create more test users
   - Run multiple demo simulations
   - Check different dashboards

2. **Understand the Code**
   - Read [README.md](./README.md) for architecture
   - Check [SETUP.md](./SETUP.md) for code structure
   - Review backend API at http://localhost:8000/docs

3. **Deploy to Production**
   - Follow [docs/GCP_SETUP.md](./docs/GCP_SETUP.md)
   - Use [DEPLOYMENT.md](./DEPLOYMENT.md) for advanced options

4. **Customize for Your Needs**
   - Modify risk thresholds in `backend/risk_engine.py`
   - Adjust incident explanations in demo data
   - Brand the UI with your company colors

## Helpful Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Google Cloud Documentation](https://cloud.google.com/docs)
- [Project Documentation](./docs/RESOURCES_AND_LINKS.md)

## Still Stuck?

1. Check all documentation links above
2. Search [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
3. Review [docs/RESOURCES_AND_LINKS.md](./docs/RESOURCES_AND_LINKS.md) for external help
4. Check project logs for error messages
5. Contact support through your platform

---

**Status**: ⬜ Not Started | 🟨 In Progress | ✅ Complete

**Overall Progress**: ___ / 26 major checkpoints completed

**Estimated Completion**: ___________

You've got this! 🚀
