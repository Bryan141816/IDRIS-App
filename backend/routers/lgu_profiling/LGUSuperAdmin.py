# routers/lgu_profiling/LGUSuperadmin.py
from __future__ import annotations
from typing import List, Optional, Iterable, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

try:
    from pydantic import ConfigDict  # Pydantic v2
    V2 = True
except Exception:
    V2 = False

from database import get_db
from models import User, LGURecords, BaranggayRecords, RAFIInfrastructure, EvacuationCenter

from routers.auth.authentication import get_current_user_from_access_token

router = APIRouter(prefix="/lgu_profiling", tags=["LGU Profiling (Super Admin)"])

# ================================================================
# Schemas
# ================================================================

# -- Full LGU shape expected by your frontend modal --
if V2:
    class LGUDetailOut(BaseModel):
        model_config = ConfigDict(from_attributes=True)
        id: int
        lgu_name: str
        lgu_classification: str
        mayor: Optional[str] = None
        lgu_contact: Optional[str] = None
        population: Optional[int] = None
        lat: Optional[float] = None
        lng: Optional[float] = None

        # extra fields used by the modal
        lgu_seal: Optional[str] = None
        hazard_pic: Optional[str] = None
        lgu_majorHazard: Optional[List[str]] = None
        lgu_critical_facility: Optional[List[str]] = None
        DRMMpersonel: Optional[str] = None
        DRMM_contact: Optional[str] = None
        lgu_pwd: Optional[int] = None
        lgu_senior: Optional[int] = None
        lgu_children: Optional[int] = None
        baranggay_count: Optional[int] = None
else:
    class LGUDetailOut(BaseModel):
        id: int
        lgu_name: str
        lgu_classification: str
        mayor: Optional[str] = None
        lgu_contact: Optional[str] = None
        population: Optional[int] = None
        lat: Optional[float] = None
        lng: Optional[float] = None

        # extra fields used by the modal
        lgu_seal: Optional[str] = None
        hazard_pic: Optional[str] = None
        lgu_majorHazard: Optional[List[str]] = None
        lgu_critical_facility: Optional[List[str]] = None
        DRMMpersonel: Optional[str] = None
        DRMM_contact: Optional[str] = None
        lgu_pwd: Optional[int] = None
        lgu_senior: Optional[int] = None
        lgu_children: Optional[int] = None
        baranggay_count: Optional[int] = None

        class Config:
            from_attributes = True


class LGUUpdate(BaseModel):
    # All optional so we can partial-update safely
    lgu_name: Optional[str] = None
    lgu_classification: Optional[str] = None
    mayor: Optional[str] = None
    lgu_contact: Optional[str] = None
    population: Optional[int] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

    lgu_seal: Optional[str] = None
    hazard_pic: Optional[str] = None
    lgu_majorHazard: Optional[List[str]] = None
    lgu_critical_facility: Optional[List[str]] = None
    DRMMpersonel: Optional[str] = None
    DRMM_contact: Optional[str] = None
    lgu_pwd: Optional[int] = None
    lgu_senior: Optional[int] = None
    lgu_children: Optional[int] = None
    baranggay_count: Optional[int] = None


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
    evacucation_center_name: Optional[str] = None
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
    lgu: LGUDetailOut
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


# Optional: normalize data URLs/base64 before storing, if you used this earlier.
# def normalize_image_field(value: Optional[str]) -> Optional[str]:
#     if not value:
#         return value
#     # your normalization here (strip headers, validate base64, etc.)
#     return value


# ================================================================
# Endpoints
# ================================================================

# List all LGUs (full shape your modal expects)
@router.get("/lgus", response_model=List[LGUDetailOut])
def get_all_lgus(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_access_token),
):
    _ensure_superadmin(current_user)
    return db.query(LGURecords).order_by(LGURecords.lgu_name.asc()).all()


# Get single LGU (detail)
@router.get("/lgus/{lgu_id}", response_model=LGUDetailOut)
def get_lgu_detail(
    lgu_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_access_token),
):
    _ensure_superadmin(current_user)
    return _get_lgu_or_404(db, lgu_id)


# Update (save) LGU
@router.put("/lgus/{lgu_id}", response_model=LGUDetailOut)
def update_lgu(
    lgu_id: int,
    payload: LGUUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_access_token),
):
    _ensure_superadmin(current_user)
    rec = _get_lgu_or_404(db, lgu_id)

    updates: Dict[str, Any] = payload.model_dump(exclude_unset=True)

    # If you used normalization previously, uncomment:
    # for k in ("lgu_seal", "hazard_pic"):
    #     if k in updates and updates[k]:
    #         updates[k] = normalize_image_field(updates[k])

    # Apply only attributes that exist on model
    for k, v in updates.items():
        if hasattr(rec, k):
            setattr(rec, k, v)

    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec

