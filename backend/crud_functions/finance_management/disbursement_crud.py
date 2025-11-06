from sqlalchemy.orm import Session
from models import Disbursement, DisbursementItem, ProcurementRequest,DistributionRoute,DistributionRouteLogs
from data_schemas.finance_disbursement import DisbursementCreate, DisbursementUpdate
from crud_functions.utils import uid_from_string, random_suffix
from datetime import datetime, time, timedelta, timezone
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

def add_distribution_route(request_id: int, db:Session):
    request = db.query(ProcurementRequest).filter(ProcurementRequest.request_id == request_id).first()
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

    

def update_disbursement_status(db: Session, disbursementId: str, disbursement_update: DisbursementUpdate):
    db_disbursement = get_disbursement(db, disbursementId)
    if disbursement_update.status is not None and disbursement_update.status.lower() == "approved":
        add_distribution_route(db_disbursement.origin_id, db)
    if db_disbursement:
        if disbursement_update.status is not None:
            db_disbursement.status = disbursement_update.status.upper()
        db.commit()
        db.refresh(db_disbursement)
    return db_disbursement


