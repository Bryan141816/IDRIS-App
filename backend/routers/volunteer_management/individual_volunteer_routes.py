from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db  # Make sure you have this dependency
from crud import (
    create_individual_volunteer,
    get_individual_volunteer_by_id,
    get_all_individual_volunteers,
    update_individual_volunteer,
    delete_individual_volunteer
)
from data_schemas.individual_volunteer_schema import (
    IndividualVolunteerCreate,
    IndividualVolunteerOut,
    IndividualVolunteerUpdate
)
router = APIRouter(
    prefix="/volunteers",
    tags=["Individual Volunteers"]
)


@router.post("/", response_model=IndividualVolunteerOut)
def create_volunteer(volunteer: IndividualVolunteerCreate, db: Session = Depends(get_db)):
    return create_individual_volunteer(db, volunteer)


@router.post("/", response_model=IndividualVolunteerOut)
def get_volunteer(volunteer_id: int, db: Session = Depends(get_db)):
    db_volunteer = get_individual_volunteer_by_id(db, volunteer_id)
    if not db_volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return db_volunteer


@router.get("/", response_model=List[IndividualVolunteerOut])
def get_all_volunteers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_all_individual_volunteers(db, skip, limit)


@router.post("/", response_model=IndividualVolunteerOut)
def update_volunteer(volunteer_id: int, updates: IndividualVolunteerUpdate, db: Session = Depends(get_db)):
    db_volunteer = update_individual_volunteer(db, volunteer_id, updates)
    if not db_volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found or update failed")
    return db_volunteer


@router.delete("/{volunteer_id}")
def delete_volunteer(volunteer_id: int, db: Session = Depends(get_db)):
    db_volunteer = delete_individual_volunteer(db, volunteer_id)
    if not db_volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return {"detail": "Volunteer deleted successfully"}
