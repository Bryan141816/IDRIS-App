from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

# ----------- SHARED SCHEMA -----------
class OrganizationVolunteerBase(BaseModel):
    user_id: int

    organization_name: str
    organization_type: str
    organization_email: str
    organization_phone_number: Optional[str] = None
    organization_address: Optional[str] = None

    contact_person_name: str
    contact_person_position: str
    contact_person_phone_number: Optional[str] = None
    contact_person_email: str

    availability: Optional[str] = None  # keep as string (e.g., "Mon, Tue") to match DB
    organization_picture: Optional[str] = None  # URL or file path

    # DB column is "organiztion_certificate" (typo). Expose clean alias "organization_certificate".
    organiztion_certificate: Optional[str] = Field(
        default=None, alias="organization_certificate"
    )

    class Config:
        orm_mode = True
        # allow clients to send either "organization_certificate" (alias) or "organiztion_certificate"
        allow_population_by_field_name = True


# ----------- CREATE SCHEMA -----------
class OrganizationVolunteerCreate(OrganizationVolunteerBase):
    # same as base; server fills created_at
    pass


# ----------- UPDATE SCHEMA -----------
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

    # accept alias from clients; maps to model's "organiztion_certificate"
    organiztion_certificate: Optional[str] = Field(
        default=None, alias="organization_certificate"
    )

    class Config:
        orm_mode = True
        allow_population_by_field_name = True


# ----------- READ SCHEMA -----------
class OrganizationVolunteerRead(OrganizationVolunteerBase):
    volunteer_id: int
    created_at: datetime

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
