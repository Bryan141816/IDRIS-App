from typing import List, Optional, Literal
from datetime import date, datetime
from pydantic import BaseModel, validator, Field

# ---------- helpers ----------
def _csv_to_list(v: Optional[str]) -> List[str]:
    if v is None or v == "":
        return []
    return [s.strip() for s in str(v).split(",") if s.strip()]

# ---------- ENUM (as literals for API I/O) ----------
AssignmentStatusLiteral = Literal[
    "applied", "invited", "accepted", "declined",
    "waitlisted", "checked_in", "no_show", "completed", "cancelled"
]

TaskLifecycleLiteral = Literal["incoming", "ongoing", "finished"]

# ---------- ASSIGNMENT (MOVE THIS BEFORE TASK) ----------
class AssignmentBase(BaseModel):
    individual_volunteer_id: Optional[int] = None
    organization_volunteer_id: Optional[int] = None
    volunteer_count: Optional[int] = Field(default=1, ge=1)
    status: AssignmentStatusLiteral = "accepted"
    notes: Optional[str] = None

    @validator("organization_volunteer_id")
    def xor_owner(cls, ov_id, values):
        iv_id = values.get("individual_volunteer_id")
        if (iv_id is None and ov_id is None) or (iv_id is not None and ov_id is not None):
            raise ValueError("Specify exactly one owner: individual OR organization")
        return ov_id

    @validator("volunteer_count")
    def validate_volunteer_count(cls, v, values):
        iv_id = values.get("individual_volunteer_id")
        ov_id = values.get("organization_volunteer_id")

        if iv_id is not None and v != 1:
            return 1

        if ov_id is not None and (v is None or v < 1):
            raise ValueError("Organization volunteer count must be at least 1")

        return v

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentStatusUpdate(BaseModel):
    status: AssignmentStatusLiteral

class AssignmentRead(BaseModel):
    id: int
    task_id: int
    individual_volunteer_id: Optional[int] = None
    organization_volunteer_id: Optional[int] = None
    volunteer_count: Optional[int] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

# ---------- TASK ----------
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    start_at: datetime
    end_at: datetime
    max_volunteers: int
    required_skills: Optional[List[str]] = None

    @validator("required_skills", pre=True)
    def parse_required_skills(cls, v):
        if isinstance(v, list) or v is None:
            return v
        return _csv_to_list(v)

    @validator("end_at")
    def validate_time_order(cls, v, values):
        start = values.get("start_at")
        if start and v <= start:
            raise ValueError("end_at must be strictly later than start_at")
        return v

class TaskCreate(TaskBase):
    event_title: Optional[str] = None
    event_description: Optional[str] = None
    event_location: Optional[str] = None
    event_date: Optional[date] = None

class TaskRead(TaskBase):
    id: int
    event_id: int
    created_at: datetime
    lifecycle: TaskLifecycleLiteral
    current_count: int = 0
    assigned_volunteer_ids: List[int] = []

    class Config:
        orm_mode = True

class TaskReadWithStats(TaskBase):
    id: int
    event_id: int
    created_at: datetime
    lifecycle: TaskLifecycleLiteral
    current_count: int = 0
    slot_count: int = 0
    is_full: bool = False
    assigned_volunteer_ids: List[int] = []
    assignments: List[AssignmentRead] = []  # ✅ Now AssignmentRead is defined

    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

# ---------- EVENT ----------
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
