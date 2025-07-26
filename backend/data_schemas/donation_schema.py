from pydantic import BaseModel, Field
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

class DonationResponse(BaseModel):
    donationRecordId: int
    donor_id: int
    donation_type: DonationType
    amount: Optional[float]
    status: DonationStatus
    donation_date: datetime

    class Config:
        orm_mode = True
