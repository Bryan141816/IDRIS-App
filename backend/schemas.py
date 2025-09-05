from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import List, Optional


class ErrorResponse(BaseModel):
    success: bool
    error: str


class Number(BaseModel):
    count: int


class ID(BaseModel):
    id: int


class LoginSchema(BaseModel):
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    password: str
    token: str


class UserBase(BaseModel):
    username: str
    email: str


class UserCreate(UserBase):
    password: Optional[str]


# required on creation


class UserSchema(UserBase):
    id: int
    roles: List[str]
    user_type: Optional[str]

    class Config:
        from_attributes = True


class TokenWithUserResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserSchema


class UserUpdate(BaseModel):
    roles: Optional[List[str]]  # roles can be updated optionally


class UserSimple(BaseModel):
    user_id: int
    username: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str


class LGURecordsCreate(BaseModel):
    name: str
    lat: float
    lng: float
    classification: str
    population: int
    contact_info: str
    risk_level: str


class LGURecordsOut(BaseModel):
    id: int
    name: str
    lat: float
    lng: float
    classification: str
    population: int
    contact_info: str
    risk_level: str


class BaranggayRecordsCreate(BaseModel):
    name: str
    lat: float
    lng: float
    LGU: str
    evacuation: str
    population: int
    contact_info: str
    risk_level: str


class BaranggayRecordsOut(BaseModel):
    id: int
    name: str
    lat: float
    lng: float
    lgu_id: int
    evacucation_center_id: int
    population: int
    contact_info: str
    risk_level: str


class RafiInfrastructureCreate(BaseModel):
    name: str
    lat: float
    lng: float
    description: str


class RafiInfrastructureOut(BaseModel):
    id: int
    name: str
    lat: float
    lng: float
    description: str


class EvacuationCenterCreate(BaseModel):
    name: str
    lat: float
    lng: float
    capacity: int


class EvacuationCenterOut(BaseModel):
    id: int
    name: str
    lat: float
    lng: float
    capacity: int


class HazardBase(BaseModel):
    hazard_area: str
    hazard_type: str
    image_url: str | None = None
    action: str | None = None

class HazardCreate(HazardBase):
    pass

class HazardOut(HazardBase):
    id: int
    last_updated: datetime | None = None

    class Config:
        from_attributes = True
        
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


class NeedItem(BaseModel):
    id: int
    need: str
    amount: str


class DemandAndResponseCreate(BaseModel):
    title_lable: str
    address: str
    lat: float
    lng: float
    status: str
    needs: List[NeedItem]
    priority: str


class DemandAndResponseOut(BaseModel):
    id: int
    title_lable: str
    address: str
    lat: float
    lng: float
    status: str
    needs: List[NeedItem]
    priority: str
    submitted_at: datetime
    last_updated: datetime

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
