from data_schemas.distribution_planning import TeamDataCreate
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from models import IndividualVolunteer, DistributionTeam, TeamMembers
from zoneinfo import ZoneInfo
import asyncio
from real_time_handler import send_real_time
from typing import List
from fastapi import HTTPException, status


class DistributionAndPlanningCRUD:
    @staticmethod
    def get_volunteers(db: Session):
        return db.query(IndividualVolunteer).all()

    @staticmethod
    def add_team(payload: TeamDataCreate, db: Session):
        # Create the team first
        teamdata = DistributionTeam(
            team_name=payload.team_name,
            deployment_area=payload.deployment_area,
            assignment_duration=payload.assignment_duration,
            starting_date=payload.starting_date,
        )

        # Add and flush to get the team_id (before commit)
        db.add(teamdata)
        db.flush()  # flush assigns auto-incremented ID to teamdata.team_id

        # Now add team members
        for member_data in payload.team_members:
            team_member = TeamMembers(
                team_id=teamdata.team_id,
                member=member_data.volunteer_id,
                role=member_data.role,
            )
            db.add(team_member)

        # Commit all together
        db.commit()
        db.refresh(teamdata)

        return teamdata

    @staticmethod
    def get_all_distribution_team(db: Session):
        teams = (
            db.query(DistributionTeam)
            .options(
                joinedload(DistributionTeam.team_members).joinedload(
                    TeamMembers.volunteer
                )
            )
            .all()
        )
        return teams
