# routers/lgu_profiling/LGUofficer.py
from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from database import get_db  # (kept if you use Depends later; otherwise removable)
from models import User
from routers.auth.authentication import get_current_user_from_access_token

router = APIRouter(prefix="/lgu_profiling", tags=["LGU Profiling"])

class LGULocationOut(BaseModel):
    lgu_location: str

def _require_profile_with_location(user: User) -> str:
    """
    Ensure the current user has an Admin profile with lgu_location set.
    Return the location string. Raise 404 if missing.
    """
    prof = getattr(user, "admin_user_profile", None)
    if not prof:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin profile not found for this user.",
        )
    if not getattr(prof, "lgu_location", None):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="LGU location not set for this user.",
        )
    return prof.lgu_location

@router.get("/me/lgu_location", response_model=LGULocationOut)
def get_my_lgu_location(
    current_user: User = Depends(get_current_user_from_access_token),
):
    """
    Return only the officer's assigned LGU location (string).
    No LGU record lookups or writes.
    """
    loc = _require_profile_with_location(current_user)
    return LGULocationOut(lgu_location=loc)

# (Optional) short alias if you like
@router.get("/me/location", response_model=LGULocationOut, include_in_schema=False)
def get_my_location_alias(
    current_user: User = Depends(get_current_user_from_access_token),
):
    loc = _require_profile_with_location(current_user)
    return LGULocationOut(lgu_location=loc)
