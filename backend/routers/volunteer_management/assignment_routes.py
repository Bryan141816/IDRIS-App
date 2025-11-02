import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from routers.role_checker import RoleChecker
from datetime import datetime
from zoneinfo import ZoneInfo
from create_notification import send_notification
from models import IndividualVolunteer, OrganizationVolunteer, Task, Assignment

from data_schemas.assignment_schema import (
    TaskCreate, TaskReadWithStats,
    AssignmentCreate, AssignmentRead, AssignmentStatusUpdate
)
from crud_functions.volunteer_management.assignment_crud import AssignmentCRUD as CRUD

router_admin = APIRouter(
    dependencies=[Depends(RoleChecker(["operations admin", "superuser", "admin", "generic","superadmin"]))],
)

def _resolve_user_id_for_assignment(db: Session, a):
    # Individual
    if getattr(a, "individual_volunteer_id", None):
        iv = db.get(IndividualVolunteer, a.individual_volunteer_id)
        if iv and getattr(iv, "user_id", None):
            display_name = getattr(iv, "first_name", None) or "Volunteer"
            return str(iv.user_id), "individual", display_name

    # Organization
    if getattr(a, "organization_volunteer_id", None):
        ov = db.get(OrganizationVolunteer, a.organization_volunteer_id)
        if ov and getattr(ov, "user_id", None):
            display_name = getattr(ov, "organization_name", None) or getattr(ov, "name", None) or "Organization"
            return str(ov.user_id), "organization", display_name

    return None, None, None

def _resolve_task_title(db: Session, task_id: int) -> str:
    t = db.get(Task, task_id)
    return getattr(t, "title", None) or f"Program/Event"

async def _notify_assignment(db: Session, a, title: str, message_tmpl: str, url_redirect: str = "/assignment/programs"):
    user_id, vtype, display_name = _resolve_user_id_for_assignment(db, a)
    if not user_id:
        return

    task_title = _resolve_task_title(db, a.task_id)
    ph_tz = ZoneInfo("Asia/Manila")
    now_ph = datetime.now(ph_tz)

    message = message_tmpl.format(task_title=task_title, name=display_name)

    payload = {
        "to": user_id,
        "from_origin": "volunteer_assignment",
        "title": title,
        "message": message,
        "url_redirect": url_redirect,
        "isRead": False,
        "date": now_ph,
    }
    await send_notification(db, payload)


@router_admin.post("/programs", tags=["Programs/Events"], response_model=TaskReadWithStats)
def create_program(task: TaskCreate, db: Session = Depends(get_db)):
    task_obj = CRUD.create_task_with_event(db, task)
    return {
        "id": task_obj.id,
        "event_id": task_obj.event_id,
        "title": task_obj.title,
        "description": task_obj.description,
        "location": task_obj.location,
        "start_at": getattr(task_obj, "start_at", None),
        "end_at": getattr(task_obj, "end_at", None),
        "max_volunteers": task_obj.max_volunteers,
        "required_skills": getattr(task_obj, "required_skills", None),
        "created_at": task_obj.created_at,
        "lifecycle": getattr(task_obj, "lifecycle", "incoming"),
        "current_count": 0,
        "slot_count": 0,
        "is_full": False,
        "assigned_volunteer_ids": [],
    }

