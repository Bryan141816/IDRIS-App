from pydantic import BaseModel
from typing import Optional
from datetime import date

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

# ----------- CREATE SCHEMA -----------
class IndividualVolunteerCreate(IndividualVolunteerBase):
    pass  # same as base for now, but you can add create-specific fields later

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

# ----------- READ SCHEMA -----------
class IndividualVolunteerRead(IndividualVolunteerBase):
    volunteer_id: int

    class Config:
        orm_mode = True
