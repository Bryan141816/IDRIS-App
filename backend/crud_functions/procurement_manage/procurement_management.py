from data_schemas.procurement_management_schema import (
    ProcurementRequestCreate,
    UpdateProcurementRequest,
)
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc
from models import ProcurementRequest, ProcurementRequestItem, User, Notifications
from zoneinfo import ZoneInfo  # Python 3.9+ built-in
import asyncio
from real_time_handler import send_real_time
from typing import List

PH_TZ = ZoneInfo("Asia/Manila")


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
        db: Session, request: ProcurementRequestCreate, user_id: str
    ):
        # get current Philippine time
        now_ph = datetime.now(PH_TZ)

        procurement_request = ProcurementRequest(
            requester_id=user_id,
            title=request.title,
            lgu_name=request.lgu_name,
            priority=request.priority,
            description=request.description,
            justification=request.justification,
            date=now_ph,  # store full datetime with timezone
            status="pending approval",
        )

        db.add(procurement_request)
        db.flush()

        request_items = [
            ProcurementRequestItem(
                request_id=procurement_request.request_id,
                item_name=item.item_name,
                quantity=item.quantity,
                category=item.category,
                price_p_each=item.price_p_each,
            )
            for item in request.request_items
        ]

        db.add_all(request_items)
        db.commit()
        db.refresh(procurement_request)

        response = {
            "request_id": procurement_request.request_id,
            "requester_id": procurement_request.requester_id,
            "title": procurement_request.title,
            "lgu_name": procurement_request.lgu_name,
            "priority": procurement_request.priority,
            "status": procurement_request.status,
            "description": procurement_request.description,
            "justification": procurement_request.justification,
            "date": procurement_request.date.isoformat(),
            "comment": procurement_request.comment or "",
            "reason_or_code": procurement_request.reason_or_code,
            "requester": (
                {
                    "user_id": procurement_request.requester.user_id,
                    "username": procurement_request.requester.username,
                }
                if procurement_request.requester
                else None
            ),
            "request_items": [
                {
                    "item_id": item.item_id,
                    "item_name": item.item_name,
                    "category": item.category,
                    "quantity": item.quantity,
                    "price_p_each": float(item.price_p_each),
                }
                for item in procurement_request.request_items
            ],
        }
        asyncio.create_task(
            ProcurementRequestCRUD.broadcast_procurement_event(
                db, user_id, response, "add_procurement_event"
            )
        )
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
