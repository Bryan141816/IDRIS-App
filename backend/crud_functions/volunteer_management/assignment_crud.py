# app/crud_functions/volunteer_management/assignment_crud.py

from typing import Dict, List, Optional
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func

from models import (
    Event, Task, Assignment, AssignmentStatus,
    IndividualVolunteer, OrganizationVolunteer, VolunteerStatus
)
from data_schemas.assignment_schema import TaskCreate


def _skills_list_to_csv(skills: Optional[List[str]]) -> Optional[str]:
    if not skills:
        return None
    seen = set()
    out: List[str] = []
    for s in skills:
        if isinstance(s, str):
            t = s.strip()
            if t and t not in seen:
                seen.add(t)
                out.append(t)
    return ",".join(out) if out else None


# statuses that OCCUPY a slot / cause time conflicts
_SLOT_STATUSES = {AssignmentStatus.accepted, AssignmentStatus.checked_in}
# statuses you'd usually count in UI "headcount" (optional)
_UI_ACTIVE_STATUSES = {
    AssignmentStatus.applied,
    AssignmentStatus.invited,
    AssignmentStatus.accepted,
    AssignmentStatus.checked_in,
    AssignmentStatus.completed,
}


class AssignmentCRUD:
    # ----------------- TASKS / EVENTS -----------------

    @staticmethod
    def create_task_with_event(db: Session, payload: TaskCreate) -> Task:
        """
        Create (or reuse) an Event and create one Task under it.
        Supports start_at/end_at (preferred). If legacy task_date exists on your model,
        this function sets it only when present in the payload.
        """
        try:
            event_title = payload.event_title or payload.title

            event = db.query(Event).filter(Event.title == event_title).first()
            if not event:
                # derive event_date if provided or deducible
                derived_event_date = getattr(payload, "event_date", None)
                if not derived_event_date and getattr(payload, "start_at", None):
                    derived_event_date = payload.start_at.date()
                elif not derived_event_date and getattr(payload, "task_date", None):
                    derived_event_date = payload.task_date

                event = Event(
                    title=event_title,
                    description=payload.event_description,
                    location=payload.event_location or payload.location,
                    event_date=derived_event_date,
                )
                db.add(event)
                db.flush()  # event.id

            # Build task
            task_kwargs = dict(
                event_id=event.id,
                title=payload.title,
                description=payload.description,
                location=payload.location,
                max_volunteers=payload.max_volunteers,
                required_skills=_skills_list_to_csv(getattr(payload, "required_skills", None)),
            )

            # Datetimes (preferred)
            start_at = getattr(payload, "start_at", None)
            end_at = getattr(payload, "end_at", None)
            if hasattr(Task, "start_at"):
                task_kwargs["start_at"] = start_at
            if hasattr(Task, "end_at"):
                task_kwargs["end_at"] = end_at

            # Validate start/end when both present
            if start_at and end_at and start_at >= end_at:
                raise HTTPException(status_code=400, detail="start_at must be strictly earlier than end_at")

            # Legacy date (if column exists)
            if hasattr(Task, "task_date") and getattr(payload, "task_date", None):
                task_kwargs["task_date"] = payload.task_date

            task = Task(**task_kwargs)
            db.add(task)
            db.commit()
            db.refresh(task)
            return task
        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Error creating program: {e}")

    @staticmethod
    def list_tasks(db: Session) -> List[Task]:
        return db.query(Task).order_by(Task.created_at.desc()).all()

    @staticmethod
    def list_tasks_with_stats(db: Session) -> List[dict]:
        """
        Returns an array of dicts with:
          - current_count: UI headcount (applied+invited+accepted+checked_in+completed)
          - slot_count: number occupying slots (accepted+checked_in)
          - is_full: slot_count >= max_volunteers
          - assigned_volunteer_ids: list of assigned individual ids (extend as needed)
          - lifecycle (computed hybrid)
          - start_at / end_at (if present) or task_date (legacy)
        """
        tasks: List[Task] = db.query(Task).order_by(Task.created_at.desc()).all()
        if not tasks:
            return []

        task_ids = [t.id for t in tasks]

        assigns = (
            db.query(
                Assignment.task_id,
                Assignment.individual_volunteer_id,
                Assignment.organization_volunteer_id,
                Assignment.status,
            )
            .filter(Assignment.task_id.in_(task_ids))
            .all()
        )

        ui_counts: Dict[int, int] = {tid: 0 for tid in task_ids}
        slot_counts: Dict[int, int] = {tid: 0 for tid in task_ids}
        ids_map: Dict[int, List[int]] = {tid: [] for tid in task_ids}

        for (task_id, iv_id, _ov_id, status) in assigns:
            if status in _UI_ACTIVE_STATUSES:
                ui_counts[task_id] += 1
            if status in _SLOT_STATUSES:
                slot_counts[task_id] += 1
            if iv_id:
                ids_map[task_id].append(iv_id)

        out: List[dict] = []
        for t in tasks:
            has_task_date = hasattr(t, "task_date")
            has_start = hasattr(t, "start_at")
            has_end = hasattr(t, "end_at")

            item = {
                "id": t.id,
                "event_id": t.event_id,
                "title": t.title,
                "description": t.description,
                "location": t.location,
                "max_volunteers": t.max_volunteers,
                "required_skills": t.required_skills,
                "created_at": t.created_at,
                "current_count": ui_counts.get(t.id, 0),
                "slot_count": slot_counts.get(t.id, 0),
                "is_full": slot_counts.get(t.id, 0) >= (t.max_volunteers or 0),
                "assigned_volunteer_ids": ids_map.get(t.id, []),
                "lifecycle": getattr(t, "lifecycle", None),
            }
            if has_task_date:
                item["task_date"] = getattr(t, "task_date", None)
            if has_start:
                item["start_at"] = getattr(t, "start_at", None)
            if has_end:
                item["end_at"] = getattr(t, "end_at", None)

            out.append(item)
        return out

    # ----------------- ASSIGNMENTS -----------------

    @staticmethod
    def _has_overlap(
        db: Session,
        start_at: datetime,
        end_at: datetime,
        *,
        individual_id: Optional[int] = None,
        org_id: Optional[int] = None,
    ) -> bool:
        """
        Overlap check for volunteers with accepted/checked_in assignments.
        """
        q = (
            db.query(Assignment)
            .join(Task, Task.id == Assignment.task_id)
            .filter(
                Assignment.status.in_(_SLOT_STATUSES),
                Task.start_at < end_at,
                Task.end_at > start_at,
            )
        )
        if individual_id:
            q = q.filter(Assignment.individual_volunteer_id == individual_id)
        if org_id:
            q = q.filter(Assignment.organization_volunteer_id == org_id)
        return db.query(q.exists()).scalar()

    @staticmethod
    def assign_to_task(
        db: Session,
        task_id: int,
        individual_volunteer_id: Optional[int] = None,
        organization_volunteer_id: Optional[int] = None,
        status: AssignmentStatus = AssignmentStatus.accepted,
    ) -> Assignment:
        # XOR guard
        if (individual_volunteer_id is None and organization_volunteer_id is None) or (
            individual_volunteer_id is not None and organization_volunteer_id is not None
        ):
            raise HTTPException(status_code=400, detail="Specify exactly one owner: individual OR organization")

        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        # Ensure referenced volunteer exists
        if individual_volunteer_id is not None and db.get(IndividualVolunteer, individual_volunteer_id) is None:
            raise HTTPException(status_code=404, detail="Individual volunteer not found")
        if organization_volunteer_id is not None and db.get(OrganizationVolunteer, organization_volunteer_id) is None:
            raise HTTPException(status_code=404, detail="Organization volunteer not found")

        # capacity check: slots consumed by accepted/checked_in
        slot_count = (
            db.query(Assignment)
            .filter(Assignment.task_id == task_id, Assignment.status.in_(_SLOT_STATUSES))
            .count()
        )
        if slot_count >= (task.max_volunteers or 0):
            raise HTTPException(status_code=409, detail="Task is already full")

        # time overlap check (if datetimes exist)
        if hasattr(task, "start_at") and hasattr(task, "end_at") and task.start_at and task.end_at:
            if AssignmentCRUD._has_overlap(
                db,
                task.start_at,
                task.end_at,
                individual_id=individual_volunteer_id,
                org_id=organization_volunteer_id,
            ):
                raise HTTPException(status_code=409, detail="Volunteer has an overlapping assignment")

        a = Assignment(
            task_id=task_id,
            individual_volunteer_id=individual_volunteer_id,
            organization_volunteer_id=organization_volunteer_id,
            status=status,
        )
        try:
            db.add(a)

            # flip availability_status to 'assigned'
            if individual_volunteer_id:
                iv = db.get(IndividualVolunteer, individual_volunteer_id)
                if iv:
                    iv.availability_status = VolunteerStatus.assigned
            if organization_volunteer_id:
                ov = db.get(OrganizationVolunteer, organization_volunteer_id)
                if ov:
                    ov.availability_status = VolunteerStatus.assigned

            db.commit()
            db.refresh(a)
            return a
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=409, detail="Volunteer already assigned to this task")
        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Error creating assignment: {e}")

    @staticmethod
    def update_assignment_status(
        db: Session,
        assignment_id: int,
        new_status: AssignmentStatus,
    ) -> Assignment:
        a = db.get(Assignment, assignment_id)
        if not a:
            raise HTTPException(status_code=404, detail="Assignment not found")

        a.status = new_status
        db.flush()

        # sync availability based on all remaining ACTIVE slots for the volunteer
        def _recompute_availability_for(individual_id: Optional[int], org_id: Optional[int]) -> None:
            if individual_id:
                still_busy = (
                    db.query(Assignment)
                    .join(Task, Task.id == Assignment.task_id)
                    .filter(
                        Assignment.individual_volunteer_id == individual_id,
                        Assignment.status.in_(_SLOT_STATUSES),
                        Task.end_at >= func.now(),
                    )
                    .count()
                ) > 0
                iv = db.get(IndividualVolunteer, individual_id)
                if iv:
                    iv.availability_status = (VolunteerStatus.assigned if still_busy else VolunteerStatus.available)

            if org_id:
                still_busy = (
                    db.query(Assignment)
                    .join(Task, Task.id == Assignment.task_id)
                    .filter(
                        Assignment.organization_volunteer_id == org_id,
                        Assignment.status.in_(_SLOT_STATUSES),
                        Task.end_at >= func.now(),
                    )
                    .count()
                ) > 0
                ov = db.get(OrganizationVolunteer, org_id)
                if ov:
                    ov.availability_status = (VolunteerStatus.assigned if still_busy else VolunteerStatus.available)

        _recompute_availability_for(a.individual_volunteer_id, a.organization_volunteer_id)

        db.commit()
        db.refresh(a)
        return a

    @staticmethod
    def list_assignments_for_task(db: Session, task_id: int) -> List[Assignment]:
        return (
            db.query(Assignment)
            .filter(Assignment.task_id == task_id)
            .order_by(Assignment.created_at.asc())
            .all()
        )

    @staticmethod
    def unassign(db: Session, assignment_id: int) -> bool:
        a = db.get(Assignment, assignment_id)
        if not a:
            raise HTTPException(status_code=404, detail="Assignment not found")

        individual_id = a.individual_volunteer_id
        org_id = a.organization_volunteer_id

        db.delete(a)
        db.flush()

        # After removal, recompute availability from remaining assignments
        if individual_id:
            still_busy = (
                db.query(Assignment)
                .join(Task, Task.id == Assignment.task_id)
                .filter(
                    Assignment.individual_volunteer_id == individual_id,
                    Assignment.status.in_(_SLOT_STATUSES),
                    Task.end_at >= func.now(),
                )
                .count()
            ) > 0
            iv = db.get(IndividualVolunteer, individual_id)
            if iv:
                iv.availability_status = (VolunteerStatus.assigned if still_busy else VolunteerStatus.available)

        if org_id:
            still_busy = (
                db.query(Assignment)
                .join(Task, Task.id == Assignment.task_id)
                .filter(
                    Assignment.organization_volunteer_id == org_id,
                    Assignment.status.in_(_SLOT_STATUSES),
                    Task.end_at >= func.now(),
                )
                .count()
            ) > 0
            ov = db.get(OrganizationVolunteer, org_id)
            if ov:
                ov.availability_status = (VolunteerStatus.assigned if still_busy else VolunteerStatus.available)

        db.commit()
        return True
