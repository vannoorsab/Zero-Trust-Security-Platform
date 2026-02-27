"""
Demo Data Seeding & Attack Simulation System
=============================================
Seeds realistic users, services, historical behavior data.
Provides simulate_attack() for live hackathon demo.
"""

from datetime import datetime, timedelta
import random
from db import get_db_connection
from utils import hash_password, generate_session_id

ATTACK_IPS = ["185.220.101.42", "91.219.236.136", "103.47.132.10", "198.51.100.77"]
ATTACK_DEVICES = [
    "curl/7.68.0 automated-script",
    "Python-urllib/3.8 data-scraper",
    "Mozilla/5.0 Kali-Linux-Bot",
]
NORMAL_IP_PREFIX = "192.168.1."
NORMAL_DEVICE = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0"


async def seed_demo_data():
    db = get_db_connection()
    if db["users"].find_one({"email": "admin@zerotrust.io"}):
        print("[OK] Demo data already present")
        return

    print("Seeding demo data...")

    # ── Services ──
    apps = [
        {"_id": "app_crm", "name": "CRM Portal", "description": "Customer relationship management", "url": "https://crm.internal"},
        {"_id": "app_hr", "name": "HR System", "description": "Human resources", "url": "https://hr.internal"},
        {"_id": "app_finance", "name": "Finance Dashboard", "description": "Financial reporting", "url": "https://finance.internal"},
        {"_id": "app_email", "name": "Email Server", "description": "Corporate email", "url": "https://mail.internal"},
        {"_id": "app_files", "name": "File Storage", "description": "Document management", "url": "https://files.internal"},
        {"_id": "app_admin", "name": "Admin Console", "description": "System administration (restricted)", "url": "https://admin.internal"},
        {"_id": "app_analytics", "name": "Analytics Platform", "description": "Business intelligence", "url": "https://analytics.internal"},
    ]
    for a in apps:
        a["created_at"] = datetime.utcnow()
        db["apps"].insert_one(a)

    # ── Users ──
    users = [
        {"_id": "user_admin", "email": "admin@zerotrust.io", "password": hash_password("admin123"),
         "name": "Admin User", "role": "admin", "mfa_enabled": False, "risk_score": 0.05,
         "access_level": "full", "is_active": True, "is_under_investigation": False,
         "created_at": datetime.utcnow() - timedelta(days=30)},
        {"_id": "user_alice", "email": "alice@zerotrust.io", "password": hash_password("user123"),
         "name": "Alice Johnson", "role": "user", "risk_score": 0.12, "access_level": "full",
         "is_active": True, "is_under_investigation": False,
         "created_at": datetime.utcnow() - timedelta(days=25)},
        {"_id": "user_bob", "email": "bob@zerotrust.io", "password": hash_password("user123"),
         "name": "Bob Smith", "role": "user", "risk_score": 0.35, "access_level": "restricted",
         "is_active": True, "is_under_investigation": False,
         "created_at": datetime.utcnow() - timedelta(days=20)},
        {"_id": "user_carol", "email": "carol@zerotrust.io", "password": hash_password("user123"),
         "name": "Carol White", "role": "user", "risk_score": 0.72, "access_level": "blocked",
         "is_active": True, "is_under_investigation": True,
         "created_at": datetime.utcnow() - timedelta(days=15)},
        {"_id": "user_dave", "email": "dave@zerotrust.io", "password": hash_password("user123"),
         "name": "Dave Martinez", "role": "user", "risk_score": 0.08, "access_level": "full",
         "is_active": True, "is_under_investigation": False,
         "created_at": datetime.utcnow() - timedelta(days=10)},
    ]
    for u in users:
        db["users"].insert_one(u)

    # ── Service assignments ──
    assignments = {
        "user_alice": ["app_crm", "app_email", "app_files"],
        "user_bob": ["app_crm", "app_hr", "app_email"],
        "user_carol": ["app_crm", "app_email"],
        "user_dave": ["app_crm", "app_email", "app_files", "app_analytics"],
    }
    for uid, app_ids in assignments.items():
        for aid in app_ids:
            db["user_credentials"].insert_one({
                "user_id": uid, "app_id": aid,
                "username": uid.replace("user_", ""),
                "password_hash": hash_password("cred123"),
                "created_at": datetime.utcnow(),
            })

    # ── Login windows ──
    for u in users:
        if u["role"] != "admin":
            db["login_windows"].insert_one({
                "user_id": u["_id"], "app_id": "app_crm",
                "allowed_start": "08:00", "allowed_end": "20:00",
                "created_at": datetime.utcnow(),
            })

    # ── Historical data (7 days) ──
    now = datetime.utcnow()
    user_ids = ["user_alice", "user_bob", "user_carol", "user_dave"]
    for uid in user_ids:
        ip = NORMAL_IP_PREFIX + str(100 + user_ids.index(uid))
        for day in range(7, 0, -1):
            sid = f"hist_{uid}_{day}"
            hour = random.randint(8, 18)
            start = now - timedelta(days=day, hours=24 - hour)
            dur = random.randint(15, 120)
            ac = random.randint(5, 30)
            dl = random.randint(0, 8)
            svcs = random.sample(["CRM Portal", "Email Server", "File Storage"], k=random.randint(1, 3))

            db["sessions"].insert_one({
                "session_id": sid, "user_id": uid, "ip_address": ip,
                "device_fingerprint": NORMAL_DEVICE, "user_agent": NORMAL_DEVICE,
                "start_time": start, "last_activity": start + timedelta(minutes=dur),
                "expires_at": start + timedelta(hours=24),
                "mfa_verified": False, "risk_at_login": random.uniform(0.02, 0.15),
                "revoked": True,
            })
            db["session_behavior"].insert_one({
                "session_id": sid, "user_id": uid, "login_timestamp": start,
                "ip_address": ip, "device_info": NORMAL_DEVICE,
                "location": "Office - New York",
                "accessed_services": svcs, "action_count": ac,
                "download_count": dl, "duration_minutes": dur,
                "service_switches": max(0, len(svcs) - 1),
                "failed_access_attempts": 0,
            })
            for _ in range(ac):
                db["behavior_logs"].insert_one({
                    "user_id": uid, "session_id": sid,
                    "event_type": random.choice(["login", "access_resource", "access_resource", "data_export"]),
                    "resource": random.choice(svcs),
                    "action": random.choice(["read", "read", "write"]),
                    "ip_address": ip, "device_fingerprint": NORMAL_DEVICE,
                    "timestamp": start + timedelta(minutes=random.randint(0, dur)),
                })
            score = random.uniform(0.02, 0.18)
            db["risk_score_history"].insert_one({
                "user_id": uid, "session_id": sid,
                "old_score": max(0, score - 0.03), "new_score": score,
                "delta": 0.03,
                "factors": [{"factor": "time_deviation", "raw_risk": random.uniform(0, 10),
                             "weight": 0.15, "weighted_risk": random.uniform(0, 2),
                             "explanation": "Normal hours", "status": "normal"}],
                "timestamp": start, "triggered_by": "session_evaluation",
            })

    # ── Seed incidents & alerts for Carol ──
    for _ in range(3):
        db["incidents"].insert_one({
            "user_id": "user_carol",
            "risk_level": random.choice(["high", "critical"]),
            "incident_type": random.choice(["behavioral_anomaly", "geographic_anomaly", "download_spike"]),
            "description": random.choice([
                "Unusual login pattern from unknown location",
                "Bulk data download exceeding limits",
                "Access from unregistered device",
            ]),
            "ai_explanation": "Behavioral deviation from baseline detected. Multiple risk factors contributed.",
            "evidence": [], "timestamp": datetime.utcnow() - timedelta(days=random.randint(1, 5)),
            "action_taken": "flagged", "resolved": False,
        })
    db["alerts"].insert_one({
        "user_id": "user_carol", "severity": "critical", "status": "open",
        "description": "Multiple high-risk sessions in 24 hours",
        "timestamp": datetime.utcnow() - timedelta(hours=6), "acknowledged": False,
    })
    db["alerts"].insert_one({
        "user_id": "user_bob", "severity": "high", "status": "open",
        "description": "Login from new IP address detected",
        "timestamp": datetime.utcnow() - timedelta(hours=12), "acknowledged": False,
    })

    print(f"[OK] Seeded {len(users)} users, {len(apps)} services, historical data")


