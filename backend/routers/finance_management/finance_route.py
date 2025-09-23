from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status, Form
from sqlalchemy.orm import Session
from routers.role_checker import RoleChecker

from database import get_db
from data_schemas.finance_record_schema import (
    InflowFinanceRecordCreate,
    FinanceRecordRead,
    FinanceRecordUpdate,
    # FinanceRecordStatusUpdate,
    TransactionType,
    RecordStatus,
)
from crud_functions.finance_management.finance_crud import FinanceRecordCRUD

router_admin = APIRouter(
    dependencies=[Depends(RoleChecker(["finance admin", "operations admin", "superuser"]))],
)

router_user = APIRouter(
    dependencies=[Depends(RoleChecker(["generic"]))],
)

router_donor = APIRouter(
    dependencies=[Depends(RoleChecker(["donor"]))],
)

router_admin_or_donor = APIRouter(
    dependencies=[Depends(RoleChecker(["finance admin", "operations admin",  "superuser", "generic"]))],
)

@router_admin.post("/inflow/create", response_model=FinanceRecordRead, status_code=status.HTTP_201_CREATED)
def create_finance_record(
    payload: InflowFinanceRecordCreate = Depends(InflowFinanceRecordCreate.as_form),
    db: Session = Depends(get_db),
):
    payload.transaction_type = TransactionType.INFLOW
    print(payload)
    obj = FinanceRecordCRUD.create_finance_record(db, payload)
    return obj

@router_admin.post("/outflow/create", response_model=FinanceRecordRead, status_code=status.HTTP_201_CREATED)
def create_finance_record(
    payload: InflowFinanceRecordCreate = Depends(InflowFinanceRecordCreate.as_form),
    db: Session = Depends(get_db),
):
    payload.transaction_type = TransactionType.OUTFLOW
    print(payload)
    obj = FinanceRecordCRUD.create_finance_record(db, payload)
    return obj


@router_admin.get("/get_lists",response_model=List[FinanceRecordRead])
def list_finance_records(
    transaction_type: Optional[TransactionType] = Query(None),
    status_filter: Optional[RecordStatus] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    items = FinanceRecordCRUD.list(
        db,
        transaction_type=transaction_type,
        status=status_filter,
        limit=limit,
        offset=offset,
    )
    return items

@router_admin.get("/get_all/inflows", response_model=List[FinanceRecordRead])
def get_inflows(page: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Get all inflow finance records.
    Supports pagination with skip & limit.
    """
    inflows = FinanceRecordCRUD.get_inflows(db, page=page, limit=limit)
    return inflows

@router_admin.get("/get_all/outflows", response_model=List[FinanceRecordRead])
def get_outflows(page: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Get all outflow finance records.
    Supports pagination with skip & limit.
    """
    outflows = FinanceRecordCRUD.get_outflows(db, page=page, limit=limit)
    return outflows

@router_admin.patch( "/update_record", response_model=FinanceRecordRead, summary="Update editable fields of a finance record" )
def update_finance_record(patch: FinanceRecordUpdate = Depends(FinanceRecordUpdate.as_form), db: Session = Depends(get_db)):
    obj = FinanceRecordCRUD.update(db, patch.finance_id, patch)
    if not obj:
        raise HTTPException(status_code=404, detail="Finance record not found")
    return obj


# @router_admin.patch( "/{finance_id}/status", response_model=FinanceRecordRead, summary="Update status of a finance record" )
# def update_finance_record_status(finance_id: str, payload: FinanceRecordStatusUpdate, db: Session = Depends(get_db)):
#     obj = FinanceRecordCRUD.update_status(db, finance_id, payload)
#     if not obj:
#         raise HTTPException(status_code=404, detail="Finance record not found")
#     return obj


# @router_admin_or_donor.get("/{finance_id}", response_model=FinanceRecordRead)
# def get_finance_record(finance_id: str, db: Session = Depends(get_db)):
#     obj = FinanceRecordCRUD.get(db, finance_id)
#     if not obj:
#         raise HTTPException(status_code=404, detail="Finance record not found")
#     return obj


@router_admin.get("/summary/budget_allocation")
def get_budget_allocation_summary(
    start_date: Optional[date] = Query(None, description="Filter start date"),
    end_date: Optional[date] = Query(None, description="Filter end date"),
    statuses: Optional[List[RecordStatus]] = Query(
        None,
        description="Statuses to include (default: RECEIVED, PAID, RECONCILED)",
    ),
    include_zero_rows: bool = Query(True, description="Include categories with zero totals"),
    db: Session = Depends(get_db),
):
    """
    Summarize inflows and outflows grouped by budget allocation.
    """
    result = FinanceRecordCRUD.summarize_by_budget_allocation(
        db,
        start_date=start_date,
        end_date=end_date,
        statuses=statuses,
        include_zero_rows=include_zero_rows,
    )
    return result



router = APIRouter()
router.include_router(router_admin)
router.include_router(router_donor)
router.include_router(router_admin_or_donor)
