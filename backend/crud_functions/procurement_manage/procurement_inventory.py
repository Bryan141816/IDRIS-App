from data_schemas.procurement_inventory import (
    WarehouseZoneCreate,
    WarehouseZoneOut,
    InventoryItemCreate,
    InventoryItemUpdate,
    AssignStorage,
)

from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from models import WarehouseZones, InventoryItems, AssignedStorage
from zoneinfo import ZoneInfo
import asyncio
from real_time_handler import send_real_time
from typing import List
from fastapi import HTTPException, status


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

    @staticmethod
    def update_warehouse_zone(db: Session, payload: WarehouseZoneOut):
        zone = (
            db.query(WarehouseZones)
            .filter(WarehouseZones.warehouse_id == payload.warehouse_id)
            .first()
        )

        if not zone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Warehouse zone with id {payload.warehouse_id} not found",
            )

        # Update only provided fields
        for key, value in payload.dict(exclude_unset=True).items():
            setattr(zone, key, value)

        db.commit()
        db.refresh(zone)
        return zone

    # Inventory Items
    @staticmethod
    def create_inventory_item(db: Session, payload: InventoryItemCreate):
        if not payload.expiry:
            payload.expiry = None
        item = InventoryItems(
            item_name=payload.item_name,
            quantity=payload.quantity,
            category=payload.category,
            batch=payload.batch,
            expiry=payload.expiry,
            status="in stock",
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def get_all_inventory_item(db: Session):
        items = (
            db.query(InventoryItems)
            .options(joinedload(InventoryItems.warehouse))  # ✅ eager load relation
            .order_by(InventoryItems.item_name.desc())
            .all()
        )
        return items

    @staticmethod
    def update_inventory_item(db: Session, payload: InventoryItemUpdate):
        inventory = (
            db.query(InventoryItems)
            .filter(InventoryItems.inventory_id == payload.inventory_id)
            .first()
        )
        if not inventory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inventory with id {payload.warehouse_id} not found",
            )
        for key, value in payload.dict(exclude_unset=True).items():
            setattr(inventory, key, value)

        db.commit()
        db.refresh(inventory)
        return inventory

    @staticmethod
    def assign_storage(db: Session, payload: AssignStorage, id: int):
        assign = [
            AssignedStorage(warehouse_id=id, inventory_id=key, unit_occupancy=value)
            for key, value in payload.storage.items()
        ]
        db.bulk_save_objects(assign)
        for key, value in payload.storage.items():
            db.query(InventoryItems).filter(InventoryItems.inventory_id == key).update(
                {"location": id}
            )
        db.commit()
        return {"message": "All items inserted"}
