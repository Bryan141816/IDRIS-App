import os
import uuid
from fastapi import UploadFile
from sqlalchemy.orm import Session

from models import Disbursement, DisbursementItem
from data_schemas.finance_disbursement import DisbursementCreate, DisbursementUpdate
from crud_functions.utils import uid_from_string, random_suffix

UPLOAD_DIR = "backend/media/disbursement_attachments"

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

def update_disbursement(db: Session, disbursementId: str, disbursement_update: DisbursementUpdate, attachment: UploadFile):
    db_disbursement = get_disbursement(db, disbursementId)
    if db_disbursement:
        # Handle file upload
        if attachment:
            if not os.path.exists(UPLOAD_DIR):
                os.makedirs(UPLOAD_DIR)
            
            # Sanitize filename and create a unique path
            file_extension = os.path.splitext(attachment.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join(UPLOAD_DIR, unique_filename)
            
            with open(file_path, "wb") as buffer:
                buffer.write(attachment.file.read())
            
            db_disbursement.attachment = file_path

        # Update other fields
        if disbursement_update.status is not None:
            db_disbursement.status = disbursement_update.status.upper()
        
        if disbursement_update.remarks is not None:
            db_disbursement.remarks = disbursement_update.remarks

        if disbursement_update.items is not None:
            for item_update in disbursement_update.items:
                db_item = db.query(DisbursementItem).filter(DisbursementItem.item_id == item_update.item_id).first()
                if db_item:
                    db_item.unit_cost = item_update.unit_cost
                    db_item.vendor = item_update.vendor

        db.commit()
        db.refresh(db_disbursement)
    return db_disbursement
