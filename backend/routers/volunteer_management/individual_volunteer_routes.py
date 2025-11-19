from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func, desc
from typing import List, Optional
from pathlib import Path

from routers.GetUserId import GetUserId
from database import get_db
from data_schemas.individual_volunteer_schema import (
    IndividualVolunteerCreate,
    IndividualVolunteerUpdate,
    IndividualVolunteerRead,
    IndividualVolunteerStatusUpdate,
)
from crud_functions.volunteer_management.individual_volunteer_crud import (
    IndividualVolunteerCRUD as CRUD
)
from crud_functions.volunteer_management.availability_crud import (
    refresh_all_availability
)
from routers.role_checker import RoleChecker
from models import (
    Assignment,
    Task,
    Event,
    TeamMembers,
    DistributionTeam,
    DistributionRoute,
    IndividualVolunteer,
    VolunteerStatus
)
from datetime import datetime
from zoneinfo import ZoneInfo
from create_notification import send_notification
from pydantic import BaseModel

# Add this after your imports, before the routers
class AvailabilityUpdate(BaseModel):
    availability: str

# Role-based routers
router_admin = APIRouter(
    dependencies=[Depends(RoleChecker(["operations admin", "admin","superadmin"]))],
)
router_volunteer = APIRouter(
    dependencies=[Depends(RoleChecker(["volunteer","generic"]))],
)
router_admin_or_volunteer = APIRouter(
    dependencies=[Depends(RoleChecker(["operations admin","volunteer", "generic","superadmin"]))],
)
router_authenticated = APIRouter(
    dependencies=[Depends(RoleChecker(["volunteer", "operations admin", "generic","superadmin"]))],
)

UPLOAD_DIR = Path("media/certifications")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ---------------- CREATE (User creates their own profile) ----------------
@router_authenticated.post("/create", response_model=IndividualVolunteerRead)
def create_individual_volunteer_endpoint(
    user_id: int = Depends(GetUserId()),
    first_name: str = Form(...),
    middle_name: Optional[str] = Form(None),
    last_name: str = Form(...),
    email: str = Form(...),
    phone_number: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    birthday: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    age: Optional[int] = Form(None),
    availability: Optional[str] = Form(None),
    medical_conditions: Optional[str] = Form(None),
    other_medical_conditions: Optional[str] = Form(None),
    skills: Optional[List[str]] = Form(None),
    certification_files: Optional[List[UploadFile]] = File(None),
    certification_file: Optional[UploadFile] = File(None),
    status: Optional[str] = Form("submitted"),
    db: Session = Depends(get_db),
):
    volunteer_data = IndividualVolunteerCreate(
        user_id=user_id,
        first_name=first_name,
        middle_name=middle_name,
        last_name=last_name,
        email=email,
        phone_number=phone_number,
        address=address,
        birthday=birthday,
        gender=gender,
        age=age,
        availability=availability,
        medical_conditions=medical_conditions,
        other_medical_conditions=other_medical_conditions,
        certification=None,
        skills=skills,
        status=status,
    )
    files = certification_files or ([certification_file] if certification_file else None)
    return CRUD.create_individual_volunteer(db, volunteer_data, files)

# ---------------- CREATE (Admin creates for any user) ----------------
@router_admin.post("/create_for_user", response_model=IndividualVolunteerRead)
def create_individual_volunteer_for_user_endpoint(
    user_id: int = Form(...),
    first_name: str = Form(...),
    middle_name: Optional[str] = Form(None),
    last_name: str = Form(...),
    email: str = Form(...),
    phone_number: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    birthday: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    age: Optional[int] = Form(None),
    availability: Optional[str] = Form(None),
    medical_conditions: Optional[str] = Form(None),
    other_medical_conditions: Optional[str] = Form(None),
    skills: Optional[List[str]] = Form(None),
    certification_files: Optional[List[UploadFile]] = File(None),
    certification_file: Optional[UploadFile] = File(None),
    status: Optional[str] = Form("submitted"),
    db: Session = Depends(get_db),
):
    volunteer_data = IndividualVolunteerCreate(
        user_id=user_id,
        first_name=first_name,
        middle_name=middle_name,
        last_name=last_name,
        email=email,
        phone_number=phone_number,
        address=address,
        birthday=birthday,
        gender=gender,
        age=age,
        availability=availability,
        medical_conditions=medical_conditions,
        other_medical_conditions=other_medical_conditions,
        certification=None,
        skills=skills,
        status=status,
    )
    files = certification_files or ([certification_file] if certification_file else None)
    return CRUD.create_individual_volunteer(db, volunteer_data, files)

