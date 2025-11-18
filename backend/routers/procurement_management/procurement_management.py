
import random
import string
from fastapi import APIRouter, Query
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload
from database import  get_db
from models import (
    ProcurementRequest,
    LGURecords,
    DistributionRoute,
    DistributedItems,
    AssignedStorage,
    DistributionRouteLogs,
    ProcurementRequestItem,
    Disbursement,
    DisbursementItem,
    TeamMembers,
    DistributionTeam,
    TeamMembers,
    ProcurementRequestLog
)
from datetime import datetime, timedelta, timezone, time
from pydantic import BaseModel
from typing import List, Optional
from routers.role_checker import RoleChecker
from sqlalchemy import func, case



from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.inspection import inspect
router = APIRouter(
    tags=["procurement_management"],
    dependencies=[Depends(RoleChecker(["superadmin", "logistics admin"]))],
)

@router.get("/procurement_management/get_dashboard_data")
def get_dashboard(db: Session = Depends(get_db)):
    counts = (
        db.query(
            func.count(ProcurementRequest.request_id).label("total"),
            func.sum(
                case((ProcurementRequest.status == "Approved", 1), else_=0)
            ).label("approved"),
            func.sum(
                case((ProcurementRequest.status != "Approved", 1), else_=0)
            ).label("not_approved"),
        )       
        .one()
    )
    logs = (db.query(ProcurementRequestLog)
        .order_by(ProcurementRequestLog.date_created.desc())
        .limit(5)
        .all()
            )

    return {
        "total": counts.total or 0,
        "approved": counts.approved or 0,
        "pending": counts.not_approved or 0,
        "recent_log": logs
    } 



