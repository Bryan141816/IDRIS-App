from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

# ======================
# Base / Create / Update
# ======================

class FundingProposalBase(BaseModel):
    title: str
    description: str
    budgetRequired: int = Field(..., alias="budget_required")
    status: Optional[str] = "Active"  # model is String(50), so plain str is fine
    image: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True


class FundingProposalCreate(BaseModel):
    funding_id: int
    title: str
    description: str
    budgetRequired: int = Field(..., alias="budget_required")
    status: Optional[str] = "Active"
    image: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True


class FundingProposalUpdate(BaseModel):
    # All optional for PATCH/PUT semantics
    title: Optional[str] = None
    description: Optional[str] = None
    budgetRequired: Optional[int] = Field(None, alias="budget_required")
    status: Optional[str] = None
    image: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True


# ======================
# Read / Response models
# ======================

class FundingProposalGet(BaseModel):
    funding_id_: int = Field(..., alias="funding_id")
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
    funding_id: int = Field(..., alias="id")
    title: str
    description: str
    budgetRequired: int = Field(..., alias="budget_required")
    status: str
    created_at: datetime
    updated_at: datetime
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
