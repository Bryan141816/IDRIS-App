from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, List, Literal, Union

from pydantic import BaseModel, Field, ConfigDict
from models import DonationType

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
    user_id: Optional[str] = None


class DonorUpdate(BaseModel):
    donor_type: Optional[DonorType] = None
    organization_name: Optional[str] = None
    is_verified: Optional[bool] = None
    user_id: Optional[str] = None


# === Response Schemas ===
class DonorResponse(BaseModel):
    donorId: str = Field(..., alias="donor_id")
    user_id: Optional[str] = None
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
    donorId: str = Field(..., alias="donor_id")
    donor_name: str 
    donor_type: DonorType
    is_verified: bool
    date_joined: datetime
    last_updated: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


class DonorAllAttributes(BaseModel):
    donorId: str = Field(..., alias="donor_id")
    user_id: Optional[str] = None
    donor_type: DonorType
    organization_name: Optional[str] = None
    is_verified: bool
    date_joined: datetime
    last_updated: datetime

    class Config:
        from_attributes = True
        populate_by_name = True
        
        
# ============================= DONOR RECEIPT SCHEMA ======================
class DonationBaseSchema(BaseModel):
    donation_id: str
    status: str
    donation_date: datetime # CORRECT: This field is a datetime

# 2. Schema for CASH donations
class DonationCashSchema(DonationBaseSchema):
    # CORRECT: The 'donation_type' field must be a Literal string, NOT datetime.
    # This is the line you need to fix.
    donation_type: Literal[DonationType.CASH.value] = Field(
        DonationType.CASH.value, const=True
    )
    amount: Decimal | None = None
    payment_method: str | None = None

# 3. Schema for INKIND donations
class DonationInKindSchema(DonationBaseSchema):
    # CORRECT: The 'donation_type' field must be a Literal string, NOT datetime.
    # This is the line you need to fix.
    donation_type: Literal[DonationType.INKIND.value] = Field(
        DonationType.INKIND.value, const=True
    )
    estimated_value: Decimal | None = None
    item_description: str | None = None
    quantity: str | None = None

# 4. The final Union model
DonationDetailSchema = Union[DonationCashSchema, DonationInKindSchema]

class UserSchema(BaseModel):
    user_id: Optional[str]
    email: Optional[str]
    username: Optional[str]

    class Config:
        orm_mode = True

class DonorDetailsSchema(BaseModel):
    donor_id: str
    user: UserSchema
    donations: List[DonationDetailSchema]

    class Config:
        orm_mode = True