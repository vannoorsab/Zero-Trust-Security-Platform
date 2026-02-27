#!/usr/bin/env python3
"""
MongoDB Collection Initialization Script
Run this once to set up collections and indexes
"""

import os
import sys
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, OperationFailure
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
DB_NAME = 'zero_trust'

def init_collections():
    """Initialize MongoDB collections with proper indexes"""
    try:
        # Connect to MongoDB
        print(f"[*] Connecting to MongoDB...")
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        
        # Verify connection
        client.admin.command('ping')
        print("[✓] Successfully connected to MongoDB")
        
        db = client[DB_NAME]
        
        # Drop existing collections if needed (set RESET_DB=true to enable)
        if os.getenv('RESET_DB') == 'true':
            print("[!] Resetting database (RESET_DB=true)...")
            db.drop_collection('users')
            db.drop_collection('behavior_logs')
            db.drop_collection('incidents')
        
        # 1. Users Collection
        print("\n[*] Setting up 'users' collection...")
        if 'users' not in db.list_collection_names():
            users = db.create_collection('users')
            print("    Created 'users' collection")
        else:
            users = db['users']
            print("    'users' collection already exists")
        
        # Create indexes for users
        users.create_index('email', unique=True)
        users.create_index('created_at', default_language='english')
        users.create_index('is_admin')
        print("    Created indexes: email (unique), created_at, is_admin")
        
        # 2. Behavior Logs Collection
        print("\n[*] Setting up 'behavior_logs' collection...")
        if 'behavior_logs' not in db.list_collection_names():
            logs = db.create_collection('behavior_logs')
            print("    Created 'behavior_logs' collection")
        else:
            logs = db['behavior_logs']
            print("    'behavior_logs' collection already exists")
        
        # Create indexes for behavior logs (critical for performance)
        logs.create_index([('user_id', ASCENDING)])
        logs.create_index([('timestamp', DESCENDING)])
        logs.create_index([('user_id', ASCENDING), ('timestamp', DESCENDING)])
        logs.create_index('action_type')
        # TTL index to auto-delete logs after 90 days
        logs.create_index('timestamp', expireAfterSeconds=7776000)
        print("    Created indexes: user_id, timestamp, action_type")
        print("    Created TTL index (auto-delete after 90 days)")
        
        # 3. Incidents Collection
        print("\n[*] Setting up 'incidents' collection...")
        if 'incidents' not in db.list_collection_names():
            incidents = db.create_collection('incidents')
            print("    Created 'incidents' collection")
        else:
            incidents = db['incidents']
            print("    'incidents' collection already exists")
        
        # Create indexes for incidents
        incidents.create_index([('user_id', ASCENDING)])
        incidents.create_index([('timestamp', DESCENDING)])
        incidents.create_index([('severity', ASCENDING)])
        incidents.create_index([('status', ASCENDING)])
        incidents.create_index([('user_id', ASCENDING), ('timestamp', DESCENDING)])
        print("    Created indexes: user_id, timestamp, severity, status")
        
        # Verify collections
        print("\n[✓] Initialization Complete!")
        print(f"\n[*] Database: {DB_NAME}")
        print(f"[*] Collections created:")
        for collection in db.list_collection_names():
            count = db[collection].count_documents({})
            indexes = len(db[collection].list_indexes())
            print(f"    - {collection}: {count} documents, {indexes} indexes")
        
        # Create initial admin user (optional)
        if os.getenv('CREATE_ADMIN') == 'true':
            print("\n[*] Creating initial admin user...")
            from utils import hash_password
            
            admin_data = {
                'email': 'admin@zerotrust.local',
                'password_hash': hash_password('AdminPassword123!'),
                'name': 'Admin User',
                'is_admin': True,
                'access_level': 'full',
                'risk_score': 0.0,
                'created_at': db.command('serverStatus')['localTime'],
                'updated_at': db.command('serverStatus')['localTime'],
            }
            
            # Check if admin already exists
            existing = users.find_one({'email': admin_data['email']})
            if existing:
                print(f"    Admin user already exists: {admin_data['email']}")
            else:
                result = users.insert_one(admin_data)
                print(f"    Created admin user: {admin_data['email']} (ID: {result.inserted_id})")
        
        client.close()
        print("\n[✓] MongoDB initialization completed successfully!")
        return True
        
    except ConnectionFailure as e:
        print(f"\n[✗] Connection Error: {e}")
        print("\nTroubleshooting:")
        print("1. Check that MONGODB_URI is set in .env.local")
        print("2. Verify MongoDB service is running")
        print("3. For MongoDB Atlas, ensure:")
        print("   - Network access whitelist includes your IP")
        print("   - Credentials in connection string are correct")
        print("   - Cluster is in 'Available' state")
        return False
        
    except OperationFailure as e:
        print(f"\n[✗] Operation Error: {e}")
        print("\nThis might be a permission issue. Check your MongoDB credentials.")
        return False
        
    except Exception as e:
        print(f"\n[✗] Unexpected Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("Zero Trust Security - MongoDB Initialization")
    print("=" * 60)
    
    success = init_collections()
    sys.exit(0 if success else 1)