# ---------------- READ ALL ----------------
@router_admin_or_volunteer.get("/get_all", response_model=List[IndividualVolunteerRead])
def get_all_volunteers_endpoint(db: Session = Depends(get_db)):
    # ✅ Auto-flip availability before returning
    refresh_all_availability(db)
    return CRUD.get_all_volunteers(db)

# ---------------- READ BY ID ----------------
@router_admin_or_volunteer.get("/get_by_id", response_model=IndividualVolunteerRead)
def get_volunteer_by_id_endpoint(volunteer_id: int, db: Session = Depends(get_db)):
    try:
        volunteer = CRUD.get_volunteer_by_id(db, volunteer_id)
        if not volunteer:
            raise HTTPException(status_code=404, detail="Volunteer not found")
        return volunteer
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Database error occurred")

# ---------------- READ CURRENT USER'S PROFILE ----------------
@router_authenticated.get("/my_profile", response_model=IndividualVolunteerRead)
def get_my_volunteer_profile_endpoint(
    user_id: int = Depends(GetUserId()),
    db: Session = Depends(get_db),
):
    try:
        volunteer = CRUD.get_volunteer_by_user_id(db, user_id)
        if not volunteer:
            raise HTTPException(status_code=404, detail="Volunteer profile not found")
        return volunteer
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Database error occurred")

# ---------------- UPDATE (User updates their own profile) ----------------
@router_authenticated.put("/update_my_profile", response_model=IndividualVolunteerRead)
def update_my_volunteer_profile_endpoint(
    user_id: int = Form(...),
    first_name: Optional[str] = Form(None),
    middle_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    phone_number: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    birthday: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    age: Optional[int] = Form(None),
    availability: Optional[str] = Form(None),
    medical_conditions: Optional[str] = Form(None),
    other_medical_conditions: Optional[str] = Form(None),
    skills: Optional[List[str]] = Form(None),
    certification_files: Optional[List[UploadFile]] = File(None),
    certification_file: Optional[UploadFile] = File(None),
    status: Optional[str] = Form("submitted"),
    db: Session = Depends(get_db),
):
    volunteer = CRUD.get_volunteer_by_user_id(db, user_id)
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer profile not found")

    update_data = IndividualVolunteerUpdate(
        first_name=first_name,
        middle_name=middle_name,
        last_name=last_name,
        email=email,
        phone_number=phone_number,
        address=address,
        birthday=birthday,
        gender=gender,
        age=age,
        availability=availability,
        medical_conditions=medical_conditions,
        other_medical_conditions=other_medical_conditions,
        skills=skills,
        status=status,
    )
    files = certification_files or ([certification_file] if certification_file else None)
    return CRUD.update_volunteer(db, volunteer.volunteer_id, update_data, files)

# ---------------- UPDATE (Admin updates any profile) ----------------
@router_admin.put("/update/{volunteer_id}", response_model=IndividualVolunteerRead)
def update_volunteer_endpoint(
    volunteer_id: int,
    first_name: Optional[str] = Form(None),
    middle_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    phone_number: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    birthday: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    age: Optional[int] = Form(None),
    availability: Optional[str] = Form(None),
    medical_conditions: Optional[str] = Form(None),
    other_medical_conditions: Optional[str] = Form(None),
    skills: Optional[List[str]] = Form(None),
    certification_files: Optional[List[UploadFile]] = File(None),
    certification_file: Optional[UploadFile] = File(None),
    status: Optional[str] = Form("submitted"),
    db: Session = Depends(get_db),
):
    update_data = IndividualVolunteerUpdate(
        first_name=first_name,
        middle_name=middle_name,
        last_name=last_name,
        email=email,
        phone_number=phone_number,
        address=address,
        birthday=birthday,
        gender=gender,
        age=age,
        availability=availability,
        medical_conditions=medical_conditions,
        other_medical_conditions=other_medical_conditions,
        skills=skills,
        status=status,
    )
    files = certification_files or ([certification_file] if certification_file else None)
    return CRUD.update_volunteer(db, volunteer_id, update_data, files)

# ---------------- DELETE ----------------
@router_admin.delete("/delete/{volunteer_id}")
def delete_volunteer_endpoint(volunteer_id: int, db: Session = Depends(get_db)):
    success = CRUD.delete_volunteer(db, volunteer_id)
    if not success:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return {"message": "Volunteer deleted successfully"}

