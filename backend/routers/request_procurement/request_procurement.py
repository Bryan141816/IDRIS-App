from crud import delete
from fastapi import APIRouter, Query
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload
from database import get_db
from crud import delete
from models import (
    ProcurementRequest,
    ProcurementRequestItem,
    User,
    BaranggayRecords,
    EvacuationCenter,
    AdminUserProfile,
    LGURecords,
)  # no Role import datetime
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import List, Dict, Any
from routers.role_checker import RoleChecker
import math
from fastapi import Request
from sqlalchemy import func
from zoneinfo import ZoneInfo
from data_schemas.procurement_management_schema import (
    ProcurementRequestCreate,
    ProcurementRequestSchema,
    UpdateProcurementRequest,
    ProcurementRequestCreateSchema,
)
from crud_functions.procurement_manage.procurement_management import (
    ProcurementRequestCRUD,
    UpdateProcurementRequest,
)
from sqlalchemy import select, literal, and_
from routers.GetUserId import GetUserId
from create_notification import send_notifications_bulk
import asyncio

router = APIRouter(
    tags=["request_procurement"],
    dependencies=[Depends(RoleChecker(["lgu officer", "superadmin"]))],
)


def get_logistics_admin_user_ids(db: Session):
    """
    Get all user_id values for users with the role 'logistics admin'.
    """
    users = db.query(User.user_id).filter(User.roles.any("logistics admin")).all()
    # .all() returns list of tuples, extract values
    return [u[0] for u in users]


@router.post("/request_procurement/add_request")
async def add_request(
    request: ProcurementRequestCreateSchema,
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

    lgu_id = admin.lgu.id
    return await ProcurementRequestCRUD.create_procurement_request(db, request, lgu_id)
    # admin_ids = get_logistics_admin_user_ids(db)
    #
    # PH_TZ = ZoneInfo("Asia/Manila")
    # now_ph = datetime.now(PH_TZ)
    # payloads = [
    #     {
    #         "to": admin_id,
    #         "from_origin": "procurement_management",
    #         "title": "A new procurement request",
    #         "message": "A new procurement request has been added",
    #         "url_redirect": "/procurement_inventory/procurement_management/requests",
    #         "isRead": False,
    #         "date": now_ph,
    #     }
    #     for admin_id in admin_ids
    # ]
    #
    # # Fire-and-forget
    # asyncio.create_task(send_notifications_bulk(db, payloads))
    # return await ProcurementRequestCRUD.create_procurement_request(db, request, user_id)


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


@router.get("/request_procurement/get_request")
def list_requests(
    db: Session = Depends(get_db),
    user_id: str = Depends(GetUserId()),
):
    # Find the admin and resolve their LGU
    admin = (
        db.query(AdminUserProfile)
        .options(joinedload(AdminUserProfile.lgu))
        .filter(AdminUserProfile.user_id == user_id)
        .first()
    )
    if not admin or not admin.lgu:
        raise HTTPException(status_code=404, detail="LGU not found")

    lgu_id = admin.lgu.id

    # Build the query with eager loads and LGU filter
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
        .filter(ProcurementRequest.lgu_id == lgu_id)  # ✅ constrain to admin's LGU
        .order_by(ProcurementRequest.date_requested.desc())  # optional: newest first
    )

    rows: List[ProcurementRequest] = query.all()
    return [serialize_request(r) for r in rows]


@router.get("/request_procurement/barangay_evac_list")
def barangay_evac_list(db: Session = Depends(get_db)):
    q_barangay = select(
        BaranggayRecords.id.label("id"),
        BaranggayRecords.name.label("name"),
        literal("barangay").label("type"),
    ).where(
        and_(
            BaranggayRecords.lat.isnot(None),
            BaranggayRecords.lng.isnot(None),
        )
    )

    # Evacuation centers (no filters)
    q_evac = select(
        EvacuationCenter.evacuation_id.label("id"),
        EvacuationCenter.name.label("name"),
        literal("evacuation").label("type"),
    )

    # Combine both queries (no deduping)
    q = q_barangay.union_all(q_evac).order_by("name")

    # Execute and return mappings
    rows = db.execute(q).mappings().all()
    return [dict(r) for r in rows]


#
# @router.post("/procurement_management/update_request")
# async def update_request(
#     request: UpdateProcurementRequest,
#     db: Session = Depends(get_db),
#     user_id: int = Depends(GetUserId()),
# ):
#     updated_request = ProcurementRequestCRUD.update_procurement_request(db, request)
#
#     if not updated_request:
#         return {"error": "Request not found"}
#
#     # Access requester_id directly from the updated object
#     requester_id = updated_request.requester_id
#     print(user_id)
#     if int(requester_id) != int(user_id):
#         PH_TZ = ZoneInfo("Asia/Manila")
#         now_ph = datetime.now(PH_TZ)
#         payload = {
#             "to": requester_id,  # <-- here
#             "from_origin": "procurement_management",
#             "title": "Request status have been updated",
#             "message": f"Your request  {updated_request.title}({updated_request.request_id}) is now {updated_request.status}",
#             "url_redirect": "/procurement_inventory/procurement_management",
#             "isRead": False,
#             "date": now_ph,
#         }
#         await send_notification(db, payload)
#     return updated_request
