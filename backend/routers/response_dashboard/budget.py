from crud import delete
from fastapi import APIRouter, Query
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from data_schemas.report_schema import TableResponse, Cell
from schemas import ResponseDashboardBudgetOut, ResponseDashboardBudgetCreate
from database import get_db
from crud import delete, create_response_dashboard_budget_create
from models import ResponseReportBudget  # no Role import datetime
from routers.role_checker import RoleChecker
import math

router = APIRouter(
    tags=["budget_record"],
    dependencies=[Depends(RoleChecker(["operations admin", "superadmin", "lgu officer"]))],
)


def getDefaultPage(page):
    return math.floor((page - 1) / 100) * 100 + 1


@router.get("/response_dashboard/budget_record/get_list", response_model=TableResponse)
def get_budget_table(
    db: Session = Depends(get_db), page: int = Query(1, ge=1), Date: str = "desc"
):
    # Table header remains the same

    page = getDefaultPage(page)

    offset = (page - 1) * 10

    table_head = [
        {"text": "Date", "width": "150px", "action": "Sort"},
        {"text": "Record Type", "width": "250px"},
        {"text": "Amount", "width": "150px"},
        {"text": "Total Amount", "width": "150px"},
        {"text": "Actions", "width": "150px"},
    ]

    order = (
        ResponseReportBudget.date_time.desc()
        if Date == "desc"
        else ResponseReportBudget.date_time.asc()
    )
    # Query all reports (limit if needed)
    reports = (
        db.query(ResponseReportBudget).order_by(order).limit(100).offset(offset).all()
    )

    table_datas = []

    pageCount = page
    pages = {"page": pageCount, "row": []}
    for report in reports:
        if len(pages["row"]) == 10:
            table_datas.append(pages)
            pageCount += 1
            pages = {"page": pageCount, "row": []}
        row_data = [
            Cell(
                type="Hidden",  # Custom type handled in frontend
                text=str(report.id),
                font_weight=0,
                color="#000",
                width="0px",
            ),
            Cell(
                type="Text",
                text=report.date_time.strftime("%B %d, %Y"),  # format date nicely
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=report.budget_record_type,
                font_weight=500,
                color="#000",
                width="250px",
            ),
            Cell(
                type="Text",
                text=str(report.amount),
                font_weight=700,
                color="#000",  # color green if completed
                width="150px",
            ),
            Cell(
                type="Text",
                text=str(report.total_amount),
                font_weight=700,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Button",
                text="View",
                font_weight=500,
                color="#fff",
                background_color="#749AB6",
                container_width="150px",
                button_width="120px",
            ),
        ]
        pages["row"].append({"data": row_data})
    if pages["row"]:
        table_datas.append(pages)
    count = db.query(ResponseReportBudget).count()
    return TableResponse(table_head=table_head, table_datas=table_datas, count=count)


@router.post(
    "/response_dashboard/budget_record/add_record",
    response_model=ResponseDashboardBudgetOut,
)
def add_budget_record(
    record: ResponseDashboardBudgetCreate, db: Session = Depends(get_db)
):
    return create_response_dashboard_budget_create(db, record)


@router.delete(
    "/response_dashboard/budget_record/delete_record/{record_id}", response_model=dict
)
def delete_budget_record(record_id: int, db: Session = Depends(get_db)):
    deleted_report = delete(db, ResponseReportBudget, record_id)
    if not deleted_report:
        raise HTTPException(status_code=400, detail="Response report not found.")
    return {"message": f"Record with ID {record_id} deleted successfully."}


@router.put("/response_dashboard/budget_record/update_record/{record_id}")
def update_budget_record(
    record_id: int, update: ResponseDashboardBudgetCreate, db: Session = Depends(get_db)
):
    record = db.query(ResponseReportBudget).get(record_id)

    if not record:
        raise HTTPException(status_code=404, detail="Response record doesn't exist")
    if update.budget_record_type is not None:
        record.budget_record_type = update.budget_record_type
    if update.amount is not None:
        record.amount = update.amount

    db.commit()
    db.refresh(record)

    return {"detail": "Record updated succesfully", "record": record}
