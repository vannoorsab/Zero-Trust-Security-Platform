# Getting Credentials - Step-by-Step

This guide walks you through getting all the credentials you need to run the Zero Trust Security Platform.

## What You Need

| Service | Purpose | Cost | Time |
|---------|---------|------|------|
| MongoDB Atlas | Database | Free tier available | 10 min |
| Google Cloud | Deployment | $300 free credits | 5 min |
| (Optional) JWT Secret | Authentication | Generate locally | 1 min |

---

## Part 1: MongoDB Atlas (Required)

### Why You Need It
MongoDB Atlas stores your user accounts, behavior logs, and incident data.

### Step 1: Create MongoDB Atlas Account
1. Visit: **https://www.mongodb.com/cloud/atlas**
2. Click the **"Sign Up"** button
3. Choose **"Sign up with Email"** or use Google/GitHub
4. Fill in your details:
   - Email address
   - Password (min 8 characters, needs uppercase, number, special char)
   - First Name
   - Last Name
5. Check the checkbox: **"I want to sign up using my email"**
6. Click **"Sign Up"** button
7. **Check your email** for verification link
8. Click the verification link to confirm

### Step 2: Create Your First Organization
After email verification:
1. Click **"Create an Organization"**
2. Enter Organization Name: `Zero Trust Security`
3. Click **"Next"**
4. Select your preference for Atlas usage
5. Click **"Create Organization"**

### Step 3: Create a Project
1. Click **"New Project"** button
2. Project Name: `zero-trust-dev`
3. Click **"Next"**
4. Add team members (skip if solo)
5. Click **"Create Project"**

### Step 4: Create a Database Cluster
1. Click **"Build a Database"** button
2. Choose **"M0 Sandbox"** (FREE tier)
3. Select Cloud Provider:
   - **AWS** (most reliable)
   - Google Cloud (if using GCP)
   - Azure
4. Select Region (closest to your location):
   - US: `N. Virginia (us-east-1)`
   - US: `Oregon (us-west-1)`
   - Europe: `Ireland (eu-west-1)`
5. Click **"Create Cluster"**
6. **Wait 3-5 minutes** for cluster to initialize

### Step 5: Set Up Network Access
This allows your app to connect to MongoDB:

1. Go to **"Network Access"** (left sidebar menu)
2. Click **"Add IP Address"** (green button)
3. **For Development** (local machine):
   - Click **"Add Current IP Address"** to add your computer's IP
   - Or click **"Allow Access from Anywhere"** (0.0.0.0/0) for testing
4. **For Production** (GCP deployment):
   - Add Google Cloud IP ranges (see GCP section)
5. Click **"Confirm"** button

### Step 6: Create Database User
This is your username/password for MongoDB:

