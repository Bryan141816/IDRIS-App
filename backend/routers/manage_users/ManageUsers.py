from crud import delete
from fastapi import APIRouter, Query
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from data_schemas.report_schema import TableResponse, Cell
from schemas import ResponseReportOut, ResponseReportCreate
from database import get_db
from crud import delete, create_response_report
from models import User  # no Role import datetime
from routers.role_checker import RoleChecker, GetUserRoles
import math
from sqlalchemy import or_
from typing import List

router = APIRouter(
    tags=["user_management"],
)


def getDefaultPage(page):
    return math.floor((page - 1) / 100) * 100 + 1


@router.get("/user_list", response_model=TableResponse)
def get_table(
    db: Session = Depends(get_db),
    user_role: List[str] = Depends(GetUserRoles),
    page: int = Query(1, ge=1),
    UserName: str = "desc",
):
    # Table header remains the same

    query = db.query(User)

    if "super admin" not in user_role:
        role = user_role[0].split()[0]
        query = db.query(User).filter(
            or_(User.roles.contains([role]), User.roles.contains(["generic"]))
        )

    page = getDefaultPage(page)
    offset = (page - 1) * 10
    table_head = [
        {"text": "Email", "width": "250px"},
        {"text": "UserName", "width": "150px", "action": "sort"},
        {"text": "UserType", "width": "150px"},
        {"text": "Roles", "width": "150px"},
        {"text": "Is Activated", "width": "150px"},
        {"text": "Action", "width": "150px"},
    ]
    # Query all reports (limit if needed)
    order = User.username.desc() if UserName == "desc" else User.username.asc()
    reports = query.order_by(order).limit(100).offset(offset).all()
    table_datas = []

    pageCount = page
    pages = {"page": pageCount, "row": []}

    for report in reports:

        if len(pages["row"]) == 10:
            table_datas.append(pages)  # Save the full page
            pageCount += 1
            pages = {"page": pageCount, "row": []}  # New pages

        status_color = None
        status_text_color = None
        if report.status.lower() == "completed":
            status_color = "#30CB83"
            status_text_color = "#30CB83"
        elif report.status.lower() == "started":
            status_color = "#F1C40F"
            status_text_color = "#F1C40F"
        elif report.status.lower() == "filed":
            status_color = "#34495E"
            status_text_color = "#34495E"
        elif report.status.lower() == "cancelled":
            status_color = "#E74C3C"
            status_text_color = "#E74C3C"
        else:
            status_color = "#000"
        row_data = [
            Cell(
                type="Hidden",
                text=str(report.user_id),
                font_weight=0,
                color="#000",
                width="0px",
            ),
            Cell(
                type="Hidden",
                text=str(report.roles),
                font_weight=0,
                color="#000",
                width="0px",
            ),
            Cell(
                type="Text",
                text=report.email,
                font_weight=500,
                color="#000",
                width="250px",
            ),
            Cell(
                type="Text",
                text=report.username,
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=report.user_type,
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=", ".join(report.roles),
                font_weight=500,
                background_color=status_color,
                color=status_text_color,
                width="150px",
            ),
            Cell(
                type="Text",
                text="True" if report.is_activated else "False",
                font_weight=500,
                background_color=status_color,
                color=status_text_color,
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

    count = query.count()
    return TableResponse(table_head=table_head, table_datas=table_datas, count=count)


# @router.post(
#     "/response_dashboard/report_list/add_report", response_model=ResponseReportOut
# )
# def add_response_report(report: ResponseReportCreate, db: Session = Depends(get_db)):
#     return create_response_report(db, report)
#
#
# @router.delete(
#     "/response_dashboard/report_list/delete_report/{report_id}", response_model=dict
# )
# def delete_response_report(report_id: int, db: Session = Depends(get_db)):
#     deleted_report = delete(db, ResponseReport, report_id)
#     if not deleted_report:
#         raise HTTPException(status_code=400, detail="Response report not found.")
#     return {"message": f"Response report with ID {report_id} deleted successfully."}
#
#
# @router.put("/response_dashboard/report_list/update_report/{report_id}")
# def update_report(
#     report_id: int, update: ResponseReportCreate, db: Session = Depends(get_db)
# ):
#     report = db.query(ResponseReport).get(report_id)
#
#     if not report:
#         raise HTTPException(status_code=404, detail="Response record doesn't exist")
#     if update.report_type is not None:
#         report.report_type = update.report_type
#     if update.status is not None:
#         report.status = update.status
#
#     db.commit()
#     db.refresh(report)
#
#     return {"detail": "Report updated succesfully", "report": report}
