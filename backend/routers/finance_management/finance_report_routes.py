from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status, Form
from sqlalchemy.orm import Session
from routers.role_checker import RoleChecker

from database import get_db
from data_schemas.finance_record_schema import (
    RecordStatus,
    BudgetAllocation
)
from crud_functions.finance_management.finance_report_crud import FinanceReport

router = APIRouter()

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

@router.get("/get-report/all", response_model=List[dict]) 
def list_inflows(
    from_date: Optional[date] = Query(None, description="Start date (yyyy-mm-dd)"),
    to_date: Optional[date] = Query(None, description="End date (yyyy-mm-dd)"),
    statuses: Optional[List[RecordStatus]] = Query(
        None, description="Filter by status values (e.g., PENDING, PAID)"
    ),
    allocation_type: Optional[BudgetAllocation] = Query(
        None, description="Filter by budget allocation type"
    ),
    db: Session = Depends(get_db),
):
    """
    Get inflows with optional filters: date range, status list, and allocation type.
    """
    inflows = FinanceReport.get_all(
        db=db,
        from_date=from_date,
        to_date=to_date,
        statuses=statuses,
        allocation_type=allocation_type,
    )

    # Return as dicts (or use Pydantic schema if you already have one)
    return [
        {
            "finance_id": rec.finance_id,
            "counterparty": rec.counterparty,
            "amount": float(rec.amount),
            "date": rec.date,
            "status": rec.status.value,
            "budget_for": rec.budget_for.value,
            "description": rec.description,
            "transaction_type": rec.transaction_type.value,
        }
        for rec in inflows
    ]


@router.get("/get-report/inflows", response_model=List[dict])  # replace with a proper Pydantic schema
def list_inflows(
    from_date: Optional[date] = Query(None, description="Start date (yyyy-mm-dd)"),
    to_date: Optional[date] = Query(None, description="End date (yyyy-mm-dd)"),
    statuses: Optional[List[RecordStatus]] = Query(
        None, description="Filter by status values (e.g., PENDING, PAID)"
    ),
    allocation_type: Optional[BudgetAllocation] = Query(
        None, description="Filter by budget allocation type"
    ),
    db: Session = Depends(get_db),
):
    """
    Get inflows with optional filters: date range, status list, and allocation type.
    """
    inflows = FinanceReport.get_inflows(
        db=db,
        from_date=from_date,
        to_date=to_date,
        statuses=statuses,
        allocation_type=allocation_type,
    )

    # Return as dicts (or use Pydantic schema if you already have one)
    return [
        {
            "finance_id": rec.finance_id,
            "counterparty": rec.counterparty,
            "amount": float(rec.amount),
            "date": rec.date,
            "status": rec.status.value,
            "budget_for": rec.budget_for.value,
            "description": rec.description,
        }
        for rec in inflows
    ]
    
@router.get("/get-report/outflows", response_model=List[dict])  # replace with a proper Pydantic schema
def list_outflows(
    from_date: Optional[date] = Query(None, description="Start date (yyyy-mm-dd)"),
    to_date: Optional[date] = Query(None, description="End date (yyyy-mm-dd)"),
    statuses: Optional[List[RecordStatus]] = Query(
        None, description="Filter by status values (e.g., PENDING, PAID)"
    ),
    allocation_type: Optional[BudgetAllocation] = Query(
        None, description="Filter by budget allocation type"
    ),
    db: Session = Depends(get_db),
):
    """
    Get inflows with optional filters: date range, status list, and allocation type.
    """
    inflows = FinanceReport.get_outflows(
        db=db,
        from_date=from_date,
        to_date=to_date,
        statuses=statuses,
        allocation_type=allocation_type,
    )

    # Return as dicts (or use Pydantic schema if you already have one)
    return [
        {
            "finance_id": rec.finance_id,
            "counterparty": rec.counterparty,
            "amount": float(rec.amount),
            "date": rec.date,
            "status": rec.status.value,
            "budget_for": rec.budget_for.value,
            "description": rec.description,
        }
        for rec in inflows
    ]
    
    
@router.get("/budget-vs-actual")
def budget_vs_actual_analysis(
    from_date: Optional[date] = Query(None, description="Start date (yyyy-mm-dd)"),
    to_date: Optional[date] = Query(None, description="End date (yyyy-mm-dd)"),
    statuses: Optional[List[RecordStatus]] = Query(
        None, description="Filter by statuses (e.g., PENDING, PAID)"
    ),
    db: Session = Depends(get_db),
):
    """
    Budget vs Actual Spending Analysis:
    Returns totals, stats, and per-category spending with percentage of total.
    """
    result = FinanceReport.get_budget_vs_actual_stats(
        db=db,
        from_date=from_date,
        to_date=to_date,
        statuses=statuses,
    )
    return result
    
        
router.include_router(router_admin)
router.include_router(router_donor)
router.include_router(router_admin_or_donor)
