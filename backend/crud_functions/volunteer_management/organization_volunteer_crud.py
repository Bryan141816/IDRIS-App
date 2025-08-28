from uuid import uuid4
from pathlib import Path
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException
from typing import Optional, List, Union
from models import OrganizationVolunteer
from data_schemas.organization_volunteers import (
    OrganizationVolunteerCreate,
    OrganizationVolunteerUpdate,
)
import shutil
import os
from models import VolunteerStatus

# Directory for storing uploaded organization-related files (e.g., certificates)
UPLOAD_DIR = Path("media/organization_files")


def _skills_to_csv(value: Optional[Union[List[str], str]]) -> Optional[str]:
    """
    Accepts a list[str] (preferred) or a comma string, returns a normalized CSV or None.
    - trims spaces
    - drops empties
    - dedupes while preserving order
    """
    if value is None:
        return None
    if isinstance(value, str):
        items = [s.strip() for s in value.split(",")]
    else:
        items = [s.strip() for s in value if isinstance(s, str)]
    items = [s for i, s in enumerate(items) if s and s not in items[:i]]  # dedupe, keep order
    return ",".join(items) if items else None


class OrganizationVolunteerCRUD:
    @staticmethod
    def create_organization_volunteer(
        db: Session,
        organization_data: OrganizationVolunteerCreate,
        certificate_file: Optional[UploadFile] = None,
    ) -> OrganizationVolunteer:

        file_path = None

        if certificate_file and certificate_file.filename:
            try:
                UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
                ext = Path(certificate_file.filename).suffix
                unique_filename = f"{uuid4().hex}{ext}"
                file_path = UPLOAD_DIR / unique_filename
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(certificate_file.file, buffer)
            except Exception as e:
                print(f"Error saving certificate file: {e}")
                raise HTTPException(status_code=500, detail="Error saving certificate file")

        full_path_str = str(file_path).replace("\\", "/") if file_path else None

        db_organization_volunteer = OrganizationVolunteer(
            user_id=organization_data.user_id,
            organization_name=organization_data.organization_name,
            organization_type=organization_data.organization_type,
            organization_email=organization_data.organization_email,
            organization_phone_number=organization_data.organization_phone_number,
            organization_address=organization_data.organization_address,
            contact_person_name=organization_data.contact_person_name,
            contact_person_position=organization_data.contact_person_position,
            contact_person_phone_number=organization_data.contact_person_phone_number,
            contact_person_email=organization_data.contact_person_email,
            availability=organization_data.availability,
            organization_picture=organization_data.organization_picture,
            organization_certificate=full_path_str,
            volunteer_type=organization_data.volunteer_type,
            status=organization_data.status or VolunteerStatus.submitted,
        )

        try:
            db.add(db_organization_volunteer)
            db.commit()
            db.refresh(db_organization_volunteer)  # created_at is populated here
            return db_organization_volunteer
        except Exception as e:
            db.rollback()
            print(f"Database error: {e}")
            raise HTTPException(status_code=500, detail="Database error")

    @staticmethod
    def get_all_organization_volunteers(db: Session) -> List[OrganizationVolunteer]:
        try:
            return db.query(OrganizationVolunteer).all()
        except Exception as e:
            print(f"Error fetching organization volunteers: {e}")
            raise HTTPException(status_code=500, detail="Error fetching organization volunteers")

    @staticmethod
    def get_organization_volunteer_by_id(db: Session, volunteer_id: int) -> Optional[OrganizationVolunteer]:
        return (
            db.query(OrganizationVolunteer)
            .filter(OrganizationVolunteer.volunteer_id == volunteer_id)
            .first()
        )

    @staticmethod
    def update_organization_volunteer(
        db: Session,
        volunteer_id: int,
        update_data: OrganizationVolunteerUpdate,
        certificate_file: Optional[UploadFile] = None,
    ) -> OrganizationVolunteer:
        volunteer = (
            db.query(OrganizationVolunteer)
            .filter(OrganizationVolunteer.volunteer_id == volunteer_id)
            .first()
        )

        if not volunteer:
            raise HTTPException(status_code=404, detail="Organization volunteer not found")

        # Handle certificate file replacement (optional: delete old file)
        if certificate_file and certificate_file.filename.strip():
            try:
                UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
                ext = Path(certificate_file.filename).suffix
                unique_name = f"{uuid4().hex}{ext}"
                file_location = UPLOAD_DIR / unique_name
                with open(file_location, "wb") as buffer:
                    shutil.copyfileobj(certificate_file.file, buffer)

                old_cert = volunteer.organization_certificate
                volunteer.organization_certificate = str(file_location).replace("\\", "/")

                # Optional cleanup
                if old_cert and os.path.isfile(old_cert):
                    try:
                        os.remove(old_cert)
                    except Exception as e:
                        print(f"Warning: couldn't delete old cert file {old_cert}: {e}")
            except Exception as e:
                print(f"Error saving certificate file: {e}")
                raise HTTPException(status_code=500, detail="Error saving certificate file")

        # Update only provided fields
        payload = update_data.dict(exclude_unset=True)

        for field, value in payload.items():
            setattr(volunteer, field, value)

        try:
            db.commit()
            db.refresh(volunteer)
            return volunteer
        except Exception as e:
            db.rollback()
            print(f"Database error: {e}")
            raise HTTPException(status_code=500, detail=f"Error updating volunteer: {str(e)}")

    @staticmethod
    def delete_organization_volunteer(db: Session, volunteer_id: int) -> bool:
        db_volunteer = (
            db.query(OrganizationVolunteer)
            .filter(OrganizationVolunteer.volunteer_id == volunteer_id)
            .first()
        )
        if not db_volunteer:
            return False

        # Optional: also remove certificate file
        old_cert = db_volunteer.organization_certificate

        db.delete(db_volunteer)
        db.commit()

        if old_cert and os.path.isfile(old_cert):
            try:
                os.remove(old_cert)
            except Exception as e:
                print(f"Warning: couldn't delete cert file {old_cert}: {e}")

        return True

    @staticmethod
    def get_organization_volunteer_by_user_id(db: Session, user_id: int) -> Optional[OrganizationVolunteer]:
        """Get organization volunteer profile by user_id"""
        return db.query(OrganizationVolunteer).filter(OrganizationVolunteer.user_id == user_id).first()

    @staticmethod
    def get_status_by_user_id(db: Session, user_id: int) -> Optional[VolunteerStatus]:  # NEW
        rec = db.query(OrganizationVolunteer).filter(OrganizationVolunteer.user_id == user_id).first()
        return rec.status if rec else None
