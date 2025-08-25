from os import name
from crud import delete, update
from fastapi import APIRouter, Query
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func
from data_schemas.report_schema import TableResponse, Cell
from schemas import (
    ErrorResponse,
    EvacuationCenterOut,
    EvacuationCenterCreate,
    RafiInfrastructureCreate,
    RafiInfrastructureOut,
    LGURecordsCreate,
    LGURecordsOut,
    BaranggayRecordsCreate,
    BaranggayRecordsOut,
)
from database import get_db
from crud import delete, create_evacuation_center
from models import BaranggayRecords, EvacuationCenter, RAFIInfrastructure, LGURecords
from routers.role_checker import RoleChecker
import math
from typing import Union, Dict

router = APIRouter(
    tags=["manage_lgu"],
    # dependencies=[Depends(RoleChecker(["operations admin"]))],
)


def getDefaultPage(page):
    return math.floor((page - 1) / 100) * 100 + 1


@router.get("/lgu_profiling/manage_lgu/get_lgu", response_model=TableResponse)
def get_lgu(db: Session = Depends(get_db), page: int = Query(1, ge=1), Name="desc"):

    page = getDefaultPage(page)
    offset = (page - 1) * 10
    table_head = [
        {"text": "Name", "width": "150px", "action": "Sort"},
        {"text": "Lat", "width": "150px"},
        {"text": "Lng", "width": "150px"},
        {"text": "Classification", "width": "150px"},
        {"text": "Population", "width": "150px"},
        {"text": "Contact Info", "width": "150px"},
        {"text": "Risk Level", "width": "150px"},
        {"text": "Action", "width": "150px"},
    ]
    order = LGURecords.name.desc() if Name == "desc" else LGURecords.name.asc()
    records = db.query(LGURecords).order_by(order).limit(100).offset(offset).all()
    table_datas = []
    pageCount = page
    pages = {"page": pageCount, "row": []}
    for record in records:
        if len(pages["row"]) == 10:
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
                text=str(record.lat),
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=str(record.lng),
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=str(record.classification),
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=str(record.population),
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=str(record.contact_info),
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=str(record.risk_level),
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

    count = db.query(LGURecords).count()
    return TableResponse(table_head=table_head, table_datas=table_datas, count=count)


@router.get("/lgu_profiling/manage_lgu/get_barangay", response_model=TableResponse)
def get_barangay(
    db: Session = Depends(get_db), page: int = Query(1, ge=1), Name="desc"
):
    page = getDefaultPage(page)
    offset = (page - 1) * 10
    table_head = [
        {"text": "Name", "width": "150px", "action": "Sort"},
        {"text": "Lat", "width": "150px"},
        {"text": "Lng", "width": "150px"},
        {"text": "LGU", "width": "150px"},
        {"text": "Evacuation Center", "width": "150px"},
        {"text": "Population", "width": "150px"},
        {"text": "Contact Info", "width": "150px"},
        {"text": "Risk Level", "width": "150px"},
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
        .limit(100)
        .offset(offset)
        .all()
    )

    for r in records:
        r.lgu_name = r.lgu.name if r.lgu else None
        r.evacuation_center_name = (
            r.evacucation_center.name if r.evacucation_center else None
        )
    table_datas = []
    pageCount = page
    pages = {"page": pageCount, "row": []}
    for result in records:
        print(result)
        if len(pages["row"]) == 10:
            table_datas.append(pages)
            pageCount += 100
            pages = {"page": pageCount, "row": []}

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
                text=result.name,
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=str(result.lat),
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=str(result.lng),
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=str(result.lgu_name),
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=str(result.evacuation_center_name),
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=str(result.population),
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=str(result.contact_info),
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=str(result.risk_level),
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
    count = db.query(BaranggayRecords).count()
    return TableResponse(table_head=table_head, table_datas=table_datas, count=count)


