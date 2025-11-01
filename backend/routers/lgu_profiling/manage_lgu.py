from __future__ import annotations

from uuid import uuid4
from pathlib import Path
from typing import Union, Dict, List, Optional, Any
from datetime import datetime
import math
import imghdr

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    UploadFile,
    File,
    Form,
    Request,
    FastAPI,
)
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func, text

from database import get_db
from crud import delete
from models import (
    BaranggayRecords,
    EvacuationCenter,
    RAFIInfrastructure,
    LGURecords,
    Hazard,
)
from data_schemas.report_schema import TableResponse, Cell
from schemas import (
    ErrorResponse,
    EvacuationCenterOut,
    EvacuationCenterUpdate,
    EvacuationCenterCreate,
    RafiInfrastructureCreate,
    RafiInfrastructureUpdate,
    RafiInfrastructureOut,
    LGURecordsCreate,
    LGURecordsUpdate,
    LGURecordsOut,
    BaranggayRecordsCreate,
    BaranggayRecordsUpdate,
    BaranggayRecordsOut,
    HazardCreate,
    HazardUpdate,
    HazardOut,
)

# ---------------- Router & (optional) local app for dev ----------------
router = APIRouter(tags=["manage_lgu"])

# If you mount this router from a separate main.py, DELETE the block below.
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)

# ---------------- Helpers ----------------
PER_PAGE = 10
MIN_TRGM_CHARS = 3  # enable fuzzy search from 3+ chars
MIN_SEARCH_CHARS = 2  # 1-char searches are rejected


def getDefaultPage(page: int) -> int:
    return math.floor((page - 1) / 100) * 100 + 1


def _normalize(s: Optional[str]) -> str:
    return (s or "").strip()


def _has_extension(db: Session, ext: str) -> bool:
    """Safe check: never throws if extension lookup fails."""
    try:
        val = db.execute(
            text("SELECT 1 FROM pg_extension WHERE extname = :ext LIMIT 1"),
            {"ext": ext},
        ).scalar()
        return bool(val)
    except Exception:
        try:
            db.rollback()
        except:
            pass
        return False


def _supports_pg_trgm(db: Session) -> bool:
    return _has_extension(db, "pg_trgm")


def _supports_unaccent(db: Session) -> bool:
    return _has_extension(db, "unaccent")


def _abs_media_url(request: Request, p: Optional[str]) -> str:
    if not p or p.strip() == "-":
        return "-"
    p = p.strip()
    if p.lower().startswith(("http://", "https://")):
        return p
    base = str(request.base_url).rstrip("/")
    return f"{base}{p if p.startswith('/') else '/' + p}"


def _fmt_dt(dt: Optional[datetime]) -> str:
    if not dt:
        return "-"
    return dt.strftime("%Y-%m-%d %H:%M")


# ---------------- Search helpers (LGU / Evacuation) ----------------
def find_lgu(q: str, sim_threshold: float, db: Session):
    q_norm = q.strip()
    if not q_norm:
        return []
    sim = func.similarity(LGURecords.name, q_norm).label("rank")
    stmt = select(LGURecords).where(sim > sim_threshold).order_by(sim.desc())
    return db.execute(stmt).scalars().all()


def find_evacuation(q: str, sim_threshold: float, db: Session):
    q_norm = q.strip()
    if not q_norm:
        return []
    sim = func.similarity(EvacuationCenter.name, q_norm).label("rank")
    stmt = select(EvacuationCenter).where(sim > sim_threshold).order_by(sim.desc())
    return db.execute(stmt).scalars().all()


# ---------------- LGU list/search ----------------
def _lgu_base_query(db: Session, q: Optional[str], sim_threshold: float, order_col):
    q = _normalize(q)
    if not q:
        return db.query(LGURecords).order_by(order_col)

    # block 1-char searches to avoid full-scan spam
    if len(q) < MIN_SEARCH_CHARS:
        return db.query(LGURecords).filter(False)

    # 2-char => ILIKE
    if len(q) < MIN_TRGM_CHARS:
        like = f"%{q}%"
        return (
            db.query(LGURecords).filter(LGURecords.name.ilike(like)).order_by(order_col)
        )

    # 3+ => fuzzy if pg_trgm exists
    has_trgm = _supports_pg_trgm(db)
    has_unaccent = _supports_unaccent(db)
    if has_trgm:
        name_expr = func.unaccent(LGURecords.name) if has_unaccent else LGURecords.name
        q_expr = func.unaccent(q) if has_unaccent else q
        sim = func.similarity(name_expr, q_expr).label("rank")
        return (
            db.query(LGURecords)
            .filter(sim > sim_threshold)
            .order_by(sim.desc(), order_col)
        )

    # fallback ILIKE
    like = f"%{q}%"
    return db.query(LGURecords).filter(LGURecords.name.ilike(like)).order_by(order_col)