# Barangays under LGU
@router.get("/lgus/{lgu_id}/barangays", response_model=List[BarangayOut])
def get_barangays_for_lgu(
    lgu_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_access_token),
):
    _ensure_superadmin(current_user)
    _get_lgu_or_404(db, lgu_id)

    recs = (
        db.query(BaranggayRecords)
        .filter(BaranggayRecords.lgu_id == lgu_id)
        .order_by(BaranggayRecords.name.asc())
        .all()
    )

    evac_ids = [int(r.evacucation_center_id) for r in recs if r.evacucation_center_id]
    names = _evac_name_map(db, evac_ids)

    return [
        _serialize_barangay(r, names.get(int(r.evacucation_center_id or 0)))
        for r in recs
    ]

# RAFFI under LGU
@router.get(
    "/lgus/{lgu_id}/raffi",
    response_model=List[RAFFIOut],
    response_model_by_alias=True,
)
def get_raffi_for_lgu(
    lgu_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_access_token),
):
    _ensure_superadmin(current_user)
    _get_lgu_or_404(db, lgu_id)
    return (
        db.query(RAFIInfrastructure)
        .filter(RAFIInfrastructure.lgu_id == lgu_id)
        .order_by(RAFIInfrastructure.rafi_name.asc())
        .all()
    )


# Combined summary
@router.get(
    "/lgus/{lgu_id}/summary",
    response_model=LGUSummaryOut,
    response_model_by_alias=True,
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





# ============================
# === Added: Barangay CRUD ===
# ============================

class BarangayUpdate(BaseModel):
    """Partial update schema for barangays (send only changed fields)."""
    name: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    baranggay_pic: Optional[str] = None  # keep DB spelling
    contact_info: Optional[str] = None
    barangay_captain: Optional[str] = None
    household_count: Optional[int] = None
    total_population: Optional[int] = None
    lgu_id: Optional[int] = None
    evacucation_center_id: Optional[int] = None  # keep DB spelling
    common_hazards: Optional[List[str]] = None
    barangay_pwd: Optional[int] = None
    barangay_senior: Optional[int] = None
    barangay_children: Optional[int] = None


def _get_barangay_or_404(db: Session, barangay_id: int) -> BaranggayRecords:
    rec = (
        db.query(BaranggayRecords)
        .filter(BaranggayRecords.id == barangay_id)
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail=f"Barangay {barangay_id} not found.")
    return rec
@router.get("/barangays", response_model=List[BarangayOut])
def list_barangays(
    lgu_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_access_token),
):
    _ensure_superadmin(current_user)

    q = db.query(BaranggayRecords)
    if lgu_id is not None:
        q = q.filter(BaranggayRecords.lgu_id == lgu_id)

    recs = q.order_by(BaranggayRecords.name.asc()).all()

    evac_ids = [int(r.evacucation_center_id) for r in recs if r.evacucation_center_id]
    names = _evac_name_map(db, evac_ids)

    return [
        _serialize_barangay(r, names.get(int(r.evacucation_center_id or 0)))
        for r in recs
    ]
@router.get("/barangays/{barangay_id}", response_model=BarangayOut)
def get_barangay(
    barangay_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_access_token),
):
    _ensure_superadmin(current_user)

    rec = _get_barangay_or_404(db, barangay_id)

    evac_name = None
    if rec.evacucation_center_id:
        names = _evac_name_map(db, [int(rec.evacucation_center_id)])
        evac_name = names.get(int(rec.evacucation_center_id))

    return _serialize_barangay(rec, evac_name)

@router.put("/barangays/{barangay_id}", response_model=BarangayOut)
def update_barangay(
    barangay_id: int,
    payload: BarangayUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_access_token),
):
    """
    Partial update for a barangay.
    Matches frontend `updateBarangay(id, payload)`.
    """
    _ensure_superadmin(current_user)
    rec = _get_barangay_or_404(db, barangay_id)

    updates: Dict[str, Any] = payload.model_dump(exclude_unset=True)

    # Optional server-side validation to mirror UI:
    if "contact_info" in updates and updates["contact_info"]:
        digits = str(updates["contact_info"])
        if not digits.isdigit() or len(digits) != 11:
            raise HTTPException(status_code=422, detail="contact_info must be 11 digits")

    # Apply only attributes that exist on the SQLAlchemy model
    for k, v in updates.items():
        if hasattr(rec, k):
            setattr(rec, k, v)

    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec

