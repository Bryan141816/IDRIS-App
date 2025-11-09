import os
import uuid
from fastapi import UploadFile
from sqlalchemy.orm import Session
from datetime import datetime, time, timezone, timedelta
from models import Disbursement, DisbursementItem, SpendCategory, InflowSource, ProcurementRequest,DistributionRoute,DistributionRouteLogs, DisbursementStatus
from data_schemas.finance_disbursement import DisbursementCreate, DisbursementUpdate
from crud_functions.utils import uid_from_string, random_suffix
from crud_functions.finance_management.finance_crud import FinanceRecordCRUD
from data_schemas.finance_record_schema import OutflowFinanceRecordCreate

UPLOAD_DIR = "media/disbursement_attachments"

def create_disbursement(db: Session, disbursement: DisbursementCreate):
    # Reverted to original to avoid out-of-scope changes
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
    return db.query(Disbursement).order_by(Disbursement.date_updated.desc()).offset(skip).limit(limit).all()

def get_disbursement(db: Session, disbursement_id: str):
    return db.query(Disbursement).filter(Disbursement.disbursement_id == disbursement_id).first()

def add_distribution_route(request_id: int, db:Session):
    request = db.query(ProcurementRequest).filter(ProcurementRequest.request_id == request_id).first()
    if not request:
        return
    request.status = "Approved"
    delivery_dt = datetime.combine(
                request.date_needed, time(9, 0, tzinfo=timezone.utc)
            )
    starting_dt = delivery_dt - timedelta(days=3)

    now = datetime.now(timezone.utc)
    if starting_dt <= now:
        starting_dt = now + timedelta(days=1)

    route = DistributionRoute(
        route_name=request.request_ref_num,
        request_id=request_id,
        start_schedule=starting_dt,
        end_schedule=delivery_dt,
    )
    db.add(route)
    db.flush()  # ensure route_id is populated before we reference it

    log = DistributionRouteLogs(
        route_id=route.route_id,
        log_message=f"{request.request_ref_num} has been created",
    )
    db.add(log)

def update_disbursement(
    db: Session, 
    disbursementId: str, 
    disbursement_update: DisbursementUpdate, 
    attachment: UploadFile, 
    resolved_at: str,
    budgetSource: str
    ):
    db_disbursement = get_disbursement(db, disbursementId)
    if db_disbursement:
        file_path = None
        if attachment:
            if not os.path.exists(UPLOAD_DIR):
                os.makedirs(UPLOAD_DIR)
            
            file_extension = os.path.splitext(attachment.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join(UPLOAD_DIR, unique_filename)
            
            with open(file_path, "wb") as buffer:
                buffer.write(attachment.file.read())
            
            db_disbursement.attachment = file_path

        print(disbursement_update.status)
        if disbursement_update.status is not None and disbursement_update.status.lower() == "approved":
            print("add please")
            add_distribution_route(db_disbursement.origin_id, db)
            
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
                    
        status_val = (disbursement_update.status or db_disbursement.status or "").upper()
        
        if status_val == 'APPROVED':
            total_amount = sum(item.unit_cost * item.quantity for item in db_disbursement.items)
            vendor_names = {item.vendor for item in db_disbursement.items if item.vendor}
            
            budget_summaries = FinanceRecordCRUD.summarize_by_budget_allocation(db)
            budget_map = {summary['budget_for']: summary['net_total'] for summary in budget_summaries}

            for source in (disbursement_update.budgetSource or []):
                available_amount = budget_map.get(source, 0)
                
                if total_amount <= 0:
                    break

                disburse_amount = min(total_amount, available_amount)
                
                if disburse_amount > 0:
                    inflow_source_enum = InflowSource[source.replace(" ", "_").upper()]
                    
                    outflow_payload = OutflowFinanceRecordCreate(
                        counterparty=", ".join(vendor_names),
                        amount=disburse_amount,
                        date=datetime.strptime(resolved_at, "%Y-%m-%d").date(),
                        purpose=db_disbursement.disbursement_name,
                        spend_category=SpendCategory.DISBURSEMENT,
                        inflow_source=inflow_source_enum,
                        attachment=file_path
                    )
                    FinanceRecordCRUD.create_outflow_record(db, outflow_payload)
                    total_amount -= disburse_amount

        db.commit()
        db.refresh(db_disbursement)
    return db_disbursement
