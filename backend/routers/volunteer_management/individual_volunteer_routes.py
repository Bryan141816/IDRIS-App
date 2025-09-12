from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
from pathlib import Path

from routers.GetUserId import GetUserId
from database import get_db
from data_schemas.individual_volunteer_schema import (
    IndividualVolunteerCreate,
    IndividualVolunteerUpdate,
    IndividualVolunteerRead,
    IndividualVolunteerStatusUpdate,
)
from crud_functions.volunteer_management.individual_volunteer_crud import (
    IndividualVolunteerCRUD as CRUD
)
from crud_functions.volunteer_management.availability_crud import (
    refresh_all_availability
)
from routers.role_checker import RoleChecker
from models import IndividualVolunteer, VolunteerStatus

# Role-based routers
router_admin = APIRouter(
    dependencies=[Depends(RoleChecker(["operations admin", "superuser", "admin"]))],
)
router_volunteer = APIRouter(
    dependencies=[Depends(RoleChecker(["volunteer", "contributor", "superuser", "generic"]))],
)
router_admin_or_volunteer = APIRouter(
    dependencies=[Depends(RoleChecker(["operations admin", "superuser", "volunteer", "contributor", "generic"]))],
)
router_authenticated = APIRouter(
    dependencies=[Depends(RoleChecker(["volunteer", "contributor", "operations admin", "superuser", "generic"]))],
)

UPLOAD_DIR = Path("media/certifications")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ---------------- CREATE (User creates their own profile) ----------------
@router_authenticated.post("/create", response_model=IndividualVolunteerRead)
def create_individual_volunteer_endpoint(
    user_id: int = Depends(GetUserId()),
    first_name: str = Form(...),
    middle_name: Optional[str] = Form(None),
    last_name: str = Form(...),
    email: str = Form(...),
    phone_number: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    birthday: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    age: Optional[int] = Form(None),
    availability: Optional[str] = Form(None),
    medical_conditions: Optional[str] = Form(None),
    other_medical_conditions: Optional[str] = Form(None),
    skills: Optional[List[str]] = Form(None),
    certification_files: Optional[List[UploadFile]] = File(None),
    certification_file: Optional[UploadFile] = File(None),
    status: Optional[str] = Form("submitted"),
    db: Session = Depends(get_db),
):
    volunteer_data = IndividualVolunteerCreate(
        user_id=user_id,
        first_name=first_name,
        middle_name=middle_name,
        last_name=last_name,
        email=email,
        phone_number=phone_number,
        address=address,
        birthday=birthday,
        gender=gender,
        age=age,
        availability=availability,
        medical_conditions=medical_conditions,
        other_medical_conditions=other_medical_conditions,
        certification=None,
        skills=skills,
        status=status,
    )
    files = certification_files or ([certification_file] if certification_file else None)
    return CRUD.create_individual_volunteer(db, volunteer_data, files)

# ---------------- CREATE (Admin creates for any user) ----------------
@router_admin.post("/create_for_user", response_model=IndividualVolunteerRead)
def create_individual_volunteer_for_user_endpoint(
    user_id: int = Form(...),
    first_name: str = Form(...),
    middle_name: Optional[str] = Form(None),
    last_name: str = Form(...),
    email: str = Form(...),
    phone_number: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    birthday: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    age: Optional[int] = Form(None),
    availability: Optional[str] = Form(None),
    medical_conditions: Optional[str] = Form(None),
    other_medical_conditions: Optional[str] = Form(None),
    skills: Optional[List[str]] = Form(None),
    certification_files: Optional[List[UploadFile]] = File(None),
    certification_file: Optional[UploadFile] = File(None),
    status: Optional[str] = Form("submitted"),
    db: Session = Depends(get_db),
):
    volunteer_data = IndividualVolunteerCreate(
        user_id=user_id,
        first_name=first_name,
        middle_name=middle_name,
        last_name=last_name,
        email=email,
        phone_number=phone_number,
        address=address,
        birthday=birthday,
        gender=gender,
        age=age,
        availability=availability,
        medical_conditions=medical_conditions,
        other_medical_conditions=other_medical_conditions,
        certification=None,
        skills=skills,
        status=status,
    )
    files = certification_files or ([certification_file] if certification_file else None)
    return CRUD.create_individual_volunteer(db, volunteer_data, files)

# ---------------- READ ALL ----------------
@router_admin_or_volunteer.get("/get_all", response_model=List[IndividualVolunteerRead])
def get_all_volunteers_endpoint(db: Session = Depends(get_db)):
    # ✅ Auto-flip availability before returning
    refresh_all_availability(db)
    return CRUD.get_all_volunteers(db)

# ---------------- READ BY ID ----------------
@router_admin_or_volunteer.get("/get_by_id", response_model=IndividualVolunteerRead)
def get_volunteer_by_id_endpoint(volunteer_id: int, db: Session = Depends(get_db)):
    try:
        volunteer = CRUD.get_volunteer_by_id(db, volunteer_id)
        if not volunteer:
            raise HTTPException(status_code=404, detail="Volunteer not found")
        return volunteer
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Database error occurred")

