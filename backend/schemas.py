from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, HttpUrl
from typing import List, Optional, Union


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
    user_type: Optional[str] = "user"  # ✅ Added
    user_role: Optional[str] = "generic"  # ✅ Added


# required on creation


class UserProfileSchema(BaseModel):
    profile_image: Optional[str] = None

    class Config:
        from_attributes = True


class UserSchema(UserBase):
    id: int
    user_id: str
    roles: List[str]
    user_type: Optional[str]
    user_profile: Optional[UserProfileSchema]

    class Config:
        from_attributes = True


# Admin User Schemas
class AdminUserProfileCreate(BaseModel):
    first_name: str
    last_name: str
    employee_idNumber: str
    department: str
    contact_number: Optional[str] = None
    position: Optional[str] = None
    employee_id: Optional[str] = None  # URL or path for ID image
    lgu_id: Optional[int] = None

    class Config:
        from_attributes = True


class AdminUserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    employee_idNumber: Optional[str] = None
    department: Optional[str] = None
    contact_number: Optional[str] = None
    position: Optional[str] = None
    employee_id: Optional[str] = None
    lgu_id: Optional[int] = None

    class Config:
        from_attributes = True


class AdminUserProfileOut(BaseModel):
    id: int
    admin_user_profile_id: str
    first_name: str
    last_name: str
    employee_idNumber: str
    department: str
    contact_number: Optional[str] = None
    position: Optional[str] = None
    employee_id: Optional[str] = None
    lgu_id: int
    user_id: str

    class Config:
        from_attributes = True


class AdminUserCreate(UserBase):
    password: str
    user_type: str = "admin"
    user_role: str = "admin"
    admin_profile: AdminUserProfileCreate  # Nested profile creation


class AdminUserSchema(UserBase):
    id: int
    user_id: str
    roles: List[str]
    user_type: Optional[str]
    is_activated: bool
    admin_user_profile: Optional[AdminUserProfileOut]

    class Config:
        from_attributes = True


class AdminActivationRequest(BaseModel):
    """Schema for admin account activation"""

    admin_user_id: str
    is_activated: bool
    approved_by: Optional[str] = None  # user_id of superadmin who approved
    activation_notes: Optional[str] = None


class TokenWithAdminResponse(BaseModel):
    """Response schema after admin login"""

    access_token: str
    token_type: str
    user: AdminUserSchema


# Emergency Response Report Schemas
class EmergencyReportSummary(BaseModel):
    totalIncidents: int
    activeIncidents: int
    completedIncidents: int
    avgResponseTime: float
    totalStaffDeployed: int
    totalResourcesDistributed: int


class EmergencyReportIncidentsByPriority(BaseModel):
    urgent: int
    high: int
    medium: int
    low: int


class EmergencyReportPerformanceMetrics(BaseModel):
    responseTimeAchieved: float
    responseTimeTarget: float
    completionRate: float
    staffUtilization: float


class EmergencyReportResponse(BaseModel):
    reportTitle: str
    dateRange: str
    generatedDate: str
    totalRecords: int
    summary: EmergencyReportSummary
    incidentsByPriority: EmergencyReportIncidentsByPriority
    resourceDistribution: dict[str, int]
    performanceMetrics: EmergencyReportPerformanceMetrics


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
    lgu_picture: Optional[str] = None
    description: Optional[str] = None
    resources: Optional[List[str]] = None
    players: Optional[List[str]] = None
    schools: Optional[List[str]] = None
    gyms: Optional[List[str]] = None
    local_suppliers: Optional[List[str]] = None

    risk_level: Optional[int] = None

    class Config:
        from_attributes = True


class BaranggayRecordsCreate(BaseModel):
    name: str
    lat: float
    lng: float
    LGU: str
    evacuation: Optional[str] = None  # ✅ allow None
    population: Union[int, dict, list]  # ✅ JSON in DB, flexible input
    contact_info: Optional[str] = None
    risk_level: Optional[str] = None

    baranggay_pic: Optional[str] = None
    baranggay_desc: Optional[str] = None  # ✅ Ensure it's included for creation
    resources: Optional[dict] = None


class BaranggayRecordsUpdate(BaseModel):
    name: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    LGU: Optional[str] = None
    evacuation: Optional[str] = None  # None or "" means DETACH
    population: Optional[Union[int, dict, list]] = None
    contact_info: Optional[str] = None
    risk_level: Optional[str] = None

    baranggay_pic: Optional[str] = None
    baranggay_desc: Optional[str] = None  # ✅ Ensure it's included for updates
    resources: Optional[dict] = None


class BaranggayRecordsOut(BaseModel):
    id: int
    name: str
    lat: float
    lng: float
    lgu_id: int
    evacucation_center_id: Optional[int] = None  # ✅ allow None
    population: Union[int, dict, list]
    contact_info: Optional[str] = None
    risk_level: Optional[str] = None

    baranggay_pic: Optional[str] = None
    baranggay_desc: Optional[str] = None  # ✅ Include in the output model
    resources: Optional[dict] = None


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
    occupied: int = 0


class EvacuationCenterOut(BaseModel):
    id: int
    name: str
    lat: float
    lng: float
    capacity: int
    occupied: int

class EvacuationCenterUpdate(BaseModel):
    # allow partial updates
    name: str | None = None
    lat: float | None = None
    lng: float | None = None
    capacity: int | None = None
    occupied: int | None = None


# ---------- Base ----------
class HazardBase(BaseModel):
    hazard_area: str
    hazard_type: str
    image_url: Optional[str] = None
    action: Optional[str] = None


# ---------- Create (LGU REQUIRED) ----------
class LGUDetailOut(BaseModel):
    id: int
    name: str
    classification: str
    population: int
    contact_info: str
    lgu_picture: Optional[str] = None  # Link to the LGU image
    description: Optional[str] = None  # Additional description
    resources: List[str] = Field(default_factory=list)
    players: List[str] = Field(default_factory=list)
    schools: List[str] = Field(default_factory=list)
    gyms: List[str] = Field(default_factory=list)
    local_suppliers: List[str] = Field(default_factory=list)

    class Config:
        orm_mode = True


class HazardCreate(HazardBase):
    # Was: lgu_id: int
    lgu_id: Optional[int] = None  # make optional or remove this line entirely


# ---------- Update (all optional, including LGU) ----------
class HazardUpdate(BaseModel):
    lgu_id: Optional[int] = None
    hazard_area: Optional[str] = None
    hazard_type: Optional[str] = None
    image_url: Optional[str] = None
    action: Optional[str] = None


# ---------- Out (include LGU + timestamps) ----------
class HazardOut(HazardBase):
    id: int
    lgu_id: int
    last_updated: Optional[datetime] = None

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

    title_label: str
    address: str
    lat: float
    lng: float
    status: str
    needs: List[NeedItem]
    priority: str


class DemandAndResponseOut(BaseModel):
    id: int
    title_label: str
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
