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
    assigned_by: Optional[str] = None


class Volunteer(BaseModel):
    last_name: str
    first_name: str


class VolunteerRecordOut(BaseModel):
    role: str
    status: str
    volunteer: Volunteer


class TeamDataOut(BaseModel):
    team_id: int
    team_name: str
    team_members: List[VolunteerRecordOut]
    deployment_area: str
    assignment_duration: int
    starting_date: date
    status: str

    class Config:
        orm_mode = True


class DistributedItems(BaseModel):
    inventory_id: int
    distributionQty: int


class RouteCreate(BaseModel):
    routeName: str
    warehouse_id: int
    items: List[DistributedItems]
    endLocationId: int
    endLocation: str
    schedule: datetime


class AssignTeam(BaseModel):
    route_id: int
    team_id: int


class UpdateRoute(BaseModel):
    route_id: int
    status: str



class TeamMembers(BaseModel):
    volunteer_id: int
    role: str
class Inventory(BaseModel):
    item_id: int
    assigned_id: int
    quantity_assigned: int

class FinalizeRoute(BaseModel):
    route_id: int
    gathering_area_name: str
    gathering_area_lat: float
    gathering_area_lng: float
    team_members: List[TeamMembers]
    inventory: List[Inventory]

class ReassignVolunteer(BaseModel):
    team_id: int
    member_id: int
    volunteer_id: int
    role: str
    reassign_type: str

