from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel

# ---------- USER PROFILE ----------

class UserProfileRead(BaseModel):
    id: int
    user_profile_id: str
    first_name: str
    last_name: str
    profile_image: Optional[str] = None
    phone_number: Optional[str] = None
    bday: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    bio: Optional[str] = None
    user_id: str

    class Config:
        orm_mode = True  # allows direct return of SQLAlchemy objects
