from typing import List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, selectinload
from decimal import Decimal

from database import get_db
from models import (
    LGURecords,
    RAFIInfrastructure,
    BaranggayRecords,
    EvacuationCenter,
)

router = APIRouter(prefix="/lgu_profiling/mapofcebu", tags=["Map of Cebu"])

# ---------- Helpers ----------

def to_image_url(request: Request, val: Optional[str]) -> Optional[str]:
    """
    Convert stored media paths to absolute URLs usable by the FE.
    Accepts absolute http(s) URLs, '/media/...' paths, or raw stored paths.
    """
    if not val:
        return None
    v = val.strip()
    base = str(request.base_url).rstrip("/")
    if v.startswith("http://") or v.startswith("https://"):
        return v
    if v.startswith("/media/"):
        return f"{base}{v}"
    return f"{base}/media/{v.lstrip('/')}"

def normalize_list(v) -> List[str]:
    if v is None:
        return []
    if isinstance(v, list):
        return [str(x) for x in v]
    if isinstance(v, dict):
        return [str(x) for x in v.values()]
    return [s.strip() for s in str(v).split(",") if s.strip()]

def has_coords(obj) -> bool:
    try:
        return obj.lat is not None and obj.lng is not None
    except Exception:
        return False

def safe_int(v: Optional[Union[int, float, str]], default: int = 0) -> int:
    try:
        if v is None:
            return default
        return int(float(v))
    except Exception:
        return default

def derive_status(occupied: Optional[int], capacity: Optional[int]) -> str:
    occ = safe_int(occupied, 0)
    cap = safe_int(capacity, 0)
    if cap <= 0:
        return "Unknown"
    if occ >= cap:
        return "Full"
    if occ <= 0:
        return "Empty"
    ratio = occ / cap
    if ratio >= 0.8:
        return "Near Full"
    return "Available"

def to_address(r: EvacuationCenter) -> Optional[str]:
    return getattr(r, "address", None) or None

def _query_lgu_by_id(db: Session, id: int) -> Optional[LGURecords]:
    # Your PK is column "lgu_id" mapped to attr .id
    return db.query(LGURecords).filter(LGURecords.id == id).first()

# ---------- Schemas ----------

class LGULocationUpdate(BaseModel):
    """Update only location (and optionally name)."""
    lgu_name: Optional[str] = Field(None, description="Updated LGU name")
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)

class LGUUpdate(BaseModel):
    """General partial update for LGU."""
    lgu_name: Optional[str] = None
    lgu_classification: Optional[str] = None
    population: Optional[int] = None
    mayor: Optional[str] = None
    lgu_contact: Optional[str] = None
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lng: Optional[float] = Field(None, ge=-180, le=180)
    lgu_majorHazard: Optional[List[str]] = None
    DRMMpersonel: Optional[str] = None
    DRMM_contact: Optional[str] = None
    lgu_critical_facility: Optional[List[str]] = None
    lgu_pwd: Optional[int] = None
    lgu_senior: Optional[int] = None
    lgu_children: Optional[int] = None

# ---- RAFI ----
class RafiPointOut(BaseModel):
    id: int
    name: str
    lat: float
    lng: float
    description: Optional[str] = None
    imageUrl: Optional[str] = None

# ---- LGU (detail for map) ----
class LGUDetailOut(BaseModel):
    id: int

    # Core
    lgu_name: str
    lgu_classification: str
    population: Optional[int] = 0
    mayor: Optional[str] = None
    lgu_contact: Optional[str] = None

    # Coordinates
    lat: Optional[float] = None
    lng: Optional[float] = None

    # Media
    lgu_seal: Optional[str] = None
    hazard_pic: Optional[str] = None

    # DRRM / Hazards
    lgu_majorHazard: List[str] = Field(default_factory=list)
    DRMMpersonel: Optional[str] = None
    DRMM_contact: Optional[str] = None

    # Facilities & Community Stats
    lgu_critical_facility: List[str] = Field(default_factory=list)
    lgu_pwd: Optional[int] = None
    lgu_senior: Optional[int] = None
    lgu_children: Optional[int] = None

    # Aggregates
    baranggay_count: Optional[int] = None

    class Config:
        from_attributes = True