@router_admin.get("/programs", tags=["Programs/Events"], response_model=List[TaskReadWithStats])
def list_programs(db: Session = Depends(get_db)):
    tasks = CRUD.list_tasks_with_stats(db)

    result = []
    for task in tasks:
        assignments = db.query(Assignment).filter(Assignment.task_id == task["id"]).all()

        total_volunteers = sum(
            getattr(a, "volunteer_count", None) or 1
            for a in assignments
        )

        task_dict = dict(task)
        task_dict["current_count"] = total_volunteers
        task_dict["slot_count"] = len(assignments)
        task_dict["is_full"] = total_volunteers >= task_dict.get("max_volunteers", 0)

        assignments_list = [
            {
                "id": a.id,
                "task_id": a.task_id,
                "volunteer_count": getattr(a, "volunteer_count", None) or 1,
                "organization_volunteer_id": a.organization_volunteer_id,
                "individual_volunteer_id": a.individual_volunteer_id,
                "status": a.status.value if hasattr(a.status, "value") else a.status,
                "notes": a.notes,
                "created_at": a.created_at.isoformat() if isinstance(a.created_at, datetime) else str(a.created_at),
                "updated_at": a.updated_at.isoformat() if isinstance(a.updated_at, datetime) else str(a.updated_at),
            }
            for a in assignments
        ]

        task_dict["assignments"] = assignments_list

        result.append(task_dict)

    # ✅ ADD DEBUG LOGGING
    print("\n=== FINAL RESULT TO BE RETURNED ===")
    print(f"Result length: {len(result)}")
    if result:
        print(f"First program assignments: {json.dumps(result[0].get('assignments', []), indent=2, default=str)}")
    print("=== END DEBUG ===\n")

    return result



@router_admin.post(
    "/programs/{task_id}/assignments",
    tags=["Programs/Events"],
    response_model=AssignmentRead
)
async def create_assignment(task_id: int, req: AssignmentCreate, db: Session = Depends(get_db)):
    # ✅ Pass volunteer_count to CRUD function
    a = CRUD.assign_to_task(
        db,
        task_id=task_id,
        individual_volunteer_id=req.individual_volunteer_id,
        organization_volunteer_id=req.organization_volunteer_id,
        volunteer_count=req.volunteer_count,  # ✅ Add this
        status=req.status,
    )

    await _notify_assignment(
        db,
        a,
        title="You have been assigned",
        message_tmpl="Hi {name}, you have been assigned to {task_title}."
    )

    return {
        "id": a.id,
        "task_id": a.task_id,
        "individual_volunteer_id": a.individual_volunteer_id,
        "organization_volunteer_id": a.organization_volunteer_id,
        "volunteer_count": getattr(a, "volunteer_count", None),  # ✅ Add this
        "status": a.status.value if hasattr(a.status, "value") else a.status,
        "notes": a.notes,
        "created_at": a.created_at,
        "updated_at": a.updated_at,
    }

@router_admin.patch(
    "/assignments/{assignment_id}/status",
    tags=["Programs/Events"],
    response_model=AssignmentRead
)
async def update_assignment_status(assignment_id: int, payload: AssignmentStatusUpdate, db: Session = Depends(get_db)):
    a = CRUD.update_assignment_status(db, assignment_id, payload.status)

    new_status = a.status.value if hasattr(a.status, "value") else a.status
    await _notify_assignment(
        db,
        a,
        title="Assignment status updated",
        message_tmpl=f"Your assignment for {{task_title}} is now {new_status}."
    )

    return {
        "id": a.id,
        "task_id": a.task_id,
        "individual_volunteer_id": a.individual_volunteer_id,
        "organization_volunteer_id": a.organization_volunteer_id,
        "volunteer_count": getattr(a, "volunteer_count", None),  # ✅ Add this
        "status": new_status,
        "notes": a.notes,
        "created_at": a.created_at,
        "updated_at": a.updated_at,
    }


@router_admin.get(
    "/programs/{task_id}/assignments",
    tags=["Programs/Events"],
    response_model=List[AssignmentRead]
)
def list_task_assignments(task_id: int, db: Session = Depends(get_db)):
    items = CRUD.list_assignments_for_task(db, task_id)
    return [
        {
            "id": a.id,
            "task_id": a.task_id,
            "individual_volunteer_id": a.individual_volunteer_id,
            "organization_volunteer_id": a.organization_volunteer_id,
            "volunteer_count": getattr(a, "volunteer_count", None),  # ✅ Add this
            "status": a.status.value if hasattr(a.status, "value") else a.status,
            "notes": a.notes,
            "created_at": a.created_at,
            "updated_at": a.updated_at,
        }
        for a in items
    ]

@router_admin.delete("/assignments/{assignment_id}", tags=["Programs/Events"])
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    CRUD.unassign(db, assignment_id)
    return {"ok": True}

# Final router to include in main.py
router = APIRouter()
router.include_router(router_admin, prefix="/assignment")
