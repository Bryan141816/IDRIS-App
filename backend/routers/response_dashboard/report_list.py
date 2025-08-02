from crud import delete
from fastapi import APIRouter, Query
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from data_schemas.report_schema import TableResponse, Cell
from schemas import ResponseReportOut, ResponseReportCreate
from database import get_db
from crud import delete, create_response_report
from models import ResponseReport  # no Role import datetime
from routers.role_checker import RoleChecker
import math

router = APIRouter(
    tags=["report_list"],
    dependencies=[Depends(RoleChecker(["operations admin"]))],
)


def getDefaultPage(page):
    return math.floor((page - 1) / 100) * 100 + 1


@router.get("/report_list", response_model=TableResponse)
def get_table(
    db: Session = Depends(get_db), page: int = Query(1, ge=1), Date: str = "desc"
):
    # Table header remains the same
    page = getDefaultPage(page)

    offset = (page - 1) * 10
    table_head = [
        {"text": "Date", "width": "150px", "action": "Sort"},
        {"text": "Report Type", "width": "250px"},
        {"text": "Status", "width": "150px"},
        {"text": "Actions", "width": "150px"},
    ]
    # Query all reports (limit if needed)
    order = (
        ResponseReport.date_time.desc()
        if Date == "desc"
        else ResponseReport.date_time.asc()
    )
    reports = db.query(ResponseReport).order_by(order).limit(100).offset(offset).all()
    print(len(reports))
    table_datas = []

    pageCount = page
    pages = {"page": pageCount, "row": []}

    for report in reports:

        if len(pages["row"]) == 10:
            table_datas.append(pages)  # Save the full page
            pageCount += 1
            pages = {"page": pageCount, "row": []}  # New page

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

        # ✅ Append last page if it has rows
    if pages["row"]:
        table_datas.append(pages)

    count = db.query(ResponseReport).count()
    return TableResponse(table_head=table_head, table_datas=table_datas, count=count)


@router.post(
    "/response_dashboard/report_list/add_report", response_model=ResponseReportOut
)
def add_response_report(report: ResponseReportCreate, db: Session = Depends(get_db)):
    return create_response_report(db, report)


@router.delete(
    "/response_dashboard/report_list/delete_report/{report_id}", response_model=dict
)
def delete_response_report(report_id: int, db: Session = Depends(get_db)):
    deleted_report = delete(db, ResponseReport, report_id)
    if not deleted_report:
        raise HTTPException(status_code=400, detail="Response report not found.")
    return {"message": f"Response report with ID {report_id} deleted successfully."}


@router.put("/response_dashboard/report_list/update_report/{report_id}")
def update_report(
    report_id: int, update: ResponseReportCreate, db: Session = Depends(get_db)
):
    report = db.query(ResponseReport).get(report_id)

    if not report:
        raise HTTPException(status_code=404, detail="Response record doesn't exist")
    if update.report_type is not None:
        report.report_type = update.report_type
    if update.status is not None:
        report.status = update.status

    db.commit()
    db.refresh(report)

    return {"detail": "Report updated succesfully", "report": report}
