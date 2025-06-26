from fastapi import APIRouter, HTTPException
from fastapi import Depends
from sqlalchemy.orm import Session
from data_schemas.report_schema import TableResponse, Cell
from data_schemas.charts_schema import PieChartData, LineChartData, BarChartData
from data_schemas.in_kind_monitoring_schema import InKindMonitoringSummary
from database import  get_db
from models import  ResponseReport, ModalityDistribution,  ResponseReportBudget, InKindMonitoring  # no Role import
from datetime import datetime, timezone
from sqlalchemy import func, extract, Date, cast 
from sqlalchemy.orm import aliased

router = APIRouter(
tags=["response_dashboard"]
)


@router.get("/report_list/recent", response_model=TableResponse)
def get_recent_table(db: Session = Depends(get_db)):
    # Table header without the "Actions" column
    table_head = [
        {"text": "Date", "width": "150px"},
        {"text": "Report Type", "width": "250px"},
        {"text": "Status", "width": "150px"},
    ]

    # Get only the 5 most recent reports
    reports = db.query(ResponseReport).order_by(ResponseReport.date_time.desc()).limit(5).all()

    table_datas = []
    for report in reports:
        row_data = [
            Cell(
                type="Hidden",
                text=str(report.id),
                font_weight=0,
                color="#000",
                width="0px"
            ),
            Cell(
                type="Text",
                text=report.date_time.strftime("%B %d, %Y"),
                font_weight=500,
                color="#000",
                width="150px"
            ),
            Cell(
                type="Text",
                text=report.report_type,
                font_weight=500,
                color="#000",
                width="250px"
            ),
            Cell(
                type="Text",
                text=report.status,
                font_weight=700,
                color="#22A900" if report.status.lower() == "completed" else "#000",
                width="150px"
            )
        ]
        table_datas.append({"data": row_data})

    return TableResponse(table_head=table_head, table_datas=table_datas)
@router.get("/response_dashboard/report_summary")
def get_report_summary(db: Session = Depends(get_db)):
    now = datetime.now()
    start_of_current_month = datetime(now.year, now.month, 1)
    
    # Next month
    if now.month == 12:
        start_of_next_month = datetime(now.year + 1, 1, 1)
    else:
        start_of_next_month = datetime(now.year, now.month + 1, 1)

    # Previous month
    if now.month == 1:
        start_of_prev_month = datetime(now.year - 1, 12, 1)
    else:
        start_of_prev_month = datetime(now.year, now.month - 1, 1)
    
    end_of_prev_month = start_of_current_month

    # Get current month data
    current_total = db.query(func.count(ResponseReport.id)).filter(
        ResponseReport.date_time >= start_of_current_month,
        ResponseReport.date_time < start_of_next_month
    ).scalar()

    current_completed = db.query(func.count(ResponseReport.id)).filter(
  ResponseReport.date_time >= start_of_current_month,
        ResponseReport.date_time < start_of_next_month,
        func.lower(ResponseReport.status) == "completed"
    ).scalar()

    current_started = db.query(func.count(ResponseReport.id)).filter(
        ResponseReport.date_time >= start_of_current_month,
        ResponseReport.date_time < start_of_next_month,
        func.lower(ResponseReport.status) == "started"
    ).scalar()

    # Get previous month data
    prev_total = db.query(func.count(ResponseReport.id)).filter(
        ResponseReport.date_time >= start_of_prev_month,
        ResponseReport.date_time < end_of_prev_month
    ).scalar()

    prev_completed = db.query(func.count(ResponseReport.id)).filter(
        ResponseReport.date_time >= start_of_prev_month,
        ResponseReport.date_time < end_of_prev_month,
        func.lower(ResponseReport.status) == "completed"
    ).scalar()

    prev_started = db.query(func.count(ResponseReport.id)).filter(
        ResponseReport.date_time >= start_of_prev_month,
        ResponseReport.date_time < end_of_prev_month,
        func.lower(ResponseReport.status) == "started"
    ).scalar()

    # Function to calculate change
    def compare(current, previous):
        if previous == 0:
            if current == 0:
                return {"diff": " ", "percent": "0%"}
            else:
                return {"diff": "+", "percent": "100%"}
        change = current - previous
        if change > 0:
            sign = "+"
        elif change < 0:
            sign = "-"
        else:
            sign = " "
        percent = abs(change) / previous * 100

        return {"diff": sign, "percent": f"{percent:.1f}%"}

    return {
        "month": now.strftime("%B %Y"),
        "total_reports": current_total,
        "completed": current_completed,
        "started": current_started,
        "comparison": {
            "total_reports_change": compare(current_total, prev_total),
            "completed_change": compare(current_completed, prev_completed),
            "started_change": compare(current_started, prev_started)
        }
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
            extract("month", ModalityDistribution.date_time) == current_month
        )
        .group_by(ModalityDistribution.modality_type)
        .all()
    )

    if not results:
        # Return empty chart structure
        return {
            "labels": None,
            "datasets": None        
        }

    # Prepare the chart data
    labels = [r.modality_type for r in results]
    data = [r.count for r in results]
    
    # Optional: Assign colors dynamically or map known labels to colors
    color_map = {
        "Cash": "#44EB6E",
        "InKind": "#4468EB",
        "Services": "#EB4D44"
    }
    backgroundColor = [color_map.get(label, "#CCCCCC") for label in labels]  # fallback color

    return {
        "labels": labels,
        "datasets": [
            {
                "label": "Modality Distribution",
                "data": data,
                "backgroundColor": backgroundColor,
                "borderWidth": 1,
            }
        ]
    }

