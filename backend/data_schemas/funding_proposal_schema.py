from datetime import datetime
from pydantic import BaseModel
from typing import  Optional, List

# Base schema shared by other versions
class FundingProposalBase(BaseModel):
    title: str
    description: str
    budgetRequired: int
    status: Optional[str] = "Active"

# Used when creating a new proposal (no ID or timestamps)
class FundingProposalCreate(FundingProposalBase):
    image: Optional[str] = None 
    
# Used when updating a proposal (all fields optional)
class FundingProposalUpdate(FundingProposalBase):
    status: Optional[str] = None
    image: Optional[str] = None 

class FundingProposalGet(FundingProposalBase):
    proposalId: int
    total_donated: float
    created_at: datetime
    updated_at: datetime
    image: Optional[str] = None 
    class Config:
        from_attributes = True 

# Used when returning data from the API
class FundingProposalResponse(FundingProposalBase):
    proposalId: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        
class FundingProposalResponsePaginated(BaseModel):
    max_page: int
    records: List[FundingProposalGet]
    
    class Config:
        from_attributes = True

class FundingPieChart(BaseModel):
    title: str
    total_donated: float