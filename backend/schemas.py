from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

class LoginSchema(BaseModel):
    email: str
    password: str
class UserBase(BaseModel):
    username: str
    email: str
    user_type: str

class UserCreate(UserBase):
    password: str
    roles: List[str]  # required on creation

class UserSchema(UserBase):
    id: int
    roles: List[str]  # included when returning user data

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    roles: Optional[List[str]]  # roles can be updated optionally

class Token(BaseModel):
    access_token: str


class ResponseReportCreate(BaseModel):
    report_type: str
    status: str

class ResponseReportOut(BaseModel):
    id: int
    date_time: datetime
    report_type: str
    status: str

    class Config:
        from_attributes = True

# FUNDING PROPOSALS MODEL SCHEMA
# Base schema shared by other versions
class FundingProposalBase(BaseModel):
    title: str
    description: str
    progress: int = 0  
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


# DONORS TABLE SCHEMA
# Base Donor Schema
class DonorBase(BaseModel):
    name: str
    donor_type: str
    is_verified: Optional[bool] = False

# Request Schemas
class IndividualDonorCreate(BaseModel):
    user_id: int
    name: str
    is_verified: Optional[bool] = False

class OrganizationDonorCreate(BaseModel):
    organization_id: int
    name: str
    is_verified: Optional[bool] = False

class DonorUpdate(BaseModel):
    name: Optional[str] = None
    is_verified: Optional[bool] = None

# Response Schemas
class DonorResponse(BaseModel):
    donorId: int
    user_id: Optional[int] = None
    organization_id: Optional[int] = None
    name: str
    donor_type: str
    is_verified: bool

    class Config:
        from_attributes = True

class DonorListResponse(BaseModel):
    donors: List[DonorResponse]
    total: int
    skip: int
    limit: int

class DonorStatsResponse(BaseModel):
    total_donors: int
    individual_donors: int
    organization_donors: int
    verified_donors: int
    unverified_donors: int

class DonorAllAttributes(DonorBase):
    donorId: int
    user_id: Optional[int] = None
    organization_id: Optional[int] = None
    is_verified: bool
    date_joined: datetime
    last_updated: datetime
    
    class Config:
        from_attributes = True