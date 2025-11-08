from crud import delete
from crud_functions.procurement_manage import procurement_inventory
from fastapi import APIRouter, Query
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from data_schemas.report_schema import TableResponse, Cell
from schemas import DemandAndResponseOut, DemandAndResponseCreate
from database import get_db
from crud import delete, create_demand_and_response_record
from models import DemandAndResponse, ProcurementRequest, DistributionRoute
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import List, Dict, Any
from routers.role_checker import RoleChecker
import math
from collections import defaultdict
router = APIRouter(
    tags=["demand_and_response"],
)

router_admin = APIRouter(
    dependencies=[
        Depends(RoleChecker(["lgu officer", "superadmin", "logistics admin"]))
    ],
)


@router.get(
    "/response_dashboard/demand_and_response/get_map_pin",
    response_model=List[Dict[str, Any]],
)
def get_markers(db: Session = Depends(get_db)):

    requests = (
        db.query(ProcurementRequest)
        .filter(ProcurementRequest.routes.has(DistributionRoute.status == "Completed"))
        .options(
            joinedload(ProcurementRequest.lgu),
            joinedload(ProcurementRequest.barangay),
            joinedload(ProcurementRequest.evacuation_center),
            joinedload(ProcurementRequest.relief_items),
            joinedload(ProcurementRequest.procurement_items),
            joinedload(ProcurementRequest.routes),
        )
        .all()
    )


    grouped = defaultdict(list)

    for req in requests:
        # Determine coordinates, address, and contact info
        if req.use_different_end:
            if req.different_end_type == "barangay" and req.barangay:
                lat = req.barangay.lat
                lng = req.barangay.lng
                address = f"{req.barangay.name}, {req.lgu.lgu_name}, Cebu"
                contact_name = req.barangay.barangay_captain or "N/A"
                contact_phone = req.barangay.contact_info or "N/A"
            elif req.different_end_type == "evacuation" and req.evacuation_center:
                lat = req.evacuation_center.lat
                lng = req.evacuation_center.lng
                address = f"{req.evacuation_center.name}, {req.lgu.lgu_name}, Cebu"
                contact_name = req.barangay.barangay_captain if req.barangay else "N/A"
                contact_phone = req.barangay.contact_info if req.barangay else "N/A"
            else:
                lat = req.lgu.lat
                lng = req.lgu.lng
                address = f"{req.lgu.lgu_name}, Cebu"
                contact_name = str(req.lgu.mayor)
                contact_phone = str(req.lgu.lgu_contact)
        else:
            lat = req.lgu.lat
            lng = req.lgu.lng
            address = f"{req.lgu.lgu_name}, Cebu"
            contact_name = str(req.lgu.mayor)
            contact_phone = str(req.lgu.lgu_contact)

        # Collect needs
        items = []
        if req.relief_items:
            for item in req.relief_items:
                items.append({
                    "id": item.item_id,
                    "need": item.item_name,
                    "amount": str(item.quantity),
                    "unit": "pcs"
                })
        elif req.procurement_items:
            for item in req.procurement_items:
                items.append({
                    "id": item.item_id,
                    "need": item.item_name,
                    "amount": str(item.quantity),
                    "unit": item.unit
                })

        # Store all needed info in the grouped dict
        grouped[(lat, lng)].append({
            "request_id": req.request_id,
            "type": req.request_type,
            "items": items,
            "address": address,
            "contact_name": contact_name,
            "contact_phone": contact_phone,
            "priority": req.priority.lower() if req.priority else "medium",
            "submitted_at": req.date_requested.isoformat() if req.date_requested else None,
            "title_label": req.request_title,
            # include route updated_at
       
            "updated_at": req.routes.updated_at.isoformat() if req.routes else None

        })

    result = []
    for (lat, lng), demands in grouped.items():
        # Determine overall type
        types = {d["type"] for d in demands}
        overall_type = "both" if len(types) > 1 else types.pop()

        # Flatten needs and attach updated_at
        needs = [
            {
                "type": d["type"],
                "items": d["items"],
                "updated_at": d.get("updated_at")
            }
            for d in demands
        ]

        # Use first request's address/contact/priority/title
        first_req = demands[0]

        data = {
            "demand_id": ", ".join(str(d["request_id"]) for d in demands),
            "type": overall_type,
            "title_label": first_req["title_label"],
            "lat": lat,
            "lng": lng,
            "address": first_req["address"],
            "last_updated": datetime.now().isoformat(),
            "contact": {
                "name": first_req["contact_name"],
                "phone": first_req["contact_phone"],
            },
            "status": "completed",
            "priority": first_req["priority"],
            "submitted_at": first_req["submitted_at"],
            "needs": needs,
        }
        result.append(data)

    return result


