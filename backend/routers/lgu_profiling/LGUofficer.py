# LGUofficer.py
from __future__ import annotations

import logging
from typing import Dict, Optional, List, Any
import base64, re, os, uuid
from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import (
    User,
    LGURecords,
    AdminUserProfile,
    LGURecords,
    BaranggayRecords,
    EvacuationCenter,
    RAFIInfrastructure, 
)
from routers.auth.authentication import get_current_user_from_access_token
from schemas import LGURecordsUpdate, LGURecordsOut
from routers.GetUserId import GetUserId
from pydantic import BaseModel, Field
from starlette.requests import Request

from pydantic import BaseModel
logger = logging.getLogger(__name__)

# Prefix matches your logs: /lgu_profiling/...
router = APIRouter(prefix="/lgu_profiling", tags=["LGU Profiling"])
DATA_URL_RE = re.compile(r"^data:(image/\w+);base64,(.+)$")

class RAFICreate(BaseModel):
    raffi_name: str 
    lat: float
    lng: float
    raffi_desc: Optional[str] = None
    raffi_pic: Optional[str] = None   # data URL or normal URL

class RAFIUpdate(BaseModel):
    raffi_name: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    raffi_desc: Optional[str] = None
    raffi_pic: Optional[str] = None   # data URL or normal URL

class RAFIOut(BaseModel):
    rafi_id: int
    lgu_id: int
    rafi_name: str
    lat: float
    lng: float
    rafi_desc: Optional[str] = None
    rafi_pic: Optional[str] = None

    class Config:
        orm_mode = True

class BarangayMiniOut(BaseModel):
    id: int
    name: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    baranggay_pic: Optional[str] = None

    class Config:
        orm_mode = True  # v1
        # from_attributes = True  # v2


class EvacuationWithBarangaysOut(BaseModel):
    evacuation_id: int
    name: str
    lat: float
    lng: float
    capacity: int
    occupied: int
    barangay: List[BarangayMiniOut]  # nested list

    class Config:
        orm_mode = True
        # from_attributes = True


class EvacuationOut(BaseModel):
    evacuation_id: int
    name: str
    lat: float
    lng: float
    capacity: int
    occupied: int


class LGUOut(BaseModel):
    id: int
    lgu_name: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    lgu_classification: Optional[str] = None
    lgu_seal: Optional[str] = None  # data URL OR normal URL OR None
    population: Optional[int] = None
    mayor: Optional[str] = None
    DRMMpersonel: Optional[str] = None
    DRMM_contact: Optional[str] = None
    lgu_pwd: Optional[int] = None
    lgu_senior: Optional[int] = None
    lgu_children: Optional[int] = None
    hazard_pic: Optional[str] = None  # same rules as lgu_seal
    lgu_majorHazard: Optional[List[str]] = None
    lgu_contact: Optional[str] = None
    lgu_critical_facility: Optional[List[str]] = None
    baranggay_count: int
    population: Optional[int] = None

    class Config:
        # Pydantic v1:
        orm_mode = True
        # If on Pydantic v2, use:
        # from_attributes = True


class LGUPayload(BaseModel):
    id: int
    lgu_name: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    lgu_classification: Optional[str] = None
    lgu_seal: Optional[str] = None  # data URL OR normal URL OR None
    population: Optional[int] = None
    mayor: Optional[str] = None
    DRMMpersonel: Optional[str] = None
    DRRM_contact: Optional[str] = None
    lgu_pwd: Optional[int] = None
    lgu_senior: Optional[int] = None
    lgu_children: Optional[int] = None
    hazard_pic: Optional[str] = None  # same rules as lgu_seal
    lgu_majorHazard: Optional[List[str]] = None
    lgu_contact: Optional[str] = None
    population: Optional[int] = None
    lgu_critical_facility: Optional[List[str]] = None


class BarangayRecordsOut(BaseModel):
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
    common_hazards: Optional[List[str]] = None
    barangay_pwd: Optional[int] = None
    barangay_senior: Optional[int] = None
    barangay_children: Optional[int] = None
    evacucation_center_id: Optional[int] = None
    evacucation_center: Optional[EvacuationOut] = None


