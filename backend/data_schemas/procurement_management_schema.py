from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Literal
from datetime import date


class RequestItems(BaseModel):
    item_name: str
    category: str
    quantity: int
    price_p_each: float


class ProcurementRequestCreate(BaseModel):
    title: str
    lgu_name: str
    priority: str
    description: str
    justification: str
    request_items: List[RequestItems]


class ProcurementRequestItemSchema(BaseModel):
    item_id: int
    item_name: str
    category: str
    quantity: int
    price_p_each: float

    class Config:
        orm_mode = True


# ----------------------------
# ProcurementRequest Schema
# ----------------------------
class UserOut(BaseModel):
    user_id: str
    username: str

    class Config:
        orm_mode = True


class ProcurementRequestSchema(BaseModel):
    request_id: int
    requester_id: str
    title: str
    lgu_name: str
    priority: str  # You can switch to Literal if you want strict validation
    status: str  # Same here
    description: str
    justification: str
    date: datetime
    comment: Optional[str] = None
    reason_or_code: Optional[str] = None

    # Nested relationship
    requester: UserOut
    request_items: List[ProcurementRequestItemSchema] = []

    class Config:
        orm_mode = True


class UpdateProcurementRequest(BaseModel):
    request_id: int
    status: str
    comments: str
    send_email: bool
    reason_or_code: Optional[str] = None
