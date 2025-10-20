from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from routers.role_checker import RoleChecker
from models import UserProfile
from crud_functions.user_profile_crud import UserProfileCRUD as CRUD
from data_schemas.user_profile_schema import UserProfileRead

# 🔹 Main router for user access
router = APIRouter(
    tags=["User Profile"]
)

# ✅ GET one profile by user_id (for user)
@router.get("/by-user/{user_id}", response_model=UserProfileRead)
async def get_user_profile_by_user_id(user_id: str, db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()  # ✅ Fixed
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    return profile
