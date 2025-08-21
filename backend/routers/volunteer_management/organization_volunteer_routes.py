# routers/organization_volunteer_routes.py

from typing import List, Optional
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    HTTPException,
    Form,
    Query,
)
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from database import get_db
from routers.GetUserId import GetUserId
from routers.role_checker import RoleChecker

from data_schemas.organization_volunteers import (
    OrganizationVolunteerCreate,
    OrganizationVolunteerUpdate,
    OrganizationVolunteerRead,
)

from crud_functions.volunteer_management.organization_volunteer_crud import (
    OrganizationVolunteerCRUD as CRUD,
)

# Role-based routers
router_admin = APIRouter(
    dependencies=[Depends(RoleChecker(["operations admin", "superuser"]))],
)
router_member = APIRouter(
    dependencies=[Depends(RoleChecker(["volunteer", "contributor", "superuser"]))],
)
router_admin_or_member = APIRouter(
    dependencies=[Depends(RoleChecker(["operations admin", "superuser", "volunteer", "contributor"]))],
)
router_authenticated = APIRouter(
    dependencies=[Depends(RoleChecker(["volunteer", "contributor", "operations admin", "superuser"]))],
)

# (Optional) Ensure media root exists; actual saving is handled in CRUD
MEDIA_ROOT = Path("media/organization")
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)


# ---------------- CREATE (User creates their own org profile) ----------------
@router_authenticated.post("/create", response_model=OrganizationVolunteerRead)
def create_org_volunteer_endpoint(
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

    # If you already have pre-hosted URLs/paths, you can pass them here (optional)
    organization_picture: Optional[str] = Form(None),
    organization_certificate: Optional[str] = Form(None),  # alias-safe; schema maps to 'organiztion_certificate'

    # Files (preferred)
    organization_picture_file: Optional[UploadFile] = File(None),
    organization_certificate_file: Optional[UploadFile] = File(None),

    db: Session = Depends(get_db),
):
    payload = OrganizationVolunteerCreate(
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
        organization_picture=organization_picture,
        # alias accepted by schema; maps to model's 'organiztion_certificate'
        organization_certificate=organization_certificate,
    )
    return CRUD.create_organization_volunteer(
        db,
        payload,
        organization_picture_file=organization_picture_file,
        organization_certificate_file=organization_certificate_file,
    )


# ---------------- CREATE (Admin creates for any user) ----------------
@router_admin.post("/create_for_user", response_model=OrganizationVolunteerRead)
def create_org_volunteer_for_user_endpoint(
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

    organization_picture: Optional[str] = Form(None),
    organization_certificate: Optional[str] = Form(None),

    organization_picture_file: Optional[UploadFile] = File(None),
    organization_certificate_file: Optional[UploadFile] = File(None),

    db: Session = Depends(get_db),
):
    payload = OrganizationVolunteerCreate(
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
        organization_picture=organization_picture,
        organization_certificate=organization_certificate,
    )
    return CRUD.create_organization_volunteer(
        db,
        payload,
        organization_picture_file=organization_picture_file,
        organization_certificate_file=organization_certificate_file,
    )


# ---------------- READ ALL ----------------
@router_admin_or_member.get("/get_all", response_model=List[OrganizationVolunteerRead])
def get_all_org_volunteers_endpoint(
    db: Session = Depends(get_db),
):
    try:
        return CRUD.get_all_org_volunteers(db)
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Database error occurred")


# ---------------- READ BY ID ----------------
@router_admin_or_member.get("/get_by_id", response_model=OrganizationVolunteerRead)
def get_org_volunteer_by_id_endpoint(
    volunteer_id: int,
    db: Session = Depends(get_db),
):
    try:
        org = CRUD.get_org_volunteer_by_id(db, volunteer_id)
        if not org:
            raise HTTPException(status_code=404, detail="Organization volunteer not found")
        return org
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Database error occurred")


# ---------------- READ CURRENT USER'S PROFILE ----------------
@router_authenticated.get("/my_profile", response_model=OrganizationVolunteerRead)
def get_my_org_volunteer_profile_endpoint(
    user_id: int = Query(...),  # or: user_id: int = Depends(GetUserId())
    db: Session = Depends(get_db),
):
    try:
        org = CRUD.get_org_volunteer_by_user_id(db, user_id)
        if not org:
            raise HTTPException(status_code=404, detail="Organization volunteer profile not found")
        return org
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Database error occurred")


# ---------------- UPDATE (User updates their own org profile) ----------------
@router_authenticated.put("/update_my_profile", response_model=OrganizationVolunteerRead)
def update_my_org_volunteer_profile_endpoint(
    user_id: int = Form(...),  # or: Depends(GetUserId())

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

    organization_picture: Optional[str] = Form(None),
    organization_certificate: Optional[str] = Form(None),

    organization_picture_file: Optional[UploadFile] = File(None),
    organization_certificate_file: Optional[UploadFile] = File(None),

    db: Session = Depends(get_db),
):
    org = CRUD.get_org_volunteer_by_user_id(db, user_id)
    if not org:
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
        organization_picture=organization_picture,
        organization_certificate=organization_certificate,  # alias-safe
    )
    return CRUD.update_organization_volunteer(
        db,
        org.volunteer_id,
        update_data,
        organization_picture_file=organization_picture_file,
        organization_certificate_file=organization_certificate_file,
    )


# ---------------- UPDATE (Admin updates any org profile) ----------------
@router_admin.put("/update/{volunteer_id}", response_model=OrganizationVolunteerRead)
def update_org_volunteer_endpoint(
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

    organization_picture: Optional[str] = Form(None),
    organization_certificate: Optional[str] = Form(None),

    organization_picture_file: Optional[UploadFile] = File(None),
    organization_certificate_file: Optional[UploadFile] = File(None),

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
        organization_picture=organization_picture,
        organization_certificate=organization_certificate,  # alias-safe
    )
    return CRUD.update_organization_volunteer(
        db,
        volunteer_id,
        update_data,
        organization_picture_file=organization_picture_file,
        organization_certificate_file=organization_certificate_file,
    )


# ---------------- DELETE ----------------
@router_admin.delete("/delete/{volunteer_id}")
def delete_org_volunteer_endpoint(
    volunteer_id: int,
    db: Session = Depends(get_db),
):
    success = CRUD.delete_organization_volunteer(db, volunteer_id)
    if not success:
        raise HTTPException(status_code=404, detail="Organization volunteer not found")
    return {"message": "Organization volunteer deleted successfully"}


# Final router to include in main.py
router = APIRouter()
router.include_router(router_admin, prefix="/org_volunteer", tags=["Org Volunteer - Admin"])
router.include_router(router_member, prefix="/org_volunteer", tags=["Org Volunteer - Member"])
router.include_router(router_admin_or_member, prefix="/org_volunteer", tags=["Org Volunteer - Mixed Access"])
router.include_router(router_authenticated, prefix="/org_volunteer", tags=["Org Volunteer - Self-Service"])
