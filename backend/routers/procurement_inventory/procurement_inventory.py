from crud import delete
from fastapi import APIRouter, Query
from fastapi import Depends, Request
from sqlalchemy.orm import Session
from database import get_db
from models import WarehouseZones
from data_schemas.procurement_inventory import WarehouseZoneCreate, WarehouseZoneOut
from crud_functions.procurement_manage.procurement_inventory import (
    ProcurementInventoryCRUD,
)
from routers.role_checker import RoleChecker
from typing import List

router = APIRouter(
    tags=["procurement_inventory"],
    dependencies=[Depends(RoleChecker(["logistics admin"]))],  # ✅ correct
)


@router.post("/procurement_inventory/add_warehouse_zone")
def add_warehouse_zone(request: WarehouseZoneCreate, db: Session = Depends(get_db)):
    return ProcurementInventoryCRUD.create_warehouse_zone(db, request)


@router.get(
    "/procurement_inventory/get_warehouse_zone", response_model=List[WarehouseZoneOut]
)
def get_warehouse_zone(db: Session = Depends(get_db)):
    return ProcurementInventoryCRUD.get_all_warehouse_zones(db)