# === end of additions ===

def _evac_name_map(db: Session, ids: List[int]) -> Dict[int, str]:
    """Return {evacuation_id: name} for provided ids."""
    if not ids:
        return {}
    rows = (
        db.query(EvacuationCenter)
        .filter(EvacuationCenter.evacuation_id.in_(ids))
        .all()
    )
    return {int(r.evacuation_id): r.name for r in rows}

def _serialize_barangay(rec: BaranggayRecords, evac_name: Optional[str] = None) -> Dict[str, Any]:
    """Builds the response dict including evacucation_center_name."""
    return {
        "id": rec.id,
        "name": rec.name,
        "lat": rec.lat,
        "lng": rec.lng,
        "baranggay_pic": rec.baranggay_pic,
        "contact_info": rec.contact_info,
        "barangay_captain": rec.barangay_captain,
        "household_count": rec.household_count,
        "total_population": rec.total_population,
        "lgu_id": rec.lgu_id,
        "evacucation_center_id": rec.evacucation_center_id,
        "evacucation_center_name": evac_name,   # ⬅️ include resolved name
        "common_hazards": rec.common_hazards,
        "barangay_pwd": rec.barangay_pwd,
        "barangay_senior": rec.barangay_senior,
        "barangay_children": rec.barangay_children,
    }




# rafffi


# ============================
# === Added: RAFFI   CRUD  ===
# ============================

from pydantic import BaseModel

class RAFFICreate(BaseModel):
    raffi_name: str
    lat: float
    lng: float
    raffi_desc: Optional[str] = None
    raffi_pic: Optional[str] = None

class RAFFIUpdate(BaseModel):
    raffi_name: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    raffi_desc: Optional[str] = None
    raffi_pic: Optional[str] = None

def _get_raffi_or_404(db: Session, rafi_id: int) -> RAFIInfrastructure:
    rec = db.query(RAFIInfrastructure).filter(RAFIInfrastructure.rafi_id == rafi_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail=f"RAFFI {rafi_id} not found.")
    return rec

@router.put("/raffi/{rafi_id}", response_model=RAFFIOut, response_model_by_alias=True)
def update_raffi(
    rafi_id: int,
    payload: RAFFIUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_access_token),
):
    _ensure_superadmin(current_user)
    rec = _get_raffi_or_404(db, rafi_id)

    updates = payload.model_dump(exclude_unset=True)

    # Map API field names (double-f) -> model column names (single-f)
    field_map = {
        "raffi_name": "rafi_name",
        "raffi_desc": "rafi_desc",
        "raffi_pic": "rafi_pic",
        # passthroughs
        "lat": "lat",
        "lng": "lng",
    }

    for api_key, value in updates.items():
        model_key = field_map.get(api_key, api_key)
        if hasattr(rec, model_key):
            setattr(rec, model_key, value)

    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec

@router.post("/lgus/{lgu_id}/raffi", response_model=RAFFIOut, status_code=201, response_model_by_alias=True)
def create_raffi(
    lgu_id: int,
    payload: RAFFICreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_access_token),
):
    _ensure_superadmin(current_user)
    _get_lgu_or_404(db, lgu_id)

    rec = RAFIInfrastructure(
        lgu_id=lgu_id,
        rafi_name=payload.raffi_name.strip(),
        lat=float(payload.lat),
        lng=float(payload.lng),
        rafi_desc=payload.raffi_desc,
        rafi_pic=payload.raffi_pic,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec

@router.put("/raffi/{rafi_id}", response_model=RAFFIOut, response_model_by_alias=True)
def update_raffi(
    rafi_id: int,
    payload: RAFFIUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_access_token),
):
    _ensure_superadmin(current_user)
    rec = _get_raffi_or_404(db, rafi_id)
    updates = payload.model_dump(exclude_unset=True)
    for k, v in updates.items():
        if hasattr(rec, k):
            setattr(rec, k, v)
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec

@router.delete("/raffi/{rafi_id}", status_code=204)
def delete_raffi(
    rafi_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_access_token),
):
    _ensure_superadmin(current_user)
    rec = _get_raffi_or_404(db, rafi_id)
    db.delete(rec)
    db.commit()
    return
# === end RAFFI additions ===
