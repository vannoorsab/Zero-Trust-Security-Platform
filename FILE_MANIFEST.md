# Project File Manifest

Complete inventory of all files in the Zero Trust Security Platform.

## 📋 Quick Overview
- **Total Files**: 40+
- **Frontend Files**: 15+
- **Backend Files**: 8
- **Documentation Files**: 8+
- **Configuration Files**: 10+

---

## 🎨 Frontend (Next.js + React)

### Pages & Routes
| File | Purpose | Size |
|------|---------|------|
| `app/page.tsx` | Home landing page | 146 lines |
| `app/login/page.tsx` | User login form | 134 lines |
| `app/register/page.tsx` | User registration form | 170 lines |
| `app/dashboard/page.tsx` | Admin dashboard with metrics | 338 lines |
| `app/dashboard/user/page.tsx` | User personal dashboard | 286 lines |
| `app/dashboard/incidents/page.tsx` | Incident management page | 169 lines |
| `app/dashboard/users/page.tsx` | User management page | 171 lines |
| `app/layout.tsx` | Root layout with metadata | ~100 lines |

### Components
| File | Purpose |
|------|---------|
| `components/DashboardLayout.tsx` | Dashboard wrapper/navigation | 142 lines |
| `components/ProtectedRoute.tsx` | Auth protection wrapper | 23 lines |
| `components/ui/*` | shadcn/ui components (default) | ~50+ files |

### Hooks & Utilities
| File | Purpose | Size |
|------|---------|------|
| `hooks/useApi.ts` | Custom API client hook | 100 lines |
| `hooks/use-mobile.ts` | Mobile responsiveness hook | (default) |
| `lib/auth.ts` | Authentication utilities | 84 lines |
| `lib/utils.ts` | General utilities (cn function) | (default) |

### Styling
| File | Purpose |
|------|---------|
| `app/globals.css` | Global styles & dark theme colors |
| `app/layout.tsx` | Font configuration |

### Configuration
| File | Purpose |
|------|---------|
| `package.json` | Dependencies & scripts |
| `tsconfig.json` | TypeScript configuration |
| `next.config.mjs` | Next.js configuration |
| `tailwind.config.js` | Tailwind CSS config |

### Assets
| Directory | Contents |
|-----------|----------|
| `public/` | Static files (images, fonts, etc.) |

---

## 🐍 Backend (Python + FastAPI)

### Core Application
| File | Purpose | Size | Lines |
|------|---------|------|-------|
| `backend/main.py` | FastAPI application | **CRITICAL** | 320 |
| `backend/models.py` | Pydantic data schemas | CORE | 73 |
| `backend/db.py` | MongoDB connection | CORE | 76 |
| `backend/utils.py` | Helper functions | CORE | 86 |
| `backend/risk_engine.py` | ML anomaly detection | **CRITICAL** | 260 |
| `backend/demo.py` | Demo data generator | OPTIONAL | 213 |

### Deployment
| File | Purpose |
|------|---------|
| `backend/Dockerfile` | Docker image for backend |
| `backend/.dockerignore` | Docker ignore rules |
| `backend/requirements.txt` | Python dependencies |

### Scripts
| File | Purpose | Size |
|------|---------|------|
| `scripts/init-mongodb.py` | MongoDB initialization | 156 |

---

## 🗄️ Database (MongoDB)

### Collections (Auto-created by init script)
| Collection | Purpose | Indexes |
|-----------|---------|---------|
| `users` | User accounts & profiles | email (unique), created_at, is_admin |
| `behavior_logs` | User activities & logins | user_id, timestamp, TTL (90 days) |
| `incidents` | Detected anomalies | user_id, timestamp, severity, status |

### Initialization
- **Script**: `scripts/init-mongodb.py`
- **Creates**: Collections with proper indexes
- **Runs once**: On first setup

---

## 🚀 Deployment & DevOps

