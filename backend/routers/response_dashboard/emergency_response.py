from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
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
    DistributedItems,
    InventoryItems,
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


@router_admin.get("/report", response_model=EmergencyReportResponse)
def get_emergency_response_report(
    period: Optional[str] = "monthly", db: Session = Depends(get_db)
):
    now = datetime.now()
    start_date = None
    stop_date = None
    if period == "monthly":
        # Start of the current month
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        # Start of next month (exclusive upper bound)
        next_month = (
            start_date.replace(month=start_date.month % 12 + 1)
            if start_date.month < 12
            else start_date.replace(year=start_date.year + 1, month=1)
        )
        stop_date = next_month
        date_range = f"{now.strftime('%B')} {now.year}"

    elif period == "quarterly":
        # Determine current quarter
        current_quarter = (now.month - 1) // 3 + 1
        start_month = 3 * current_quarter - 2
        start_date = datetime(now.year, start_month, 1)
        # End of the quarter (3 months after start)
        stop_month = start_month + 3
        if stop_month > 12:
            stop_date = datetime(now.year + 1, stop_month - 12, 1)
        else:
            stop_date = datetime(now.year, stop_month, 1)
        date_range = f"Q{current_quarter} {now.year}"

    elif period == "yearly":
        # Start of the year
        start_date = now.replace(
            month=1, day=1, hour=0, minute=0, second=0, microsecond=0
        )
        # Start of next year
        stop_date = start_date.replace(year=start_date.year + 1)
        date_range = f"Year {now.year}"

    else:
        # Default: last 30 days
        start_date = now - timedelta(days=30)
        stop_date = now
        date_range = f"Last 30 Days"

    query = db.query(DemandAndResponse).filter(
        DemandAndResponse.submitted_at.between(start_date, stop_date)
    )

    all_incidents = query.all()
    total_incidents = len(all_incidents)

    if total_incidents == 0:
        # Return a default empty report if no incidents are found
        return EmergencyReportResponse(
            reportTitle="Emergency Response Report",
            dateRange=date_range,
            generatedDate=now.isoformat(),
            totalRecords=0,
            summary=EmergencyReportSummary(
                totalIncidents=0,
                activeIncidents=0,
                completedIncidents=0,
                avgResponseTime=0,
                totalStaffDeployed=0,
                totalResourcesDistributed=0,
            ),
            incidentsByPriority=EmergencyReportIncidentsByPriority(
                urgent=0, high=0, medium=0, low=0
            ),
            resourceDistribution={},
            performanceMetrics=EmergencyReportPerformanceMetrics(
                responseTimeAchieved=0,
                responseTimeTarget=3,
                completionRate=0,
                staffUtilization=0,
            ),
        )

    # Executive Summary

    query = db.query(DemandAndResponse).filter(
        DemandAndResponse.last_updated >= start_date,
        DemandAndResponse.last_updated <= stop_date,
    )

    active_incidents = query.filter(
        DemandAndResponse.status.in_(["active", "ongoing"])
    ).count()

    completed_incidents = query.filter(DemandAndResponse.status == "completed").count()

    # Placeholder for staff deployed and avg response time

    total_staff_deployed = (
        db.query(func.count(TeamMembers.members_id))
        .join(DistributionTeam, TeamMembers.team_id == DistributionTeam.team_id)
        .join(DistributionRoute, DistributionRoute.team == DistributionTeam.team_id)
        .filter(DistributionRoute.status == "In Transit")
        .filter(DistributionRoute.date_added.between(start_date, stop_date))
        .scalar()
    )

    # Placeholder
    avg_response_time = 2.5  # Placeholder

    total_resources_distributed = (
        db.query(func.sum(DistributedItems.quantity))
        .join(DistributionRoute, DistributedItems.route == DistributionRoute.route_id)
        .filter(DistributionRoute.status == "Completed")
        .filter(DistributionRoute.date_added.between(start_date, stop_date))
        .scalar()
    )
    # Relief Activities by Priority

    priority_counts = (
        db.query(DemandAndResponse.priority, func.count(DemandAndResponse.id))
        .filter(
            DemandAndResponse.submitted_at >= start_date,
            DemandAndResponse.submitted_at <= stop_date,
        )
        .group_by(DemandAndResponse.priority)
        .all()
    )

    per_category_count = (
        db.query(
            InventoryItems.category,
            func.sum(DistributedItems.quantity).label("total_quantity"),
        )
        .join(DistributedItems, InventoryItems.inventory_id == DistributedItems.item)
        .join(DistributionRoute, DistributedItems.route == DistributionRoute.route_id)
        .filter(DistributionRoute.status == "Completed")
        .filter(DistributionRoute.date_added.between(start_date, stop_date))
        .group_by(InventoryItems.category)
        .all()
    )
    resource_distribution = {cat: qty for cat, qty in per_category_count}

    incidents_by_priority = {
        "urgent": 0,
        "high": 0,
        "medium": 0,
        "low": 0,
    }
    for priority, count in priority_counts:
        if priority.lower() in incidents_by_priority:
            incidents_by_priority[priority.lower()] = count

    # Performance Metrics
    completion_rate = (
        (completed_incidents / total_incidents) * 100 if total_incidents > 0 else 0
    )
    staff_utilization = 85  # Placeholder

    summary = EmergencyReportSummary(
        totalIncidents=total_incidents,
        activeIncidents=active_incidents,
        completedIncidents=completed_incidents,
        avgResponseTime=avg_response_time,
        totalStaffDeployed=total_staff_deployed,
        totalResourcesDistributed=total_resources_distributed,
    )

    performance_metrics = EmergencyReportPerformanceMetrics(
        responseTimeAchieved=avg_response_time,
        responseTimeTarget=3,  # Placeholder
        completionRate=completion_rate,
        staffUtilization=staff_utilization,
    )

    return EmergencyReportResponse(
        reportTitle="Emergency Response Report",
        dateRange=date_range,
        generatedDate=now.isoformat(),
        totalRecords=total_incidents,
        summary=summary,
        incidentsByPriority=incidents_by_priority,
        resourceDistribution=resource_distribution,
        performanceMetrics=performance_metrics,
    )


router.include_router(router_admin)
