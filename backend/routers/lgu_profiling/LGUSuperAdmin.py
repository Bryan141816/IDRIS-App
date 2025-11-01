# routers/lgu_profiling/LGUSuperadmin.py
from __future__ import annotations
from typing import List, Optional, Iterable
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
try:
    from pydantic import ConfigDict  # Pydantic v2
    V2 = True
except Exception:
    V2 = False

from database import get_db
from models import User, LGURecords, BaranggayRecords, RAFIInfrastructure
from routers.auth.authentication import get_current_user_from_access_token

router = APIRouter(prefix="/lgu_profiling", tags=["LGU Profiling (Super Admin)"])

# ================================================================
# Schemas
# ================================================================

class LGUOut(BaseModel):
    id: int
    lgu_name: str
    lgu_classification: str
    mayor: Optional[str] = None
    lgu_contact: Optional[str] = None
    population: Optional[int] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    class Config:
        from_attributes = True


class BarangayOut(BaseModel):
    id: int
    name: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    baranggay_pic: Optional[str] = None
    contact_info: Optional[str] = None
    barangay_captain: Optional[str] = None
    household_count: Optional[int] = None
    total_population: Optional[int] = None
    lgu_id: int
    evacucation_center_id: Optional[int] = None
    common_hazards: Optional[List[str]] = None
    barangay_pwd: Optional[int] = None
    barangay_senior: Optional[int] = None
    barangay_children: Optional[int] = None
    class Config:
        from_attributes = True


# ---- RAFFIOut (single definition) ----
if V2:
    class RAFFIOut(BaseModel):
        model_config = ConfigDict(from_attributes=True, populate_by_name=True)
        rafi_id: int
        lgu_id: int
        raffi_name: str = Field(alias="rafi_name")
        lat: float
        lng: float
        raffi_desc: Optional[str] = Field(default=None, alias="rafi_desc")
        raffi_pic: Optional[str] = Field(default=None, alias="rafi_pic")
else:
    class RAFFIOut(BaseModel):
        rafi_id: int
        lgu_id: int
        raffi_name: str = Field(alias="rafi_name")
        lat: float
        lng: float
        raffi_desc: Optional[str] = Field(default=None, alias="rafi_desc")
        raffi_pic: Optional[str] = Field(default=None, alias="rafi_pic")
        class Config:
            from_attributes = True
            populate_by_name = True


class LGUSummaryOut(BaseModel):
    lgu: LGUOut
    barangays: List[BarangayOut]
    raffi: List[RAFFIOut]


# ================================================================
# Helpers
# ================================================================

def _ensure_superadmin(user: User) -> None:
    """Authorize either by user_type == 'superadmin' OR role 'superadmin'."""
    user_type = str(getattr(user, "user_type", "")).lower()
    roles: Iterable[str] = getattr(user, "roles", []) or []
    roles_lc = {str(r).lower() for r in roles}
    if not (user_type == "superadmin" or "superadmin" in roles_lc):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Super Admins only.",
        )


def _get_lgu_or_404(db: Session, lgu_id: int) -> LGURecords:
    lgu = db.query(LGURecords).filter(LGURecords.id == lgu_id).first()
    if not lgu:
        raise HTTPException(status_code=404, detail=f"LGU {lgu_id} not found.")
    return lgu


# ================================================================
# Endpoints
# ================================================================

@router.get("/lgus", response_model=List[LGUOut])
def get_all_lgus(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_access_token),
):
    _ensure_superadmin(current_user)
    return db.query(LGURecords).order_by(LGURecords.lgu_name.asc()).all()


@router.get("/lgus/{lgu_id}/barangays", response_model=List[BarangayOut])
def get_barangays_for_lgu(
    lgu_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_access_token),
):
    _ensure_superadmin(current_user)
    _get_lgu_or_404(db, lgu_id)
    return (
        db.query(BaranggayRecords)
        .filter(BaranggayRecords.lgu_id == lgu_id)
        .order_by(BaranggayRecords.name.asc())
        .all()
    )


@router.get(
    "/lgus/{lgu_id}/raffi",
    response_model=List[RAFFIOut],
    response_model_by_alias=True,  # << key line >>
)
def get_raffi_for_lgu(
    lgu_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_access_token),
):
    _ensure_superadmin(current_user)
    _get_lgu_or_404(db, lgu_id)
    raffi = (
        db.query(RAFIInfrastructure)
        .filter(RAFIInfrastructure.lgu_id == lgu_id)
        .order_by(RAFIInfrastructure.rafi_name.asc())
        .all()
    )
    return raffi


@router.get(
    "/lgus/{lgu_id}/summary",
    response_model=LGUSummaryOut,
    response_model_by_alias=True,  # << ensures nested raffi_name alias >>
)
def get_lgu_summary(
    lgu_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_access_token),
):
    _ensure_superadmin(current_user)
    lgu = _get_lgu_or_404(db, lgu_id)
    barangays = (
        db.query(BaranggayRecords)
        .filter(BaranggayRecords.lgu_id == lgu_id)
        .order_by(BaranggayRecords.name.asc())
        .all()
    )
    raffi = (
        db.query(RAFIInfrastructure)
        .filter(RAFIInfrastructure.lgu_id == lgu_id)
        .order_by(RAFIInfrastructure.rafi_name.asc())
        .all()
    )
    return LGUSummaryOut(lgu=lgu, barangays=barangays, raffi=raffi)
