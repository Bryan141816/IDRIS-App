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

router = APIRouter(
    tags=["procurement_inventory"],
    dependecies=[Depends(RoleChecker(["logistics admin"]))],
)


@router.post("/procurement_inventory/add_warehouse_zone")
def add_warehouse_zone(request: WarehouseZoneCreate, db: Session = Depends(get_db)):
    return ProcurementInventoryCRUD.create_warehouse_zone(db, request)
