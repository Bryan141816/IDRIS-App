# crud_functions/volunteer_management/organization_volunteer_crud.py

from uuid import uuid4
from pathlib import Path
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException
from typing import Optional, List
import shutil, os

from models import (
    OrganizationVolunteer, VolunteerCertificate, VolunteerStatus
)
from data_schemas.organization_volunteers import (
    OrganizationVolunteerCreate,
    OrganizationVolunteerUpdate,
)

# Directories
UPLOAD_DIR = Path("media/organization_files")          # certificates
PICTURE_DIR = Path("media/organization_pictures")      # organization picture


def _save_in_dir(file: UploadFile, dest_dir: Path) -> dict:
    dest_dir.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "").suffix
    unique_filename = f"{uuid4().hex}{ext}"
    fp = dest_dir / unique_filename
    try:
        with open(fp, "wb") as buf:
            shutil.copyfileobj(file.file, buf)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {e}")
    return {
        "file_name": file.filename or unique_filename,
        "file_path": str(fp).replace("\\", "/"),
        "mime_type": file.content_type or None,
    }

def _save_one_file(file: UploadFile) -> dict:
    return _save_in_dir(file, UPLOAD_DIR)

def _save_picture(file: UploadFile) -> dict:
    return _save_in_dir(file, PICTURE_DIR)


class OrganizationVolunteerCRUD:
    @staticmethod
    def create_organization_volunteer(
        db: Session,
        organization_data: OrganizationVolunteerCreate,
        *,
        certificates: Optional[List[UploadFile]] = None,
        organization_picture: Optional[UploadFile] = None,
    ) -> OrganizationVolunteer:
        """
        Creates OrganizationVolunteer, optional picture, and any number of certificates.
        Sets organization_certificate to the first cert path (compat).
        """

        # 1) Picture
        picture_path: Optional[str] = None
        if organization_picture and (organization_picture.filename or "").strip():
            pic_meta = _save_picture(organization_picture)
            picture_path = pic_meta["file_path"]

        # 2) Base record
        ov = OrganizationVolunteer(
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
            organization_picture=picture_path,
            organization_certificate=None,  # will be set after persisting certs (first one)
            volunteer_type=getattr(organization_data, "volunteer_type", None) or "organization",
            status=organization_data.status or VolunteerStatus.submitted,
            # availability_status left to model default (unavailable)
        )

        try:
            db.add(ov)
            db.commit()
            db.refresh(ov)
        except Exception:
            db.rollback()
            raise HTTPException(status_code=500, detail="Database error while creating organization volunteer")

        # 3) Certificates (multi)
        created: List[VolunteerCertificate] = []
        if certificates:
            created = OrganizationVolunteerCRUD.add_certificates_for_organization(
                db=db, org_volunteer_id=ov.volunteer_id, files=certificates
            )

        # 4) Set single-string field to the first cert path if available (compat)
        if created and not ov.organization_certificate:
            ov.organization_certificate = created[0].file_path
            db.commit()
            db.refresh(ov)

        return ov

    @staticmethod
    def get_all_organization_volunteers(db: Session) -> List[OrganizationVolunteer]:
        try:
            return db.query(OrganizationVolunteer).all()
        except Exception:
            raise HTTPException(status_code=500, detail="Error fetching organization volunteers")

    @staticmethod
    def get_organization_volunteer_by_id(db: Session, volunteer_id: int) -> Optional[OrganizationVolunteer]:
        return db.query(OrganizationVolunteer).filter(OrganizationVolunteer.volunteer_id == volunteer_id).first()

    @staticmethod
    def add_certificates_for_organization(
        db: Session, org_volunteer_id: int, files: List[UploadFile]
    ) -> List[VolunteerCertificate]:
        ov = db.get(OrganizationVolunteer, org_volunteer_id)
        if not ov:
            raise HTTPException(status_code=404, detail="Organization volunteer not found")
        created: List[VolunteerCertificate] = []
        try:
            for f in files or []:
                if not (f and f.filename and f.filename.strip()):
                    continue
                meta = _save_one_file(f)
                cert = VolunteerCertificate(
                    organization_volunteer_id=org_volunteer_id,
                    file_name=meta["file_name"], file_path=meta["file_path"], mime_type=meta["mime_type"]
                )
                db.add(cert)
                created.append(cert)
            db.commit()
            for c in created:
                db.refresh(c)
            return created
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Error adding certificates: {e}")

    @staticmethod
    def update_organization_volunteer(
        db: Session,
        volunteer_id: int,
        update_data: OrganizationVolunteerUpdate,
        *,
        certificates: Optional[List[UploadFile]] = None,
        organization_picture: Optional[UploadFile] = None,
    ) -> OrganizationVolunteer:
        ov = db.query(OrganizationVolunteer).filter(OrganizationVolunteer.volunteer_id == volunteer_id).first()
        if not ov:
            raise HTTPException(status_code=404, detail="Organization volunteer not found")

        # 1) scalar fields
        payload = update_data.dict(exclude_unset=True)
        for field, value in payload.items():
            setattr(ov, field, value)

        # 2) new picture (replace & optionally delete old)
        if organization_picture and (organization_picture.filename or "").strip():
            new_meta = _save_picture(organization_picture)
            new_path = new_meta["file_path"]
            old_path = ov.organization_picture
            ov.organization_picture = new_path
            if old_path and os.path.isfile(old_path):
                try:
                    os.remove(old_path)
                except Exception:
                    pass  # best-effort cleanup

        # 3) additional certificates (append)
        if certificates:
            OrganizationVolunteerCRUD.add_certificates_for_organization(db, ov.volunteer_id, certificates)

        try:
            db.commit()
            db.refresh(ov)
            return ov
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Error updating volunteer: {str(e)}")

    @staticmethod
    def delete_organization_volunteer(db: Session, volunteer_id: int) -> bool:
        ov = db.query(OrganizationVolunteer).filter(OrganizationVolunteer.volunteer_id == volunteer_id).first()
        if not ov:
            return False

        # Collect file paths for cleanup (picture, legacy single cert, all multi certs)
        file_paths: List[str] = []
        if ov.organization_picture:
            file_paths.append(ov.organization_picture)
        if ov.organization_certificate:
            file_paths.append(ov.organization_certificate)
        for cert in list(getattr(ov, "certificates", []) or []):
            if cert.file_path:
                file_paths.append(cert.file_path)

        db.delete(ov)
        db.commit()

        # best-effort cleanup
        for path in file_paths:
            if path and os.path.isfile(path):
                try:
                    os.remove(path)
                except Exception:
                    pass
        return True

    @staticmethod
    def get_organization_volunteer_by_user_id(db: Session, user_id: int) -> Optional[OrganizationVolunteer]:
        return db.query(OrganizationVolunteer).filter(OrganizationVolunteer.user_id == user_id).first()

    @staticmethod
    def get_status_by_user_id(db: Session, user_id: int) -> Optional[VolunteerStatus]:
        rec = db.query(OrganizationVolunteer).filter(OrganizationVolunteer.user_id == user_id).first()
        return rec.status if rec else None

    @staticmethod
    def update_availability_status(db: Session, volunteer_id: int, status: VolunteerStatus) -> OrganizationVolunteer:
        ov = db.query(OrganizationVolunteer).filter(OrganizationVolunteer.volunteer_id == volunteer_id).first()
        if not ov:
            raise HTTPException(status_code=404, detail="Organization volunteer not found")
        # Write to availability_status (NOT main status)
        ov.availability_status = status
        db.commit()
        db.refresh(ov)
        return ov
