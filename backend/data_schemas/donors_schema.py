from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, List

from pydantic import BaseModel, Field


# === Enums aligned to model ===
class DonorType(str, Enum):
    INDIVIDUAL = "individual"
    ORGANIZATION = "organization"


# === Base / Create / Update ===
class DonorBase(BaseModel):
    donor_type: DonorType
    organization_name: Optional[str] = None  # nullable in model
    is_verified: Optional[bool] = False


class DonorCreate(DonorBase):
    # user_id is optional in the model; include here if you create donors tied to users
    user_id: Optional[int] = None


class DonorUpdate(BaseModel):
    donor_type: Optional[DonorType] = None
    organization_name: Optional[str] = None
    is_verified: Optional[bool] = None
    user_id: Optional[int] = None


# === Response Schemas ===
class DonorResponse(BaseModel):
    donorId: int = Field(..., alias="id")
    user_id: Optional[int] = None
    organization_name: Optional[str] = None
    donor_type: DonorType
    is_verified: bool = False
    date_joined: datetime
    last_updated: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


class DonorListResponse(BaseModel):
    donors: List[DonorResponse]
    total: int
    skip: int
    limit: int


class DonorItem(BaseModel):
    # Present the computed property `donor_name` from the ORM as `name`
    name: str = Field(..., alias="donor_name")
    organization_name: Optional[str] = None
    total_donation: Decimal  # use Decimal to mirror Numeric(10,2); change to float if preferred
    date_joined: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


class ListOfDonorsResponse(BaseModel):
    donors: List[DonorItem]
    max_page: int


class DonorStatsResponse(BaseModel):
    total_donors: int
    individual_donors: int
    verified_donors: int
    unverified_donors: int


class IndividualDonorProfile(BaseModel):
    donorId: int = Field(..., alias="id")
    donor_name: str  # comes from Donor.donor_name @property
    donor_type: DonorType
    is_verified: bool
    date_joined: datetime
    last_updated: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


class DonorAllAttributes(BaseModel):
    donorId: int = Field(..., alias="id")
    user_id: Optional[int] = None
    donor_type: DonorType
    organization_name: Optional[str] = None
    is_verified: bool
    date_joined: datetime
    last_updated: datetime

    class Config:
        from_attributes = True
        populate_by_name = True
