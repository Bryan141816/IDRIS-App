from data_schemas.procurement_management_schema import (
    ProcurementRequestCreate,
    UpdateProcurementRequest,
)
from datetime import datetime
from sqlalchemy.orm import Session
from models import ProcurementRequest, ProcurementRequestItem
from zoneinfo import ZoneInfo  # Python 3.9+ built-in

PH_TZ = ZoneInfo("Asia/Manila")


class ProcurementRequestCRUD:
    @staticmethod
    def create_procurement_request(
        db: Session, request: ProcurementRequestCreate, user_id: int
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