def to_abs_url(path: Optional[str], request: Request) -> Optional[str]:
    if not path:
        return None
    # already absolute?
    if path.startswith("http://") or path.startswith("https://"):
        return path
    base = str(request.base_url).rstrip("/")  # http://host:port
    if path.startswith("/"):
        return f"{base}{path}"
    return f"{base}/{path}"


@router.get("/me/lgu_location")
def lgu_profiling(
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(GetUserId()),
):
    admin = (
        db.query(AdminUserProfile)
        .options(joinedload(AdminUserProfile.lgu))
        .filter(AdminUserProfile.user_id == user_id)
        .first()
    )
    if not admin or not admin.lgu:
        raise HTTPException(404, "LGU not found")

    lgu = admin.lgu

    # DB-level count (no need to load all rows)
    baranggay_count = (
        db.query(func.count(BaranggayRecords.id))
        .filter(BaranggayRecords.lgu_id == lgu.id)
        .scalar()
    ) or 0

    payload = {
        "id": lgu.id,
        "lgu_name": lgu.lgu_name,
        "lat": float(lgu.lat) if lgu.lat is not None else None,
        "lng": float(lgu.lng) if lgu.lng is not None else None,
        "lgu_classification": lgu.lgu_classification,
        "lgu_seal": to_abs_url(lgu.lgu_seal, request),
        "hazard_pic": to_abs_url(lgu.hazard_pic, request),
        "lgu_majorHazard": lgu.lgu_majorHazard,
        "lgu_contact": lgu.lgu_contact,
        "lgu_critical_facility": lgu.lgu_critical_facility,
        "mayor": lgu.mayor,
        "DRMMpersonel": lgu.DRMMpersonel,
        "DRMM_contact": lgu.DRMM_contact,
        "population": lgu.population,
        "lgu_pwd": lgu.lgu_pwd,
        "lgu_children": lgu.lgu_children,
        "lgu_senior": lgu.lgu_senior,
        "baranggay_count": baranggay_count,  # ← NEW
    }

    return LGUOut.model_validate(payload)

# ---------- Helpers ----------
def _get_my_lgu_or_404(db: Session, user_id: str) -> LGURecords:
    admin = (
        db.query(AdminUserProfile)
        .options(joinedload(AdminUserProfile.lgu))
        .filter(AdminUserProfile.user_id == user_id)
        .first()
    )
    if not admin or not admin.lgu:
        raise HTTPException(404, "LGU not found")
    return admin.lgu

# ---------- Endpoints ----------

#  ------------------------------------RAFFI-----------------------------------
@router.get("/me/raffi_list", response_model=List[RAFIOut])
def list_my_raffi(
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(GetUserId()),
):
    lgu = _get_my_lgu_or_404(db, user_id)
    rows = (
        db.query(RAFIInfrastructure)
        .filter(RAFIInfrastructure.lgu_id == lgu.id)
        .order_by(RAFIInfrastructure.rafi_name.asc())
        .all()
    )
    # make pic absolute if needed
    for r in rows:
        if r.rafi_pic:
            r.rafi_pic = to_abs_url(r.rafi_pic, request)
    return rows
@router.post("/api/raffi", response_model=RAFIOut)
def create_raffi(
    payload: RAFICreate,
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(GetUserId()),
):
    # 1) Resolve the caller's LGU (404s if none)
    lgu = _get_my_lgu_or_404(db, user_id)

    # 2) Normalize optional image
    pic_url = normalize_image_field(
        payload.raffi_pic,
        dest_dir="media/raffi",
        public_base="/media/raffi",
    )

    # 3) Create with lgu_id set
    rec = RAFIInfrastructure(
        lgu_id=lgu.id,                   # ← THIS is the missing piece
        rafi_name=payload.raffi_name,
        lat=payload.lat,
        lng=payload.lng,
        rafi_desc=payload.raffi_desc,
        rafi_pic=pic_url,
    )

    db.add(rec)
    db.commit()
    db.refresh(rec)

    # 4) Make image absolute for the response
    if rec.rafi_pic:
        rec.rafi_pic = to_abs_url(rec.rafi_pic, request)

    return rec
