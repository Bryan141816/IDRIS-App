import logging, traceback
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from database import get_db
from data_schemas.donation_schema import DonationCreate, DonationResponse, RecurringDonationCreate, InKindDonationCreate
from crud_functions.donations_management.donations_crud import DonationCRUD as CRUD
from datetime import datetime, timezone
from routers.role_checker import RoleChecker

from typing import Optional, List
from models import User
from routers.auth.authentication import get_current_user_from_access_token


router_admin = APIRouter(
    dependencies=[Depends(RoleChecker(["finance admin", "operations admin", "superuser"]))],
)

router_user = APIRouter(
    dependencies=[Depends(RoleChecker(["generic"]))],
)

router_donor = APIRouter(
    dependencies=[Depends(RoleChecker(["donor"]))],
)

router_admin_or_donor = APIRouter(
    dependencies=[Depends(RoleChecker(["finance admin", "operations admin",  "superuser", "generic"]))],
)

@router_donor.post("/one-time/create", response_model=DonationResponse)
def create_one_time_donation(donation: DonationCreate, db: Session = Depends(get_db)):
    try:
        return CRUD.create_one_time_pending_donation(db, donation)
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logging.exception("Database error creating donation")
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    except Exception as e:
        logging.exception("Unexpected error creating donation")
        # while debugging, you can re-raise to see full stack:
        # raise
        raise HTTPException(status_code=500, detail="Unexpected server error")
    
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

# helper to parse ISO strings (supports trailing Z)
def _parse_iso(dt: Optional[str]) -> Optional[datetime]:
    if not dt:
        return None
    try:
        if dt.endswith("Z"):
            dt = dt.replace("Z", "+00:00")
        return datetime.fromisoformat(dt)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid datetime: {dt}")

@router_donor.get("/get/donor_aggregates")
def recent_donations(
    current_user: User = Depends(get_current_user_from_access_token),
    db: Session = Depends(get_db),
    from_: Optional[str] = Query(None, alias="from"),
    to: Optional[str] = None,
    status: Optional[str] = None,
    dtype: Optional[str] = Query(None, alias="type"),
):
    # optional CSV -> list (e.g., ?status=PENDING,COMPLETED)
    status_list: Optional[List[str]] = None
    if status:
        status_list = [s.strip().upper() for s in status.split(",") if s.strip()]

    return CRUD.get_donor_aggregates(
        db,
        donor_id=current_user.user_id,
        date_from=_parse_iso(from_), 
        date_to=_parse_iso(to),    
        status=status_list,    
    )
    
    
    
router = APIRouter()
router.include_router(router_admin)
router.include_router(router_donor)
router.include_router(router_admin_or_donor)
