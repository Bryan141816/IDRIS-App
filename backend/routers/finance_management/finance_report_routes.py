from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status, Form
from sqlalchemy.orm import Session
from routers.role_checker import RoleChecker

from database import get_db
from models import InflowSource, SpendCategory
from crud_functions.finance_management.finance_report_crud import FinanceReport

router = APIRouter()

router_admin = APIRouter(
    dependencies=[Depends(RoleChecker(["finance admin", "operations admin","superadmin"]))],
)

router_user = APIRouter(
    dependencies=[Depends(RoleChecker(["generic"]))],
)

router_donor = APIRouter(
    dependencies=[Depends(RoleChecker(["donor"]))],
)

router_admin_or_donor = APIRouter(
    dependencies=[Depends(RoleChecker(["finance admin", "operations admin",  "superuser", "generic","superadmin"]))],
)

@router.get("/get-report/all", response_model=List[dict])
def list_records_all(
    from_date: Optional[date] = Query(None, description="Start date (yyyy-mm-dd)"),
    to_date: Optional[date] = Query(None, description="End date (yyyy-mm-dd)"),
    allocation_type_a: Optional[List[InflowSource]] = Query(None, alias="allocation_type"),
    allocation_type_b: Optional[List[InflowSource]] = Query(None, alias="allocation_type[]"),

    db: Session = Depends(get_db),
):
    """
    Get records with optional filters: date range, status list, and allocation type.
    """
    allocation_type = (allocation_type_a or []) + (allocation_type_b or [])

    records = FinanceReport.get_all(
        db=db,
        from_date=from_date,
        to_date=to_date,
        allocation_type=allocation_type,
    )

    records = records or []
    print(records)
    # Return as dicts (or use Pydantic schema if you already have one)
    return [
        {
            "finance_id": rec.finance_id,
            "counterparty": rec.counterparty,
            "amount": float(rec.amount),
            "date": rec.date,
            "inflow_source": rec.inflow_source.value if rec.inflow_source else None,
            "spend_category": rec.spend_category.value if rec.spend_category else None,
            "description": rec.description,
            "transaction_type": rec.transaction_type.value,
        }
        for rec in records
    ]


@router.get("/get_report/inflows", response_model=List[dict])
def list_inflows(
    from_date: Optional[date] = Query(None, description="Start date (yyyy-mm-dd)"),
    to_date: Optional[date] = Query(None, description="End date (yyyy-mm-dd)"),
    allocation_type_a: Optional[List[InflowSource]] = Query(None, alias="allocation_type"),
    allocation_type_b: Optional[List[InflowSource]] = Query(None, alias="allocation_type[]"),
    db: Session = Depends(get_db),
):
    """
    Get inflows with optional filters: date range, status list, and allocation type(s).
    Supports array-style query params for both `allocation_type` and `statuses`,
    using either `param=value1&param=value2` or `param[]=value1&param[]=value2`.
    """
    # Merge dual aliases (and existing 'statuses' arg) into single lists
    allocation_type = (allocation_type_a or []) + (allocation_type_b or [])

    inflows = FinanceReport.get_inflows(
        db=db,
        from_date=from_date,
        to_date=to_date,
        allocation_type=allocation_type or None,
    )

    return [
        {
            "finance_id": rec.finance_id,
            "counterparty": rec.counterparty,
            "amount": float(rec.amount),
            "date": rec.date,
            "inflow_source": rec.inflow_source.value if rec.inflow_source else None,
            "description": rec.description,
            "transaction_type": rec.transaction_type.value,
        }
        for rec in (inflows or [])
    ]

@router.get("/get_report/outflows", response_model=List[dict])
def list_outflows(
    from_date: Optional[date] = Query(None, description="Start date (yyyy-mm-dd)"),
    to_date: Optional[date] = Query(None, description="End date (yyyy-mm-dd)"),
    # dual aliases for array-style params (same as list_records_all)
    allocation_type_a: Optional[List[SpendCategory]] = Query(None, alias="allocation_type"),
    allocation_type_b: Optional[List[SpendCategory]] = Query(None, alias="allocation_type[]"),
    db: Session = Depends(get_db),
):
    """
    Get outflows with optional filters: date range, statuses, and allocation type(s).
    Supports array-style query params for both `allocation_type` and `statuses`,
    using either `param=value1&param=value2` or `param[]=value1&param[]=value2`.
    """
    allocation_type = (allocation_type_a or []) + (allocation_type_b or [])

    outflows = FinanceReport.get_outflows(
        db=db,
        from_date=from_date,
        to_date=to_date,
        allocation_type=allocation_type or None,
    )

    return [
        {
            "finance_id": rec.finance_id,
            "counterparty": rec.counterparty,
            "amount": float(rec.amount),
            "date": rec.date,
            "spend_category": rec.spend_category.value if rec.spend_category else None,
            "description": rec.description,
            "transaction_type": rec.transaction_type.value,
        }
        for rec in (outflows or [])
    ]

@router.get("/get/budget_summary", name="budget_summary")
def budget_summary(
    from_date: Optional[date] = Query(None, description="YYYY-MM-DD"),
    to_date: Optional[date] = Query(None, description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """
    Returns aggregated KPIs and breakdown grouped by allocation.
    Only accepts date_from/date_to. If neither provided, defaults to year-to-date.
    """
    print("Date from: ", from_date)
    print("Date To:", to_date)
    try:
        result = FinanceReport.get_budget_summary(
            db=db,
            from_date=from_date,
            to_date=to_date,
        )
    except Exception as e:
        # Surface database/logic errors as 500 (adjust for prod)
        raise HTTPException(status_code=500, detail=str(e))
    return result


router.include_router(router_admin)
router.include_router(router_donor)
router.include_router(router_admin_or_donor)
