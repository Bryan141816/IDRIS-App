from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, time, timedelta
from typing import Optional
from jose import jwt, JWTError, ExpiredSignatureError

# =============================
# CONFIGURATION
# =============================

SECRET_KEY = "your-secret-key"  # Use os.getenv("SECRET_KEY") in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# =============================
# PASSWORD HASHING
# =============================


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# =============================
# TOKEN CREATION
# =============================


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a short-lived access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a long-lived refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_activation_token(user_id: int):
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode = {"sub": str(user_id), "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# =============================
# TOKEN DECODING (optional)
# =============================


def decode_token(token: str) -> dict:
    """Decode a token to get the payload"""

    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def decode_activation_token(token: str) -> int | None:
    """
    Decodes the JWT activation token and returns the user_id.
    Returns None if token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            # sub claim missing
            return None
        return int(sub)
    except ExpiredSignatureError:
        print("Token has expired")
        return None
    except JWTError:
        print("Token is invalid")
        return None
