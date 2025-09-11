# crud_functions/volunteer_management/individual_volunteer_crud.py

from uuid import uuid4
from pathlib import Path
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException
from typing import Optional, List, Union
import shutil
import os

from models import (
    IndividualVolunteer,
    VolunteerCertificate,
    VolunteerStatus,
)
from data_schemas.individual_volunteer_schema import (
    IndividualVolunteerCreate,
    IndividualVolunteerUpdate,
)

# Directory for storing uploaded certification files
UPLOAD_DIR = Path("media/certifications")


def _save_one_file(file: UploadFile) -> dict:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "").suffix
    unique_filename = f"{uuid4().hex}{ext}"
    fp = UPLOAD_DIR / unique_filename
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


class IndividualVolunteerCRUD:
    @staticmethod
    def create_individual_volunteer(
        db: Session,
        volunteer_data: IndividualVolunteerCreate,
        certification_files: Optional[Union[List[UploadFile], UploadFile]] = None,
    ) -> IndividualVolunteer:
        """
        Saves all files as VolunteerCertificate rows.
        Also sets the legacy 'certification' column to the first file (if any) for backward compat.
        """
        # Normalize to list
        if certification_files is None:
            files: List[UploadFile] = []
        elif isinstance(certification_files, list):
            files = [f for f in certification_files if f and getattr(f, "filename", "").strip()]
        else:
            files = [certification_files] if getattr(certification_files, "filename", "").strip() else []

        # Prepare base volunteer record
        skills_str = _skills_to_csv(getattr(volunteer_data, "skills", None))
        other_medical_conditions = volunteer_data.other_medical_conditions or "N/A"

        db_volunteer = IndividualVolunteer(
            user_id=volunteer_data.user_id,
            first_name=volunteer_data.first_name,
            middle_name=volunteer_data.middle_name,
            last_name=volunteer_data.last_name,
            email=volunteer_data.email,
            phone_number=volunteer_data.phone_number,
            address=volunteer_data.address,
            birthday=volunteer_data.birthday,
            gender=volunteer_data.gender,
            age=volunteer_data.age,
            availability=volunteer_data.availability,
            medical_conditions=volunteer_data.medical_conditions,
            other_medical_conditions=other_medical_conditions,
            certification=None,  # will set to first file path below (legacy)
            skills=skills_str,
            status=volunteer_data.status or VolunteerStatus.submitted,
            # availability_status left to model default (unavailable)
        )

        try:
            db.add(db_volunteer)
            db.flush()  # get volunteer_id

            first_path: Optional[str] = None
            for idx, f in enumerate(files):
                meta = _save_one_file(f)
                if idx == 0:
                    first_path = meta["file_path"]  # remember first for legacy column
                db.add(VolunteerCertificate(
                    individual_volunteer_id=db_volunteer.volunteer_id,
                    file_name=meta["file_name"],
                    file_path=meta["file_path"],
                    mime_type=meta["mime_type"],
                ))

            # set legacy single-file column to first uploaded file (if any)
            if first_path:
                db_volunteer.certification = first_path

            db.commit()
            db.refresh(db_volunteer)
            return db_volunteer
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {e}")

    @staticmethod
    def get_all_volunteers(db: Session) -> List[IndividualVolunteer]:
        try:
            return db.query(IndividualVolunteer).all()
        except Exception:
            raise HTTPException(status_code=500, detail="Error fetching volunteers")

    @staticmethod
    def get_volunteer_by_id(db: Session, volunteer_id: int) -> Optional[IndividualVolunteer]:
        return (
            db.query(IndividualVolunteer)
            .filter(IndividualVolunteer.volunteer_id == volunteer_id)
            .first()
        )

    @staticmethod
    def get_volunteer_by_user_id(db: Session, user_id: int) -> Optional[IndividualVolunteer]:
        """Get volunteer profile by user_id (most recent)."""
        return (
            db.query(IndividualVolunteer)
            .filter(IndividualVolunteer.user_id == user_id)
            .order_by(IndividualVolunteer.created_at.desc().nullslast())
            .first()
        )

    @staticmethod
    def add_certificates_for_individual(
        db: Session, volunteer_id: int, files: List[UploadFile]
    ) -> List[VolunteerCertificate]:
        v = db.get(IndividualVolunteer, volunteer_id)
        if not v:
            raise HTTPException(status_code=404, detail="Individual volunteer not found")
        created = []
        try:
            for f in files or []:
                if not (f and getattr(f, "filename", "").strip()):
                    continue
                meta = _save_one_file(f)
                cert = VolunteerCertificate(
                    individual_volunteer_id=volunteer_id,
                    file_name=meta["file_name"],
                    file_path=meta["file_path"],
                    mime_type=meta["mime_type"],
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
    def update_volunteer(
        db: Session,
        volunteer_id: int,
        update_data: IndividualVolunteerUpdate,
        certification_files: Optional[Union[List[UploadFile], UploadFile]] = None,
    ) -> IndividualVolunteer:
        volunteer = (
            db.query(IndividualVolunteer)
            .filter(IndividualVolunteer.volunteer_id == volunteer_id)
            .first()
        )

        if not volunteer:
            raise HTTPException(status_code=404, detail="Volunteer not found")

        # Update provided fields (incl. skills transformation)
        payload = update_data.dict(exclude_unset=True)
        if "skills" in payload:
            payload["skills"] = _skills_to_csv(payload["skills"])
        for field, value in payload.items():
            setattr(volunteer, field, value)

        # Normalize incoming files
        if certification_files is None:
            files: List[UploadFile] = []
        elif isinstance(certification_files, list):
            files = [f for f in certification_files if f and getattr(f, "filename", "").strip()]
        else:
            files = [certification_files] if getattr(certification_files, "filename", "").strip() else []

        try:
            db.flush()

            # If exactly one file provided and you want to keep "replace" semantics for the legacy column:
            if len(files) == 1:
                # replace legacy single file path (and attempt to delete old)
                meta = _save_one_file(files[0])
                old_cert = volunteer.certification
                volunteer.certification = meta["file_path"]
                if old_cert and os.path.isfile(old_cert):
                    try:
                        os.remove(old_cert)
                    except Exception:
                        pass
                # also add to the certificates table
                db.add(VolunteerCertificate(
                    individual_volunteer_id=volunteer.volunteer_id,
                    file_name=meta["file_name"],
                    file_path=meta["file_path"],
                    mime_type=meta["mime_type"],
                ))
            elif len(files) > 1:
                # multiple files -> append as new certificates; don't touch legacy column
                for f in files:
                    meta = _save_one_file(f)
                    db.add(VolunteerCertificate(
                        individual_volunteer_id=volunteer.volunteer_id,
                        file_name=meta["file_name"],
                        file_path=meta["file_path"],
                        mime_type=meta["mime_type"],
                    ))

            db.commit()
            db.refresh(volunteer)
            return volunteer
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Error updating volunteer: {e}")

    @staticmethod
    def delete_volunteer(db: Session, volunteer_id: int) -> bool:
        db_volunteer = (
            db.query(IndividualVolunteer)
            .filter(IndividualVolunteer.volunteer_id == volunteer_id)
            .first()
        )
        if not db_volunteer:
            return False

        # Collect certificate file paths (legacy + multi)
        file_paths: List[str] = []
        if db_volunteer.certification:
            file_paths.append(db_volunteer.certification)
        for cert in list(getattr(db_volunteer, "certificates", []) or []):
            if cert.file_path:
                file_paths.append(cert.file_path)

        db.delete(db_volunteer)
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
    def delete_certificate(db: Session, certificate_id: int) -> bool:
        cert = db.query(VolunteerCertificate).filter(VolunteerCertificate.id == certificate_id).first()
        if not cert:
            return False
        path = cert.file_path
        db.delete(cert)
        db.commit()
        if path and os.path.isfile(path):
            try:
                os.remove(path)
            except Exception:
                pass
        return True

    @staticmethod
    def get_status_by_user_id(db: Session, user_id: int) -> Optional[VolunteerStatus]:
        rec = (
            db.query(IndividualVolunteer)
            .filter(IndividualVolunteer.user_id == user_id)
            .first()
        )
        return rec.status if rec else None

    @staticmethod
    def update_availability_status(db: Session, volunteer_id: int, status: VolunteerStatus) -> IndividualVolunteer:
        v = db.query(IndividualVolunteer).filter(IndividualVolunteer.volunteer_id == volunteer_id).first()
        if not v:
            raise HTTPException(status_code=404, detail="Individual volunteer not found")

        # Update availability_status (NOT main status)
        v.availability_status = status
        db.commit()
        db.refresh(v)
        return v
