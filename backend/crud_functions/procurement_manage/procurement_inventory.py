from data_schemas.procurement_inventory import (
    WarehouseZoneCreate,
    WarehouseZoneOut,
)

from sqlalchemy.orm import Session
from models import WarehouseZones
from zoneinfo import ZoneInfo
import asyncio
from real_time_handler import send_real_time
from typing import List


class ProcurementInventoryCRUD:
    @staticmethod
    def create_warehouse_zone(db: Session, payload: WarehouseZoneCreate):
        warehouse_zone = WarehouseZones(
            status=payload.status,
            zone_name=payload.zone_name,
            zone_type=payload.zone_type,
            capacity=payload.capacity,
            manager=payload.manager,
        )
        db.add(warehouse_zone)
        db.commit()
        db.refresh(warehouse_zone)

        return warehouse_zone

    @staticmethod
    def get_all_warehouse_zones(db: Session):
        return db.query(WarehouseZones).order_by(WarehouseZones.zone_name.desc()).all()
