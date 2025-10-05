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

# ---- NEW: Barangay flattened output ----
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

    # misc JSON resources (stringified on FE if you want)
    resources: List[str] = Field(default_factory=list)

    # flattened relations
    lgu_id: int
    lgu_name: Optional[str] = None
    evacuation_center_id: Optional[int] = None
    evacuation_center_name: Optional[str] = None

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

# ---- NEW: Barangays for MapOfCebu.tsx ----
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
