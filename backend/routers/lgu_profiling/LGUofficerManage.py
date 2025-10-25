from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy import func
from typing import Optional
from database import get_db
from models import User, LGURecords
from routers.auth.authentication import get_current_user_from_access_token
from schemas import LGURecordsCreate, LGURecordsUpdate, LGURecordsOut

admin_router = APIRouter(prefix="/admin/lgu", tags=["Admin LGU"])

def _require_admin(user: User):
    """Adjust role check to your auth model."""
    roles = set(getattr(user, "roles", []) or [])
    if "admin" in roles or getattr(user, "user_role", None) == "admin":
        return user
    raise HTTPException(status_code=403, detail="Admin privileges required.")

def _by_name(db: Session, name: str) -> Optional[LGURecords]:
    return (
        db.query(LGURecords)
        .filter(func.lower(func.trim(LGURecords.name)) == name.strip().lower())
        .first()
    )

@admin_router.post("", response_model=LGURecordsOut, status_code=status.HTTP_201_CREATED)
def create_lgu(
    body: LGURecordsCreate,
    current_user: User = Depends(get_current_user_from_access_token),
    db: Session = Depends(get_db),
):
    """
    Admin-only: seed/create an LGU row.
    NOTE: Your LGURecords model has non-nullable fields; provide placeholders if needed.
    """
    _require_admin(current_user)

    if _by_name(db, body.name):
        raise HTTPException(status_code=409, detail="LGU with this name already exists.")

    try:
        lgu = LGURecords(**body.model_dump())
        db.add(lgu)
        db.commit()
        db.refresh(lgu)
        return lgu
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Duplicate LGU (name).")
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create LGU: {e}")

@admin_router.put("/by-name/{name}", response_model=LGURecordsOut)
def update_lgu_by_name(
    name: str,
    body: LGURecordsUpdate,
    current_user: User = Depends(get_current_user_from_access_token),
    db: Session = Depends(get_db),
):
    """
    Admin-only: update an LGU row by its name (case/space-insensitive).
    Renaming is blocked (ignores 'name' in payload).
    """
    _require_admin(current_user)

    lgu = _by_name(db, name)
    if not lgu:
        raise HTTPException(status_code=404, detail="LGU not found.")

    data = body.model_dump(exclude_unset=True)
    data.pop("name", None)

    try:
        for k, v in data.items():
            setattr(lgu, k, v)
        db.commit()
        db.refresh(lgu)
        return lgu
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update LGU: {e}")

@admin_router.get("/by-name/{name}", response_model=LGURecordsOut)
def get_lgu_by_name(
    name: str,
    current_user: User = Depends(get_current_user_from_access_token),
    db: Session = Depends(get_db),
):
    """
    Admin-only: fetch an LGU by name.
    """
    _require_admin(current_user)
    lgu = _by_name(db, name)
    if not lgu:
        raise HTTPException(status_code=404, detail="LGU not found.")
    return lgu
