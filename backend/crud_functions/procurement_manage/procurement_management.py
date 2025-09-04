from data_schemas.procurement_management_schema import ProcurementRequestCreate
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from models import ProcurementRequest, ProcurementRequestItem


class ProcurementRequestCRUD:
    @staticmethod
    def create_procurement_request(
        db: Session, request: ProcurementRequestCreate, user_id: int
    ):
        procurement_request = ProcurementRequest(
            requester_id=user_id,
            title=request.title,
            lgu_name=request.lgu_name,
            priority=request.priority,
            description=request.description,
            justification=request.justification,
            date=datetime.now(timezone.utc),
            status="pending approval",
        )
        db.add(procurement_request)
        db.flush()
        request_items = [
            ProcurementRequestItem(
                request_id=procurement_request.request_id,
                item_name=item.name,
                quantity=item.quantity,
                price_p_each=item.unitCost,
            )
            for item in request.request_items
        ]
        db.add_all(request_items)
        db.commit()
        db.refresh(procurement_request)
        return procurement_request
