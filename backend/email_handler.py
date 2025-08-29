from fastapi_mail import ConnectionConfig, MessageSchema, FastMail
from decouple import config

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


async def send_activation_email(email: str, token: str):
    activation_link = f"http://localhost:5173/activate?token={token}"
    message = MessageSchema(
        subject="Activate your account",
        recipients=[email],
        body=f"Click here to activate your account: {activation_link}",
        subtype="plain",
    )

    fm = FastMail(conf)
    await fm.send_message(message)


async def send_reset_email(email: str, token: str):
    reset_link = f"http://localhost:5173/reset_password?token={token}"
    message = MessageSchema(
        subject="Reset Password",
        recipients=[email],
        body=f"Click here to reset your password: {reset_link}",
        subtype="plain",
    )
    fm = FastMail(conf)
    await fm.send_message(message)
