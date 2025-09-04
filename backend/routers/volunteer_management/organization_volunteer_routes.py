from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
from pathlib import Path

from routers.GetUserId import GetUserId
from database import get_db
from data_schemas.organization_volunteers import (
    OrganizationVolunteerCreate,
    OrganizationVolunteerUpdate,
    OrganizationVolunteerRead,
    VolunteerCertificateRead,
)
from crud_functions.volunteer_management.organization_volunteer_crud import (
    OrganizationVolunteerCRUD as CRUD,
)
from routers.role_checker import RoleChecker
from models import OrganizationVolunteer  # optional import; safe to keep

# Role-based routers
router_admin = APIRouter(
    dependencies=[Depends(RoleChecker(["operations admin", "superuser"]))],
)

router_organization_volunteer = APIRouter(
    dependencies=[Depends(RoleChecker(["organization volunteer", "superuser", "generic"]))],
)

router_admin_or_organization_volunteer = APIRouter(
    dependencies=[Depends(RoleChecker(["operations admin", "superuser", "organization volunteer", "volunteer", "generic"]))],
)

router_authenticated = APIRouter(
    dependencies=[Depends(RoleChecker(["organization volunteer", "superuser", "operations admin", "volunteer", "generic"]))],
)

UPLOAD_DIR = Path("media/organization_files")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ---------------- CREATE (User creates their own profile) ----------------
@router_authenticated.post("/create", response_model=OrganizationVolunteerRead)
def create_organization_volunteer_endpoint(
    user_id: int = Depends(GetUserId()),
    organization_name: str = Form(...),
    organization_type: str = Form(...),
    organization_email: str = Form(...),
    organization_phone_number: Optional[str] = Form(None),
    organization_address: Optional[str] = Form(None),
    contact_person_name: str = Form(...),
    contact_person_position: str = Form(...),
    contact_person_phone_number: Optional[str] = Form(None),
    contact_person_email: str = Form(...),
    availability: Optional[str] = Form(None),
    organization_picture: Optional[UploadFile] = File(None),
    certification_files: Optional[List[UploadFile]] = File(None),
    organization_certificate: Optional[UploadFile] = File(None),
    status: Optional[str] = Form("submitted"),
    db: Session = Depends(get_db),
):
    organization_data = OrganizationVolunteerCreate(
        user_id=user_id,
        organization_name=organization_name,
        organization_type=organization_type,
        organization_email=organization_email,
        organization_phone_number=organization_phone_number,
        organization_address=organization_address,
        contact_person_name=contact_person_name,
        contact_person_position=contact_person_position,
        contact_person_phone_number=contact_person_phone_number,
        contact_person_email=contact_person_email,
        availability=availability,
        organization_picture=None,  # set by CRUD if file uploaded
        organization_certificate=None,  # set by CRUD if file uploaded
        status=status
    )
    files = certification_files or ([organization_certificate] if organization_certificate else None)
    return CRUD.create_organization_volunteer(db, organization_data, files, organization_picture)

# ---------------- CREATE (Admin creates for any organization volunteer) ----------------
@router_admin.post("/create_for_user", response_model=OrganizationVolunteerRead)
def create_organization_volunteer_for_user_endpoint(
    user_id: int = Form(...),
    organization_name: str = Form(...),
    organization_type: str = Form(...),
    organization_email: str = Form(...),
    organization_phone_number: Optional[str] = Form(None),
    organization_address: Optional[str] = Form(None),
    contact_person_name: str = Form(...),
    contact_person_position: str = Form(...),
    contact_person_phone_number: Optional[str] = Form(None),
    contact_person_email: str = Form(...),
    availability: Optional[str] = Form(None),
    organization_picture: Optional[UploadFile] = File(None),
    certification_files: Optional[List[UploadFile]] = File(None),
    organization_certificate: Optional[UploadFile] = File(None),
    status: Optional[str] = Form("submitted"),
    db: Session = Depends(get_db),
):
    organization_data = OrganizationVolunteerCreate(
        user_id=user_id,
        organization_name=organization_name,
        organization_type=organization_type,
        organization_email=organization_email,
        organization_phone_number=organization_phone_number,
        organization_address=organization_address,
        contact_person_name=contact_person_name,
        contact_person_position=contact_person_position,
        contact_person_phone_number=contact_person_phone_number,
        contact_person_email=contact_person_email,
        availability=availability,
        organization_picture=None,  # set by CRUD if file uploaded
        organization_certificate=None,  # set by CRUD if file uploaded
        status=status
    )
    files = certification_files or ([organization_certificate] if organization_certificate else None)
    return CRUD.create_organization_volunteer(db, organization_data, files, organization_picture)

# ---------------- READ ALL ----------------
@router_admin_or_organization_volunteer.get("/get_all", response_model=List[OrganizationVolunteerRead])
def get_all_organization_volunteers_endpoint(
    db: Session = Depends(get_db),
):
    return CRUD.get_all_organization_volunteers(db)

# ---------------- READ BY ID ----------------
@router_admin_or_organization_volunteer.get("/get_by_id", response_model=OrganizationVolunteerRead)
def get_organization_volunteer_by_id_endpoint(
    volunteer_id: int,
    db: Session = Depends(get_db),
):
    try:
        volunteer = CRUD.get_organization_volunteer_by_id(db, volunteer_id)
        if not volunteer:
            raise HTTPException(status_code=404, detail="Organization volunteer not found")
        return volunteer
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Database error occurred")

