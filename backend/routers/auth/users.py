from fastapi import APIRouter
from fastapi import Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, cast
from typing import List
from database import get_db
from models import User  # Import the User model
from schemas import UserSchema, UserSimple
from sqlalchemy.dialects.postgresql import JSONB

router = APIRouter()

@router.get("/users/by-email/{email}", response_model=UserSchema)
def get_user_by_email_endpoint(email: str, db: Session = Depends(get_db)):  # Renamed to avoid conflict
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/get_w_type_donor/", response_model=List[UserSimple])
def get_user_by_type(
    search: List[str] = Query(..., description="List of names to search for", example=["Alice", "Bob"]),
    db: Session = Depends(get_db)
):
    users = db.query(User).filter(
        and_(
            User.roles.cast(JSONB).contains(["donor"]),
            or_(*[User.username.ilike(f"%{s}%") for s in search])
        )
    ).all()
    if not users:
        raise HTTPException(status_code=404, detail="No users found with given names")
    return users
