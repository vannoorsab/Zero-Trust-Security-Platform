# Zero Trust Security Platform - GCP Deployment Script
# Run this script in PowerShell to deploy both components to Google Cloud.

$PROJECT_ID = "ardent-bulwark-448011-i1"
$REGION = "us-central1"
$REPO_NAME = "zero-trust"

Write-Host "--- Phase 1: Enabling APIs ---" -ForegroundColor Cyan
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com --project=$PROJECT_ID

Write-Host "--- Phase 2: Create Artifact Registry ---" -ForegroundColor Cyan
# Check if repo exists, if not create it
$repoExists = gcloud artifacts repositories describe $REPO_NAME --location=$REGION --project=$PROJECT_ID 2>$null
if (-not $repoExists) {
    gcloud artifacts repositories create $REPO_NAME --repository-format=docker --location=$REGION --description="Docker repository for Zero Trust Platform" --project=$PROJECT_ID
}

# --- Phase 3: Build & Deploy Backend ---
Write-Host "--- Phase 3: Build & Deploy Backend ---" -ForegroundColor Cyan

# Load secrets from .env file
$envFile = Get-Content ".env" -ErrorAction SilentlyContinue
$MONGO_URI = ""
$JWT_SEC = ""
if ($envFile) {
    $MONGO_LINE = $envFile | Select-String "MONGODB_URI="
    if ($MONGO_LINE) { $MONGO_URI = $MONGO_LINE.ToString().Split("=")[1].Trim() }
    $JWT_LINE = $envFile | Select-String "JWT_SECRET="
    if ($JWT_LINE) { $JWT_SEC = $JWT_LINE.ToString().Split("=")[1].Trim() }
}

if (-not $MONGO_URI) { Write-Host "Warning: MONGODB_URI not found in .env" -ForegroundColor Yellow }

# Build Backend using Google Cloud Build (Bypasses local Docker/Network issues)
$BACKEND_IMAGE = "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/backend:latest"
Write-Host "Building Backend on Google Cloud..." -ForegroundColor Gray
$bk_subs = "_IMAGE_NAME=$BACKEND_IMAGE"
gcloud builds submit --config backend/cloudbuild.yaml --substitutions $bk_subs ./backend --project=$PROJECT_ID

# Deploy Backend to Cloud Run
gcloud run deploy zero-trust-backend `
  --image $BACKEND_IMAGE `
  --region $REGION `
  --platform managed `
  --set-env-vars ENVIRONMENT=production,MONGODB_URI=$MONGO_URI,JWT_SECRET=$JWT_SEC `
  --allow-unauthenticated `
  --project=$PROJECT_ID

# Get Backend URL
$BACKEND_URL = (gcloud run services describe zero-trust-backend --region $REGION --format 'value(status.url)' --project=$PROJECT_ID)
Write-Host "Backend deployed at: $BACKEND_URL" -ForegroundColor Green

Write-Host "--- Phase 4: Build & Deploy Frontend ---" -ForegroundColor Cyan
# Build Frontend using Google Cloud Build
$FRONTEND_IMAGE = "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/frontend:latest"
Write-Host "Building Frontend on Google Cloud..." -ForegroundColor Gray
# Note: Using Backend URL as build arg for Next.js. We use quotes for substitutions to prevent parsing issues.
$subs = "_IMAGE_NAME=$FRONTEND_IMAGE,_API_URL=$BACKEND_URL"
gcloud builds submit --config cloudbuild-frontend.yaml --substitutions $subs . --project=$PROJECT_ID

# Deploy Frontend to Cloud Run
gcloud run deploy zero-trust-frontend `
  --image $FRONTEND_IMAGE `
  --region $REGION `
  --platform managed `
  --set-env-vars NEXT_PUBLIC_API_URL=$BACKEND_URL `
  --allow-unauthenticated `
  --project=$PROJECT_ID

$FRONTEND_URL = (gcloud run services describe zero-trust-frontend --region $REGION --format 'value(status.url)' --project=$PROJECT_ID)

Write-Host "--------------------------------------------------" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "Frontend URL: $FRONTEND_URL" -ForegroundColor Green
Write-Host "Backend URL:  $BACKEND_URL" -ForegroundColor Green
Write-Host "--------------------------------------------------" -ForegroundColor Cyan
Write-Host "IMPORTANT: You still need to configure MongoDB URI in Secret Manager or env vars."
Write-Host "Run: gcloud run services update zero-trust-backend --set-env-vars MONGODB_URI=YOUR_URI --region $REGION"