### Local Development
| File | Purpose | Size |
|------|---------|------|
| `docker-compose.yml` | Multi-container setup | 75 lines |
| `.env.example` | Environment template | 29 lines |
| `.env.local` | Local environment (create from example) | REQUIRED |

### Cloud Deployment (Google Cloud)
| File | Purpose | Size |
|------|---------|------|
| `cloudbuild.yaml` | Cloud Build CI/CD pipeline | 42 lines |
| `cloud-run-config.yaml` | Cloud Run deployment config | 51 lines |
| `Dockerfile.frontend` | Next.js container image | 55 lines |

### Utilities
| File | Purpose |
|------|---------|
| `Makefile` | Build commands & helpers | 86 lines |

---

## 📚 Documentation (8 Guides)

### Getting Started
| File | Purpose | Size | Read Time |
|------|---------|------|-----------|
| `docs/QUICK_START.md` | 5-minute setup guide | 276 lines | 5 min |
| `docs/INDEX.md` | Documentation navigation | 277 lines | 10 min |

### Configuration & Setup
| File | Purpose | Size | Read Time |
|------|---------|------|-----------|
| `docs/MONGODB_SETUP.md` | MongoDB Atlas configuration | 104 lines | 15 min |
| `docs/GCP_SETUP.md` | Google Cloud deployment | 250 lines | 30 min |
| `docs/ENVIRONMENT_VARIABLES.md` | Config reference | 324 lines | 20 min |

### Help & Support
| File | Purpose | Size | Read Time |
|------|---------|------|-----------|
| `docs/TROUBLESHOOTING.md` | Common issues & FAQ | 505 lines | 30 min |
| `docs/RESOURCES_AND_LINKS.md` | External links (50+) | 313 lines | 15 min |

### Project Overview
| File | Purpose | Size |
|------|---------|------|
| `README.md` | Project overview & architecture | 331 lines |
| `SETUP.md` | Detailed local setup | 282 lines |
| `DEPLOYMENT.md` | Advanced deployment guide | 130 lines |
| `PROJECT_SUMMARY.md` | Project completion summary | 424 lines |

---

## 🎯 Configuration & Reference

### Quick Reference
| File | Purpose |
|------|---------|
| `QUICK_REFERENCE.txt` | Quick commands & links |
| `FILE_MANIFEST.md` | This file - complete inventory |

### Version Control
| File | Purpose |
|------|---------|
| `.gitignore` | Git ignore rules (updated) |
| `.git/` | Git repository |

### Environment
| File | Purpose |
|------|---------|
| `.env.example` | Environment variables template |
| `.env.local` | Local dev environment (create this) |

---

## 📁 Full Directory Tree

