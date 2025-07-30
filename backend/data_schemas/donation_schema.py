from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from enum import Enum


class DonationType(str, Enum):
    ONE_TIME = "ONE_TIME"
    RECURRING = "RECURRING"

class DonationStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class DonationCreate(BaseModel):
    donor_id: int
    donation_type: DonationType
    amount: Optional[float] = None
    description: Optional[str] = None
    proposal_id: Optional[int] = None
    donation_kind: str = "cash" 
    
    # Payment method
    payment_method: Optional[str] = None

class RecurringDonationCreate(BaseModel):
    donor_id: int
    proposal_id: int
    donation_type: DonationType = DonationType.RECURRING
    amount: float  # Required for cash donations
    description: Optional[str] = None
    recurring_frequency: str  # "monthly", "quarterly", "yearly"
    next_donation_date: Optional[datetime] = None
    recurring_end_date: Optional[datetime] = None
    payment_method: Optional[str] = None

    @field_validator("donation_type")
    def must_be_recurring(cls, v):
        if v != DonationType.RECURRING:
            raise ValueError("donation_type must be RECURRING for this schema.")
        return v
    
class InKindDonationCreate(BaseModel):
    donor_id: int
    proposal_id: int
    donation_type: DonationType
    description: Optional[str] = None
    item_description: str
    estimated_value: Optional[float] = None
    quantity: Optional[str] = None

class DonationResponse(BaseModel):
    donationRecordId: int
    donor_id: int
    donation_type: DonationType
    amount: Optional[float]
    status: DonationStatus
    donation_date: datetime

    class Config:
        from_attributes = True