@router.get("/lgu_profiling/manage_lgu/get_lgu", response_model=TableResponse)
def get_lgu(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    Name: str = Query("desc", description="Sort by name asc|desc"),
    q: str = Query("", description="Search by LGU name (fuzzy if pg_trgm installed)"),
    sim_threshold: float = Query(0.2, ge=0.0, le=1.0),
):
    try:
        db.rollback()  # clear dangling txns just in case
    except Exception:
        pass

    page = getDefaultPage(page)
    offset = (page - 1) * PER_PAGE

    table_head = [
        {"text": "Name", "width": "220px", "action": "Sort"},
        {"text": "Lat", "width": "140px"},
        {"text": "Lng", "width": "140px"},
        {"text": "Classification", "width": "180px"},
        {"text": "Action", "width": "120px"},
    ]

    order_col = (
        LGURecords.name.desc() if str(Name).lower() == "desc" else LGURecords.name.asc()
    )
    base_q = _lgu_base_query(
        db=db, q=q, sim_threshold=sim_threshold, order_col=order_col
    )

    count = base_q.count()
    records = base_q.limit(100).offset(offset).all()

    if not records:
        no_data_row = [
            Cell(type="Hidden", text="-", font_weight=0, color="#000", width="0px"),
            Cell(
                type="Text",
                text="No record found.",
                font_weight=500,
                color="gray",
                width="800px",
            ),
        ]
        table_datas = [{"page": 1, "row": [{"data": no_data_row}]}]
        return TableResponse(table_head=table_head, table_datas=table_datas, count=0)

    table_datas: List[dict] = []
    pageCount = page
    pages = {"page": pageCount, "row": []}

    for record in records:
        if len(pages["row"]) == PER_PAGE:
            table_datas.append(pages)
            pageCount += 1
            pages = {"page": pageCount, "row": []}

        row_data = [
            Cell(
                type="Hidden",
                text=str(record.id),
                font_weight=0,
                color="#000",
                width="0px",
            ),
            Cell(
                type="Text",
                text=(record.name or "-"),
                font_weight=500,
                color="#000",
                width="220px",
            ),
            Cell(
                type="Text",
                text=str(record.lat if record.lat is not None else "-"),
                font_weight=400,
                color="#000",
                width="140px",
            ),
            Cell(
                type="Text",
                text=str(record.lng if record.lng is not None else "-"),
                font_weight=400,
                color="#000",
                width="140px",
            ),
            Cell(
                type="Text",
                text=(record.classification or "-"),
                font_weight=400,
                color="#000",
                width="180px",
            ),
            Cell(
                type="Button",
                text="View",
                font_weight=500,
                color="#fff",
                background_color="#749AB6",
                container_width="120px",
                button_width="100px",
            ),
        ]
        pages["row"].append({"data": row_data})

    if pages["row"]:
        table_datas.append(pages)

    return TableResponse(table_head=table_head, table_datas=table_datas, count=count)


# Optional alias so FE can call /search_lgu the same way
@router.get("/lgu_profiling/manage_lgu/search_lgu", response_model=TableResponse)
def search_lgu_alias(
    db: Session = Depends(get_db),
    q: str = Query(..., description="Search text"),
    page: int = Query(1, ge=1),
    Name: str = Query("desc"),
    sim_threshold: float = Query(0.2, ge=0.0, le=1.0),
):
    return get_lgu(db=db, page=page, Name=Name, q=q, sim_threshold=sim_threshold)


# ---------------- LGU detail (RENAMED to avoid shadowing) ----------------
@router.get("/lgu_profiling/manage_lgu/lgu/{lgu_id}")
def get_lgu_one(lgu_id: int, db: Session = Depends(get_db)):
    r = db.query(LGURecords).get(lgu_id)
    if not r:
        raise HTTPException(status_code=404, detail="LGU not found")
    return {
        "id": r.id,
        "name": r.name,
        "lat": r.lat,
        "lng": r.lng,
        "classification": r.classification,
        "population": r.population,
        "contact_info": r.contact_info,
        "risk_level": r.risk_level,
        "description": r.description,
        "lgu_picture": r.lgu_picture,
        "resources": r.resources or [],
        "players": r.players or [],
        "schools": r.schools or [],
        "gyms": r.gyms or [],
        "local_suppliers": r.local_suppliers or [],
    }