def serialize_request(r: ProcurementRequest) -> dict:
    # ---- end target ----
    end_target = None
    if r.use_different_end:
        t = (r.different_end_type or "").strip().lower()
        if t == "barangay" and r.barangay:
            end_target = {
                "type": "barangay",
                "id": r.barangay.id,
                "name": r.barangay.name,
                "lat": r.barangay.lat,
                "lng": r.barangay.lng,
            }
        elif t in {"evac", "evacuation", "evacuation_center"} and r.evacuation_center:
            end_target = {
                "type": "evacuation",
                "id": r.evacuation_center.evacuation_id,
                "name": r.evacuation_center.name,
                "lat": r.evacuation_center.lat,
                "lng": r.evacuation_center.lng,
                "capacity": r.evacuation_center.capacity,
                "occupied": r.evacuation_center.occupied,
            }
        else:
            end_target = {"type": None}

    # ---- items ----
    rtype = (r.request_type or "").strip().lower()
    if rtype == "relief":
        item_source = "relief"
        items = [
            {
                "item_id": i.item_id,
                "name": i.item_name,
                "category": i.category,
                "quantity": i.quantity,
                "unit": i.unit,
            }
            for i in (r.relief_items or [])
        ]
    else:
        item_source = "procurement"
        items = [
            {
                "item_id": i.item_id,
                "name": i.item_name,
                "quantity": i.quantity,
                "unit": i.unit,
            }
            for i in (r.procurement_items or [])
        ]

    # ---- route info ----
    route_list = None 
    if r.status == "Approved" and r.routes:
        route = r.routes
        if route: 
            route_list ={
                "route_id": route.route_id,
                "route_name": route.route_name,
                "gathering_area": route.gathering_area,
                "gathering_lat": route.gathering_lat,
                "gathering_lng": route.gathering_lng,
                "request_id": route.request_id,
                "status": route.status,
                "start_schedule": route.start_schedule.isoformat() if route.start_schedule else None,
                "end_schedule": route.end_schedule.isoformat() if route.end_schedule else None,
                "team_id": route.team,
                "date_added": route.date_added.isoformat() if route.date_added else None,
                "assigned_team": {
                    "team_id": route.assigned_team.team_id,
                    "team_name": route.assigned_team.team_name,
                    "isActive": route.assigned_team.isActive,
                    "status": route.assigned_team.status,
                    "team_members": [
                        {
                            "members_id": m.members_id,
                            "member": m.member,
                            "role": m.role,
                            "status": m.status,
                            "volunteer": {
                                "volunteer_id": m.volunteer.volunteer_id,
                                "first_name": m.volunteer.first_name,
                                "middle_name": m.volunteer.middle_name,
                                "last_name": m.volunteer.last_name,
                                "full_name": f"{m.volunteer.first_name} {m.volunteer.middle_name} {m.volunteer.last_name}",
                                "email": m.volunteer.email,
                                "phone_number": m.volunteer.phone_number,
                                "address": m.volunteer.address,
                                "gender": m.volunteer.gender,
                                "age": m.volunteer.age
                            }
                        } for m in (route.assigned_team.team_members or [])
                    ]
                } if route.assigned_team else None,
                "distributed_items": [
                    {
                        "item_id": d.item_id,
                        "assigned_storage": d.assigned_storage,
                        "relief_id": d.relief_id,
                        "procurement_request_id": d.procurement_request_id,
                        "route": d.route,
                        "quantity": d.quantity,
                        "assigned_storage_rec": {
                            "assigned_id": d.assigned_storage_rec.assigned_id,
                            "quantity": d.assigned_storage_rec.quantity,
                            "warehouse": {
                                "warehouse_id": d.assigned_storage_rec.warehouse.warehouse_id,
                                "address": d.assigned_storage_rec.warehouse.address,
                                "lat": d.assigned_storage_rec.warehouse.lat,
                                "long": d.assigned_storage_rec.warehouse.long,
                                "status": d.assigned_storage_rec.warehouse.status,
                                "zone_name": d.assigned_storage_rec.warehouse.zone_name,
                                "zone_type": d.assigned_storage_rec.warehouse.zone_type,
                                "capacity": d.assigned_storage_rec.warehouse.capacity,
                                "manager": d.assigned_storage_rec.warehouse.manager
                            },
                            "inventory_item": {
                                "inventory_id": d.assigned_storage_rec.inventory_item.inventory_id,
                                "item_name": d.assigned_storage_rec.inventory_item.item_name,
                                "quantity": d.assigned_storage_rec.inventory_item.quantity,
                                "category": d.assigned_storage_rec.inventory_item.category,
                                "batch": d.assigned_storage_rec.inventory_item.batch,
                                "expiry": d.assigned_storage_rec.inventory_item.expiry.isoformat() if d.assigned_storage_rec.inventory_item.expiry else None,
                                "status": d.assigned_storage_rec.inventory_item.status
                            }
                        } if d.assigned_storage_rec else None,
                        "relief_item": {
                            "item_id": d.relief_item.item_id,
                            "request_id": d.relief_item.request_id,
                            "item_name": d.relief_item.item_name,
                            "category": d.relief_item.category,
                            "quantity": d.relief_item.quantity
                        } if d.relief_item else None,
                        "procurement_item": {
                            "item_id": d.procurement_item.item_id,
                            "request_id": d.procurement_item.request_id,
                            "item_name": d.procurement_item.item_name,
                            "quantity": d.procurement_item.quantity,
                            "unit": d.procurement_item.unit
                        } if d.procurement_item else None
                    } for d in (route.distributed_items or [])
                ],
                "logs": [
                    {
                        "log_id": log.log_id,
                        "route_id": log.route_id,
                        "log_message": log.log_message,
                        "date": log.date.isoformat() if log.date else None
                    } for log in reversed(route.logs or [])
                ],
        }

    return {
        "request_id": r.request_id,
        "lgu": {
            "id": r.lgu.id if r.lgu else None,
            "name": r.lgu.lgu_name if r.lgu else None,
            "lat": r.lgu.lat if r.lgu else None,
            "lng": r.lgu.lng if r.lgu else None
        },
        "request_type": r.request_type,
        "request_ref_num": r.request_ref_num,
        "request_title": r.request_title,
        "request_description": r.request_description,
        "status": r.status,
        "priority": r.priority,
        "date_requested": r.date_requested.isoformat() if r.date_requested else None,
        "disaster_type": r.disaster_type,
        "date_needed": r.date_needed.isoformat() if r.date_needed else None,
        "use_different_end": r.use_different_end,
        "different_end_type": r.different_end_type,
        "end_target": end_target,
        "items_source": item_source,
        "items": items,
        "route": route_list  # list of routes
    }




@router.get("/procurement_management/get_request")
def list_requests(db: Session = Depends(get_db)):
    # Build the query with deep eager loading
    query = (
        db.query(ProcurementRequest)
        .options(
            # LGU and end targets
            joinedload(ProcurementRequest.lgu).load_only(LGURecords.id, LGURecords.lgu_name),
            joinedload(ProcurementRequest.barangay),
            joinedload(ProcurementRequest.evacuation_center),

            # Request items
            selectinload(ProcurementRequest.relief_items),
            selectinload(ProcurementRequest.procurement_items),

            # Routes and nested relationships
            selectinload(ProcurementRequest.routes)
            .joinedload(DistributionRoute.assigned_team)
            .selectinload(DistributionTeam.team_members)
            .joinedload(TeamMembers.volunteer),

            selectinload(ProcurementRequest.routes)
            .selectinload(DistributionRoute.distributed_items)
            .joinedload(DistributedItems.assigned_storage_rec)
            .joinedload(AssignedStorage.warehouse),

            selectinload(ProcurementRequest.routes)
            .selectinload(DistributionRoute.distributed_items)
            .joinedload(DistributedItems.assigned_storage_rec)
            .joinedload(AssignedStorage.inventory_item),

            selectinload(ProcurementRequest.routes)
            .selectinload(DistributionRoute.distributed_items)
            .joinedload(DistributedItems.relief_item),

            selectinload(ProcurementRequest.routes)
            .selectinload(DistributionRoute.distributed_items)
            .joinedload(DistributedItems.procurement_item),

            selectinload(ProcurementRequest.routes)
            .selectinload(DistributionRoute.logs)
        )
        .order_by(
            case(
                (ProcurementRequest.status == "Pending Approval", 0),
                (ProcurementRequest.status == "Waiting for Budget Approval", 0),
                (ProcurementRequest.status == "Approved", 1),
                (ProcurementRequest.status == "Rejected", 2),
                else_=3
            ),
            ProcurementRequest.date_requested.asc()
        )
    )

    rows: list[ProcurementRequest] = query.all()  
    return [serialize_request(r) for r in rows]

