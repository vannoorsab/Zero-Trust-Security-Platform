"""
In-Memory Database Engine for Zero Trust Security Platform
MongoDB-compatible API backed by Python dicts - no external DB required.
"""

import threading
import uuid
import random
from datetime import datetime, timedelta
from copy import deepcopy

_lock = threading.Lock()
_store: dict = {}


class InsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class Cursor:
    def __init__(self, docs):
        self._docs = list(docs)
        self._sort_key = None
        self._sort_dir = 1
        self._limit_val = 0

    def sort(self, key_or_list, direction=None):
        if isinstance(key_or_list, list):
            self._sort_key = key_or_list[0][0]
            self._sort_dir = key_or_list[0][1]
        elif isinstance(key_or_list, str):
            self._sort_key = key_or_list
            self._sort_dir = direction if direction is not None else 1
        return self

    def limit(self, n):
        self._limit_val = n
        return self

    def _resolve(self):
        docs = list(self._docs)
        if self._sort_key:
            def sort_key(d):
                v = d.get(self._sort_key)
                if v is None:
                    return datetime.min if self._sort_dir == -1 else datetime.max
                return v
            docs.sort(key=sort_key, reverse=(self._sort_dir == -1))
        if self._limit_val > 0:
            docs = docs[:self._limit_val]
        return docs

    def __iter__(self):
        return iter(self._resolve())

    def __len__(self):
        return len(self._resolve())


def _match(doc, query):
    if not query:
        return True
    for key, val in query.items():
        doc_val = doc.get(key)
        if isinstance(val, dict):
            for op, op_val in val.items():
                if op == "$gte" and (doc_val is None or doc_val < op_val):
                    return False
                if op == "$lte" and (doc_val is None or doc_val > op_val):
                    return False
                if op == "$gt" and (doc_val is None or doc_val <= op_val):
                    return False
                if op == "$lt" and (doc_val is None or doc_val >= op_val):
                    return False
                if op == "$ne" and doc_val == op_val:
                    return False
                if op == "$in" and doc_val not in op_val:
                    return False
        else:
            if doc_val != val:
                return False
    return True


def _apply_update(doc, update):
    if "$set" in update:
        for k, v in update["$set"].items():
            doc[k] = v
    if "$inc" in update:
        for k, v in update["$inc"].items():
            doc[k] = doc.get(k, 0) + v
    if "$push" in update:
        for k, v in update["$push"].items():
            if k not in doc:
                doc[k] = []
            doc[k].append(v)


class Collection:
    def __init__(self, name):
        self.name = name
        if name not in _store:
            _store[name] = []

    def find(self, query=None, projection=None):
        with _lock:
            docs = _store.get(self.name, [])
            return Cursor([deepcopy(d) for d in docs if _match(d, query)])

    def find_one(self, query):
        with _lock:
            for doc in _store.get(self.name, []):
                if _match(doc, query):
                    return deepcopy(doc)
            return None

    def insert_one(self, doc):
        with _lock:
            doc = deepcopy(doc)
            if "_id" not in doc:
                doc["_id"] = str(uuid.uuid4())
            _store.setdefault(self.name, []).append(doc)
            return InsertResult(doc["_id"])

    def insert_many(self, docs):
        with _lock:
            ids = []
            for doc in docs:
                doc = deepcopy(doc)
                if "_id" not in doc:
                    doc["_id"] = str(uuid.uuid4())
                _store.setdefault(self.name, []).append(doc)
                ids.append(doc["_id"])
            return ids

    def update_one(self, query, update):
        with _lock:
            for doc in _store.get(self.name, []):
                if _match(doc, query):
                    _apply_update(doc, update)
                    return True
            return False

    def update_many(self, query, update):
        with _lock:
            count = 0
            for doc in _store.get(self.name, []):
                if _match(doc, query):
                    _apply_update(doc, update)
                    count += 1
            return count

    def delete_one(self, query):
        with _lock:
            docs = _store.get(self.name, [])
            for i, doc in enumerate(docs):
                if _match(doc, query):
                    docs.pop(i)
                    return True
            return False

    def count_documents(self, query=None):
        with _lock:
            if not query:
                return len(_store.get(self.name, []))
            return sum(1 for d in _store.get(self.name, []) if _match(d, query))

    def distinct(self, field, query=None):
        with _lock:
            docs = _store.get(self.name, [])
            if query:
                docs = [d for d in docs if _match(d, query)]
            return list(set(d.get(field) for d in docs if d.get(field) is not None))

    def aggregate(self, pipeline):
        with _lock:
            docs = [deepcopy(d) for d in _store.get(self.name, [])]
            for stage in pipeline:
                if "$match" in stage:
                    query = stage["$match"]
                    docs = [d for d in docs if _match(d, query)]
                elif "$group" in stage:
                    group_spec = stage["$group"]
                    group_id = group_spec["_id"]
                    if isinstance(group_id, str) and group_id.startswith("$"):
                        group_field = group_id[1:]
                    else:
                        group_field = None
                    
                    groups = {}
                    for d in docs:
                        key = d.get(group_field) if group_field else None
                        if key not in groups:
                            groups[key] = {"_id": key}
                            for k, v in group_spec.items():
                                if k != "_id":
                                    groups[key][k] = 0
                        
                        for k, v in group_spec.items():
                            if k == "_id": continue
                            for op, op_val in v.items():
                                if op == "$sum":
                                    inc = 1 if op_val == 1 else d.get(op_val[1:], 0) if isinstance(op_val, str) and op_val.startswith("$") else op_val
                                    groups[key][k] += inc
                    docs = list(groups.values())
                elif "$sort" in stage:
                    sort_spec = stage["$sort"]
                    field = list(sort_spec.keys())[0]
                    direction = sort_spec[field]
                    docs.sort(key=lambda x: x.get(field, 0), reverse=(direction == -1))
                elif "$limit" in stage:
                    docs = docs[:stage["$limit"]]
            return docs

    def create_index(self, *args, **kwargs):
        pass


