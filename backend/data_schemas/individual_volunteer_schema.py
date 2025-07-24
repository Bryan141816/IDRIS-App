from typing import Optional
from datetime import date
from pydantic import BaseModel, EmailStr

# Shared attributes (base)
class IndividualVolunteerBase(BaseModel):
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    email: EmailStr
    phone_number: Optional[str] = None
    address: Optional[str] = None
    birthday: Optional[date] = None
    gender: Optional[str] = None
    availability: Optional[str] = None
    medical_conditions: Optional[str] = None
    described_medical_conditions: Optional[str] = None


# Schema for creation (client POST request)
class IndividualVolunteerCreate(IndividualVolunteerBase):
    user_id: int


# Schema for update (client PATCH or PUT)
class IndividualVolunteerUpdate(IndividualVolunteerBase):
    pass  # You can make fields optional here if needed


# Schema for response (return to client)
class IndividualVolunteerOut(IndividualVolunteerBase):
    volunteer_id: int
    user_id: int

    class Config:
        orm_mode = True
