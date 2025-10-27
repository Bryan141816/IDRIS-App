# LGUofficer.py
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models import User, LGURecords
from routers.auth.authentication import get_current_user_from_access_token
from schemas import LGURecordsUpdate, LGURecordsOut

logger = logging.getLogger(__name__)

# Prefix matches your logs: /lgu_profiling/...
router = APIRouter(prefix="/lgu_profiling", tags=["LGU Profiling"])


# ------------------------- Helpers -------------------------

def _shorten_place(raw: Optional[str]) -> Optional[str]:
    """Take only the first component before the first comma."""
    if not raw:
        return None
    return raw.split(",")[0].strip()

def _require_profile_with_location(user: User):
    """
    Ensure the current user has an Admin profile with lgu_location set.
    Raises 404 if missing to match your existing behavior.
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
    return prof

def _fetch_lgu_by_user(db: Session, user: User) -> LGURecords | None:
    """Primary lookup: exactly one LGU record per user_id (officer-owned LGU)."""
    return (
        db.query(LGURecords)
        .filter(LGURecords.user_id == user.user_id)
        .first()
    )

def _fetch_lgu_by_name_tolerant(db: Session, raw_name: str) -> LGURecords | None:
    """
    Tolerant name search for shared LGU rows:
    - Accepts full addresses and reduces to the first component (e.g., 'Sibonga')
    - Case/space-insensitive exact match first, then ILIKE contains
    """
    short = _shorten_place(raw_name)
    if not short:
        return None

    exact = (
        db.query(LGURecords)
        .filter(func.lower(func.trim(LGURecords.name)) == short.lower())
        .first()
    )
    if exact:
        return exact

    return (
        db.query(LGURecords)
        .filter(LGURecords.name.ilike(f"%{short}%"))
        .order_by(LGURecords.name.asc())
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
        logger.exception(
            "Failed to update LGU for user '%s': %s",
            current_user.user_id, str(e)
        )
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
    Ensure the current user has an LGU record tied to their account:
    - If it exists (by user_id), return it.
    - Otherwise, create one using the user's locked lgu_location as the name.
    """
    prof = _require_profile_with_location(current_user)

    lgu = _fetch_lgu_by_user(db, current_user)
    if not lgu:
        try:
            lgu = LGURecords(
                user_id=current_user.user_id,          # ✅ one-per-user
                name=_shorten_place(prof.lgu_location) or prof.lgu_location.strip(),
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
            # Race: someone created it—re-read by user
            lgu = _fetch_lgu_by_user(db, current_user)
            if not lgu:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="LGU creation race condition.",
                )
        except SQLAlchemyError as e:
            db.rollback()
            logger.exception(
                "Failed to auto-create LGU for user '%s': %s",
                current_user.user_id, str(e)
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to auto-create LGU record.",
            )

    return lgu


@router.get("/manage_lgu/find_lgu_by_name", response_model=LGURecordsOut)
def officer_find_lgu_by_name(
    name: str = Query(..., description="LGU name or full address; e.g. 'Sibonga, Cebu, Philippines, 6020'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_access_token),
):
    """
    Tolerant finder so the FE can pass full addresses from /me/lgu_location.
    Looks up shared LGU rows by name. Does not bind to the user.
    """
    short = _shorten_place(name)
    if not short:
        raise HTTPException(status_code=400, detail="Invalid 'name' value")

    rec = _fetch_lgu_by_name_tolerant(db, short)
    if not rec:
        raise HTTPException(status_code=404, detail=f"LGU '{short}' not found")

    return rec


# (Optional) header-based variant if you want to send the location in a header
@router.get("/manage_lgu/my_lgu_by_header", response_model=LGURecordsOut)
def my_lgu_by_header(
    x_lgu_location: Optional[str] = Header(None, alias="X-LGU-Location"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_access_token),
):
    """
    Alternative to query param—read place from 'X-LGU-Location' header.
    Useful if your FE already sets this globally.
    """
    if not x_lgu_location:
        raise HTTPException(status_code=400, detail="X-LGU-Location header is required")

    short = _shorten_place(x_lgu_location)
    rec = _fetch_lgu_by_name_tolerant(db, short or x_lgu_location)
    if not rec:
        raise HTTPException(status_code=404, detail=f"LGU '{short}' not found")

    return rec
