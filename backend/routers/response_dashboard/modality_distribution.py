from crud import delete
from fastapi import APIRouter, Query
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from data_schemas.report_schema import TableResponse, Cell
from schemas import ModalityDistributionOut, ModalityDistributionCreate
from database import get_db
from crud import delete, create_modality_distribution_record
from models import ModalityDistribution  # no Role import datetime
from routers.role_checker import RoleChecker
import math

router = APIRouter(
    tags=["modality_distribution"],
    dependencies=[Depends(RoleChecker(["operations admin"]))],
)


def getDefaultPage(page):
    return math.floor((page - 1) / 100) * 100 + 1


@router.get(
    "/response_dashboard/modality_distribution/record_list",
    response_model=TableResponse,
)
def get_modality_table(
    db: Session = Depends(get_db), page: int = Query(1, ge=1), Date: str = "desc"
):

    page = getDefaultPage(page)

    offset = (page - 1) * 10

    print(page)
    # Table header remains the same
    table_head = [
        {"text": "Date", "width": "150px", "action": "Sort"},
        {"text": "Modality Type", "width": "250px"},
        {"text": "Actions", "width": "150px"},
    ]
    order = (
        ModalityDistribution.date_time.desc()
        if Date == "desc"
        else ModalityDistribution.date_time.asc()
    )
    # Query all reports (limit if needed)
    reports = (
        db.query(ModalityDistribution).order_by(order).limit(100).offset(offset).all()
    )
    print(len(reports))

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
                text=report.modality_type,
                font_weight=500,
                color="#000",
                width="250px",
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

    count = db.query(ModalityDistribution).count()
    return TableResponse(table_head=table_head, table_datas=table_datas, count=count)


@router.post(
    "/response_dashboard/modality_distribution/add_record",
    response_model=ModalityDistributionOut,
)
def add_modality_record(
    modality_report: ModalityDistributionCreate, db: Session = Depends(get_db)
):
    return create_modality_distribution_record(db, modality_report)


@router.delete(
    "/response_dashboard/modality_distribution/delete_record/{record_id}",
    response_model=dict,
)
def delete_modality_report(record_id: int, db: Session = Depends(get_db)):
    deleted_report = delete(db, ModalityDistribution, record_id)
    if not deleted_report:
        raise HTTPException(status_code=400, detail="Modality record not found.")
    return {"message": f"Modality Record with ID {record_id} deleted successfully."}


@router.put("/response_dashboard/modality_distribution/update_record/{record_id}")
def update_modality_record(
    record_id: int, update: ModalityDistributionCreate, db: Session = Depends(get_db)
):
    record = db.query(ModalityDistribution).get(record_id)
    print(update)
    if not record:
        raise HTTPException(status_code=404, detail="Modality record doesn't exist")
    if update.modality_type is not None:
        record.modality_type = update.modality_type

    db.commit()
    db.refresh(record)

    return {"detail": "Modality record updated succesfully", "report": record}
