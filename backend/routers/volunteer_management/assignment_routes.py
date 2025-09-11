from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from routers.role_checker import RoleChecker

from data_schemas.assignment_schema import (
    TaskCreate, TaskReadWithStats,
    AssignmentCreate, AssignmentRead, AssignmentStatusUpdate
)
from crud_functions.volunteer_management.assignment_crud import AssignmentCRUD as CRUD

router_admin = APIRouter(
    dependencies=[Depends(RoleChecker(["operations admin", "superuser", "admin", "generic"]))],
)

@router_admin.post("/programs", tags=["Programs/Events"], response_model=TaskReadWithStats)
def create_program(task: TaskCreate, db: Session = Depends(get_db)):
    task_obj = CRUD.create_task_with_event(db, task)
    # New task has zero assignments; build a TaskReadWithStats payload
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
    return CRUD.list_tasks_with_stats(db)

@router_admin.post(
    "/programs/{task_id}/assignments",
    tags=["Programs/Events"],
    response_model=AssignmentRead
)
def create_assignment(task_id: int, req: AssignmentCreate, db: Session = Depends(get_db)):
    a = CRUD.assign_to_task(
        db,
        task_id=task_id,
        individual_volunteer_id=req.individual_volunteer_id,
        organization_volunteer_id=req.organization_volunteer_id,
        status=req.status,  # Literal -> SQLA Enum handled in CRUD
    )
    return {
        "id": a.id,
        "task_id": a.task_id,
        "individual_volunteer_id": a.individual_volunteer_id,
        "organization_volunteer_id": a.organization_volunteer_id,
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
def update_assignment_status(assignment_id: int, payload: AssignmentStatusUpdate, db: Session = Depends(get_db)):
    a = CRUD.update_assignment_status(db, assignment_id, payload.status)
    return {
        "id": a.id,
        "task_id": a.task_id,
        "individual_volunteer_id": a.individual_volunteer_id,
        "organization_volunteer_id": a.organization_volunteer_id,
        "status": a.status.value if hasattr(a.status, "value") else a.status,
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
