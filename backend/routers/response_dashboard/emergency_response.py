from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case, literal
from schemas import (
    EmergencyReportResponse,
    EmergencyReportIncidentsByPriority,
    EmergencyReportSummary,
    EmergencyReportPerformanceMetrics,
)
from models import (
    DemandAndResponse,
    TeamMembers,
    DistributionRoute,
    DistributionTeam,
    ProcurementRequestItem,
    ProcurementRequest,
    DistributedItems,
    InventoryItems,
    AssignedStorage,
    InventoryItems
)
from database import get_db
from typing import Optional
from datetime import datetime, timedelta
from routers.role_checker import RoleChecker

router = APIRouter(
    prefix="/api/emergency-response",
    tags=["emergency-response"],
)

router_admin = APIRouter(
    dependencies=[Depends(RoleChecker(["logistics admin", "superadmin"]))],
)

def get_short_date(dt: datetime = None) -> str:
    """
    Returns a shortened date string like "Nov 9 2025".
    If no datetime is provided, uses the current date.
    """
    if dt is None:
        dt = datetime.now()
    return dt.strftime("%b %-d %Y")
@router_admin.get("/report",)
def get_emergency_response_report(
    period: Optional[str] = "monthly", db: Session = Depends(get_db)
):
    now = datetime.now()
    start_date = None
    stop_date = None

    # --- Determine Date Range ---
    if period == "monthly":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month = (
            start_date.replace(month=start_date.month % 12 + 1)
            if start_date.month < 12
            else start_date.replace(year=start_date.year + 1, month=1)
        )
        stop_date = next_month
        date_range = f"{now.strftime('%B')} {now.year}"

    elif period == "quarterly":
        current_quarter = (now.month - 1) // 3 + 1
        start_month = 3 * current_quarter - 2
        start_date = datetime(now.year, start_month, 1)
        stop_month = start_month + 3
        if stop_month > 12:
            stop_date = datetime(now.year + 1, stop_month - 12, 1)
        else:
            stop_date = datetime(now.year, stop_month, 1)
        date_range = f"Q{current_quarter} {now.year}"

    elif period == "yearly":
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        stop_date = start_date.replace(year=start_date.year + 1)
        date_range = f"Year {now.year}"

    else:  # default last 30 days
        start_date = now - timedelta(days=30)
        stop_date = now
        date_range = "Last 30 Days"

    # --- Base route queries ---
    routes_query = db.query(DistributionRoute).filter(
        DistributionRoute.date_added >= start_date,
        DistributionRoute.date_added <= stop_date
    )

    total_relief_activities = routes_query.count()
    completed_count = routes_query.filter(DistributionRoute.status == "Completed").count()

    # --- Completed team members ---
    completed_team_members_count = (
        db.query(func.count(TeamMembers.members_id))
        .join(DistributionTeam, TeamMembers.team_id == DistributionTeam.team_id)
        .join(DistributionRoute, DistributionTeam.team_id == DistributionRoute.team)
        .filter(DistributionRoute.status == "Completed")
        .filter(DistributionRoute.date_added >= start_date)
        .filter(DistributionRoute.date_added <= stop_date)
        .scalar()
    )

    # --- Distributed items count ---
    distributed_count = (
        db.query(func.count(DistributedItems.item_id))
        .join(DistributedItems.route_info)
        .filter(DistributionRoute.status == "Completed")
        .filter(DistributionRoute.date_added >= start_date)
        .filter(DistributionRoute.date_added <= stop_date)
        .scalar()
    )

    # --- Completed procurement items ---
    completed_procurement_items_count = (
        db.query(func.count(ProcurementRequestItem.item_id))
        .join(ProcurementRequest, ProcurementRequestItem.request_id == ProcurementRequest.request_id)
        .join(DistributionRoute, ProcurementRequest.request_id == DistributionRoute.request_id)
        .filter(DistributionRoute.status == "Completed")
        .filter(ProcurementRequest.date_requested >= start_date)
        .filter(ProcurementRequest.date_requested <= stop_date)
        .scalar()
    )

    # --- Priority counts ---
    low_count = (
        db.query(func.count(ProcurementRequest.request_id))
        .join(ProcurementRequest.routes)
        .filter(ProcurementRequest.priority == "low")
        .filter(ProcurementRequest.date_requested >= start_date)
        .filter(ProcurementRequest.date_requested <= stop_date)
        .filter(DistributionRoute.status == "Completed")
        .scalar()
    )

    medium_count = (
        db.query(func.count(ProcurementRequest.request_id))
        .join(ProcurementRequest.routes)
        .filter(ProcurementRequest.priority == "medium")
        .filter(ProcurementRequest.date_requested >= start_date)
        .filter(ProcurementRequest.date_requested <= stop_date)
        .filter(DistributionRoute.status == "Completed")
        .scalar()
    )

    high_count = (
        db.query(func.count(ProcurementRequest.request_id))
        .join(ProcurementRequest.routes)
        .filter(ProcurementRequest.priority == "high")
        .filter(ProcurementRequest.date_requested >= start_date)
        .filter(ProcurementRequest.date_requested <= stop_date)
        .filter(DistributionRoute.status == "Completed")
        .scalar()
    )

    total_request_count = (
        db.query(func.count(ProcurementRequest.request_id))
        .join(ProcurementRequest.routes)
        .filter(ProcurementRequest.date_requested >= start_date)
        .filter(ProcurementRequest.date_requested <= stop_date)
        .filter(DistributionRoute.status == "Completed")
        .scalar()
    )

    # --- Inventory Distributed Items Summary ---
    inventory_summary = (
        db.query(
            InventoryItems.item_name.label("ResourceType"),
            func.sum(DistributedItems.quantity).label("Distributed")
        )
        .join(AssignedStorage, AssignedStorage.assigned_id == DistributedItems.assigned_storage)
        .join(InventoryItems, InventoryItems.inventory_id == AssignedStorage.inventory_id)
        .join(DistributedItems.route_info)
        .filter(DistributionRoute.status == "Completed")
        .filter(DistributionRoute.date_added >= start_date)
        .filter(DistributionRoute.date_added <= stop_date)
        .group_by(InventoryItems.item_name)
        .all()
    )

    # --- Procurement Distributed Items as "Procurement" ---


    procurement_count = (
        db.query(func.count(ProcurementRequestItem.item_id))
        .join(ProcurementRequest, ProcurementRequestItem.request_id == ProcurementRequest.request_id)
        .join(DistributionRoute, ProcurementRequest.request_id == DistributionRoute.request_id)
        .filter(DistributionRoute.status == "Completed")
        .filter(ProcurementRequest.date_requested >= start_date)
        .filter(ProcurementRequest.date_requested <= stop_date)
        .scalar()  # returns just the number
    )



    # --- Combine both inventory and procurement summaries ---

    total_distributed_quantity = sum(r.Distributed for r in inventory_summary) or 1

    distributed_report = [
        {
            "ResourceType": r.ResourceType,
            "Distributed": r.Distributed,
            "Percent": round((r.Distributed / total_distributed_quantity) * 100, 2),
        }
        for r in inventory_summary
    ]

    distributed_report.append({
        "ResourceType": "Procurement",
        "Distributed": procurement_count,
        "Percent": round((procurement_count / total_distributed_quantity) * 100, 2),
    })


    # --- Return the full report ---

    generated_date = datetime.now().isoformat()
    return({
        "generatedDate": generated_date,
        "range": f"{get_short_date(start_date)} - {get_short_date(stop_date)}",
        "total_relief_activities": total_relief_activities,
        "completed_routes": completed_count,
        "completed_team_members_count": completed_team_members_count,
        "distributed_count": distributed_count + procurement_count,
        "completed_procurement_items_count": completed_procurement_items_count,
        "low_priority_count": low_count,
        "medium_priority_count": medium_count,
        "high_priority_count": high_count,
        "total_request_count": total_request_count,
        "distributed_report": distributed_report,
    })


    


router.include_router(router_admin) 
