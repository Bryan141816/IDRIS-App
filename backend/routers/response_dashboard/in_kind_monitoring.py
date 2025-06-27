from crud import delete
from fastapi import APIRouter
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from data_schemas.report_schema import TableResponse, Cell
from schemas import InKindMonitoringCreate, InKindMonitoringOut
from database import get_db 
from crud import delete, create_in_kind_monitoring_record
from models import  InKindMonitoring  # no Role import datetime
from datetime import datetime, timezone
router = APIRouter(
    tags=["in_kind_monitoring"]
)


@router.get("/response_dashboard/in_kind_monitoring/record_list", response_model=TableResponse)
def get_modality_table(db: Session = Depends(get_db)):
    # Table header remains the same
    table_head = [
        {"text": "Date", "width": "150px"},
        {"text": "Quantity", "width": "150px"},
        {"text": "Type", "width": "150px"},
        {"text": "Actions","width": "150px"}
    ]

    # Query all reports (limit if needed)
    reports = db.query(InKindMonitoring).order_by(InKindMonitoring.date_time.desc()).all()

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
                text=str(report.quantity),
                font_weight=500,
                color="#000",
                width="150px"
            ),
            Cell(
                type="Text",
                text=report.record_type,
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

@router.post("/response_dashboard/in_kind_monitoring/add_record", response_model = InKindMonitoringOut)
def add_modality_record(modality_report: InKindMonitoringCreate, db: Session = Depends(get_db)):
    return create_in_kind_monitoring_record(db, modality_report);

@router.delete("/response_dashboard/in_kind_monitoring/delete_record/{record_id}", response_model=dict)
def delete_modality_report(record_id: int, db: Session = Depends(get_db)):
    deleted_report = delete(db, InKindMonitoring, record_id)
    if not deleted_report:
        raise HTTPException(status_code=400, detail="Modality record not found.")
    return {"message": f"Modality Record with ID {record_id} deleted successfully."}

@router.put("/response_dashboard/in_kind_monitoring/update_record/{record_id}")
def update_modality_record(record_id: int, update: InKindMonitoringCreate, db: Session = Depends(get_db)):
    record = db.query(InKindMonitoring).get(record_id);
    print(update);
    if not record:
        raise HTTPException(status_code=404, detail="Modality record doesn't exist")
    if update.modality_type is not None:
        record.modality_type = update.modality_type

    db.commit()
    db.refresh(record)

    return {"detail": "Modality record updated succesfully", "report": record}
@router.put("/response_dashboard/in_kind_monitoring/mark_as_delivered/{record_id}")
def delivered_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(InKindMonitoring).get(record_id);
    if not record:
        raise HTTPException(status_code=404, detail="Modality record doesn't exist")
    record.record_type = "Delivered"
    record.date_time =  datetime.now(timezone.utc)
    db.commit()
    db.refresh(record)

    return {"detail": "Modality record updated succesfully", "report": record}