# ---------------- READ CURRENT USER'S PROFILE ----------------
@router_authenticated.get("/my_profile", response_model=OrganizationVolunteerRead)
def get_my_organization_volunteer_profile_endpoint(
    user_id: int = Query(...),  # Temporarily require user_id as query param (or use Depends(GetUserId()))
    db: Session = Depends(get_db),
):
    try:
        volunteer = CRUD.get_organization_volunteer_by_user_id(db, user_id)
        if not volunteer:
            raise HTTPException(status_code=404, detail="Organization volunteer profile not found")
        return volunteer
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Database error occurred")

# ---------------- READ BY USER ID (for authenticated users) ----------------
@router_authenticated.get("/get_by_user_id", response_model=OrganizationVolunteerRead)
def get_org_by_user_id(
    user_id: int = Depends(GetUserId()),
    db: Session = Depends(get_db),
):
    v = CRUD.get_organization_volunteer_by_user_id(db, user_id)
    if not v:
        raise HTTPException(status_code=404, detail="Organization volunteer not found")
    return v

# ---------------- UPDATE (User updates their own profile) ----------------
@router_authenticated.put("/update_my_profile", response_model=OrganizationVolunteerRead)
def update_my_organization_volunteer_profile_endpoint(
    user_id: int = Form(...),  # Temporarily require user_id in form
    organization_name: Optional[str] = Form(None),
    organization_type: Optional[str] = Form(None),
    organization_email: Optional[str] = Form(None),
    organization_phone_number: Optional[str] = Form(None),
    organization_address: Optional[str] = Form(None),
    contact_person_name: Optional[str] = Form(None),
    contact_person_position: Optional[str] = Form(None),
    contact_person_phone_number: Optional[str] = Form(None),
    contact_person_email: Optional[str] = Form(None),
    availability: Optional[str] = Form(None),
    organization_picture: Optional[UploadFile] = File(None),
    certification_files: Optional[List[UploadFile]] = File(None),
    organization_certificate: Optional[UploadFile] = File(None),
    status: Optional[str] = Form("submitted"),
    db: Session = Depends(get_db),
):
    # Find the user's volunteer profile
    volunteer = CRUD.get_organization_volunteer_by_user_id(db, user_id)
    if status:
        volunteer.status = status
    if not volunteer:
        raise HTTPException(status_code=404, detail="Organization volunteer profile not found")

    update_data = OrganizationVolunteerUpdate(
        organization_name=organization_name,
        organization_type=organization_type,
        organization_email=organization_email,
        organization_phone_number=organization_phone_number,
        organization_address=organization_address,
        contact_person_name=contact_person_name,
        contact_person_position=contact_person_position,
        contact_person_phone_number=contact_person_phone_number,
        contact_person_email=contact_person_email,
        availability=availability,
        status=status
    )
    files = certification_files or ([organization_certificate] if organization_certificate else None)
    return CRUD.update_organization_volunteer(db, volunteer.volunteer_id, update_data, files, organization_picture)

# ---------------- UPDATE (Admin updates any profile) ----------------
@router_admin.put("/update/{volunteer_id}", response_model=OrganizationVolunteerRead)
def update_organization_volunteer_endpoint(
    volunteer_id: int,
    organization_name: Optional[str] = Form(None),
    organization_type: Optional[str] = Form(None),
    organization_email: Optional[str] = Form(None),
    organization_phone_number: Optional[str] = Form(None),
    organization_address: Optional[str] = Form(None),
    contact_person_name: Optional[str] = Form(None),
    contact_person_position: Optional[str] = Form(None),
    contact_person_phone_number: Optional[str] = Form(None),
    contact_person_email: Optional[str] = Form(None),
    availability: Optional[str] = Form(None),
    organization_picture: Optional[UploadFile] = File(None),
    certification_files: Optional[List[UploadFile]] = File(None),
    organization_certificate: Optional[UploadFile] = File(None),
    status: Optional[str] = Form("submitted"),
    db: Session = Depends(get_db),
):
    update_data = OrganizationVolunteerUpdate(
        organization_name=organization_name,
        organization_type=organization_type,
        organization_email=organization_email,
        organization_phone_number=organization_phone_number,
        organization_address=organization_address,
        contact_person_name=contact_person_name,
        contact_person_position=contact_person_position,
        contact_person_phone_number=contact_person_phone_number,
        contact_person_email=contact_person_email,
        availability=availability,
        status=status
    )
    files = certification_files or ([organization_certificate] if organization_certificate else None)
    return CRUD.update_organization_volunteer(db, volunteer_id, update_data, files, organization_picture)

# ---------------- DELETE ----------------
@router_admin.delete("/delete/{volunteer_id}")
def delete_organization_volunteer_endpoint(
    volunteer_id: int,
    db: Session = Depends(get_db),
):
    success = CRUD.delete_organization_volunteer(db, volunteer_id)
    if not success:
        raise HTTPException(status_code=404, detail="Organization volunteer not found")
    return {"message": "Organization volunteer deleted successfully"}

# Final router to include in main.py
router = APIRouter()
router.include_router(router_admin, prefix="/organization_volunteer", tags=["Organization Volunteer - Admin"])
router.include_router(router_organization_volunteer, prefix="/organization_volunteer", tags=["Organization Volunteer - User Self-Service"])
router.include_router(router_admin_or_organization_volunteer, prefix="/organization_volunteer", tags=["Organization Volunteer - Mixed Access"])
router.include_router(router_authenticated, prefix="/organization_volunteer", tags=["Organization Volunteer - Self-Service"])