# ---------------- Barangay ----------------
@router.get("/lgu_profiling/manage_lgu/barangay/{record_id}")
def get_barangay_detail(
    record_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    rec = (
        db.query(BaranggayRecords)
        .options(
            joinedload(BaranggayRecords.lgu),
            joinedload(BaranggayRecords.evacucation_center),
        )
        .get(record_id)
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Barangay not found")

    def _abs(p: Optional[str]) -> Optional[str]:
        if not p:
            return None
        p = p.strip()
        if p.lower().startswith(("http://", "https://")):
            return p
        base = str(request.base_url).rstrip("/")
        return f"{base}{p if p.startswith('/') else '/' + p}"

    return {
        "id": rec.id,
        "name": rec.name,
        "lat": rec.lat,
        "lng": rec.lng,
        "population": rec.population,
        "contact_info": rec.contact_info,
        "risk_level": rec.risk_level,
        "baranggay_pic": _abs(rec.baranggay_pic),
        "baranggay_desc": rec.baranggay_desc,
        "resources": rec.resources,
        "lgu_id": rec.lgu_id,
        "evacucation_center_id": rec.evacucation_center_id,
        "lgu_name": rec.lgu.name if rec.lgu else None,
        "evacuation_center_name": (
            rec.evacucation_center.name if rec.evacucation_center else None
        ),
    }


@router.get("/lgu_profiling/manage_lgu/get_barangay", response_model=TableResponse)
def get_barangay(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    Name: str = Query("desc"),
):
    page = getDefaultPage(page)
    offset = (page - 1) * PER_PAGE

    table_head = [
        {"text": "Name", "width": "220px", "action": "Sort"},
        {"text": "LGU", "width": "180px"},
        {"text": "Evacuation Center", "width": "220px"},
        {"text": "Contact Info", "width": "220px"},
        {"text": "Population", "width": "140px"},
        {"text": "Action", "width": "150px"},
    ]

    order = (
        BaranggayRecords.name.desc() if Name == "desc" else BaranggayRecords.name.asc()
    )

    records = (
        db.query(BaranggayRecords)
        .options(
            joinedload(BaranggayRecords.lgu),
            joinedload(BaranggayRecords.evacucation_center),
        )
        .order_by(order)
        .offset(offset)
        .limit(PER_PAGE)
        .all()
    )

    for r in records:
        r.lgu_name = r.lgu.name if r.lgu else None
        r.evacuation_center_name = (
            r.evacucation_center.name if r.evacucation_center else None
        )

    table_datas: List[dict] = []
    pageCount = page
    pages = {"page": pageCount, "row": []}

    for result in records:
        row_data = [
            Cell(
                type="Hidden",
                text=str(result.id),
                font_weight=0,
                color="#000",
                width="0px",
            ),
            Cell(
                type="Text",
                text=result.name or "-",
                font_weight=500,
                color="#000",
                width="220px",
            ),
            Cell(
                type="Text",
                text=(getattr(result, "lgu_name", None) or "—"),
                font_weight=500,
                color="#000",
                width="180px",
            ),
            Cell(
                type="Text",
                text=(getattr(result, "evacuation_center_name", None) or "—"),
                font_weight=500,
                color="#000",
                width="220px",
            ),
            Cell(
                type="Text",
                text=(result.contact_info or "—"),
                font_weight=500,
                color="#000",
                width="220px",
            ),
            Cell(
                type="Text",
                text=f"{(result.population or 0):,}",
                font_weight=500,
                color="#000",
                width="140px",
            ),
            Cell(
                type="Button",
                text="View",
                font_weight=500,
                color="#fff",
                background_color="#749AB6",
                container_width="150px",
                button_width="120px",
            ),
        ]
        pages["row"].append({"data": row_data})

    if pages["row"]:
        table_datas.append(pages)

    count = db.query(BaranggayRecords).count()
    return TableResponse(table_head=table_head, table_datas=table_datas, count=count)


@router.post(
    "/lgu_profiling/manage_lgu/add_barangay",
    response_model=Union[BaranggayRecordsOut, ErrorResponse],
)
def add_barangay(record: BaranggayRecordsCreate, db: Session = Depends(get_db)):
    lgu_matches = find_lgu(q=record.LGU, sim_threshold=0.96, db=db)
    if not lgu_matches:
        return {"success": False, "error": f"{record.LGU} doesn't exist in LGU records"}
    lgu_id = lgu_matches[0].id

    evac_id: Optional[int] = None
    evac_query = (record.evacuation or "").strip()
    if evac_query:
        evac_matches = find_evacuation(q=evac_query, sim_threshold=0.96, db=db)
        if not evac_matches:
            return {
                "success": False,
                "error": f"{record.evacuation} doesn't exist in Evacuation Center records",
            }
        evac_id = evac_matches[0].id

    try:
        db_row = BaranggayRecords(
            name=record.name,
            lat=record.lat,
            lng=record.lng,
            lgu_id=lgu_id,
            evacucation_center_id=evac_id,
            population=record.population,
            contact_info=record.contact_info,
            risk_level=record.risk_level,
            baranggay_pic=record.baranggay_pic,
            baranggay_desc=record.baranggay_desc,
            resources=record.resources,
        )
        db.add(db_row)
        db.commit()
        db.refresh(db_row)
    except Exception as e:
        db.rollback()
        return {"success": False, "error": f"Failed to add barangay: {e}"}

    return BaranggayRecordsOut(
        id=db_row.id,
        name=db_row.name,
        lat=db_row.lat,
        lng=db_row.lng,
        lgu_id=db_row.lgu_id,
        evacucation_center_id=db_row.evacucation_center_id,
        population=db_row.population,
        contact_info=db_row.contact_info,
        risk_level=db_row.risk_level,
        baranggay_pic=db_row.baranggay_pic,
        baranggay_desc=db_row.baranggay_desc,
        resources=db_row.resources,
    )


@router.put("/lgu_profiling/manage_lgu/update_barangay/{record_id}")
def update_barangay(
    record_id: int,
    payload: BaranggayRecordsUpdate,
    db: Session = Depends(get_db),
):
    record = db.query(BaranggayRecords).get(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Response record doesn't exist")

    if payload.name is not None:
        record.name = payload.name
    if payload.lat is not None:
        record.lat = payload.lat
    if payload.lng is not None:
        record.lng = payload.lng
    if payload.population is not None:
        record.population = payload.population
    if payload.contact_info is not None:
        record.contact_info = payload.contact_info
    if payload.risk_level is not None:
        record.risk_level = payload.risk_level

    if getattr(payload, "baranggay_pic", None) is not None:
        record.baranggay_pic = payload.baranggay_pic or None
    if getattr(payload, "baranggay_desc", None) is not None:
        record.baranggay_desc = payload.baranggay_desc
    if getattr(payload, "resources", None) is not None:
        record.resources = payload.resources

    if payload.LGU is not None:
        lgu = find_lgu(q=payload.LGU, sim_threshold=0.96, db=db)
        if not lgu:
            return {
                "success": False,
                "error": f"{payload.LGU} doesn't exist in LGU records",
            }
        record.lgu_id = lgu[0].id

    if payload.evacuation is not None:
        ev = (payload.evacuation or "").strip()
        if ev == "":
            record.evacucation_center_id = None
        else:
            evacuation = find_evacuation(q=ev, sim_threshold=0.96, db=db)
            if not evacuation:
                return {
                    "success": False,
                    "error": f"{ev} doesn't exist in Evacuation Center records",
                }
            record.evacucation_center_id = evacuation[0].id

    db.commit()
    db.refresh(record)
    return {"detail": "Record updated succesfully", "record": record}


@router.delete(
    "/lgu_profiling/manage_lgu/delete_barangay/{record_id}", response_model=dict
)
def delete_barangay(record_id: int, db: Session = Depends(get_db)):
    deleted_report = delete(db, BaranggayRecords, record_id)
    if not deleted_report:
        raise HTTPException(status_code=404, detail="Record not found.")
    return {"message": f"Barangay with ID {record_id} deleted successfully."}


# ---------------- Evacuation ----------------
def _get_evac_by_id(db: Session, record_id: int) -> EvacuationCenter | None:
    return (
        db.query(EvacuationCenter)
        .filter(
            (getattr(EvacuationCenter, "evacuation_id", None) == record_id)
            if hasattr(EvacuationCenter, "evacuation_id")
            else (EvacuationCenter.id == record_id)
        )
        .first()
    )

@router.get("/lgu_profiling/manage_lgu/get_evacuation", response_model=TableResponse)
def get_evacuation(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    Name: str = Query("desc"),
):
    page = getDefaultPage(page)
    offset = (page - 1) * PER_PAGE

    table_head = [
        {"text": "Name", "width": "150px", "action": "Sort"},
        {"text": "Lat", "width": "150px"},
        {"text": "Lng", "width": "150px"},
        {"text": "Capacity", "width": "150px"},
        {"text": "Occupied", "width": "150px"},
        {"text": "Action", "width": "150px"},
    ]

    order = (
        EvacuationCenter.name.desc() if Name == "desc" else EvacuationCenter.name.asc()
    )
    records = db.query(EvacuationCenter).order_by(order).limit(100).offset(offset).all()

    table_datas: List[dict] = []
    pageCount = page
    pages = {"page": pageCount, "row": []}

    for record in records:
        if len(pages["row"]) == PER_PAGE:
            table_datas.append(pages)
            pageCount += 1
            pages = {"page": pageCount, "row": []}

        row_data = [
            Cell(
                type="Hidden",
                text=str(record.id),
                font_weight=0,
                color="#000",
                width="0px",
            ),
            Cell(
                type="Text",
                text=record.name,
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=f"{record.lat:.6f}",
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=f"{record.lng:.6f}",
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=str(record.capacity),
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=str(record.occupied),
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Button",
                text="View",
                font_weight=500,
                color="#fff",
                background_color="#749AB6",
                container_width="150px",
                button_width="120px",
            ),
        ]
        pages["row"].append({"data": row_data})

    if pages["row"]:
        table_datas.append(pages)

    count = db.query(EvacuationCenter).count()
    return TableResponse(table_head=table_head, table_datas=table_datas, count=count)


@router.post(
    "/lgu_profiling/manage_lgu/add_evacuation", response_model=EvacuationCenterOut
)
def add_evacuation(record: EvacuationCenterCreate, db: Session = Depends(get_db)):
    db_record = EvacuationCenter(
        name=record.name,
        lat=record.lat,
        lng=record.lng,
        capacity=record.capacity,
        occupied=record.occupied or 0,
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.put("/manage_lgu/update_evacuation/{record_id}")
def update_evacuation(
    record_id: int, payload: EvacuationCenterUpdate, db: Session = Depends(get_db)
):
    # PK is evacuation_id (not id)
    record = (
        db.query(EvacuationCenter)
        .filter(EvacuationCenter.evacuation_id == record_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Evacuation center not found")

    data = payload.model_dump(exclude_unset=True)

    if "name" in data: record.name = data["name"]
    if "lat" in data: record.lat = data["lat"]
    if "lng" in data: record.lng = data["lng"]
    if "capacity" in data: record.capacity = data["capacity"]
    if "occupied" in data: record.occupied = data["occupied"]

    db.add(record)
    db.commit()
    db.refresh(record)
    return {"detail": "Record updated successfully"}


@router.get("/evacuation/{record_id}/linked_barangays", response_model=dict)
def linked_barangays(record_id: int, db: Session = Depends(get_db)):
    brgys = (
        db.query(BaranggayRecords)
        .filter(BaranggayRecords.evacucation_center_id == record_id)
        .all()
    )
    return {"barangays": [{"id": b.id, "name": b.name} for b in brgys]}



@router.delete("/manage_lgu/delete_evacuation/{record_id}", response_model=dict)
def delete_evacuation(record_id: int, db: Session = Depends(get_db)):
    # block delete if referenced by barangays
    refs = (
        db.query(BaranggayRecords)
        .filter(BaranggayRecords.evacucation_center_id == record_id)
        .count()
    )
    if refs > 0:
        raise HTTPException(
            status_code=409,
            detail=(
                "Cannot delete: this evacuation center is linked to one or more "
                "barangay records. Please detach or reassign first."
            ),
        )

    record = (
        db.query(EvacuationCenter)
        .filter(EvacuationCenter.evacuation_id == record_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Evacuation center not found")

    db.delete(record)
    db.commit()
    return {"message": f"Record with ID {record_id} deleted successfully."}

# ---- Force delete: detach linked barangays, then delete the center ----
@router.post("/manage_lgu/evacuation/{record_id}/force_delete", response_model=dict)
def force_delete_evacuation(record_id: int, db: Session = Depends(get_db)):
    # 1) Detach any barangays referencing this center
    linked = (
        db.query(BaranggayRecords)
        .filter(BaranggayRecords.evacucation_center_id == record_id)
        .all()
    )
    for b in linked:
        b.evacucation_center_id = None
        db.add(b)
    db.commit()

    # 2) Delete the evacuation center by its real PK column (evacuation_id)
    rec = (
        db.query(EvacuationCenter)
        .filter(EvacuationCenter.evacuation_id == record_id)
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Record not found.")

    db.delete(rec)
    db.commit()

    return {
        "message": "Evacuation center deleted. Detached barangays first.",
        "detached_count": len(linked),
    }

# ---------------- RAFI ----------------
MEDIA_DIR = Path("media")
RAFIS_DIR = MEDIA_DIR / "rafi_pictures"
RAFIS_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_TYPES = {"jpeg", "png", "gif", "bmp", "webp", "tiff"}


@router.get("/lgu_profiling/manage_lgu/get_rafi", response_model=TableResponse)
def get_rafi(
    request: Request,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    name: str = Query("desc"),  # asc|desc
):
    page = int(page)
    offset = (page - 1) * PER_PAGE

    table_head = [
        {"text": "Name", "width": "150px", "action": "Sort"},
        {"text": "Lat", "width": "150px"},
        {"text": "Lng", "width": "150px"},
        {"text": "Description", "width": "200px"},
        {"text": "Picture", "width": "200px"},
        {"text": "Action", "width": "120px"},
    ]

    order = (
        RAFIInfrastructure.rafi_name.desc()
        if str(name).lower() == "desc"
        else RAFIInfrastructure.rafi_name.asc()
    )

    total = db.query(RAFIInfrastructure).count()
    records = (
        db.query(RAFIInfrastructure)
        .order_by(order)
        .limit(PER_PAGE)
        .offset(offset)
        .all()
    )

    table_datas: List[dict] = []
    pages = {"page": page, "row": []}

    for r in records:
        abs_pic = _abs_media_url(request, r.rafi_pic)
        row_data = [
            Cell(
                type="Hidden",
                text=str(r.rafi_id),
                font_weight=0,
                color="#000",
                width="0px",
            ),
            Cell(
                type="Text",
                text=(r.rafi_name or "-"),
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=str(r.lat),
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=str(r.lng),
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=(r.rafi_desc or "-"),
                font_weight=500,
                color="#000",
                width="200px",
            ),
            Cell(
                type="Text",
                text=(abs_pic or "-"),
                font_weight=400,
                color="#000",
                width="200px",
            ),
            Cell(
                type="Button",
                text="View",
                font_weight=500,
                color="#fff",
                background_color="#749AB6",
                container_width="120px",
                button_width="100px",
            ),
        ]
        pages["row"].append({"data": row_data})

    if pages["row"]:
        table_datas.append(pages)

    return TableResponse(table_head=table_head, table_datas=table_datas, count=total)


@router.post("/lgu_profiling/manage_lgu/add_rafi", response_model=RafiInfrastructureOut)
def add_rafi(
    request: Request,
    rafi_name: str = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    rafi_desc: str = Form(""),
    rafi_pic: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    pic_url: Optional[str] = None

    if rafi_pic and rafi_pic.filename:
        contents = rafi_pic.file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        kind = imghdr.what(None, h=contents)
        if kind not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=400, detail=f"Unsupported image type: {kind}"
            )

        ext = "jpg" if kind == "jpeg" else kind
        unique = uuid4().hex
        filename = f"{Path(rafi_pic.filename).stem}-{unique}.{ext}"
        dest = RAFIS_DIR / filename
        with open(dest, "wb") as f:
            f.write(contents)

        pic_url = f"/media/rafi_pictures/{filename}"

    rec = RAFIInfrastructure(
        rafi_name=rafi_name,
        lat=lat,
        lng=lng,
        rafi_desc=rafi_desc,
        rafi_pic=pic_url,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    if rec.rafi_pic:
        rec.rafi_pic = _abs_media_url(request, rec.rafi_pic)

    return rec


@router.put("/lgu_profiling/manage_lgu/update_rafi/{record_id}", response_model=dict)
def update_rafi(
    request: Request,
    record_id: int,
    rafi_name: str = Form(None),
    lat: float = Form(None),
    lng: float = Form(None),
    rafi_desc: str = Form(None),
    rafi_pic: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    record = (
        db.query(RAFIInfrastructure)
        .filter(RAFIInfrastructure.rafi_id == record_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="RAFI record doesn't exist")

    if rafi_name is not None:
        record.rafi_name = rafi_name
    if lat is not None:
        record.lat = lat
    if lng is not None:
        record.lng = lng
    if rafi_desc is not None:
        record.rafi_desc = rafi_desc

    if rafi_pic and rafi_pic.filename:
        contents = rafi_pic.file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        kind = imghdr.what(None, h=contents)
        if kind not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=400, detail=f"Unsupported image type: {kind}"
            )
        ext = "jpg" if kind == "jpeg" else kind
        unique = uuid4().hex
        filename = f"{Path(rafi_pic.filename).stem}-{unique}.{ext}"
        dest = RAFIS_DIR / filename
        with open(dest, "wb") as f:
            f.write(contents)
        record.rafi_pic = f"/media/rafi_pictures/{filename}"

    db.commit()
    db.refresh(record)

    abs_pic = _abs_media_url(request, record.rafi_pic)
    return {
        "detail": "RAFI record updated successfully",
        "record": {
            "rafi_id": record.rafi_id,
            "rafi_name": record.rafi_name,
            "lat": record.lat,
            "lng": record.lng,
            "rafi_desc": record.rafi_desc,
            "rafi_pic": abs_pic,
        },
    }


@router.delete("/lgu_profiling/manage_lgu/delete_rafi/{record_id}", response_model=dict)
def delete_rafi(record_id: int, db: Session = Depends(get_db)):
    record = (
        db.query(RAFIInfrastructure)
        .filter(RAFIInfrastructure.rafi_id == record_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="RAFI record not found.")
    db.delete(record)
    db.commit()
    return {"message": f"RAFI Infrastructure with ID {record_id} deleted successfully."}
# ---------------- Hazard ----------------
from sqlalchemy.orm import joinedload  # you already import this above
from fastapi import Request

def _find_lgu_by_name(db: Session, name: str) -> Optional[LGURecords]:
    n = (name or "").strip()
    if not n:
        return None
    # case-insensitive exact match first
    lgu = (
        db.query(LGURecords)
        .filter(func.lower(LGURecords.name) == n.lower())
        .first()
    )
    if lgu:
        return lgu
    # fallback: simple ILIKE contains
    return (
        db.query(LGURecords)
        .filter(LGURecords.name.ilike(f"%{n}%"))
        .order_by(LGURecords.name.asc())
        .first()
    )

@router.get("/lgu_profiling/manage_lgu/get_hazard", response_model=TableResponse)
def get_hazard(
    request: Request,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    Name: str = Query("desc"),
):
    page = getDefaultPage(page)
    offset = (page - 1) * PER_PAGE

    table_head = [
        {"text": "Last Updated", "width": "150px", "action": "Sort"},
        # LGU removed
        {"text": "Hazard Area", "width": "220px"},
        {"text": "Description", "width": "150px"},
        {"text": "Image URL", "width": "260px"},
        {"text": "Action", "width": "120px"},
    ]

    order = (
        Hazard.last_updated.desc().nulls_last()
        if str(Name).lower() == "desc"
        else Hazard.last_updated.asc().nulls_last()
    )

    records = (
        db.query(Hazard)
        # .options(joinedload(Hazard.lgu))  # optional now
        .order_by(order)
        .limit(100)
        .offset(offset)
        .all()
    )

    table_datas: List[dict] = []
    pageCount = page
    pages = {"page": pageCount, "row": []}

    for record in records:
        if len(pages["row"]) == PER_PAGE:
            table_datas.append(pages)
            pageCount += 1
            pages = {"page": pageCount, "row": []}

        row_data = [
            Cell(type="Hidden", text=str(record.id), font_weight=0, color="#000", width="0px"),
            Cell(type="Text", text=_fmt_dt(record.last_updated), font_weight=500, color="#000", width="150px"),
            Cell(type="Text", text=(record.hazard_area or "—"), font_weight=500, color="#000", width="220px"),
            Cell(type="Text", text=(record.hazard_type or "—"), font_weight=500, color="#000", width="150px"),
            Cell(type="Text", text=_abs_media_url(request, record.image_url), font_weight=400, color="#000", width="260px"),
            Cell(type="Button", text="View", font_weight=500, color="#fff",
                 background_color="#749AB6", container_width="120px", button_width="100px"),
        ]
        pages["row"].append({"data": row_data})

    if pages["row"]:
        table_datas.append(pages)

    count = db.query(Hazard).count()
    return TableResponse(table_head=table_head, table_datas=table_datas, count=count)
@router.get("/lgu_profiling/manage_lgu/lgu/{lgu_id}/hazards", response_model=dict)
def get_hazards_for_lgu(
    lgu_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Hazard)
        .filter(Hazard.lgu_id == lgu_id)
        .order_by(Hazard.last_updated.desc().nulls_last())
        .all()
    )

    items = []
    for h in rows:
        # only send if there's an image
        if not h.image_url:
            continue
        items.append(
            {
                "id": h.id,
                "type": h.hazard_type or "",
                "area": h.hazard_area or "",
                "image_url": _abs_media_url(request, h.image_url),
                "last_updated": _fmt_dt(h.last_updated),
            }
        )

    return {"count": len(items), "items": items}


@router.post("/lgu_profiling/manage_lgu/add_hazard", response_model=HazardOut)
def add_hazard(record: HazardCreate, db: Session = Depends(get_db)):
    """
    hazard_area is the LGU name. We resolve it and store lgu_id.
    """
    lgu = _find_lgu_by_name(db, record.hazard_area)
    if not lgu:
        raise HTTPException(
            status_code=422,
            detail=f"LGU named '{record.hazard_area}' was not found."
        )

    db_record = Hazard(
        lgu_id=lgu.id,                   # <-- link to LGU
        hazard_area=record.hazard_area,  # keep the text the user entered
        hazard_type=record.hazard_type,
        image_url=record.image_url,
        action=record.action,
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.put("/lgu_profiling/manage_lgu/update_hazard/{record_id}", response_model=HazardOut)
def update_hazard(record_id: int, payload: HazardUpdate, db: Session = Depends(get_db)):
    rec = db.get(Hazard, record_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Hazard record doesn't exist")

    # If hazard_area (LGU name) changes, resolve and update lgu_id too
    if payload.hazard_area is not None:
        lgu = _find_lgu_by_name(db, payload.hazard_area)
        if not lgu:
            raise HTTPException(
                status_code=422,
                detail=f"LGU named '{payload.hazard_area}' was not found."
            )
        rec.lgu_id = lgu.id
        rec.hazard_area = payload.hazard_area

    if payload.hazard_type is not None:
        rec.hazard_type = payload.hazard_type
    if payload.image_url is not None:
        rec.image_url = payload.image_url
    if payload.action is not None:
        rec.action = payload.action

    db.commit()
    db.refresh(rec)
    return rec


@router.delete("/lgu_profiling/manage_lgu/delete_hazard/{record_id}", response_model=dict)
def delete_hazard(record_id: int, db: Session = Depends(get_db)):
    removed = delete(db, Hazard, record_id)
    if not removed:
        raise HTTPException(status_code=400, detail="Record not found.")
    return {"message": f"Hazard with ID {record_id} deleted successfully."}

# ---------------- LGU CRUD (simple) ----------------
@router.post("/lgu_profiling/manage_lgu/add_lgu", response_model=LGURecordsOut)
def add_lgu(record: LGURecordsCreate, db: Session = Depends(get_db)):
    db_record = LGURecords(
        name=record.name,
        lat=record.lat,
        lng=record.lng,
        classification=record.classification,
        population=record.population,
        contact_info=record.contact_info,
        risk_level=record.risk_level,
        lgu_picture=record.lgu_picture,
        description=record.description,
        resources=record.resources,
        players=record.players,
        schools=record.schools,
        gyms=record.gyms,
        local_suppliers=record.local_suppliers,
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.put("/lgu_profiling/manage_lgu/update_lgu/{record_id}")
def update_lgu(
    record_id: int,
    payload: LGURecordsUpdate,
    db: Session = Depends(get_db),
):
    record = db.query(LGURecords).get(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Response record doesn't exist")

    updatable = [
        "name",
        "lat",
        "lng",
        "classification",
        "population",
        "contact_info",
        "risk_level",
        "lgu_picture",
        "description",
        "resources",
        "players",
        "schools",
        "gyms",
        "local_suppliers",
    ]
    for field in updatable:
        val = getattr(payload, field, None)
        if val is not None:
            setattr(record, field, val)

    db.commit()
    db.refresh(record)
    return {"detail": "Record updated succesfully", "record": record}


@router.delete("/lgu_profiling/manage_lgu/delete_lgu/{record_id}", response_model=dict)
def delete_lgu(record_id: int, db: Session = Depends(get_db)):
    deleted_report = delete(db, LGURecords, record_id)
    if not deleted_report:
        raise HTTPException(status_code=400, detail="Record not found.")
    return {"message": f"Record with ID {record_id} deleted successfully."}
