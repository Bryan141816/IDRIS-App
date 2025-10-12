from typing import Optional, List, Dict
from database import Base
from pydantic import BaseModel
from datetime import date, datetime


class VolunteerRecord(BaseModel):
    volunteer_id: int
    role: str


class TeamDataCreate(BaseModel):
    team_name: str
    team_members: List[VolunteerRecord]
    deployment_area: str
    assignment_duration: int
    starting_date: date


class Volunteer(BaseModel):
    last_name: str
    first_name: str


class VolunteerRecordOut(BaseModel):
    role: str
    volunteer: Volunteer


class TeamDataOut(BaseModel):
    team_id: int
    team_name: str
    team_members: List[VolunteerRecordOut]
    deployment_area: str
    assignment_duration: int
    starting_date: date

    class Config:
        orm_mode = True


class DistributedItems(BaseModel):
    inventory_id: int
    distributionQty: int


class RouteCreate(BaseModel):
    routeName: str
    warehouse_id: int
    items: List[DistributedItems]
    endLocation: str
    schedule: datetime
