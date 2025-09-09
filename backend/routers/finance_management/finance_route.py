from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status, Form
from sqlalchemy.orm import Session
from routers.role_checker import RoleChecker

from database import get_db
from data_schemas.finance_record_schema import (
    InflowFinanceRecordCreate,
    FinanceRecordRead,
    # FinanceRecordUpdate,
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

@router_admin.post(
    "/inflow/create",
    response_model=FinanceRecordRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a finance record"
)
def create_finance_record(
    payload: InflowFinanceRecordCreate = Depends(InflowFinanceRecordCreate.as_form),
    db: Session = Depends(get_db),
):
    print(payload)
    obj = FinanceRecordCRUD.create_finance_record(db, payload)
    return obj

@router_admin_or_donor.get("/{finance_id}", response_model=FinanceRecordRead, summary="Get a finance record by ID" )
def get_finance_record(finance_id: str, db: Session = Depends(get_db)):
    obj = FinanceRecordCRUD.get(db, finance_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Finance record not found")
    return obj


@router_admin_or_donor.get("/get_lists",response_model=List[FinanceRecordRead], summary="List finance records (filterable)" )
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


# @router_admin.patch( "/update_record/{finance_id}", response_model=FinanceRecordRead, summary="Update editable fields of a finance record" )
# def update_finance_record(finance_id: str, patch: FinanceRecordUpdate, db: Session = Depends(get_db)):
#     obj = FinanceRecordCRUD.update(db, finance_id, patch)
#     if not obj:
#         raise HTTPException(status_code=404, detail="Finance record not found")
#     return obj


# @router_admin.patch( "/{finance_id}/status", response_model=FinanceRecordRead, summary="Update status of a finance record" )
# def update_finance_record_status(finance_id: str, payload: FinanceRecordStatusUpdate, db: Session = Depends(get_db)):
#     obj = FinanceRecordCRUD.update_status(db, finance_id, payload)
#     if not obj:
#         raise HTTPException(status_code=404, detail="Finance record not found")
#     return obj


# @router_admin.delete( "/{finance_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a finance record" )
# def delete_finance_record(finance_id: str, db: Session = Depends(get_db)):
#     ok = FinanceRecordCRUD.delete(db, finance_id)
#     if not ok:
#         raise HTTPException(status_code=404, detail="Finance record not found")
#     return None


router = APIRouter()
router.include_router(router_admin)
router.include_router(router_donor)
router.include_router(router_admin_or_donor)