@router.put("/api/raffi/{rafi_id}", response_model=RAFIOut)
def update_raffi(
    rafi_id: int,
    payload: RAFIUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(GetUserId()),
):
    # 1️⃣ Get the LGU for this user
    lgu = _get_my_lgu_or_404(db, user_id)

    # 2️⃣ Find the record
    rec = (
        db.query(RAFIInfrastructure)
        .filter(RAFIInfrastructure.rafi_id == rafi_id, RAFIInfrastructure.lgu_id == lgu.id)
        .first()
    )
    if not rec:
        raise HTTPException(404, "RAFFI not found")

    # 3️⃣ Get incoming fields
    data = payload.model_dump(exclude_unset=True)
    print("Incoming update payload:", data)  # 🪵 debug

    # 4️⃣ Handle either spelling from frontend
    name_key = "raffi_name" if "raffi_name" in data else "rafi_name" if "rafi_name" in data else None
    desc_key = "raffi_desc" if "raffi_desc" in data else "rafi_desc" if "rafi_desc" in data else None
    pic_key  = "raffi_pic" if "raffi_pic" in data else "rafi_pic" if "rafi_pic" in data else None

    if name_key:
        rec.rafi_name = data.pop(name_key)
    if desc_key:
        rec.rafi_desc = data.pop(desc_key)
    if pic_key:
        rec.rafi_pic = normalize_image_field(
            data.pop(pic_key),
            dest_dir="media/raffi_images",
            public_base="/media/raffi_images",
        )

    # 5️⃣ Apply remaining fields (lat, lng, etc.)
    for k, v in data.items():
        setattr(rec, k, v)

    db.add(rec)
    db.commit()
    db.refresh(rec)

    # 6️⃣ Make URL absolute for frontend display
    if rec.rafi_pic:
        rec.rafi_pic = to_abs_url(rec.rafi_pic, request)

    return rec

@router.delete("/api/raffi/{rafi_id}")
def delete_raffi(
    rafi_id: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(GetUserId()),
):
    lgu = _get_my_lgu_or_404(db, user_id)
    rec = (
        db.query(RAFIInfrastructure)
        .filter(RAFIInfrastructure.rafi_id == rafi_id, RAFIInfrastructure.lgu_id == lgu.id)
        .first()
    )
    if not rec:
        raise HTTPException(404, "RAFFI not found")
    db.delete(rec)
    db.commit()
    return {"ok": True}
#  ------------------------------------BARANGAY------------------------------------

@router.get(
    "/me/barangay_list",
)
def barangay_list(
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(GetUserId()),
):
    admin = (
        db.query(AdminUserProfile)
        .options(joinedload(AdminUserProfile.lgu))
        .filter(AdminUserProfile.user_id == user_id)
        .first()
    )
    if not admin or not admin.lgu:
        raise HTTPException(404, "LGU not found")

    lgu = admin.lgu

    barangays = (
        db.query(BaranggayRecords)
        .options(joinedload(BaranggayRecords.evacucation_center))  # ← eager-load
        .filter(BaranggayRecords.lgu_id == lgu.id)
        .order_by(BaranggayRecords.name.asc())
        .all()
    )

    # Make barangay_pic absolute if present
    for b in barangays:
        if b.baranggay_pic:
            b.baranggay_pic = to_abs_url(b.baranggay_pic, request)

    return barangays


