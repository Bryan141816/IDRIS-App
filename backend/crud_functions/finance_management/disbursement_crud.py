from sqlalchemy.orm import Session
from models import Disbursement, DisbursementItem
from data_schemas.finance_disbursement import DisbursementCreate, DisbursementUpdate
from crud_functions.utils import uid_from_string, random_suffix

def create_disbursement(db: Session, disbursement: DisbursementCreate):
    disbursement_id = uid_from_string(f"{disbursement.title}{random_suffix(10)}")
    db_disbursement = Disbursement(
        disbursement_id=disbursement_id,
        **disbursement.model_dump(exclude={"items"})
    )
    db.add(db_disbursement)
    db.commit()
    db.refresh(db_disbursement)

    for item_data in disbursement.items:
        item_id = uid_from_string(f"{disbursement.title}{random_suffix(10)}")
        db_item = DisbursementItem(
            item_id=item_id,
            disbursement_id=disbursement_id,
            **item_data.model_dump()
        )
        db.add(db_item)
    
    db.commit()
    return db_disbursement

def get_disbursements(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Disbursement).offset(skip).limit(limit).all()

def get_disbursement(db: Session, disbursement_id: str):
    return db.query(Disbursement).filter(Disbursement.disbursement_id == disbursement_id).first()

def update_disbursement_status(db: Session, disbursement_id: str, disbursement_update: DisbursementUpdate):
    db_disbursement = get_disbursement(db, disbursement_id)
    if db_disbursement:
        if disbursement_update.status is not None:
            db_disbursement.status = disbursement_update.status
        db.commit()
        db.refresh(db_disbursement)
    return db_disbursement
