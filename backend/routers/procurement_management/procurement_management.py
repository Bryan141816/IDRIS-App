from crud_functions.procurement_manage.procurement_inventory import (
    ProcurementInventoryCRUD,
)
from fastapi import APIRouter, Query
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload
from database import get_db
from models import ProcurementRequest, LGURecords  # no Role import datetime
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from routers.role_checker import RoleChecker
from fastapi import Request
from sqlalchemy import func, desc, select, literal, and_
from zoneinfo import ZoneInfo
from data_schemas.procurement_management_schema import (
    ProcurementRequestCreate,
    ProcurementRequestSchema,
    UpdateProcurementRequest,
)
from crud_functions.procurement_manage.procurement_management import (
    ProcurementRequestCRUD,
    UpdateProcurementRequest,
)
from routers.GetUserId import GetUserId
from create_notification import send_notification

router = APIRouter(
    tags=["procurement_management"],
    dependencies=[Depends(RoleChecker(["operations admin", "superadmin"]))],
)


def serialize_request(r: ProcurementRequest) -> dict:
    # ---- end target ----
    end_target = None
    if r.use_different_end:
        t = (r.different_end_type or "").strip().lower()
        if t == "barangay" and r.barangay:
            end_target = {
                "type": "barangay",
                "id": r.barangay.id,
                "name": r.barangay.name,
                "lat": r.barangay.lat,
                "lng": r.barangay.lng,
            }
        elif t in {"evac", "evacuation", "evacuation_center"} and r.evacuation_center:
            end_target = {
                "type": "evacuation",
                "id": r.evacuation_center.evacuation_id,
                "name": r.evacuation_center.name,
                "lat": r.evacuation_center.lat,
                "lng": r.evacuation_center.lng,
                "capacity": r.evacuation_center.capacity,
                "occupied": r.evacuation_center.occupied,
            }
        else:
            # Flag was set but no matching/linked record
            end_target = {"type": None}

    # ---- items ----
    rtype = (r.request_type or "").strip().lower()
    if rtype == "relief":
        item_source = "relief"
        items = [
            {
                "item_id": i.item_id,
                "name": i.item_name,
                "category": i.category,
                "quantity": i.quantity,
            }
            for i in (r.relief_items or [])
        ]
    else:
        item_source = "procurement"
        items = [
            {
                "item_id": i.item_id,
                "name": i.item_name,
                "quantity": i.quantity,
                "unit": i.unit,
            }
            for i in (r.procurement_items or [])
        ]

    return {
        "request_id": r.request_id,
        "lgu": {
            "id": r.lgu.id if r.lgu else None,
            "name": r.lgu.lgu_name if r.lgu else None,
        },
        "request_type": r.request_type,
        "request_ref_num": r.request_ref_num,
        "request_title": r.request_title,
        "request_description": r.request_description,
        "status": r.status,
        "priority": r.priority,
        "date_requested": r.date_requested.isoformat() if r.date_requested else None,
        "disaster_type": r.disaster_type,
        "date_needed": r.date_needed.isoformat() if r.date_needed else None,
        "use_different_end": r.use_different_end,
        "different_end_type": r.different_end_type,
        "end_target": end_target,  # <- conditional block above
        "fallback_end": {
            "end_address": r.end_address,
            "end_lat": r.end_lat,
            "end_long": r.end_long,
        },  # keep raw fields in case you still need them
        "items_source": item_source,  # "relief" | "procurement"
        "items": items,  # <- list of the retrieved items
    }


@router.get("/procurement_management/get_request")
def get_request(db: Session = Depends(get_db)):
    query = (
        db.query(ProcurementRequest)
        .options(
            joinedload(ProcurementRequest.lgu).load_only(
                LGURecords.id, LGURecords.lgu_name
            ),
            joinedload(ProcurementRequest.barangay),  # end target (barangay)
            joinedload(ProcurementRequest.evacuation_center),  # end target (evac)
            selectinload(ProcurementRequest.relief_items),  # items (relief)
            selectinload(ProcurementRequest.procurement_items),  # items (procurement)
        )
        .order_by(ProcurementRequest.date_requested.desc())  # optional: newest first
    )

    rows: List[ProcurementRequest] = query.all()
    return [serialize_request(r) for r in rows]


@router.post("/procurement_management/approve_reject_request")
def approve_reject_request(
    db: Session = Depends(get_db),
    request_id: Optional[int] = Query(None),
    type: Optional[str] = Query(None),
):
    print(request_id)
    print(type)

    query = (
        db.query(ProcurementRequest)
        .filter(ProcurementRequest.request_id == request_id)
        .first()
    )
    new_status = None
    if type == "approve":
        if query.request_type == "relief":
            new_status = "Approved"
        else:
            new_status = "Waiting for Budget Approval"
    else:
        new_status = "Rejected"
    query.status = new_status
    db.commit()
    return query
