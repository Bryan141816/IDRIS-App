from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from data_schemas.donation_schema import DonationCreate, DonationResponse, RecurringDonationCreate, InKindDonationCreate
from crud_functions.donations_management.donations_crud import DonationCRUD as CRUD
from datetime import datetime, timezone
from routers.role_checker import RoleChecker

router_admin = APIRouter(
    # dependencies=[Depends(RoleChecker(["finance admin", "superuser"]))],
)

router_donor = APIRouter(
    dependencies=[Depends(RoleChecker(["donor", "volunteer", "contributor"]))],
)

router_admin_or_donor = APIRouter(
    dependencies=[Depends(RoleChecker(["finance admin", "superuser", "donor", "volunteer", "contributor"]))],
)

@router_admin.post("/one-time/create", response_model=DonationResponse)
def create_one_time_donation(donation: DonationCreate, db: Session = Depends(get_db)):
    try:
        return CRUD.create_one_time_pending_donation(db, donation)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router_admin.post("/recurring/create")
def create_recurring_donation_route(
    donation_data: RecurringDonationCreate,
    db: Session = Depends(get_db)
):
    try:
        return CRUD.create_recurring_donation(db, donation_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router_admin.post("/donations/inkind")
def create_inkind_donation_route(
    donation_data: InKindDonationCreate,
    db: Session = Depends(get_db)
):
    try:
        return CRUD.create_inkind_donation(db, donation_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router_admin.post("/cancel", response_model=DonationResponse)
def cancel_donation(donation_id: int, db: Session = Depends(get_db)):
    try:
        return CRUD.cancel_donation_status(db, donation_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router_admin.post("/completed", response_model=DonationResponse)
def cancel_donation(donation_id: int, db: Session = Depends(get_db)):
    try:
        return CRUD.completed_donation_status(db, donation_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router_admin.post("/failed", response_model=DonationResponse)
def cancel_donation(donation_id: int, db: Session = Depends(get_db)):
    try:
        return CRUD.failed_donation_status(db, donation_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    
@router_admin_or_donor.get("/total_donations")
def total_donations(
    year: int = Query(..., description="Year to filter (required)"),
    month: int | None = Query(None, ge=1, le=12, description="Month to filter (optional)"),
    db: Session = Depends(get_db)
):
    total = CRUD.get_total_donations(db, year, month)
    return {
        "total_donations": total
    }
    
@router_admin_or_donor.get("/donors/retention")
def donor_retention(year: int = datetime.now(timezone.utc).year, db: Session = Depends(get_db)):
    result = CRUD.get_donor_retention_by_year(db, year)
    return result

@router_admin_or_donor.get("/recent/details")
def recent_donations(limit: int = 10, db: Session = Depends(get_db)):
    return CRUD.get_donations_with_details(db, limit=limit)

router = APIRouter()
router.include_router(router_admin)
router.include_router(router_donor)
router.include_router(router_admin_or_donor)
