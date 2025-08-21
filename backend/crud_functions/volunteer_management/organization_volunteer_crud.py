from uuid import uuid4
from pathlib import Path
from typing import Optional, List, Union
import os
import shutil

from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from models import OrganizationVolunteer
from data_schemas.organization_volunteers import (
    OrganizationVolunteerCreate,
    OrganizationVolunteerUpdate,
)

# Directories to store files
PIC_DIR = Path("media/organization/pictures")
CERT_DIR = Path("media/organization/certificates")
PIC_DIR.mkdir(parents=True, exist_ok=True)
CERT_DIR.mkdir(parents=True, exist_ok=True)


def _save_upload_to(file: UploadFile, target_dir: Path) -> str:
    """
    Save an UploadFile to target_dir using a UUID filename, preserving extension.
    Returns a POSIX-style string path suitable for storing in DB.
    """
    try:
        target_dir.mkdir(parents=True, exist_ok=True)
        ext = Path(file.filename or "").suffix
        unique_name = f"{uuid4().hex}{ext}"
        dest = target_dir / unique_name
        with open(dest, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return str(dest).replace("\\", "/")
    except Exception as e:
        print(f"Error saving upload to {target_dir}: {e}")
        raise HTTPException(status_code=500, detail="Error saving uploaded file")


def _remove_file(path_str: Optional[str]) -> None:
    """Best-effort removal of a file by path string."""
    if not path_str:
        return
    try:
        if os.path.isfile(path_str):
            os.remove(path_str)
    except Exception as e:
        # Don't fail the whole request; just log
        print(f"Warning: couldn't delete file {path_str}: {e}")


class OrganizationVolunteerCRUD:
    @staticmethod
    def create_organization_volunteer(
        db: Session,
        payload: OrganizationVolunteerCreate,
        organization_picture_file: Optional[UploadFile] = None,
        organization_certificate_file: Optional[UploadFile] = None,
    ) -> OrganizationVolunteer:
        picture_path: Optional[str] = None
        certificate_path: Optional[str] = None

        if organization_picture_file and organization_picture_file.filename:
            picture_path = _save_upload_to(organization_picture_file, PIC_DIR)

        if organization_certificate_file and organization_certificate_file.filename:
            certificate_path = _save_upload_to(organization_certificate_file, CERT_DIR)

        db_obj = OrganizationVolunteer(
            user_id=payload.user_id,
            organization_name=payload.organization_name,
            organization_type=payload.organization_type,
            organization_email=payload.organization_email,
            organization_phone_number=payload.organization_phone_number,
            organization_address=payload.organization_address,
            contact_person_name=payload.contact_person_name,
            contact_person_position=payload.contact_person_position,
            contact_person_phone_number=payload.contact_person_phone_number,
            contact_person_email=payload.contact_person_email,
            availability=payload.availability,
            organization_picture=picture_path,
            # NOTE: DB column is 'organiztion_certificate' (typo in model)
            organiztion_certificate=certificate_path or payload.organiztion_certificate,
        )

        try:
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)  # created_at populated by DB default
            return db_obj
        except Exception as e:
            db.rollback()
            print(f"Database error (create_organization_volunteer): {e}")
            # Optional: cleanup newly saved files on failure
            _remove_file(picture_path)
            _remove_file(certificate_path)
            raise HTTPException(status_code=500, detail="Database error")

    @staticmethod
    def get_all_org_volunteers(db: Session) -> List[OrganizationVolunteer]:
        try:
            return db.query(OrganizationVolunteer).all()
        except Exception as e:
            print(f"Error fetching org volunteers: {e}")
            raise HTTPException(status_code=500, detail="Error fetching organization volunteers")

    @staticmethod
    def get_org_volunteer_by_id(db: Session, volunteer_id: int) -> Optional[OrganizationVolunteer]:
        return (
            db.query(OrganizationVolunteer)
            .filter(OrganizationVolunteer.volunteer_id == volunteer_id)
            .first()
        )

    @staticmethod
    def get_org_volunteer_by_user_id(db: Session, user_id: int) -> Optional[OrganizationVolunteer]:
        return db.query(OrganizationVolunteer).filter(OrganizationVolunteer.user_id == user_id).first()

    @staticmethod
    def update_organization_volunteer(
        db: Session,
        volunteer_id: int,
        update_data: OrganizationVolunteerUpdate,
        organization_picture_file: Optional[UploadFile] = None,
        organization_certificate_file: Optional[UploadFile] = None,
    ) -> OrganizationVolunteer:
        org = (
            db.query(OrganizationVolunteer)
            .filter(OrganizationVolunteer.volunteer_id == volunteer_id)
            .first()
        )
        if not org:
            raise HTTPException(status_code=404, detail="Organization volunteer not found")

        # Handle new uploads (save first; only delete old after successful commit)
        new_picture_path: Optional[str] = None
        new_certificate_path: Optional[str] = None

        if organization_picture_file and organization_picture_file.filename.strip():
            new_picture_path = _save_upload_to(organization_picture_file, PIC_DIR)

        if organization_certificate_file and organization_certificate_file.filename.strip():
            new_certificate_path = _save_upload_to(organization_certificate_file, CERT_DIR)

        # Build payload; prefer uploaded files over any explicit path in update_data
        payload = update_data.dict(exclude_unset=True, by_alias=False)

        if new_picture_path is not None:
            payload["organization_picture"] = new_picture_path

        if new_certificate_path is not None:
            # DB column name in model is 'organiztion_certificate'
            payload["organiztion_certificate"] = new_certificate_path

        # Apply partial updates
        old_picture = org.organization_picture
        old_certificate = org.organiztion_certificate

        for field, value in payload.items():
            setattr(org, field, value)

        try:
            db.commit()
            db.refresh(org)
            # After successful commit, remove old files if we replaced them
            if new_picture_path and old_picture and new_picture_path != old_picture:
                _remove_file(old_picture)
            if new_certificate_path and old_certificate and new_certificate_path != old_certificate:
                _remove_file(old_certificate)
            return org
        except Exception as e:
            db.rollback()
            print(f"Database error (update_organization_volunteer): {e}")
            # Cleanup newly saved files if DB write failed
            _remove_file(new_picture_path)
            _remove_file(new_certificate_path)
            raise HTTPException(status_code=500, detail="Error updating organization volunteer")

    @staticmethod
    def delete_organization_volunteer(db: Session, volunteer_id: int) -> bool:
        org = (
            db.query(OrganizationVolunteer)
            .filter(OrganizationVolunteer.volunteer_id == volunteer_id)
            .first()
        )
        if not org:
            return False

        old_picture = org.organization_picture
        old_certificate = org.organiztion_certificate

        try:
            db.delete(org)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Database error (delete_organization_volunteer): {e}")
            raise HTTPException(status_code=500, detail="Error deleting organization volunteer")

        # Best-effort file cleanup
        _remove_file(old_picture)
        _remove_file(old_certificate)
        return True
