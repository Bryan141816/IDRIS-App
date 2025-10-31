import calendar
from datetime import date, datetime
from decimal import Decimal
from typing import Iterable, List, Dict, Any, Optional
from uuid import uuid4

from sqlalchemy.orm import Session
from sqlalchemy import select, func, case, literal, and_
from crud_functions.utils import uid_from_string, random_suffix
from models import FinanceRecord, TransactionType, BudgetAllocation
from data_schemas.finance_record_schema import (
    InflowFinanceRecordCreate,
)
from .finance_utils import _to_alloc_enums


class FinanceReport:
    @staticmethod
    def get_inflows(
        db: Session,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        allocation_type: Optional[List[BudgetAllocation]] = None,
    ):
        q = select(FinanceRecord).where(FinanceRecord.transaction_type == TransactionType.INFLOW)

        if from_date:
            q = q.where(FinanceRecord.date >= from_date)
        if to_date:
            q = q.where(FinanceRecord.date <= to_date)

        norm_allocs = _to_alloc_enums(allocation_type or [])

        if norm_allocs:
            q = q.where(FinanceRecord.budget_for.in_(norm_allocs))

        q = q.order_by(FinanceRecord.date.desc())
        return list(db.execute(q).scalars().all())
            
    @staticmethod
    def get_outflows(
        db: Session,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        allocation_type: Optional[List[BudgetAllocation]] = None,
    ):
        q = select(FinanceRecord).where(FinanceRecord.transaction_type == TransactionType.OUTFLOW)

        if from_date:
            q = q.where(FinanceRecord.date >= from_date)
        if to_date:
            q = q.where(FinanceRecord.date <= to_date)

        norm_allocs = _to_alloc_enums(allocation_type or [])

        if norm_allocs:
            q = q.where(FinanceRecord.budget_for.in_(norm_allocs))

        q = q.order_by(FinanceRecord.date.desc())
        return list(db.execute(q).scalars().all())
        
