import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from data_schemas.finance_disbursement import Disbursement, DisbursementCreate, DisbursementUpdate, DisbursementItemUpdate
from crud_functions.finance_management import disbursement_crud
from routers.role_checker import RoleChecker

router = APIRouter()

router_admin = APIRouter(
    dependencies=[Depends(RoleChecker(["finance admin", "superadmin"]))],
)


@router_admin.post("/disbursements/create/", response_model=Disbursement)
def create_disbursement(disbursement: DisbursementCreate, db: Session = Depends(get_db)):
    return disbursement_crud.create_disbursement(db=db, disbursement=disbursement)

@router.get("/disbursements/get_all/", response_model=List[Disbursement])
def read_disbursements(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    disbursements = disbursement_crud.get_disbursements(db, skip=skip, limit=limit)
    return disbursements

@router_admin.get("/disbursements/get_by_id/", response_model=Disbursement)
def read_disbursement(disbursement_id: str, db: Session = Depends(get_db)):
    db_disbursement = disbursement_crud.get_disbursement(db, disbursement_id=disbursement_id)
    if db_disbursement is None:
        raise HTTPException(status_code=404, detail="Disbursement not found")
    return db_disbursement

@router_admin.patch("/disbursements/update/", response_model=Disbursement)
def update_disbursement(
    db: Session = Depends(get_db),
    disbursementId: str = Form(...),
    status: str = Form(...),
    remarks: str = Form(None),
    items: str = Form(...),
    attachment: UploadFile = File(...),
    dateOfPayment: str = Form(...),
    budgetSource: str = Form(...)
):
    try:
        items_data = json.loads(items)
        items_update = [DisbursementItemUpdate(**item) for item in items_data]
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format for items")

    disbursement_update = DisbursementUpdate(
        status=status,
        remarks=remarks,
        items=items_update
    )

    db_disbursement = disbursement_crud.update_disbursement(
        db,
        disbursementId=disbursementId,
        disbursement_update=disbursement_update,
        attachment=attachment,
        dateOfPayment=dateOfPayment,
        budgetSource=budgetSource
    )
    if db_disbursement is None:
        raise HTTPException(status_code=404, detail="Disbursement not found")
    return db_disbursement

router.include_router(router_admin)