class InMemoryDB:
    def __getitem__(self, name):
        return Collection(name)

    def list_collection_names(self):
        return list(_store.keys())

    def create_collection(self, name):
        if name not in _store:
            _store[name] = []


_db = InMemoryDB()


def get_db_connection():
    return _db


async def init_db():
    for c in [
        "users", "sessions", "behavior_logs", "incidents", "alerts",
        "risk_score_history", "audit_trail", "apps", "user_credentials",
        "login_windows", "emergency_requests", "mfa_logs", "session_behavior",
    ]:
        _db.create_collection(c)
    print("[OK] Database collections initialized")

async def seed_activity_data():
    db = get_db_connection()
    users = list(db["users"].find())
    
    print("[SEED] Checking activity data for all users...")
    now = datetime.utcnow()
    
    for user in users:
        uid = str(user["_id"])
        
        # Check if this specific user already has history
        if db["user_activity_logs"].count_documents({"user_id": uid}) > 0:
            continue

        print(f"[SEED] Generating history for user: {user.get('name')} ({uid})")
        
        # 1. Historical Risk Trend (to show on the graph)
        for day in range(5, 0, -1):
            ts = now - timedelta(days=day)
            score = random.uniform(0.05, 0.4)
            db["risk_score_history"].insert_one({
                "user_id": uid, "old_score": max(0, score - 0.05), "new_score": score,
                "delta": 0.05, "factors": [], "timestamp": ts, "triggered_by": "daily_audit"
            })

        # 2. HR Activity (Closed Session)
        hr_enter = now - timedelta(hours=2, minutes=30)
        hr_exit = now - timedelta(hours=2, minutes=10)
        hr_duration = (hr_exit - hr_enter).total_seconds()
        
        db["user_activity_logs"].insert_many([
            {"user_id": uid, "app_id": "app_hr", "action": "enter_module", "details": "Module Entry", "timestamp": hr_enter},
            {"user_id": uid, "app_id": "app_hr", "action": "View Dashboard", "details": "Viewing Employee Directory", "timestamp": hr_enter + timedelta(minutes=5)},
            {"user_id": uid, "app_id": "app_hr", "action": "Download HR File", "details": "FILE: payroll_q1_fixed.pdf", "is_sensitive": True, "timestamp": hr_enter + timedelta(minutes=12)},
            {"user_id": uid, "app_id": "app_hr", "action": "exit_module", "details": "Module Exit", "timestamp": hr_exit},
            {"user_id": uid, "app_id": "app_hr", "action": "module_dwell", "duration": hr_duration, "timestamp": hr_exit}
        ])
        
        db["module_sessions"].insert_one({
            "user_id": uid, "app_id": "app_hr", "enter_time": hr_enter, 
            "exit_time": hr_exit, "duration_seconds": hr_duration, "active": False
        })
        
        # 3. Finance Activity (Active Session)
        fin_enter = now - timedelta(minutes=45)
        db["user_activity_logs"].insert_many([
            {"user_id": uid, "app_id": "app_finance", "action": "enter_module", "details": "Module Entry", "timestamp": fin_enter},
            {"user_id": uid, "app_id": "app_finance", "action": "View Ledger", "details": "Checking Q4 Projections", "timestamp": fin_enter + timedelta(minutes=15)},
            {"user_id": uid, "app_id": "app_finance", "action": "Simulated Export", "details": "FILE: tax_returns_2025.xlsx", "is_sensitive": True, "timestamp": fin_enter + timedelta(minutes=30)}
        ])
        
        db["module_sessions"].insert_one({
            "user_id": uid, "app_id": "app_finance", "enter_time": fin_enter, "active": True
        })
    print(f"[OK] Seeded activity/history baseline for verified users")
