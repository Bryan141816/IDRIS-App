from data_schemas.distribution_planning import TeamDataCreate, RouteCreate
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from models import (
    IndividualVolunteer,
    DistributionTeam,
    TeamMembers,
    InventoryItems,
    DistributedItems,
    DistributionRoute,
)
from zoneinfo import ZoneInfo
import asyncio
from real_time_handler import send_real_time
from typing import List
from fastapi import HTTPException, status


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
    def get_routes(db: Session):
        routes = (
            db.query(DistributionRoute)
            .options(
                joinedload(DistributionRoute.assigned_team),  # join team
                joinedload(DistributionRoute.distributed_items).joinedload(
                    DistributedItems.item_info
                ),  # join inventory
                joinedload(
                    DistributionRoute.start_zone
                ),  # optional: include warehouse start zone
            )
            .all()
        )

        # Example structure for returning data as dict
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
