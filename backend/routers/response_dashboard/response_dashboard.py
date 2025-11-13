from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session
from data_schemas.response_dashboard_schema import (RecentMapActivity)
from database import get_db
from models import (
    InventoryItems,
    IndividualVolunteer,
    VolunteerStatus,
    DistributedItems,
    DistributionRoute,
    TeamMembers,
    DistributionTeam,
    AssignedStorage,
    ProcurementRequest
)
from crud_functions.procurement_manage.procurement_inventory import (
    ProcurementInventoryCRUD,
)


from sqlalchemy import func, case
from ..role_checker import RoleChecker

router = APIRouter(tags=["response_dashboard"])

router_admin = APIRouter(
    dependencies=[
        Depends(RoleChecker(["finance admin", "operations admin", "superadmin"]))
    ],
)

@router.get("/response_dashboard/report_summary")
def get_report_summary(db: Session = Depends(get_db)):
    completed_response = db.query(func.count(DistributionRoute.route_id)).filter(DistributionRoute.status == "Completed").scalar()

    return {
        "completed_response": completed_response or 0
    }
@router.get(
    "/response_dashboard/in_kind_monitoring_detailed",
)
def get_in_kind_monitoring_detailed(db: Session = Depends(get_db)):
    categories =["food item", "hygiene & sanitation", "shelter materials", "medical supplies", "clothing items"]


    # Initialize the final result dictionary
    result = {
        cat: {"available": 0, "transit": 0, "distributed": 0, "details": []}
        for cat in categories
    }

    # Query all inventory items in these categories
    inventory_items = (
        db.query(InventoryItems).filter(InventoryItems.category.in_(categories)).all()
    )

    for item in inventory_items:
        item_detail = {
            "item_name": item.item_name,
            "quantity": item.quantity,
            "transit": 0,
            "distributed": 0,
        }

        # Add item quantity to category available total
        result[item.category]["available"] += item.quantity

            # Get distributed info for this item
        distributed = (
            db.query(DistributedItems, DistributionRoute.status)
            .join(DistributionRoute, DistributedItems.route == DistributionRoute.route_id)
            .join(AssignedStorage, DistributedItems.assigned_storage == AssignedStorage.assigned_id)
            .join(ProcurementRequest, DistributionRoute.request_id == ProcurementRequest.request_id)
            .filter(AssignedStorage.inventory_id == item.inventory_id)
            .filter(ProcurementRequest.request_type == "relief")
            .filter(DistributionRoute.status.in_(["In Transit", "Completed"]))
            .all()
        )


        for dist_item, status in distributed:
            if status == "In Transit":
                item_detail["transit"] += dist_item.quantity
                result[item.category]["transit"] += dist_item.quantity
            elif status == "Completed":
                item_detail["distributed"] += dist_item.quantity
                result[item.category]["distributed"] += dist_item.quantity

        # Append item detail to category
        result[item.category]["details"].append(item_detail)

    available_staff = (
        db.query(func.count(IndividualVolunteer.volunteer_id))
        .filter(
            IndividualVolunteer.availability_status.in_(
                [VolunteerStatus.available, VolunteerStatus.assigned]
            )
        )
        .scalar()
    )
    deployed_staff = (
        db.query(func.count(TeamMembers.members_id))
        .join(DistributionTeam, TeamMembers.team_id == DistributionTeam.team_id)
        .join(DistributionRoute, DistributionRoute.team == DistributionTeam.team_id)
        .filter(DistributionRoute.status.in_(["In Transit", "Completed"]))
        .scalar()
    )
    staff_status = {"available": available_staff, "deployed": deployed_staff}
    result["staff_status"] = staff_status

    return result

@router.get("/response_dashboard/get_resource_status")
def get_resource_status(db: Session = Depends(get_db)):

    available_item = ProcurementInventoryCRUD.count_available_inventory_items(db)
    delivery_status = (
        db.query(
            func.sum(
                case(
                    (
                        DistributionRoute.status == "In Transit",
                        DistributedItems.quantity,
                    ),
                    else_=0,
                )
            ).label("in_transit_items"),
            func.sum(
                case(
                    (
                        DistributionRoute.status == "Completed",
                        DistributedItems.quantity,
                    ),
                    else_=0,
                )
            ).label("completed_items"),
        )
        .join(DistributionRoute, DistributedItems.route == DistributionRoute.route_id)
        .one()
    )

    return {
        "available_relief_items": available_item,
        "in_transit": delivery_status.in_transit_items or 0,
        "total_distributed": delivery_status.completed_items or 0,
    }


router.include_router(router_admin)
