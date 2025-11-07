# routers/lgu_profiling/evacuation_scope.py
from __future__ import annotations
from typing import List, Optional, Dict, Any, Tuple, Set
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
    # barangay intentionally omitted for LGU-wide scope


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


def _centers_for_lgu(db: Session, lgu: LGURecords) -> List[EvacuationCenter]:
    """
    Return ALL evacuation centers within the given LGU.

    Supports two schemas:
      A) EvacuationCenter has a direct FK 'lgu_id' (preferred if present)
      B) Evacuation centers are referenced by barangays:
           BaranggayRecords.evacucation_center_id -> EvacuationCenter.evacuation_id
         and barangays belong to an LGU via BaranggayRecords.lgu_id
    """
    centers: List[EvacuationCenter] = []

    # Try direct FK first, if model has it
    lgu_pk = getattr(lgu, "id", getattr(lgu, "lgu_id", None))
    has_center_lgu_fk = hasattr(EvacuationCenter, "lgu_id")

    if has_center_lgu_fk and lgu_pk is not None:
        direct = (
            db.query(EvacuationCenter)
            .filter(getattr(EvacuationCenter, "lgu_id") == lgu_pk)
            .all()
        )
        centers.extend(direct)

    # Also collect via barangays -> centers relationship
    if lgu_pk is not None:
        # Get distinct center ids from barangays within this LGU
        brgy_q = (
            db.query(BaranggayRecords)
            .filter(BaranggayRecords.lgu_id == lgu_pk)
            .filter(getattr(BaranggayRecords, "evacucation_center_id") != None)  # noqa: E711
            .all()
        )
        center_ids: Set[int] = set()
        for b in brgy_q:
            cid = getattr(b, "evacucation_center_id", None)  # keep original spelling
            if cid:
                center_ids.add(int(cid))

        if center_ids:
            # EvacuationCenter PK could be 'evacuation_id' or 'id'
            pk_attr = "evacuation_id" if hasattr(EvacuationCenter, "evacuation_id") else "id"
            via_brgy = (
                db.query(EvacuationCenter)
                .filter(getattr(EvacuationCenter, pk_attr).in_(center_ids))
                .all()
            )
            centers.extend(via_brgy)

    # Deduplicate by PK
    def _key(c: EvacuationCenter) -> int:
        return int(getattr(c, "evacuation_id", getattr(c, "id", 0)) or 0)

    unique = { _key(c): c for c in centers if _key(c) is not None }
    return list(unique.values())


def _resolve_lgu_for_user(db: Session, user: User) -> Optional[LGURecords]:
    """
    Resolve user's LGU using normalized columns if present, else parse free-form address.
    """
    prof = db.query(UserProfile).filter(UserProfile.user_id == user.user_id).first()

    lgu_name: Optional[str] = None
    if prof:
        # Prefer normalized column if you have it
        lgu_name = getattr(prof, "lgu_name", None)
        if not lgu_name:
            # Fallback to parsing the address
            _, parsed_lgu, _ = _split_address(getattr(prof, "address", "") or "")
            lgu_name = parsed_lgu

    if not lgu_name:
        return None

    return _resolve_lgu(db, lgu_name)


# ---------------------------
# Endpoints
# ---------------------------

@router.get("/my_centers", response_model=MyCentersOut)
def get_my_centers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # LGU-wide scope only
    lgu = _resolve_lgu_for_user(db, current_user)

    if not lgu:
        # No LGU resolved → empty set to keep frontend simple
        return MyCentersOut(scope=ScopeOut(lgu=None), centers=[])

    centers = _centers_for_lgu(db, lgu)

    lgu_id_safe = getattr(lgu, "id", getattr(lgu, "lgu_id", None))
    scope = ScopeOut(
        lgu={"id": lgu_id_safe, "name": lgu.lgu_name}
    )
    return MyCentersOut(scope=scope, centers=_pack_centers(centers))


@router.get("/scope_address", response_model=MyCentersOut)
def get_scope_address(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Same as /my_centers — returns LGU-wide scope and centers
    return get_my_centers(db=db, current_user=current_user)
