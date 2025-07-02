from crud import delete
from fastapi import APIRouter
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from data_schemas.report_schema import TableResponse, Cell
from schemas import DemandAndResponseOut, DemandAndResponseCreate
from database import get_db 
from crud import delete, create_demand_and_response_record
from models import  DemandAndResponse  # no Role import datetime

router = APIRouter(
    tags=["demand_and_response"]
)


@router.get("/response_dashboard/demand_and_response/list_view", response_model=TableResponse)
def get_table(db: Session = Depends(get_db)):
    # Table header remains the same
    table_head = [
        {"text": "Last Updated", "width": "200px"},
        {"text": "Title", "width": "250px"},
        {"text": "Address", "width": "250px"},
        {"text": "Lat", "width": "150px"},
        {"text": "Long", "width": "150px"},
        {"text": "Status", "width": "150px"},
        {"text": "Needs", "width": "400px"},
        {"text": "Priority", "width": "150px"},
        {"text": "Action", "width": "150px"}
    ]

    # Query all reports (limit if needed)
    reports = db.query(DemandAndResponse).order_by(DemandAndResponse.last_updated.desc()).all()

    table_datas = []
    for report in reports:
        row_data = [
            Cell(
                type="Hidden",  # Custom type handled in frontend
                text="1",
                font_weight=0,
                color="#000",
                width="0px"
            ),
            Cell(
                type="Text",
                text="Test",    #report.date_time.strftime("%B %d, %Y"),  # format date nicely
                font_weight=500,
                color="#000",
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

@router.post("/response_dashboard/demand_and_response/add_record", response_model = DemandAndResponseOut)
def add_response_report(record: DemandAndResponseCreate, db: Session = Depends(get_db)):
    return create_demand_and_response_record(db, record);

@router.delete("/response_dashboard/demand_and_response/delete_report/{report_id}", response_model=dict)
def delete_response_report(report_id: int, db: Session = Depends(get_db)):
    deleted_report = delete(db, DemandAndResponse, report_id)
    if not deleted_report:
        raise HTTPException(status_code=400, detail="Response report not found.")
    return {"message": f"Response report with ID {report_id} deleted successfully."}
@router.put("/response_dashboard/demand_and_response/update_report/{report_id}")
def update_report(report_id: int, update: DemandAndResponseCreate, db: Session = Depends(get_db)):
    report = db.query(DemandAndResponse).get(report_id);

    if not report:
        raise HTTPException(status_code=404, detail="Response record doesn't exist")

    db.commit()
    db.refresh(report)

    return {"detail": "Report updated succesfully", "report": report}
