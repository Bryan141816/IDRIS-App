# routers/distribution_planning.py

from fastapi import APIRouter, Query, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload
from database import get_db, SessionLocal
from data_schemas.distribution_planning import (
    TeamDataCreate,
    TeamDataOut,
    RouteCreate,
    AssignTeam,
    UpdateRoute,
    FinalizeRoute,
)
from crud_functions.distribution_planning.distribution_planning import (
    DistributionAndPlanningCRUD,
)
from routers.role_checker import RoleChecker
from typing import List, Optional
import asyncio
from create_notification import send_notifications_bulk, send_notification
from datetime import datetime
from models import (
    DistributionRoute,
    TeamMembers,
    DistributionTeam,
    IndividualVolunteer,
    ProcurementRequest,
    LGURecords,
    AssignedStorage,
    InventoryItems,
    WarehouseZones,
    DistributedItems
)
from datetime import datetime, timezone


router = APIRouter(
    tags=["distribution_planning"],
    dependencies=[
        Depends(RoleChecker(["logistics admin", "superadmin"])),
    ],
)
router_generic = APIRouter(
    tags=["distribution_planning"],
    dependencies=[
        Depends(RoleChecker(["generic", "superadmin"])),
    ],
)


# Background task function defined directly in router
# routers/distributionAndplanning/distributionAndplanning.py


def send_team_notifications(team_data: dict):
    """Send notifications to all assigned volunteers"""
    db = SessionLocal()

    try:
        # Get the created team_members to access members_id
        team_members = (
            db.query(TeamMembers)
            .filter(TeamMembers.team_id == team_data["team_id"])
            .all()
        )

        notifications = []
        for team_member in team_members:
            volunteer = (
                db.query(IndividualVolunteer)
                .filter(IndividualVolunteer.volunteer_id == team_member.member)
                .first()
            )

            if volunteer and volunteer.user_id:
                notification_obj = {
                    "to": str(volunteer.user_id),
                    "from_origin": "Distribution Planning",
                    "title": "New Team Assignment - Action Required",
                    "message": (
                        f"You have been assigned to {team_data['team_name']} as {team_member.role}. "
                        f"Please accept or decline this assignment."
                    ),
                    # Include members_id in URL for easy extraction
                    "url_redirect": f"/volunteer/assignment/{team_member.members_id}",
                    "date": datetime.now(),
                    "isRead": False,
                }
                notifications.append(notification_obj)

        if notifications:
            asyncio.run(send_notifications_bulk(db, notifications))

    finally:
        db.close()


