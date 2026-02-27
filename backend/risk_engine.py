"""
AI-Driven Risk Scoring & Anomaly Detection Engine
==================================================
Implements:
  - 6 weighted risk components (0-100 each)
  - Statistical anomaly detection (z-score / threshold)
  - Explainable AI: every score has human-readable reasoning
  - Adaptive access control with decision logic:
      0-30  -> ALLOW
      31-60 -> RE_AUTHENTICATE
      61-100 -> BLOCK + alert

How the Anomaly Detection Works:
---------------------------------
For each user the system maintains a behavioral profile (baseline) built
from historical session data (action counts, download counts, login hours,
devices, IPs, session durations).  When a new session is evaluated, each
metric is compared to the baseline using:
  1. Z-score analysis  : (current - mean) / stddev
     Values > 2 standard deviations are flagged.
  2. Set-membership     : device/IP checked against known sets.
  3. Threshold rules    : hard limits for downloads, off-hours, etc.
Each flagged metric produces a component risk score (0-100) and a
human-readable explanation.  The six components are combined with
configurable weights and a clustering multiplier (concurrent anomalies
increase overall risk non-linearly).
"""

from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import math
from db import get_db_connection
from email_utils import send_security_alert
from utils import get_risk_level

# ─── Weight Configuration ────────────────────────────────────────────
RISK_WEIGHTS = {
    "time_deviation":       0.15,
    "device_mismatch":      0.15,
    "ip_location":          0.15,
    "behavioral_anomaly":   0.20,
    "download_spike":       0.15,
    "unauthorized_service": 0.15,
    "login_attempts":       0.10,
}

NORMAL_HOURS_START = 8
NORMAL_HOURS_END = 20
MAX_NORMAL_DOWNLOADS = 10
MAX_NORMAL_SERVICE_SWITCHES = 5


# ─── Component Calculators ───────────────────────────────────────────

def calc_time_deviation(login_hour: int) -> Tuple[float, str]:
    if NORMAL_HOURS_START <= login_hour <= NORMAL_HOURS_END:
        return 0.0, f"Login at {login_hour}:00 — within business hours (08-20)"
    if login_hour < NORMAL_HOURS_START:
        dev = NORMAL_HOURS_START - login_hour
    else:
        dev = login_hour - NORMAL_HOURS_END
    risk = min(100, (dev / 12) * 100)
    if 0 <= login_hour <= 4:
        risk = min(100, risk * 1.5)
        return risk, f"Login at {login_hour}:00 — deep off-hours (midnight-4 AM zone)"
    return risk, f"Login at {login_hour}:00 — outside normal business hours"


def calc_device_risk(device: str, known: List[str]) -> Tuple[float, str]:
    if not known:
        return 10.0, "First session — establishing device baseline"
    if device in known:
        return 0.0, f"Recognised device"
    return 80.0, f"Unknown device '{device[:40]}' not in {len(known)} registered devices"


def calc_ip_risk(ip: str, known: List[str]) -> Tuple[float, str]:
    if not known:
        return 10.0, "First session — establishing IP baseline"
    if ip in known:
        return 0.0, "Known IP address"
    parts = ip.split(".")
    for k in known:
        kp = k.split(".")
        if parts[:2] == kp[:2]:
            return 30.0, f"IP {ip} same subnet but different host"
    return 85.0, f"IP {ip} from completely unknown network"


def calc_download_spike(current: int, avg: float) -> Tuple[float, str]:
    if avg == 0:
        if current > MAX_NORMAL_DOWNLOADS:
            return 70.0, f"{current} downloads with no baseline — suspicious"
        return 0.0, "Download activity normal"
    ratio = current / max(avg, 1)
    if ratio <= 1.5:
        return 0.0, f"{current} downloads within normal range (avg {avg:.0f})"
    if ratio <= 3:
        r = 30 + (ratio - 1.5) * 20
        return r, f"{current} downloads — {ratio:.1f}x above avg {avg:.0f}"
    r = min(100, 60 + (ratio - 3) * 10)
    return r, f"{current} downloads — {ratio:.1f}x above avg — SPIKE DETECTED"


