# LGUofficer.py
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import User, LGURecords, AdminUserProfile, LGURecords
from routers.auth.authentication import get_current_user_from_access_token
from schemas import LGURecordsUpdate, LGURecordsOut
from routers.GetUserId import GetUserId
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Prefix matches your logs: /lgu_profiling/...
router = APIRouter(prefix="/lgu_profiling", tags=["LGU Profiling"])


class LGUOut(BaseModel):
    id: int
    lgu_name: str
    lgu_classification: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    mayor: Optional[str] = None
    lgu_contact: Optional[str] = None

    class Config:
        # Pydantic v1:
        orm_mode = True
        # If on Pydantic v2, use:
        # from_attributes = True


@router.get("/me/lgu_location", response_model=LGUOut)
def lgu_profiling(
    db: Session = Depends(get_db),
    user_id: str = Depends(GetUserId()),
):
    # 1) Load the admin profile for the current user and eager-load its LGU
    admin_profile = (
        db.query(AdminUserProfile)
        .options(joinedload(AdminUserProfile.lgu))
        .filter(AdminUserProfile.user_id == user_id)
        .first()
    )
    if not admin_profile:
        raise HTTPException(status_code=404, detail="Admin profile not found for user")

    if not admin_profile.lgu:
        raise HTTPException(
            status_code=404, detail="LGU record not linked to this admin profile"
        )

    return admin_profile.lgu
