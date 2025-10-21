from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import UserProfile, User
from crud_functions.user_profile_crud import UserProfileCRUD as CRUD
from data_schemas.user_profile_schema import UserProfileRead
from routers.auth.authentication import get_current_user_from_access_token

# 🔹 Main router for user access
router = APIRouter(
    prefix="/user-profile",
    tags=["User Profile"]
)

# ✅ GET profile for the current authenticated user
@router.get("/me", response_model=UserProfileRead)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user_from_access_token),
    db: Session = Depends(get_db)
):
    profile = CRUD.get_user_profile_by_user_id(db, user_id=current_user.user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    return profile