def calc_behavioral_anomaly(session: dict, profile: dict) -> Tuple[float, str]:
    factors = []
    total = 0.0

    actions = session.get("action_count", 0)
    avg_a = profile.get("avg_actions", 20)
    std_a = profile.get("std_actions", 10)
    if std_a > 0 and actions > avg_a + 2 * std_a:
        z = (actions - avg_a) / std_a
        r = min(100, z * 20)
        total += r * 0.4
        factors.append(f"Action count {actions} is {z:.1f}σ above normal ({avg_a:.0f})")

    sw = session.get("service_switches", 0)
    if sw > MAX_NORMAL_SERVICE_SWITCHES:
        r = min(100, (sw / MAX_NORMAL_SERVICE_SWITCHES) * 40)
        total += r * 0.3
        factors.append(f"Service switching {sw} exceeds limit ({MAX_NORMAL_SERVICE_SWITCHES})")

    dur = session.get("duration_minutes", 0)
    avg_d = profile.get("avg_session_duration", 30)
    if avg_d > 0 and dur > avg_d * 3:
        r = min(100, (dur / avg_d) * 20)
        total += r * 0.3
        factors.append(f"Duration {dur}min is {dur/avg_d:.1f}x longer than avg")

    failed = session.get("failed_access_attempts", 0)
    if failed > 0:
        r = min(100, failed * 15)
        total += r * 0.2
        factors.append(f"{failed} failed access attempts recorded")

    total = min(100, total)
    explanation = "; ".join(factors) if factors else "Behavior within normal patterns"
    return total, explanation


def calc_unauthorized_service(accessed: List[str], allowed: List[str]) -> Tuple[float, str]:
    if not allowed or "*" in allowed:
        return 0.0, "No service restrictions configured"
    unauthorized = [s for s in accessed if s not in allowed]
    if not unauthorized:
        return 0.0, "All accessed services are authorised"
    risk = min(100, len(unauthorized) * 30)
    return risk, f"Unauthorised access to: {', '.join(unauthorized)}"


def calc_login_attempt_risk(count: int) -> Tuple[float, str]:
    if count <= 1:
        return 0.0, "Successful login on first attempt"
    if count == 2:
        return 40.0, "Successful login after 1 failed attempt"
    risk = min(100, 40 + (count - 2) * 25)
    return risk, f"Successful login after {count-1} failed attempts — possible brute-force"


# ─── Composite Score ─────────────────────────────────────────────────

def composite_risk(components: Dict[str, Tuple[float, str]]) -> dict:
    breakdown = []
    weighted_sum = 0.0

    for name, (raw, explanation) in components.items():
        w = RISK_WEIGHTS.get(name, 0.1)
        wr = raw * w
        weighted_sum += wr
        status = "normal" if raw < 30 else "warning" if raw < 60 else "critical"
        breakdown.append({
            "factor": name,
            "raw_risk": round(raw, 1),
            "weight": w,
            "weighted_risk": round(wr, 1),
            "explanation": explanation,
            "status": status,
        })

    crits = sum(1 for b in breakdown if b["status"] == "critical")
    warns = sum(1 for b in breakdown if b["status"] == "warning")
    mult = 1.0
    if crits >= 3:
        mult = 1.5
    elif crits >= 2:
        mult = 1.3
    elif crits >= 1 and warns >= 2:
        mult = 1.2

    score = min(100, weighted_sum * mult)

    if score <= 30:
        decision = "ALLOW"
        detail = "Access granted — risk within acceptable limits"
    elif score <= 60:
        decision = "RE_AUTHENTICATE"
        detail = "Elevated risk — re-authentication required"
    else:
        decision = "BLOCK"
        detail = "High risk — session blocked, alert generated"

    return {
        "score": round(score, 1),
        "decision": decision,
        "decision_detail": detail,
        "multiplier": mult,
        "breakdown": breakdown,
        "critical_factors": crits,
        "warning_factors": warns,
        "timestamp": datetime.utcnow().isoformat(),
    }


# ─── Profile Builder ─────────────────────────────────────────────────

def build_user_profile(user_id: str) -> dict:
    db = get_db_connection()
    sessions = list(db["session_behavior"].find({"user_id": user_id}))
    if not sessions:
        return {
            "avg_actions": 20, "std_actions": 10,
            "avg_downloads": 5, "avg_session_duration": 30,
        }

    def mean(lst):
        return sum(lst) / len(lst) if lst else 0

    def std(lst):
        if len(lst) < 2:
            return 10
        m = mean(lst)
        return max(1, math.sqrt(sum((x - m) ** 2 for x in lst) / len(lst)))

    ac = [s.get("action_count", 0) for s in sessions]
    dl = [s.get("download_count", 0) for s in sessions]
    du = [s.get("duration_minutes", 0) for s in sessions]

    return {
        "avg_actions": mean(ac) or 20,
        "std_actions": std(ac),
        "avg_downloads": mean(dl) or 5,
        "avg_session_duration": mean(du) or 30,
        "total_sessions": len(sessions),
    }


