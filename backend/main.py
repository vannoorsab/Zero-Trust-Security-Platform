"""
Zero Trust Security Platform — FastAPI Backend
===============================================
AI-driven behavioral monitoring, risk scoring, adaptive access control.
"""

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional, List
import jwt
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

from db import get_db_connection, init_db
from utils import hash_password, verify_password, generate_session_id, generate_otp
from email_utils import send_access_notification
from risk_engine import evaluate_session_risk

app = FastAPI(title="Zero Trust Security API", version="2.0.0")

@app.get("/")
async def root():
    return {"message": "Zero Trust Security API is running. Access /api/health for status or /docs for documentation."}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()
SECRET_KEY = os.getenv("JWT_SECRET", "zero-trust-hackathon-secret-key-2024")
ALGORITHM = "HS256"
TOKEN_HOURS = 24

# ═══════════════════════════════════════════════════════════════════════
#  REQUEST / RESPONSE MODELS
# ═══════════════════════════════════════════════════════════════════════

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "user"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    role: str
    session_id: str
    mfa_required: bool = False

class AdminActionRequest(BaseModel):
    action: str
    reason: str

class SimulateRequest(BaseModel):
    target_user_id: Optional[str] = None

class AppCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    url: Optional[str] = None

class UserCredentialCreateRequest(BaseModel):
    user_id: str
    username: str
    password: str
    client_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class LoginWindowCreateRequest(BaseModel):
    user_id: str
    app_id: str
    allowed_start: str
    allowed_end: str

class EmergencyRequestCreate(BaseModel):
    app_id: str
    reason: Optional[str] = None

class EmergencyDecision(BaseModel):
    approve: bool
    reason: Optional[str] = None

class AppLoginRequest(BaseModel):
    app_id: str
    username: str
    password: str

class AppActionRequest(BaseModel):
    app_id: str
    action: str
    is_sensitive: bool = False
    details: Optional[str] = None
    metadata: Optional[dict] = None

# ═══════════════════════════════════════════════════════════════════════
#  AUTH HELPERS
# ═══════════════════════════════════════════════════════════════════════

def create_token(user_id: str, email: str, session_id: str) -> str:
    return jwt.encode({
        "user_id": user_id, "email": email, "session_id": session_id,
        "exp": datetime.utcnow() + timedelta(hours=TOKEN_HOURS),
        "iat": datetime.utcnow(),
    }, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        return jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")


async def get_current_user(payload: dict = Depends(decode_token)):
    uid = payload.get("user_id")
    sid = payload.get("session_id")
    if not uid or not sid:
        raise HTTPException(401, "Invalid token payload")
    db = get_db_connection()
    session = db["sessions"].find_one({"session_id": sid, "user_id": uid})
    if not session or session.get("revoked"):
        raise HTTPException(401, "Session revoked or invalid")
    if isinstance(session.get("expires_at"), datetime) and session["expires_at"] < datetime.utcnow():
        raise HTTPException(401, "Session expired")
    user = db["users"].find_one({"_id": uid})
    if not user:
        raise HTTPException(404, "User not found")
    db["sessions"].update_one({"session_id": sid}, {"$set": {"last_activity": datetime.utcnow()}})
    return user, session


def require_admin(auth_data: tuple = Depends(get_current_user)):
    user, session = auth_data
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin access required")
    return user, session

# ═══════════════════════════════════════════════════════════════════════
#  AUTH ROUTES
# ═══════════════════════════════════════════════════════════════════════

@app.post("/api/auth/register", response_model=TokenResponse)
async def register(data: UserRegister):
    db = get_db_connection()
    if db["users"].find_one({"email": data.email}):
        raise HTTPException(400, "Email already registered")

    user_doc = {
        "email": data.email, "password": hash_password(data.password),
        "name": data.name, "role": data.role, "mfa_enabled": False,
        "risk_score": 0.0, "access_level": "full",
        "is_active": True, "is_under_investigation": False,
        "created_at": datetime.utcnow(),
    }
    result = db["users"].insert_one(user_doc)
    uid = str(result.inserted_id)
    sid = generate_session_id()

    db["sessions"].insert_one({
        "session_id": sid, "user_id": uid,
        "device_fingerprint": "registration", "ip_address": "127.0.0.1",
        "user_agent": "registration", "start_time": datetime.utcnow(),
        "last_activity": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=TOKEN_HOURS),
        "mfa_verified": True, "risk_at_login": 0.0, "revoked": False,
    })

    token = create_token(uid, data.email, sid)
    return TokenResponse(
        access_token=token, expires_in=TOKEN_HOURS * 3600,
        role=data.role, session_id=sid, mfa_required=False,
    )


