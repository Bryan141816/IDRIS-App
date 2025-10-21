from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from schemas import (
    EmergencyReportResponse,
    EmergencyReportIncidentsByPriority,
    EmergencyReportSummary,
    EmergencyReportPerformanceMetrics,
)
from models import DemandAndResponse
from database import get_db
from typing import Optional
from datetime import datetime, timedelta
from routers.role_checker import RoleChecker

router = APIRouter(
    prefix="/api/emergency-response",
    tags=["emergency-response"],
)

router_admin = APIRouter(
    dependencies=[Depends(RoleChecker(["operations admin", "superadmin"]))],
)

@router_admin.get("/report", response_model=EmergencyReportResponse)
def get_emergency_response_report(
    period: Optional[str] = "monthly", db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    start_date = None

    if period == "monthly":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        date_range = f"{now.strftime('%B')} {now.year}"
    elif period == "quarterly":
        current_quarter = (now.month - 1) // 3 + 1
        start_date = datetime(now.year, 3 * current_quarter - 2, 1)
        date_range = f"Q{current_quarter} {now.year}"
    elif period == "yearly":
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        date_range = f"Year {now.year}"
    else:
        start_date = now - timedelta(days=30) # Default to last 30 days if period is invalid
        date_range = f"Last 30 Days"


    query = db.query(DemandAndResponse).filter(
        DemandAndResponse.submitted_at >= start_date
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
                totalIncidents=0, activeIncidents=0, completedIncidents=0,
                avgResponseTime=0, totalStaffDeployed=0, totalResourcesDistributed=0
            ),
            incidentsByPriority=EmergencyReportIncidentsByPriority(
                urgent=0, high=0, medium=0, low=0
            ),
            resourceDistribution={},
            performanceMetrics=EmergencyReportPerformanceMetrics(
                responseTimeAchieved=0, responseTimeTarget=3, completionRate=0, staffUtilization=0
            )
        )


    # Executive Summary
    active_incidents = query.filter(DemandAndResponse.status.in_(["active", "ongoing"])).count()
    completed_incidents = query.filter(DemandAndResponse.status == "completed").count()
    
    # Placeholder for staff deployed and avg response time
    total_staff_deployed = 145 # Placeholder
    avg_response_time = 2.5 # Placeholder

    # Resource Distribution
    resource_distribution = {}
    total_resources_distributed = 0
    for incident in all_incidents:
        if incident.needs:
            for need in incident.needs:
                item = need.get("need", "Unknown")
                amount = int(need.get("amount", 0))
                resource_distribution[item] = resource_distribution.get(item, 0) + amount
                total_resources_distributed += amount
    
    # Relief Activities by Priority
    priority_counts = query.group_by(DemandAndResponse.priority).with_entities(
        DemandAndResponse.priority,
        func.count(DemandAndResponse.id)
    ).all()

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
    completion_rate = (completed_incidents / total_incidents) * 100 if total_incidents > 0 else 0
    staff_utilization = 85 # Placeholder

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
        responseTimeTarget=3, # Placeholder
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