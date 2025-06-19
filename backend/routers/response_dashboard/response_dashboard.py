from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session
from data_schemas.report_schema import TableResponse, Cell
from data_schemas.charts_schema import PieChartData, LineChartData, BarChartData
from data_schemas.in_kind_monitoring_schema import InKindMonitoring
from database import  get_db
from models import  ResponseReport  # no Role import
from datetime import datetime
from sqlalchemy import func

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

@router.get("/response_dashboard/modality_chart", response_model = PieChartData)
def get_modality_chart():
    return {
        "labels": ["Cash", "Inkind", "Services"],
        "datasets": [
            {
                "label": "Modality Distribution",
                "data": [12, 19,3],
                "backgroundColor": ["#44EB6E", "#4468EB", "#EB4D44"],
                "borderWidth": 1,            
            }
        ]
    }

@router.get("/response_dashboard/in_kind_monitoring", response_model = InKindMonitoring)
def get_in_kind_monitoring():
    return{
        "available_relief_packs": 5000,
        "currently_in_transit": 2000,
        "already_distributed": 10000,
        "remaining_days": 7
    }
@router.get("/response_dashboard/raised_budget", response_model = LineChartData)
def get_raised_budget():
    return{
        "labels": [
            "April 10",
            "April 11",
            "April 12",
            "April 13",
            "April 14",
            "April 15",
            "April 16",
            "April 17",
            "April 18",
            "April 19",        
        ],
        "datasets":[
            {
                "label": "Budget",
                "data": [500, 700, 800, 1500, 1700, 2000, 2500, 3000, 3500, 1000],
                "fill": False,
                "borderColor": "#fcb814",
                "backgroundColor": "rgba(54, 162, 235, 0.2)",
                "tension": 0.4,
            }
        ]
    }
@router.get("/response_dashboard/spending_breakdown", response_model = BarChartData)
def get_spending_breakdown():
    return {
        "labels": ["Food Supplies", "Medical Aid", "Logistics", "Miscellaneous"],
        "datasets": [
            {
                "label": "",
                "data": [120, 150, 80, 100],
                "backgroundColor": ["#44EB6E", "#4468EB", "#EB4D44", "#fcb814"],
                "borderRadius": 5,
            },
        ],
    }
