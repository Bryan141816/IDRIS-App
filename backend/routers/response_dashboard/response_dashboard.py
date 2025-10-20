from zoneinfo import available_timezones
from fastapi import APIRouter, HTTPException
from fastapi import Depends
from sqlalchemy.orm import Session
from data_schemas.report_schema import TableResponse, Cell
from data_schemas.charts_schema import PieChartData, LineChartData, BarChartData
from data_schemas.in_kind_monitoring_schema import InKindMonitoringSummary
from data_schemas.response_dashboard_schema import (
    RecentMapActivity,
    InKindMonitoringDetailed,
    CategorySummary,
    CategorySummaryData,
    SupplyItem,
)
from typing import List
from database import get_db
from models import (
    ResponseReport,
    ModalityDistribution,
    ResponseReportBudget,
    InKindMonitoring,
    DemandAndResponse,
    InventoryItems,
    IndividualVolunteer,
    OrganizationVolunteer,
    VolunteerStatus,
)
from crud_functions.procurement_manage.procurement_inventory import (
    ProcurementInventoryCRUD,
)
from crud_functions.distribution_planning.distribution_planning import (
    DistributionAndPlanningCRUD,
)
from datetime import datetime, timezone
from sqlalchemy import func, extract, Date, cast
from sqlalchemy.orm import aliased

router = APIRouter(tags=["response_dashboard"])


@router.get("/report_list/recent", response_model=TableResponse)
def get_recent_table(db: Session = Depends(get_db)):
    # Table header without the "Actions" column
    table_head = [
        {"text": "Date", "width": "150px"},
        {"text": "Report Type", "width": "250px"},
        {"text": "Status", "width": "150px"},
    ]

    # Get only the 5 most recent reports
    reports = (
        db.query(ResponseReport)
        .order_by(ResponseReport.date_time.desc())
        .limit(5)
        .all()
    )
    pages = {"page": 1, "row": []}
    table_datas = []
    for report in reports:
        row_data = [
            Cell(
                type="Hidden",
                text=str(report.id),
                font_weight=0,
                color="#000",
                width="0px",
            ),
            Cell(
                type="Text",
                text=report.date_time.strftime("%B %d, %Y"),
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=report.report_type,
                font_weight=500,
                color="#000",
                width="250px",
            ),
            Cell(
                type="Text",
                text=report.status,
                font_weight=700,
                color="#22A900" if report.status.lower() == "completed" else "#000",
                width="150px",
            ),
        ]
        pages["row"].append({"data": row_data})
    if pages["row"]:
        table_datas.append(pages)

    return TableResponse(table_head=table_head, table_datas=table_datas, count=5)


@router.get("/response_dashboard/report_summary")
def get_report_summary(db: Session = Depends(get_db)):
    # Total incidents/reports
    total_reports = db.query(func.count(DemandAndResponse.demand_id)).scalar()

    # Completed incidents
    completed = (
        db.query(func.count(DemandAndResponse.demand_id))
        .filter(func.lower(DemandAndResponse.status) == "completed")
        .scalar()
    )

    # "Started" can be interpreted as "responded" but not yet completed
    started = (
        db.query(func.count(DemandAndResponse.demand_id))
        .filter(func.lower(DemandAndResponse.status) == "responded")
        .scalar()
    )

    # Active incidents are those not yet completed
    active_incidents = (
        db.query(func.count(DemandAndResponse.demand_id))
        .filter(func.lower(DemandAndResponse.status) != "completed")
        .scalar()
    )

    # High priority incidents (urgent or high)
    high_priority = (
        db.query(func.count(DemandAndResponse.demand_id))
        .filter(func.lower(DemandAndResponse.priority).in_(["urgent", "high"]))
        .scalar()
    )

    # Average response time in hours for completed incidents
    # Use func.extract('epoch', ...) for PostgreSQL to get seconds
    avg_response_time_seconds = (
        db.query(
            func.avg(
                func.extract("epoch", DemandAndResponse.last_updated)
                - func.extract("epoch", DemandAndResponse.submitted_at)
            )
        )
        .filter(func.lower(DemandAndResponse.status) == "completed")
        .scalar()
    )

    # Convert average seconds to hours, handle case where there are no completed incidents
    response_time_avg = (
        round(avg_response_time_seconds / 3600, 1)
        if avg_response_time_seconds is not None
        else 0
    )

    return {
        "total_reports": total_reports or 0,
        "completed": completed or 0,
        "started": started or 0,  # Note: This is now 'responded' count
        "active_incidents": active_incidents or 0,
        "high_priority": high_priority or 0,
        "response_time_avg": response_time_avg,
    }


