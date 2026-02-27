# MongoDB Atlas Setup Guide

## Step 1: Create a MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Sign Up" and create your free account
3. Verify your email address

## Step 2: Create a Project and Cluster
1. After logging in, click "Create a Project"
2. Enter project name: `zero-trust-security`
3. Click "Create Project"
4. Click "Create a Cluster"
5. Choose the free tier (M0 Sandbox)
6. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
7. Select a region close to your deployment (e.g., us-east-1 for GCP)
8. Click "Create Cluster" and wait 3-5 minutes for initialization

## Step 3: Set Up Network Access
1. In Atlas, navigate to "Network Access" (left sidebar)
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production: Add specific IP addresses only
5. Click "Confirm"

## Step 4: Create Database User
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Enter username: `zero_trust_admin`
4. Generate a secure password and save it
5. Select role: "Atlas Admin"
6. Click "Add User"

## Step 5: Get Connection String
1. Go back to "Clusters" and click "Connect"
2. Select "Connect your application"
3. Choose Node.js driver version 4.x
4. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority`)
5. Replace `<password>` with your database user password
6. Replace `myFirstDatabase` with `zero_trust`

## Step 6: Update Environment Variables
Create a `.env.local` file in the project root:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://zero_trust_admin:YOUR_PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority

# JWT Secret (generate a random string, at least 32 chars)
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars

# API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production, also add to Google Cloud Secret Manager (see GCP_SETUP.md).

## Step 7: Initialize Collections
Run the MongoDB initialization script:

```bash
cd backend
pip install -r requirements.txt
python scripts/init-mongodb.py
```

This will create the required collections and indexes.

## Connection String Format
```
mongodb+srv://[username]:[password]@[cluster].mongodb.net/[database]?retryWrites=true&w=majority
```

## Testing the Connection
```bash
# From the backend directory
python -c "from db import get_db; db = get_db(); print(db.list_collection_names())"
```

You should see output like: `['users', 'behavior_logs', 'incidents']`

## Common Issues

### Authentication Failed
- Check that your password doesn't contain special characters that need URL encoding
- Use URL encoding for special chars: `@` → `%40`, `#` → `%23`
- Verify IP whitelist includes your current IP

### Connection Timeout
- Check Network Access whitelist in Atlas
- Verify cluster is fully initialized (green status)
- Check your internet connection

### Collection Not Found
- Run the initialization script: `python scripts/init-mongodb.py`
- Check that database user has correct permissions

## Monitoring
1. In Atlas Dashboard, click on your cluster
2. Go to "Metrics" to view connection stats
3. Go to "Logs" to debug connection issues
4. Use MongoDB Compass (desktop app) to browse collections locally:
   - Download from https://www.mongodb.com/products/compass
   - Paste your connection string to connect
