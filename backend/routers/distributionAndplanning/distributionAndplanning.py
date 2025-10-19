from fastapi import APIRouter, Query
from fastapi import Depends
from sqlalchemy.orm import Session
from database import get_db
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


@router.get("/distribution_planning/get_warehouse_items")
def get_warehouse_items(warehouse_id: int, db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.get_warehouse_items(warehouse_id, db)


@router.post("/distribution_planning/create_route")
def create_route(payload: RouteCreate, db: Session = Depends(get_db)):
    return DistributionAndPlanningCRUD.create_route(payload, db)


@router.get("/distribution_planning/get_routes")
def get_routes(
    db: Session = Depends(get_db),
    exclude: Optional[List[str]] = Query(
        None, description="Format: column:value"
    ),  # Example: ?exclude=team
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
