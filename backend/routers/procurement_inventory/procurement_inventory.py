from typing import Optional
from typing import Union
from crud import delete
from fastapi import APIRouter, Query
from fastapi import Depends, Request
from sqlalchemy.orm import Session
from database import get_db
from models import WarehouseZones
from data_schemas.procurement_inventory import (
    InventoryItemUpdate,
    WarehouseZoneCreate,
    WarehouseZoneOut,
    InventoryItemCreate,
    InventoryItemsOut,
    AssignZone,
    AddInventoryDonationCreate,
)
from crud_functions.procurement_manage.procurement_inventory import (
    ProcurementInventoryCRUD,
)
from routers.role_checker import RoleChecker
from typing import List

router = APIRouter(
    tags=["procurement_inventory"],
    dependencies=[Depends(RoleChecker(["logistics admin", "superadmin"]))],
)


@router.get("/procurement_inventory/get_dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    return ProcurementInventoryCRUD.get_dashboard(db)


@router.post("/procurement_inventory/add_warehouse_zone")
def add_warehouse_zone(request: WarehouseZoneCreate, db: Session = Depends(get_db)):
    return ProcurementInventoryCRUD.create_warehouse_zone(db, request)


@router.get("/procurement_inventory/get_warehouse_zone")
def get_warehouse_zone(db: Session = Depends(get_db)):
    return ProcurementInventoryCRUD.get_all_warehouse_zones(db)


@router.post("/procurement_inventory/assign_storage")
def assign_storage(id: int, payload: List[AssignZone], db: Session = Depends(get_db)):
    return ProcurementInventoryCRUD.assign_storage(db, payload, id)


@router.post(
    "/procurement_inventory/update_warehouse_zone", response_model=WarehouseZoneOut
)
def update_warehouse_zone(payload: WarehouseZoneOut, db: Session = Depends(get_db)):
    return ProcurementInventoryCRUD.update_warehouse_zone(db, payload)


@router.post("/procurement_inventory/add_inventory_item")
def add_inventory_item(payload: InventoryItemCreate, db: Session = Depends(get_db)):
    return ProcurementInventoryCRUD.create_inventory_item(db, payload)


@router.post("/procurement_inventory/add_inventory_item_bulk")
def add_inventory_item_bulk(
    payload: AddInventoryDonationCreate, db: Session = Depends(get_db)
):
    return ProcurementInventoryCRUD.create_inventory_items_bulk(db, payload)


@router.get(
    "/procurement_inventory/get_inventory_item",
)
def get_inventory_item(
    db: Session = Depends(get_db),
    category: Optional[Union[str, List[str]]] = Query(None),
    exclude_fully_assigned: bool = Query(False),
    is_for_assignment: bool = Query(False),
):
    # 🧩 category can now be a string or a list of strings — directly from frontend
    return ProcurementInventoryCRUD.get_all_inventory_item(
        db, category, exclude_fully_assigned, is_for_assignment
    )


@router.post("/procurement_inventory/update_inventory_item")
def update_inventory_item(payload: InventoryItemUpdate, db: Session = Depends(get_db)):
    return ProcurementInventoryCRUD.update_inventory_item(db, payload)


@router.get("/procurement_inventory/get_all_inkind")
def get_all_inkind(db: Session = Depends(get_db)):
    return ProcurementInventoryCRUD.get_all_inkind(db)
