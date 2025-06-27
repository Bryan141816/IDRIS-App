from fastapi import APIRouter
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import  OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from jose import JWTError, jwt
from database import get_db
from schemas import UserCreate, UserSchema, Token, LoginSchema, UserBase
from models import User  # Import the User model
from crud import create_user, authenticate_user, get_user_by_email
from auth import create_access_token, SECRET_KEY, ALGORITHM

router = APIRouter(
    tags=["users"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserSchema:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = get_user_by_email(db, username)
    if not user:
        raise credentials_exception
    return user

@router.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Create user with username, password, email, and type
    db_user = create_user(db, email=user.email, username=user.username, password=user.password, user_type=user.user_type,roles=user.roles)

    # Assign roles
    db_user.roles = user.roles
    db.commit()
    db.refresh(db_user)

    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(form_data: LoginSchema, db: Session = Depends(get_db)):
    user = authenticate_user(db, email=form_data.email, password=form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=UserSchema)
def read_users_me(current_user: UserSchema = Depends(get_current_user)):
    return current_user

