from crud import delete, update
from fastapi import APIRouter, Query
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from data_schemas.report_schema import TableResponse, Cell
from schemas import EvacuationCenterOut, EvacuationCenterCreate
from database import get_db
from crud import delete, create_evacuation_center
from models import EvacuationCenter  # no Role import datetime
from routers.role_checker import RoleChecker
import math

router = APIRouter(
    tags=["manage_lgu"],
    dependencies=[Depends(RoleChecker(["operations admin"]))],
)


def getDefaultPage(page):
    return math.floor((page - 1) / 100) * 100 + 1


@router.get("/lgu_profiling/manage_lgu/get_lgu", response_model=TableResponse)
def get_lgu(db: Session = Depends(get_db), page: int = Query(1, ge=1), Name="desc"):
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
    table_datas = []

    count = 0
    return TableResponse(table_head=table_head, table_datas=table_datas, count=count)


@router.get("/lgu_profiling/manage_lgu/get_barangay", response_model=TableResponse)
def get_barangay(
    db: Session = Depends(get_db), page: int = Query(1, ge=1), Name="desci"
):
    table_head = [
        {"text": "Name", "width": "150px", "action": "Sort"},
        {"text": "Lat", "width": "150px"},
        {"text": "Lng", "width": "150px"},
        {"text": "LGU", "width": "150px"},
        {"text": "Population", "width": "150px"},
        {"text": "Contact Info", "width": "250px"},
        {"text": "Risk Level", "width": "250px"},
        {"text": "Action", "width": "150px"},
    ]
    table_datas = []

    count = 0
    return TableResponse(table_head=table_head, table_datas=table_datas, count=count)


@router.get("/lgu_profiling/manage_lgu/get_rafi", response_model=TableResponse)
def get_rafi(db: Session = Depends(get_db), page: int = Query(1, ge=1), Name="desci"):
    table_head = [
        {"text": "Name", "width": "150px", "action": "Sort"},
        {"text": "Lat", "width": "150px"},
        {"text": "Lng", "width": "150px"},
        {"text": "Description", "width": "150px"},
        {"text": "Action", "width": "150px"},
    ]
    table_datas = []

    count = 0
    return TableResponse(table_head=table_head, table_datas=table_datas, count=count)


@router.get("/lgu_profiling/manage_lgu/get_hazard", response_model=TableResponse)
def get_hazard(db: Session = Depends(get_db), page: int = Query(1, ge=1), Name="desci"):
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
    db: Session = Depends(get_db), page: int = Query(1, ge=1), Name="desci"
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
    print(len(records))
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
def delete_budget_record(record_id: int, db: Session = Depends(get_db)):
    deleted_report = delete(db, EvacuationCenter, record_id)
    if not deleted_report:
        raise HTTPException(status_code=400, detail="Record not found.")
    return {"message": f"Record with ID {record_id} deleted successfully."}


@router.put("/lgu_profiling/manage_lgu/update_evacuation/{record_id}")
def update_budget_record(
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
