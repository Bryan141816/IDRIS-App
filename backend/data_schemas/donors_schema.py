from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List, Dict

# Base Donor Schema
class DonorBase(BaseModel):
    organization_name: str
    donor_type: str
    is_verified: Optional[bool] = False

# Response Schemas
class DonorResponse(BaseModel):
    donorId: int
    user_id: Optional[int] = None
    organization_name: Optional[str] = None
    donor_type: str
    is_verified: bool = False
    date_joined: datetime

    class Config:
        from_attributes = True

class DonorListResponse(BaseModel):
    donors: List[DonorResponse]
    total: int
    skip: int
    limit: int

class DonorItem(BaseModel):
    name: str
    organization_name: Optional[str] = None
    total_donation: float
    date_joined: datetime

class ListOfDonorsResponse(BaseModel):
    donors: List[DonorItem]
    max_page: int

class DonorStatsResponse(BaseModel):
    total_donors: int
    individual_donors: int
    verified_donors: int
    unverified_donors: int

class IndividualDonorProfile(BaseModel):
    donorId: int = Field(..., alias="donorId")
    donor_name: str
    donor_type: str
    is_verified: bool
    date_joined: datetime
    last_updated: datetime
    
    class Config:
        from_attributes = True
        populate_by_name = True

class DonorAllAttributes(DonorBase):
    donorId: int
    user_id: Optional[int] = None
    is_verified: bool
    date_joined: datetime
    last_updated: datetime

    class Config:
        from_attributes = True
