from pydantic import BaseModel


class WarehouseZoneCreate(BaseModel):
    zone_name: str
    zone_type: str
    capacity: int
    manager: str


class WarehouseZoneOut(BaseModel):
    warehouse_id: int
    zone_name: str
    zone_type: str
    capacity: int
    manager: str
