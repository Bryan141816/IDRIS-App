from typing import Set
from sqlalchemy.orm import Session
from sqlalchemy import func
from models import (
    Assignment, AssignmentStatus,
    Task,
    IndividualVolunteer, OrganizationVolunteer, VolunteerStatus
)

SLOT_STATUSES = {AssignmentStatus.accepted, AssignmentStatus.checked_in}

def _busy_individual_ids(db: Session) -> Set[int]:
    rows = (
        db.query(Assignment.individual_volunteer_id)
        .join(Task, Task.id == Assignment.task_id)
        .filter(
            Assignment.individual_volunteer_id.isnot(None),
            Assignment.status.in_(SLOT_STATUSES),
            Task.end_at >= func.now(),               # still ongoing/future
        )
        .all()
    )
    return {r[0] for r in rows if r[0] is not None}

def _busy_org_ids(db: Session) -> Set[int]:
    rows = (
        db.query(Assignment.organization_volunteer_id)
        .join(Task, Task.id == Assignment.task_id)
        .filter(
            Assignment.organization_volunteer_id.isnot(None),
            Assignment.status.in_(SLOT_STATUSES),
            Task.end_at >= func.now(),
        )
        .all()
    )
    return {r[0] for r in rows if r[0] is not None}

def refresh_all_availability(db: Session) -> dict:
    """
    Persistently sync availability_status for all volunteers based on time.
    - 'accepted' or 'checked_in' with Task.end_at in the future  -> assigned
    - otherwise                                                   -> available
    Returns counts for logging/inspection.
    """
    busy_individuals = _busy_individual_ids(db)
    busy_orgs = _busy_org_ids(db)

    # Individuals
    if busy_individuals:
        (db.query(IndividualVolunteer)
           .filter(IndividualVolunteer.volunteer_id.in_(busy_individuals))
           .update({IndividualVolunteer.availability_status: VolunteerStatus.assigned},
                   synchronize_session=False))
        (db.query(IndividualVolunteer)
           .filter(~IndividualVolunteer.volunteer_id.in_(busy_individuals))
           .update({IndividualVolunteer.availability_status: VolunteerStatus.available},
                   synchronize_session=False))
    else:
        # nobody busy => all are available
        (db.query(IndividualVolunteer)
           .update({IndividualVolunteer.availability_status: VolunteerStatus.available},
                   synchronize_session=False))

    # Organizations
    if busy_orgs:
        (db.query(OrganizationVolunteer)
           .filter(OrganizationVolunteer.volunteer_id.in_(busy_orgs))
           .update({OrganizationVolunteer.availability_status: VolunteerStatus.assigned},
                   synchronize_session=False))
        (db.query(OrganizationVolunteer)
           .filter(~OrganizationVolunteer.volunteer_id.in_(busy_orgs))
           .update({OrganizationVolunteer.availability_status: VolunteerStatus.available},
                   synchronize_session=False))
    else:
        (db.query(OrganizationVolunteer)
           .update({OrganizationVolunteer.availability_status: VolunteerStatus.available},
                   synchronize_session=False))

    db.commit()
    return {
        "individuals_assigned": len(busy_individuals),
        "organizations_assigned": len(busy_orgs),
    }
