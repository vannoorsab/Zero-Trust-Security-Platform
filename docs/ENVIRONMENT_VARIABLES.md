# Environment Variables Reference

Complete guide to all environment variables used in the Zero Trust Security Platform.

## Location of Environment Files

- **Local Development**: `.env.local` (in project root)
- **Production**: Environment variables in Google Cloud Secret Manager
- **Template**: `.env.example` (copy this to `.env.local`)

## Backend Variables (Python FastAPI)

### Required Variables

#### `MONGODB_URI`
**MongoDB connection string for database access**
```
mongodb+srv://username:password@cluster.mongodb.net/zero_trust?retryWrites=true&w=majority
```
- Get from: [MongoDB Atlas Connection String](./MONGODB_SETUP.md)
- Format: `mongodb+srv://[user]:[password]@[host]/[database]`
- Special characters in password must be URL-encoded

#### `JWT_SECRET`
**Secret key for signing JWT authentication tokens**
```
your_super_secret_jwt_key_here_min_32_chars_make_it_random
```
- **Minimum length**: 32 characters
- **Generate**: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- **Security**: Keep this secret! Never commit to git
- Used for: Signing and verifying login tokens

### Optional Variables

#### `ENVIRONMENT`
**Application environment mode**
```
development | production | staging
```
- Default: `development`
- Affects: Logging level, error messages, CORS settings

#### `LOG_LEVEL`
**Logging verbosity**
```
DEBUG | INFO | WARNING | ERROR | CRITICAL
```
- Default: `INFO`
- Recommended for production: `WARNING`

#### `DATABASE_NAME`
**MongoDB database name**
```
zero_trust
```
- Default: `zero_trust`
- Collections: `users`, `behavior_logs`, `incidents`

#### `PORT`
**Backend server port**
```
8000
```
- Default: `8000`
- Change if port is already in use

#### `CORS_ORIGINS`
**Allowed origins for CORS requests**
```
["http://localhost:3000", "https://yourdomain.com"]
```
- For local development: `http://localhost:3000`
- For production: Your Vercel frontend URL

#### `API_PREFIX`
**API endpoint prefix**
```
/api
```
- Default: `/api`
- Used for all API routes: `/api/auth/login`, etc.

#### `RESET_DB`
**Reset database on startup**
```
true | false
```
- Default: `false`
- **Warning**: Setting to `true` deletes all data
- Use only for development/testing

#### `CREATE_ADMIN`
**Create default admin user on startup**
```
true | false
```
- Default: `false`
- Creates: admin@zerotrust.local / AdminPassword123!
- Use only for initial setup

## Frontend Variables (Next.js)

### Required Variables

#### `NEXT_PUBLIC_API_URL`
**Backend API base URL (must be public, frontend calls it)**
```
http://localhost:8000        # Local development
https://backend-url.run.app  # Production (GCP Cloud Run)
```
- **Public**: Accessible in browser console (ok for this URL)
- Used for: All API calls from Next.js frontend
- Include protocol (http/https) but NOT trailing slash

### Optional Variables

#### `NEXT_PUBLIC_APP_NAME`
**Application name displayed in UI**
```
Zero Trust Security Platform
```
- Default: App name from layout.tsx

#### `NEXT_PUBLIC_ENVIRONMENT`
**Frontend environment mode**
```
development | production
```
- Default: Next.js auto-detects from NODE_ENV

## Google Cloud Platform Variables

Only needed when deploying to GCP.

### Service Account

#### `GOOGLE_APPLICATION_CREDENTIALS`
**Path to GCP service account key file**
```
./key.json
```
- Download from: GCP Console → Service Accounts
- Keep file secure, don't commit to git
- For Docker: Mount or use Secret Manager

### Secret Manager

When using Google Cloud Secret Manager, reference secrets by path:

```
projects/PROJECT_ID/secrets/SECRET_NAME/latest
```

Example for MongoDB URI:
```
MONGODB_URI=projects/123456/secrets/mongodb-uri/latest
```

## Local Development Setup

### Step 1: Create `.env.local`

```bash
cp .env.example .env.local
```

### Step 2: Edit with Your Values

```bash
# .env.local

# ===== Backend Configuration =====
MONGODB_URI=mongodb+srv://zero_trust_admin:YOUR_PASSWORD@cluster.mongodb.net/zero_trust?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key_min_32_chars_generated_randomly
ENVIRONMENT=development
LOG_LEVEL=INFO

# ===== Frontend Configuration =====
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENVIRONMENT=development
```