# ─── Main Evaluation Entry Point ─────────────────────────────────────

async def evaluate_session_risk(user_id: str, session_id: str) -> dict:
    """Full risk evaluation — called on login and continuously during session."""
    db = get_db_connection()
    user = db["users"].find_one({"_id": user_id})
    if not user:
        return {"error": "User not found", "score": 100}
    session = db["sessions"].find_one({"session_id": session_id})
    if not session:
        return {"error": "Session not found", "score": 100}

    profile = build_user_profile(user_id)
    sb = db["session_behavior"].find_one({"session_id": session_id}) or {}

    # Known devices / IPs from historical sessions
    past = list(db["sessions"].find({"user_id": user_id}))
    known_devs = list({s.get("device_fingerprint", "") for s in past if s.get("session_id") != session_id} - {""})
    known_ips = list({s.get("ip_address", "") for s in past if s.get("session_id") != session_id} - {""})

    # Allowed services
    creds = list(db["user_credentials"].find({"user_id": user_id}))
    allowed_services = []
    for c in creds:
        app = db["apps"].find_one({"_id": c.get("app_id")})
        if app:
            allowed_services.append(app.get("name", c.get("app_id")))

    login_time = session.get("start_time", datetime.utcnow())
    hour = login_time.hour if isinstance(login_time, datetime) else 12

    components = {
        "time_deviation":       calc_time_deviation(hour),
        "device_mismatch":      calc_device_risk(session.get("device_fingerprint", "unknown"), known_devs),
        "ip_location":          calc_ip_risk(session.get("ip_address", "0.0.0.0"), known_ips),
        "behavioral_anomaly":   calc_behavioral_anomaly(sb, profile),
        "download_spike":       calc_download_spike(sb.get("download_count", 0), profile.get("avg_downloads", 5)),
        "unauthorized_service": calc_unauthorized_service(sb.get("accessed_services", []), allowed_services or ["*"]),
        "login_attempts":       calc_login_attempt_risk(session.get("login_attempt_count", 1)),
    }

    result = composite_risk(components)

    # Persist snapshot
    old = user.get("risk_score", 0)
    new = result["score"] / 100.0
    db["risk_score_history"].insert_one({
        "user_id": user_id, "session_id": session_id,
        "old_score": old, "new_score": new,
        "delta": round(new - old, 4),
        "factors": result["breakdown"],
        "timestamp": datetime.utcnow(),
        "triggered_by": "session_evaluation",
    })
    db["users"].update_one({"_id": user_id}, {"$set": {"risk_score": new, "last_risk_recalc": datetime.utcnow()}})

    # Adaptive access control
    if result["decision"] == "BLOCK":
        db["sessions"].update_one({"session_id": session_id}, {"$set": {"revoked": True, "revoke_reason": "High risk"}})
        db["users"].update_one({"_id": user_id}, {"$set": {"access_level": "blocked"}})
        await create_incident(user_id, "critical", "high_risk_session", result["decision_detail"], result["breakdown"])
        await create_alert(user_id, "critical", f"Session blocked — Risk {result['score']}/100", result)
    elif result["decision"] == "RE_AUTHENTICATE":
        db["users"].update_one({"_id": user_id}, {"$set": {"access_level": "restricted"}})
        await create_alert(user_id, "high", f"Re-auth required — Risk {result['score']}/100", result)
    else:
        if user.get("access_level") == "restricted":
            db["users"].update_one({"_id": user_id}, {"$set": {"access_level": "full"}})

    return result


# ─── Incident & Alert Helpers ─────────────────────────────────────────

async def create_incident(user_id, risk_level, incident_type, description, evidence=None):
    db = get_db_connection()
    ai_text = _explain(incident_type, evidence or [])
    doc = {
        "user_id": user_id, "risk_level": risk_level,
        "incident_type": incident_type, "description": description,
        "ai_explanation": ai_text, "evidence": evidence or [],
        "timestamp": datetime.utcnow(),
        "action_taken": "auto_blocked" if risk_level == "critical" else "flagged",
        "resolved": False,
    }
    r = db["incidents"].insert_one(doc)
    doc["id"] = str(r.inserted_id)
    return doc


