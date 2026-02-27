import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Email Configuration (Set these via environment variables for production)
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@zerotrust.io")

# If credentials are not provided, operate in SIMULATION MODE
SIMULATION_MODE = not (SMTP_USER and SMTP_PASSWORD)

def send_access_notification(user_email: str, user_name: str, app_name: str, username: str):
    """
    Sends an email notification to the user when they are granted access to an application.
    """
    # Fetch latest config in case they were updated after module load
    server_addr = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "")
    password = os.getenv("SMTP_PASSWORD", "")
    sender = os.getenv("EMAIL_FROM", "noreply@zerotrust.io")
    
    is_sim = not (user and password)

    subject = f"Access Granted: {app_name} - Zero Trust Platform"
    
    body = f"""
    Hello {user_name},

    You have been granted access to the following application on the Zero Trust Platform:

    Application: {app_name}
    Access Username: {username}

    Please log in to the portal to view your access window and security guidelines.

    Securely,
    Zero Trust Admin Team
    """

    if is_sim:
        logger.info("═══ EMAIL SIMULATION ═══")
        logger.info(f"Target: {user_email}")
        logger.info(f"Using App: {app_name}")
        logger.info(f"Credentials: {username}")
        logger.info("════════════════════════")
        return True

    logger.info(f"Attempting to send real email to {user_email} via {server_addr}:{port}...")
    try:
        msg = MIMEMultipart()
        msg['From'] = sender
        msg['To'] = user_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        logger.info(f"Connecting to SMTP server {server_addr}...")
        server = smtplib.SMTP(server_addr, port)
        server.set_debuglevel(1)  # Enable detailed SMTP debug output
        server.starttls()
        logger.info(f"Logging in as {user}...")
        server.login(user, password)
        server.send_message(msg)
        server.quit()
        
        logger.info(f"SUCCESS: Notification email sent to {user_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {user_email}: {str(e)}")
        return False

def send_security_alert(admin_emails: list, target_user: str, risk_score: float, details: str):
    """
    Sends a high-priority security alert to all administrators.
    """
    server_addr = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "")
    password = os.getenv("SMTP_PASSWORD", "")
    sender = os.getenv("EMAIL_FROM", "noreply@zerotrust.io")
    
    is_sim = not (user and password)

    subject = f"CRITICAL SECURITY ALERT: High Risk Detected for {target_user}"
    
    body = f"""
    ⚠️ HIGH RISK SECURITY ALERT
    ==========================
    
    The Zero Trust AI Risk Engine has detected critical activity.
    
    Target User: {target_user}
    Risk Score: {risk_score}/100
    
    Details:
    {details}
    
    Please log in to the Admin Dashboard immediately to investigate and take action.
    
    Securely,
    AI Security Engine
    """

    if is_sim:
        logger.info("═══ SECURITY ALERT SIMULATION ═══")
        for addr in admin_emails:
            logger.info(f"Admin Notified: {addr}")
        logger.info(f"Target User: {target_user}")
        logger.info(f"Risk Score: {risk_score}")
        logger.info("════════════════════════════════")
        return True

    try:
        msg = MIMEMultipart()
        msg['From'] = sender
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(server_addr, port)
        server.starttls()
        server.login(user, password)
        
        for admin_email in admin_emails:
            msg['To'] = admin_email
            server.send_message(msg)
            
        server.quit()
        logger.info(f"SUCCESS: Security alert sent to {len(admin_emails)} admins")
        return True
    except Exception as e:
        logger.error(f"Failed to send security alert: {str(e)}")
        return False