# ---- Barangay flattened output (single definition) ----
class BarangayPointOut(BaseModel):
    id: int
    name: str
    lat: float
    lng: float

    # Basic info
    baranggay_pic: Optional[str] = None
    baranggay_desc: Optional[str] = None
    contact_info: Optional[str] = None
    barangay_captain: Optional[str] = None

    # Totals
    total_population: Optional[int] = None
    household_count: Optional[int] = None

    # Risk profile
    common_hazards: List[str] = Field(default_factory=list)

    # Vulnerable groups
    barangay_pwd: Optional[int] = None
    barangay_senior: Optional[int] = None
    barangay_children: Optional[int] = None

    # Relations
    lgu_id: int
    lgu_name: Optional[str] = None
    evacuation_center_id: Optional[int] = None
    evacuation_center_name: Optional[str] = None

    # (compat) if FE still reads `population`
    population: Optional[Union[int, str]] = None

# ---- Evacuation Center output ----
class EvacuationCenterOut(BaseModel):
    id: int
    name: str
    lat: float
    lng: float
    capacity: int
    occupied: int
    available: Optional[int]
    utilization_pct: Optional[float]
    status: str
    address: Optional[str] = None


# =========================================================
# =============== LGU API USING LGUDetailOut ==============
# =========================================================

@router.get("/lgu/points", response_model=List[LGUDetailOut])
def list_lgu_points_for_map(request: Request, db: Session = Depends(get_db)):
    rows = db.query(LGURecords).order_by(LGURecords.lgu_name.asc()).all()
    rows = [r for r in rows if has_coords(r)]

    def _f(x): return float(x) if x is not None else None

    out: List[LGUDetailOut] = []
    for r in rows:
        out.append(
            LGUDetailOut(
                id=int(r.id),
                lgu_name=r.lgu_name,
                lgu_classification=r.lgu_classification,
                population=r.population or 0,
                mayor=r.mayor,
                lgu_contact=r.lgu_contact,
                lat=_f(r.lat),
                lng=_f(r.lng),
                lgu_seal=to_image_url(request, r.lgu_seal),
                hazard_pic=to_image_url(request, r.hazard_pic),
                lgu_majorHazard=[*r.lgu_majorHazard] if r.lgu_majorHazard else [],
                DRMMpersonel=r.DRMMpersonel,
                DRMM_contact=r.DRMM_contact,
                lgu_critical_facility=[*r.lgu_critical_facility] if r.lgu_critical_facility else [],
                lgu_pwd=r.lgu_pwd,
                lgu_senior=r.lgu_senior,
                lgu_children=r.lgu_children,
                baranggay_count=len(r.baranggays) if getattr(r, "baranggays", None) else 0,
            )
        )
    return out

@router.get("/lgu/{id}", response_model=LGUDetailOut)
def get_lgu_detail(id: int, request: Request, db: Session = Depends(get_db)):
    r = _query_lgu_by_id(db, id)
    if not r:
        raise HTTPException(status_code=404, detail="LGU not found")

    def _f(x): return float(x) if x is not None else None

    return LGUDetailOut(
        id=int(r.id),
        lgu_name=r.lgu_name,
        lgu_classification=r.lgu_classification,
        population=r.population or 0,
        mayor=r.mayor,
        lgu_contact=r.lgu_contact,
        lat=_f(r.lat),
        lng=_f(r.lng),
        lgu_seal=to_image_url(request, r.lgu_seal),
        hazard_pic=to_image_url(request, r.hazard_pic),
        lgu_majorHazard=[*r.lgu_majorHazard] if r.lgu_majorHazard else [],
        DRMMpersonel=r.DRMMpersonel,
        DRMM_contact=r.DRMM_contact,
        lgu_critical_facility=[*r.lgu_critical_facility] if r.lgu_critical_facility else [],
        lgu_pwd=r.lgu_pwd,
        lgu_senior=r.lgu_senior,
        lgu_children=r.lgu_children,
        baranggay_count=len(r.baranggays) if getattr(r, "baranggays", None) else 0,
    )

