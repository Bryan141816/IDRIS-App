from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List

# Base Donor Schema
class DonorBase(BaseModel):
    organization_name: str
    donor_type: str
    is_verified: Optional[bool] = False

# Request Schemas
class IndividualDonorCreate(BaseModel):
    user_id: int
    organization_name: str
    is_verified: Optional[bool] = False

# Removed: OrganizationDonorCreate

class DonorUpdate(BaseModel):
    organization_name: Optional[str] = None
    is_verified: Optional[bool] = None

# Response Schemas
class DonorResponse(BaseModel):
    donorId: int
    user_id: Optional[int] = None
    organization_name: str
    donor_type: str
    is_verified: bool
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
    date_joined: datetime

class ListOfDonorsResponse(BaseModel):
    donors: List[DonorItem]
    total: int
    skip: int
    limit: int

class DonorStatsResponse(BaseModel):
    total_donors: int
    individual_donors: int
    verified_donors: int
    unverified_donors: int

class DonorAllAttributes(DonorBase):
    donorId: int
    user_id: Optional[int] = None
    is_verified: bool
    date_joined: datetime
    last_updated: datetime

    class Config:
        from_attributes = True
