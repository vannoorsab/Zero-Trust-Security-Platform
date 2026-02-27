# Zero Trust Security Platform - Deployment Guide

## Prerequisites

1. Google Cloud Project with the following APIs enabled:
   - Cloud Run API
   - Artifact Registry API
   - Cloud Build API
   - Secret Manager API

2. MongoDB Atlas cluster (connection string prepared)

3. Google Cloud SDK installed locally

4. Docker installed locally

## Environment Variables

Create the following secrets in Google Cloud Secret Manager:

```bash
gcloud secrets create mongodb-uri --data-file=- <<< "mongodb+srv://user:password@cluster.mongodb.net/zerotrust"
gcloud secrets create jwt-secret --data-file=- <<< "your-super-secret-jwt-key"
```

## Deployment Steps

### Option 1: Deploy via Cloud Build (Automated)

1. Push code to Google Cloud Source Repositories or GitHub

2. Trigger Cloud Build:
```bash
gcloud builds submit --config=cloudbuild.yaml
```

3. Cloud Build will automatically:
   - Build the Docker image
   - Push to Artifact Registry
   - Deploy to Cloud Run with environment variables

### Option 2: Manual Deployment

1. Build Docker image:
```bash
docker build -t us-central1-docker.pkg.dev/$PROJECT_ID/zero-trust/backend:latest -f backend/Dockerfile ./backend
```

2. Configure Docker authentication:
```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
```

3. Push image to Artifact Registry:
```bash
docker push us-central1-docker.pkg.dev/$PROJECT_ID/zero-trust/backend:latest
```

4. Deploy to Cloud Run:
```bash
gcloud run deploy zero-trust-backend \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/zero-trust/backend:latest \
  --region us-central1 \
  --platform managed \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars MONGODB_URI=$(gcloud secrets versions access latest --secret=mongodb-uri),JWT_SECRET=$(gcloud secrets versions access latest --secret=jwt-secret) \
  --allow-unauthenticated
```

## Frontend Deployment

The Next.js frontend can be deployed to:

1. **Vercel** (Recommended):
   - Connect GitHub repository
   - Set API_BASE_URL environment variable to Cloud Run service URL
   - Deploy

2. **Google Cloud Run**:
   - Build: `npm run build`
   - Deploy as a separate Cloud Run service

## Health Check

Verify deployment:
```bash
curl https://zero-trust-backend-[HASH]-uc.a.run.app/health
```

## Monitoring

1. View logs in Cloud Logging:
```bash
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

2. Set up monitoring and alerting in Cloud Monitoring dashboard

3. Monitor error rates and latency metrics

## Rollback

```bash
gcloud run deploy zero-trust-backend \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/zero-trust/backend:[PREVIOUS_TAG] \
  --region us-central1
```

## Database Initialization

First deployment only - initialize MongoDB collections:

1. Connect to MongoDB Atlas cluster
2. Create indexes for performance:

```mongodb
db.users.createIndex({ "email": 1 }, { unique: true })
db.behavior_logs.createIndex({ "user_id": 1, "created_at": -1 })
db.incidents.createIndex({ "user_id": 1, "created_at": -1 })
db.incidents.createIndex({ "severity": 1 })
```

## Troubleshooting

- **Permission denied errors**: Ensure Cloud Build service account has Editor role
- **MongoDB connection fails**: Verify IP whitelist in MongoDB Atlas includes Cloud Run IPs
- **Memory issues**: Increase Cloud Run memory allocation to 1GB
- **Slow queries**: Add database indexes as shown above
