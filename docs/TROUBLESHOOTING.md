# Troubleshooting & FAQ

Common issues and how to fix them.

## Database Connection Issues

### "Connection refused" or "Cannot connect to MongoDB"

**Symptoms:**
- Backend fails to start
- Error: `ConnectionFailure: connection timeout`

**Solutions:**

1. **Check MongoDB is running:**
   ```bash
   # For local MongoDB
   mongo --eval "db.adminCommand('ping')"
   
   # For MongoDB Atlas, test in Atlas console
   ```

2. **Verify connection string:**
   ```bash
   # Check .env.local has MONGODB_URI
   cat .env.local | grep MONGODB_URI
   
   # Should look like:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/zero_trust?retryWrites=true&w=majority
   ```

3. **Check Network Access (MongoDB Atlas):**
   - Go to: MongoDB Atlas → Clusters → Network Access
   - Ensure your IP is whitelisted
   - For development: Can add 0.0.0.0/0 (any IP)
   - For production: Only add specific IPs

4. **Verify credentials:**
   - Check username and password are correct
   - Special characters in password must be URL-encoded
   - Example: `@` → `%40`, `#` → `%23`

5. **Check cluster status:**
   - In MongoDB Atlas, verify cluster shows "Available" (green)
   - If "Paused" or "Stopped", click "Resume"

6. **Test connection manually:**
   ```bash
   cd backend
   python -c "from db import get_db; print('Connected:', get_db().name)"
   ```

---

## Authentication & JWT Issues

### "Invalid token" or "Unauthorized" errors

**Symptoms:**
- Login fails
- API calls return 401 Unauthorized
- Error: `Invalid token format` or `Token has expired`

**Solutions:**

1. **Verify JWT_SECRET is set:**
   ```bash
   cat .env.local | grep JWT_SECRET
   
   # Must be at least 32 characters
   wc -c <<< "YOUR_SECRET"  # Should show >= 32
   ```

2. **Regenerate JWT_SECRET if corrupted:**
   ```bash
   # Generate new secret
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   
   # Update .env.local
   JWT_SECRET=<paste-new-secret-here>
   
   # Restart backend
   ```

3. **Clear browser storage:**
   ```javascript
   // Open browser console and run:
   localStorage.clear()
   sessionStorage.clear()
   location.reload()
   ```

4. **Check token expiration:**
   - Tokens expire after 24 hours
   - User must log in again to get new token

5. **Verify token is sent correctly:**
   ```bash
   # Get token from login
   TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"TestPass123!"}' \
     | jq -r '.access_token')
   
   # Use token in API call
   curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8000/api/users/me
   ```

---

## Port and Service Issues

### "Address already in use" or "Port already in use"

**Symptoms:**
- Error: `OSError: [Errno 48] Address already in use`
- Can't start backend or frontend

**Solutions:**

1. **Find and kill process on port:**
   ```bash
   # macOS/Linux - Find process on port 8000
   lsof -ti:8000 | xargs kill -9
   
   # Windows - Find and kill process
   netstat -ano | findstr :8000
   taskkill /PID <PID> /F
   ```

2. **Use different port:**
   ```bash
   # Backend on custom port
   uvicorn backend.main:app --port 8001
   
   # Frontend on custom port
   PORT=3001 pnpm dev
   ```

3. **Close other services:**
   - Docker containers using the ports
   - Other development servers
   - Run `docker-compose down` to stop all

---

## API Connection Issues

### Frontend can't connect to backend

**Symptoms:**
- Error: `Failed to fetch`
- Error: `CORS error`
- Error: `404 Not Found`

**Solutions:**

1. **Verify backend is running:**
   ```bash
   # Test health endpoint
   curl http://localhost:8000/api/health
   
   # Should return: {"status":"healthy"}
   ```

2. **Check NEXT_PUBLIC_API_URL:**
   ```bash
   # View current setting
   cat .env.local | grep NEXT_PUBLIC_API_URL
   
   # Should be: http://localhost:8000 (for local dev)
   # Should be: https://backend-url.run.app (for production)
   
   # NO trailing slash!
   ```

