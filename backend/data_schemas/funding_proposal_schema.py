from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum

class DonationType(str, Enum):
    CASH = "cash"
    INKIND = "inkind"
    
class FundingProposalBase(BaseModel):
    title: str
    description: str
    budgetRequired: int = Field(..., alias="budget_required")
    status: Optional[str] = "Active"  # model is String(50), so plain str is fine
    image: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True


class DonationType(str, Enum):
    CASH = "cash"
    INKIND = "inkind"


class FundingProposalCreate(BaseModel):
    funding_id: str
    title: str
    description: str
    budgetRequired: int = Field(..., alias="budget_required")
    status: Optional[str] = "Active"
    image: Optional[str] = None
    starting_date: datetime
    end_date: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


class FundingProposalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    budget_required: Optional[int] = Field(None, alias="budget_required")
    status: Optional[str] = None
    image: Optional[str] = None
    starting_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    donation_type: Optional[DonationType] = None  # Optional field for updates

    class Config:
        from_attributes = True
        populate_by_name = True


# class FundingProposalGet(BaseModel):
#     funding_id_: int = Field(..., alias="funding_id")
#     title: str
#     description: str
#     budget_required: int = Field(..., alias="budget_required")
#     total_donated: float
#     created_at: datetime
#     updated_at: datetime
#     image: Optional[str] = None
#     donation_type: DonationType  # Ensure it's included in the response

#     class Config:
#         from_attributes = True
#         populate_by_name = True


# ======================
# Read / Response models
# ======================

class FundingProposalGet(BaseModel):
    funding_id_: str = Field(..., alias="funding_id")
    title: str
    description: str
    budgetRequired: int = Field(..., alias="budget_required")
    total_donated: float  # computed in query/serializer, not a DB column
    created_at: datetime
    updated_at: datetime
    image: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True


class FundingProposalResponse(BaseModel):
    funding_id: str = Field(..., alias="funding_id")
    title: str
    description: str
    budgetRequired: int = Field(..., alias="budget_required")
    status: str
    created_at: datetime
    updated_at: datetime
    starting_date: datetime
    end_date: datetime
    image: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True


class FundingProposalResponsePaginated(BaseModel):
    max_page: int
    records: List[FundingProposalGet]

    class Config:
        from_attributes = True
        populate_by_name = True


class FundingPieChart(BaseModel):
    title: str
    total_donated: float
