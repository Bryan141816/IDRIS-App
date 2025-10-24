from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from data_schemas.notification_donors_schema import DonorResponse
from crud_functions.notification_donors_crud import notification_donors_crud

router = APIRouter()

@router.get("/donors/all", response_model=List[DonorResponse])
def get_all_donors_endpoint(db: Session = Depends(get_db)):
    """Get all donors."""
    return notification_donors_crud.get_all_donors_for_notification(db)
