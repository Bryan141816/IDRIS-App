from data_schemas.procurement_inventory import (
    WarehouseZoneCreate,
    WarehouseZoneOut,
    InventoryItemCreate,
    InventoryItemUpdate,
    AssignStorage,
)

from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from models import WarehouseZones, InventoryItems, AssignedStorage, IndividualVolunteer
from zoneinfo import ZoneInfo
import asyncio
from real_time_handler import send_real_time
from typing import List
from fastapi import HTTPException, status


class DistributionAndPlanningCRUD:
    @staticmethod
    def get_volunteers(db: Session):
        return db.query(IndividualVolunteer).all()