@router.get("/distribution_planning/get_dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.get_dashboard(db)


@router.get("/distribution_planning/get_volunteers")
def get_volunteers(db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.get_volunteers(db)


@router.post("/distribution_planning/add_team")
def add_team(
    payload: TeamDataCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    # Create team
    result = DistributionAndPlanningCRUD.add_team(payload, db)

    # Schedule notification sending in background
    background_tasks.add_task(send_team_notifications, result)

    return {
        "message": "Team created successfully. Notifications sent to volunteers.",
        "team_id": result["team_id"],
    }


@router.get(
    "/distribution_planning/get_distribution_team", response_model=List[TeamDataOut]
)
def get_distribution_team(db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.get_all_distribution_team(db)


@router.get("/distribution_planning/get_warehouse_items")
def get_warehouse_items(warehouse_id: int, db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.get_warehouse_items(warehouse_id, db)


@router.post("/distribution_planning/create_route")
def create_route(payload: RouteCreate, db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.create_route(payload, db)


@router.get("/distribution_planning/get_routes")
def get_routes(
    db: Session = Depends(get_db),
    exclude: Optional[List[str]] = Query(None, description="Format: column:value"),
):
    return DistributionAndPlanningCRUD.get_routes(db, exclude)


@router.post("/distribution_planning/assign_team")
def assign_team(payload: AssignTeam, db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.assign_team(payload, db)


@router.get("/distribution_planning/get_movement")
def get_movement(db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.get_all_routes_with_latest_log(db)


@router.post("/distribution_planning/update_route")
def update_route(payload: UpdateRoute, db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.update_route(payload, db)


@router.get("/distribution_planning/get_all_response")
def get_all_response(db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.get_all_response(db)


# New endpoints for volunteer responses
@router_generic.get("/distribution_planning/pending_assignments/{volunteer_id}")
def get_pending_assignments(volunteer_id: int, db: Session = Depends(get_db)):
    """Get all pending team assignments for a volunteer"""
    pending = (
        db.query(TeamMembers, DistributionTeam)
        .join(DistributionTeam, TeamMembers.team_id == DistributionTeam.team_id)
        .filter(TeamMembers.member == volunteer_id, TeamMembers.status == "pending")
        .all()
    )

    results = []
    for member, team in pending:
        results.append(
            {
                "members_id": member.members_id,
                "team_id": team.team_id,
                "team_name": team.team_name,
                "role": member.role,
            }
        )

    return results


@router_generic.put("/distribution_planning/respond_to_assignment/{members_id}")
async def respond_to_assignment(
    members_id: int, status: str, db: Session = Depends(get_db)
):
    """Volunteer accepts or rejects team assignment"""
    if status not in ["accepted", "rejected"]:
        raise HTTPException(
            status_code=400, detail="Status must be 'accepted' or 'rejected'"
        )

    # Get the team member record
    team_member = (
        db.query(TeamMembers).filter(TeamMembers.members_id == members_id).first()
    )

    if not team_member:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if team_member.status == "accepted":
        raise HTTPException(
            status_code=400, detail=f"Assignment already {team_member.status}"
        )

    # Update team member status
    team_member.status = status

    # Update volunteer availability status
    volunteer = (
        db.query(IndividualVolunteer)
        .filter(IndividualVolunteer.volunteer_id == team_member.member)
        .first()
    )

    if volunteer:
        if status == "accepted":
            volunteer.availability_status = "assigned"
        elif status == "rejected":
            volunteer.availability_status = "available"

    db.commit()

    # Get team details
    team = (
        db.query(DistributionTeam)
        .filter(DistributionTeam.team_id == team_member.team_id)
        .first()
    )

    # ✅ Check if all team members accepted
    all_accepted = (
        db.query(TeamMembers)
        .filter(
            TeamMembers.team_id == team_member.team_id, TeamMembers.status != "accepted"
        )
        .count()
        == 0
    )

    if all_accepted:
        route = (
            db.query(DistributionRoute)
            .filter(DistributionRoute.team == team_member.team_id)
            .first()
        )
        if route and route.status != "Active":
                route.status = "Active"
                db.commit()

    volunteer_name = (
        f"{volunteer.first_name} {volunteer.last_name}" if volunteer else "A volunteer"
    )

    return {
        "message": f"Assignment {status} successfully",
        "status": status,
        "availability_status": volunteer.availability_status if volunteer else None,
        "team_ready": all_accepted,
    }


@router.delete("/distribution_planning/remove_team_member/{members_id}")
def remove_team_member(members_id: int, db: Session = Depends(get_db)):
    """Remove a volunteer from a team and set their status back to available"""

    team_member = (
        db.query(TeamMembers).filter(TeamMembers.members_id == members_id).first()
    )

    if not team_member:
        raise HTTPException(status_code=404, detail="Team member not found")

    # Update volunteer availability status back to available
    volunteer = (
        db.query(IndividualVolunteer)
        .filter(IndividualVolunteer.volunteer_id == team_member.member)
        .first()
    )

    if volunteer:
        volunteer.availability_status = "available"

    # Delete the team member record
    db.delete(team_member)
    db.commit()

    return {
        "message": "Volunteer removed from team successfully",
        "volunteer_id": team_member.member,
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
            # Flag was set but no matching/linked record
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

    return {
        "request_id": r.request_id,
        "lgu": {
            "id": r.lgu.id if r.lgu else None,
            "name": r.lgu.lgu_name if r.lgu else None,
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
        "end_target": end_target,  # <- conditional block above
        "fallback_end": {
            "end_address": r.end_address,
            "end_lat": r.end_lat,
            "end_long": r.end_long,
        },  # keep raw fields in case you still need them
        "items_source": item_source,  # "relief" | "procurement"
        "items": items,  # <- list of the retrieved items
    }


@router.get("/distribution_planning/get_request")
def get_request(db: Session = Depends(get_db)):
    query = (
        db.query(ProcurementRequest)
        .options(
            joinedload(ProcurementRequest.lgu).load_only(
                LGURecords.id, LGURecords.lgu_name
            ),
            joinedload(ProcurementRequest.barangay),  # end target (barangay)
            joinedload(ProcurementRequest.evacuation_center),  # end target (evac)
            selectinload(ProcurementRequest.relief_items),  # items (relief)
            selectinload(ProcurementRequest.procurement_items),  # items (procurement)
        )
        .filter(ProcurementRequest.status == "Approved")
        .order_by(ProcurementRequest.date_needed.asc())  # optional: newest first
    )

    rows: List[ProcurementRequest] = query.all()
    return [serialize_request(r) for r in rows]


@router.get("/distribution_planning/get_assigned")
def list_assigned_storage_by_category(
    category: str = Query(
        ..., description="Filter assigned storage by inventory category"
    ),
    db: Session = Depends(get_db),
):
    # Build query
    rows = (
        db.query(
            AssignedStorage.assigned_id,
            AssignedStorage.quantity,
            InventoryItems.item_name.label("inventory_item_name"),
            InventoryItems.category.label("inventory_category"),
            WarehouseZones.zone_name.label("warehouse_zone_name"),
        )
        .join(
            InventoryItems, AssignedStorage.inventory_id == InventoryItems.inventory_id
        )
        .join(
            WarehouseZones, AssignedStorage.warehouse_id == WarehouseZones.warehouse_id
        )
        .filter(InventoryItems.category == category)  # ✅ Filter by category only
        .order_by(AssignedStorage.assigned_id.desc())
        .all()
    )

    # Convert to list of dicts
    results = [
        {
            "assigned_id": r.assigned_id,
            "quantity": r.quantity,
            "inventory_item_name": r.inventory_item_name,
            "inventory_category": r.inventory_category,
            "warehouse_zone_name": r.warehouse_zone_name,
        }
        for r in rows
    ]

    return results


@router.post("/distribution_planning/finalize_route")
def finalize_route(
    payload: FinalizeRoute,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    formatted = f"{now.month}{now.day}{str(now.year)[-2:]}"

    route = (
        db.query(DistributionRoute)
        .filter(DistributionRoute.route_id == payload.route_id)
        .first()
    )
    if not route:
        raise HTTPException(status_code=400, detail="Route not found")

    team = DistributionTeam(team_name=f"TEAM{formatted}")
    db.add(team)
    db.flush()
    team_member = [
        TeamMembers(team_id=team.team_id, member=i.volunteer_id, role=i.role)
        for i in payload.team_members
    ]
    route.gathering_area = payload.gathering_area_name
    route.gathering_lat = payload.gathering_area_lat
    route.gathering_lng = payload.gathering_area_lng
    route.team = team.team_id
    route.status = "Waiting for volunteer acceptance"

    distributed = []
    if payload:
        # Skip any client-side placeholders (assigned_id == -1)
        cleaned = [item for item in payload.inventory if item.assigned_id != -1]

        for item in cleaned:
            assigned_inventory = (
                db.query(AssignedStorage)
                .options(selectinload(AssignedStorage.inventory_item))
                .filter(
                    AssignedStorage.assigned_id == item.assigned_id
                )  # <-- correct use
                .first()
            )
            if not assigned_inventory:
                raise HTTPException(
                    status_code=400,
                    detail=f"Assigned storage {item.assigned_id} not found",
                )
            if not assigned_inventory.inventory_item:
                raise HTTPException(
                    status_code=400,
                    detail=f"Inventory item for assigned {item.assigned_id} not found",
                )

            # Stock validations
            if assigned_inventory.quantity < item.quantity_assigned:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient assigned stock for assigned_id {item.assigned_id}",
                )
            if (
                assigned_inventory.inventory_item.quantity
                < item.quantity_assigned
            ):
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient warehouse stock for item_id {item.item_id}",
                )

            assigned_inventory.quantity -= item.quantity_assigned
            assigned_inventory.inventory_item.quantity -= item.quantity_assigned

            obj = DistributedItems(
                assigned_storage=item.assigned_id,
                relief_id=item.item_id,
                route=route.route_id,
                quantity=item.quantity_assigned,
            )
            distributed.append(obj)

        if distributed:
            db.add_all(distributed)


    db.add_all(team_member)
    db.commit()

    background_tasks.add_task(
        send_team_notifications,
        {"team_id": team.team_id, "team_name": team.team_name},
    )

    return {
        "message": "Route is completed successfully",
    }
