from crud_functions.procurement_manage.procurement_inventory import (
    ProcurementInventoryCRUD,
)
import random
import string
from fastapi import APIRouter, Query, Body
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload
from database import Base, get_db
from models import (
    ProcurementRequest,
    LGURecords,
    DistributionRoute,
    DistributedItems,
    InventoryItems,
    AssignedStorage,
    DistributionRouteLogs,
    ProcurementRequestItem,
    Disbursement,
    DisbursementItem
)
from uuid import uuid4
from datetime import datetime, timedelta, timezone, time
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from routers.role_checker import RoleChecker
from fastapi import Request
from sqlalchemy import func, desc, select, literal, and_, case
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
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.inspection import inspect
router = APIRouter(
    tags=["procurement_management"],
    dependencies=[Depends(RoleChecker(["operations admin", "superadmin"]))],
)

@router.get("/procurement_management/get_dashboard_data")
def get_dashboard(db: Session = Depends(get_db)):
    counts = (
        db.query(
            func.count(ProcurementRequest.request_id).label("total"),
            func.sum(
                case((ProcurementRequest.status == "APPROVED", 1), else_=0)
            ).label("approved"),
            func.sum(
                case((ProcurementRequest.status != "APPROVED", 1), else_=0)
            ).label("not_approved"),
        )
        .one()
    )

    return {
        "total": counts.total or 0,
        "approved": counts.approved or 0,
        "pending": counts.not_approved or 0,
    } 


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

def generate_short_id(length=6):
    """Generate a random alphanumeric string of given length."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def create_disbursement_with_items(db: Session, request_data: dict, items: List[dict]):
    # Generate 6-character alphanumeric disbursement_id
    disbursement_id = generate_short_id()

    # Create the main disbursement record
    disbursement = Disbursement(
        disbursement_id=disbursement_id,
        disbursement_name=request_data.get("request_title", "No title"),
        origin_name=request_data.get("procurement", "No origin"),
        origin_id=request_data["request_id"],
    )

    # Add items
    for item_data in items:
        item = DisbursementItem(
            item_id=generate_short_id(),
            item_name=item_data.get("item_name", "Item name"),
            quantity=item_data.get("quantity", 0),
            unit=item_data.get("unit", "pcs"),
            disbursement_id=disbursement_id,
        )
        disbursement.items.append(item)

    # Add and commit
    db.add(disbursement)
    db.commit()
    db.refresh(disbursement)

    return disbursement

class Inventory(BaseModel):
    item_id: int
    assigned_id: int
    quantity_assigned: int

def to_dict(obj):
    return {c.key: getattr(obj, c.key) for c in inspect(obj).mapper.column_attrs}
@router.post("/procurement_management/approve_reject_request")
def approve_reject_request(
    db: Session = Depends(get_db),

    request_id: Optional[int] = Query(None),
    type: Optional[str] = Query(None),
):
    if request_id is None or type not in {"approve", "reject"}:
        raise HTTPException(status_code=400, detail="Invalid request_id or type")

    query = (
        db.query(ProcurementRequest)
        .filter(ProcurementRequest.request_id == request_id)
        .first()
    )
    if not query:
        raise HTTPException(status_code=404, detail="Request not found")

    try:
        # --- Create route & logs for relief requests ---
        if query.request_type == "relief":
            if not query.date_needed:
                raise HTTPException(
                    status_code=400,
                    detail="date_needed is required for relief requests",
                )

            # Make timezone-aware datetimes (UTC). Use 09:00 as a sensible delivery time; adjust to your needs.
            delivery_dt = datetime.combine(
                query.date_needed, time(9, 0, tzinfo=timezone.utc)
            )
            starting_dt = delivery_dt - timedelta(days=3)

            now = datetime.now(timezone.utc)
            if starting_dt <= now:
                starting_dt = now + timedelta(days=1)

            route = DistributionRoute( 
                route_name=query.request_ref_num,
                request_id=request_id,
                start_schedule=starting_dt,
                end_schedule=delivery_dt,
            )
            db.add(route)
            db.flush()  # ensure route_id is populated before we reference it

            log = DistributionRouteLogs(
                route_id=route.route_id,
                log_message=f"{query.request_ref_num} has been created",
            )
            db.add(log)

            # --- Apply payload updates safely ---
            # distributed = []
            # if payload:
            #     # Skip any client-side placeholders (assigned_id == -1)
            #     cleaned = [item for item in payload if item.assigned_id != -1]
            #
            #     for item in cleaned:
            #         assigned_inventory = (
            #             db.query(AssignedStorage)
            #             .options(selectinload(AssignedStorage.inventory_item))
            #             .filter(
            #                 AssignedStorage.assigned_id == item.assigned_id
            #             )  # <-- correct use
            #             .first()
            #         )
            #         if not assigned_inventory:
            #             raise HTTPException(
            #                 status_code=400,
            #                 detail=f"Assigned storage {item.assigned_id} not found",
            #             )
            #         if not assigned_inventory.inventory_item:
            #             raise HTTPException(
            #                 status_code=400,
            #                 detail=f"Inventory item for assigned {item.assigned_id} not found",
            #             )
            #
            #         # Stock validations
            #         if assigned_inventory.quantity < item.quantity_assigned:
            #             raise HTTPException(
            #                 status_code=400,
            #                 detail=f"Insufficient assigned stock for assigned_id {item.assigned_id}",
            #             )
            #         if (
            #             assigned_inventory.inventory_item.quantity
            #             < item.quantity_assigned
            #         ):
            #             raise HTTPException(
            #                 status_code=400,
            #                 detail=f"Insufficient warehouse stock for item_id {item.item_id}",
            #             )
            #
            #         assigned_inventory.quantity -= item.quantity_assigned
            #         assigned_inventory.inventory_item.quantity -= item.quantity_assigned
            #
            #         obj = DistributedItems(
            #             assigned_storage=item.assigned_id,
            #             relief_id=item.item_id,
            #             route=route.route_id,
            #             quantity=item.quantity_assigned,
            #         )
            #         distributed.append(obj)
            #
            #     if distributed:
            #         db.add_all(distributed)

        else:
            request_data = to_dict(query)
            procurement_items = db.query(ProcurementRequestItem).filter(ProcurementRequestItem.request_id == query.request_id).all()
            items = [to_dict(item) for item in procurement_items]

            create_disbursement_with_items(db, request_data, items)


        # --- Update request status ---
        if type == "approve":
            new_status = (
                "Approved"
                if query.request_type == "relief"
                else "Waiting for Budget Approval"
            )
        else:
            new_status = "Rejected"

        query.status = new_status
        db.commit()
        db.refresh(query)

        # Return a minimal, predictable response
        return {
            "request_id": query.request_id,
            "status": query.status,
            "request_type": query.request_type,
        }

    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e.__class__.__name__)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
