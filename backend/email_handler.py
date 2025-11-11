
import logging
import base64
from email.mime.text import MIMEText
from typing import List
from fastapi import Depends
from decouple import config
from crud import get_superadmins
from database import get_db
from sqlalchemy.orm import Session
import json
# Gmail API
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

logger = logging.getLogger(__name__)

APP_BASE_URL = config("APP_BASE_URL", default="http://localhost:5173")
SUPERADMIN_EMAIL = config("SUPERADMIN_EMAIL", default=None)
GMAIL_TOKEN_PATH = "token.json"  # Gmail API token file
GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.send']
GMAIL_SENDER_EMAIL = config("MAIL_FROM")  # your Gmail email address
token_data = json.loads(config("TOKEN_JSON"))

# --- Gmail API Helpers ---
def get_gmail_service():
    """
    Returns an authorized Gmail API service.
    """
    creds = Credentials.from_authorized_user_info(token_data, GMAIL_SCOPES)
    service = build('gmail', 'v1', credentials=creds)
    return service


async def send_email_via_gmail(to_emails: List[str], subject: str, html_body: str) -> bool:
    """
    Sends an email using Gmail API.
    """
    try:
        service = get_gmail_service()
        message = MIMEText(html_body, "html")
        message['to'] = ", ".join(to_emails)
        message['from'] = GMAIL_SENDER_EMAIL
        message['subject'] = subject

        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        send_message = {'raw': raw_message}

        service.users().messages().send(userId='me', body=send_message).execute()
        return True
    except Exception as e:
        logger.exception("Failed to send email via Gmail API: %s", e)
        return False


