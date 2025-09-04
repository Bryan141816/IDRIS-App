# app/data_schemas/assignment_schema.py
from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel, validator

# ---------- helpers ----------
def _list_to_csv(v: Optional[List[str]]) -> Optional[str]:
    if v is None:
        return None
    items = [s.strip() for s in v if isinstance(s, str)]
    # dedupe, keep order
    out: List[str] = []
    for s in items:
        if s and s not in out:
            out.append(s)
    return ",".join(out) if out else None

def _csv_to_list(v: Optional[str]) -> Optional[List[str]]:
    if v is None or v == "":
        return []
    return [s.strip() for s in str(v).split(",") if s.strip()]


# ---------- TASK ----------
class TaskBase(BaseModel):
    title: str                      # UI: name
    description: Optional[str] = None
    location: Optional[str] = None
    task_date: date                 # UI: date (YYYY-MM-DD)
    max_volunteers: int
    required_skills: Optional[List[str]] = None  # list in/out

    @validator("required_skills", pre=True)
    def parse_required_skills(cls, v):
        if isinstance(v, list) or v is None:
            return v
        # CSV -> list if string provided
        return _csv_to_list(v)

class TaskCreate(TaskBase):
    # optionally let FE pass an event title; if omitted, we create one using the task's title
    event_title: Optional[str] = None
    event_description: Optional[str] = None
    event_location: Optional[str] = None
    event_date: Optional[date] = None

class TaskRead(TaskBase):
    id: int
    event_id: int
    created_at: datetime

    class Config:
        orm_mode = True


# ---------- EVENT (optional for future) ----------
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    event_date: Optional[date] = None

class EventCreate(EventBase):
    pass

class EventRead(EventBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
