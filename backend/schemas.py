from datetime import datetime
from pydantic import BaseModel, ConfigDict,Field
from typing import List, Optional


class ErrorResponse(BaseModel):
    success: bool
    error: str


class Number(BaseModel):
    count: int


class ID(BaseModel):
    id: str


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
    user_id: str
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
    user_id: str
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
    lgu_picture: Optional[str] = None
    description: Optional[str] = None
    resources: Optional[List[str]] = None
    players: Optional[List[str]] = None
    schools: Optional[List[str]] = None
    gyms: Optional[List[str]] = None
    local_suppliers: Optional[List[str]] = None


class LGURecordsUpdate(BaseModel):
    name: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    classification: Optional[str] = None
    population: Optional[int] = None
    contact_info: Optional[str] = None
    risk_level: Optional[str] = None
    lgu_picture: Optional[str] = None
    description: Optional[str] = None
    resources: Optional[List[str]] = None
    players: Optional[List[str]] = None
    schools: Optional[List[str]] = None
    gyms: Optional[List[str]] = None
    local_suppliers: Optional[List[str]] = None

class LGURecordsOut(BaseModel):
    id: int
    name: str
    lat: float
    lng: float
    classification: str
    population: int
    contact_info: str
    risk_level: str
    lgu_picture: Optional[str] = None
    description: Optional[str] = None
    resources: Optional[List[str]] = None
    players: Optional[List[str]] = None
    schools: Optional[List[str]] = None
    gyms: Optional[List[str]] = None
    local_suppliers: Optional[List[str]] = None

    class Config:
        from_attributes = True 


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
    rafi_name: str
    lat: float
    lng: float
    rafi_desc: Optional[str] = None
    rafi_pic: Optional[str] = None  # store URL if you’re using 2-step upload


class RafiInfrastructureUpdate(BaseModel):
    rafi_name: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    rafi_desc: Optional[str] = None
    rafi_pic: Optional[str] = None
    
class RafiInfrastructureOut(BaseModel):
    rafi_id: int
    rafi_name: str
    lat: float
    lng: float
    rafi_desc: Optional[str]
    rafi_pic: Optional[str]

    class Config:
        from_attributes = True

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
