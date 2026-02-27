# Resources & External Links

Complete list of external services, documentation, and tools needed for the Zero Trust Security Platform.

## Required Services (Setup Once)

### MongoDB Atlas - Database
**What it is**: Cloud-hosted MongoDB database (required for data persistence)
- **Website**: https://www.mongodb.com/cloud/atlas
- **Sign up**: https://www.mongodb.com/cloud/atlas/register
- **Pricing**: Free tier (512MB storage, 100 connections)
- **Setup guide**: [docs/MONGODB_SETUP.md](./MONGODB_SETUP.md)
- **Quick link**: Create account → Create free cluster → Get connection string

### Google Cloud Platform (GCP) - Cloud Deployment
**What it is**: Infrastructure for running backend and databases in the cloud
- **Website**: https://cloud.google.com/
- **Sign up**: https://console.cloud.google.com/
- **Pricing**: Free tier ($300 credit, free services)
- **Services used**:
  - Cloud Run (backend)
  - Artifact Registry (Docker images)
  - Secret Manager (credentials)
  - Cloud Build (CI/CD)
- **Setup guide**: [docs/GCP_SETUP.md](./GCP_SETUP.md)

### Vercel - Frontend Deployment (Optional)
**What it is**: Platform optimized for Next.js deployment
- **Website**: https://vercel.com/
- **Sign up**: https://vercel.com/signup
- **Pricing**: Free tier (great for hobbyists)
- **Documentation**: https://vercel.com/docs
- **Why**: Seamless Next.js integration, auto-scaling, CDN included

## Development Tools

### Required

#### Node.js & pnpm
**For frontend development**
- **Download**: https://nodejs.org/ (LTS version 18+)
- **pnpm**: https://pnpm.io/
- **Install**: `npm install -g pnpm`
- **Alternative**: npm or yarn also work

#### Python
**For backend development**
- **Download**: https://www.python.org/downloads/ (3.9+)
- **Why**: FastAPI backend runs on Python
- **Check version**: `python --version`

#### Docker & Docker Compose
**For containerized development**
- **Download**: https://www.docker.com/products/docker-desktop
- **Why**: Run entire stack (frontend + backend + database) with one command
- **Alternative**: Manual setup without Docker (see SETUP.md)

#### Code Editor
Recommended:
- **VS Code**: https://code.visualstudio.com/ (recommended)
- **WebStorm**: https://www.jetbrains.com/webstorm/
- **PyCharm**: https://www.jetbrains.com/pycharm/

### Optional but Recommended

#### MongoDB Compass
**Database GUI tool**
- **Download**: https://www.mongodb.com/products/compass
- **Why**: Browse/edit database visually
- **Alternative**: Use MongoDB Atlas web interface

#### Postman
**API testing tool**
- **Download**: https://www.postman.com/downloads/
- **Why**: Test backend endpoints easily
- **Alternative**: Use curl commands or browser dev tools

#### Git & GitHub
**Version control**
- **Download**: https://git-scm.com/
- **GitHub**: https://github.com/
- **Why**: Store and version control your code

## Documentation & Learning

### Frontend (Next.js + React)

| Resource | Link | Purpose |
|----------|------|---------|
| Next.js Official Docs | https://nextjs.org/docs | Complete Next.js guide |
| React Documentation | https://react.dev/ | React hooks, components |
| TypeScript Handbook | https://www.typescriptlang.org/docs/ | TypeScript learning |
| Tailwind CSS | https://tailwindcss.com/docs | Styling framework |
| shadcn/ui | https://ui.shadcn.com/ | Component library |
| Recharts | https://recharts.org/ | Chart library |

### Backend (Python + FastAPI)

| Resource | Link | Purpose |
|----------|------|---------|
| FastAPI Docs | https://fastapi.tiangolo.com/ | FastAPI complete guide |
| Python Docs | https://docs.python.org/3/ | Python reference |
| Pydantic | https://docs.pydantic.dev/ | Data validation |
| PyMongo | https://pymongo.readthedocs.io/ | MongoDB driver |
| Uvicorn | https://www.uvicorn.org/ | ASGI server |
| Isolation Forest | https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html | ML algorithm docs |

