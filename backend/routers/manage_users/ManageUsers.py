from crud import delete
from fastapi import APIRouter, Query
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from data_schemas.report_schema import TableResponse, Cell
from schemas import ResponseReportOut, ResponseReportCreate
from database import get_db
from crud import delete, create_response_report
from models import User
from routers.role_checker import RoleChecker, GetUserRoles
import math
from sqlalchemy import or_
from typing import List
from pydantic import BaseModel
from routers.GetUserId import GetUserId
from auth import create_token
from email_handler import send_admin_activation_email
from crud_functions.utils import uid_from_string

router = APIRouter(
    tags=["user_management"],
)


def getDefaultPage(page):
    return math.floor((page - 1) / 100) * 100 + 1


@router.get("/user_list", response_model=TableResponse)
def get_table(
    user_id: int = Depends(GetUserId()),
    db: Session = Depends(get_db),
    user_role: List[str] = Depends(GetUserRoles),
    page: int = Query(1, ge=1),
    UserName: str = "desc",
):
    # Table header remains the same
    moderator_dict = {
        "operations": "lgu officer",
        "logistics": "disaster response admin officer",
    }

    query = db.query(User)

    if "superadmin" not in user_role:
        role = user_role[0].split()[0]  # first word of the role

        # Get moderator(s) from dictionary safely
        moderator = moderator_dict.get(role)  # returns None if key doesn't exist

        # Build filter list
        filters = []
        filters.append(User.roles.any(f"{role} admin"))

        if moderator:
            filters.append(User.roles.any(moderator))

        filters.append(User.roles.any("generic"))  # always include generic

        # Apply query only with existing filters
        query = db.query(User).filter(or_(*filters))

    page = getDefaultPage(page)
    offset = (page - 1) * 10
    table_head = [
        {"text": "Email", "width": "250px"},
        {"text": "UserName", "width": "150px", "action": "Sort"},
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

        last_row = (
            Cell(
                type="Button",
                text="View",
                font_weight=500,
                color="#fff",
                background_color="#749AB6",
                container_width="150px",
                button_width="120px",
            ),
        )

        if user_id == report.user_id:
            last_row = (
                Cell(
                    type="Text",
                    text="Currrent Account",
                    font_weight=700,
                    color="#080",
                    width="150px",
                ),
            )

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
                color="#00",
                width="150px",
            ),
            Cell(
                type="Text",
                text="True" if report.is_activated else "False",
                font_weight=500,
                color="#000",
                width="150px",
            ),
            last_row[0],
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
@router.delete("/delete_user/{user_id}", response_model=dict)
def delete_response_report(user_id: int, db: Session = Depends(get_db)):
    query = db.query(User).filter(User.user_id == user_id).first()
    if not query:
        raise HTTPException(status_code=400, detail="Response report not found.")
    db.delete(query)
    db.commit()
    if not query:
        raise HTTPException(status_code=400, detail="Response report not found.")
    return {"message": f"User {user_id} deleted successfully."}


#
class UpdateUserRole(BaseModel):
    roles: str


@router.put("/update_user/{user_id}")
def update_report(user_id: int, payload: UpdateUserRole, db: Session = Depends(get_db)):
    report = db.query(User).get(user_id)
    user_type = "admin"
    if (
        payload.roles == "lgu officer"
        or payload.roles == "disaster response admin officer"
    ):
        user_type = "moderator"
    if not report:
        raise HTTPException(status_code=404, detail="Response record doesn't exist")
    if payload.roles:
        report.user_type = user_type
        report.roles = [payload.roles]

    db.commit()
    db.refresh(report)

    return {"detail": "Report updated succesfully", "user": report}


@router.post("/approve_admin/{user_id}", status_code=200)
async def approve_admin(
    user_id: str,
    db: Session = Depends(get_db),
    user_role: List[str] = Depends(GetUserRoles),
):
    if "superadmin" not in user_role:
        raise HTTPException(
            status_code=403, detail="Only superadmins can approve other admins."
        )

    user_to_approve = db.query(User).filter(User.user_id == user_id).first()

    if not user_to_approve:
        raise HTTPException(status_code=404, detail="User to approve not found.")

    if user_to_approve.user_type != "admin":
        raise HTTPException(status_code=400, detail="User is not an admin.")

    if user_to_approve.is_activated:
        raise HTTPException(
            status_code=400, detail="Admin has already been activated."
        )

    # Send activation email
    token = create_token(user_to_approve.user_id, "activation")
    await send_admin_activation_email(user_to_approve.email, token)

    return {"message": f"Activation email sent to admin {user_to_approve.username}."}