@router_admin.patch("/{volunteer_id}/status", response_model=IndividualVolunteerRead)
async def update_volunteer_status(
    volunteer_id: int,
    payload: IndividualVolunteerStatusUpdate,
    db: Session = Depends(get_db),
):
    iv = db.get(IndividualVolunteer, volunteer_id)
    if not iv:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    updated = False

    if payload.status is not None:
        iv.status = VolunteerStatus(payload.status)
        updated = True
        if payload.status == "approved" and payload.availability_status is None:
            iv.availability_status = VolunteerStatus.available

    if payload.availability_status is not None:
        iv.availability_status = VolunteerStatus(payload.availability_status)
        updated = True

    if not updated:
        raise HTTPException(status_code=400, detail="No fields to update")

    db.commit()
    db.refresh(iv)

    # Send approval notification
    if payload.status == "approved":
        ph_tz = ZoneInfo("Asia/Manila")
        now_ph = datetime.now(ph_tz)
        notif_payload = {
            "to": str(iv.user_id),
            "from_origin": "individual_volunteer",
            "title": "Volunteer application approved",
            "message": f"Hi {iv.first_name}, your volunteer application (ID {iv.volunteer_id}) is approved. You can now volunteer.",
            "url_redirect": "/volunteer_management/volunteer_profiles",
            "isRead": False,
            "date": now_ph,
        }
        await send_notification(db, notif_payload)

    return iv

# ---------------- READ BY USER_ID ----------------
@router_admin_or_volunteer.get("/get_by_user_id/{user_id}", response_model=IndividualVolunteerRead)
def get_volunteer_by_user_id_endpoint(user_id: int, db: Session = Depends(get_db)):
    try:
        volunteer = CRUD.get_volunteer_by_user_id(db, user_id)
        if not volunteer:
            raise HTTPException(status_code=404, detail="Volunteer not found for this user")
        return volunteer
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Database error occurred")


