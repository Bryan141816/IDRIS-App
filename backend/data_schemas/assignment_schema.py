from typing import List, Optional, Literal
from datetime import date, datetime
from pydantic import BaseModel, validator

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

# ---------- TASK ----------
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None

    # required by your SQLAlchemy model (nullable=False)
    start_at: datetime
    end_at: datetime

    max_volunteers: int
    required_skills: Optional[List[str]] = None  # list in/out

    @validator("required_skills", pre=True)
    def parse_required_skills(cls, v):
        # accept CSV from DB or list from client
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
    # FE may pass an event context; otherwise Event title = task title
    event_title: Optional[str] = None
    event_description: Optional[str] = None
    event_location: Optional[str] = None
    # your Event.event_date is a DATE
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
    current_count: int = 0                # UI headcount (applied..completed)
    slot_count: int = 0                   # counts statuses occupying slots (accepted, checked_in)
    is_full: bool = False
    assigned_volunteer_ids: List[int] = []

    class Config:
        orm_mode = True

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

# ---------- ASSIGNMENT ----------
class AssignmentBase(BaseModel):
    task_id: int
    individual_volunteer_id: Optional[int] = None
    organization_volunteer_id: Optional[int] = None
    status: AssignmentStatusLiteral = "accepted"
    notes: Optional[str] = None

    @validator("organization_volunteer_id")
    def xor_owner(cls, ov_id, values):
        iv_id = values.get("individual_volunteer_id")
        # XOR: exactly one of the two must be set
        if (iv_id is None and ov_id is None) or (iv_id is not None and ov_id is not None):
            raise ValueError("Specify exactly one owner: individual OR organization")
        return ov_id

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentStatusUpdate(BaseModel):
    status: AssignmentStatusLiteral

class AssignmentRead(BaseModel):
    id: int
    task_id: int
    individual_volunteer_id: Optional[int] = None
    organization_volunteer_id: Optional[int] = None
    status: AssignmentStatusLiteral
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
