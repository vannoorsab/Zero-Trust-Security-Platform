# Google Cloud Platform (GCP) Deployment Guide

## Prerequisites
- Google Cloud Account ([create one here](https://cloud.google.com/free))
- Active billing enabled on your GCP project
- gcloud CLI installed ([download](https://cloud.google.com/sdk/docs/install))
- Docker installed locally

## Step 1: Create a GCP Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project selector at the top
3. Click "New Project"
4. Enter project name: `zero-trust-security`
5. Click "Create"
6. Wait for the project to be initialized

## Step 2: Enable Required APIs
In the Cloud Console, enable these APIs:

1. **Cloud Run API**
   - Search for "Cloud Run API" in the search bar
   - Click it and press "Enable"

2. **Cloud Build API**
   - Search for "Cloud Build API"
   - Click it and press "Enable"

3. **Artifact Registry API**
   - Search for "Artifact Registry API"
   - Click it and press "Enable"

4. **Cloud Logging API** (optional but recommended)
   - Search for "Cloud Logging API"
   - Click it and press "Enable"

## Step 3: Create Service Account
1. In Cloud Console, go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Service account name: `zero-trust-backend`
4. Click "Create and Continue"
5. Grant roles:
   - Cloud Run Admin
   - Artifact Registry Writer
   - Secret Manager Secret Accessor
6. Click "Continue" then "Done"

## Step 4: Create and Download Key
1. Click on the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose JSON format
5. Click "Create" (downloads key.json)
6. **Keep this file secure** - it contains credentials

## Step 5: Set Up Artifact Registry
1. Go to "Artifact Registry" in the Cloud Console
2. Click "Create Repository"
3. Name: `zero-trust-docker`
4. Format: Docker
5. Location: Choose closest region (e.g., us-central1)
6. Click "Create"

## Step 6: Create Secret Manager Secrets
Store sensitive configuration in Google Cloud Secret Manager:

1. Go to "Secret Manager" in Cloud Console
2. Click "Create Secret"

Create these secrets:

### Secret 1: MONGODB_URI
- Name: `mongodb-uri`
- Value: Your MongoDB Atlas connection string
  ```
  mongodb+srv://username:password@cluster.mongodb.net/zero_trust?retryWrites=true&w=majority
  ```

### Secret 2: JWT_SECRET
- Name: `jwt-secret`
- Value: A secure random string (min 32 chars)
  ```
  your_super_secret_jwt_key_here_min_32_chars_make_it_random
  ```

## Step 7: Configure Environment Variables
Create a `.env.production` file for your deployment:

```env
# Backend Configuration
MONGODB_URI=projects/YOUR_PROJECT_ID/secrets/mongodb-uri/latest
JWT_SECRET=projects/YOUR_PROJECT_ID/secrets/jwt-secret/latest
ENVIRONMENT=production
LOG_LEVEL=info

# Frontend Configuration
NEXT_PUBLIC_API_URL=https://YOUR_BACKEND_URL.run.app
```

## Step 8: Deploy Backend to Cloud Run
### Option A: Using Cloud Build (Recommended)

1. Push your code to GitHub (or other Git repository)
2. In Cloud Console, go to "Cloud Build" → "Triggers"
3. Click "Connect Repository"
4. Select your Git provider and authorize
5. Select your repository
6. Click "Create a trigger"
7. Configure:
   - Trigger name: `zero-trust-backend-deploy`
   - Event: Push to a branch
   - Branch: `^main$`
   - Build configuration: Cloud Build configuration file (cloudbuild.yaml)
8. Click "Create"
9. Push to main branch to trigger deployment

### Option B: Manual Deployment with gcloud CLI

```bash
# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Authenticate
gcloud auth login

# Build and push to Artifact Registry
docker build -t us-central1-docker.pkg.dev/YOUR_PROJECT_ID/zero-trust-docker/backend:latest ./backend
docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/zero-trust-docker/backend:latest

# Deploy to Cloud Run
gcloud run deploy zero-trust-backend \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/zero-trust-docker/backend:latest \
  --platform managed \
  --region us-central1 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 3600 \
  --allow-unauthenticated
```

## Step 9: Set Cloud Run Environment Variables
After deployment:

1. Go to Cloud Run in the console
2. Click on `zero-trust-backend` service
3. Click "Edit and Deploy New Revision"
4. Under "Variables and Secrets":
   - Click "Add Variable"
   - Add each variable from your `.env.production`
   - For secrets, select "Reference a Secret"
5. Click "Deploy"

## Step 10: Deploy Frontend to Vercel (Recommended)
The Next.js frontend is best deployed to Vercel:

1. Push your code to GitHub
2. Go to [Vercel.com](https://vercel.com/)
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - Framework: Next.js
   - Root Directory: ./ (or where your app is)
   - Build Command: `pnpm build`
   - Output Directory: `.next`
6. Add environment variable:
   - `NEXT_PUBLIC_API_URL`: Your Cloud Run backend URL
7. Click "Deploy"

## Step 11: Verify Deployment
1. Get your Cloud Run URL from the Cloud Console
2. Test health endpoint:
   ```bash
   curl https://YOUR_BACKEND_URL.run.app/api/health
   ```
   Should return: `{"status":"healthy"}`

3. Test login:
   ```bash
   curl -X POST https://YOUR_BACKEND_URL.run.app/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"TestPass123"}'
   ```

## Monitoring and Logs

### View Logs
```bash
gcloud run logs read zero-trust-backend --limit 50 --region us-central1
```

### Cloud Console Monitoring
1. Go to Cloud Run → Select your service
2. Click "Metrics" to view:
   - Request count
   - Error rates
   - Latency
   - Container instances

### Set Up Alerts
1. Go to "Cloud Monitoring"
2. Click "Create Alert Policy"
3. Condition: "Cloud Run service" 
4. Metric: "Request Count" or "Error Rate"
5. Set threshold and notification channels

## Cost Estimation
- Cloud Run: ~$1-5/month (first 2M requests free per month)
- Artifact Registry: ~$0.10 per GB stored
- MongoDB Atlas: Free tier includes 512MB storage, 100 connections

## Troubleshooting

### 500 Internal Server Error
1. Check logs: `gcloud run logs read zero-trust-backend --limit 100`
2. Verify MongoDB connection string in Secret Manager
3. Check Secret Manager permissions on service account

### Cold Start Delays
- Expected for first request after inactivity
- Reduce with higher memory allocation in Cloud Run settings
- Consider using Cloud Tasks for scheduled warm-ups

### Authentication Errors
- Verify JWT_SECRET is set correctly
- Check that service account has Secret Manager access
- Ensure tokens are being sent in Authorization header

## Cleanup
To delete resources and stop incurring charges:

```bash
# Delete Cloud Run service
gcloud run services delete zero-trust-backend --region us-central1

# Delete Artifact Registry repository
gcloud artifacts repositories delete zero-trust-docker --location us-central1

# Delete secrets
gcloud secrets delete mongodb-uri
gcloud secrets delete jwt-secret

# Delete project (if desired)
gcloud projects delete YOUR_PROJECT_ID
```

## References
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Artifact Registry Documentation](https://cloud.google.com/artifact-registry/docs)