@app.post("/api/auth/login", response_model=TokenResponse)
async def login(creds: UserLogin, request: Request):
    db = get_db_connection()
    user = db["users"].find_one({"email": creds.email})
    if not user or not verify_password(creds.password, user["password"]):
        if user:
            db["users"].update_one({"_id": user["_id"]}, {"$inc": {"failed_login_count": 1}})
        raise HTTPException(401, "Invalid credentials")

    uid = str(user["_id"])
    attempts = user.get("failed_login_count", 0) + 1
    db["users"].update_one({"_id": user["_id"]}, {"$set": {"failed_login_count": 0}})
    
    sid = generate_session_id()
    ip = request.client.host if request.client else "127.0.0.1"
    ua = request.headers.get("user-agent", "unknown")

    db["sessions"].insert_one({
        "session_id": sid, "user_id": uid,
        "device_fingerprint": ua[:60], "ip_address": ip,
        "user_agent": ua, "start_time": datetime.utcnow(),
        "last_activity": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=TOKEN_HOURS),
        "mfa_verified": True, "risk_at_login": user.get("risk_score", 0),
        "revoked": False,
        "login_attempt_count": attempts,
    })

    # Create session behavior record
    db["session_behavior"].insert_one({
        "session_id": sid, "user_id": uid,
        "login_timestamp": datetime.utcnow(), "ip_address": ip,
        "device_info": ua[:60], "location": "Detected",
        "accessed_services": [], "action_count": 0,
        "download_count": 0, "duration_minutes": 0,
        "service_switches": 0, "failed_access_attempts": 0,
    })

    # Evaluate risk at login
    risk = await evaluate_session_risk(uid, sid)
    risk_score = risk.get("score", 0) / 100.0
    db["sessions"].update_one({"session_id": sid}, {"$set": {"risk_at_login": risk_score}})

    token = create_token(uid, user["email"], sid)
    return TokenResponse(
        access_token=token, expires_in=TOKEN_HOURS * 3600,
        role=user["role"], session_id=sid, mfa_required=False,
    )


@app.post("/api/app-login")
async def app_login(data: AppLoginRequest, request: Request):
    db = get_db_connection()
    cred = db["user_credentials"].find_one({"app_id": data.app_id, "username": data.username})
    if not cred or not verify_password(data.password, cred["password_hash"]):
        raise HTTPException(401, "Invalid app credentials")
    
    uid = cred["user_id"]
    user = db["users"].find_one({"_id": uid})
    if not user or not user.get("is_active"):
        raise HTTPException(403, "User account disabled")
        
    sid = generate_session_id()
    ip = request.client.host if request.client else "127.0.0.1"
    ua = request.headers.get("user-agent", "unknown")

    db["sessions"].insert_one({
        "session_id": sid, "user_id": uid,
        "device_fingerprint": ua[:60], "ip_address": ip,
        "user_agent": ua, "start_time": datetime.utcnow(),
        "last_activity": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=TOKEN_HOURS),
        "mfa_verified": False, "risk_at_login": user.get("risk_score", 0),
        "revoked": False,
    })

    db["session_behavior"].insert_one({
        "session_id": sid, "user_id": uid,
        "login_timestamp": datetime.utcnow(), "ip_address": ip,
        "device_info": ua[:60], "location": "App Login",
        "accessed_services": [data.app_id], "action_count": 0,
        "download_count": 0, "duration_minutes": 0,
        "service_switches": 0, "failed_access_attempts": 0,
    })
    
    risk = await evaluate_session_risk(uid, sid)
    
    token = create_token(uid, user["email"], sid)
    return {"access_token": token, "session_id": sid, "user": {"name": user.get("name"), "id": str(user["_id"])}}

