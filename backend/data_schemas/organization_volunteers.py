from typing import Optional, List, Literal
from datetime import datetime
from pydantic import BaseModel, validator
from models import VolunteerStatus

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
class OrganizationVolunteerBase(BaseModel):
    user_id: str

    organization_name: str
    organization_type: str
    organization_email: str
    organization_phone_number: Optional[str] = None
    organization_address: Optional[str] = None

    contact_person_name: str
    contact_person_position: str
    contact_person_phone_number: Optional[str] = None
    contact_person_email: str

    availability: Optional[str] = None
    organization_picture: Optional[str] = None   # file path or URL
    organization_certificate: Optional[str] = None  # file path or URL

    volunteer_type: Optional[str] = "organization"
    status: Optional[VolunteerStatus] = VolunteerStatus.submitted

    @validator(
        "organization_name",
        "organization_type",
        "organization_phone_number",
        "organization_address",
        "contact_person_name",
        "contact_person_position",
        "contact_person_phone_number",
        "availability",
        "organization_picture",
        "organization_certificate",
        "volunteer_type",
        pre=True,
        always=True,
    )
    def _strip_strings(cls, v):
        if isinstance(v, str):
            v = v.strip()
            return v  # keep empty if caller intentionally sends ""
        return v

# ----------- CREATE SCHEMA -----------
class OrganizationVolunteerCreate(OrganizationVolunteerBase):
    pass

# ----------- UPDATE/PATCH SCHEMA -----------
class OrganizationVolunteerUpdate(BaseModel):
    organization_name: Optional[str] = None
    organization_type: Optional[str] = None
    organization_email: Optional[str] = None
    organization_phone_number: Optional[str] = None
    organization_address: Optional[str] = None

    contact_person_name: Optional[str] = None
    contact_person_position: Optional[str] = None
    contact_person_phone_number: Optional[str] = None
    contact_person_email: Optional[str] = None

    availability: Optional[str] = None
    organization_picture: Optional[str] = None
    organization_certificate: Optional[str] = None
    volunteer_type: Optional[str] = "organization"
    status: Optional[VolunteerStatus] = None

    @validator(
        "organization_name",
        "organization_type",
        "organization_phone_number",
        "organization_address",
        "contact_person_name",
        "contact_person_position",
        "contact_person_phone_number",
        "availability",
        "organization_picture",
        "organization_certificate",
        "volunteer_type",
        pre=True,
        always=True,
    )
    def _strip_strings(cls, v):
        if isinstance(v, str):
            v = v.strip()
            return v
        return v

# ----------- READ SCHEMA -----------
class OrganizationVolunteerRead(OrganizationVolunteerBase):
    volunteer_id: int
    created_at: datetime
    certificates: List[VolunteerCertificateRead] = []
    availability_status: Optional[VolunteerStatus] = None

    # computed counters from column_property
    tasks_joined: int = 0
    active_tasks_joined: int = 0
    events_joined: int = 0
    active_events_joined: int = 0

    class Config:
        orm_mode = True
        use_enum_values = True

class OrganizationVolunteerStatusUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    availability_status: Optional[AvailabilityStatus] = None