@router.get("/response_dashboard/in_kind_monitoring", response_model = InKindMonitoringSummary)
def get_in_kind_monitoring(db: Session = Depends(get_db)):
    add_sum = (
        db.query(func.coalesce(func.sum(InKindMonitoring.quantity),0))
        .filter(InKindMonitoring.record_type == "Add")
        .scalar()
    )
    in_transit_sum =(
        db.query(func.coalesce(func.sum(InKindMonitoring.quantity),0))
        .filter(InKindMonitoring.record_type == "In-Transit")
        .scalar()
    )
    delivered_sum = (        
        db.query(func.coalesce(func.sum(InKindMonitoring.quantity),0))
        .filter(InKindMonitoring.record_type == "Delivered")
        .scalar()
    )
    available = add_sum - (in_transit_sum + delivered_sum)

    return{
        "available_relief_packs": int(available),
        "currently_in_transit": int(in_transit_sum),
        "already_distributed": int(delivered_sum),
    }
@router.get("/response_dashboard/raised_budget", response_model=LineChartData)
def get_raised_budget(db: Session = Depends(get_db)):
    # Subquery: Get the latest datetime for each day
    subquery = (
        db.query(
            cast(ResponseReportBudget.date_time, Date).label("date"),
            func.max(ResponseReportBudget.date_time).label("latest_dt")
        )
        .group_by(cast(ResponseReportBudget.date_time, Date))
        .subquery()
    )

    # Alias the main table for joining
    budget_alias = aliased(ResponseReportBudget)

    # Join the subquery to the main table on the latest datetime
    results = (
        db.query(
            cast(budget_alias.date_time, Date).label("date"),
            budget_alias.total_amount
        )
        .join(
            subquery,
            (cast(budget_alias.date_time, Date) == subquery.c.date) &
            (budget_alias.date_time == subquery.c.latest_dt)
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
        ]
    }


@router.get("/response_dashboard/spending_breakdown", response_model=BarChartData)
def get_spending_breakdown(db: Session = Depends(get_db)):
    # Sum amounts grouped by record type, excluding 'Add'
    results = (
        db.query(
            ResponseReportBudget.budget_record_type,
            func.sum(ResponseReportBudget.amount).label("total")
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
    background_colors = colors[:len(data)]

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
