from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class Location(BaseModel):
    name: str
    address: str
    lat: float
    lng: float

class RecentMapActivity(BaseModel):
    id: str
    timestamp: datetime
    activity_type: str
    location: Location
    priority: str
    description: str
    assigned_team: Optional[str] = None
    status: str

    class Config:
        orm_mode = True


class SupplyItem(BaseModel):
    id: str
    name: str
    category: str
    unit: str
    available: int
    in_transit: int
    distributed: int
    low_stock_threshold: int


class CategorySummaryData(BaseModel):
    available: int
    in_transit: int
    distributed: int


class CategorySummary(BaseModel):
    food: CategorySummaryData
    medical: CategorySummaryData
    clothing: CategorySummaryData
    beverages: CategorySummaryData
    hygiene: CategorySummaryData


class InKindMonitoringDetailed(BaseModel):
    total_available_relief_packs: int
    total_currently_in_transit: int
    total_already_distributed: int
    staff_available: int
    staff_deployed: int
    supply_items: List[SupplyItem]
    category_summary: CategorySummary

    class Config:
        orm_mode = True