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
    allocation_type_a: Optional[List[BudgetAllocation]] = Query(None, alias="allocation_type"),
    allocation_type_b: Optional[List[BudgetAllocation]] = Query(None, alias="allocation_type[]"),

    statuses_a: Optional[List[RecordStatus]] = Query(None, alias="statuses"),
    statuses_b: Optional[List[RecordStatus]] = Query(None, alias="statuses[]"),
    db: Session = Depends(get_db),
):
    """
    Get inflows with optional filters: date range, status list, and allocation type.
    """
    allocation_type = (allocation_type_a or []) + (allocation_type_b or [])
    statuses = (statuses_a or []) + (statuses_b or [])
        
    inflows = FinanceReport.get_all(
        db=db,
        from_date=from_date,
        to_date=to_date,
        statuses=statuses,
        allocation_type=allocation_type,
    )

    inflows = inflows or []
    print(inflows)
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
    
@router.get("/get/budget_summary", name="budget_summary")
def budget_summary(
    date_from: Optional[date] = Query(None, description="YYYY-MM-DD"),
    date_to: Optional[date] = Query(None, description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """
    Returns aggregated KPIs and breakdown grouped by allocation.
    Only accepts date_from/date_to. If neither provided, defaults to year-to-date.
    """
    print("Date from: ", date_from)
    print("Date To:", date_to)
    try:
        result = FinanceReport.get_budget_summary(
            db=db,
            date_from=date_from,
            date_to=date_to,
        )
    except Exception as e:
        # Surface database/logic errors as 500 (adjust for prod)
        raise HTTPException(status_code=500, detail=str(e))
    return result        
        
router.include_router(router_admin)
router.include_router(router_donor)
router.include_router(router_admin_or_donor)
