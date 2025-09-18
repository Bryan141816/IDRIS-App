from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models import LGURecords, RAFIInfrastructure
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
    """Normalize DB JSON field into list[str]."""
    if v is None:
        return []
    if isinstance(v, list):
        return [str(x) for x in v]
    if isinstance(v, dict):
        return [str(x) for x in v.values()]
    return [s.strip() for s in str(v).split(",") if s.strip()]

def has_coords(r: LGURecords) -> bool:
    try:
        return r.lat is not None and r.lng is not None
    except Exception:
        return False

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

# ---------- Endpoints ----------

@router.get("/points", response_model=List[MapPointOut])
def list_lgu_points(request: Request, db: Session = Depends(get_db)):
    rows = db.query(LGURecords).order_by(LGURecords.name.asc()).all()
    rows = [r for r in rows if has_coords(r)]  # keep only records with valid coordinates

    return [
        MapPointOut(
            id=r.id,
            name=r.name,
            lat=float(r.lat),
            lng=float(r.lng),
            classification=r.classification,
            population=r.population,
            contact_info=r.contact_info,
            risk_level=r.risk_level,
            imageUrl=to_image_url(request, r.lgu_picture),
            description=r.description,
            resources=normalize_list(r.resources),
        )
        for r in rows
    ]

@router.get("/lgu/{id}", response_model=LGUDetailOut)
def get_lgu_by_id(id: int, request: Request, db: Session = Depends(get_db)):
    r = db.query(LGURecords).filter(LGURecords.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="LGU not found")

    return LGUDetailOut(
        id=r.id,
        name=r.name,
        classification=r.classification,
        population=r.population,
        contact_info=r.contact_info,
        risk_level=r.risk_level,
        lgu_picture=to_image_url(request, r.lgu_picture),
        description=r.description,
        resources=normalize_list(r.resources),
        players=normalize_list(r.players),
        schools=normalize_list(r.schools),
        gyms=normalize_list(r.gyms),
        local_suppliers=normalize_list(r.local_suppliers),
    )

# ---- Back-compat route so old frontend calls like .../get_lgu?id=4 keep working ----
@router.get("/lgu", response_model=LGUDetailOut)
def get_lgu_legacy(id: int = Query(...), request: Request = None, db: Session = Depends(get_db)):
    return get_lgu_by_id(id=id, request=request, db=db)

# ---- rafffiiii ----

@router.get("/rafi", response_model=List[RafiPointOut])
def list_rafi_points(request: Request, db: Session = Depends(get_db)):
    rows = db.query(RAFIInfrastructure).all()

    return [
        RafiPointOut(
            id=r.rafi_id,
            name=r.rafi_name,
            lat=float(r.lat),
            lng=float(r.lng),
            description=r.rafi_desc,
            imageUrl=to_image_url(request, r.rafi_pic),
        )
        for r in rows
        if r.lat is not None and r.lng is not None
    ]