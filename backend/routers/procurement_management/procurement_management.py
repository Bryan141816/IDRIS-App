from crud_functions.procurement_manage.procurement_inventory import (
    ProcurementInventoryCRUD,
)
from fastapi import APIRouter, Query
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import (
    ProcurementRequest,
    ProcurementRequestItem,
    Notifications,
)  # no Role import datetime
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import List, Dict, Any
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

# Dashboard Function


@router.get("/procurement_management/get_dashboard_data")
def get_request_counts(db: Session = Depends(get_db)):
    # 📊 Total requests (only approved)
    total_requests = (
        db.query(func.count(ProcurementRequest.request_id))
        .filter(func.lower(ProcurementRequest.status) == "approved")
        .scalar()
    )

    # Pending count
    total_pending = (
        db.query(func.count(ProcurementRequest.request_id))
        .filter(func.lower(ProcurementRequest.status) == "pending approval")
        .scalar()
    )

    # Approved count
    total_approved = total_requests

    # 💰 Grand total value (only approved)
    total_value = (
        db.query(
            func.sum(
                ProcurementRequestItem.quantity * ProcurementRequestItem.price_p_each
            )
        )
        .join(
            ProcurementRequest,
            ProcurementRequest.request_id == ProcurementRequestItem.request_id,
        )
        .filter(func.lower(ProcurementRequest.status) == "approved")
        .scalar()
    ) or 0.0

    # 📦 Totals per category (only approved requests)
    category_totals = (
        db.query(
            func.lower(ProcurementRequestItem.category).label("category"),
            func.sum(
                ProcurementRequestItem.quantity * ProcurementRequestItem.price_p_each
            ).label("total"),
        )
        .join(
            ProcurementRequest,
            ProcurementRequest.request_id == ProcurementRequestItem.request_id,
        )
        .filter(func.lower(ProcurementRequest.status) == "approved")
        .group_by(func.lower(ProcurementRequestItem.category))
        .all()
    )

    # Convert to dictionary for easier lookup
    category_dict = {cat.category: float(cat.total) for cat in category_totals}

    recent_notification = (
        db.query(Notifications)
        .filter(Notifications.from_origin == "procurement_management")
        .order_by(desc(Notifications.date))
        .limit(5)
        .all()
    )

    # Fixed category mapping (frontend label → db lowercase key)
    category_map = {
        "Medical Supplies": "medical supplies",
        "Equipment": "equipment",
        "Transportation": "transportation",
        "Office Supplies": "office supplies",
    }

    # 🧮 Build resource usage with percentages
    resource_usage = [
        {
            "category": label,  # frontend-friendly name
            "used": category_dict.get(db_key, 0.0),
            "percentage": (
                round((category_dict.get(db_key, 0.0) / total_value) * 100, 2)
                if total_value > 0
                else 0
            ),
        }
        for label, db_key in category_map.items()
    ]

    return {
        "total_requests": total_requests,
        "total_pending": total_pending,
        "total_approved": total_approved,
        "total_value": total_value,
        "resource_usage": resource_usage,
        "recent_notification": recent_notification,
    }


@router.post("/procurement_management/add_request")
async def add_request(
    request: ProcurementRequestCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(GetUserId()),
):
    return await ProcurementRequestCRUD.create_procurement_request(db, request, user_id)


@router.get(
    "/procurement_management/get_request", response_model=List[ProcurementRequestSchema]
)
def get_request(db: Session = Depends(get_db)):
    return (
        db.query(ProcurementRequest)
        .options(joinedload(ProcurementRequest.request_items))
        .order_by(ProcurementRequest.date.desc())
        .all()
    )


@router.post("/procurement_management/update_request")
async def update_request(
    request: UpdateProcurementRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(GetUserId()),
):
    updated_request = await ProcurementRequestCRUD.update_procurement_request(
        db, request, user_id
    )

    if not updated_request:
        return {"error": "Request not found"}

    # Access requester_id directly from the updated object
    requester_id = updated_request.requester_id
    if requester_id != user_id:
        PH_TZ = ZoneInfo("Asia/Manila")
        now_ph = datetime.now(PH_TZ)
        payload = {
            "to": str(requester_id),  # <-- here
            "from_origin": "procurement_management",
            "title": "Request status have been updated",
            "message": f"Your request  {updated_request.title}({updated_request.request_id}) is now {updated_request.status}",
            "url_redirect": "/request_procurement",
            "isRead": False,
            "date": now_ph,
        }
        await send_notification(db, payload)
    return updated_request
