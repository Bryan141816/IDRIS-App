from typing import Optional
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


class InventoryItemCreate(BaseModel):
    item_name: str
    quantity: int
    category: str
    batch: str
    expiry: Optional[str]


class InventoryItemsOut(BaseModel):
    inventory_id: int
    item_name: str
    quantity: int
    category: str
    location: Optional[WarehouseZoneOut] = None
    batch: str
    expiry: Optional[str] = None
    status: str

    class Config:
        from_attributes = True