@router.get("/lgu_profiling/manage_lgu/get_rafi", response_model=TableResponse)
def get_rafi(db: Session = Depends(get_db), page: int = Query(1, ge=1), Name="desc"):
    page = getDefaultPage(page)
    offset = (page - 1) * 10
    table_head = [
        {"text": "Name", "width": "150px", "action": "Sort"},
        {"text": "Lat", "width": "150px"},
        {"text": "Lng", "width": "150px"},
        {"text": "Description", "width": "150px"},
        {"text": "Action", "width": "150px"},
    ]
    order = (
        RAFIInfrastructure.name.desc()
        if Name == "desc"
        else RAFIInfrastructure.name.asc()
    )
    records = (
        db.query(RAFIInfrastructure).order_by(order).limit(100).offset(offset).all()
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
                width="250px",
            ),
            Cell(
                type="Text",
                text=str(record.lat),
                font_weight=500,
                color="#000",
                width="250px",
            ),
            Cell(
                type="Text",
                text=str(record.lng),
                font_weight=500,
                color="#000",
                width="250px",
            ),
            Cell(
                type="Text",
                text=str(record.description),
                font_weight=500,
                color="#000",
                width="250px",
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


@router.get("/lgu_profiling/manage_lgu/get_hazard", response_model=TableResponse)
def get_hazard(db: Session = Depends(get_db), page: int = Query(1, ge=1), Name="desc"):
    table_head = [
        {"text": "Last Updated", "width": "150px", "action": "Sort"},
        {"text": "Lat", "width": "150px"},
        {"text": "Lng", "width": "150px"},
        {"text": "LGU", "width": "150px"},
        {"text": "Hazard Type", "width": "150px"},
        {"text": "Action", "width": "150px"},
    ]
    table_datas = []

    count = 0
    return TableResponse(table_head=table_head, table_datas=table_datas, count=count)


@router.get("/lgu_profiling/manage_lgu/get_evacuation", response_model=TableResponse)
def get_evacuation(
    db: Session = Depends(get_db), page: int = Query(1, ge=1), Name="desc"
):
    page = getDefaultPage(page)
    offset = (page - 1) * 10
    table_head = [
        {"text": "Name", "width": "150px", "action": "Sort"},
        {"text": "Lat", "width": "150px"},
        {"text": "Lng", "width": "150px"},
        {"text": "Capacity", "width": "150px"},
        {"text": "Action", "width": "150px"},
    ]
    order = (
        EvacuationCenter.name.desc() if Name == "desc" else EvacuationCenter.name.asc()
    )
    records = db.query(EvacuationCenter).order_by(order).limit(100).offset(offset).all()
    table_datas = []

    pageCount = page
    pages = {"page": pageCount, "row": []}
    for record in records:
        if len(pages["row"]) == 10:
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
                width="250px",
            ),
            Cell(
                type="Text",
                text=str(record.lat),
                font_weight=500,
                color="#000",
                width="250px",
            ),
            Cell(
                type="Text",
                text=str(record.lng),
                font_weight=500,
                color="#000",
                width="250px",
            ),
            Cell(
                type="Text",
                text=str(record.capacity),
                font_weight=500,
                color="#000",
                width="250px",
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
    record_id: int, payload: LGURecordsCreate, db: Session = Depends(get_db)
):
    record = db.query(LGURecords).get(record_id)

    if not record:
        raise HTTPException(status_code=404, detail="Response record doesn't exist")
    if payload.name is not None:
        record.name = payload.name
    if payload.lat is not None:
        record.lat = payload.lat
    if payload.lng is not None:
        record.lng = payload.lng
    if payload.classification is not None:
        record.classification = payload.classification
    if payload.population is not None:
        record.population = payload.population
    if payload.contact_info is not None:
        record.contact_info = payload.contact_info
    if payload.risk_level is not None:
        record.risk_level = payload.risk_level

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

    lgu = find_lgu(q=record.LGU, sim_threshold=0.96, db=db)
    print(lgu)
    if len(lgu) <= 0:
        return {"success": False, "error": f"{record.LGU} doesn't exist in LGU records"}

    evacuation = find_evacuation(q=record.evacuation, sim_threshold=0.96, db=db)
    if len(evacuation) <= 0:
        return {
            "success": False,
            "error": f"{record.evacuation} doesn't exist in Evacuation Center records",
        }
    db_record = BaranggayRecords(
        name=record.name,
        lat=record.lat,
        lng=record.lng,
        lgu_id=lgu[0].id,
        evacucation_center_id=evacuation[0].id,
        population=record.population,
        contact_info=record.contact_info,
        risk_level=record.risk_level,
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return BaranggayRecordsOut(
        id=db_record.id,
        name=db_record.name,
        lat=db_record.lat,
        lng=db_record.lng,
        lgu_id=db_record.lgu_id,
        evacucation_center_id=db_record.evacucation_center_id,
        population=db_record.population,
        contact_info=db_record.contact_info,
        risk_level=db_record.risk_level,
    )


@router.post(
    "/lgu_profiling/manage_lgu/add_evacuation", response_model=EvacuationCenterOut
)
def add_evacuation(record: EvacuationCenterCreate, db: Session = Depends(get_db)):
    db_record = EvacuationCenter(
        name=record.name, lat=record.lat, lng=record.lng, capacity=record.capacity
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.delete(
    "/lgu_profiling/manage_lgu/delete_evacuation/{record_id}", response_model=dict
)
def delete_evacuation(record_id: int, db: Session = Depends(get_db)):
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

    db.commit()
    db.refresh(record)

    return {"detail": "Record updated succesfully", "record": record}


@router.post("/lgu_profiling/manage_lgu/add_rafi", response_model=RafiInfrastructureOut)
def add_rafi(record: RafiInfrastructureCreate, db: Session = Depends(get_db)):
    db_record = RAFIInfrastructure(
        name=record.name, lat=record.lat, lng=record.lng, description=record.description
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.delete("/lgu_profiling/manage_lgu/delete_rafi/{record_id}", response_model=dict)
def delete_rafi(record_id: int, db: Session = Depends(get_db)):
    deleted_report = delete(db, RAFIInfrastructure, record_id)
    if not deleted_report:
        raise HTTPException(status_code=400, detail="Record not found.")
    return {"message": f"Record with ID {record_id} deleted successfully."}


@router.put("/lgu_profiling/manage_lgu/update_rafi/{record_id}")
def update_rafi(
    record_id: int, payload: RafiInfrastructureCreate, db: Session = Depends(get_db)
):
    record = db.query(RAFIInfrastructure).get(record_id)

    if not record:
        raise HTTPException(status_code=404, detail="Response record doesn't exist")
    if payload.name is not None:
        record.name = payload.name
    if payload.lat is not None:
        record.lat = payload.lat
    if payload.lng is not None:
        record.lng = payload.lng
    if payload.description is not None:
        record.description = payload.description

    db.commit()
    db.refresh(record)

    return {"detail": "Record updated succesfully", "record": record}