@router_admin_or_volunteer.get("/volunteer/{volunteer_id}/programs_history")
def get_volunteer_programs_history(
    volunteer_id: int,
    limit: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get complete program history for a volunteer including:
    - Tasks/Assignments
    - Events
    - Distribution programs
    """

    volunteer = db.query(IndividualVolunteer).filter(
        IndividualVolunteer.volunteer_id == volunteer_id
    ).first()

    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    programs = []

    # 1. Get Task/Assignment history
    assignments = (
        db.query(Assignment, Task, Event)
        .join(Task, Assignment.task_id == Task.id)
        .join(Event, Task.event_id == Event.id)
        .filter(
            Assignment.individual_volunteer_id == volunteer_id,
            Assignment.status.in_(["accepted"])
        )
        .all()
    )

    for assignment, task, event in assignments:
        programs.append({
            "programtype": "Task",
            "programname": task.title,
            "eventname": event.title,
            "location": task.location or event.location,
            "startdate": task.start_at.isoformat() if task.start_at else None,
            "enddate": task.end_at.isoformat() if task.end_at else None,
            "status": assignment.status,
            "joineddate": assignment.created_at.isoformat() if assignment.created_at else None,
            "role": "Volunteer",
        })

    # 2. Get Distribution Programs history
    team_assignments = (
        db.query(TeamMembers, DistributionTeam, DistributionRoute)
        .join(DistributionTeam, TeamMembers.team_id == DistributionTeam.team_id)
        .outerjoin(DistributionRoute, DistributionRoute.team == DistributionTeam.team_id)
        .filter(
            TeamMembers.member == volunteer_id,
            TeamMembers.status == "accepted"
        )
        .all()
    )

    for team_member, team, route in team_assignments:
        programs.append({
            "programtype": "Distribution",
            "programname": route.route_name if route else f"{team.teamname}",
            "eventname": None,
            "location": route.gathering_area if route else None,
            "startdate": route.start_schedule.isoformat() if route and route.start_schedule else None,
            "enddate": route.end_schedule.isoformat() if route and route.end_schedule else None,
            "status": route.status if route else team_member.status,
            "joineddate": None,  # Add created_at to TeamMembers model if you want this
            "role": team_member.role,
        })

    # Sort by most recent (start_date or joined_date)
    programs.sort(
        key=lambda x: x.get("startdate") or x.get("joineddate") or "",
        reverse=True
    )

    # Apply limit if specified (for "recently joined")
    if limit:
        programs = programs[:limit]

    return {
        "volunteer_id": volunteer_id,
        "volunteer_name": f"{volunteer.first_name} {volunteer.last_name}",
        "total_programs": len(programs),
        "programs": programs
    }

@router_admin_or_volunteer.get("/top-active")
def get_top_active_volunteers(
    limit: int = 3,
    include_programs: bool = False,
    db: Session = Depends(get_db)
):
    """
    Get top N most active volunteers based on total programs joined
    (Tasks + Distribution programs)
    """

    # Subquery for counting task assignments per volunteer
    task_counts = (
        db.query(
            Assignment.individual_volunteer_id.label('volunteer_id'),
            func.count(Assignment.id).label('task_count')
        )
        .filter(Assignment.status == 'accepted')
        .group_by(Assignment.individual_volunteer_id)
        .subquery()
    )

    # Subquery for counting distribution programs per volunteer
    distribution_counts = (
        db.query(
            TeamMembers.member.label('volunteer_id'),
            func.count(TeamMembers.members_id).label('distribution_count')
        )
        .filter(TeamMembers.status == 'accepted')
        .group_by(TeamMembers.member)
        .subquery()
    )

    # Main query: Get volunteers with their program counts
    query = (
        db.query(
            IndividualVolunteer,
            func.coalesce(task_counts.c.task_count, 0).label('task_programs'),
            func.coalesce(distribution_counts.c.distribution_count, 0).label('distribution_programs'),
            (
                func.coalesce(task_counts.c.task_count, 0) +
                func.coalesce(distribution_counts.c.distribution_count, 0)
            ).label('total_programs')
        )
        .outerjoin(
            task_counts,
            IndividualVolunteer.volunteer_id == task_counts.c.volunteer_id
        )
        .outerjoin(
            distribution_counts,
            IndividualVolunteer.volunteer_id == distribution_counts.c.volunteer_id
        )
        .filter(IndividualVolunteer.status == 'approved')
        .order_by(desc('total_programs'))
        .limit(limit)
    )

    results = query.all()

    # Format response
    top_volunteers = []
    for volunteer, task_programs, distribution_programs, total_programs in results:
        volunteer_data = {
            "volunteerid": volunteer.volunteer_id,
            "userid": volunteer.user_id,
            "first_name": volunteer.first_name,
            "middlename": volunteer.middle_name,
            "last_name": volunteer.last_name,
            "status": volunteer.status,
            "tasksjoined": task_programs,
            "distributionprogramsjoined": distribution_programs,
            "eventsjoined": total_programs,
            "totalPrograms": total_programs,
            "profile_image": volunteer.profile_image,
        }

        # Optionally include full program history
        if include_programs:
            programs_data = get_volunteer_programs_history(
                volunteer.volunteer_id,
                limit=None,
                db=db
            )
            volunteer_data["programHistory"] = programs_data["programs"]

        top_volunteers.append(volunteer_data)

    return {
        "count": len(top_volunteers),
        "volunteers": top_volunteers
    }

@router_admin_or_volunteer.put("/individual/{volunteer_id}/availability")
async def update_individual_availability(
    volunteer_id: int,
    availability_data: AvailabilityUpdate,
    db: Session = Depends(get_db)
):
    """Update availability for an individual volunteer"""
    try:
        # Get the volunteer
        volunteer = db.query(IndividualVolunteer).filter(
            IndividualVolunteer.volunteer_id == volunteer_id
        ).first()

        if not volunteer:
            raise HTTPException(status_code=404, detail="Volunteer not found")

        # ✅ FIXED: Use correct enum values from AssignmentStatus
        active_assignments = db.query(Assignment).filter(
            Assignment.individual_volunteer_id == volunteer_id,
            Assignment.status.in_(["applied", "invited", "accepted", "waitlisted"])
        ).first()

        if active_assignments:
            raise HTTPException(
                status_code=400,
                detail="Cannot update availability while assigned to active programs. Please complete your current assignments first."
            )

        
        active_team_membership = db.query(TeamMembers).filter(
            TeamMembers.member == volunteer_id,
            TeamMembers.status.in_(["pending", "accepted"])
        ).first()

        if active_team_membership:
            raise HTTPException(
                status_code=400,
                detail="Cannot update availability while part of active distribution teams. Please leave or complete your team assignments first."
            )

        # Update availability if no active assignments
        volunteer.availability = availability_data.availability

        db.commit()
        db.refresh(volunteer)

        return {
            "success": True,
            "message": "Availability updated successfully",
            "volunteer_id": volunteer_id,
            "availability": volunteer.availability
        }

    except HTTPException:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# Final router to include in main.py
router = APIRouter()
router.include_router(router_admin, prefix="/volunteer", tags=["Volunteer - Admin"])
router.include_router(router_volunteer, prefix="/volunteer", tags=["Volunteer - Volunteer"])
router.include_router(router_admin_or_volunteer, prefix="/volunteer", tags=["Volunteer - Mixed Access"])
router.include_router(router_authenticated, prefix="/volunteer", tags=["Volunteer - User Self-Service"])
