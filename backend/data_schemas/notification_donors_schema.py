from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

class DonorResponse(BaseModel):
    donorId: str = Field(..., alias="donor_id")
    user_id: Optional[str] = None
    organization_name: Optional[str] = None
    donor_type: str
    is_verified: bool = False
    date_joined: datetime
    last_updated: datetime

    class Config:
        from_attributes = True
        populate_by_name = True
