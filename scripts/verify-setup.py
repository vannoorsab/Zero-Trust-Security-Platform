#!/usr/bin/env python3
"""
Setup Verification Script
Checks if all credentials and dependencies are properly configured
"""

import os
import sys
from pathlib import Path
from pymongo import MongoClient
from urllib.parse import quote_plus

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(title):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}")
    print(f"{title}")
    print(f"{'='*60}{Colors.RESET}\n")

def print_success(message):
    print(f"{Colors.GREEN}✓ {message}{Colors.RESET}")

def print_error(message):
    print(f"{Colors.RED}✗ {message}{Colors.RESET}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠ {message}{Colors.RESET}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ {message}{Colors.RESET}")

def check_env_file():
    """Check if .env.local file exists"""
    print_header("Checking Environment File")
    
    env_path = Path(".env.local")
    if env_path.exists():
        print_success(f"Found .env.local file")
        return True
    else:
        print_error(f"Missing .env.local file")
        print_info("Run: cp .env.example .env.local")
        return False

def check_environment_variables():
    """Check required environment variables"""
    print_header("Checking Environment Variables")
    
    required_vars = {
        'MONGODB_URI': 'MongoDB connection string',
        'JWT_SECRET': 'JWT authentication secret',
        'NEXT_PUBLIC_API_URL': 'Frontend API URL'
    }
    
    optional_vars = {
        'GCP_PROJECT_ID': 'Google Cloud Project ID',
        'GOOGLE_APPLICATION_CREDENTIALS': 'GCP service account JSON path'
    }
    
    all_present = True
    
    print(f"{Colors.BOLD}Required Variables:{Colors.RESET}")
    for var, description in required_vars.items():
        value = os.getenv(var)
        if value:
            masked = value[:20] + "..." if len(str(value)) > 20 else value
            print_success(f"{var} = {masked}")
        else:
            print_error(f"{var} is missing - {description}")
            all_present = False
    
    print(f"\n{Colors.BOLD}Optional Variables:{Colors.RESET}")
    for var, description in optional_vars.items():
        value = os.getenv(var)
        if value:
            masked = value[:20] + "..." if len(str(value)) > 20 else value
            print_success(f"{var} = {masked}")
        else:
            print_warning(f"{var} not set - {description} (OK for local dev)")
    
    return all_present

def check_mongodb_connection():
    """Test MongoDB connection"""
    print_header("Testing MongoDB Connection")
    
    mongodb_uri = os.getenv('MONGODB_URI')
    
    if not mongodb_uri:
        print_error("MONGODB_URI not set in environment")
        print_info("Add MONGODB_URI to .env.local")
        return False
    
    try:
        print_info("Connecting to MongoDB Atlas...")
        client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
        
        # Try to verify connection
        admin = client.admin
        admin.command('ping')
        
        print_success("MongoDB connection successful!")
        
        # Get database info
        db_list = client.list_database_names()
        print_success(f"Found {len(db_list)} database(s)")
        
        return True
        
    except Exception as e:
        print_error(f"MongoDB connection failed: {str(e)}")
        print_warning("Solutions:")
        print_warning("  1. Check MONGODB_URI is correct (copy from Atlas)")
        print_warning("  2. Verify database password is accurate")
        print_warning("  3. Check Network Access allows your IP (Atlas → Network Access)")
        print_warning("  4. Ensure cluster is running (green status in Databases)")
        return False

def check_python_packages():
    """Check if required Python packages are installed"""
    print_header("Checking Python Packages")
    
    required_packages = {
        'pymongo': 'MongoDB driver',
        'fastapi': 'Web framework',
        'pydantic': 'Data validation',
        'python-jose': 'JWT handling',
        'scikit-learn': 'ML/anomaly detection',
        'uvicorn': 'ASGI server'
    }
    
    all_present = True
    
    for package, description in required_packages.items():
        try:
            __import__(package)
            print_success(f"{package} - {description}")
        except ImportError:
            print_error(f"{package} missing - {description}")
            all_present = False
    
    if not all_present:
        print_info("\nRun: pip install -r backend/requirements.txt")
    
    return all_present

