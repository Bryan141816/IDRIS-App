# routers/lgu_profiling/evacuation_scope.py
from __future__ import annotations
from typing import List, Optional, Dict, Any, Tuple, Set
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, select
from collections import defaultdict
from database import get_db
from routers.auth.authentication import get_current_user_from_access_token as get_current_user
from routers.GetUserId import GetUserId
# ==== MODELS (match your schema) ====
from models import (
    User,
    UserProfile,
    LGURecords,
    BaranggayRecords,
    EvacuationCenter,
    AdminUserProfile
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
    lgu: Optional[Dict[str, Any]] = None  # LGU-wide scope only


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


def _brgy_map_for_lgu(db: Session, lgu_pk: int) -> Dict[int, List[BaranggayRecords]]:
    """
    For an LGU, return { evacuation_center_id: [barangay records...] }.
    Uses DB spelling 'evacucation_center_id'.
    """
    brgys = (
        db.query(BaranggayRecords)
        .filter(BaranggayRecords.lgu_id == lgu_pk)
        .filter(getattr(BaranggayRecords, "evacucation_center_id") != None)  # noqa: E711
        .all()
    )
    m: Dict[int, List[BaranggayRecords]] = {}
    for b in brgys:
        cid = getattr(b, "evacucation_center_id", None)
        if cid is None:
            continue
        cid = int(cid)
        m.setdefault(cid, []).append(b)
    return m


def _pack_centers(
    rows: List[EvacuationCenter],
    brgy_map: Optional[Dict[int, List[BaranggayRecords]]] = None,
) -> List[EvacuationOut]:
    packed: List[EvacuationOut] = []
    for r in rows:
        center_pk = int(getattr(r, "evacuation_id", getattr(r, "id", 0)) or 0)

        # Attach barangay info from the provided map (preferred), or fallback to ORM relation if present
        brgys: List[BarangayMiniOut] = []
        if brgy_map and center_pk in brgy_map:
            for b in brgy_map[center_pk]:
                brgys.append(
                    BarangayMiniOut(
                        id=int(getattr(b, "id")),
                        name=str(getattr(b, "name")),
                        lat=getattr(b, "lat", None),
                        lng=getattr(b, "lng", None),
                        baranggay_pic=getattr(b, "baranggay_pic", None),
                    )
                )
        elif hasattr(r, "barangay") and r.barangay is not None:
            b = r.barangay
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
                id=center_pk,
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

    lgu_pk = getattr(lgu, "id", getattr(lgu, "lgu_id", None))
    has_center_lgu_fk = hasattr(EvacuationCenter, "lgu_id")

    if has_center_lgu_fk and lgu_pk is not None:
        direct = (
            db.query(EvacuationCenter)
            .filter(getattr(EvacuationCenter, "lgu_id") == lgu_pk)
            .all()
        )
        centers.extend(direct)

    if lgu_pk is not None:
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

    unique = {_key(c): c for c in centers if _key(c) is not None}
    return list(unique.values())


def _resolve_lgu_for_user(db: Session, user: User) -> Optional[LGURecords]:
    """
    Resolve user's LGU using normalized columns if present, else parse free-form address.
    """
    prof = db.query(UserProfile).filter(UserProfile.user_id == user.user_id).first()

    lgu_name: Optional[str] = None
    if prof:
        lgu_name = getattr(prof, "lgu_name", None)
        if not lgu_name:
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
    # Build barangay->center map so frontend can show "Barangay Assigned"
    brgy_map = _brgy_map_for_lgu(db, int(lgu_id_safe)) if lgu_id_safe is not None else None

    scope = ScopeOut(lgu={"id": lgu_id_safe, "name": lgu.lgu_name})
    return MyCentersOut(scope=scope, centers=_pack_centers(centers, brgy_map))


@router.get("/scope_address", response_model=MyCentersOut)
def get_scope_address(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Same as /my_centers — returns LGU-wide scope and centers
    return get_my_centers(db=db, current_user=current_user)


@router.get("/get_reports")
def get_evacuation_data(
    db: Session = Depends(get_db),
    user_id: str = Depends(GetUserId())
):
    # Base query
    stmt = (
        select(
            LGURecords.lgu_name,
            EvacuationCenter.name.label("evacuation_name"),
            EvacuationCenter.capacity,
            EvacuationCenter.occupied,
            BaranggayRecords.name.label("barangay_name")
        )
        .join(
            BaranggayRecords,
            EvacuationCenter.evacuation_id == BaranggayRecords.evacucation_center_id
        )
        .join(LGURecords, LGURecords.id == BaranggayRecords.lgu_id)
    )

    # Check if user is an LGU
    admin = (
        db.query(AdminUserProfile)
        .options(joinedload(AdminUserProfile.lgu))
        .filter(AdminUserProfile.user_id == user_id)
        .first()
    )

    lgu = admin.lgu if admin else None

    # If LGU user, limit query to that LGU only
    if lgu:
        stmt = stmt.where(LGURecords.id == lgu.id)

    result = db.execute(stmt).all()

    # Group evacuations by LGU
    lgu_dict = defaultdict(list)
    for row in result:
        lgu_dict[row.lgu_name].append({
            "evacuation_name": row.evacuation_name,
            "barangay_name": row.barangay_name,
            "occupied": row.occupied,
            "capacity": row.capacity,
        })

    # Build data list with per-LGU summaries
    data_list = []
    for lgu_name, evacuations in lgu_dict.items():
        capacities = [e["capacity"] for e in evacuations]
        occupied = [e["occupied"] for e in evacuations]

        # Compute largest and smallest shelters
        largest = max(evacuations, key=lambda x: x["capacity"])
        smallest = min(evacuations, key=lambda x: x["capacity"])

        data_list.append({
            "lgu": lgu_name,
            "evacuation_count": len(evacuations),  # only show for All LGU
            "evacuation": evacuations,
            "summary": {
                "total_capacity": sum(capacities),
                "total_occupied": sum(occupied),
                "largest_shelter": f"{largest['evacuation_name']}, {largest['barangay_name']}",
                "smallest_shelter": f"{smallest['evacuation_name']}, {smallest['barangay_name']}",
            }
        })

    # Determine scope
    scope_name = lgu.lgu_name if lgu else "All LGU"

    # Final response
    output = {
        "scope": scope_name,
        "total_count": len(result),
        "data": data_list,
    }

    return output