3. **Restart frontend with new API URL:**
   ```bash
   # Kill frontend process
   # Update .env.local
   # Restart: pnpm dev
   ```

4. **Check CORS is enabled:**
   - Backend automatically enables CORS for localhost:3000
   - For production, update CORS_ORIGINS in environment

5. **Check API endpoints exist:**
   - Backend Swagger: http://localhost:8000/docs
   - Test endpoints directly
   - Check response status and error message

---

## Database Schema & Collections

### "Collection not found" or missing data

**Symptoms:**
- 404 errors on API routes
- Empty collections
- Missing indexes causing slow queries

**Solutions:**

1. **Initialize collections:**
   ```bash
   cd backend
   python scripts/init-mongodb.py
   
   # Should show:
   # [✓] Successfully connected to MongoDB
   # [✓] Initialization Complete!
   ```

2. **Verify collections exist:**
   ```bash
   # Check with MongoDB Compass (desktop GUI) or:
   python -c "from db import get_db; print(get_db().list_collection_names())"
   
   # Should show: ['users', 'behavior_logs', 'incidents']
   ```

3. **Reset database if corrupted:**
   ```bash
   export RESET_DB=true
   python scripts/init-mongodb.py
   
   # Creates fresh collections with proper indexes
   ```

4. **Check indexes for performance:**
   ```python
   from db import get_db
   db = get_db()
   
   # View all indexes on users collection
   for index in db.users.list_indexes():
       print(index)
   ```

---

## Frontend Build & Deployment Issues

### Next.js build fails

**Symptoms:**
- Error: `Module not found`
- Error: `Unknown component`
- Build times out

**Solutions:**

1. **Clear build cache:**
   ```bash
   rm -rf .next
   pnpm build
   ```

2. **Verify dependencies installed:**
   ```bash
   pnpm install
   pnpm list  # Show all installed packages
   ```

3. **Check for TypeScript errors:**
   ```bash
   pnpm tsc --noEmit
   ```

4. **View detailed build output:**
   ```bash
   pnpm build --verbose
   ```

---

## Performance & Slow Queries

### API requests are slow or timing out

**Symptoms:**
- Dashboards load slowly
- Requests timeout (>30 seconds)
- High CPU/memory usage

**Solutions:**

1. **Check MongoDB query performance:**
   ```bash
   # Enable MongoDB profiling
   db.setProfilingLevel(1)
   
   # View slow queries
   db.system.profile.find().sort({millis:-1}).limit(5)
   ```

2. **Verify indexes exist:**
   ```bash
   python backend/scripts/init-mongodb.py  # Recreates indexes
   ```

3. **Monitor backend performance:**
   ```bash
   # Add timing to requests
   curl -w "Time: %{time_total}s\n" http://localhost:8000/api/health
   ```

4. **Increase compute resources:**
   - For Docker: Increase memory in docker-compose.yml
   - For Cloud Run: Increase CPU/Memory allocation
   - For MongoDB: Upgrade cluster tier

5. **Check for N+1 queries:**
   - Review API routes for unnecessary loops
   - Use aggregation pipelines in MongoDB

---

## Docker & Container Issues

### Docker container won't start or crashes

**Symptoms:**
- `docker-compose up` fails
- Container exits immediately
- Can't access services

**Solutions:**

