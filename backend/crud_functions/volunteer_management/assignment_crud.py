# app/crud_functions/assignment_crud.py

from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import date

from models_assignment import Event, Task
from data_schemas.assignment_schema import TaskCreate, TaskRead

def _skills_list_to_csv(skills: Optional[List[str]]) -> Optional[str]:
    if skills is None:
        return None
    items = [s.strip() for s in skills if isinstance(s, str)]
    out: List[str] = []
    for s in items:
        if s and s not in out:
            out.append(s)
    return ",".join(out) if out else None


class AssignmentCRUD:
    @staticmethod
    def create_task_with_event(db: Session, payload: TaskCreate) -> Task:
        """
        Create an Event (if needed) and a Task underneath it.
        """
        try:
            # If FE passed event title, reuse or create; else create with task title
            event_title = payload.event_title or payload.title
            event = (
                db.query(Event)
                .filter(Event.title == event_title)
                .first()
            )
            if not event:
                event = Event(
                    title=event_title,
                    description=payload.event_description,
                    location=payload.event_location or payload.location,
                    event_date=payload.event_date or payload.task_date,
                )
                db.add(event)
                db.flush()  # get event.id

            task = Task(
                event_id=event.id,
                title=payload.title,
                description=payload.description,
                location=payload.location,
                task_date=payload.task_date,
                max_volunteers=payload.max_volunteers,
                required_skills=_skills_list_to_csv(payload.required_skills),
            )
            db.add(task)
            db.commit()
            db.refresh(task)
            return task
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Error creating program: {e}")

    @staticmethod
    def list_tasks(db: Session) -> List[Task]:
        return db.query(Task).order_by(Task.created_at.desc()).all()

    @staticmethod
    def get_task(db: Session, task_id: int) -> Optional[Task]:
        return db.query(Task).filter(Task.id == task_id).first()
