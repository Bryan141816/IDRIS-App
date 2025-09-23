from pydantic import BaseModel


class WarehouseZoneCreate(BaseModel):
    status: str
    zone_name: str
    zone_type: str
    capacity: int
    manager: str


class WarehouseZoneOut(BaseModel):
    warehouse_id: int
    status: str
    zone_name: str
    zone_type: str
    capacity: int
    manager: str
