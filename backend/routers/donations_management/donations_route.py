from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from data_schemas.donation_schema import DonationCreate, DonationResponse
from crud_functions.donations_management.donations_crud import DonationCRUD as CRUD
from datetime import datetime, timezone

router = APIRouter()

@router.post("/one-time/create", response_model=DonationResponse)
def create_one_time_donation(donation: DonationCreate, db: Session = Depends(get_db)):
    try:
        return CRUD.create_one_time_donation(db, donation)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/total_donations")
def total_donations(
    year: int = Query(..., description="Year to filter (required)"),
    month: int | None = Query(None, ge=1, le=12, description="Month to filter (optional)"),
    db: Session = Depends(get_db)
):
    total = CRUD.get_total_donations(db, year, month)
    return {
        "total_donations": total
    }
    
@router.get("/donors/retention")
def donor_retention(year: int = datetime.now(timezone.utc).year, db: Session = Depends(get_db)):
    result = CRUD.get_donor_retention_by_year(db, year)
    return result

@router.get("/recent/details")
def recent_donations(limit: int = 10, db: Session = Depends(get_db)):
    return CRUD.get_donations_with_details(db, limit=limit)