# --- Email Templates ---
def build_email_template(email_type: str, link: str) -> str:
    if email_type == "activation":
        title = "Welcome to IDRIS!"
        intro = "Your account is almost ready. To complete the activation process, click the button below:"
        button_text = "Activate My Account"
        security_note = "This activation link will expire in 24 hours. If you didn't create an account, ignore this email."
    elif email_type == "reset":
        title = "Password Reset Request for IDRIS"
        intro = "We received a request to reset the password for your IDRIS account. Click the button below to reset it:"
        button_text = "Reset My Password"
        security_note = "This reset link will expire in 24 hours. If you didn't request a reset, ignore this email. Your account will remain secure."
    elif email_type == "user_activated":
        title = "Your IDRIS Account is Activated!"
        intro = "Great news! Your IDRIS account has been activated. You can now log in and access all features."
        button_text = "Log In to IDRIS"
        security_note = "If you have any questions, please contact our support team."
    else:
        raise ValueError("Invalid email_type. Must be 'activation', 'reset', or 'user_activated'.")

    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>{title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
        <div style="max-width:600px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #749ab6 0%, #c5d7e5 100%); padding:30px; text-align:center;">
                <h1 style="color:#fff; margin:0;">IDRIS APP</h1>
                <p style="color:#e8f2f7; margin:5px 0 0;">Integrated Disaster Response Information System</p>
            </div>
            <div style="padding:40px 30px;">
                <h2 style="color:#333;">{title}</h2>
                <p style="color:#555;">{intro}</p>
                <div style="text-align:center; margin:40px 0;">
                    <a href="{link}" style="display:inline-block; padding:16px 32px; background:linear-gradient(135deg, #fcb814 0%, #e6a612 100%); color:#fff; text-decoration:none; border-radius:6px; font-weight:600; font-size:16px;">
                        {button_text}
                    </a>
                </div>
                <div style="background:#f8fbfd; padding:15px; border-left:4px solid #749ab6; border-radius:6px; font-size:14px; color:#666;">
                    <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
                    <p style="word-break:break-all; font-family:'Courier New', monospace;">{link}</p>
                </div>
                <div style="margin-top:30px; background:#fefcf0; border:1px solid #fcb814; border-radius:6px; padding:20px;">
                    <h4 style="color:#c19610; margin:0 0 10px;">🔒 Security Notice</h4>
                    <p style="color:#c19610; margin:0;">{security_note}</p>
                </div>
            </div>
            <div style="background:#f8fbfd; padding:20px; text-align:center; border-top:1px solid #c5d7e5;">
                <p style="font-size:14px; color:#888;">
                    <strong>IDRIS DevTeam</strong><br>
                    Argao, Cebu Philippines 6021<br><br>
                    Do not reply, this is a transactional email.
                </p>
            </div>
        </div>
    </body>
    </html>
    """


def build_admin_email_template(email_type: str, link: str, admin_email: str = "") -> str:
    if email_type == "admin_email_verification":
        title = "Verify Your IDRIS Admin Account Email"
        intro = "Welcome to the IDRIS team! Please verify your email address by clicking the button below. After verification, your profile will be submitted for superadmin review."
        button_text = "Verify Email Address"
        security_note = "This verification link will expire in 24 hours. If you didn't create an account, ignore this email."
    elif email_type == "superadmin_notification":
        title = "New Admin Pending Approval"
        intro = f"An admin with the email {admin_email} has verified their email and completed their profile. Please review and approve their account."
        button_text = "Review Pending Admins"
        security_note = "This is a notification for superadmins only."
    elif email_type == "admin_activated":
        title = "Your IDRIS Admin Account is Activated!"
        intro = "Great news! A superadmin has reviewed and approved your account. You can now log in with your credentials and access the admin dashboard."
        button_text = "Log In to IDRIS"
        security_note = "If you have any questions about your admin permissions, please contact the superadmin."
    elif email_type == "admin_profile_setup":
        title = "Complete Your IDRIS Admin Profile"
        intro = "Welcome to IDRIS! To complete your registration, please fill out your admin profile by clicking the button below. After submission, a superadmin will review and activate your account."
        button_text = "Complete Profile"
        security_note = "This link will expire in 24 hours. If you didn't register for an admin account, please ignore this email."
    elif email_type == "admin_approved":
        title = "Your IDRIS Admin Account is Approved!"
        intro = "Great news! A superadmin has reviewed and approved your account. You can now log in with your credentials and access the admin dashboard."
        button_text = "Log In to IDRIS"
        security_note = "If you have any questions about your admin permissions, please contact your superadmin."
    else:
        raise ValueError(f"Invalid email_type: {email_type}")

    return f"""<!DOCTYPE html>
        <html lang="en"><head><meta charset="UTF-8"><title>{title}</title></head>
        <body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
        <div style="max-width:600px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #749ab6 0%, #c5d7e5 100%); padding:30px; text-align:center;">
            <h1 style="color:#fff; margin:0;">IDRIS APP</h1>
            <p style="color:#e8f2f7; margin:5px 0 0;">Integrated Disaster Response Information System</p>
            </div>
            <div style="padding:40px 30px;">
            <h2 style="color:#333;">{title}</h2>
            <p style="color:#555;">{intro}</p>
            <div style="text-align:center; margin:40px 0;">
                <a href="{link}" style="display:inline-block; padding:16px 32px; background:linear-gradient(135deg, #fcb814 0%, #e6a612 100%); color:#fff; text-decoration:none; border-radius:6px; font-weight:600; font-size:16px;">
                {button_text}
                </a>
            </div>
            <div style="background:#f8fbfd; padding:15px; border-left:4px solid #749ab6; border-radius:6px; font-size:14px; color:#666;">
                <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
                <p style="word-break:break-all; font-family:'Courier New', monospace;">{link}</p>
            </div>
            <div style="margin-top:30px; background:#fefcf0; border:1px solid #fcb814; border-radius:6px; padding:20px;">
                <h4 style="color:#c19610; margin:0 0 10px;">🔒 Security Notice</h4>
                <p style="color:#c19610; margin:0;">{security_note}</p>
            </div>
            </div>
            <div style="background:#f8fbfd; padding:20px; text-align:center; border-top:1px solid #c5d7e5;">
            <p style="font-size:14px; color:#888;"><strong>IDRIS DevTeam</strong><br>Argao, Cebu Philippines 6021<br><br>Do not reply, this is a transactional email.</p>
            </div>
        </div>
        </body></html>"""


# --- Email sending functions ---
async def send_activation_email(email: str, token: str):
    link = f"{APP_BASE_URL}/activate?token={token}"
    html_content = build_email_template("activation", link)
    await send_email_via_gmail([email], "Activate your IDRIS account", html_content)


async def send_reset_email(email: str, token: str):
    reset_link = f"{APP_BASE_URL}/reset_password?token={token}"
    html_content = build_email_template("reset", reset_link)
    await send_email_via_gmail([email], "Reset your IDRIS password", html_content)


async def send_user_activated_email(email: str):
    link = f"{APP_BASE_URL}/login"
    html_content = build_email_template("user_activated", link)
    await send_email_via_gmail([email], "Your IDRIS Account is Activated!", html_content)


async def send_admin_email_verification(email: str, token: str):
    verification_link = f"{APP_BASE_URL}/verify-admin-email?token={token}"
    html_content = build_admin_email_template("admin_email_verification", verification_link, email)
    await send_email_via_gmail([email], "Verify Your IDRIS Admin Email", html_content)


async def send_superadmin_approval_notification(admin_email: str, user_id: str, db: Session):
    superadmins = get_superadmins(db)
    superadmin_emails = [superadmin.email for superadmin in superadmins]
    if not superadmin_emails:
        logger.warning("No superadmins found in database.")
        return False

    review_link = f"{APP_BASE_URL}/admin/pending-activations"
    html_content = build_admin_email_template("superadmin_notification", review_link, admin_email)
    await send_email_via_gmail(superadmin_emails, "New Admin Pending Approval - IDRIS", html_content)


async def send_admin_activated_email(email: str):
    login_link = f"{APP_BASE_URL}/login"
    html_content = build_admin_email_template("admin_activated", login_link, email)
    await send_email_via_gmail([email], "Your IDRIS Admin Account is Activated!", html_content)


async def send_admin_activation_email(email: str, token: str):
    profile_link = f"{APP_BASE_URL}/adminactivate?token={token}"
    html_content = build_admin_email_template("admin_profile_setup", profile_link, email)
    await send_email_via_gmail([email], "Complete Your IDRIS Admin Profile", html_content)


async def send_admin_approved_email(email: str):
    login_link = f"{APP_BASE_URL}/login"
    html_content = build_admin_email_template("admin_approved", login_link, email)
    await send_email_via_gmail([email], "Your IDRIS Admin Account is Approved!", html_content)