@router.put("/lgu/{id}/location", response_model=LGUDetailOut)
def update_lgu_location(
    id: int,
    payload: LGULocationUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    r = _query_lgu_by_id(db, id)
    if not r:
        raise HTTPException(status_code=404, detail="LGU not found")

    r.lat = Decimal(str(round(payload.lat, 6)))
    r.lng = Decimal(str(round(payload.lng, 6)))
    if payload.lgu_name:
        r.lgu_name = payload.lgu_name

    db.add(r)
    db.commit()
    db.refresh(r)

    def _f(x): return float(x) if x is not None else None

    return LGUDetailOut(
        id=int(r.id),
        lgu_name=r.lgu_name,
        lgu_classification=r.lgu_classification,
        population=r.population or 0,
        mayor=r.mayor,
        lgu_contact=r.lgu_contact,
        lat=_f(r.lat),
        lng=_f(r.lng),
        lgu_seal=to_image_url(request, r.lgu_seal),
        hazard_pic=to_image_url(request, r.hazard_pic),
        lgu_majorHazard=[*r.lgu_majorHazard] if r.lgu_majorHazard else [],
        DRMMpersonel=r.DRMMpersonel,
        DRMM_contact=r.DRMM_contact,
        lgu_critical_facility=[*r.lgu_critical_facility] if r.lgu_critical_facility else [],
        lgu_pwd=r.lgu_pwd,
        lgu_senior=r.lgu_senior,
        lgu_children=r.lgu_children,
        baranggay_count=len(r.baranggays) if getattr(r, "baranggays", None) else 0,
    )

@router.patch("/lgu/{id}", response_model=LGUDetailOut)
def update_lgu_partial(
    id: int,
    payload: LGUUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    r = _query_lgu_by_id(db, id)
    if not r:
        raise HTTPException(status_code=404, detail="LGU not found")

    # Apply partials
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field in ("lat", "lng") and value is not None:
            setattr(r, field, Decimal(str(round(value, 6))))
        else:
            setattr(r, field, value)

    db.add(r)
    db.commit()
    db.refresh(r)

    def _f(x): return float(x) if x is not None else None

    return LGUDetailOut(
        id=int(r.id),
        lgu_name=r.lgu_name,
        lgu_classification=r.lgu_classification,
        population=r.population or 0,
        mayor=r.mayor,
        lgu_contact=r.lgu_contact,
        lat=_f(r.lat),
        lng=_f(r.lng),
        lgu_seal=to_image_url(request, r.lgu_seal),
        hazard_pic=to_image_url(request, r.hazard_pic),
        lgu_majorHazard=[*r.lgu_majorHazard] if r.lgu_majorHazard else [],
        DRMMpersonel=r.DRMMpersonel,
        DRMM_contact=r.DRMM_contact,
        lgu_critical_facility=[*r.lgu_critical_facility] if r.lgu_critical_facility else [],
        lgu_pwd=r.lgu_pwd,
        lgu_senior=r.lgu_senior,
        lgu_children=r.lgu_children,
        baranggay_count=len(r.baranggays) if getattr(r, "baranggays", None) else 0,
    )

# Compat alias if FE still calls /lgu?id=...
@router.get("/lgu", response_model=LGUDetailOut)
def get_lgu_legacy(id: int = Query(...), request: Request = None, db: Session = Depends(get_db)):
    return get_lgu_detail(id=id, request=request, db=db)


# =========================================================
# =============== Barangay (single route) =================
# =========================================================
@router.get("/barangays", response_model=List[BarangayPointOut])
def list_barangays(
    request: Request,
    include: Optional[str] = Query(default=""),
    db: Session = Depends(get_db),
):
    q = db.query(BaranggayRecords)
    if "relations" in (include or ""):
        q = q.options(
            selectinload(BaranggayRecords.lgu),
            selectinload(BaranggayRecords.evacucation_center),
        )
    rows = [b for b in q.all() if has_coords(b)]

    out: List[BarangayPointOut] = []
    for b in rows:
        total_pop = getattr(b, "total_population", None)
        pop_val: Optional[Union[int, str]] = None
        if isinstance(total_pop, (int, float)):
            pop_val = int(total_pop)
        elif total_pop is not None:
            pop_val = str(total_pop)

        out.append(
            BarangayPointOut(
                id=int(b.id),
                name=b.name,
                lat=float(b.lat),
                lng=float(b.lng),

                baranggay_pic=to_image_url(request, getattr(b, "baranggay_pic", None)),
                baranggay_desc=getattr(b, "baranggay_desc", None),
                contact_info=getattr(b, "contact_info", None),
                barangay_captain=getattr(b, "barangay_captain", None),

                total_population=getattr(b, "total_population", None),
                household_count=getattr(b, "household_count", None),

                common_hazards=normalize_list(getattr(b, "common_hazards", None)),

                barangay_pwd=getattr(b, "barangay_pwd", None),
                barangay_senior=getattr(b, "barangay_senior", None),
                barangay_children=getattr(b, "barangay_children", None),

                lgu_id=int(getattr(b, "lgu_id")),
                lgu_name=getattr(getattr(b, "lgu", None), "lgu_name", None),
                evacuation_center_id=getattr(
                    getattr(b, "evacucation_center", None), "evacuation_id", None
                ),
                evacuation_center_name=getattr(
                    getattr(b, "evacucation_center", None), "name", None
                ),

                # compatibility for existing FE field
                population=pop_val,
            )
        )
    return out


# =========================================================
# =============== RAFI & Evacuation =======================
# =========================================================

@router.get("/rafi", response_model=List[RafiPointOut])
def list_rafi_points(request: Request, db: Session = Depends(get_db)):
    rows = db.query(RAFIInfrastructure).all()
    return [
        RafiPointOut(
            id=int(r.rafi_id),
            name=r.rafi_name,
            lat=float(r.lat),
            lng=float(r.lng),
            description=r.rafi_desc,
            imageUrl=to_image_url(request, r.rafi_pic),
        )
        for r in rows
        if has_coords(r)
    ]

@router.get("/evacuation-centers", response_model=List[EvacuationCenterOut])
def list_evacuation_centers(db: Session = Depends(get_db)):
    rows = db.query(EvacuationCenter).order_by(EvacuationCenter.name.asc()).all()
    rows = [r for r in rows if has_coords(r)]

    out: List[EvacuationCenterOut] = []
    for r in rows:
        cap = safe_int(getattr(r, "capacity", 0), 0)
        occ = safe_int(getattr(r, "occupied", 0), 0)
        status = derive_status(occ, cap)

        if cap > 0:
            available = max(cap - occ, 0)
            util_pct = round(min(max((occ / cap) * 100.0, 0.0), 100.0), 2)
        else:
            available = None
            util_pct = None

        out.append(
            EvacuationCenterOut(
                id=int(getattr(r, "evacuation_id", getattr(r, "id", 0))),
                name=r.name,
                lat=float(r.lat),
                lng=float(r.lng),
                capacity=cap,
                occupied=occ,
                available=available,
                utilization_pct=util_pct,
                status=status,
                address=to_address(r),
            )
        )
    return out

@router.get("/evacuation-centers/{evac_id}", response_model=EvacuationCenterOut)
def get_evacuation_center(evac_id: int, db: Session = Depends(get_db)):
    r = (
        db.query(EvacuationCenter)
        .filter(
            (getattr(EvacuationCenter, "evacuation_id", None) == evac_id)
            if hasattr(EvacuationCenter, "evacuation_id")
            else (getattr(EvacuationCenter, "id") == evac_id)
        )
        .first()
    )
    if not r:
        raise HTTPException(status_code=404, detail="Evacuation Center not found")

    cap = safe_int(getattr(r, "capacity", 0), 0)
    occ = safe_int(getattr(r, "occupied", 0), 0)
    status = derive_status(occ, cap)

    if cap > 0:
        available = max(cap - occ, 0)
        util_pct = round(min(max((occ / cap) * 100.0, 0.0), 100.0), 2)
    else:
        available = None
        util_pct = None

    return EvacuationCenterOut(
        id=int(getattr(r, "evacuation_id", getattr(r, "id", 0))),
        name=r.name,
        lat=float(r.lat),
        lng=float(r.lng),
        capacity=cap,
        occupied=occ,
        available=available,
        utilization_pct=util_pct,
        status=status,
        address=to_address(r),
    )