def check_nodejs_packages():
    """Check if required Node packages are installed"""
    print_header("Checking Node.js Packages")
    
    node_modules = Path("node_modules")
    if not node_modules.exists():
        print_error("node_modules directory not found")
        print_info("Run: pnpm install")
        return False
    
    required_packages = [
        'next',
        'react',
        'tailwindcss'
    ]
    
    all_present = True
    for package in required_packages:
        package_path = node_modules / package
        if package_path.exists():
            print_success(f"{package}")
        else:
            print_warning(f"{package} not found (may be OK)")
    
    return all_present

def check_backend_structure():
    """Check if backend files exist"""
    print_header("Checking Backend Structure")
    
    backend_dir = Path("backend")
    required_files = {
        'main.py': 'FastAPI application',
        'models.py': 'Data models',
        'db.py': 'Database connection',
        'requirements.txt': 'Python dependencies',
        'Dockerfile': 'Container configuration'
    }
    
    all_present = True
    for filename, description in required_files.items():
        file_path = backend_dir / filename
        if file_path.exists():
            print_success(f"{filename} - {description}")
        else:
            print_error(f"{filename} missing - {description}")
            all_present = False
    
    return all_present

def check_frontend_structure():
    """Check if frontend files exist"""
    print_header("Checking Frontend Structure")
    
    required_dirs = {
        'app': 'Next.js app directory',
        'components': 'React components',
        'lib': 'Utilities and helpers'
    }
    
    all_present = True
    for dirname, description in required_dirs.items():
        dir_path = Path(dirname)
        if dir_path.exists():
            print_success(f"{dirname}/ - {description}")
        else:
            print_error(f"{dirname}/ missing - {description}")
            all_present = False
    
    return all_present

def print_next_steps():
    """Print recommended next steps"""
    print_header("Next Steps")
    
    print(f"{Colors.BOLD}To start the application:{Colors.RESET}\n")
    
    print("1. Start MongoDB initialization (if first time):")
    print(f"   {Colors.BLUE}python backend/scripts/init-mongodb.py{Colors.RESET}\n")
    
    print("2. Start backend (Terminal 1):")
    print(f"   {Colors.BLUE}cd backend{Colors.RESET}")
    print(f"   {Colors.BLUE}python -m uvicorn main:app --reload{Colors.RESET}\n")
    
    print("3. Start frontend (Terminal 2):")
    print(f"   {Colors.BLUE}pnpm dev{Colors.RESET}\n")
    
    print("4. Open in browser:")
    print(f"   {Colors.BLUE}http://localhost:3000{Colors.RESET}\n")
    
    print("5. Test the application:")
    print(f"   {Colors.BLUE}Sign up → Login → Run Demo Simulation{Colors.RESET}\n")

def main():
    """Run all verification checks"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}Zero Trust Security Platform{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}Setup Verification Script{Colors.RESET}\n")
    
    checks = [
        ("Environment File", check_env_file),
        ("Environment Variables", check_environment_variables),
        ("MongoDB Connection", check_mongodb_connection),
        ("Python Packages", check_python_packages),
        ("Node.js Packages", check_nodejs_packages),
        ("Backend Structure", check_backend_structure),
        ("Frontend Structure", check_frontend_structure)
    ]
    
    results = []
    for check_name, check_func in checks:
        try:
            result = check_func()
            results.append((check_name, result))
        except Exception as e:
            print_error(f"Error during {check_name}: {str(e)}")
            results.append((check_name, False))
    
    # Summary
    print_header("Verification Summary")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for check_name, result in results:
        status = f"{Colors.GREEN}PASS{Colors.RESET}" if result else f"{Colors.RED}FAIL{Colors.RESET}"
        print(f"{status} - {check_name}")
    
    print(f"\n{Colors.BOLD}Result: {passed}/{total} checks passed{Colors.RESET}\n")
    
    if passed == total:
        print_success("All checks passed! Your environment is ready.")
        print_next_steps()
    else:
        print_error(f"{total - passed} check(s) failed. Fix errors above and try again.")
        print_info("See GETTING_CREDENTIALS.md for detailed setup instructions")
    
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(main())