def getDefaultPage(page):
    return math.floor((page - 1) / 100) * 100 + 1


@router_admin.get(
    "/response_dashboard/demand_and_response/list_view", response_model=TableResponse
)
def get_table(
    db: Session = Depends(get_db),
    page: int = Query(1, get=1),
    Last_Updated: str = "desc",
):
    # Table header remains the same
    page = getDefaultPage(page)
    offset = (page - 1) * 10
    table_head = [
        {"text": "Last Updated", "width": "200px", "action": "Sort"},
        {"text": "Title", "width": "250px"},
        {"text": "Address", "width": "250px"},
        {"text": "Lat", "width": "150px"},
        {"text": "Long", "width": "150px"},
        {"text": "Status", "width": "150px"},
        {"text": "Needs", "width": "400px"},
        {"text": "Priority", "width": "150px"},
        {"text": "Action", "width": "150px"},
    ]

    # Query all reports (limit if needed)
    order = (
        DemandAndResponse.last_updated.desc()
        if Last_Updated == "desc"
        else DemandAndResponse.last_updated.asc()
    )
    reports = (
        db.query(DemandAndResponse).order_by(order).limit(100).offset(offset).all()
    )

    table_datas = []
    pageCount = page
    pages = {"page": pageCount, "row": []}
    for index, report in enumerate(reports):

        if len(pages["row"]) == 10:
            table_datas.append(pages)
            pageCount += 1
            pages = {"page": pageCount, "row": []}

        needs_list = report.needs
        needs_str = ", ".join(
            [f"{need['need']} - {need['amount']}" for need in needs_list]
        )
        row_data = [
            Cell(
                type="Hidden",  # Custom type handled in frontend
                text=str(report.id),
                font_weight=0,
                color="#000",
                width="0px",
            ),
            Cell(
                type="Hidden",
                text="no-text",
                value=report.needs,
                font_weight=0,
                width="0px",
            ),
            Cell(
                type="Text",
                text=report.last_updated.strftime("%B %d, %Y"),
                font_weight=500,
                color="#000",
                width="200px",
            ),
            Cell(
                type="Text",
                text=report.title_label,
                font_weight=500,
                color="#000",
                width="250px",
            ),
            Cell(
                type="Text",
                text=report.address,
                font_weight=500,
                color="#000",
                width="250px",
            ),
            Cell(
                type="Text",
                text=str(report.lat),
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=str(report.lng),
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=report.status,
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=needs_str,
                font_weight=500,
                color="#000",
                width="400px",
            ),
            Cell(
                type="Text",
                text=report.priority,
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

    count = db.query(DemandAndResponse).count()
    return TableResponse(table_head=table_head, table_datas=table_datas, count=count)


@router_admin.post(
    "/response_dashboard/demand_and_response/add_record",
    response_model=DemandAndResponseOut,
)
def add_response_report(record: DemandAndResponseCreate, db: Session = Depends(get_db)):
    return create_demand_and_response_record(db, record)


@router_admin.delete(
    "/response_dashboard/demand_and_response/delete_record/{record_id}",
    response_model=dict,
)
def delete_response_report(record_id: int, db: Session = Depends(get_db)):
    deleted_report = delete(db, DemandAndResponse, record_id)
    if not deleted_report:
        raise HTTPException(status_code=400, detail="Response report not found.")
    return {"message": f"Response report with ID {record_id} deleted successfully."}


@router_admin.put("/response_dashboard/demand_and_response/update_record/{record_id}")
def update_report(
    record_id: int, update: DemandAndResponseCreate, db: Session = Depends(get_db)
):
    record = db.query(DemandAndResponse).get(record_id)

    if not record:
        raise HTTPException(status_code=404, detail="Response record doesn't exist")
    if update.title_label is not None:
        record.title_label = update.title_label
    if update.address is not None:
        record.address = update.address
    if update.lat is not None:
        record.lat = update.lat
    if update.lng is not None:
        record.lng = update.lng
    if update.status is not None:
        record.status = update.status
    if update.needs is not None:
        record.needs = [
            item.dict() if isinstance(item, BaseModel) else item
            for item in update.needs
        ]
    if update.priority is not None:
        record.priority = update.priority

    record.last_updated = datetime.now(timezone.utc)

    db.commit()
    db.refresh(record)

    return {"detail": "Report updated succesfully", "report": record}


router.include_router(router_admin)