async def create_alert(user_id, severity, description, details=None):
    db = get_db_connection()
    user = db["users"].find_one({"_id": user_id})
    user_name = user.get("name", user_id) if user else user_id
    
    doc = {
        "user_id": user_id, "severity": severity,
        "status": "open", "description": description,
        "details": details or {}, "timestamp": datetime.utcnow(),
        "acknowledged": False,
    }
    db["alerts"].insert_one(doc)

    # Notify administrators for High/Critical risks
    if severity in ["high", "critical"]:
        admins = list(db["users"].find({"role": "admin"}))
        admin_emails = [a["email"] for a in admins if a.get("email")]
        if admin_emails:
            send_security_alert(
                admin_emails=admin_emails,
                target_user=user_name,
                risk_score=details.get("score", 100) if details else 100,
                details=description
            )
    return doc


def _explain(incident_type, evidence):
    base_map = {
        "high_risk_session": "Multiple concurrent risk indicators exceeded the safety threshold. The session was automatically blocked per Zero Trust policy.",
        "behavioral_anomaly": "User activity deviates significantly from the established behavioral baseline.",
        "geographic_anomaly": "Login originated from an unrecognised location.",
        "download_spike": "Abnormal data download volume detected — possible data exfiltration.",
        "unauthorized_access": "Access attempted to services outside assigned permissions — least-privilege violation.",
        "device_anomaly": "Unregistered device detected.",
        "simulated_attack": "DEMO: This incident was generated by the attack simulation to demonstrate the Zero Trust detection pipeline.",
    }
    base = base_map.get(incident_type, "Security anomaly detected by the AI monitoring system.")
    if isinstance(evidence, list):
        parts = []
        for item in evidence:
            if isinstance(item, dict) and item.get("status") in ("critical", "warning"):
                parts.append(f"• {item['factor']}: {item.get('explanation', '')} (risk {item.get('raw_risk', 0)})")
        if parts:
            base += "\n\nContributing factors:\n" + "\n".join(parts)
    return base


# ─── Dashboard Metrics ────────────────────────────────────────────────

async def calculate_all_risks() -> dict:
    db = get_db_connection()
    users = list(db["users"].find({}))
    sessions = list(db["sessions"].find({"revoked": False}))
    alerts = list(db["alerts"].find({}))
    incidents = list(db["incidents"].find({}))
    audit = list(db["audit_trail"].find({"action": {"$in": ["mark_safe", "unblock", "dismiss_alert", "resolve_incident"]}}))
    resolved_count = len(audit)

    scores = [u.get("risk_score", 0) for u in users]
    critical = sum(1 for s in scores if s > 0.6)
    blocked = sum(1 for u in users if u.get("access_level") == "blocked" or not u.get("is_active", True))

    cutoff = datetime.utcnow() - timedelta(minutes=30)
    active = [s for s in sessions if isinstance(s.get("last_activity"), datetime) and s["last_activity"] >= cutoff]
    suspicious = sum(1 for s in sessions if s.get("risk_at_login", 0) >= 0.3)

    day_ago = datetime.utcnow() - timedelta(hours=24)
    recent_alerts = sum(1 for a in alerts if isinstance(a.get("timestamp"), datetime) and a["timestamp"] >= day_ago)
    recent_incidents = sum(1 for i in incidents if isinstance(i.get("timestamp"), datetime) and i["timestamp"] >= day_ago)
    attacks = sum(1 for i in incidents if i.get("incident_type") in ("simulated_attack", "high_risk_session"))

    top = sorted(users, key=lambda u: u.get("risk_score", 0), reverse=True)[:5]
    top_fmt = []
    for u in top:
        s = u.get("risk_score", 0)
        top_fmt.append({
            "user_id": str(u["_id"]),
            "email": u.get("email", ""),
            "name": u.get("name", ""),
            "role": u.get("role", "user"),
            "risk_score": s,
            "risk_level": get_risk_level(s * 100),
            "access_level": u.get("access_level", "full"),
        })

    avg = sum(scores) / len(scores) if scores else 0

    return {
        "total_users": len(users),
        "active_users": len(active),
        "critical_risks": critical,
        "suspicious_sessions": suspicious,
        "blocked_accounts": blocked,
        "recent_alerts": recent_alerts,
        "incidents_24h": recent_incidents,
        "avg_risk_score": round(avg, 4),
        "attack_attempts": attacks,
        "resolved_by_admin": resolved_count,
        "top_risks": top_fmt,
    }