# ---------------- READ CURRENT USER'S PROFILE ----------------
@router_authenticated.get("/my_profile", response_model=IndividualVolunteerRead)
def get_my_volunteer_profile_endpoint(
    user_id: int = Depends(GetUserId()),
    db: Session = Depends(get_db),
):
    try:
        volunteer = CRUD.get_volunteer_by_user_id(db, user_id)
        if not volunteer:
            raise HTTPException(status_code=404, detail="Volunteer profile not found")
        return volunteer
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Database error occurred")

# ---------------- UPDATE (User updates their own profile) ----------------
@router_authenticated.put("/update_my_profile", response_model=IndividualVolunteerRead)
def update_my_volunteer_profile_endpoint(
    user_id: int = Form(...),
    first_name: Optional[str] = Form(None),
    middle_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    phone_number: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    birthday: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    age: Optional[int] = Form(None),
    availability: Optional[str] = Form(None),
    medical_conditions: Optional[str] = Form(None),
    other_medical_conditions: Optional[str] = Form(None),
    skills: Optional[List[str]] = Form(None),
    certification_files: Optional[List[UploadFile]] = File(None),
    certification_file: Optional[UploadFile] = File(None),
    status: Optional[str] = Form("submitted"),
    db: Session = Depends(get_db),
):
    volunteer = CRUD.get_volunteer_by_user_id(db, user_id)
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer profile not found")

    update_data = IndividualVolunteerUpdate(
        first_name=first_name,
        middle_name=middle_name,
        last_name=last_name,
        email=email,
        phone_number=phone_number,
        address=address,
        birthday=birthday,
        gender=gender,
        age=age,
        availability=availability,
        medical_conditions=medical_conditions,
        other_medical_conditions=other_medical_conditions,
        skills=skills,
        status=status,
    )
    files = certification_files or ([certification_file] if certification_file else None)
    return CRUD.update_volunteer(db, volunteer.volunteer_id, update_data, files)

# ---------------- UPDATE (Admin updates any profile) ----------------
@router_admin.put("/update/{volunteer_id}", response_model=IndividualVolunteerRead)
def update_volunteer_endpoint(
    volunteer_id: int,
    first_name: Optional[str] = Form(None),
    middle_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    phone_number: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    birthday: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    age: Optional[int] = Form(None),
    availability: Optional[str] = Form(None),
    medical_conditions: Optional[str] = Form(None),
    other_medical_conditions: Optional[str] = Form(None),
    skills: Optional[List[str]] = Form(None),
    certification_files: Optional[List[UploadFile]] = File(None),
    certification_file: Optional[UploadFile] = File(None),
    status: Optional[str] = Form("submitted"),
    db: Session = Depends(get_db),
):
    update_data = IndividualVolunteerUpdate(
        first_name=first_name,
        middle_name=middle_name,
        last_name=last_name,
        email=email,
        phone_number=phone_number,
        address=address,
        birthday=birthday,
        gender=gender,
        age=age,
        availability=availability,
        medical_conditions=medical_conditions,
        other_medical_conditions=other_medical_conditions,
        skills=skills,
        status=status,
    )
    files = certification_files or ([certification_file] if certification_file else None)
    return CRUD.update_volunteer(db, volunteer_id, update_data, files)

# ---------------- DELETE ----------------
@router_admin.delete("/delete/{volunteer_id}")
def delete_volunteer_endpoint(volunteer_id: int, db: Session = Depends(get_db)):
    success = CRUD.delete_volunteer(db, volunteer_id)
    if not success:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return {"message": "Volunteer deleted successfully"}

@router_admin.patch("/{volunteer_id}/status", response_model=IndividualVolunteerRead)
def update_volunteer_status(
    volunteer_id: int,
    payload: IndividualVolunteerStatusUpdate,
    db: Session = Depends(get_db),
):
    iv = db.get(IndividualVolunteer, volunteer_id)
    if not iv:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    updated = False

    if payload.status is not None:
        iv.status = VolunteerStatus(payload.status)
        updated = True
        if payload.status == "approved" and payload.availability_status is None:
            iv.availability_status = VolunteerStatus.available

    if payload.availability_status is not None:
        iv.availability_status = VolunteerStatus(payload.availability_status)
        updated = True

    if not updated:
        raise HTTPException(status_code=400, detail="No fields to update")

    db.commit()
    db.refresh(iv)
    return iv

# Final router to include in main.py
router = APIRouter()
router.include_router(router_admin, prefix="/volunteer", tags=["Volunteer - Admin"])
router.include_router(router_volunteer, prefix="/volunteer", tags=["Volunteer - Volunteer"])
router.include_router(router_admin_or_volunteer, prefix="/volunteer", tags=["Volunteer - Mixed Access"])
router.include_router(router_authenticated, prefix="/volunteer", tags=["Volunteer - User Self-Service"])