### Database (MongoDB)

| Resource | Link | Purpose |
|----------|------|---------|
| MongoDB Docs | https://docs.mongodb.com/ | Complete MongoDB guide |
| MongoDB Atlas | https://docs.atlas.mongodb.com/ | Cloud MongoDB docs |
| MongoDB Compass | https://www.mongodb.com/docs/compass/current/ | GUI tool docs |
| MongoDB Charts | https://www.mongodb.com/docs/charts/ | Visualization |
| MongoDB University | https://university.mongodb.com/ | Free courses |

### Cloud & DevOps (Google Cloud Platform)

| Resource | Link | Purpose |
|----------|------|---------|
| GCP Documentation | https://cloud.google.com/docs | Complete GCP guide |
| Cloud Run Guide | https://cloud.google.com/run/docs | Backend deployment |
| Cloud Build Guide | https://cloud.google.com/build/docs | CI/CD setup |
| Secret Manager | https://cloud.google.com/secret-manager/docs | Secrets docs |
| Artifact Registry | https://cloud.google.com/artifact-registry/docs | Image registry |
| gcloud CLI Docs | https://cloud.google.com/sdk/gcloud | Command line tool |

### Authentication & Security

| Resource | Link | Purpose |
|----------|------|---------|
| JWT.io | https://jwt.io/ | JWT understanding |
| OWASP Security | https://owasp.org/ | Security best practices |
| bcrypt docs | https://github.com/pyca/bcrypt | Password hashing |

## API References

### Project APIs (Available once running)

**Local Development**:
- **FastAPI Swagger UI**: http://localhost:8000/docs
- **FastAPI ReDoc**: http://localhost:8000/redoc
- **Frontend**: http://localhost:3000

**Interactive Features**:
- Try endpoints directly in Swagger UI
- See request/response examples
- Auto-generated from FastAPI code

## Community & Support

### Get Help

| Channel | Link | Best For |
|---------|------|----------|
| Stack Overflow | https://stackoverflow.com/ | Technical questions |
| GitHub Issues | https://github.com/ | Bug reports |
| FastAPI Discussions | https://github.com/tiangolo/fastapi/discussions | Framework questions |
| MongoDB Community | https://www.mongodb.com/community/forums/ | Database questions |
| GCP Support | https://cloud.google.com/support | Cloud issues |

### Community Forums

- **FastAPI**: https://github.com/tiangolo/fastapi/discussions
- **Next.js**: https://github.com/vercel/next.js/discussions
- **MongoDB**: https://www.mongodb.com/community/forums/
- **Python**: https://www.python.org/community/lists/

## Example Code & Tutorials

### Similar Projects
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Zero Trust Model**: https://www.nist.gov/publications/zero-trust-architecture
- **Anomaly Detection**: https://scikit-learn.org/stable/modules/anomaly.html

### Video Tutorials
- **FastAPI Tutorial**: https://www.youtube.com/watch?v=7t2alSnE2-I
- **Next.js Tutorial**: https://www.youtube.com/watch?v=1sLbHbVasFA
- **MongoDB Tutorial**: https://www.youtube.com/watch?v=ofme2o29ngU
- **GCP Basics**: https://www.youtube.com/watch?v=sAqV-FqZj8E

## Deployment Guides

### Complete Deployment Flow

1. **Local Setup**: [docs/QUICK_START.md](./QUICK_START.md)
2. **Database**: [docs/MONGODB_SETUP.md](./MONGODB_SETUP.md)
3. **GCP Cloud**: [docs/GCP_SETUP.md](./GCP_SETUP.md)
4. **Frontend**: Use Vercel or GCP Cloud Run
5. **Monitoring**: GCP Cloud Console

### Deployment Platforms

