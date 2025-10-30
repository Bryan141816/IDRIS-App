from crud import delete
from fastapi import APIRouter, Query
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
from crud import delete
from models import (
    ProcurementRequest,
    ProcurementRequestItem,
    User,
    BaranggayRecords,
    EvacuationCenter,
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
    request: ProcurementRequestCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(GetUserId()),
):
    admin_ids = get_logistics_admin_user_ids(db)

    PH_TZ = ZoneInfo("Asia/Manila")
    now_ph = datetime.now(PH_TZ)
    payloads = [
        {
            "to": admin_id,
            "from_origin": "procurement_management",
            "title": "A new procurement request",
            "message": "A new procurement request has been added",
            "url_redirect": "/procurement_inventory/procurement_management/requests",
            "isRead": False,
            "date": now_ph,
        }
        for admin_id in admin_ids
    ]

    # Fire-and-forget
    asyncio.create_task(send_notifications_bulk(db, payloads))
    return await ProcurementRequestCRUD.create_procurement_request(db, request, user_id)


@router.get(
    "/request_procurement/get_request", response_model=List[ProcurementRequestSchema]
)
async def get_request(
    db: Session = Depends(get_db),
    user_id: str = Depends(GetUserId()),
):

    return (
        db.query(ProcurementRequest)
        .options(joinedload(ProcurementRequest.request_items))
        .filter(ProcurementRequest.requester_id == user_id)
        .order_by(ProcurementRequest.date.desc())
        .all()
    )


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
