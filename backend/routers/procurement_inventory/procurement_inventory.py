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
