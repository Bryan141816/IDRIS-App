from crud import delete
from fastapi import APIRouter, Query
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from data_schemas.report_schema import TableResponse, Cell
from schemas import ResponseReportOut, ResponseReportCreate
from database import get_db
from models import User, AdminUserProfile
from routers.role_checker import RoleChecker, GetUserRoles
import math
from sqlalchemy import or_
from typing import List
from pydantic import BaseModel
from routers.GetUserId import GetUserId
from auth import create_token
from email_handler import send_admin_activated_email, send_admin_approved_email
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
    moderator_dict = {
        "operations": "lgu officer",
        "logistics": "disaster response admin officer",
    }

    # ✅ Load both admin_user_profile AND user_profile relationships
    query = db.query(User).options(
        joinedload(User.admin_user_profile).joinedload(AdminUserProfile.lgu),  # ← add
        joinedload(User.user_profile),
    )

    if "superadmin" not in user_role:
        role = user_role[0].split()[0]
        moderator = moderator_dict.get(role)
        filters = []
        filters.append(User.roles.any(f"{role} admin"))
        if moderator:
            filters.append(User.roles.any(moderator))
        filters.append(User.roles.any("generic"))
        query = query.filter(or_(*filters))

    page = getDefaultPage(page)
    offset = (page - 1) * 10

    table_head = [
        {"text": "Email", "width": "200px"},
        {"text": "UserName", "width": "150px", "action": "Sort"},
        {"text": "UserType", "width": "120px"},
        {"text": "Roles", "width": "150px"},
        {"text": "Status", "width": "120px"},
        {"text": "Action", "width": "100px"},
    ]

    order = User.username.desc() if UserName == "desc" else User.username.asc()
    reports = query.order_by(order).limit(100).offset(offset).all()
    table_datas = []

    pageCount = page
    pages = {"page": pageCount, "row": []}

    for report in reports:
        if len(pages["row"]) == 10:
            table_datas.append(pages)
            pageCount += 1
            pages = {"page": pageCount, "row": []}

        last_row = Cell(
            type="Button",
            text="View",
            font_weight=500,
            color="#fff",
            background_color="#749AB6",
            container_width="100px",
            button_width="80px",
        )

        if user_id == report.user_id:
            last_row = Cell(
                type="Text",
                text="Current Account",
                font_weight=700,
                color="#080",
                width="100px",
            )

        # ✅ UPDATED: Determine status with superadmin exception
        if report.user_type == "admin":
            if "superadmin" in report.roles:
                status = "Active"
                status_color = "#10b981"
            elif not report.admin_user_profile:
                status = "Incomplete Profile"
                status_color = "#f59e0b"
            elif not report.is_activated:
                status = "Pending Approval"
                status_color = "#ef4444"
            else:
                status = "Active"
                status_color = "#10b981"
        else:
            status = "Active" if report.is_activated else "Inactive"
            status_color = "#10b981" if report.is_activated else "#6b7280"

        # ✅ Collect admin profile data if available
        admin_profile_data = {}
        if report.admin_user_profile:
            lgu_obj = report.admin_user_profile.lgu
            admin_profile_data = {
                "first_name": report.admin_user_profile.first_name,
                "last_name": report.admin_user_profile.last_name,
                "employee_id_number": report.admin_user_profile.employee_idNumber,
                "department": report.admin_user_profile.department,
                "position": report.admin_user_profile.position,
                "contact_number": report.admin_user_profile.contact_number,
                "lgu_id": report.admin_user_profile.lgu_id,
                "lgu_name": lgu_obj.lgu_name if lgu_obj else None,  # ← include name
                "employee_id": report.admin_user_profile.employee_id,
            }

        # ✅ NEW: Collect generic user profile data if available
        user_profile_data = {}
        if report.user_profile:
            user_profile_data = {
                "first_name": report.user_profile.first_name,
                "last_name": report.user_profile.last_name,
                "phone_number": report.user_profile.phone_number,
                "birthday": (
                    str(report.user_profile.bday) if report.user_profile.bday else None
                ),  # ✅ Convert to string
                "gender": report.user_profile.gender,
                "address": report.user_profile.address,
                "bio": report.user_profile.bio,
                "profile_image": report.user_profile.profile_image,
            }

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
            # ✅ Store admin profile data as JSON string
            Cell(
                type="Hidden",
                text=str(admin_profile_data),
                font_weight=0,
                color="#000",
                width="0px",
            ),
            # ✅ NEW: Store user profile data as JSON string in a new hidden cell
            Cell(
                type="Hidden",
                text=str(user_profile_data),
                font_weight=0,
                color="#000",
                width="0px",
            ),
            Cell(
                type="Text",
                text=report.email,
                font_weight=500,
                color="#000",
                width="200px",
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
                width="120px",
            ),
            Cell(
                type="Text",
                text=", ".join(report.roles),
                font_weight=500,
                color="#000",
                width="150px",
            ),
            Cell(
                type="Text",
                text=status,
                font_weight=600,
                color=status_color,
                width="120px",
            ),
            last_row,
        ]
        pages["row"].append({"data": row_data})

    if pages["row"]:
        table_datas.append(pages)

    count = query.count()
    return TableResponse(table_head=table_head, table_datas=table_datas, count=count)


@router.delete("/delete_user/{user_id}", response_model=dict)
def delete_response_report(user_id: str, db: Session = Depends(get_db)):
    query = db.query(User).filter(User.user_id == user_id).first()
    if not query:
        raise HTTPException(status_code=400, detail="Response report not found.")
    db.delete(query)
    db.commit()
    if not query:
        raise HTTPException(status_code=400, detail="Response report not found.")
    return {"message": f"User {user_id} deleted successfully."}


class UpdateUserRole(BaseModel):
    roles: str


@router.put("/update_user/{user_id}")
def update_report(user_id: str, payload: UpdateUserRole, db: Session = Depends(get_db)):
    report = db.query(User).get(user_id)

    user_type = "user"
    admin_roles = [
        "logistics admin",
        "operations admin",
        "finance admin",
        "lgu officer",
    ]

    if payload.roles in admin_roles:
        user_type = "admin"
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
    """
    Superadmin approves admin account after profile review
    """
    if "superadmin" not in user_role:
        raise HTTPException(
            status_code=403, detail="Only superadmins can approve admins."
        )

    user_to_approve = db.query(User).filter(User.user_id == user_id).first()

    if not user_to_approve:
        raise HTTPException(status_code=404, detail="User not found.")

    if user_to_approve.user_type != "admin":
        raise HTTPException(status_code=400, detail="User is not an admin.")

    if user_to_approve.is_activated:
        raise HTTPException(status_code=400, detail="Admin already activated.")

    # ✅ Activate the account
    user_to_approve.is_activated = True
    db.commit()
    db.refresh(user_to_approve)

    # ✅ Send approval confirmation email
    try:
        await send_admin_approved_email(user_to_approve.email)
    except Exception as e:
        print(f"Warning: Failed to send approval email. Error: {e}")

    return {
        "message": f"Admin {user_to_approve.username} has been approved and activated."
    }
