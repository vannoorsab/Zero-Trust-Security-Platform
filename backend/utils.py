import bcrypt

# Passlib 1.7.4 compatibility fix for bcrypt 4.0+
if not hasattr(bcrypt, "__about__"):
    class About:
        __version__ = bcrypt.__version__
    bcrypt.__about__ = About()

"""
Utility functions for the Zero Trust Security Platform
"""

from passlib.context import CryptContext
import uuid
import random

# Use pbkdf2_sha256 for maximum compatibility across platforms without C dependencies (like bcrypt)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def generate_otp() -> str:
    return "".join([str(random.randint(0, 9)) for _ in range(6)])


def generate_session_id() -> str:
    return str(uuid.uuid4())


def get_risk_level(score: float) -> str:
    """score on 0-100 scale"""
    if score <= 30:
        return "low"
    elif score <= 60:
        return "medium"
    elif score <= 80:
        return "high"
    return "critical"


def get_risk_decision(score: float) -> str:
    if score <= 30:
        return "ALLOW"
    elif score <= 60:
        return "RE_AUTHENTICATE"
    return "BLOCK"
