from typing import List, Optional, Union, Any
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, selectinload

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
    """Return absolute URL for media; handle full URL, /media/..., or relative path."""
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
    """Normalize DB JSON/Text field into list[str]."""
    if v is None:
        return []
    if isinstance(v, list):
        return [str(x) for x in v]
    if isinstance(v, dict):
        # keep values only; adjust if you prefer keys
        return [str(x) for x in v.values()]
    return [s.strip() for s in str(v).split(",") if s.strip()]

def has_coords(obj) -> bool:
    try:
        return obj.lat is not None and obj.lng is not None
    except Exception:
        return False

def get_lgu_pk(r: LGURecords) -> int:
    """Support either r.id or r.lgu_id as PK (depending on your model)."""
    return int(getattr(r, "id", getattr(r, "lgu_id", 0)))

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
    """
    If you add an address column later (e.g., r.address),
    expose it here. For now we return None so the FE hides it.
    """
    return getattr(r, "address", None) or None

# ---------- Schemas ----------

class RafiPointOut(BaseModel):
    id: int
    name: str
    lat: float
    lng: float
    description: Optional[str] = None
    imageUrl: Optional[str] = None

class MapPointOut(BaseModel):
    id: int
    name: str
    lat: float
    lng: float
    classification: str
    population: int
    contact_info: str
    risk_level: str
    imageUrl: Optional[str] = None
    description: Optional[str] = None
    resources: List[str] = Field(default_factory=list)

class LGUDetailOut(BaseModel):
    id: int
    name: str
    classification: str
    population: int
    contact_info: str
    risk_level: str
    lgu_picture: Optional[str] = None
    description: Optional[str] = None
    resources: List[str] = Field(default_factory=list)
    players: List[str] = Field(default_factory=list)
    schools: List[str] = Field(default_factory=list)
    gyms: List[str] = Field(default_factory=list)
    local_suppliers: List[str] = Field(default_factory=list)

    class Config:
        orm_mode = True

# ---- Barangay flattened output ----
class BarangayPointOut(BaseModel):
    id: int
    name: str
    lat: float
    lng: float

    # basic info
    contact_info: Optional[str] = None
    population: Optional[Union[int, str]] = None
    risk_level: Optional[str] = None

    # media / text
    baranggay_pic: Optional[str] = None
    baranggay_desc: Optional[str] = None

    # misc JSON resources
    resources: List[str] = Field(default_factory=list)

    # flattened relations
    lgu_id: int
    lgu_name: Optional[str] = None
    evacuation_center_id: Optional[int] = None
    evacuation_center_name: Optional[str] = None

# ---- Evacuation Center output (ENHANCED) ----
class EvacuationCenterOut(BaseModel):
    id: int                # maps from evacuation_id
    name: str
    lat: float
    lng: float
    capacity: int
    occupied: int
    available: Optional[int]        # None if capacity <= 0
    utilization_pct: Optional[float]  # 0-100; None if capacity <= 0
    status: str            # Full | Near Full | Available | Empty | Unknown
    address: Optional[str] = None   # if you add it later, FE will show it

# ---------- Endpoints ----------

@router.get("/points", response_model=List[MapPointOut])
def list_lgu_points(request: Request, db: Session = Depends(get_db)):
    rows = db.query(LGURecords).order_by(LGURecords.name.asc()).all()
    rows = [r for r in rows if has_coords(r)]

    return [
        MapPointOut(
            id=get_lgu_pk(r),
            name=r.name,
            lat=float(r.lat),
            lng=float(r.lng),
            classification=r.classification,
            population=int(r.population) if r.population is not None else 0,
            contact_info=r.contact_info or "",
            risk_level=r.risk_level or "",
            imageUrl=to_image_url(request, getattr(r, "lgu_picture", None)),
            description=getattr(r, "description", None),
            resources=normalize_list(getattr(r, "resources", None)),
        )
        for r in rows
    ]

@router.get("/lgu/{id}", response_model=LGUDetailOut)
def get_lgu_by_id(id: int, request: Request, db: Session = Depends(get_db)):
    # support either column name as PK
    query = db.query(LGURecords)
    r = query.filter(
        (getattr(LGURecords, "id", None) == id)
        if hasattr(LGURecords, "id")
        else (getattr(LGURecords, "lgu_id") == id)
    ).first()

    if not r:
        raise HTTPException(status_code=404, detail="LGU not found")

    return LGUDetailOut(
        id=get_lgu_pk(r),
        name=r.name,
        classification=r.classification,
        population=int(r.population) if r.population is not None else 0,
        contact_info=r.contact_info or "",
        risk_level=r.risk_level or "",
        lgu_picture=to_image_url(request, getattr(r, "lgu_picture", None)),
        description=getattr(r, "description", None),
        resources=normalize_list(getattr(r, "resources", None)),
        players=normalize_list(getattr(r, "players", None)),
        schools=normalize_list(getattr(r, "schools", None)),
        gyms=normalize_list(getattr(r, "gyms", None)),
        local_suppliers=normalize_list(getattr(r, "local_suppliers", None)),
    )

# Back-compat: .../get_lgu?id=4
@router.get("/lgu", response_model=LGUDetailOut)
def get_lgu_legacy(id: int = Query(...), request: Request = None, db: Session = Depends(get_db)):
    return get_lgu_by_id(id=id, request=request, db=db)

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

# ---- Barangays for MapOfCebu.tsx ----
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
        # population can be int or JSON; FE will treat string as-is
        pop_val: Optional[Union[int, str]] = None
        if isinstance(b.population, (int, float)):
            pop_val = int(b.population)
        elif b.population is not None:
            pop_val = str(b.population)

        out.append(
            BarangayPointOut(
                id=int(b.id),
                name=b.name,
                lat=float(b.lat),
                lng=float(b.lng),

                contact_info=getattr(b, "contact_info", None),
                population=pop_val,
                risk_level=getattr(b, "risk_level", None),

                baranggay_pic=to_image_url(request, getattr(b, "baranggay_pic", None)),
                baranggay_desc=getattr(b, "baranggay_desc", None),

                resources=normalize_list(getattr(b, "resources", None)),

                lgu_id=int(getattr(b, "lgu_id")),
                lgu_name=getattr(getattr(b, "lgu", None), "name", None),

                evacuation_center_id=getattr(
                    getattr(b, "evacucation_center", None), "evacuation_id", None
                ),
                evacuation_center_name=getattr(
                    getattr(b, "evacucation_center", None), "name", None
                ),
            )
        )
    return out

# ---- Evacuation Centers (Enhanced for MapOfCebu sidebar) ----
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

# Optional: single evac by id
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
