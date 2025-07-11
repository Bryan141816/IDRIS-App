from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from schemas import UserCreate, UserSchema, LoginSchema
from models import User
from crud import create_user, authenticate_user, get_user_by_email
from auth import create_access_token, SECRET_KEY, ALGORITHM
from database import get_db

router = APIRouter(tags=["users"])

COOKIE_NAME = "access_token"


def get_token_from_cookie(request: Request):
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    return token


def get_current_user(
    token: str = Depends(get_token_from_cookie), db: Session = Depends(get_db)
) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/register", response_model=UserSchema)
def register(user: UserCreate, response: Response, db: Session = Depends(get_db)):
    db_user = create_user(
        db,
        email=user.email,
        username=user.username,
        password=user.password,
        user_type=user.user_type,
        roles=user.roles,
    )
    token = create_access_token(data={"sub": db_user.email})

    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        max_age=60 * 60 * 24,
        samesite="Lax",
        secure=False,  # Use True in production with HTTPS
    )
    return db_user


@router.post("/login", response_model=UserSchema)
def login(form_data: LoginSchema, response: Response, db: Session = Depends(get_db)):
    user = authenticate_user(db, email=form_data.email, password=form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(data={"sub": user.email})
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        max_age=60 * 60 * 24,
        samesite="Lax",
        secure=False,
    )
    return user


@router.get("/users/me", response_model=UserSchema)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME)
    return {"message": "Logged out"}