### Step 3: Verify Setup

```bash
# Test MongoDB connection
cd backend
python -c "from db import get_db; db = get_db(); print('Connected:', db.name)"

# Test JWT secret is valid
python -c "from utils import create_access_token; print(create_access_token({'sub': 'test'}))"
```

## Production Deployment Setup

### GCP Secret Manager

Store these in Cloud Secret Manager (see [GCP_SETUP.md](./GCP_SETUP.md)):

1. **mongodb-uri**: Your MongoDB Atlas connection string
2. **jwt-secret**: A secure random string (min 32 chars)

### Cloud Run Environment Variables

Set in Cloud Run service configuration:

```yaml
MONGODB_URI: projects/YOUR_PROJECT_ID/secrets/mongodb-uri/latest
JWT_SECRET: projects/YOUR_PROJECT_ID/secrets/jwt-secret/latest
ENVIRONMENT: production
LOG_LEVEL: WARNING
```

### Vercel Frontend Variables

In Vercel project settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.run.app
NEXT_PUBLIC_ENVIRONMENT=production
```

## Security Best Practices

### ✅ DO
- Store secrets in environment variables, not in code
- Use different secrets for dev/staging/production
- Rotate secrets regularly
- Use strong, random JWT_SECRET (min 32 chars)
- Store secrets in Google Cloud Secret Manager for production
- Use HTTPS for NEXT_PUBLIC_API_URL in production

### ❌ DON'T
- Commit `.env.local` to git
- Use same secret across environments
- Use weak or predictable secrets
- Log sensitive variables
- Share credentials in messages/documents
- Put secrets in NEXT_PUBLIC_* variables (they're visible to clients)

## Variable Validation

The application validates:
- `MONGODB_URI`: Must be valid MongoDB connection string
- `JWT_SECRET`: Must be at least 32 characters
- `NEXT_PUBLIC_API_URL`: Must be valid URL with protocol
- `PORT`: Must be valid port number (1-65535)

If validation fails, the app will error on startup with helpful messages.

## Troubleshooting

### Error: "MONGODB_URI not set"
```bash
# Check if .env.local exists
ls -la .env.local

# Check content
cat .env.local | grep MONGODB_URI

# Reload environment
source .env.local  # Linux/Mac
```

### Error: "JWT_SECRET must be at least 32 characters"
```bash
# Generate secure secret
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Update .env.local
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<paste-generated-secret-here>
```

### Error: "Cannot connect to backend"
```bash
# Check NEXT_PUBLIC_API_URL
cat .env.local | grep NEXT_PUBLIC_API_URL

# Test backend is running
curl http://localhost:8000/api/health

# Check frontend can reach backend
curl -H "Origin: http://localhost:3000" http://localhost:8000/api/health
```

### Variables not updating after `.env.local` changes
```bash
# Restart backend
kill $(lsof -ti:8000)
uvicorn backend.main:app --reload

# Restart frontend (auto-reloads with HMR)
# Or manually restart: kill next dev and run pnpm dev
```

## Reference

### All Available Variables

| Variable | Required | Type | Default | Location |
|----------|----------|------|---------|----------|
| MONGODB_URI | Yes | String | - | Backend |
| JWT_SECRET | Yes | String | - | Backend |
| NEXT_PUBLIC_API_URL | Yes | String | - | Frontend |
| ENVIRONMENT | No | String | development | Backend |
| LOG_LEVEL | No | String | INFO | Backend |
| DATABASE_NAME | No | String | zero_trust | Backend |
| PORT | No | Number | 8000 | Backend |
| CORS_ORIGINS | No | JSON Array | localhost:3000 | Backend |
| API_PREFIX | No | String | /api | Backend |
| RESET_DB | No | Boolean | false | Backend |
| CREATE_ADMIN | No | Boolean | false | Backend |
| NEXT_PUBLIC_APP_NAME | No | String | App | Frontend |
| NEXT_PUBLIC_ENVIRONMENT | No | String | production | Frontend |

## External Links

- [MongoDB Connection String](https://docs.mongodb.com/drivers/node/current/fundamentals/connection/connection-target/)
- [GCP Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Cloud Run Environment Variables](https://cloud.google.com/run/docs/configuring/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
