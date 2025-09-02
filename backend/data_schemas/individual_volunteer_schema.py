from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, validator
from models import VolunteerStatus
from typing import Literal

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
    user_id: int
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
    certification: Optional[str] = None  # file path or filename
    skills: Optional[List[str]] = None   # API is a list
    status: Optional[VolunteerStatus] = VolunteerStatus.submitted
    # Accept list from clients, but also convert DB CSV string -> list on read
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
    class Config:
        orm_mode = True

class IndividualVolunteerStatusUpdate(BaseModel):
    status: Literal['pending','approved','rejected','submitted','verifying']
