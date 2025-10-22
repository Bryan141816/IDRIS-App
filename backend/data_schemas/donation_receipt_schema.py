from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DonorDetailsSchema(BaseModel):
    donor_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None

    model_config = {"from_attributes": True}
    
class DonationDetailsSchema(BaseModel):
    donation_id: str
    donor_id: Optional[str] = None

    amount: Optional[float] = None
    donation_type: Optional[str] = None
    status: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class DonationReceiptSchema(BaseModel):
    donation: DonationDetailsSchema
    donor: DonorDetailsSchema

    class Config:
        from_attributes = True