| Platform | Best For | Cost | Setup Time |
|----------|----------|------|-----------|
| GCP Cloud Run | Full-stack | $0-10/month | 30 minutes |
| Vercel | Frontend only | Free | 5 minutes |
| AWS Lambda | Serverless functions | $0-5/month | 20 minutes |
| Heroku | Quick deployment | $7/month | 10 minutes |
| Docker Swarm | Self-hosted | Self-hosted | 1 hour |
| Kubernetes (K8s) | Enterprise | Self-hosted | 2+ hours |

## Performance & Monitoring Tools

### Local Development
- **Chrome DevTools**: Press F12 in browser
- **Network tab**: Monitor API calls
- **Console**: Debug JavaScript
- **Memory tab**: Check for memory leaks

### Production Monitoring (GCP)
- **Cloud Monitoring**: https://cloud.google.com/monitoring
- **Cloud Logging**: https://cloud.google.com/logging
- **Cloud Trace**: https://cloud.google.com/trace
- **Cloud Profiler**: https://cloud.google.com/profiler

### Open Source Tools
- **Prometheus**: https://prometheus.io/ (metrics)
- **Grafana**: https://grafana.com/ (dashboards)
- **ELK Stack**: https://www.elastic.co/what-is/elk-stack (logging)
- **Jaeger**: https://www.jaegertracing.io/ (tracing)

## AI/ML Resources (Optional)

For understanding the risk engine:
- **Scikit-learn Docs**: https://scikit-learn.org/
- **Isolation Forest Paper**: https://cs.nju.edu.cn/zhouzh/zhouzh.files/publication/icdm08.pdf
- **ML Mastery**: https://machinelearningmastery.com/
- **Fast.ai**: https://www.fast.ai/

## Command Reference

### npm/pnpm Commands
```bash
pnpm install              # Install dependencies
pnpm dev                  # Start development server
pnpm build                # Build for production
pnpm lint                 # Check code style
```

### Python Commands
```bash
pip install -r requirements.txt  # Install dependencies
python -m venv venv               # Create virtual environment
source venv/bin/activate          # Activate (Linux/Mac)
pip list                          # Show installed packages
```

### Docker Commands
```bash
docker-compose up                 # Start all services
docker-compose down               # Stop all services
docker-compose logs -f backend    # View backend logs
docker ps                         # List running containers
```

### GCP Commands
```bash
gcloud auth login                 # Authenticate
gcloud config set project PROJECT_ID  # Set project
gcloud run deploy ...             # Deploy to Cloud Run
gcloud secrets list               # List secrets
```

## Checklists

### Pre-Deployment Checklist
- [ ] MongoDB Atlas cluster created
- [ ] Database user created with strong password
- [ ] Network whitelist configured
- [ ] Connection string tested locally
- [ ] JWT secret generated (32+ chars)
- [ ] .env.local file configured
- [ ] Database collections initialized
- [ ] Backend tests passing
- [ ] Frontend builds without errors

### Post-Deployment Checklist
- [ ] Backend URL accessible
- [ ] Health check endpoint responding
- [ ] Frontend loads without errors
- [ ] Login functionality works
- [ ] API calls working from frontend
- [ ] Logs can be viewed (Cloud Logging)
- [ ] Secrets are secure (Secret Manager)
- [ ] Database backups configured
- [ ] Monitoring alerts set up
- [ ] HTTPS enforced

## FAQ - External Services

### Q: Do I need to pay for MongoDB?
**A**: No! Free tier includes 512MB storage and 100 connections - perfect for development.

### Q: Do I need to pay for GCP?
**A**: No! Free tier includes $300 credit and many free services. Cloud Run has generous free tier.

### Q: Can I use other databases?
**A**: Code uses MongoDB. To use PostgreSQL, would need to rewrite models and db connection.

### Q: Can I deploy without GCP?
**A**: Yes! Can use AWS, Azure, Heroku, or self-hosted. See DEPLOYMENT.md for options.

### Q: Is Vercel required for frontend?
**A**: No, optional. Can use GCP Cloud Run, Netlify, AWS Amplify, or self-host.

---

**Last Updated**: 2026-02-27  
**Total Resources**: 50+ links  
**All links verified**: ✅ 2024
