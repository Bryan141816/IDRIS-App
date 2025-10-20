from data_schemas.distribution_planning import (
    TeamDataCreate,
    RouteCreate,
    AssignTeam,
    UpdateRoute,
)
from sqlalchemy.orm import Session, aliased
from sqlalchemy.orm import joinedload
from sqlalchemy import func, select, distinct, extract, case
from models import (
    IndividualVolunteer,
    DistributionTeam,
    TeamMembers,
    InventoryItems,
    DistributedItems,
    DistributionRoute,
    DistributionRouteLogs,
    DemandAndResponse,
    InKindInventoryItem,
    Donation_InKind,
    Donation,
    Donor,
)
from calendar import month_abbr
from zoneinfo import ZoneInfo
import asyncio
from real_time_handler import send_real_time
from typing import List, Optional
from fastapi import HTTPException, status
from datetime import datetime


class DistributionAndPlanningCRUD:
    @staticmethod
    def get_volunteers(db: Session):
        return db.query(IndividualVolunteer).all()

    @staticmethod
    def add_team(payload: TeamDataCreate, db: Session):
        # Create the team first
        teamdata = DistributionTeam(
            team_name=payload.team_name,
            deployment_area=payload.deployment_area,
            assignment_duration=payload.assignment_duration,
            starting_date=payload.starting_date,
        )

        # Add and flush to get the team_id (before commit)
        db.add(teamdata)
        db.flush()  # flush assigns auto-incremented ID to teamdata.team_id

        # Now add team members
        for member_data in payload.team_members:
            team_member = TeamMembers(
                team_id=teamdata.team_id,
                member=member_data.volunteer_id,
                role=member_data.role,
            )
            db.add(team_member)

        # Commit all together
        db.commit()
        db.refresh(teamdata)

        return teamdata

    @staticmethod
    def get_all_distribution_team(db: Session):
        teams = (
            db.query(DistributionTeam)
            .options(
                joinedload(DistributionTeam.team_members).joinedload(
                    TeamMembers.volunteer
                )
            )
            .all()
        )
        return teams

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
    def get_routes(db: Session, exclude: Optional[List[str]] = None):
        query = db.query(DistributionRoute)

        # Apply joined loads
        query = query.options(
            joinedload(DistributionRoute.assigned_team),
            joinedload(DistributionRoute.distributed_items).joinedload(
                DistributedItems.item_info
            ),
            joinedload(DistributionRoute.start_zone),
        )

        # Exclude rows based on the given dict
        print(exclude)
        if exclude:
            for condition in exclude:
                if ":" in condition:
                    column_name, value = condition.split(":", 1)
                    column = getattr(DistributionRoute, column_name, None)
                    if column is not None:
                        query = query.filter(column != value)

        routes = query.all()

        result = []
        for route in routes:
            route_data = {
                "route_id": route.route_id,
                "route_name": route.route_name,
                "status": route.status,
                "schedule": route.schedule,
                "end_location": route.end_location,
                "start_location": (
                    route.start_zone.zone_name if route.start_zone else None
                ),
                "assigned_team": {
                    "team_id": (
                        route.assigned_team.team_id if route.assigned_team else None
                    ),
                    "team_name": (
                        route.assigned_team.team_name if route.assigned_team else None
                    ),
                },
                "distributed_items": [
                    {
                        "item_id": item.item_id,
                        "inventory_id": item.item_info.inventory_id,
                        "item_name": item.item_info.item_name,
                        "quantity": item.quantity,
                    }
                    for item in route.distributed_items
                ],
            }
            result.append(route_data)

        return result

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

        log_message = None
        if route.status != payload.status and route.schedule != payload.schedule:
            log_message = (
                f"{route.route_name}'s status has been updated and rescheduled"
            )
        elif route.status != payload.status:
            log_message = f"{route.route_name}'s status has been updated"
        elif route.schedule != payload.schedule:
            log_message = f"{route.route_name}'s has been rescheduled"
        route.status = payload.status
        route.schedule = payload.schedule
        if log_message and route.status != "Pending":

            log_entry = DistributionRouteLogs(
                route_id=route.route_id, log_message=log_message, date=datetime.now()
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
    def get_all_response(db: Session):
        demands = (
            db.query(DemandAndResponse)
            .filter(DemandAndResponse.status == "no response")
            .all()
        )
        return demands

    @staticmethod
    def count_assigned_routes(db: Session) -> int:
        """Count all routes with status 'Assigned'."""
        return (
            db.query(func.count(DistributionRoute.route_id))
            .filter(DistributionRoute.status == "Assigned")
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
            "In Transit": results.in_transit,
            "Completed": results.completed,
            "Cancelled": results.cancelled,
        }

    @staticmethod
    def get_dashboard(db: Session):
        return {
            "active_routes": DistributionAndPlanningCRUD.count_assigned_routes(db),
            "deployed_volunteers": DistributionAndPlanningCRUD.count_unique_members(db),
            "items_distributed": DistributionAndPlanningCRUD.count_items_with_completed_routes(
                db
            ),
            "distribution_performance": DistributionAndPlanningCRUD.monthly_route_counts(
                db
            ),
            "delivery_status": DistributionAndPlanningCRUD.count_routes_by_status(db),
        }