```
zero-trust-security/
│
├── 📂 app/                                 # Next.js App Router
│   ├── page.tsx                           # Home page
│   ├── layout.tsx                         # Root layout
│   ├── globals.css                        # Dark theme
│   ├── 📂 login/
│   │   └── page.tsx                      # Login page
│   ├── 📂 register/
│   │   └── page.tsx                      # Registration
│   └── 📂 dashboard/
│       ├── page.tsx                      # Admin dashboard
│       ├── 📂 user/
│       │   └── page.tsx                  # User dashboard
│       ├── 📂 incidents/
│       │   └── page.tsx                  # Incidents page
│       └── 📂 users/
│           └── page.tsx                  # Users management
│
├── 📂 backend/                            # FastAPI Backend
│   ├── main.py                            # FastAPI app (320 lines)
│   ├── models.py                          # Data models
│   ├── db.py                              # MongoDB connection
│   ├── utils.py                           # Auth utilities
│   ├── risk_engine.py                     # ML anomaly detection (260 lines)
│   ├── demo.py                            # Demo data generator
│   ├── Dockerfile                         # Container image
│   ├── .dockerignore                      # Docker ignore
│   ├── requirements.txt                   # Python deps
│   └── 📂 scripts/
│       └── init-mongodb.py                # DB initialization
│
├── 📂 components/                         # React Components
│   ├── DashboardLayout.tsx                # Dashboard wrapper
│   ├── ProtectedRoute.tsx                 # Auth guard
│   └── 📂 ui/                             # shadcn/ui components
│
├── 📂 hooks/                              # Custom Hooks
│   ├── useApi.ts                          # API client
│   └── use-mobile.ts                      # Mobile detect
│
├── 📂 lib/                                # Utilities
│   ├── auth.ts                            # Auth helpers
│   └── utils.ts                           # General utilities
│
├── 📂 public/                             # Static Assets
│   └── (images, fonts, etc.)
│
├── 📂 docs/                               # Documentation (8 files)
│   ├── INDEX.md                           # Navigation guide
│   ├── QUICK_START.md                     # Quick setup
│   ├── MONGODB_SETUP.md                   # MongoDB config
│   ├── GCP_SETUP.md                       # GCP deployment
│   ├── ENVIRONMENT_VARIABLES.md           # Config reference
│   ├── TROUBLESHOOTING.md                 # Problem solving
│   ├── RESOURCES_AND_LINKS.md             # External links
│   └── (potentially more)
│
├── 📄 README.md                           # Project overview
├── 📄 SETUP.md                            # Local setup guide
├── 📄 DEPLOYMENT.md                       # Deployment guide
├── 📄 PROJECT_SUMMARY.md                  # Completion summary
├── 📄 QUICK_REFERENCE.txt                 # Quick reference card
├── 📄 FILE_MANIFEST.md                    # This file
│
├── 📄 docker-compose.yml                  # Local development
├── 📄 cloudbuild.yaml                     # GCP CI/CD
├── 📄 cloud-run-config.yaml               # Cloud Run config
│
├── 📄 .env.example                        # Env template
├── 📄 .env.local                          # Local env (create this)
├── 📄 .gitignore                          # Git ignore
│
├── 📄 package.json                        # Frontend deps
├── 📄 tsconfig.json                       # TypeScript config
├── 📄 next.config.mjs                     # Next.js config
├── 📄 tailwind.config.js                  # Tailwind config
│
└── 📄 Makefile                            # Build commands
```

---

## 🔑 Critical Files (Don't Delete!)

| File | Reason |
|------|--------|
| `backend/main.py` | FastAPI application |
| `backend/risk_engine.py` | ML anomaly detection |
| `backend/db.py` | Database connection |
| `app/layout.tsx` | Root layout & metadata |
| `app/dashboard/page.tsx` | Admin dashboard |
| `docker-compose.yml` | Local development setup |
| `scripts/init-mongodb.py` | Database initialization |

---

## 📊 File Statistics

### By Type
| Type | Count | Lines |
|------|-------|-------|
| Python Files | 6 | 1,100+ |
| TypeScript/TSX | 15+ | 2,000+ |
| YAML Config | 3 | 150+ |
| Markdown Docs | 8+ | 2,500+ |
| Configuration | 10+ | 400+ |
| **Total** | **40+** | **6,000+** |

### By Purpose
| Category | Files | Purpose |
|----------|-------|---------|
| Frontend | 15+ | UI and user interaction |
| Backend | 8 | API and business logic |
| Documentation | 8+ | Learning and guidance |
| Configuration | 10+ | Setup and deployment |
| DevOps | 5 | Containerization and CI/CD |

---

## 🚀 Getting Started Files

**Read First:**
1. `QUICK_REFERENCE.txt` - Overview & commands
2. `README.md` - Project description
3. `docs/QUICK_START.md` - 5-minute setup

**Setup Files:**
1. `.env.example` → Copy to `.env.local`
2. `backend/requirements.txt` → For Python dependencies
3. `package.json` → For frontend dependencies

**Run Files:**
1. `docker-compose.yml` → Start everything
2. `backend/scripts/init-mongodb.py` → Initialize database

---

## 📝 Important Notes