1. **Check logs:**
   ```bash
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

2. **Verify .env file:**
   ```bash
   # Docker-compose needs .env.local in root
   ls -la .env.local
   
   # Or set in docker-compose.yml
   ```

3. **Rebuild containers:**
   ```bash
   docker-compose down -v  # Remove volumes
   docker-compose up --build
   ```

4. **Check port conflicts:**
   ```bash
   docker ps  # See running containers
   netstat -an | grep LISTEN  # See all listening ports
   ```

---

## GCP Deployment Issues

### Cloud Run deployment fails

**Symptoms:**
- `gcloud run deploy` fails
- 502 Bad Gateway errors
- Services can't communicate

**Solutions:**

1. **Check service account permissions:**
   ```bash
   gcloud iam service-accounts get-iam-policy zero-trust-backend@PROJECT.iam.gserviceaccount.com
   ```

2. **Verify secrets are accessible:**
   ```bash
   gcloud secrets versions access latest --secret="mongodb-uri"
   ```

3. **Check Cloud Run logs:**
   ```bash
   gcloud run logs read zero-trust-backend --limit 100 --region us-central1
   ```

4. **Test local container before deploying:**
   ```bash
   docker build -t zero-trust-backend ./backend
   docker run -p 8000:8000 \
     -e MONGODB_URI=$MONGODB_URI \
     -e JWT_SECRET=$JWT_SECRET \
     zero-trust-backend
   ```

5. **Verify Artifact Registry:**
   ```bash
   gcloud artifacts repositories list
   gcloud artifacts docker images list us-central1-docker.pkg.dev/PROJECT_ID/zero-trust-docker
   ```

---

## Common Error Messages

### "No module named 'db'"
**Fix:** Ensure you're in the `backend` directory or PYTHONPATH includes backend

### "Cannot find module 'useApi'"
**Fix:** Check `lib/auth.ts` and `hooks/useApi.ts` exist in project

### "TypeError: Cannot read property 'access_token' of undefined"
**Fix:** Verify API returns correct response format from `/api/auth/login`

### "ECONNREFUSED 127.0.0.1:8000"
**Fix:** Backend not running. Start with `uvicorn backend.main:app --reload`

### "Invalid MongoDB connection string"
**Fix:** Check MONGODB_URI format and special characters are URL-encoded

---

## Debug Mode

### Enable verbose logging

**Backend:**
```bash
export LOG_LEVEL=DEBUG
uvicorn backend.main:app --reload
```

**Frontend:**
```bash
cat > .env.local << 'EOF'
DEBUG=*
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
pnpm dev
```

### Database debugging

```python
# backend/debug.py
from db import get_db
from models import User

db = get_db()

# List all users
users = list(db.users.find().limit(5))
for user in users:
    print(f"{user['email']}: {user['name']}")

# Check collection size
print(f"Total users: {db.users.count_documents({})}")
print(f"Total incidents: {db.incidents.count_documents({})}")
```

---

## Getting Help

### Before asking for help, gather:
1. Full error message and stack trace
2. `.env.local` (with secrets redacted)
3. Output from `docker-compose logs`
4. Backend logs: `gcloud run logs read zero-trust-backend`
5. Frontend console errors: Press F12 in browser

### Resources:
- **FastAPI Docs**: http://localhost:8000/docs (interactive)
- **Next.js Errors**: https://nextjs.org/docs/messages
- **MongoDB Atlas Status**: https://status.mongodb.com/
- **GCP Status**: https://status.cloud.google.com/

---

## FAQ

**Q: Can I use PostgreSQL instead of MongoDB?**
A: The code is written for MongoDB. To use PostgreSQL, you'd need to rewrite models.py and db.py.

**Q: How do I backup my MongoDB data?**
A: MongoDB Atlas has automatic daily backups. Download from Console → Backup → Download.

**Q: Can I run this without Docker?**
A: Yes! Manual setup in SETUP.md explains running services directly.

**Q: What if I forget my password?**
A: Password reset not implemented yet. Delete user from DB and create new account.

**Q: How do I add more users?**
A: Use the registration page or create via admin panel (coming soon).

**Q: Can I run frontend and backend on same server?**
A: Yes, use Nginx as reverse proxy or deploy both to Cloud Run.

**Q: How often does the risk engine update?**
A: On every API call. Batch processing not implemented yet.

**Q: Can I export incident data?**
A: Export via MongoDB Compass or write CSV export endpoint (future feature).
