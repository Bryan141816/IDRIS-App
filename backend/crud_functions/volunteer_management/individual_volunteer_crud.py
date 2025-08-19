from uuid import uuid4
from pathlib import Path
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException
from typing import Optional, List
from datetime import datetime
from models import IndividualVolunteer
from data_schemas.individual_volunteer_schema import (
    IndividualVolunteerCreate,
    IndividualVolunteerUpdate
)

import shutil

# Directory for storing uploaded certification files
UPLOAD_DIR = Path("media/certifications")

class IndividualVolunteerCRUD:
    @staticmethod
    def create_individual_volunteer(
        db: Session,
        volunteer_data: IndividualVolunteerCreate,
        certification_file: Optional[UploadFile] = None
    ) -> IndividualVolunteer:
        file_path = None

        if certification_file and certification_file.filename:
            try:
                UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

                # Keep original extension
                ext = Path(certification_file.filename).suffix
                unique_filename = f"{uuid4().hex}{ext}"
                file_path = UPLOAD_DIR / unique_filename

                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(certification_file.file, buffer)

            except Exception as e:
                print(f"Error saving certification file: {e}")
                raise HTTPException(status_code=500, detail="Error saving certification file")

        # Normalize path if available
        full_path_str = str(file_path).replace("\\", "/") if file_path else None

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
            other_medical_conditions=volunteer_data.other_medical_conditions,
            certification=full_path_str
        )

        try:
            db.add(db_volunteer)
            db.commit()
            db.refresh(db_volunteer)
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
        return db.query(IndividualVolunteer).filter(IndividualVolunteer.volunteer_id == volunteer_id).first()

    @staticmethod
    def update_volunteer(
        db: Session,
        volunteer_id: int,
        update_data: IndividualVolunteerUpdate,
        certification_file: Optional[UploadFile] = None
    ) -> IndividualVolunteer:
        volunteer = db.query(IndividualVolunteer).filter(IndividualVolunteer.volunteer_id == volunteer_id).first()

        if not volunteer:
            raise HTTPException(status_code=404, detail="Volunteer not found")

        if certification_file and certification_file.filename.strip():
            try:
                UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
                ext = Path(certification_file.filename).suffix
                unique_name = f"{uuid4().hex}{ext}"
                file_location = UPLOAD_DIR / unique_name

                with open(file_location, "wb") as buffer:
                    shutil.copyfileobj(certification_file.file, buffer)

                volunteer.certification = str(file_location).replace("\\", "/")

            except Exception as e:
                print(f"Error saving certification file: {e}")
                raise HTTPException(status_code=500, detail="Error saving certification file")

        # Update only provided fields
        for field, value in update_data.dict(exclude_unset=True).items():
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
        db_volunteer = db.query(IndividualVolunteer).filter(IndividualVolunteer.volunteer_id == volunteer_id).first()
        if not db_volunteer:
            return False

        db.delete(db_volunteer)
        db.commit()
        return True

    @staticmethod
    def get_volunteer_by_user_id(db: Session, user_id: int) -> Optional[IndividualVolunteer]:
        """Get volunteer profile by user_id"""
        return db.query(IndividualVolunteer).filter(IndividualVolunteer.user_id == user_id).first()