def generate_short_id(length=6):
    """Generate a random alphanumeric string of given length."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def create_disbursement_with_items(db: Session, request_data: dict, items: List[dict]):
    # Generate 6-character alphanumeric disbursement_id
    disbursement_id = generate_short_id()

    # Create the main disbursement record
    disbursement = Disbursement(
        disbursement_id=disbursement_id,
        disbursement_name=request_data.get("request_title", "No title"),
        origin_name="Procurement",
        origin_id=request_data["request_id"],
    )

    # Add items
    for item_data in items:
        item = DisbursementItem(
            item_id=generate_short_id(),
            item_name=item_data.get("item_name", "Item name"),
            quantity=item_data.get("quantity", 0),
            unit=item_data.get("unit", "pcs"),
            disbursement_id=disbursement_id,
        )
        disbursement.items.append(item)

    # Add and commit
    db.add(disbursement)
    db.commit()
    db.refresh(disbursement)

    return disbursement

class Inventory(BaseModel):
    item_id: int
    assigned_id: int
    quantity_assigned: int

def to_dict(obj):
    return {c.key: getattr(obj, c.key) for c in inspect(obj).mapper.column_attrs}
@router.post("/procurement_management/approve_reject_request")
def approve_reject_request(
    db: Session = Depends(get_db),

    request_id: Optional[int] = Query(None),
    type: Optional[str] = Query(None),
):
    if request_id is None or type not in {"approve", "reject"}:
        raise HTTPException(status_code=400, detail="Invalid request_id or type")

    query = (
        db.query(ProcurementRequest)
        .filter(ProcurementRequest.request_id == request_id)
        .first()
    )
    if not query:
        raise HTTPException(status_code=404, detail="Request not found")

    try:
        # --- Create route & logs for relief requests ---
        if type == "approve":
            new_status = (
                "Approved"
                if query.request_type == "relief"
                else "Waiting for Budget Approval"
            )
        else:
            new_status = "Rejected"
            query.status = new_status
            db.commit()
            db.refresh(query)

            # Return a minimal, predictable response
            return {
                "request_id": query.request_id,
                "status": query.status,
                "request_type": query.request_type,
            }

        query.status = new_status
        if query.request_type == "relief":
            if not query.date_needed:
                raise HTTPException(
                    status_code=400,
                    detail="date_needed is required for relief requests",
                )

            # Make timezone-aware datetimes (UTC). Use 09:00 as a sensible delivery time; adjust to your needs.
            delivery_dt = datetime.combine(
                query.date_needed, time(9, 0, tzinfo=timezone.utc)
            )
            starting_dt = delivery_dt - timedelta(days=3)

            now = datetime.now(timezone.utc)
            if starting_dt <= now:
                starting_dt = now + timedelta(days=1)

            route = DistributionRoute( 
                route_name=query.request_ref_num,
                request_id=request_id,
                start_schedule=starting_dt,
                end_schedule=delivery_dt,
            )
            db.add(route)
            db.flush()  # ensure route_id is populated before we reference it

            log = DistributionRouteLogs(
                route_id=route.route_id,
                log_message=f"{query.request_ref_num} has been created",
                date = now,
            )
            db.add(log)


        else:
            request_data = to_dict(query)
            procurement_items = db.query(ProcurementRequestItem).filter(ProcurementRequestItem.request_id == query.request_id).all()
            items = [to_dict(item) for item in procurement_items]

            create_disbursement_with_items(db, request_data, items)


        # --- Update request status ---

        db.commit()
        db.refresh(query)

        # Return a minimal, predictable response
        return {
            "request_id": query.request_id,
            "status": query.status,
            "request_type": query.request_type,
        }

    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e.__class__.__name__)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