1. Go to **"Database Access"** (left sidebar)
2. Click **"Add New Database User"** (green button)
3. **Authentication Method**: Select **"Password"**
4. **Username**: `zero_trust_admin`
5. **Password**: Generate strong password
   - Click **"Autogenerate Secure Password"**
   - **Copy and save this password!** (you'll need it later)
   - Optionally: Create your own (letters, numbers, special chars)
6. **Database User Privileges**: 
   - Keep default **"Atlas Admin"**
7. Click **"Add User"**

### Step 7: Get Your Connection String
1. Click **"Databases"** (left sidebar)
2. Click your cluster **"zero-trust-dev"**
3. Click **"Connect"** button
4. Choose **"Drivers"**
5. Select **"Python"** driver
6. Copy the connection string that looks like:
   ```
   mongodb+srv://zero_trust_admin:<password>@zero-trust-dev.xxxxx.mongodb.net/
   ```
7. **Replace `<password>` with your actual password** from Step 6
8. **Save this string!** You'll need it in the next step

### Example MongoDB Connection String
```
mongodb+srv://zero_trust_admin:MySecure123!Password@zero-trust-dev.a1b2c3d4.mongodb.net/
```

---

## Part 2: Google Cloud (Optional - For GCP Deployment)

### Why You Need It
Google Cloud runs your backend on Cloud Run, making it accessible 24/7.

### Important: You Can Skip This for Local Development
You can test everything locally without GCP. Only set this up if you want to deploy to production.

### Step 1: Create Google Cloud Account
1. Visit: **https://console.cloud.google.com/**
2. Sign in with Google account (create one if needed)
3. Click **"Select a Project"** (top bar)
4. Click **"New Project"**
5. Project Name: `Zero Trust Security`
6. Click **"Create"**
7. **Wait 30 seconds** for project to initialize
8. The new project will auto-select

### Step 2: Enable Required APIs
1. In the search bar (top), search: `Cloud Run`
2. Click **"Cloud Run"**
3. Click **"Enable"** (if needed)
4. Do the same for:
   - Search: `Cloud Build` → Enable
   - Search: `Container Registry` → Enable
   - Search: `Secret Manager` → Enable

### Step 3: Create Service Account
1. Go to: **https://console.cloud.google.com/iam-admin/serviceaccounts**
2. Click **"Create Service Account"**
3. **Service Account Name**: `zero-trust-backend`
4. Click **"Create and Continue"**
5. Grant roles:
   - Click **"Select a role"**
   - Search: `Cloud Run`
   - Select: **"Cloud Run Admin"**
   - Click **"Continue"**
6. Click **"Done"**

### Step 4: Create and Download Service Account Key
1. Go back to Service Accounts page
2. Click the service account you just created: `zero-trust-backend`
3. Go to **"Keys"** tab
4. Click **"Add Key"** → **"Create new key"**
5. Choose **"JSON"**
6. Click **"Create"**
7. A JSON file downloads automatically - **Keep this safe!**

### Step 5: Set Environment Variables
See the **Environment Variables** section below to use your GCP credentials.

---

## Part 3: Generate JWT Secret (Local Only)

### What is it?
A secret key for signing authentication tokens.

### Generate on Linux/Mac:
```bash
openssl rand -hex 32
```

### Generate on Windows (PowerShell):
```powershell
[Convert]::ToHexString((Get-Random -Count 32 -InputObject @(0..255)))
```

### Example Output:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

---

## Part 4: Set Up Environment Variables

### Create .env.local file
1. In your project root directory, create a file named `.env.local`
2. Add the following variables:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://zero_trust_admin:YOUR_PASSWORD@zero-trust-dev.xxxxx.mongodb.net/zero_trust_db

# Backend API URL (local development)
NEXT_PUBLIC_API_URL=http://localhost:8000

# JWT Secret (generate with openssl command above)
JWT_SECRET=your_generated_secret_here

# GCP Deployment (only if deploying to Google Cloud)
GCP_PROJECT_ID=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Backend Port (default 8000)
BACKEND_PORT=8000
```

### What Each Variable Does:
- **MONGODB_URI**: Tells backend where to find your database
- **NEXT_PUBLIC_API_URL**: Tells frontend where backend is running
- **JWT_SECRET**: Encrypts user login tokens
- **GCP_PROJECT_ID**: Your Google Cloud project identifier
- **GOOGLE_APPLICATION_CREDENTIALS**: Path to your GCP service account JSON file
- **BACKEND_PORT**: Which port backend listens on

---

## Part 5: Verify Your Credentials Work

### Test MongoDB Connection
```bash
# In the project root directory:
python -c "
from pymongo import MongoClient
import os

uri = os.getenv('MONGODB_URI')
client = MongoClient(uri)
try:
    admin = client.admin
    admin.command('ismaster')
    print('✓ MongoDB Atlas connection successful!')
except Exception as e:
    print(f'✗ MongoDB connection failed: {e}')
"
```

### Test Backend Startup
```bash
# Terminal 1: Start the backend
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload

# Terminal 2: In new terminal, test the API
curl http://localhost:8000/health
# Should return: {"status":"ok"}
```

### Test Frontend Connection
```bash
# Terminal 3: Start the frontend
pnpm install
pnpm dev

# Go to http://localhost:3000/register
# Try signing up - should connect to backend
```

---

## Troubleshooting

### MongoDB Connection Failed
**Error**: `ServerSelectionTimeoutError` or `OperationFailure`

**Solutions**:
1. Check your password is correct (it's case-sensitive!)
2. Verify IP is whitelisted in **Network Access**
3. Ensure cluster is fully initialized (green status in Databases)
4. Try adding `?retryWrites=true` to connection string

### Backend Won't Start
**Error**: `Connection refused` or `MongoServerError`

**Solutions**:
1. Verify `MONGODB_URI` in `.env.local` is correct
2. Check MongoDB credentials are exactly right
3. Ensure cluster is running (green status)

### Frontend Shows Connection Error
**Error**: `POST http://localhost:8000 failed`

**Solutions**:
1. Make sure backend is running on port 8000
2. Check `NEXT_PUBLIC_API_URL=http://localhost:8000`
3. Frontend running on `http://localhost:3000` (not 8080)

### "Invalid credentials" on login
1. Make sure MongoDB user was created (Database Access section)
2. Verify password contains no special URL characters
   - If password has `@` or `#`, you must URL-encode it
   - Use MongoDB Atlas password generation for safety

---

## Next Steps

1. **Save all credentials** in a safe place (password manager)
2. **Fill in `.env.local`** with your actual credentials
3. **Follow [QUICK_START.md](./QUICK_START.md)** to start the app
4. **Test with demo data** (click "Run Demo Simulation")

---

## Need Help?

- **MongoDB Issues**: https://docs.mongodb.com/manual/troubleshooting/
- **Google Cloud Issues**: https://cloud.google.com/docs
- **Project Issues**: Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