async def simulate_attack(target_user_id: str = None):
    """Run a full attack simulation that triggers all risk components."""
    db = get_db_connection()

    if not target_user_id:
        users = list(db["users"].find({"role": "user"}))
        if not users:
            return {"error": "No users for simulation"}
        target = random.choice(users)
        target_user_id = target["_id"]
    else:
        target = db["users"].find_one({"_id": target_user_id})
        if not target:
            return {"error": "User not found"}

    sid = generate_session_id()
    aip = random.choice(ATTACK_IPS)
    adev = random.choice(ATTACK_DEVICES)
    ahour = random.choice([0, 1, 2, 3, 23])
    login_time = datetime.utcnow().replace(hour=ahour, minute=random.randint(0, 59))

    db["sessions"].insert_one({
        "session_id": sid, "user_id": target_user_id,
        "ip_address": aip, "device_fingerprint": adev, "user_agent": adev,
        "start_time": login_time, "last_activity": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=24),
        "mfa_verified": False, "risk_at_login": 0.0, "revoked": False,
    })

    dl_count = random.randint(50, 200)
    action_count = random.randint(150, 300)
    db["session_behavior"].insert_one({
        "session_id": sid, "user_id": target_user_id,
        "login_timestamp": login_time, "ip_address": aip,
        "device_info": adev,
        "location": random.choice(["Tor Network", "Moscow, Russia", "Beijing, China"]),
        "accessed_services": ["Admin Console", "Finance Dashboard", "HR System", "File Storage"],
        "action_count": action_count, "download_count": dl_count,
        "duration_minutes": random.randint(5, 15),
        "service_switches": random.randint(10, 25),
        "failed_access_attempts": random.randint(5, 15),
    })

    for _ in range(20):
        db["behavior_logs"].insert_one({
            "user_id": target_user_id, "session_id": sid,
            "event_type": random.choice(["data_export", "config_change", "access_resource"]),
            "resource": random.choice(["Admin Console", "Finance Dashboard", "database_backup"]),
            "action": random.choice(["export", "delete", "write"]),
            "ip_address": aip, "device_fingerprint": adev,
            "timestamp": datetime.utcnow(),
        })

    from risk_engine import evaluate_session_risk, create_incident, create_alert
    risk = await evaluate_session_risk(target_user_id, sid)

    incident = await create_incident(
        target_user_id, "critical", "simulated_attack",
        f"SIMULATED ATTACK: Session from {aip} at {ahour}:00. "
        f"{dl_count} downloads, unauthorized service access.",
        risk.get("breakdown", []),
    )
    await create_alert(
        target_user_id, "critical",
        f"ATTACK SIM: {target.get('name')} blocked — Risk {risk.get('score', 0)}/100",
        {"simulation": True, "risk_result": risk},
    )

    return {
        "status": "attack_simulated",
        "target_user": {"id": target_user_id, "name": target.get("name"), "email": target.get("email")},
        "attack_details": {
            "ip_address": aip, "device": adev, "login_hour": f"{ahour}:00",
            "downloads": dl_count, "actions": action_count,
            "unauthorized_services": ["Admin Console", "Finance Dashboard"],
        },
        "risk_result": risk,
        "session_id": sid,
        "incident_id": incident.get("id"),
        "action_taken": "Session blocked + Alert generated",
    }
