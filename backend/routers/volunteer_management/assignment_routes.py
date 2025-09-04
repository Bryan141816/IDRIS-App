
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from data_schemas.assignment_schema import TaskCreate, TaskRead
from crud_functions.volunteer_management import AssignmentCRUD as CRUD
from routers.role_checker import RoleChecker  # reuse your RBAC

router_admin = APIRouter(
    dependencies=[Depends(RoleChecker(["operations admin", "superuser", "admin"]))],
)

@router_admin.post("/programs", response_model=TaskRead, tags=["Programs/Events"])
def create_program(task: TaskCreate, db: Session = Depends(get_db)):
    task_obj = CRUD.create_task_with_event(db, task)
    return task_obj

@router_admin.get("/programs", response_model=List[TaskRead], tags=["Programs/Events"])
def list_programs(db: Session = Depends(get_db)):
    return CRUD.list_tasks(db)

# Final router to include in main.py
router = APIRouter()
router.include_router(router_admin, prefix="/assignment")
