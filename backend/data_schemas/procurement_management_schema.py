from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
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


class RequestItemSchema(BaseModel):
    name: str = Field(..., description="Item or supply name")
    category: Optional[str] = Field(None, description="Item category (for relief type)")
    quantity: int = Field(..., ge=0, description="Quantity requested")
    unit: Optional[str] = Field(
        None, description="Unit of measure (for procurement type)"
    )


class ProcurementRequestCreateSchema(BaseModel):
    request_type: str = Field(
        ..., pattern="^(relief|procurement)$", description="Type of request"
    )
    use_different_end: bool = Field(
        ..., description="Whether to use a different delivery location"
    )

    request_title: str
    request_description: str
    disaster_type: str
    priority: str
    date_needed: date

    # Endpoints (barangay / evacuation)
    end_barangay: Optional[int] = Field(
        -1, description="Barangay ID or -1 if not selected"
    )
    end_evacuation: Optional[int] = Field(
        -1, description="Evacuation center ID or -1 if not selected"
    )

    # Nested list of requested items
    request_items: List[RequestItemSchema]


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
    request_items: List[RequestItemSchema] = []

    class Config:
        orm_mode = True


class UpdateProcurementRequest(BaseModel):
    request_id: int
    status: str
    comments: str
    send_email: bool
    reason_or_code: Optional[str] = None
