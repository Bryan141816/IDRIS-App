from data_schemas.distribution_planning import (
    TeamDataCreate,
    RouteCreate,
    AssignTeam,
    UpdateRoute,
    TeamDataCreate,
)
from sqlalchemy.orm import Session, aliased
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy import func, select, distinct, extract, case, or_
from models import (
    IndividualVolunteer,
    DistributionTeam,
    TeamMembers,
    InventoryItems,
    DistributedItems,
    DistributionRoute,
    DistributionRouteLogs,
    AssignedStorage,
    ProcurementRequest,
    VolunteerStatus
)
from calendar import month_abbr
from zoneinfo import ZoneInfo
import asyncio
from real_time_handler import send_real_time
from typing import List, Optional
from fastapi import HTTPException, status
from datetime import datetime, timezone


class DistributionAndPlanningCRUD:
    @staticmethod
    def get_volunteers(db: Session):
        return db.query(IndividualVolunteer).all()

    @staticmethod
    def add_team(payload: TeamDataCreate, db: Session):
        # Create the distribution team
        new_team = DistributionTeam(
            team_name=payload.team_name,
            deployment_area=payload.deployment_area,
            assignment_duration=payload.assignment_duration,
            starting_date=payload.starting_date,
            status="pending",
        )
        db.add(new_team)
        db.commit()
        db.refresh(new_team)

        # Add team members with pending status
        # DO NOT update volunteer availability_status here - only when they accept
        for member_data in payload.team_members:
            team_member = TeamMembers(
                team_id=new_team.team_id,
                member=member_data.volunteer_id,
                role=member_data.role,
                status="pending",
                assigned_by=payload.assigned_by,
            )
            db.add(team_member)

        db.commit()

        # Return data for notifications
        return {
            "team_id": new_team.team_id,
            "team_name": new_team.team_name,
            "deployment_area": new_team.deployment_area,
            "starting_date": str(new_team.starting_date),
            "assignment_duration": new_team.assignment_duration,
            "team_members": [
                {"volunteer_id": m.volunteer_id, "role": m.role}
                for m in payload.team_members
            ],
        }

    @staticmethod
    def get_all_distribution_team(db: Session):
        """Get all distribution teams with member details including status"""
        teams = db.query(DistributionTeam).all()

        result = []
        for team in teams:
            # Get team members with their volunteer info and status
            team_members = (
                db.query(TeamMembers, IndividualVolunteer)
                .join(
                    IndividualVolunteer,
                    TeamMembers.member == IndividualVolunteer.volunteer_id,
                )
                .filter(TeamMembers.team_id == team.team_id)
                .all()
            )

            # Format team members with status
            members_list = []
            for team_member, volunteer in team_members:
                members_list.append(
                    {
                        "role": team_member.role,
                        "status": team_member.status,  # Add this line
                        "volunteer": {
                            "first_name": volunteer.first_name,
                            "last_name": volunteer.last_name,
                        },
                    }
                )

            result.append(
                {
                    "team_id": team.team_id,
                    "team_name": team.team_name,
                    "team_members": members_list,
                    "status": team.status,
                }
            )

        return result

    @staticmethod
    def get_warehouse_items(warehouse_id: int, db: Session):
        return (
            db.query(InventoryItems)
            .filter(InventoryItems.location == warehouse_id)
            .all()
        )

    @staticmethod
    def create_route(payload: RouteCreate, db: Session):
        route = DistributionRoute(
            route_name=payload.routeName,
            start_location=payload.warehouse_id,
            end_location_id=payload.endLocationId,
            end_location=payload.endLocation,
            schedule=payload.schedule,
        )
        db.add(route)
        db.flush()
        for item in payload.items:
            distributed_item = DistributedItems(
                item=item.inventory_id,
                route=route.route_id,
                quantity=item.distributionQty,
            )
            db.add(distributed_item)
            inventory_item = (
                db.query(InventoryItems)
                .filter(InventoryItems.inventory_id == item.inventory_id)
                .first()
            )
            if inventory_item:
                new_quantity = inventory_item.quantity - item.distributionQty
                if new_quantity < 0:
                    new_quantity = 0  # prevent negative quantities

                inventory_item.quantity = new_quantity
                db.add(inventory_item)
        db.commit()
        db.refresh(route)
        return route

    @staticmethod
    def _num_to_float(n):
        # LGU lat/lng are Numeric; convert safely to float or None
        return float(n) if n is not None else None

    @staticmethod
    def serialize_route(r: DistributionRoute):
        return {
            "route_id": r.route_id,
            "route_name": r.route_name,
            "gathering_area": r.gathering_area,
            "gathering_lat": r.gathering_lat,
            "gathering_lng": r.gathering_lng,
            "request_id": r.request_id,
            "status": r.status,
            "start_schedule": (
                r.start_schedule.isoformat() if r.start_schedule else None
            ),
            "end_schedule": r.end_schedule.isoformat() if r.end_schedule else None,
            "team_id": r.team,
            "date_added": r.date_added.isoformat() if r.date_added else None,
            # Assigned team (scalar) + members (collection)
            "assigned_team": (
                None
                if not r.assigned_team
                else {
                    "team_id": r.assigned_team.team_id,
                    "team_name": r.assigned_team.team_name,
                    "isActive": r.assigned_team.isActive,
                    "status": r.assigned_team.status,
                    "team_members": [
                        {
                            "members_id": m.members_id,
                            "member": m.member,
                            "role": m.role,
                            "status": m.status,
                            "volunteer": (
                                None
                                if not m.volunteer
                                else {
                                    "volunteer_id": m.volunteer.volunteer_id,
                                    "first_name": m.volunteer.first_name,
                                    "middle_name": m.volunteer.middle_name,
                                    "last_name": m.volunteer.last_name,
                                    "full_name": f"{m.volunteer.first_name} {m.volunteer.middle_name or ''} {m.volunteer.last_name}".strip(),
                                    "email": m.volunteer.email,
                                    "phone_number": m.volunteer.phone_number,
                                    "address": m.volunteer.address,
                                    "gender": m.volunteer.gender,
                                    "age": m.volunteer.age,
                                }
                            ),
                        }
                        for m in (r.assigned_team.team_members or [])
                    ],
                }
            ),
            # Distributed items (collection)
            "distributed_items": [
                {
                    "item_id": di.item_id,
                    "assigned_storage": di.assigned_storage,
                    "relief_id": di.relief_id,
                    "procurement_request_id": di.procurement_request_id,
                    "route": di.route,
                    "quantity": di.quantity,
                    "assigned_storage_rec": (
                        None
                        if not di.assigned_storage_rec
                        else {
                            "assigned_id": di.assigned_storage_rec.assigned_id,
                            "quantity": di.assigned_storage_rec.quantity,
                            "warehouse": (
                                None
                                if not di.assigned_storage_rec.warehouse
                                else {
                                    "warehouse_id": di.assigned_storage_rec.warehouse.warehouse_id,
                                    "address": di.assigned_storage_rec.warehouse.address,
                                    "lat": di.assigned_storage_rec.warehouse.lat,
                                    "long": di.assigned_storage_rec.warehouse.long,
                                    "status": di.assigned_storage_rec.warehouse.status,
                                    "zone_name": di.assigned_storage_rec.warehouse.zone_name,
                                    "zone_type": di.assigned_storage_rec.warehouse.zone_type,
                                    "capacity": di.assigned_storage_rec.warehouse.capacity,
                                    "manager": di.assigned_storage_rec.warehouse.manager,
                                }
                            ),
                            "inventory_item": (
                                None
                                if not di.assigned_storage_rec.inventory_item
                                else {
                                    "inventory_id": di.assigned_storage_rec.inventory_item.inventory_id,
                                    "item_name": di.assigned_storage_rec.inventory_item.item_name,
                                    "quantity": di.assigned_storage_rec.inventory_item.quantity,
                                    "category": di.assigned_storage_rec.inventory_item.category,
                                    "batch": di.assigned_storage_rec.inventory_item.batch,
                                    "expiry": (
                                        di.assigned_storage_rec.inventory_item.expiry.isoformat()
                                        if di.assigned_storage_rec.inventory_item.expiry
                                        else None
                                    ),
                                    "status": di.assigned_storage_rec.inventory_item.status,
                                }
                            ),
                        }
                    ),
                    "relief_item": (
                        None
                        if not di.relief_item
                        else {
                            "item_id": di.relief_item.item_id,
                            "request_id": di.relief_item.request_id,
                            "item_name": di.relief_item.item_name,
                            "category": di.relief_item.category,
                            "quantity": di.relief_item.quantity,
                        }
                    ),
                    "procurement_item": (
                        None
                        if not di.procurement_item
                        else {
                            "item_id": di.procurement_item.item_id,
                            "request_id": di.procurement_item.request_id,
                            "item_name": di.procurement_item.item_name,
                            "quantity": di.procurement_item.quantity,
                            "unit": di.procurement_item.unit,
                        }
                    ),
                }
                for di in (r.distributed_items or [])
            ],
            # Logs (collection)
            "logs": [
                {
                    "log_id": lg.log_id,
                    "route_id": lg.route_id,
                    "log_message": lg.log_message,
                    "date": lg.date.isoformat() if lg.date else None,
                }
                for lg in (r.logs or [])
            ],
            # Procurement request (scalar) + its items (collections)
            "request": (
                None
                if not r.request
                else {
                    "request_id": r.request.request_id,
                    "lgu_id": r.request.lgu_id,
                    "request_type": r.request.request_type,
                    "request_ref_num": r.request.request_ref_num,
                    "request_title": r.request.request_title,
                    "request_description": r.request.request_description,
                    "use_different_end": r.request.use_different_end,
                    "different_end_type": r.request.different_end_type,
                    "status": r.request.status,
                    "end_barangay": r.request.end_barangay,
                    "end_evac": r.request.end_evac,
                    "priority": r.request.priority,
                    "date_requested": (
                        r.request.date_requested.isoformat()
                        if r.request.date_requested
                        else None
                    ),
                    "disaster_type": r.request.disaster_type,
                    "date_needed": (
                        r.request.date_needed.isoformat()
                        if r.request.date_needed
                        else None
                    ),
                    "lgu": (
                        None
                        if not r.request.lgu
                        else {
                            "id": r.request.lgu.id,
                            "name": r.request.lgu.lgu_name,
                            "lat": DistributionAndPlanningCRUD._num_to_float(
                                r.request.lgu.lat
                            ),
                            "lng": DistributionAndPlanningCRUD._num_to_float(
                                r.request.lgu.lng
                            ),
                        }
                    ),
                    "barangay": (
                        None
                        if not r.request.barangay
                        else {
                            "id": r.request.barangay.id,
                            "name": r.request.barangay.name,
                            "lat": r.request.barangay.lat,
                            "lng": r.request.barangay.lng,
                        }
                    ),
                    "evacuation_center": (
                        None
                        if not r.request.evacuation_center
                        else {
                            "evacuation_id": r.request.evacuation_center.evacuation_id,
                            "name": r.request.evacuation_center.name,
                            "lat": r.request.evacuation_center.lat,
                            "lng": r.request.evacuation_center.lng,
                        }
                    ),
                    "relief_items": [
                        {
                            "item_id": it.item_id,
                            "request_id": it.request_id,
                            "item_name": it.item_name,
                            "category": it.category,
                            "quantity": it.quantity,
                            "unit": it.unit,
                        }
                        for it in (r.request.relief_items or [])
                    ],
                    "procurement_items": [
                        {
                            "item_id": it.item_id,
                            "request_id": it.request_id,
                            "item_name": it.item_name,
                            "quantity": it.quantity,
                            "unit": it.unit,
                        }
                        for it in (r.request.procurement_items or [])
                    ],
                }
            ),
        }

    @staticmethod
    def get_routes(db: Session, exclude: Optional[List[str]] = None):
        routes = (
            db.query(DistributionRoute)
            .options(
                # Assigned team + team members + volunteer profiles
                joinedload(DistributionRoute.assigned_team).options(
                    selectinload(DistributionTeam.team_members).joinedload(
                        TeamMembers.volunteer
                    )
                ),
                # Distributed items + their source references
                selectinload(DistributionRoute.distributed_items).options(
                    # assigned storage record + its warehouse & inventory item
                    joinedload(DistributedItems.assigned_storage_rec).options(
                        joinedload(AssignedStorage.warehouse),
                        joinedload(AssignedStorage.inventory_item),
                    ),
                    # relief/procurement source items
                    joinedload(DistributedItems.relief_item),
                    joinedload(DistributedItems.procurement_item),
                ),
                # Logs
                selectinload(DistributionRoute.logs),
                # The originating request + its linked entities and item lines
                joinedload(DistributionRoute.request).options(
                    # request destination lookups
                    joinedload(ProcurementRequest.barangay),
                    joinedload(ProcurementRequest.evacuation_center),
                    joinedload(ProcurementRequest.lgu),
                    # line items
                    selectinload(ProcurementRequest.relief_items),
                    selectinload(ProcurementRequest.procurement_items),
                    # (optional) if you later add routes backref here, avoid cycles in serialization
                ),
            )
            .order_by(
                case(
                    (DistributionRoute.status == "Waiting for Additional Action",0),
                    (DistributionRoute.status == "Waiting for volunteer acceptance",1),
                    (DistributionRoute.status == "Active",2),
                    (DistributionRoute.status == "In Transit",3),
                    (DistributionRoute.status.in_(["Completed", "Cancelled"]),4),
                ),
                DistributionRoute.date_added.asc()
            )
            .all()
        )

        return [DistributionAndPlanningCRUD.serialize_route(r) for r in routes]



    @staticmethod
    def update_route(payload: UpdateRoute, db: Session):
        route = (
            db.query(DistributionRoute)
            .filter(DistributionRoute.route_id == payload.route_id)
            .first()
        )

        if not route:
            print(f"Route with ID {payload.route_id} not found.")
            return None

        # Update the route status
        route.status = payload.status
        status = str(payload.status).strip().lower()

        log_message = None
        if status == "in transit":
            log_message = f"Route {route.route_name} is In Transit"
        elif status == "cancelled":
            log_message = f"Route {route.route_name} has been Cancelled"
        elif status == "completed":
            log_message = f"Route {route.route_name} has been Completed"

        # ✅ If route is cancelled — restore quantities
        if status == "cancelled":
            for distributed_item in route.distributed_items:

                try:

                    assigned_storage = distributed_item.assigned_storage_rec
                    # Restore to Assigned Storage
                    if assigned_storage:
                        assigned_storage.quantity += distributed_item.quantity

                        # Also restore to Inventory Item
                        inventory_item = assigned_storage.inventory_item
                        if inventory_item:
                            inventory_item.quantity += distributed_item.quantity

                    # Optionally: mark the distributed item as "reversed" or delete it
                    # db.delete(distributed_item)

                except Exception as e:
                    print(f"Error restoring distributed item {distributed_item.item_id}: {e}")

        # ✅ If cancelled or completed — set volunteers to available
        if status in ["completed", "cancelled"] and route.assigned_team:
            for member in route.assigned_team.team_members:
                volunteer = member.volunteer
                if volunteer:
                    volunteer.availability_status = VolunteerStatus.available

        # ✅ Log message
        if log_message:
            log_entry = DistributionRouteLogs(
                route_id=route.route_id,
                log_message=log_message,
                date=datetime.now(timezone.utc)
            )
            db.add(log_entry)

        db.commit()
        db.refresh(route)
        return route



    @staticmethod
    def assign_team(payload: AssignTeam, db: Session):
        # Fetch the route
        route = (
            db.query(DistributionRoute)
            .filter(DistributionRoute.route_id == payload.route_id)
            .first()
        )

        if not route:
            print(f"Route with ID {payload.route_id} not found.")
            return None

        # Fetch the team (if a team_id was provided)
        team = (
            db.query(DistributionTeam)
            .filter(DistributionTeam.team_id == payload.team_id)
            .first()
            if payload.team_id
            else None
        )

        # Update the route
        route.team = payload.team_id
        log_message = None
        # If a team is assigned
        if team:
            route.status = "Assigned"
            team.status = "assigned"
            log_message = (
                f"Team '{team.team_name}' assigned to route '{route.route_name}'."
            )
        else:
            # Unassign team if team_id is None
            route.status = "Pending"
            # Optional: mark previously assigned team as unassigned
            if route.assigned_team:
                route.assigned_team.status = "unassigned"

        if log_message:
            log_entry = DistributionRouteLogs(
                route_id=route.route_id, log_message=log_message, date=datetime.now()
            )
            db.add(log_entry)

        db.commit()
        db.refresh(route)
        if team:
            db.refresh(team)

        return route

    @staticmethod
    def get_all_routes_with_latest_log(db: Session):
        Log = aliased(DistributionRouteLogs)
        Route = aliased(DistributionRoute)

        # Subquery: get latest log date per route
        latest_log_subquery = (
            db.query(Log.route_id, func.max(Log.date).label("latest_date"))
            .group_by(Log.route_id)
            .subquery()
        )

        # Main query: only routes with logs (INNER JOIN ensures this)
        results = (
            db.query(Route, Log)
            .join(
                latest_log_subquery,
                (latest_log_subquery.c.route_id == Route.route_id),
            )
            .join(
                Log,
                (Log.route_id == latest_log_subquery.c.route_id)
                & (Log.date == latest_log_subquery.c.latest_date),
            )
            .options(
                joinedload(Route.start_zone),
                joinedload(Route.assigned_team),
                joinedload(Route.distributed_items),
            )
            .all()
        )

        # Convert results to JSON-safe dicts
        formatted = [
            {
                "route_id": route.route_id,
                "route_name": route.route_name,
                "status": route.status,
                "start_location": route.start_location,
                "end_location": route.end_location,
                "schedule": route.schedule.isoformat() if route.schedule else None,
                "team": route.team,
                "latest_log": (
                    {
                        "log_id": log.log_id,
                        "log_message": log.log_message,
                        "date": log.date.isoformat() if log.date else None,
                    }
                    if log
                    else None
                ),
            }
            for route, log in results
        ]

        return formatted

    @staticmethod
    def count_assigned_routes(db: Session) -> int:
        """Count all routes with status 'Assigned'."""
        return (
            db.query(func.count(DistributionRoute.route_id))
            .filter(


                    DistributionRoute.status == "In Transit"

            )
            .scalar()
        )


    @staticmethod
    def count_total_route(db:Session) -> int:
        return (
            db.query(func.count(DistributionRoute.request_id))
              .scalar()
        )
    @staticmethod
    def count_pending_route(db: Session) -> int:
        return (
            db.query(func.count(DistributionRoute.route_id))
            .filter(
                or_(
                    DistributionRoute.status == "Waiting for Additional Action",
                    DistributionRoute.status == "Waiting for volunteer acceptance"
                )
            )
            .scalar()
        )


    @staticmethod
    def count_unique_members(db: Session) -> int:
        """Count all unique team members (no duplicate members)."""
        return db.query(func.count(distinct(TeamMembers.member))).scalar()

    @staticmethod
    def count_items_with_completed_routes(db: Session) -> int:
        """Count all distributed items where the route's status is 'Completed'."""
        return (
            db.query(func.count(DistributedItems.item_id))
            .join(
                DistributionRoute, DistributedItems.route == DistributionRoute.route_id
            )
            .filter(DistributionRoute.status == "Completed")
            .scalar()
        )
    @staticmethod
    def count_active_route(db: Session)-> int:
        return (
            db.query(func.count(DistributionRoute.request_id))
            .filter(DistributionRoute.status == "Active")
            .scalar()
        )


    @staticmethod
    def monthly_route_counts(db: Session):
        results = (
            db.query(
                extract("month", DistributionRoute.date_added).label("month"),
                func.count().label("total_routes"),
                func.sum(
                    case((DistributionRoute.status == "Completed", 1), else_=0)
                ).label("completed_routes"),
            )
            .group_by("month")
            .order_by("month")
            .all()
        )

        return [
            {
                "month": month_abbr[int(r.month)],
                "total_routes": r.total_routes,
                "completed_routes": r.completed_routes,
            }
            for r in results
        ]

    @staticmethod
    def count_routes_by_status(db: Session):
        results = db.query(
            func.sum(
                case((DistributionRoute.status == "In Transit", 1), else_=0)
            ).label("in_transit"),
            func.sum(case((DistributionRoute.status == "Completed", 1), else_=0)).label(
                "completed"
            ),
            func.sum(case((DistributionRoute.status == "Cancelled", 1), else_=0)).label(
                "cancelled"
            ),
        ).one()

        return {
            "In Transit": results.in_transit or 0,
            "Completed": results.completed or 0,
            "Cancelled": results.cancelled or 0,
        }

    @staticmethod
    def get_dashboard(db: Session):
        return {
            "total_route": DistributionAndPlanningCRUD.count_total_route(db),
            "active_route": DistributionAndPlanningCRUD.count_active_route(db),
            "in_transit": DistributionAndPlanningCRUD.count_assigned_routes(db),
            "pending_routes": DistributionAndPlanningCRUD.count_pending_route(db),
            "deployed_volunteers": DistributionAndPlanningCRUD.count_unique_members(db),
            "items_distributed": DistributionAndPlanningCRUD.count_items_with_completed_routes(
                db
            ),
            "distribution_performance": DistributionAndPlanningCRUD.monthly_route_counts(
                db
            ),
            "delivery_status": DistributionAndPlanningCRUD.count_routes_by_status(db),
        }
