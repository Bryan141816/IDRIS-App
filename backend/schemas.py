from pydantic import BaseModel
from typing import List

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str
    roles: List[str]  # roles as list of strings

class User(UserBase):
    id: int
    roles: List[str] = []  # roles as list of strings
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
