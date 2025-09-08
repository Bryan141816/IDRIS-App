from crud import delete
from fastapi import APIRouter, Query
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
from crud import delete
from models import ProcurementRequest, ProcurementRequestItem  # no Role import datetime
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
from routers.GetUserId import GetUserId
from create_notification import send_notification

router = APIRouter(
    tags=["request_procurement"],
    dependencies=[Depends(RoleChecker(["lgu officer"]))],
)


@router.post("/request_procurement/add_request")
def add_request(
    request: ProcurementRequestCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(GetUserId()),
):
    print(user_id)
    return ProcurementRequestCRUD.create_procurement_request(db, request, user_id)


@router.get(
    "/request_procurement/get_request", response_model=List[ProcurementRequestSchema]
)
def get_request(
    db: Session = Depends(get_db),
    user_id: int = Depends(GetUserId()),
):
    return (
        db.query(ProcurementRequest)
        .options(joinedload(ProcurementRequest.request_items))
        .filter(ProcurementRequest.requester_id == user_id)
        .all()
    )


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
