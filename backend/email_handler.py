import logging
from typing import List
from fastapi import Depends
from fastapi_mail import ConnectionConfig, MessageSchema, FastMail
from decouple import config
from crud import get_superadmins
from database import get_db
from sqlalchemy.orm import Session

conf = ConnectionConfig(
    MAIL_USERNAME=config("MAIL_USERNAME"),
    MAIL_PASSWORD=config("MAIL_PASSWORD"),
    MAIL_FROM=config("MAIL_FROM"),
    MAIL_PORT=config("MAIL_PORT", cast=int),
    MAIL_SERVER=config("MAIL_SERVER"),
    MAIL_STARTTLS=config("MAIL_STARTTLS", cast=bool),
    MAIL_SSL_TLS=config("MAIL_SSL_TLS", cast=bool),
    USE_CREDENTIALS=config("USE_CREDENTIALS", cast=bool, default=True),
    VALIDATE_CERTS=config("VALIDATE_CERTS", cast=bool, default=True),
)

logger = logging.getLogger(__name__)

APP_BASE_URL = config("APP_BASE_URL", default="http://localhost:5173")
SUPERADMIN_EMAIL = config("SUPERADMIN_EMAIL", default=None)

def build_email_template(email_type: str, link: str) -> str:
    """
    Build an HTML email template for account activation or password reset.
    """
    if email_type == "activation":
        title = "Welcome to IDRIS!"
        intro = "Your account is almost ready. To complete the activation process, click the button below:"
        button_text = "Activate My Account"
        security_note = "This activation link will expire in 24 hours. If you didn’t create an account, ignore this email."
    elif email_type == "reset":
        title = "Password Reset Request for IDRIS"
        intro = "We received a request to reset the password for your IDRIS account. Click the button below to reset it:"
        button_text = "Reset My Password"
        security_note = "This reset link will expire in 24 hours. If you didn’t request a reset, ignore this email. Your account will remain secure."
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
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #749ab6 0%, #c5d7e5 100%); padding:30px; text-align:center;">
                <h1 style="color:#fff; margin:0;">IDRIS APP</h1>
                <p style="color:#e8f2f7; margin:5px 0 0;">Integrated Disaster Response Information System</p>
            </div>
            
            <!-- Body -->
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
            
            <!-- Footer -->
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

def build_admin_email_template(email_type: str, link: str, admin_email: str) -> str:
    """
    Build an HTML email template for admin onboarding / notifications.
    email_type: 'admin_activation', 'superadmin_notification', 'admin_profile_complete'
    """
    if email_type == "admin_activation":
        title = "Complete Your IDRIS Admin Profile"
        intro = "Welcome to the IDRIS team! To get started, please complete your profile by clicking the button below. Once your profile is complete, a superadmin will review and activate your account."
        button_text = "Complete Your Profile"
        security_note = "This link will expire in 24 hours. If you didn’t create an account, ignore this email."
    elif email_type == "superadmin_notification":
        title = "New Admin Registration"
        intro = f"A new admin has registered with the email: {admin_email}. Please review their profile and activate their account."
        button_text = "View Pending Activations"
        security_note = "This is a notification for superadmins."
    elif email_type == "admin_profile_complete":
        title = "Admin Profile Submitted for Review"
        intro = f"An admin with the email {admin_email} has completed their profile. Please review their information and activate their account if approved."
        button_text = "Review Profile"
        security_note = "This is a notification for superadmins."
    else:
        raise ValueError("Invalid email_type. Must be 'admin_activation', 'superadmin_notification', or 'admin_profile_complete'.")

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
        
async def _send_message(message: MessageSchema) -> bool:
    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        return True
    except Exception as e:
        logger.exception("Failed to send email: %s", e)
        return False
    

async def send_activation_email(email: str, token: str):
    link = f"http://localhost:5173/activate?token={token}"
    html_content = build_email_template("activation", link)

    message = MessageSchema(
        subject="Activate your IDRIS account",
        recipients=[email],
        body=html_content,
        subtype="html",
    )

    fm = FastMail(conf)
    await fm.send_message(message)

async def send_admin_activation_email(email: str, token: str) -> List[bool]:
    # Use SUPERADMIN_EMAIL env var if set, otherwise attempt to continue but log a warning
    if not SUPERADMIN_EMAIL:
        logger.warning("SUPERADMIN_EMAIL not set in environment; superadmin notifications will not be sent.")
    admin_link = f"{APP_BASE_URL}/activate?token={token}"
    admin_html_content = build_admin_email_template("admin_activation", admin_link, email)
    admin_message = MessageSchema(
        subject="Complete your IDRIS Admin Profile",
        recipients=[email],
        body=admin_html_content,
        subtype="html",
    )

    results = []
    results.append(await _send_message(admin_message))

    if SUPERADMIN_EMAIL:
        superadmin_link = f"{APP_BASE_URL}/admin/pending_activations"
        superadmin_html = build_admin_email_template("superadmin_notification", superadmin_link, email)
        superadmin_message = MessageSchema(
            subject="New Admin Registration",
            recipients=[SUPERADMIN_EMAIL],
            body=superadmin_html,
            subtype="html",
        )
        results.append(await _send_message(superadmin_message))
    return results

async def send_admin_profile_complete_email(admin_email: str, user_id: str, db: Session = Depends(get_db)):
    superadmins = get_superadmins(db)
    superadmin_emails = [superadmin.email for superadmin in superadmins]

    if superadmin_emails:
        link = f"http://localhost:5173/admin/activate_user/{user_id}"
        html_content = build_admin_email_template("admin_profile_complete", link, admin_email)

        message = MessageSchema(
            subject="Admin Profile Ready for Review",
            recipients=superadmin_emails,
            body=html_content,
            subtype="html",
        )

        fm = FastMail(conf)
        await fm.send_message(message)


async def send_user_activated_email(email: str):
    link = "http://localhost:5173/login"
    html_content = build_email_template("user_activated", link)

    message = MessageSchema(
        subject="Your IDRIS Account is Activated!",
        recipients=[email],
        body=html_content,
        subtype="html",
    )

    fm = FastMail(conf)
    await fm.send_message(message)

async def send_reset_email(email: str, token: str):
    reset_link = f"http://localhost:5173/reset_password?token={token}"
    html_content = build_email_template("reset", reset_link)

    message = MessageSchema(
        subject="Reset your IDRIS password",
        recipients=[email],
        body=html_content,
        subtype="html",  # important for HTML emails
    )

    fm = FastMail(conf)
    await fm.send_message(message)
