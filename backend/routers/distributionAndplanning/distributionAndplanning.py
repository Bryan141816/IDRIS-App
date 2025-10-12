from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session
from database import get_db
from data_schemas.distribution_planning import TeamDataCreate, TeamDataOut
from crud_functions.distribution_planning.distribution_planning import (
    DistributionAndPlanningCRUD,
)
from routers.role_checker import RoleChecker
from typing import List

router = APIRouter(
    tags=["distribution_planning"],
    dependencies=[
        Depends(RoleChecker(["logistics admin", "super admin"])),
    ],
)


@router.get("/distribution_planning/get_volunteers")
def get_volunteers(db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.get_volunteers(db)


@router.post("/distribution_planning/add_team")
def add_team(payload: TeamDataCreate, db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.add_team(payload, db)


@router.get(
    "/distribution_planning/get_distribution_team", response_model=List[TeamDataOut]
)
def get_distribution_team(db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.get_all_distribution_team(db)
