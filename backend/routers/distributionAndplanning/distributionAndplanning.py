# routers/distribution_planning.py

from fastapi import APIRouter, Query, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
from data_schemas.distribution_planning import (
    TeamDataCreate,
    TeamDataOut,
    RouteCreate,
    AssignTeam,
    UpdateRoute,
)
from crud_functions.distribution_planning.distribution_planning import (
    DistributionAndPlanningCRUD,
)
from routers.role_checker import RoleChecker
from typing import List, Optional
import asyncio
from create_notification import send_notifications_bulk, send_notification
from datetime import datetime
from models import TeamMembers, DistributionTeam, IndividualVolunteer


router = APIRouter(
    tags=["distribution_planning"],
    dependencies=[
        Depends(RoleChecker(["logistics admin", "superadmin", "generic"])),
    ],
)


# Background task function defined directly in router
# routers/distributionAndplanning/distributionAndplanning.py

def send_team_notifications(team_data: dict):
    """Send notifications to all assigned volunteers"""
    db = SessionLocal()

    try:
        # Get the created team_members to access members_id
        team_members = db.query(TeamMembers).filter(
            TeamMembers.team_id == team_data["team_id"]
        ).all()

        notifications = []
        for team_member in team_members:
            volunteer = db.query(IndividualVolunteer).filter(
                IndividualVolunteer.volunteer_id == team_member.member
            ).first()

            if volunteer and volunteer.user_id:
                notification_obj = {
                    "to": str(volunteer.user_id),
                    "from_origin": "Distribution Planning",
                    "title": "New Team Assignment - Action Required",
                    "message": (
                        f"You have been assigned to {team_data['team_name']} as {team_member.role}. "
                        f"Deployment Area: {team_data['deployment_area']}. "
                        f"Please accept or decline this assignment."
                    ),
                    # Include members_id in URL for easy extraction
                    "url_redirect": f"/volunteer/assignment/{team_member.members_id}",
                    "date": datetime.now(),
                    "isRead": False
                }
                notifications.append(notification_obj)

        if notifications:
            asyncio.run(send_notifications_bulk(db, notifications))

    finally:
        db.close()

@router.get("/distribution_planning/get_dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.get_dashboard(db)


@router.get("/distribution_planning/get_volunteers")
def get_volunteers(db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.get_volunteers(db)


@router.post("/distribution_planning/add_team")
def add_team(
    payload: TeamDataCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # Create team
    result = DistributionAndPlanningCRUD.add_team(payload, db)

    # Schedule notification sending in background
    background_tasks.add_task(send_team_notifications, result)

    return {
        "message": "Team created successfully. Notifications sent to volunteers.",
        "team_id": result["team_id"]
    }


@router.get(
    "/distribution_planning/get_distribution_team", response_model=List[TeamDataOut]
)
def get_distribution_team(db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.get_all_distribution_team(db)


@router.get("/distribution_planning/get_warehouse_items")
def get_warehouse_items(warehouse_id: int, db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.get_warehouse_items(warehouse_id, db)


@router.post("/distribution_planning/create_route")
def create_route(payload: RouteCreate, db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.create_route(payload, db)


@router.get("/distribution_planning/get_routes")
def get_routes(
    db: Session = Depends(get_db),
    exclude: Optional[List[str]] = Query(None, description="Format: column:value"),
):
    return DistributionAndPlanningCRUD.get_routes(db, exclude)


@router.post("/distribution_planning/assign_team")
def assign_team(payload: AssignTeam, db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.assign_team(payload, db)


@router.get("/distribution_planning/get_movement")
def get_movement(db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.get_all_routes_with_latest_log(db)


@router.post("/distribution_planning/update_route")
def update_route(payload: UpdateRoute, db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.update_route(payload, db)


@router.get("/distribution_planning/get_all_response")
def get_all_response(db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.get_all_response(db)


# New endpoints for volunteer responses
@router.get("/distribution_planning/pending_assignments/{volunteer_id}")
def get_pending_assignments(volunteer_id: int, db: Session = Depends(get_db)):
    """Get all pending team assignments for a volunteer"""
    pending = db.query(TeamMembers, DistributionTeam).join(
        DistributionTeam, TeamMembers.team_id == DistributionTeam.team_id
    ).filter(
        TeamMembers.member == volunteer_id,
        TeamMembers.status == 'pending'
    ).all()

    results = []
    for member, team in pending:
        results.append({
            "members_id": member.members_id,
            "team_id": team.team_id,
            "team_name": team.team_name,
            "role": member.role,
            "deployment_area": team.deployment_area,
            "assignment_duration": team.assignment_duration,
            "starting_date": str(team.starting_date),
            "assigned_at": member.assigned_at.isoformat() if member.assigned_at else None
        })

    return results


@router.put("/distribution_planning/respond_to_assignment/{members_id}")
async def respond_to_assignment(
    members_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    """Volunteer accepts or rejects team assignment"""
    if status not in ['accepted', 'rejected']:
        raise HTTPException(status_code=400, detail="Status must be 'accepted' or 'rejected'")

    # Get the team member record
    team_member = db.query(TeamMembers).filter(
        TeamMembers.members_id == members_id
    ).first()

    if not team_member:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if team_member.status != 'pending':
        raise HTTPException(status_code=400, detail=f"Assignment already {team_member.status}")

    # Update team member status
    team_member.status = status
    team_member.responded_at = datetime.now()

    # Update volunteer availability status
    volunteer = db.query(IndividualVolunteer).filter(
        IndividualVolunteer.volunteer_id == team_member.member
    ).first()

    if volunteer:
        if status == 'accepted':
            volunteer.availability_status = 'assigned'  # Update to assigned
        elif status == 'rejected':
            volunteer.availability_status = 'available'  # Keep or set back to available

    db.commit()

    # Get team details for notification
    team = db.query(DistributionTeam).filter(
        DistributionTeam.team_id == team_member.team_id
    ).first()

    # Get volunteer name for the message
    volunteer_name = f"{volunteer.first_name} {volunteer.last_name}" if volunteer else "A volunteer"

    # Notify the admin who assigned them
    if team_member.assigned_by:

        admin_notification = {
            "to": str(team_member.assigned_by),
            "from_origin": "Volunteer Response",
            "title": f"Assignment {status.title()}",
            "message": f"{volunteer_name} has {status} the assignment to {team.team_name}.",
            "url_redirect": f"/admin/distribution/teams/{team_member.team_id}",
            "date": datetime.now(),
            "isRead": False
        }

        await send_notification(db, admin_notification)

    return {
        "message": f"Assignment {status} successfully",
        "status": status,
        "availability_status": volunteer.availability_status if volunteer else None
    }


@router.delete("/distribution_planning/remove_team_member/{members_id}")
def remove_team_member(members_id: int, db: Session = Depends(get_db)):
    """Remove a volunteer from a team and set their status back to available"""

    team_member = db.query(TeamMembers).filter(
        TeamMembers.members_id == members_id
    ).first()

    if not team_member:
        raise HTTPException(status_code=404, detail="Team member not found")

    # Update volunteer availability status back to available
    volunteer = db.query(IndividualVolunteer).filter(
        IndividualVolunteer.volunteer_id == team_member.member
    ).first()

    if volunteer:
        volunteer.availability_status = 'available'

    # Delete the team member record
    db.delete(team_member)
    db.commit()

    return {
        "message": "Volunteer removed from team successfully",
        "volunteer_id": team_member.member
    }
