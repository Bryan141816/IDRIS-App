from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional


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

class User(UserBase):
    id: int
    roles: List[str]  # included when returning user data

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    roles: Optional[List[str]]  # roles can be updated optionally

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
