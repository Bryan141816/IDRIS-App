from typing import Optional, List, Dict
from pydantic import BaseModel
from datetime import date


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
    location: Optional[int] = None  # FK value
    warehouse: Optional[WarehouseZoneOut] = None  # relationship
    batch: str
    expiry: Optional[date] = None
    status: str

    class Config:
        from_attributes = True


class InventoryItemUpdate(BaseModel):
    inventory_id: int
    item_name: str
    quantity: int
    category: str
    batch: str
    expiry: Optional[date] = None
    status: str


class AssignStorage(BaseModel):
    storage: Dict[int, int]
