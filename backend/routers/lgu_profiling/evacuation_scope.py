# routers/lgu_profiling/evacuation_scope.py
from __future__ import annotations
from typing import List, Optional, Dict, Any, Tuple
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from routers.auth.authentication import get_current_user_from_access_token as get_current_user

# ==== MODELS (match your schema) ====
from models import (
    User,
    UserProfile,
    LGURecords,
    BaranggayRecords,
    EvacuationCenter,
)

router = APIRouter(prefix="/evacuation", tags=["Evacuation"])

# ---------------------------
# Pydantic response schemas
# ---------------------------

class BarangayMiniOut(BaseModel):
    id: int
    name: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    baranggay_pic: Optional[str] = None

    class Config:
        from_attributes = True  # Pydantic v2 (use orm_mode=True for v1)


class EvacuationOut(BaseModel):
    id: int
    name: str
    lat: float
    lng: float
    capacity: int
    occupied: int
    barangay: Optional[List[BarangayMiniOut]] = None

    class Config:
        from_attributes = True


class ScopeOut(BaseModel):
    lgu: Optional[Dict[str, Any]] = None
    barangay: Optional[Dict[str, Any]] = None


class MyCentersOut(BaseModel):
    scope: ScopeOut
    centers: List[EvacuationOut]


# ---------------------------
# Helpers
# ---------------------------

def _norm(s: Optional[str]) -> str:
    return (s or "").strip().lower()


def _split_address(addr: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Accepts strings like: 'Lamacan, Argao, Cebu, Philippines'
    Returns (barangay, lgu, province)
    """
    parts = [p.strip() for p in (addr or "").split(",") if p.strip()]
    brgy = parts[0] if len(parts) > 0 else None
    lgu  = parts[1] if len(parts) > 1 else None
    prov = parts[2] if len(parts) > 2 else None
    return brgy, lgu, prov


def _resolve_lgu(db: Session, lgu_name: Optional[str]) -> Optional[LGURecords]:
    if not lgu_name:
        return None
    q = _norm(lgu_name)

    row = (
        db.query(LGURecords)
        .filter(func.lower(func.trim(LGURecords.lgu_name)) == q)
        .first()
    )
    if row:
        return row

    # fallback: contains match (e.g., "City of Naga" vs "Naga City")
    return (
        db.query(LGURecords)
        .filter(func.lower(LGURecords.lgu_name).ilike(f"%{q}%"))
        .first()
    )


def _resolve_barangay(
    db: Session,
    brgy_name: Optional[str],
    lgu: Optional[LGURecords],
) -> Optional[BaranggayRecords]:
    if not brgy_name:
        return None
    q = _norm(brgy_name)

    base = db.query(BaranggayRecords)

    # 🔧 SAFE PK lookup (LGURecords may use `id` or `lgu_id`)
    if lgu is not None:
        lgu_pk = getattr(lgu, "id", None)
        if lgu_pk is None:
            lgu_pk = getattr(lgu, "lgu_id", None)
        if lgu_pk is not None:
            base = base.filter(BaranggayRecords.lgu_id == lgu_pk)

    row = base.filter(func.lower(func.trim(BaranggayRecords.name)) == q).first()
    if row:
        return row

    return base.filter(func.lower(BaranggayRecords.name).ilike(f"%{q}%")).first()


def _centers_from_barangay_link(db: Session, brgy: BaranggayRecords) -> List[EvacuationCenter]:
    """
    Your barangay model has `evacucation_center_id` (FK) → `evacuation_center.evacuation_id`.
    Fetch the single linked center if present.
    """
    ev_id = getattr(brgy, "evacucation_center_id", None)  # keep original column spelling
    if not ev_id:
        return []
    return (
        db.query(EvacuationCenter)
        .filter(getattr(EvacuationCenter, "evacuation_id") == ev_id)
        .all()
    )


def _pack_centers(rows: List[EvacuationCenter]) -> List[EvacuationOut]:
    packed: List[EvacuationOut] = []
    for r in rows:
        # Attach barangay info if relationship exists
        brgys: List[BarangayMiniOut] = []
        if hasattr(r, "barangay") and r.barangay is not None:
            b = r.barangay  # relationship if defined on EvacuationCenter
            try:
                brgys.append(
                    BarangayMiniOut(
                        id=b.id,
                        name=b.name,
                        lat=getattr(b, "lat", None),
                        lng=getattr(b, "lng", None),
                        baranggay_pic=getattr(b, "baranggay_pic", None),
                    )
                )
            except Exception:
                pass

        packed.append(
            EvacuationOut(
                id=int(getattr(r, "evacuation_id", getattr(r, "id", 0)) or 0),
                name=str(getattr(r, "name", "") or ""),
                lat=float(getattr(r, "lat", 0.0) or 0.0),
                lng=float(getattr(r, "lng", 0.0) or 0.0),
                capacity=int(getattr(r, "capacity", 0) or 0),
                occupied=int(getattr(r, "occupied", 0) or 0),
                barangay=brgys or None,
            )
        )
    return packed


# ---------------------------
# Core resolver
# ---------------------------

def _resolve_scope_for_user(
    db: Session,
    user: User,
) -> Tuple[Optional[LGURecords], Optional[BaranggayRecords]]:
    """
    Resolve user's LGU + Barangay using:
    1) Explicit normalized columns on UserProfile if present
    2) Parse free-form address like 'Lamacan, Argao, Cebu, Philippines'
    """
    # Your FK to user is a string field `user_id`
    prof = db.query(UserProfile).filter(UserProfile.user_id == user.user_id).first()

    brgy_name: Optional[str] = None
    lgu_name: Optional[str] = None

    if prof:
        # If later you add normalized columns (e.g., prof.barangay_name, prof.lgu_name), prefer those
        brgy_name = getattr(prof, "barangay_name", None)
        lgu_name  = getattr(prof, "lgu_name", None)

        if not (brgy_name and lgu_name):
            addr = getattr(prof, "address", "") or ""
            a_brgy, a_lgu, _ = _split_address(addr)
            brgy_name = brgy_name or a_brgy
            lgu_name  = lgu_name  or a_lgu

    if not (brgy_name and lgu_name):
        return None, None

    lgu = _resolve_lgu(db, lgu_name)
    brgy = _resolve_barangay(db, brgy_name, lgu)
    return lgu, brgy


# ---------------------------
# Endpoints
# ---------------------------

@router.get("/my_centers", response_model=MyCentersOut)
def get_my_centers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lgu, brgy = _resolve_scope_for_user(db, current_user)

    if not lgu and not brgy:
        # No scope resolved, return empty set (avoid 404 for frontend simplicity)
        return MyCentersOut(scope=ScopeOut(lgu=None, barangay=None), centers=[])

    centers: List[EvacuationCenter] = []
    if brgy:
        centers = _centers_from_barangay_link(db, brgy)

    lgu_id_safe = None
    if lgu is not None:
        lgu_id_safe = getattr(lgu, "id", getattr(lgu, "lgu_id", None))

    scope = ScopeOut(
        lgu={"id": lgu_id_safe, "name": lgu.lgu_name} if lgu else None,
        barangay={"id": brgy.id, "name": brgy.name} if brgy else None,
    )
    return MyCentersOut(scope=scope, centers=_pack_centers(centers))


@router.get("/scope_address", response_model=MyCentersOut)
def get_scope_address(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Reuse logic; frontend can read `scope` for lgu/brgy names
    return get_my_centers(db=db, current_user=current_user)
