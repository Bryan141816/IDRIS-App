from data_schemas.procurement_management_schema import (
    ProcurementRequestCreate,
    UpdateProcurementRequest,
)
from datetime import datetime
from sqlalchemy.orm import Session
from models import ProcurementRequest, ProcurementRequestItem, User
from zoneinfo import ZoneInfo  # Python 3.9+ built-in
import asyncio
from real_time_handler import send_real_time
from typing import List

PH_TZ = ZoneInfo("Asia/Manila")


class ProcurementRequestCRUD:
    @staticmethod
    async def broadcast_procurement_event(db, requester_id: str, payload: dict):
        """Fire-and-forget broadcast to all logistics_admins except requester."""
        logistics_admins: List[User] = (
            db.query(User)
            .filter(User.roles.any("logistics admin"))
            .filter(User.user_id != requester_id)
            .all()
        )

        for admin in logistics_admins:
            # fire-and-forget
            asyncio.create_task(
                send_real_time(admin.user_id, "add_procurement_event", payload)
            )
        print("fired")

    @staticmethod
    def create_procurement_request(
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
            ProcurementRequestCRUD.broadcast_procurement_event(db, user_id, response)
        )
        return procurement_request

    @staticmethod
    def update_procurement_request(db: Session, payload: UpdateProcurementRequest):
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

        db.commit()
        db.refresh(request)
        return request
