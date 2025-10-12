from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session
from database import get_db

from crud_functions.distribution_planning.distribution_planning import (
    DistributionAndPlanningCRUD,
)
from routers.role_checker import RoleChecker

router = APIRouter(
    tags=["distribution_planning"],
    dependencies=[
        Depends(RoleChecker(["logistics admin", "super admin"])),
    ],
)


@router.get("/distribution_planning/get_volunteers")
def add_warehouse_zone(db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.get_volunteers(db)
