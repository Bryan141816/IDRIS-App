# LGUofficer.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from database import get_db
from models import User, LGURecords
from routers.auth.authentication import get_current_user_from_access_token
from schemas import LGURecordsUpdate, LGURecordsOut
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lgu_profiling", tags=["LGU Profiling"])

# ------------------------- Helpers -------------------------

def _require_profile_with_location(user: User):
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
    return prof

def _fetch_lgu_by_user(db: Session, user: User) -> LGURecords | None:
    """Primary lookup: one LGU record per user_id."""
    return (
        db.query(LGURecords)
        .filter(LGURecords.user_id == user.user_id)
        .first()
    )

# (kept for admin utilities; not used by officer endpoints anymore)
def _fetch_lgu_by_location(db: Session, lgu_location: str) -> LGURecords | None:
    """Case/space-insensitive lookup by LGU name."""
    if not lgu_location:
        return None
    q_name = lgu_location.strip()
    return (
        db.query(LGURecords)
        .filter(func.lower(func.trim(LGURecords.name)) == q_name.lower())
        .first()
    )

# ------------------------- Endpoints -------------------------

@router.get("/me/lgu_location")
def get_my_lgu_location(
    current_user: User = Depends(get_current_user_from_access_token),
):
    """
    Return the officer's assigned LGU location (locked 'name' value for forms).
    """
    prof = _require_profile_with_location(current_user)
    return {"lgu_location": prof.lgu_location}

@router.get("/manage_lgu/my_lgu", response_model=LGURecordsOut)
def get_my_lgu(
    current_user: User = Depends(get_current_user_from_access_token),
    db: Session = Depends(get_db),
):
    """
    Fetch the LGU record bound to the current user (one-per-user).
    NOTE: This does NOT create anything. If the row doesn't exist -> 404.
    """
    _require_profile_with_location(current_user)  # validates profile + location exists
    lgu = _fetch_lgu_by_user(db, current_user)
    if not lgu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="LGU record not found for your account.",
        )
    return lgu

@router.put("/manage_lgu/my_lgu", response_model=LGURecordsOut)
def update_my_lgu(
    body: LGURecordsUpdate,
    current_user: User = Depends(get_current_user_from_access_token),
    db: Session = Depends(get_db),
):
    """
    Update the LGU record bound to the current user.
    - Only updates an existing row (no create/upsert).
    - 'name' is locked to the officer's profile location (cannot rename).
    """
    _require_profile_with_location(current_user)

    lgu = _fetch_lgu_by_user(db, current_user)
    if not lgu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="LGU record not found for your account. Initialize it first.",
        )

    update_data = body.model_dump(exclude_unset=True, exclude_none=True)
    update_data.pop("name", None)  # never allow renaming

    try:
        for k, v in update_data.items():
            setattr(lgu, k, v)
        db.commit()
        db.refresh(lgu)
        return lgu
    except SQLAlchemyError as e:
        db.rollback()
        logger.exception("Failed to update LGU for user '%s': %s", current_user.user_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update LGU.",
        )

@router.get("/manage_lgu/my_lgu_auto", response_model=LGURecordsOut)
def get_or_create_my_lgu(
    current_user: User = Depends(get_current_user_from_access_token),
    db: Session = Depends(get_db),
):
    """
    Ensure the current user has an LGU record:
    - If it exists (by user_id), return it.
    - Otherwise, create one using the user's locked lgu_location as the name.
    """
    prof = _require_profile_with_location(current_user)

    lgu = _fetch_lgu_by_user(db, current_user)
    if not lgu:
        try:
            lgu = LGURecords(
                user_id=current_user.user_id,          # ✅ REQUIRED: one-per-user
                name=prof.lgu_location.strip(),        # display/locked name
                lat=0.0,
                lng=0.0,
                classification="Unclassified",
                population=0,
                contact_info="N/A",
                description="",
            )
            db.add(lgu)
            db.commit()
            db.refresh(lgu)
        except IntegrityError:
            db.rollback()
            # race: someone created it—re-read by user
            lgu = _fetch_lgu_by_user(db, current_user)
            if not lgu:
                raise HTTPException(status_code=500, detail="LGU creation race condition.")
        except SQLAlchemyError as e:
            db.rollback()
            logger.exception("Failed to auto-create LGU for user '%s': %s", current_user.user_id, str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to auto-create LGU record.",
            )

    return lgu
    