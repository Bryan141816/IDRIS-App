from data_schemas.procurement_management_schema import (
    ProcurementRequestCreate,
    UpdateProcurementRequest,
    ProcurementRequestCreateSchema,
)
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc
from models import (
    ProcurementRequest,
    ProcurementRequestItem,
    User,
    Notifications,
    ReliefRequestItem,
    ProcurementRequestItem,
)
from zoneinfo import ZoneInfo  # Python 3.9+ built-in
import asyncio
from real_time_handler import send_real_time
from typing import List

PH_TZ = ZoneInfo("Asia/Manila")

from datetime import date, datetime, timedelta, timezone


class ProcurementRequestCRUD:

    @staticmethod
    async def broadcast_procurement_event(
        db, requester_id: str, payload: dict, event_type: str
    ):
        """
        Fire-and-forget broadcast to all logistics_admins except requester.
        For update events, also include the original requester.
        """
        logistics_admins_query = db.query(User).filter(
            User.roles.any("logistics admin")
        )

        if event_type == "add_procurement_event":
            # All logistics admins except the one who made the request
            logistics_admins = logistics_admins_query.filter(
                User.user_id != requester_id
            ).all()

        elif event_type == "update_procurement_event":
            # All logistics admins except the one performing the update
            logistics_admins = logistics_admins_query.filter(
                User.user_id != requester_id
            ).all()

            # Also include the original requester explicitly (even if not logistics admin)
            requester_user = (
                db.query(User).filter(User.user_id == payload["requester_id"]).first()
            )
            if requester_user and requester_user.user_id not in [
                u.user_id for u in logistics_admins
            ]:
                logistics_admins.append(requester_user)

        else:
            logistics_admins = []

        # Fire events
        for admin in logistics_admins:
            asyncio.create_task(send_real_time(admin.user_id, event_type, payload))
        print(payload["requester_id"])

    @staticmethod
    async def create_procurement_request(
        db: Session, request: ProcurementRequestCreateSchema, lgu_id: int
    ):
        # get current Philippine time
        now = datetime.now(timezone.utc)
        formatted = f"{now.month}{now.day}{str(now.year)[-2:]}"

        # Hour + minute, then format to 3 digits (trim if > 999)
        sum_hm = now.hour + now.minute + now.second
        hm_str = str(sum_hm).zfill(3)[-3:]  # pad to 3, trim if longer

        # Combine
        formatted += hm_str
        use_different_end = False
        different_end_type = None
        end_barangay = None
        end_evac = None
        if not request.end_barangay == -1:
            use_different_end = True
            different_end_type = "barangay"
            end_barangay = request.end_barangay

        if not request.end_evacuation == -1:
            use_different_end = True
            different_end_type = "evacuation"
            end_evac = request.end_evacuation
        procurement_request = ProcurementRequest(
            lgu_id=lgu_id,
            request_type=request.request_type,
            request_ref_num=f"REF{formatted}",
            request_title=request.request_title,
            request_description=request.request_description,
            use_different_end=use_different_end,
            different_end_type=different_end_type,
            priority=request.priority,
            end_barangay=end_barangay,
            end_evac=end_evac,
            date_requested=now,
            disaster_type=request.disaster_type,
            date_needed=request.date_needed,
        )

        db.add(procurement_request)
        db.flush()
        if request.request_type == "relief":
            request_item = [
                ReliefRequestItem(
                    request_id=procurement_request.request_id,
                    item_name=item.name,
                    category=item.category,
                    quantity=item.quantity,
                    unit=item.unit
                )
                for item in request.request_items
            ]
            db.add_all(request_item)
        else:
            request_items = [
                ProcurementRequestItem(
                    request_id=procurement_request.request_id,
                    item_name=item.name,
                    quantity=item.quantity,
                    unit=item.unit,
                )
                for item in request.request_items
            ]

            db.add_all(request_items)
        db.commit()
        db.refresh(procurement_request)

        return procurement_request

    @staticmethod
    async def update_procurement_request(
        db: Session, payload: UpdateProcurementRequest, user_id: str
    ):
        request = (
            db.query(ProcurementRequest)
            .filter(ProcurementRequest.request_id == payload.request_id)
            .first()
        )

        if not request:
            return None  # caller can handle 404
        if payload.status is not None:
            request.status = payload.status
        if payload.comments is not None:
            request.comment = payload.comments
        if payload.reason_or_code is not None:
            request.reason_or_code = payload.reason_or_code

        data = {
            "request_id": request.request_id,
            "status": request.status,
            "comments": request.comment,
            "reason_or_code": request.reason_or_code,
            "requester_id": request.requester_id,
        }
        asyncio.create_task(
            ProcurementRequestCRUD.broadcast_procurement_event(
                db, user_id, data, "update_procurement_event"
            )
        )
        db.commit()
        db.refresh(request)
        return request