def save_image_from_data_url(
    data_url: str,
    dest_dir: str = "media/lgu_info",  # <- write into the mounted folder
    public_base: str = "/media/lgu_info",  # <- URL that matches your mount
) -> str:
    m = DATA_URL_RE.match(data_url)
    if not m:
        raise ValueError("Not a valid image data URL")

    mime, b64 = m.groups()
    ext = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/webp": "webp",
        "image/gif": "gif",
        # add more if needed
    }.get(mime, "bin")

    os.makedirs(dest_dir, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.{ext}"

    with open(os.path.join(dest_dir, filename), "wb") as f:
        f.write(base64.b64decode(b64))

    # IMPORTANT: return the URL with the filename
    return f"{public_base}/{filename}"


def normalize_image_field(
    val: Optional[str],
    dest_dir: str = "media/lgu_info",
    public_base: str = "/media/lgu_info",
) -> Optional[str]:
    if val is None:
        return None  # explicit clear
    if isinstance(val, str) and DATA_URL_RE.match(val):
        return save_image_from_data_url(
            val, dest_dir, public_base
        )  # uses media/lgu_info by default
    return val  # already a URL


@router.put("/api/update_lgu")
def patch_lgu(p: LGUPayload, db: Session = Depends(get_db)):
    # 1) Load the row
    lgu_id = p.id
    rec = db.query(LGURecords).filter(LGURecords.id == lgu_id).first()
    if not rec:
        raise HTTPException(404, f"LGU with id={lgu_id} not found")

    # 2) Only the fields sent by client
    updates: Dict[str, Any] = p.model_dump(exclude_unset=True)

    updates.pop("id")
    # 3) Special handling for images
    if "lgu_seal" in updates:
        updates["lgu_seal"] = normalize_image_field(updates["lgu_seal"])

    if "hazard_pic" in updates:
        updates["hazard_pic"] = normalize_image_field(updates["hazard_pic"])

    # 4) (Optional) Coerce/validate arrays if needed
    # e.g., ensure lists for ARRAY(String) columns
    if "lgu_majorHazard" in updates and updates["lgu_majorHazard"] is None:
        updates["lgu_majorHazard"] = None  # explicit clear is allowed
    if "lgu_critical_facility" in updates and updates["lgu_critical_facility"] is None:
        updates["lgu_critical_facility"] = None

    # 5) Apply updates
    for k, v in updates.items():
        setattr(rec, k, v)

    db.add(rec)
    db.commit()
    db.refresh(rec)

    return {
        "ok": True,
        "message": "LGU record updated",
        "id": rec.id,
    }


@router.put("/api/update_barangay")
def update_barangay(p: BarangayRecordsOut, db: Session = Depends(get_db)):
    barangay_id = p.id
    rec = db.query(BaranggayRecords).filter(BaranggayRecords.id == barangay_id).first()
    if not rec:
        raise HTTPException(404, f"Barangay with id={barangay_id} not found")
    updates: Dict[str, Any] = p.model_dump(exclude_unset=True)
    updates.pop("id")
    updates.pop("lgu_id")
    if "baranggay_pic" in updates:
        updates["baranggay_pic"] = normalize_image_field(
            updates["baranggay_pic"],
            dest_dir="media/barangay_pictures",
            public_base="/media/barangay_pictures",
        )
    if "common_hazards" in updates and updates["common_hazards"] is None:
        updates["common_hazards"] = None
    for k, v in updates.items():
        setattr(rec, k, v)
    db.add(rec)
    db.commit()
    db.refresh(rec)

    return {
        "ok": True,
        "message": "Barangay record updated",
        "id": rec.id,
    }


class EvacuationAdd(BaseModel):
    name: str
    lat: float
    lng: float
    baranggay_id: int
    capacity: int
    occupied: int


@router.post("/api/add_evacuation")
def add_evacuation(payload: EvacuationAdd, db: Session = Depends(get_db)):
    try:
        rec = EvacuationCenter(
            name=payload.name,
            lat=payload.lat,
            lng=payload.lng,
            capacity=payload.capacity,
        )
        db.add(rec)
        db.flush()  # get rec.evacuation_id without committing yet

        # If barangay_id is provided, link it
        if payload.baranggay_id is not None:
            b = (
                db.query(BaranggayRecords)
                .filter(BaranggayRecords.id == payload.baranggay_id)
                .first()
            )
            if not b:
                raise HTTPException(
                    404, f"Barangay id={payload.baranggay_id} not found"
                )

            # link
            b.evacucation_center_id = rec.evacuation_id
            db.add(b)

        db.commit()
        db.refresh(rec)
        return rec

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(500, f"DB error: {e}")


@router.get("/api/get_evacuation", response_model=List[EvacuationWithBarangaysOut])
def list_evac_centers_with_barangays(
    request: Request,
    db: Session = Depends(get_db),
):
    evac_list = (
        db.query(EvacuationCenter)
        .options(joinedload(EvacuationCenter.barangay))  # eager-load barangays
        .order_by(EvacuationCenter.name.asc())
        .all()
    )

    # Optional: make barangay pictures absolute URLs
    for ec in evac_list:
        for b in ec.barangay:
            if b.baranggay_pic:
                b.baranggay_pic = to_abs_url(b.baranggay_pic, request)

    return evac_list