@app.post("/api/app-action")
async def app_action(data: AppActionRequest, request: Request, auth: tuple = Depends(get_current_user)):
    user, session = auth
    db = get_db_connection()
    sid = session["session_id"]
    uid = str(user["_id"])
    
    # Granular Activity Logging
    now = datetime.utcnow()
    activity_doc = {
        "user_id": uid,
        "session_id": sid,
        "app_id": data.app_id,
        "action": data.action,
        "details": data.details,
        "metadata": data.metadata or {},
        "timestamp": now
    }
    db["user_activity_logs"].insert_one(activity_doc)

    # Handle Module Sessions (Entry/Exit) for duration tracking
    if data.action == "enter_module":
        db["module_sessions"].update_one(
            {"user_id": uid, "session_id": sid, "app_id": data.app_id, "active": True},
            {"$set": {"enter_time": now, "active": True}},
            upsert=True
        )
    elif data.action == "exit_module":
        m_sess = db["module_sessions"].find_one({"user_id": uid, "session_id": sid, "app_id": data.app_id, "active": True})
        if m_sess:
            duration = (now - m_sess["enter_time"]).total_seconds()
            db["module_sessions"].update_one(
                {"_id": m_sess["_id"]},
                {"$set": {"exit_time": now, "duration_seconds": duration, "active": False}}
            )
            # Log the duration event
            db["user_activity_logs"].insert_one({
                "user_id": uid, "session_id": sid, "app_id": data.app_id,
                "action": "module_dwell", "duration": duration, "timestamp": now
            })

    risk = await evaluate_session_risk(uid, sid)
    return {"status": "success", "action": data.action, "risk_score": risk.get("score")}

