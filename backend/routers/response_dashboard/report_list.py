from crud import delete
from fastapi import APIRouter
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from data_schemas.report_schema import TableResponse, Cell
from schemas import ResponseReportOut, ResponseReportCreate
from database import get_db 
from crud import delete, create_response_report
from models import  ResponseReport  # no Role import datetime

router = APIRouter(
    tags=["report_list"]
)


@router.get("/report_list", response_model=TableResponse)
def get_table(db: Session = Depends(get_db)):
    # Table header remains the same
    table_head = [
        {"text": "Date", "width": "150px"},
        {"text": "Report Type", "width": "250px"},
        {"text": "Status", "width": "150px"},
        {"text": "Actions", "width": "150px"},
    ]

    # Query all reports (limit if needed)
    reports = db.query(ResponseReport).order_by(ResponseReport.date_time.desc()).all()

    table_datas = []
    for report in reports:
        row_data = [
            Cell(
                type="Hidden",  # Custom type handled in frontend
                text=str(report.id),
                font_weight=0,
                color="#000",
                width="0px"
            ),
            Cell(
                type="Text",
                text=report.date_time.strftime("%B %d, %Y"),  # format date nicely
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
                color="#22A900" if report.status.lower() == "completed" else "#000",  # color green if completed
                width="150px"
            ),
            Cell(
                type="Button",
                text="View",
                font_weight=500,
                color="#fff",
                background_color="#749AB6",
                container_width="150px",
                button_width="120px"
            )
        ]
        table_datas.append({"data": row_data})

    return TableResponse(table_head=table_head, table_datas=table_datas)

@router.post("/response_dashboard/report_list/add_report", response_model = ResponseReportOut)
def add_response_report(report: ResponseReportCreate, db: Session = Depends(get_db)):
    return create_response_report(db, report);

@router.delete("/response_dashboard/report_list/delete_report/{report_id}", response_model=dict)
def delete_response_report(report_id: int, db: Session = Depends(get_db)):
    deleted_report = delete(db, ResponseReport, report_id)
    if not deleted_report:
        raise HTTPException(status_code=400, detail="Response report not found.")
    return {"message": f"Response report with ID {report_id} deleted successfully."}
@router.put("/response_dashboard/report_list/update_report/{report_id}")
def update_report(report_id: int, update: ResponseReportCreate, db: Session = Depends(get_db)):
    report = db.query(ResponseReport).get(report_id);

    if not report:
        raise HTTPException(status_code=404, detail="Response record doesn't exist")
    if update.report_type is not None:
        report.report_type = update.report_type
    if update.status is not None:
        report.status = update.status

    db.commit()
    db.refresh(report)

    return {"detail": "Report updated succesfully", "report": report}
