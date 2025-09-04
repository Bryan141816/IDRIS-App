import sys
import re
import asyncio
from typing import Optional
from sqlalchemy import text
from database import engine
from passlib.context import CryptContext
import json
from crud_functions.utils import uid_from_string
from email_handler import send_activation_email
from auth import create_token

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def error(msg: str):
    print(f"\033[31m❌ {msg}\033[0m")


# --- DB check (sync but safe to call in thread) ---
def check_user_exists(email: Optional[str] = None, username: Optional[str] = None):
    results = {"email_exists": False, "username_exists": False}

    with engine.connect() as conn:
        if email:
            result = conn.execute(
                text("SELECT COUNT(*) FROM users WHERE email = :email"),
                {"email": email},
            )
            results["email_exists"] = result.scalar() > 0

        if username:
            result = conn.execute(
                text("SELECT COUNT(*) FROM users WHERE username = :username"),
                {"username": username},
            )
            results["username_exists"] = result.scalar() > 0

    return results


def insert_super_admin(email: str, username: str, hashed_password: str) -> bool:
    try:
        # store as JSON if roles column is JSON type
        uid = uid_from_string(username)
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    INSERT INTO users (user_id, email, username, user_type, hashed_password, roles)
                    VALUES (:user_id,:email, :username, :user_type, :hashed_password, :roles)
                    """
                ),
                {
                    "user_id": uid,
                    "email": email,
                    "username": username,
                    "user_type": "admin",
                    "hashed_password": hashed_password,
                    "roles": ["super admin"],
                },
            )
        return True
    except Exception as e:
        error(f"Failed to insert super admin: {e}")
        return False


def masked_input(prompt="Password: "):
    if sys.platform == "win32":
        import msvcrt

        print(prompt, end="", flush=True)
        password = ""
        while True:
            ch = msvcrt.getch()
            if ch in {b"\r", b"\n"}:
                print()
                break
            elif ch == b"\x08":  # Backspace
                if password:
                    password = password[:-1]
                    sys.stdout.write("\b \b")
                    sys.stdout.flush()
            else:
                try:
                    char = ch.decode("utf-8")
                except UnicodeDecodeError:
                    continue
                password += char
                sys.stdout.write("*")
                sys.stdout.flush()
        return password
    else:
        import tty, termios

        fd = sys.stdin.fileno()
        old_settings = termios.tcgetattr(fd)  # type: ignore
        try:
            tty.setraw(fd)  # type: ignore
            print(prompt, end="", flush=True)
            password = ""
            while True:
                ch = sys.stdin.read(1)
                if ch in ["\n", "\r"]:
                    print()
                    break
                elif ch == "\x7f":  # Backspace
                    if password:
                        password = password[:-1]
                        sys.stdout.write("\b \b")
                        sys.stdout.flush()
                else:
                    password += ch
                    sys.stdout.write("*")
                    sys.stdout.flush()
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)  # type: ignore
        return password


# --- Input wrappers ---
async def async_input(prompt: str) -> str:
    return await asyncio.to_thread(input, prompt)


async def async_masked_input(prompt: str) -> str:
    from utility import masked_input  # import your existing sync function

    return await asyncio.to_thread(masked_input, prompt)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


# --- Async create_super_admin ---
async def create_super_admin():
    while True:
        email = (await async_input("Enter your email address: ")).strip()
        if not email:
            error("Email cannot be empty.")
            continue
        if not re.match(r"^[^@]+@[^@]+\.[^@]+$", email):
            error("Invalid email format.")
            continue
        if (await asyncio.to_thread(check_user_exists, email, None))["email_exists"]:
            error(f"Email '{email}' already exists.")
            continue
        break

    while True:
        user_name = (await async_input("Enter your user name: ")).strip()
        if not user_name:
            error("Username cannot be empty.")
            continue
        if (await asyncio.to_thread(check_user_exists, None, user_name))[
            "username_exists"
        ]:
            error(f"Username '{user_name}' already exists.")
            continue
        break

    while True:
        password = (await async_masked_input("Enter your password: ")).strip()
        confirm_password = (await async_masked_input("Confirm password: ")).strip()

        if not password or not confirm_password:
            error("Password fields cannot be empty.")
            continue
        if password != confirm_password:
            error("Passwords do not match.")
            continue
        break

    hashed = await asyncio.to_thread(hash_password, password)

    # Insert into DB
    success = await asyncio.to_thread(insert_super_admin, email, user_name, hashed)
    if success:
        token = create_token(uid_from_string(user_name), "activation")
        await send_activation_email(email, token)
        print("\033[32m✅ Super admin created successfully!\033[0m")
        print("\033[32m✅ Email sent for account activation!\033[0m")

    else:
        print("\033[31m❌ Failed to create super admin.\033[0m")


# --- Entry point ---
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Please provide a function name")
        sys.exit(1)

    command = sys.argv[1]

    if command == "create_super_admin":
        asyncio.run(create_super_admin())
    else:
        print("\033[31mCommand not found\033[0m")
