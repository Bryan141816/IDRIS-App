from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, Literal
from datetime import datetime
from enum import Enum
from decimal import Decimal


# ==== Enums aligned with the SQLAlchemy model ====

class DonationFrequency(str, Enum):
    ONE_TIME = "ONE_TIME"
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    YEARLY = "YEARLY"


class DonationStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


# Optional helper enum for clarity (DB uses string column for kind)
class DonationType(str, Enum):
    CASH = "CASH"
    INKIND = "INKIND"


# ==== Create Schemas ====
# You can use separate create schemas (cash one-time, cash recurring, in-kind),
# mirroring your prior structure but matching the new model.

class DonationCreate(BaseModel):
    """
    One-time CASH donation (simple create).
    Matches DonationRecord with frequency=ONE_TIME and kind='cash'.
    """
    donor_id: str
    funding_id: Optional[str] = None
    frequency: Optional[DonationFrequency] = DonationFrequency.ONE_TIME
    donation_type: Optional[DonationType] = DonationType.CASH

    amount: Decimal = Field(..., description="Required for cash donations")
    description: Optional[str] = None

    payment_method: Optional[str] = None  # e.g., gcash, bank, etc.

    @field_validator("frequency")
    def frequency_must_be_one_time(cls, v):
        if v != DonationFrequency.ONE_TIME:
            raise ValueError("Use RecurringDonationCreate for recurring donations.")
        return v

    @field_validator("amount")
    def amount_required_positive(cls, v):
        if v is None or v <= 0:
            raise ValueError("amount must be a positive number for cash donations.")
        return v


class RecurringDonationCreate(BaseModel):
    """
    CASH recurring donation.
    """
    donor_id: str
    funding_id: Optional[int] = None
    frequency: DonationFrequency = DonationFrequency.MONTHLY  # MONTHLY/QUARTERLY/YEARLY
    donation_type: Optional[DonationType] = DonationType.INKIND

    amount: Decimal = Field(..., description="Required for recurring cash donations")
    description: Optional[str] = None

    next_donation_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = True

    payment_method: Optional[str] = None

    @field_validator("frequency")
    def frequency_cannot_be_one_time(cls, v):
        if v == DonationFrequency.ONE_TIME:
            raise ValueError("Recurring donations must use MONTHLY/QUARTERLY/YEARLY.")
        return v

    @field_validator("amount")
    def amount_required_positive(cls, v):
        if v is None or v <= 0:
            raise ValueError("amount must be a positive number for recurring cash donations.")
        return v


class InKindDonationCreate(BaseModel):
    """
    IN-KIND donation (one-time by default).
    """
    donor_id: str
    funding_id: Optional[str] = None
    frequency: DonationFrequency = DonationFrequency.ONE_TIME
    donation_type: DonationType = DonationType.INKIND

    description: Optional[str] = None
    item_description: str
    estimated_value: Optional[Decimal] = None
    quantity: Optional[str] = None  # e.g., "10 boxes", "5 pcs"

#     Note: amount is not used for in-kind; estimated_value is optional.


# ==== Response / Read Schemas ====

class DonationRecordBase(BaseModel):
    id: int = Field(alias="donationRecordId")
    donor_id: str
    funding_id: Optional[str] = None

    frequency: DonationFrequency
    donation_type: Optional[DonationType] = DonationType.CASH

    amount: Optional[Decimal] = None
    description: Optional[str] = None
    status: DonationStatus

    donation_date: datetime

    # In-kind fields
    item_description: Optional[str] = None
    estimated_value: Optional[Decimal] = None
    quantity: Optional[str] = None

    # Recurring fields
    next_donation_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None

    payment_method: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True


class DonationResponse(BaseModel):
    donation_id: str
    donor_id: str
    funding_id: Optional[str] = None
    frequency: DonationFrequency
    status: DonationStatus
    
    class Config:
        from_attributes = True
        populate_by_name = True