@router.get("/response_dashboard/modality_chart", response_model=dict)
def get_modality_chart(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    current_year = now.year
    current_month = now.month

    # Group and count modality types for the current month
    results = (
        db.query(ModalityDistribution.modality_type, func.count().label("count"))
        .filter(
            extract("year", ModalityDistribution.date_time) == current_year,
            extract("month", ModalityDistribution.date_time) == current_month,
        )
        .group_by(ModalityDistribution.modality_type)
        .all()
    )
    print(results)

    if not results:
        # Return empty chart structure
        return {"labels": None, "datasets": None}

    # Prepare the chart data
    labels = [r.modality_type for r in results]
    data = [r.count for r in results]

    # Optional: Assign colors dynamically or map known labels to colors
    color_map = {"Cash": "#44EB6E", "InKind": "#4468EB", "Services": "#EB4D44"}
    backgroundColor = [
        color_map.get(label, "#CCCCCC") for label in labels
    ]  # fallback color

    return {
        "labels": labels,
        "datasets": [
            {
                "label": "Modality Distribution",
                "data": data,
                "backgroundColor": backgroundColor,
                "borderWidth": 1,
            }
        ],
    }


@router.get(
    "/response_dashboard/recent_map_activity", response_model=List[RecentMapActivity]
)
def get_recent_map_activity(db: Session = Depends(get_db)):
    # Get the 5 most recently updated demand/response records
    recent_activities = (
        db.query(DemandAndResponse)
        .order_by(DemandAndResponse.last_updated.desc())
        .limit(5)
        .all()
    )

    # Map status to activity type
    def get_activity_type(status: str) -> str:
        status = status.lower()
        if status == "no response":
            return "new_request"
        elif status == "responded":
            return "response_dispatched"
        elif status == "completed":
            return "completed"
        return "status_update"  # Default for other statuses

    # Format the data into the RecentMapActivity schema
    formatted_activities = [
        RecentMapActivity(
            id=str(activity.demand_id),
            timestamp=activity.last_updated,
            activity_type=get_activity_type(activity.status),
            location={
                "name": activity.title_label,
                "address": activity.address,
                "lat": activity.lat,
                "lng": activity.lng,
            },
            priority=activity.priority,
            description=f"Request '{activity.title_label}' status changed to {activity.status}.",
            assigned_team=None,  # This field is not in the model, so it's None
            status=activity.status,
        )
        for activity in recent_activities
    ]

    return formatted_activities


@router.get(
    "/response_dashboard/in_kind_monitoring", response_model=InKindMonitoringSummary
)
def get_in_kind_monitoring(db: Session = Depends(get_db)):
    add_sum = (
        db.query(func.coalesce(func.sum(InKindMonitoring.quantity), 0))
        .filter(InKindMonitoring.record_type == "Add")
        .scalar()
    )
    in_transit_sum = (
        db.query(func.coalesce(func.sum(InKindMonitoring.quantity), 0))
        .filter(InKindMonitoring.record_type == "In-Transit")
        .scalar()
    )
    delivered_sum = (
        db.query(func.coalesce(func.sum(InKindMonitoring.quantity), 0))
        .filter(InKindMonitoring.record_type == "Delivered")
        .scalar()
    )
    available = add_sum - (in_transit_sum + delivered_sum)

    return {
        "available_relief_packs": int(available),
        "currently_in_transit": int(in_transit_sum),
        "already_distributed": int(delivered_sum),
    }


@router.get(
    "/response_dashboard/in_kind_monitoring_detailed",
    response_model=InKindMonitoringDetailed,
)
def get_in_kind_monitoring_detailed(db: Session = Depends(get_db)):
    # 1. Get summary relief pack data (reusing existing logic)
    in_kind_summary = get_in_kind_monitoring(db)

    # 2. Get staff counts
    staff_available = (
        db.query(func.count(IndividualVolunteer.volunteer_id))
        .filter(IndividualVolunteer.availability_status == VolunteerStatus.available)
        .scalar()
        + db.query(func.count(OrganizationVolunteer.volunteer_id))
        .filter(OrganizationVolunteer.availability_status == VolunteerStatus.available)
        .scalar()
    )

    staff_deployed = (
        db.query(func.count(IndividualVolunteer.volunteer_id))
        .filter(IndividualVolunteer.status == VolunteerStatus.assigned)
        .scalar()
        + db.query(func.count(OrganizationVolunteer.volunteer_id))
        .filter(OrganizationVolunteer.status == VolunteerStatus.assigned)
        .scalar()
    )

    # 3. Get supply items from inventory
    inventory_items = db.query(InventoryItems).all()
    supply_items = [
        SupplyItem(
            id=str(item.inventory_id),
            name=item.item_name,
            category=item.category.lower(),
            unit="units",  # Default value
            available=item.quantity,
            in_transit=0,  # No data in model
            distributed=0,  # No data in model
            low_stock_threshold=10,  # Default value
        )
        for item in inventory_items
    ]

    # 4. Calculate category summary
    categories = ["food", "medical", "clothing", "beverages", "hygiene"]
    category_summary_data = {
        cat: {"available": 0, "in_transit": 0, "distributed": 0} for cat in categories
    }

    for item in supply_items:
        if item.category in category_summary_data:
            category_summary_data[item.category]["available"] += item.available
            # In a real scenario, you'd also sum in_transit and distributed
            # category_summary_data[item.category]['in_transit'] += item.in_transit
            # category_summary_data[item.category]['distributed'] += item.distributed

    category_summary = CategorySummary(
        food=CategorySummaryData(**category_summary_data["food"]),
        medical=CategorySummaryData(**category_summary_data["medical"]),
        clothing=CategorySummaryData(**category_summary_data["clothing"]),
        beverages=CategorySummaryData(**category_summary_data["beverages"]),
        hygiene=CategorySummaryData(**category_summary_data["hygiene"]),
    )

    return InKindMonitoringDetailed(
        total_available_relief_packs=in_kind_summary["available_relief_packs"],
        total_currently_in_transit=in_kind_summary["currently_in_transit"],
        total_already_distributed=in_kind_summary["already_distributed"],
        staff_available=staff_available,
        staff_deployed=staff_deployed,
        supply_items=supply_items,
        category_summary=category_summary,
    )


@router.get("/response_dashboard/raised_budget", response_model=LineChartData)
def get_raised_budget(db: Session = Depends(get_db)):
    # Subquery: Get the latest datetime for each day
    subquery = (
        db.query(
            cast(ResponseReportBudget.date_time, Date).label("date"),
            func.max(ResponseReportBudget.date_time).label("latest_dt"),
        )
        .group_by(cast(ResponseReportBudget.date_time, Date))
        .subquery()
    )

    # Alias the main table for joining
    budget_alias = aliased(ResponseReportBudget)

    # Join the subquery to the main table on the latest datetime
    results = (
        db.query(
            cast(budget_alias.date_time, Date).label("date"), budget_alias.total_amount
        )
        .join(
            subquery,
            (cast(budget_alias.date_time, Date) == subquery.c.date)
            & (budget_alias.date_time == subquery.c.latest_dt),
        )
        .order_by(subquery.c.date)
        .all()
    )

    # Prepare response
    labels = [r.date.strftime("%B %d") for r in results]
    data = [r.total_amount for r in results]

    return {
        "labels": labels,
        "datasets": [
            {
                "label": "Budget",
                "data": data,
                "fill": False,
                "borderColor": "#fcb814",
                "backgroundColor": "rgba(54, 162, 235, 0.2)",
                "tension": 0.4,
            }
        ],
    }


@router.get("/response_dashboard/spending_breakdown", response_model=BarChartData)
def get_spending_breakdown(db: Session = Depends(get_db)):
    # Sum amounts grouped by record type, excluding 'Add'
    results = (
        db.query(
            ResponseReportBudget.budget_record_type,
            func.sum(ResponseReportBudget.amount).label("total"),
        )
        .filter(ResponseReportBudget.budget_record_type != "Add")  # ⛔ Exclude "Add"
        .group_by(ResponseReportBudget.budget_record_type)
        .all()
    )

    # Prepare chart data
    labels = [r.budget_record_type for r in results]
    data = [r.total for r in results]

    # Colors (extend or generate as needed)
    colors = ["#44EB6E", "#4468EB", "#EB4D44", "#fcb814", "#ccc", "#999"]
    background_colors = colors[: len(data)]

    return {
        "labels": labels,
        "datasets": [
            {
                "label": "Spending Breakdown",
                "data": data,
                "backgroundColor": background_colors,
                "borderRadius": 5,
            }
        ],
    }


@router.get("/response_dashboard/get_resource_status")
def get_resource_status(db: Session = Depends(get_db)):

    available_item = ProcurementInventoryCRUD.count_available_inventory_items(db)
    delivery_status = DistributionAndPlanningCRUD.count_routes_by_status(db)

    return {
        "available_relief_items": available_item,
        "in_transit": delivery_status["In Transit"],
        "total_distributed": delivery_status["Completed"],
    }