@app.get("/api/admin/user/{user_id}/activity-analytics")
async def user_activity_analytics(user_id: str, auth: tuple = Depends(require_admin)):
    db = get_db_connection()
    
    # Get all logs for this user, sorted by time
    logs = list(db["user_activity_logs"].find({"user_id": user_id}).sort("timestamp", -1).limit(50))
    for log in logs:
        log["id"] = str(log.pop("_id"))
        log["timestamp"] = log["timestamp"].isoformat() + "Z"

    # Aggregate most used module
    pipeline = [
        {"$match": {"user_id": user_id, "action": "enter_module"}},
        {"$group": {"_id": "$app_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1}
    ]
    most_used = list(db["user_activity_logs"].aggregate(pipeline))
    
    # Aggregate total time per module
    dwell_pipeline = [
        {"$match": {"user_id": user_id, "duration_seconds": {"$exists": True}}},
        {"$group": {"_id": "$app_id", "total_duration": {"$sum": "$duration_seconds"}}}
    ]
    module_durations = list(db["module_sessions"].aggregate(dwell_pipeline))

    return {
        "recent_logs": logs,
        "most_used_module": most_used[0]["_id"] if most_used else None,
        "module_durations": {d["_id"]: d["total_duration"] for d in module_durations}
    }

@app.post("/api/admin/user/{user_id}/simulate-action")
async def simulate_user_action(user_id: str, data: AppActionRequest, auth: tuple = Depends(require_admin)):
    db = get_db_connection()
    
    # Use a dummy session_id for administrative simulation if none exists
    active_session = db["sessions"].find_one({"user_id": user_id, "revoked": False})
    sid = active_session["session_id"] if active_session else f"sim_{user_id}"

    now = datetime.utcnow()
    activity_doc = {
        "user_id": user_id,
        "session_id": sid,
        "app_id": data.app_id,
        "action": data.action,
        "details": data.details,
        "metadata": data.metadata or {"source": "admin_simulation"},
        "timestamp": now
    }
    db["user_activity_logs"].insert_one(activity_doc)

    if data.action == "enter_module":
        db["module_sessions"].update_one(
            {"user_id": user_id, "session_id": sid, "app_id": data.app_id, "active": True},
            {"$set": {"enter_time": now, "active": True}},
            upsert=True
        )
    elif data.action == "exit_module":
        m_sess = db["module_sessions"].find_one({"user_id": user_id, "session_id": sid, "app_id": data.app_id, "active": True})
        if m_sess:
            duration = (now - m_sess["enter_time"]).total_seconds()
            db["module_sessions"].update_one(
                {"_id": m_sess["_id"]},
                {"$set": {"exit_time": now, "duration_seconds": duration, "active": False}}
            )
    
    return {"status": "simulated", "user_id": user_id, "action": data.action}


# ═══════════════════════════════════════════════════════════════════════
#  USER ROUTES
# ═══════════════════════════════════════════════════════════════════════

@app.get("/api/user/profile")
async def get_profile(auth: tuple = Depends(get_current_user)):
    user, session = auth
    return {
        "id": str(user["_id"]), "email": user["email"],
        "name": user["name"], "role": user["role"],
        "created_at": user.get("created_at"),
        "risk_score": user.get("risk_score", 0),
        "access_level": user.get("access_level", "full"),
        "mfa_verified": session.get("mfa_verified", False),
    }


@app.get("/api/user/risk-score")
async def get_risk_score(auth: tuple = Depends(get_current_user)):
    user, session = auth
    result = await evaluate_session_risk(str(user["_id"]), session["session_id"])
    return {
        "overall_risk": result.get("score", 0) / 100.0,
        "behavioral_anomaly": next((b["raw_risk"] / 100 for b in result.get("breakdown", []) if b["factor"] == "behavioral_anomaly"), 0),
        "access_pattern_anomaly": next((b["raw_risk"] / 100 for b in result.get("breakdown", []) if b["factor"] == "unauthorized_service"), 0),
        "timestamp": datetime.utcnow(),
        "decision": result.get("decision", "ALLOW"),
        "breakdown": result.get("breakdown", []),
    }


@app.get("/api/user/activity")
async def get_activity(auth: tuple = Depends(get_current_user)):
    user, _ = auth
    db = get_db_connection()
    logs = list(db["behavior_logs"].find({"user_id": str(user["_id"])}).sort("timestamp", -1).limit(50))
    return [
        {"id": str(l["_id"]), "event_type": l.get("event_type"), "resource": l.get("resource"),
         "action": l.get("action"), "timestamp": l.get("timestamp")}
        for l in logs
    ]

# ═══════════════════════════════════════════════════════════════════════
#  ADMIN ROUTES
# ═══════════════════════════════════════════════════════════════════════

@app.get("/api/admin/dashboard")
async def admin_dashboard(auth: tuple = Depends(require_admin)):
    from risk_engine import calculate_all_risks
    return await calculate_all_risks()


@app.get("/api/admin/users")
async def admin_users(auth: tuple = Depends(require_admin)):
    db = get_db_connection()
    users = list(db["users"].find({}))
    return [
        {"id": str(u["_id"]), "email": u["email"], "name": u["name"],
         "role": u["role"], "created_at": u.get("created_at"),
         "risk_score": u.get("risk_score", 0),
         "access_level": u.get("access_level", "full"),
         "is_under_investigation": u.get("is_under_investigation", False),
         "is_active": u.get("is_active", True)}
        for u in users
    ]


@app.get("/api/admin/incidents")
async def admin_incidents(auth: tuple = Depends(require_admin)):
    db = get_db_connection()
    incidents = list(db["incidents"].find({}).sort("timestamp", -1).limit(100))
    return [
        {"id": str(i["_id"]), "user_id": i["user_id"],
         "risk_level": i["risk_level"], "incident_type": i["incident_type"],
         "description": i["description"], "ai_explanation": i.get("ai_explanation", ""),
         "timestamp": i["timestamp"], "action_taken": i["action_taken"],
         "resolved": i.get("resolved", False)}
        for i in incidents
    ]


@app.get("/api/admin/alerts")
async def admin_alerts(auth: tuple = Depends(require_admin)):
    db = get_db_connection()
    alerts = list(db["alerts"].find({}).sort("timestamp", -1).limit(100))
    out = []
    for a in alerts:
        user = db["users"].find_one({"_id": a["user_id"]})
        out.append({
            "id": str(a["_id"]), "user_id": a["user_id"],
            "user_name": user.get("name", "Unknown") if user else "Unknown",
            "severity": a["severity"], "status": a["status"],
            "description": a["description"], "timestamp": a["timestamp"],
            "acknowledged": a.get("acknowledged", False),
        })
    return out


@app.get("/api/admin/active-sessions")
async def admin_active_sessions(auth: tuple = Depends(require_admin)):
    db = get_db_connection()
    sessions = list(db["sessions"].find({"revoked": False}).sort("last_activity", -1))
    out = []
    for s in sessions:
        user = db["users"].find_one({"_id": s["user_id"]})
        sb = db["session_behavior"].find_one({"session_id": s["session_id"]})
        out.append({
            "session_id": s["session_id"],
            "user_id": str(s["user_id"]),
            "user_name": user.get("name") if user else "Unknown",
            "user_email": user.get("email") if user else "Unknown",
            "ip_address": s.get("ip_address"),
            "device": s.get("device_fingerprint"),
            "start_time": s.get("start_time").isoformat() + "Z" if isinstance(s.get("start_time"), datetime) else s.get("start_time"),
            "last_activity": s.get("last_activity").isoformat() + "Z" if isinstance(s.get("last_activity"), datetime) else s.get("last_activity"),
            "expires_at": s.get("expires_at").isoformat() + "Z" if isinstance(s.get("expires_at"), datetime) else s.get("expires_at"),
            "login_attempt_count": s.get("login_attempt_count", 1),
            "risk_at_login": s.get("risk_at_login", 0),
            "risk_score": user.get("risk_score", 0) if user else 0,
            "location": sb.get("location", "Unknown") if sb else "Unknown",
            "action_count": sb.get("action_count", 0) if sb else 0,
            "download_count": sb.get("download_count", 0) if sb else 0,
        })
    return out


@app.get("/api/admin/blocked-users")
async def admin_blocked_users(auth: tuple = Depends(require_admin)):
    db = get_db_connection()
    users = list(db["users"].find({"access_level": "blocked"}))
    return [
        {"id": str(u["_id"]), "email": u["email"], "name": u["name"],
         "risk_score": u.get("risk_score", 0),
         "is_under_investigation": u.get("is_under_investigation", False)}
        for u in users
    ]


@app.post("/api/admin/user/{user_id}/action")
async def admin_action(user_id: str, data: AdminActionRequest, request: Request, auth: tuple = Depends(require_admin)):
    admin_user, _ = auth
    db = get_db_connection()
    target = db["users"].find_one({"_id": user_id})
    if not target:
        raise HTTPException(404, "User not found")

    before = {"is_active": target.get("is_active"), "access_level": target.get("access_level"),
              "is_under_investigation": target.get("is_under_investigation")}

    if data.action == "lock_account":
        db["users"].update_one({"_id": user_id}, {"$set": {"is_active": False, "access_level": "blocked"}})
        db["sessions"].update_many({"user_id": user_id}, {"$set": {"revoked": True}})
    elif data.action == "force_logout":
        db["sessions"].update_many({"user_id": user_id}, {"$set": {"revoked": True}})
    elif data.action == "investigate":
        db["users"].update_one({"_id": user_id}, {"$set": {"is_under_investigation": True}})
    elif data.action == "mark_safe":
        db["users"].update_one({"_id": user_id}, {"$set": {
            "is_under_investigation": False, "risk_score": 0.0,
            "access_level": "full", "is_active": True,
        }})
    elif data.action == "unblock":
        db["users"].update_one({"_id": user_id}, {"$set": {"access_level": "full", "is_active": True}})
    elif data.action == "resolve_incident":
        db["users"].update_one({"_id": user_id}, {"$set": {"risk_score": 0.0, "is_under_investigation": False}})
        db["incidents"].update_many({"user_id": user_id}, {"$set": {"resolved": True}})
        db["alerts"].update_many({"user_id": user_id}, {"$set": {"status": "resolved", "acknowledged": True}})

    after_user = db["users"].find_one({"_id": user_id})
    after = {"is_active": after_user.get("is_active"), "access_level": after_user.get("access_level"),
             "is_under_investigation": after_user.get("is_under_investigation")}

    db["audit_trail"].insert_one({
        "admin_id": str(admin_user["_id"]), "target_user_id": user_id,
        "action": data.action, "reason": data.reason,
        "before_state": before, "after_state": after,
        "timestamp": datetime.utcnow(),
        "ip_address": request.client.host if request.client else "unknown",
    })
    return {"status": "success", "action": data.action}


@app.get("/api/admin/user/{user_id}/risk-history")
async def user_risk_history(user_id: str, auth: tuple = Depends(require_admin)):
    db = get_db_connection()
    history = list(db["risk_score_history"].find({"user_id": user_id}).sort("timestamp", -1).limit(50))
    return [
        {"old_score": h["old_score"], "new_score": h["new_score"],
         "delta": h["delta"], "factors": h["factors"],
         "timestamp": h["timestamp"], "triggered_by": h.get("triggered_by", "unknown")}
        for h in history
    ]


@app.get("/api/admin/user/{user_id}/sessions")
async def user_sessions(user_id: str, auth: tuple = Depends(require_admin)):
    db = get_db_connection()
    sessions = list(db["sessions"].find({"user_id": user_id}).sort("last_activity", -1))
    return [
        {"session_id": s["session_id"], "ip_address": s.get("ip_address"),
         "user_agent": s.get("user_agent", "")[:60],
         "last_activity": s.get("last_activity").isoformat() + "Z" if isinstance(s.get("last_activity"), datetime) else s.get("last_activity"),
         "expires_at": s.get("expires_at").isoformat() + "Z" if isinstance(s.get("expires_at"), datetime) else s.get("expires_at"),
         "login_attempt_count": s.get("login_attempt_count", 1),
         "start_time": s.get("start_time").isoformat() + "Z" if isinstance(s.get("start_time"), datetime) else s.get("start_time"),
         "mfa_verified": s.get("mfa_verified", False),
         "revoked": s.get("revoked", False),
         "risk_at_login": s.get("risk_at_login", 0)}
        for s in sessions
    ]


@app.get("/api/admin/user/{user_id}/risk-breakdown")
async def user_risk_breakdown(user_id: str, auth: tuple = Depends(require_admin)):
    """Get the latest risk breakdown for a user"""
    db = get_db_connection()
    latest = list(db["risk_score_history"].find({"user_id": user_id}).sort("timestamp", -1).limit(1))
    if not latest:
        return {"factors": [], "score": 0}
    entry = latest[0]
    return {"factors": entry.get("factors", []), "score": entry.get("new_score", 0) * 100,
            "timestamp": entry.get("timestamp")}


@app.get("/api/admin/audit-trail")
async def audit_trail(auth: tuple = Depends(require_admin)):
    db = get_db_connection()
    trail = list(db["audit_trail"].find({}).sort("timestamp", -1).limit(200))
    return [
        {"id": str(t["_id"]), "admin_id": t["admin_id"],
         "target_user_id": t["target_user_id"], "action": t["action"],
         "reason": t["reason"], "timestamp": t["timestamp"],
         "ip_address": t.get("ip_address")}
        for t in trail
    ]


# ── App management ──
@app.get("/api/admin/apps")
async def list_apps(auth: tuple = Depends(require_admin)):
    db = get_db_connection()
    apps = list(db["apps"].find({}))
    return [{"id": str(a["_id"]), "name": a.get("name"), "description": a.get("description"),
             "url": a.get("url")} for a in apps]

@app.post("/api/admin/apps")
async def create_app(data: AppCreateRequest, auth: tuple = Depends(require_admin)):
    db = get_db_connection()
    doc = {"name": data.name, "description": data.description, "url": data.url,
           "created_at": datetime.utcnow()}
    r = db["apps"].insert_one(doc)
    return {"id": str(r.inserted_id), "status": "created"}

# ── User credentials per app ──
@app.get("/api/admin/app/{app_id}/users")
async def list_app_users(app_id: str, auth: tuple = Depends(require_admin)):
    db = get_db_connection()
    creds = list(db["user_credentials"].find({"app_id": app_id}))
    return [{"id": str(c["_id"]), "user_id": c["user_id"], "username": c["username"]} for c in creds]

@app.post("/api/admin/app/{app_id}/user")
async def create_user_credential(app_id: str, data: UserCredentialCreateRequest, auth: tuple = Depends(require_admin)):
    db = get_db_connection()
    
    # Fetch details for the email notification
    user = db["users"].find_one({"_id": data.user_id})
    app_data = db["apps"].find_one({"_id": app_id})
    
    if not user or not app_data:
        raise HTTPException(404, "User or Application not found")

    doc = {"user_id": data.user_id, "app_id": app_id, "username": data.username,
           "password_hash": hash_password(data.password), "created_at": datetime.utcnow()}
    r = db["user_credentials"].insert_one(doc)
    
    # Trigger email alert
    send_access_notification(
        user_email=user["email"],
        user_name=user["name"],
        app_name=app_data["name"],
        username=data.username
    )
    
    return {"id": str(r.inserted_id), "status": "created"}

# ── Login windows ──
@app.get("/api/admin/login-windows")
async def list_login_windows(auth: tuple = Depends(require_admin)):
    db = get_db_connection()
    windows = list(db["login_windows"].find({}))
    return [{"id": str(w["_id"]), "user_id": w["user_id"], "app_id": w["app_id"],
             "allowed_start": w["allowed_start"], "allowed_end": w["allowed_end"]} for w in windows]

@app.post("/api/admin/login-windows")
async def create_login_window(data: LoginWindowCreateRequest, auth: tuple = Depends(require_admin)):
    db = get_db_connection()
    doc = data.dict()
    doc["created_at"] = datetime.utcnow()
    r = db["login_windows"].insert_one(doc)
    return {"id": str(r.inserted_id), "status": "created"}

# ── Emergency requests ──
@app.get("/api/admin/emergency-requests")
async def list_emergency_requests(auth: tuple = Depends(require_admin)):
    db = get_db_connection()
    reqs = list(db["emergency_requests"].find({"status": "pending"}))
    return [{"id": str(r["_id"]), "user_id": r["user_id"], "app_id": r["app_id"],
             "requested_at": r.get("requested_at"), "reason": r.get("reason")} for r in reqs]

@app.post("/api/auth/emergency-request")
async def create_emergency_request(data: EmergencyRequestCreate, auth: tuple = Depends(get_current_user)):
    user, _ = auth
    db = get_db_connection()
    doc = {"user_id": str(user["_id"]), "app_id": data.app_id,
           "requested_at": datetime.utcnow(), "status": "pending", "reason": data.reason}
    r = db["emergency_requests"].insert_one(doc)
    return {"request_id": str(r.inserted_id), "status": "pending"}

# ═══════════════════════════════════════════════════════════════════════
#  SIMULATION ROUTES
# ═══════════════════════════════════════════════════════════════════════

@app.post("/api/demo/simulate-attack")
async def simulate_attack_endpoint(data: SimulateRequest = None, auth: tuple = Depends(require_admin)):
    from demo import simulate_attack
    target_id = data.target_user_id if data else None
    result = await simulate_attack(target_id)
    return result


@app.post("/api/demo/simulate-anomaly")
async def simulate_anomaly_endpoint(auth: tuple = Depends(require_admin)):
    """Legacy endpoint — redirects to simulate-attack"""
    from demo import simulate_attack
    return await simulate_attack()

from fastapi.responses import Response

import os

@app.get("/api/downloads/hr/{filename}")
async def download_hr_file(filename: str):
    file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "hr.csv")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    else:
        content = "PersonID,PersonType,FullName,Gender,Age,Email,Phone,Department,Role,StudentID,Course,Year,CGPA,Status\nHR001,HR,Ramesh Kumar,Male,35,ramesh.hr@company.com,9876543210,Human Resources,HR Manager,,, , ,Active\nHR002,HR,Sneha Sharma,Female,29,sneha.hr@company.com,9123456780,Human Resources,HR Executive,,, , ,Active\nST001,Student,Anil Reddy,Male,21,anil.reddy@gmail.com,9012345678,, ,STU1001,Computer Science,3,8.4,Placed\nST002,Student,Priya Verma,Female,22,priya.verma@gmail.com,9098765432,, ,STU1002,Information Technology,4,7.9,Interview Scheduled\nST003,Student,Rahul Mehta,Male,20,rahul.mehta@gmail.com,9988776655,, ,STU1003,Mechanical Engineering,2,8.1,Not Placed\nST004,Student,Kavya Nair,Female,23,kavya.nair@gmail.com,8877665544,, ,STU1004,Electronics,4,8.7,Placed\nST005,Student,Amit Singh,Male,21,amit.singh@gmail.com,7766554433,, ,STU1005,Civil Engineering,3,7.2,Interview Scheduled\n"
    headers = {'Content-Disposition': f'attachment; filename="{filename}"'}
    return Response(content=content, media_type="text/csv", headers=headers)

@app.get("/api/downloads/finance/{filename}")
async def download_finance_file(filename: str):
    file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "company_financials.csv")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    else:
        content = "TransactionID,Date,Department,TransactionType,Description,Amount,PaymentMode,ApprovedBy,Status\nFIN001,2025-01-05,Sales,Income,Product Sales Invoice #INV1001,250000,Bank Transfer,CFO,Approved\nFIN002,2025-01-08,HR,Expense,Employee Salary - January,120000,Bank Transfer,CEO,Approved\nFIN003,2025-01-10,IT,Expense,Cloud Hosting Charges,45000,Credit Card,CTO,Approved\nFIN004,2025-01-12,Marketing,Expense,Social Media Ads,30000,UPI,CMO,Approved\nFIN005,2025-01-15,Finance,Expense,Audit & Compliance Fees,55000,Cheque,CFO,Pending\nFIN006,2025-01-18,Sales,Income,Client Project Payment,180000,Bank Transfer,CFO,Approved\nFIN007,2025-01-20,Operations,Expense,Office Rent - January,80000,Bank Transfer,CEO,Approved\nFIN008,2025-01-22,IT,Expense,Laptop Purchase,95000,Credit Card,CTO,Approved\nFIN009,2025-01-25,Sales,Income,Annual Maintenance Contract,120000,Bank Transfer,CFO,Approved\nFIN010,2025-01-28,HR,Expense,Training & Workshops,25000,Cash,HR Manager,Pending\n"
    headers = {'Content-Disposition': f'attachment; filename="{filename}"'}
    return Response(content=content, media_type="text/csv", headers=headers)

# ═══════════════════════════════════════════════════════════════════════
#  HEALTH & LIFECYCLE
# ═══════════════════════════════════════════════════════════════════════

@app.get("/api/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow()}


@app.get("/health")
async def health_check_legacy():
    # To match Dockerfile HEALTHCHECK
    return {"status": "healthy"}


@app.on_event("startup")
async def startup():
    await init_db()
    from demo import seed_demo_data
    await seed_demo_data()
    from db import seed_activity_data
    await seed_activity_data()
    print("[OK] Zero Trust API ready on port 8080")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