### Never Delete
- ✅ `backend/main.py` - Core API
- ✅ `backend/risk_engine.py` - ML engine
- ✅ `docker-compose.yml` - Development setup
- ✅ `.env.example` - Template reference

### Create Before Running
- ✅ `.env.local` - Copy from `.env.example`
- ✅ MongoDB Atlas account
- ✅ GCP account (for production)

### Don't Commit
- ❌ `.env.local` - Contains secrets
- ❌ `node_modules/` - Install with npm/pnpm
- ❌ `backend/__pycache__/` - Python cache
- ❌ `.next/` - Next.js build output

---

## 🔄 File Dependencies

### Backend Dependencies
```
main.py
  ├── imports: models, db, utils, risk_engine, demo
  └── requires: requirements.txt

risk_engine.py
  ├── imports: models
  └── requires: scikit-learn, numpy

demo.py
  ├── imports: models, db, risk_engine
  └── requires: random, datetime
```

### Frontend Dependencies
```
page.tsx (any route)
  ├── imports: components, hooks, lib
  ├── requires: next, react
  └── calls: /api/* backend endpoints

layout.tsx
  ├── imports: app/globals.css
  └── defines: global metadata
```

### Database Dependencies
```
MongoDB
  ├── required by: backend (all files)
  ├── required by: scripts/init-mongodb.py
  └── contains: users, behavior_logs, incidents collections
```

---

## 📦 Installation Files

### Python (`backend/requirements.txt`)
```
fastapi==0.115.4
uvicorn==0.30.0
pymongo==4.8.1
pydantic==2.8.2
python-jose==3.3.0
passlib==1.7.4
python-multipart==0.0.6
scikit-learn==1.5.2
numpy==1.26.4
python-dotenv==1.0.1
```

### Node.js (`package.json`)
- next: ^15.1.0
- react: ^19.0.0
- typescript: ^5.x
- tailwindcss: ^4.x
- shadcn/ui: components

---

## 🔐 Security Sensitive Files

**These files contain or can generate secrets:**
- `.env.local` - **NEVER commit!**
- `.env.example` - Safe to commit (template only)
- `backend/utils.py` - Password hashing logic
- `backend/main.py` - JWT token generation

**Best Practices:**
- ✅ Add `.env.local` to `.gitignore`
- ✅ Store secrets in environment variables
- ✅ Use GCP Secret Manager for production
- ✅ Never share `.env.local`

---

## 📤 Files for Deployment

### For Docker
- `backend/Dockerfile` - Backend image
- `Dockerfile.frontend` - Frontend image
- `docker-compose.yml` - Local dev only
- `backend/requirements.txt` - Python deps

### For GCP Cloud Build
- `cloudbuild.yaml` - Build configuration
- `cloud-run-config.yaml` - Deployment manifest
- `.gcloudignore` (optional) - What to exclude

### For Vercel
- `package.json` - Dependencies
- `next.config.mjs` - Next.js config
- `.env.local` - (set in Vercel dashboard)

---

## 🆘 Troubleshooting Files

**Can't find what you need?**
1. Check: `QUICK_REFERENCE.txt`
2. Search: `docs/INDEX.md` (navigation guide)
3. Read: `docs/TROUBLESHOOTING.md` (common issues)
4. Reference: `docs/RESOURCES_AND_LINKS.md` (external help)

---

## 📋 Checklist: What You Have

- ✅ Full-stack application files
- ✅ Complete documentation (8 guides)
- ✅ Configuration templates (.env.example)
- ✅ Docker setup (docker-compose.yml)
- ✅ Cloud deployment configs (GCP, Vercel)
- ✅ Database initialization script
- ✅ Quick reference guides
- ✅ This file manifest

**You're ready to:**
- ✅ Run locally
- ✅ Deploy to production
- ✅ Extend features
- ✅ Debug issues
- ✅ Scale the application

---

**Last Updated**: 2026-02-27  
**Total Files**: 40+  
**Total Lines**: 6,000+  
**Status**: ✅ Complete & Production Ready
