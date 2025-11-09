from typing import Optional, List, Literal
from datetime import date, datetime
from pydantic import BaseModel, validator
from models import VolunteerStatus  # SQLAlchemy Enum (serialized via use_enum_values)

# Split the literals so application status ≠ availability status (front-end convenience)
ApplicationStatus = Literal["submitted", "verifying", "approved", "rejected"]
AvailabilityStatus = Literal["available", "unavailable", "assigned"]

class VolunteerCertificateRead(BaseModel):
    id: int
    file_name: str
    file_path: str
    mime_type: Optional[str] = None
    uploaded_at: datetime
    individual_volunteer_id: Optional[int] = None
    organization_volunteer_id: Optional[int] = None

    class Config:
        orm_mode = True

# ----------- SHARED SCHEMA -----------
class IndividualVolunteerBase(BaseModel):
    user_id: str
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    email: str
    phone_number: Optional[str] = None
    address: Optional[str] = None
    birthday: Optional[date] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    availability: Optional[str] = None
    medical_conditions: Optional[str] = None
    other_medical_conditions: Optional[str] = None
    certification: Optional[str] = None  # legacy single path
    skills: Optional[List[str]] = None   # API is a list
    status: Optional[VolunteerStatus] = VolunteerStatus.submitted

    @validator("skills", pre=True)
    def parse_skills(cls, v):
        if v is None or isinstance(v, list):
            return v
        return [s.strip() for s in str(v).split(",") if s.strip()]

# ----------- CREATE SCHEMA -----------
class IndividualVolunteerCreate(IndividualVolunteerBase):
    pass

# ----------- UPDATE SCHEMA -----------
class IndividualVolunteerUpdate(BaseModel):
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    birthday: Optional[date] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    availability: Optional[str] = None
    medical_conditions: Optional[str] = None
    other_medical_conditions: Optional[str] = None
    certification: Optional[str] = None
    skills: Optional[List[str]] = None
    status: Optional[VolunteerStatus] = None

# ----------- READ SCHEMA -----------
class IndividualVolunteerRead(IndividualVolunteerBase):
    volunteer_id: int
    created_at: datetime
    certificates: List[VolunteerCertificateRead] = []
    availability_status: Optional[VolunteerStatus] = None
    tasks_joined: int = 0
    active_tasks_joined: int = 0
    events_joined: int = 0
    active_events_joined: int = 0
    profile_image: Optional[str] = None
    distributionprogramsjoined: Optional[int] = 0
    activedistributionprograms: Optional[int] = 0
    class Config:
        orm_mode = True
        use_enum_values = True

class IndividualVolunteerStatusUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    availability_status: Optional[AvailabilityStatus] = None
