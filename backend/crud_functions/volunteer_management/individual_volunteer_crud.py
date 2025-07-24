from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from models import IndividualVolunteer
from schemas import  IndividualVolunteerCreate

def create_individual_volunteer(db: Session, volunteer_data: IndividualVolunteerCreate) -> IndividualVolunteer:
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
        decribed_medical_conditions=volunteer_data.described_medical_conditions
    )
    db.add(db_volunteer)
    db.commit()
    db.refresh(db_volunteer)
    return db_volunteer


def get_individual_volunteer_by_id(db: Session, volunteer_id: int) -> Optional[IndividualVolunteer]:
    return db.query(IndividualVolunteer).filter(IndividualVolunteer.volunteerId == volunteer_id).first()


def get_all_individual_volunteers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(IndividualVolunteer).offset(skip).limit(limit).all()


def update_individual_volunteer(db: Session, volunteer_id: int, update_data: dict):
    db_volunteer = get_individual_volunteer_by_id(db, volunteer_id)
    if not db_volunteer:
        return None
    for key, value in update_data.items():
        setattr(db_volunteer, key, value)
    db.commit()
    db.refresh(db_volunteer)
    return db_volunteer


def delete_individual_volunteer(db: Session, volunteer_id: int):
    db_volunteer = get_individual_volunteer_by_id(db, volunteer_id)
    if not db_volunteer:
        return None
    db.delete(db_volunteer)
    db.commit()
    return db_volunteer
