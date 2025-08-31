from uuid import uuid4
from pathlib import Path
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException
from typing import Optional, List, Union
from models import IndividualVolunteer
from data_schemas.individual_volunteer_schema import (
    IndividualVolunteerCreate,
    IndividualVolunteerUpdate,
)
import shutil
import os
from models import VolunteerStatus

# Directory for storing uploaded certification files
UPLOAD_DIR = Path("media/certifications")


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
        certification_file: Optional[UploadFile] = None,
    ) -> IndividualVolunteer:
        file_path = None

        if certification_file and certification_file.filename:
            try:
                UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
                ext = Path(certification_file.filename).suffix
                unique_filename = f"{uuid4().hex}{ext}"
                file_path = UPLOAD_DIR / unique_filename
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(certification_file.file, buffer)
            except Exception as e:
                print(f"Error saving certification file: {e}")
                raise HTTPException(status_code=500, detail="Error saving certification file")

        full_path_str = str(file_path).replace("\\", "/") if file_path else None
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
            certification=full_path_str,
            skills=skills_str,
            status=volunteer_data.status or VolunteerStatus.submitted,
        )

        try:
            db.add(db_volunteer)
            db.commit()
            db.refresh(db_volunteer)  # created_at is populated here
            return db_volunteer
        except Exception as e:
            db.rollback()
            print(f"Database error: {e}")
            raise HTTPException(status_code=500, detail="Database error")

    @staticmethod
    def get_all_volunteers(db: Session) -> List[IndividualVolunteer]:
        try:
            return db.query(IndividualVolunteer).all()
        except Exception as e:
            print(f"Error fetching volunteers: {e}")
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
        # If you only allow one record per user, a simple .first() is fine.
        # If multiple can exist, pick the newest by updated_at/created_at.
        return (
            db.query(IndividualVolunteer)
            .filter(IndividualVolunteer.user_id == user_id)
            .order_by(IndividualVolunteer.updated_at.desc().nullslast(),
                      IndividualVolunteer.created_at.desc().nullslast())
            .first()
        )

    @staticmethod
    def update_volunteer(
        db: Session,
        volunteer_id: int,
        update_data: IndividualVolunteerUpdate,
        certification_file: Optional[UploadFile] = None,
    ) -> IndividualVolunteer:
        volunteer = (
            db.query(IndividualVolunteer)
            .filter(IndividualVolunteer.volunteer_id == volunteer_id)
            .first()
        )

        if not volunteer:
            raise HTTPException(status_code=404, detail="Volunteer not found")

        # Handle certification file replacement (optional: delete old file)
        if certification_file and certification_file.filename.strip():
            try:
                UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
                ext = Path(certification_file.filename).suffix
                unique_name = f"{uuid4().hex}{ext}"
                file_location = UPLOAD_DIR / unique_name
                with open(file_location, "wb") as buffer:
                    shutil.copyfileobj(certification_file.file, buffer)

                old_cert = volunteer.certification
                volunteer.certification = str(file_location).replace("\\", "/")

                # Optional cleanup
                if old_cert and os.path.isfile(old_cert):
                    try:
                        os.remove(old_cert)
                    except Exception as e:
                        print(f"Warning: couldn't delete old cert file {old_cert}: {e}")
            except Exception as e:
                print(f"Error saving certification file: {e}")
                raise HTTPException(status_code=500, detail="Error saving certification file")

        # Update only provided fields, converting skills (list -> CSV) if present
        payload = update_data.dict(exclude_unset=True)
        if "skills" in payload:
            payload["skills"] = _skills_to_csv(payload["skills"])

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
    def delete_volunteer(db: Session, volunteer_id: int) -> bool:
        db_volunteer = (
            db.query(IndividualVolunteer)
            .filter(IndividualVolunteer.volunteer_id == volunteer_id)
            .first()
        )
        if not db_volunteer:
            return False

        # Optional: also remove certification file
        old_cert = db_volunteer.certification

        db.delete(db_volunteer)
        db.commit()

        if old_cert and os.path.isfile(old_cert):
            try:
                os.remove(old_cert)
            except Exception as e:
                print(f"Warning: couldn't delete cert file {old_cert}: {e}")

        return True

    @staticmethod
    def get_volunteer_by_user_id(db: Session, user_id: int) -> Optional[IndividualVolunteer]:
        """Get volunteer profile by user_id"""
        return db.query(IndividualVolunteer).filter(IndividualVolunteer.user_id == user_id).first()

    @staticmethod
    def get_status_by_user_id(db: Session, user_id: int) -> Optional[VolunteerStatus]:  # NEW
        rec = db.query(IndividualVolunteer).filter(IndividualVolunteer.user_id == user_id).first()
        return rec.status if rec else None
