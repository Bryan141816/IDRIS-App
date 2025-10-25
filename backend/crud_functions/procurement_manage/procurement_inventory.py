from data_schemas.procurement_inventory import (
    AssignZone,
    WarehouseZoneCreate,
    WarehouseZoneOut,
    InventoryItemCreate,
    InventoryItemUpdate,
    AssignZone,
    AddInventoryDonationCreate,
)

from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from sqlalchemy import func
from models import (
    WarehouseZones,
    InventoryItems,
    AssignedStorage,
    Donation_InKind,
    Donation,
    Donor,
    InKindInventoryItem,
)
from zoneinfo import ZoneInfo
import asyncio
from real_time_handler import send_real_time
from typing import List, Optional, Union
from fastapi import HTTPException, status

from datetime import date, datetime, timedelta, timezone


class ProcurementInventoryCRUD:
    @staticmethod
    def create_warehouse_zone(db: Session, payload: WarehouseZoneCreate):
        warehouse_zone = WarehouseZones(
            status=payload.status,
            zone_name=payload.zone_name,
            address=payload.address,
            lat=payload.lat,
            long=payload.long,
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
        # Query all warehouse zones with assigned storages preloaded
        warehouses = (
            db.query(
                WarehouseZones,
                func.coalesce(
                    func.sum(AssignedStorage.quantity * AssignedStorage.unit_occupancy),
                    0,
                ).label("total_occupancy"),
            )
            .outerjoin(
                AssignedStorage,
                AssignedStorage.warehouse_id == WarehouseZones.warehouse_id,
            )
            .group_by(WarehouseZones.warehouse_id)
            .all()
        )

        # Merge total_occupancy into warehouse object
        result = []
        for warehouse, total_occupancy in warehouses:
            # Convert to dict if needed (SQLAlchemy object -> dict)
            warehouse_dict = {**warehouse.__dict__}
            # Remove internal SQLAlchemy state
            warehouse_dict.pop("_sa_instance_state", None)
            # Add total_occupancy
            warehouse_dict["total_occupancy"] = float(total_occupancy)
            result.append(warehouse_dict)
        return result

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

        now = datetime.now(timezone.utc)
        formatted = f"{now.month}{now.day}{str(now.year)[-2:]}"

        item = InventoryItems(
            item_name=payload.item_name,
            quantity=payload.quantity,
            category=payload.category,
            batch=f"BATCH-{formatted}",
            expiry=payload.expiry,
            status="in stock",
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def create_inventory_items_bulk(db: Session, payload: AddInventoryDonationCreate):
        items_to_create = []
        now = datetime.now(timezone.utc)
        formatted = f"{now.month}{now.day}{str(now.year)[-2:]}"
        for item_payload in payload.items:
            expiry_value = item_payload.expiry or None
            item = InventoryItems(
                item_name=item_payload.item_name,
                quantity=item_payload.quantity,
                category=item_payload.category,
                batch=f"BATCH={formatted}",
                expiry=expiry_value,
                status="in stock",
            )
            items_to_create.append(item)

        db.add_all(items_to_create)
        db.commit()

        # Refresh to load IDs
        for item in items_to_create:
            db.refresh(item)

        # ✅ Update the corresponding InKindInventoryItem status to "added"
        db.query(InKindInventoryItem).filter(
            InKindInventoryItem.id == payload.inkind_id
        ).update({"status": "added"}, synchronize_session=False)

        db.commit()

        return items_to_create

    @staticmethod
    def get_all_inventory_item(
        db: Session,
        filter: Optional[Union[str, List[str]]] = None,
        exclude_fully_assigned: bool = False,  # toggle
        is_for_assignment: bool = False,
    ):
        # Start the base query
        query = db.query(InventoryItems).order_by(InventoryItems.item_name.desc())

        # Filter by category if provided
        if filter:
            if isinstance(filter, list):
                query = query.filter(InventoryItems.category.in_(filter))
            elif isinstance(filter, str):
                query = query.filter(InventoryItems.category == filter)

        # Eager-load assigned storages and warehouses
        query = query.options(
            joinedload(InventoryItems.assigned_storages).joinedload(
                AssignedStorage.warehouse
            )
        )

        # Fetch all items first
        all_items = query.all()

        if exclude_fully_assigned:
            # Compute remaining quantity and filter
            filtered_items = []
            for item in all_items:
                total_assigned = sum(
                    storage.quantity for storage in item.assigned_storages
                )
                remaining_quantity = item.quantity - total_assigned
                item.quantity = remaining_quantity
                if len(item.assigned_storages) > 0:
                    item.already_recorded = True

                if remaining_quantity > 0:
                    filtered_items.append(item)
            return filtered_items

        return all_items

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
    def assign_storage(db: Session, payload: List[AssignZone], warehouse_id: int):
        # 1️⃣ Fetch all existing assignments for this warehouse
        existing_assignments = (
            db.query(AssignedStorage)
            .filter(AssignedStorage.warehouse_id == warehouse_id)
            .all()
        )

        # Map by inventory_id for quick lookup
        existing_map = {a.inventory_id: a for a in existing_assignments}

        to_insert = []
        to_update = []

        for item in payload:
            unit_occupancy = item.occupancy / item.quantity if item.quantity > 0 else 0

            if item.item_id in existing_map:
                # Update existing record
                assignment = existing_map[item.item_id]
                assignment.quantity = assignment.quantity + item.quantity

                to_update.append(assignment)
            else:
                # Create new record
                new_assignment = AssignedStorage(
                    warehouse_id=warehouse_id,
                    inventory_id=item.item_id,
                    quantity=item.quantity,
                    unit_occupancy=unit_occupancy,
                )
                to_insert.append(new_assignment)

        # 2️⃣ Bulk save new objects
        if to_insert:
            db.bulk_save_objects(to_insert)

        # 3️⃣ Commit all changes (updates are tracked automatically)
        db.commit()

        return {"message": "All items inserted/updated successfully"}

    @staticmethod
    def get_all_inkind(db: Session):
        items = (
            db.query(InKindInventoryItem)
            .join(InKindInventoryItem.inkind)
            .join(Donation_InKind.donation)
            .join(Donation.donor)
            .options(
                joinedload(InKindInventoryItem.inkind)
                .joinedload(Donation_InKind.donation)
                .joinedload(Donation.donor)
            )
            .filter(InKindInventoryItem.status == "available")
            .all()
        )

        # Simplify result
        simplified = []
        for item in items:
            inkind = item.inkind
            donation = inkind.donation
            donor = donation.donor

            simplified.append(
                {
                    "item_id": inkind.id,
                    "donor_name": donor.donor_name,
                    "item_description": inkind.item_description,
                    "donation_date": (
                        donation.donation_date.isoformat()
                        if donation.donation_date
                        else None
                    ),
                }
            )

        return simplified

    @staticmethod
    def total_quantity_by_category(db: Session):
        """Group and sum quantities > 0 by category."""
        results = (
            db.query(
                InventoryItems.category,
                func.sum(InventoryItems.quantity).label("total_quantity"),
            )
            .filter(InventoryItems.quantity > 0)
            .filter(
                InventoryItems.category.in_(
                    ["food", "medical", "clothing", "beverages"]
                )
            )
            .group_by(InventoryItems.category)
            .all()
        )

        # Convert to dictionary for easier use
        category_totals = {r.category: r.total_quantity for r in results}

        # Ensure all categories exist in the output even if they have no entries
        for category in ["food", "medical", "clothing", "beverages"]:
            category_totals.setdefault(category, 0)

        return category_totals

    @staticmethod
    def count_available_inventory_items(db: Session):
        return (
            db.query(func.sum(InventoryItems.quantity))
            .filter(InventoryItems.quantity > 0)
            .scalar()
        ) or 0

    @staticmethod
    def get_items_expiring_within_5_days(db: Session):
        """Return all items expiring within the next 5 days (from now to 5 days ahead)."""
        now = datetime.now()
        five_days_from_now = now + timedelta(days=5)

        items = (
            db.query(InventoryItems)
            .filter(InventoryItems.expiry != None)  # ensure expiry exists
            .filter(InventoryItems.expiry >= now.date())  # starting today
            .filter(
                InventoryItems.expiry <= five_days_from_now.date()
            )  # up to 5 days ahead
            .all()
        )

        return items

    @staticmethod
    def count_active_zones(db: Session):
        return (
            db.query(func.count(WarehouseZones.warehouse_id))
            .filter(WarehouseZones.status == "active")
            .scalar()
        )

    @staticmethod
    def count_available_inkind_items(db: Session):
        return (
            db.query(func.count(InKindInventoryItem.id))
            .filter(InKindInventoryItem.status == "available")
            .scalar()
        )

    @staticmethod
    def get_dashboard(db: Session):
        return {
            "available_inventory_items": ProcurementInventoryCRUD.count_available_inventory_items(
                db
            ),
            "active_zones": ProcurementInventoryCRUD.count_active_zones(db),
            "available_inkind_items": ProcurementInventoryCRUD.count_available_inkind_items(
                db
            ),
            "stock_level": ProcurementInventoryCRUD.total_quantity_by_category(db),
            "expiry_alert": ProcurementInventoryCRUD.get_items_expiring_within_5_days(
                db
            ),
        }

    @staticmethod
    def get_assigned_storages(db: Session, warehouse_id: int):
        return (
            db.query(InventoryItems)
            .join(AssignedStorage)
            .filter(AssignedStorage.warehouse_id == warehouse_id)
            .options(joinedload(InventoryItems.assigned_storages))
            .all()
        )
