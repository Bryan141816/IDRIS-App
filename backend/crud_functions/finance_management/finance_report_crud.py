from datetime import date
from decimal import Decimal
from typing import Iterable, List, Dict, Any, Optional
from uuid import uuid4

from sqlalchemy.orm import Session
from sqlalchemy import select, func, case, literal, and_
from crud_functions.utils import uid_from_string, random_suffix
from models import FinanceRecord, TransactionType, RecordStatus, BudgetAllocation 
from data_schemas.finance_record_schema import (
    InflowFinanceRecordCreate,
)


class FinanceReport:
    @staticmethod
    def get_all(
        db: Session,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        statuses: Optional[List[RecordStatus]] = None,
        allocation_type: Optional[BudgetAllocation] = None,
    ):
        """
        Fetch inflows filtered by date range, statuses, and allocation_type.
        """
        query = db.query(FinanceRecord)

        # Filter by date range
        if from_date:
            query = query.filter(FinanceRecord.date >= from_date)
        if to_date:
            query = query.filter(FinanceRecord.date <= to_date)

        # Filter by statuses (list)
        if statuses and len(statuses) > 0:
            query = query.filter(FinanceRecord.status.in_(statuses))

        # Filter by allocation_type (budget_for)
        if allocation_type:
            query = query.filter(FinanceRecord.budget_for == allocation_type)

        return query.order_by(FinanceRecord.date.desc()).all()
    
    @staticmethod
    def get_inflows(
        db: Session,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        statuses: Optional[List[RecordStatus]] = None,
        allocation_type: Optional[BudgetAllocation] = None,
    ):
        """
        Fetch inflows filtered by date range, statuses, and allocation_type.
        """
        query = db.query(FinanceRecord).filter(
            FinanceRecord.transaction_type == TransactionType.INFLOW
        )

        # Filter by date range
        if from_date:
            query = query.filter(FinanceRecord.date >= from_date)
        if to_date:
            query = query.filter(FinanceRecord.date <= to_date)

        # Filter by statuses (list)
        if statuses and len(statuses) > 0:
            query = query.filter(FinanceRecord.status.in_(statuses))

        # Filter by allocation_type (budget_for)
        if allocation_type:
            query = query.filter(FinanceRecord.budget_for == allocation_type)

        return query.order_by(FinanceRecord.date.desc()).all()
    
    def get_outflows(
        db: Session,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        statuses: Optional[List[RecordStatus]] = None,
        allocation_type: Optional[BudgetAllocation] = None,
    ):
        """
        Fetch inflows filtered by date range, statuses, and allocation_type.
        """
        query = db.query(FinanceRecord).filter(
            FinanceRecord.transaction_type == TransactionType.OUTFLOW
        )

        # Filter by date range
        if from_date:
            query = query.filter(FinanceRecord.date >= from_date)
        if to_date:
            query = query.filter(FinanceRecord.date <= to_date)

        # Filter by statuses (list)
        if statuses and len(statuses) > 0:
            query = query.filter(FinanceRecord.status.in_(statuses))

        # Filter by allocation_type (budget_for)
        if allocation_type:
            query = query.filter(FinanceRecord.budget_for == allocation_type)

        return query.order_by(FinanceRecord.date.desc()).all()
    
    
    def get_budget_vs_actual_stats(
        db: Session,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        statuses: Optional[List[RecordStatus]] = None,
    ):
        base_query = db.query(FinanceRecord).filter(
            FinanceRecord.transaction_type == TransactionType.OUTFLOW
        )

        if from_date:
            base_query = base_query.filter(FinanceRecord.date >= from_date)
        if to_date:
            base_query = base_query.filter(FinanceRecord.date <= to_date)
        if statuses and len(statuses) > 0:
            base_query = base_query.filter(FinanceRecord.status.in_(statuses))

        # Actual spending by category
        by_category = (
            base_query.with_entities(
                FinanceRecord.budget_for,
                func.coalesce(func.sum(FinanceRecord.amount), 0).label("total_spent"),
            )
            .group_by(FinanceRecord.budget_for)
            .all()
        )

        # Totals & stats
        total_spent = base_query.with_entities(func.coalesce(func.sum(FinanceRecord.amount), 0)).scalar()
        avg_spent = base_query.with_entities(func.avg(FinanceRecord.amount)).scalar()
        max_spent = base_query.with_entities(func.max(FinanceRecord.amount)).scalar()
        count_txn = base_query.with_entities(func.count(FinanceRecord.id)).scalar()

        return {
            "total_spent": float(total_spent or 0),
            "avg_transaction": float(avg_spent or 0),
            "max_transaction": float(max_spent or 0),
            "transaction_count": count_txn,
            "by_category": [
                {
                    "budget_for": row.budget_for.value,
                    "spent": float(row.total_spent),
                    "percent_of_total": float((row.total_spent / total_spent * 100) if total_spent else 0),
                }
                for row in by_category
            ],
        }
