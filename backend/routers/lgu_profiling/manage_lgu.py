from os import name
from pathlib import Path
from crud import delete, update
from fastapi import APIRouter, Query,FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func
from fastapi import Request
from uuid import uuid4
from data_schemas.report_schema import TableResponse, Cell
from schemas import (
    ErrorResponse,
    EvacuationCenterOut,
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
    HazardOut
)
from fastapi import UploadFile, File, Form
from pathlib import Path
import imghdr

from database import get_db
from crud import delete, create_evacuation_center
from models import BaranggayRecords, EvacuationCenter, RAFIInfrastructure, LGURecords,Hazard

from routers.role_checker import RoleChecker
import math
from typing import Union, Dict,List
from datetime import datetime
router = APIRouter(
    tags=["manage_lgu"],
    # dependencies=[Depends(RoleChecker(["operations admin"]))],
)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],                      # dev: you can also use ["*"]
    allow_credentials=True,
    allow_methods=["*"],    # or ["GET","POST","PUT","DELETE","PATCH","OPTIONS"]
    allow_headers=["*"],
)
def getDefaultPage(page):
    return math.floor((page - 1) / 100) * 100 + 1
@router.get("/lgu_profiling/manage_lgu/get_lgu", response_model=TableResponse)
def get_lgu(db: Session = Depends(get_db), page: int = Query(1, ge=1), Name: str = "desc"):

    def _summ(v: list | None, _label: str = "") -> str:
        """Summarize arrays; return '-' if empty; return str(v) if not a list."""
        if not v:
            return "-"
        if isinstance(v, list):
            shown = [str(x) for x in v[:3]]
            more = max(len(v) - len(shown), 0)
            return ", ".join(shown) + (f" (+{more})" if more > 0 else "")
        return str(v)

    def _desc(txt: str | None, limit: int = 80) -> str:
        if not txt:
            return "-"
        return txt if len(txt) <= limit else txt[:limit - 1] + "…"

    page = getDefaultPage(page)
    offset = (page - 1) * 10

    table_head = [
        {"text": "Name", "width": "150px", "action": "Sort"},
        {"text": "Lat", "width": "100px"},
        {"text": "Lng", "width": "100px"},
        {"text": "Classification", "width": "140px"},
        {"text": "Population", "width": "120px"},
        {"text": "Contact Info", "width": "160px"},
        {"text": "Risk Level", "width": "110px"},
        {"text": "Description", "width": "220px"},
        {"text": "Resources", "width": "180px"},
        {"text": "Players", "width": "160px"},
        {"text": "Schools", "width": "160px"},
        {"text": "Gyms", "width": "120px"},
        {"text": "Suppliers", "width": "180px"},
        {"text": "Picture", "width": "220px"},   # ✅ show if there is an uploaded picture
        {"text": "Action", "width": "120px"},
    ]

    order = LGURecords.name.desc() if Name == "desc" else LGURecords.name.asc()
    records = (
        db.query(LGURecords)
        .order_by(order)
        .limit(100)
        .offset(offset)
        .all()
    )

    table_datas: list[dict] = []
    pageCount = page
    pages = {"page": pageCount, "row": []}

    for record in records:
        if len(pages["row"]) == 10:
            table_datas.append(pages)
            pageCount += 1
            pages = {"page": pageCount, "row": []}

        row_data = [
            # hidden id
            Cell(type="Hidden", text=str(record.id), font_weight=0, color="#000", width="0px"),

            # visible cols (align exactly with table_head)
            Cell(type="Text", text=(record.name or "-"), font_weight=500, color="#000", width="150px"),
            Cell(type="Text", text=str(record.lat if record.lat is not None else "-"), font_weight=500, color="#000", width="100px"),
            Cell(type="Text", text=str(record.lng if record.lng is not None else "-"), font_weight=500, color="#000", width="100px"),
            Cell(type="Text", text=(record.classification or "-"), font_weight=500, color="#000", width="140px"),
            Cell(type="Text", text=str(record.population if record.population is not None else "-"), font_weight=500, color="#000", width="120px"),
            Cell(type="Text", text=(record.contact_info or "-"), font_weight=500, color="#000", width="160px"),
            Cell(type="Text", text=(record.risk_level or "-"), font_weight=500, color="#000", width="110px"),  # ✅ fixed position
            Cell(type="Text", text=_desc(record.description), font_weight=400, color="#000", width="220px"),
            Cell(type="Text", text=_summ(record.resources, "Resources"), font_weight=400, color="#000", width="180px"),
            Cell(type="Text", text=_summ(record.players, "Players"), font_weight=400, color="#000", width="160px"),
            Cell(type="Text", text=_summ(record.schools, "Schools"), font_weight=400, color="#000", width="160px"),
            Cell(type="Text", text=_summ(record.gyms, "Gyms"), font_weight=400, color="#000", width="120px"),
            Cell(type="Text", text=_summ(record.local_suppliers, "Suppliers"), font_weight=400, color="#000", width="180px"),
            Cell(type="Text",text=(record.lgu_picture or "-"),font_weight=400,color="#000",width="180px",),

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

    count = db.query(LGURecords).count()
    return TableResponse(table_head=table_head, table_datas=table_datas, count=count)


PER_PAGE = 10

@router.get("/lgu_profiling/manage_lgu/get_barangay", response_model=TableResponse)
def get_barangay(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    Name: str = "desc"
):
    page = getDefaultPage(page)
    offset = (page - 1) * PER_PAGE

    # ✅ Only the 6 columns you want (plus hidden id in the data rows)
    table_head = [
        {"text": "Name", "width": "220px", "action": "Sort"},
        {"text": "LGU", "width": "180px"},
        {"text": "Evacuation Center", "width": "220px"},
        {"text": "Contact Info", "width": "220px"},
        {"text": "Population", "width": "140px"},
        {"text": "Action", "width": "150px"},
    ]

    order = BaranggayRecords.name.desc() if Name == "desc" else BaranggayRecords.name.asc()

    # Keep joins so we can show LGU/Evac Center names
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

    # Pre-compute display names
    for r in records:
        r.lgu_name = r.lgu.name if r.lgu else None
        r.evacuation_center_name = r.evacucation_center.name if r.evacucation_center else None

    # Build rows (hidden id + 5 visible cols + actions)
    table_datas = []
    pageCount = page
    pages = {"page": pageCount, "row": []}

    for result in records:
        row_data = [
            # hidden id (keep if your table component relies on this)
            Cell(type="Hidden", text=str(result.id), font_weight=0, color="#000", width="0px"),

            Cell(type="Text", text=result.name or "-", font_weight=500, color="#000", width="220px"),
            Cell(type="Text", text=(result.lgu_name or "—"), font_weight=500, color="#000", width="180px"),
            Cell(type="Text", text=(result.evacuation_center_name or "—"), font_weight=500, color="#000", width="220px"),
            Cell(type="Text", text=(result.contact_info or "—"), font_weight=500, color="#000", width="220px"),
            Cell(type="Text", text=f"{(result.population or 0):,}", font_weight=500, color="#000", width="140px"),

            # Action cell – customize as your frontend expects (edit/delete/view)
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


def _abs_media_url(request: Request, p: str | None) -> str:
    if not p or p.strip() == "-":
        return "-"
    p = p.strip()
    if p.lower().startswith(("http://", "https://")):
        return p
    base = str(request.base_url).rstrip("/")
    return f"{base}{p if p.startswith('/') else '/' + p}"

@router.get("/lgu_profiling/manage_lgu/get_rafi", response_model=TableResponse)
def get_rafi(
    request: Request,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    name: str = Query("desc")  # asc|desc
):
    # ----- paging -----
    page = int(page)
    offset = (page - 1) * PER_PAGE

    # ----- table header -----
    table_head = [
        {"text": "Name", "width": "150px", "action": "Sort"},
        {"text": "Lat", "width": "150px"},
        {"text": "Lng", "width": "150px"},
        {"text": "Description", "width": "200px"},
        {"text": "Picture", "width": "200px"},
        {"text": "Action", "width": "120px"},
    ]

    # ----- ordering -----
    order = RAFIInfrastructure.rafi_name.desc() if str(name).lower() == "desc" \
            else RAFIInfrastructure.rafi_name.asc()

    total = db.query(RAFIInfrastructure).count()
    records = (
        db.query(RAFIInfrastructure)
          .order_by(order)
          .limit(PER_PAGE)
          .offset(offset)
          .all()
    )

    # ----- rows (keep indexes aligned with your frontend) -----
    table_datas: list[dict] = []
    pages = {"page": page, "row": []}

    for r in records:
        abs_pic = _abs_media_url(request, r.rafi_pic)

        row_data = [
            # 0 hidden id
            Cell(type="Hidden", text=str(r.rafi_id), font_weight=0,   color="#000", width="0px"),
            # 1 name
            Cell(type="Text",   text=(r.rafi_name or "-"), font_weight=500, color="#000", width="150px"),
            # 2 lat
            Cell(type="Text",   text=str(r.lat),           font_weight=500, color="#000", width="150px"),
            Cell(type="Text",   text=str(r.lng),           font_weight=500, color="#000", width="150px"),
            Cell(type="Text",   text=(r.rafi_desc or "-"), font_weight=500, color="#000", width="200px"),
            Cell(type="Text",   text=(abs_pic or "-"),     font_weight=400, color="#000", width="200px"),
            Cell(type="Button", text="View", font_weight=500, color="#fff",
                 background_color="#749AB6", container_width="120px", button_width="100px"),
        ]
        pages["row"].append({"data": row_data})

    if pages["row"]:
        table_datas.append(pages)

    return TableResponse(table_head=table_head, table_datas=table_datas, count=total)
def _fmt_dt(dt: datetime | None) -> str:
    if not dt:
        return "-"
    return dt.strftime("%Y-%m-%d %H:%M")

@router.get("/lgu_profiling/manage_lgu/get_hazard", response_model=TableResponse)
def get_hazard(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    Name: str = "desc"  # follow your existing pattern; use this for sort order on last_updated
):
    page = getDefaultPage(page)
    offset = (page - 1) * 10

    table_head = [
        {"text": "Last Updated", "width": "150px", "action": "Sort"},
        {"text": "Hazard_area", "width": "150px"},
        {"text": "image_url", "width": "150px"},
        {"text": "Hazard Type", "width": "150px"},
        {"text": "Action", "width": "150px"},
    ]

    order = Hazard.last_updated.desc().nulls_last() if Name == "desc" else Hazard.last_updated.asc().nulls_last()

    records = (
        db.query(Hazard)
        .order_by(order)
        .limit(100)
        .offset(offset)
        .all()
    )

    table_datas = []
    pageCount = page
    pages = {"page": pageCount, "row": []}

    for record in records:
        if len(pages["row"]) == 10:
            table_datas.append(pages)
            pageCount += 1
            pages = {"page": pageCount, "row": []}

        row_data = [
            # Keep a hidden ID first, like your other tables
            Cell(type="Hidden", text=str(record.id), font_weight=0, color="#000", width="0px"),

            # Match table_head order:
            Cell(type="Text", text=_fmt_dt(record.last_updated), font_weight=500, color="#000", width="150px"),
            Cell(type="Text", text=record.hazard_area, font_weight=500, color="#000", width="150px"),
            Cell(type="Text", text=(record.image_url or "-"), font_weight=500, color="#000", width="150px"),
            Cell(type="Text", text=record.hazard_type, font_weight=500, color="#000", width="150px"),

            # Action button (same style you use elsewhere)
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

    count = db.query(Hazard).count()
    return TableResponse(table_head=table_head, table_datas=table_datas, count=count)

@router.post("/lgu_profiling/manage_lgu/add_hazard", response_model=HazardOut)
def add_hazard(record: HazardCreate, db: Session = Depends(get_db)):
    db_record = Hazard(
        hazard_area=record.hazard_area,
        hazard_type=record.hazard_type,
        image_url=record.image_url,
        action=record.action,
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


    
    # --------------------Evacuation center-----------------------------
@router.get("/lgu_profiling/manage_lgu/get_evacuation", response_model=TableResponse)
def get_evacuation(
    db: Session = Depends(get_db), page: int = Query(1, ge=1), Name="desc"
):
    page = getDefaultPage(page)
    offset = (page - 1) * 10

    # ✅ Consistent widths across head + row
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
    records = (
        db.query(EvacuationCenter)
        .order_by(order)
        .limit(100)
        .offset(offset)
        .all()
    )
    table_datas = []

    pageCount = page
    pages = {"page": pageCount, "row": []}
    for record in records:
        if len(pages["row"]) == 10:
            table_datas.append(pages)
            pageCount += 1
            pages = {"page": pageCount, "row": []}

        row_data = [
            Cell(type="Hidden", text=str(record.id), font_weight=0, color="#000", width="0px"),
            Cell(type="Text", text=record.name, font_weight=500, color="#000", width="150px"),
            Cell(type="Text", text=f"{record.lat:.6f}", font_weight=500, color="#000", width="150px"),   # short lat
            Cell(type="Text", text=f"{record.lng:.6f}", font_weight=500, color="#000", width="150px"),   # short lng
            Cell(type="Text", text=str(record.capacity), font_weight=500, color="#000", width="150px"),
            Cell(type="Text", text=str(record.occupied), font_weight=500, color="#000", width="150px"),
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

    # -----Evacuation center delte when it is linked to baranggay-----------------------------
@router.get("/lgu_profiling/manage_lgu/evacuation/{record_id}/linked_barangays", response_model=dict)
def get_linked_barangays(record_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(BaranggayRecords)
          .filter(BaranggayRecords.evacucation_center_id == record_id)
          .all()
    )
    names: List[str] = [r.name for r in rows]
    return {"count": len(rows), "names": names}
@router.delete("/lgu_profiling/manage_lgu/delete_hazard/{record_id}", response_model=dict)
def delete_hazard(record_id: int, db: Session = Depends(get_db)):
    removed = delete(db, Hazard, record_id)
    if not removed:
        raise HTTPException(status_code=400, detail="Record not found.")
    return {"message": f"Hazard with ID {record_id} deleted successfully."}

@router.put("/lgu_profiling/manage_lgu/update_hazard/{record_id}", response_model=HazardOut)
def update_hazard(record_id: int, payload: HazardCreate, db: Session = Depends(get_db)):
    rec = db.get(Hazard, record_id)  # SQLAlchemy 2.x style
    if not rec:
        raise HTTPException(status_code=404, detail="Hazard record doesn't exist")

    rec.hazard_area = payload.hazard_area
    rec.hazard_type = payload.hazard_type
    rec.image_url   = payload.image_url
    rec.action      = payload.action

    db.commit()
    db.refresh(rec)
    return rec 
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


@router.delete("/lgu_profiling/manage_lgu/delete_lgu/{record_id}", response_model=dict)
def delete_lgu(record_id: int, db: Session = Depends(get_db)):
    deleted_report = delete(db, LGURecords, record_id)
    if not deleted_report:
        raise HTTPException(status_code=400, detail="Record not found.")
    return {"message": f"Record with ID {record_id} deleted successfully."}


@router.put("/lgu_profiling/manage_lgu/update_lgu/{record_id}")
def update_lgu(
    record_id: int,
    payload: LGURecordsUpdate,   db: Session = Depends(get_db),
):
    record = db.query(LGURecords).get(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Response record doesn't exist")

    # Only update provided fields (None = ignore; [] clears list fields if sent)
    updatable = [
        "name", "lat", "lng", "classification", "population",
        "contact_info", "risk_level",
        "lgu_picture", "description",
        "resources", "players", "schools", "gyms", "local_suppliers",
    ]
    for field in updatable:
        val = getattr(payload, field, None)
        if val is not None:
            setattr(record, field, val)

    db.commit()
    db.refresh(record)
    return {"detail": "Record updated succesfully", "record": record}


def find_lgu(
    q: str,
    sim_threshold: float,
    db: Session,  # plain parameter, no Depends here
):
    q_norm = q.strip()
    sim = func.similarity(LGURecords.name, q_norm).label("rank")
    stmt = select(LGURecords).where(sim > sim_threshold).order_by(sim.desc())
    results = db.execute(stmt).scalars().all()
    return results


def find_evacuation(q: str, sim_threshold: float, db: Session):
    sim = func.similarity(EvacuationCenter.name, q).label("rank")
    stmt = select(EvacuationCenter).where(sim > sim_threshold).order_by(sim.desc())
    results = db.execute(stmt).scalars().all()
    return results


@router.get("/lgu_profiling/manage_lgu/search_lgu")
def search_lgu(
    q: str,
    sim_threshold: float = Query(0.2, description="Similarity threshold (0-1)"),
    db: Session = Depends(get_db),  # FastAPI injects here
):
    return find_lgu(q=q, sim_threshold=sim_threshold, db=db)


@router.get("/lgu_profiling/manage_lgu/search_evacuation")
def search_evacuation(
    q: str,
    sim_threshold: float = Query(0.2, description="Similarity threshold (0-1)"),
    db: Session = Depends(get_db),
):
    return find_evacuation(q=q, sim_threshold=sim_threshold, db=db)


@router.post(
    "/lgu_profiling/manage_lgu/add_barangay",
    response_model=Union[BaranggayRecordsOut, ErrorResponse],
)
def add_barangay(record: BaranggayRecordsCreate, db: Session = Depends(get_db)):
    """
    Create a barangay record.
    - LGU is required and must exist (via find_lgu)
    - Evacuation center is optional; if provided, must exist (via find_evacuation)
    - population is JSON-compatible (int/dict/list)
    """
    # --- Helpers (assumes you already have these implemented elsewhere) ---
    # from utils import find_lgu, find_evacuation

    # 1) Validate LGU
    lgu_matches = find_lgu(q=record.LGU, sim_threshold=0.96, db=db)
    if not lgu_matches:
        return {"success": False, "error": f"{record.LGU} doesn't exist in LGU records"}
    lgu_id = lgu_matches[0].id  # ORM attr is `id`, DB column is lgu_id

    # 2) Validate evacuation center (optional)
    evac_id: Optional[int] = None
    evac_query = (record.evacuation or "").strip()
    if evac_query:
        evac_matches = find_evacuation(q=evac_query, sim_threshold=0.96, db=db)
        if not evac_matches:
            return {
                "success": False,
                "error": f"{record.evacuation} doesn't exist in Evacuation Center records",
            }
        evac_id = evac_matches[0].id  # ORM attr is `id`, DB column is evacuation_id

    # 3) Create DB row
    try:
        db_row = BaranggayRecords(
            name=record.name,
            lat=record.lat,
            lng=record.lng,
            lgu_id=lgu_id,
            evacucation_center_id=evac_id,
            # JSON column in model; accept int/dict/list from schema
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

    # 4) Response
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
@router.delete(
    "/lgu_profiling/manage_lgu/delete_barangay/{record_id}", response_model=dict
)
def delete_barangay(record_id: int, db: Session = Depends(get_db)):
    deleted_report = delete(db, BaranggayRecords, record_id)
    if not deleted_report:
        raise HTTPException(status_code=400, detail="Record not found.")
    return {"message": f"Record with ID {record_id} deleted successfully."}

@router.put("/lgu_profiling/manage_lgu/update_barangay/{record_id}")
def update_barangay(
    record_id: int,
    payload: BaranggayRecordsUpdate,
    db: Session = Depends(get_db),
):
    record = db.query(BaranggayRecords).get(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Response record doesn't exist")

    # 1) Basic fields (only update if provided)
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

    # 2) LGU — resolve only if provided
    if payload.LGU is not None:
        lgu = find_lgu(q=payload.LGU, sim_threshold=0.96, db=db)
        if len(lgu) <= 0:
            return {"success": False, "error": f"{payload.LGU} doesn't exist in LGU records"}
        record.lgu_id = lgu[0].id

    # 3) Evacuation — DETACH if None or "", otherwise resolve name
    if payload.evacuation is not None:
        ev = (payload.evacuation or "").strip()
        if ev == "":
            # DETACH
            record.evacucation_center_id = None
        else:
            evacuation = find_evacuation(q=ev, sim_threshold=0.96, db=db)
            if len(evacuation) <= 0:
                return {"success": False, "error": f"{ev} doesn't exist in Evacuation Center records"}
            record.evacucation_center_id = evacuation[0].id

    db.commit()
    db.refresh(record)
    return {"detail": "Record updated succesfully", "record": record}


@router.post(
    "/lgu_profiling/manage_lgu/add_evacuation", response_model=EvacuationCenterOut
)
def add_evacuation(record: EvacuationCenterCreate, db: Session = Depends(get_db)):
    db_record = EvacuationCenter(
        name=record.name,
        lat=record.lat,
        lng=record.lng,
        capacity=record.capacity,
        occupied=record.occupied or 0,   # <-- ensure default
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.delete(
    "/lgu_profiling/manage_lgu/delete_evacuation/{record_id}", response_model=dict
)
def delete_evacuation(record_id: int, db: Session = Depends(get_db)):
    # 🔍 Check if any barangay still references this evacuation center
    refs = (
        db.query(BaranggayRecords)
        .filter(BaranggayRecords.evacucation_center_id == record_id)
        .count()
    )

    if refs > 0:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete: this evacuation center is linked to one or more barangay records. Please detach or reassign first.",
        )

    # ✅ Use your delete helper
    deleted_report = delete(db, EvacuationCenter, record_id)
    if not deleted_report:
        raise HTTPException(status_code=400, detail="Record not found.")

    return {"message": f"Record with ID {record_id} deleted successfully."}

@router.put("/lgu_profiling/manage_lgu/update_evacuation/{record_id}")
def update_evacuation(
    record_id: int, payload: EvacuationCenterCreate, db: Session = Depends(get_db)
):
    record = db.query(EvacuationCenter).get(record_id)

    if not record:
        raise HTTPException(status_code=404, detail="Response record doesn't exist")
    if payload.name is not None:
        record.name = payload.name
    if payload.lat is not None:
        record.lat = payload.lat
    if payload.lng is not None:
        record.lng = payload.lng
    if payload.capacity is not None:
        record.capacity = payload.capacity
    if payload.occupied is not None:
        record.occupied = payload.occupied

    db.commit()
    db.refresh(record)

    return {"detail": "Record updated succesfully", "record": record}


# Reuse same layout as uploadedFiles.py
MEDIA_DIR = Path("media")
RAFIS_DIR = MEDIA_DIR / "rafi_pictures"
RAFIS_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_TYPES = {"jpeg", "png", "gif", "bmp", "webp", "tiff"}

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
    pic_url: str | None = None

    if rafi_pic and rafi_pic.filename:
        contents = rafi_pic.file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        kind = imghdr.what(None, h=contents)
        if kind not in ALLOWED_TYPES:
            raise HTTPException(status_code=400, detail=f"Unsupported image type: {kind}")

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

    # Return absolute URL so frontend can use it directly
    if rec.rafi_pic:
        rec.rafi_pic = _abs_media_url(request, rec.rafi_pic)

    return rec

@router.delete("/lgu_profiling/manage_lgu/delete_rafi/{record_id}", response_model=dict)
def delete_rafi(record_id: int, db: Session = Depends(get_db)):
    record = db.query(RAFIInfrastructure).filter(RAFIInfrastructure.rafi_id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="RAFI record not found.")

    db.delete(record)
    db.commit()
    return {"message": f"RAFI Infrastructure with ID {record_id} deleted successfully."}
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
    record = db.query(RAFIInfrastructure).filter(RAFIInfrastructure.rafi_id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="RAFI record doesn't exist")

    # Update simple fields
    if rafi_name is not None: record.rafi_name = rafi_name
    if lat is not None:       record.lat = lat
    if lng is not None:       record.lng = lng
    if rafi_desc is not None: record.rafi_desc = rafi_desc

    # New image? Save with a unique filename
    if rafi_pic and rafi_pic.filename:
        contents = rafi_pic.file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        kind = imghdr.what(None, h=contents)
        if kind not in ALLOWED_TYPES:
            raise HTTPException(status_code=400, detail=f"Unsupported image type: {kind}")

        ext = "jpg" if kind == "jpeg" else kind
        unique = uuid4().hex
        filename = f"{Path(rafi_pic.filename).stem}-{unique}.{ext}"
        dest = RAFIS_DIR / filename
        with open(dest, "wb") as f:
            f.write(contents)

        record.rafi_pic = f"/media/rafi_pictures/{filename}"

    db.commit()
    db.refresh(record)

    # Make returned path absolute
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