from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

class Number(BaseModel):
    count: int

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
    roles: List[str]

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    roles: Optional[List[str]]  # roles can be updated optionally

class UserSimple(BaseModel):
    id: int
    username: str
    email: str

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

class InKindMonitoringCreate(BaseModel):
    quantity: int
    record_type: str

class InKindMonitoringOut(BaseModel):
    id: int
    date_time: datetime
    quantity: int
    record_type: str

    class Config:
        from_attributes = True


class ModalityDistributionCreate(BaseModel):
    modality_type: str

class ModalityDistributionOut(BaseModel):
    id: int
    date_time: datetime
    modality_type: str

    class Config:
        from_attributes = True

class ResponseDashboardBudgetCreate(BaseModel):
    budget_record_type: str
    amount: float

class ResponseDashboardBudgetOut(BaseModel):
    id: int
    date_time: datetime
    budget_record_type: str
    amount: float
    total_amount: float

    class Config:
        from_attributes = True
