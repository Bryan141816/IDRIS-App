import calendar
from datetime import date, datetime
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
from .finance_utils import _to_alloc_enums, _to_status_enums


class FinanceReport:
    @staticmethod
    def get_all(
        db: Session,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        statuses: Optional[List[RecordStatus]] = None,
        allocation_type: Optional[List[BudgetAllocation]] = None,
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

        # Normalize lists to the strings your DB actually stores
        norm_statuses = _to_status_enums(statuses or [])
        norm_allocs   = _to_alloc_enums(allocation_type or [])

        if norm_statuses:
            query = query.filter(FinanceRecord.status.in_(norm_statuses))

        if norm_allocs:
            query = query.filter(FinanceRecord.budget_for.in_(norm_allocs))    
        
        print(str(query))
        return query.order_by(FinanceRecord.date.desc()).all()
            
    @staticmethod
    def get_inflows(
        db: Session,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        statuses: Optional[List[RecordStatus]] = None,
        allocation_type: Optional[List[BudgetAllocation]] = None,
    ):
        q = select(FinanceRecord).where(FinanceRecord.transaction_type == TransactionType.INFLOW)

        if from_date:
            q = q.where(FinanceRecord.date >= from_date)
        if to_date:
            q = q.where(FinanceRecord.date <= to_date)

        norm_statuses = _to_status_enums(statuses or [])
        norm_allocs = _to_alloc_enums(allocation_type or [])

        if norm_statuses:
            q = q.where(FinanceRecord.status.in_(norm_statuses))

        if norm_allocs:
            q = q.where(FinanceRecord.budget_for.in_(norm_allocs))

        q = q.order_by(FinanceRecord.date.desc())
        return list(db.execute(q).scalars().all())
            
    @staticmethod
    def get_outflows(
        db: Session,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        statuses: Optional[List[RecordStatus]] = None,
        allocation_type: Optional[List[BudgetAllocation]] = None,
    ):
        q = select(FinanceRecord).where(FinanceRecord.transaction_type == TransactionType.OUTFLOW)

        if from_date:
            q = q.where(FinanceRecord.date >= from_date)
        if to_date:
            q = q.where(FinanceRecord.date <= to_date)

        norm_statuses = _to_status_enums(statuses or [])
        norm_allocs = _to_alloc_enums(allocation_type or [])

        if norm_statuses:
            q = q.where(FinanceRecord.status.in_(norm_statuses))
        
        if norm_allocs:
            q = q.where(FinanceRecord.budget_for.in_(norm_allocs))

        q = q.order_by(FinanceRecord.date.desc())
        return list(db.execute(q).scalars().all())
        
    @staticmethod
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

    @staticmethod
    def get_budget_summary(
        db: Session,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        """
        Return aggregated dashboard dict grouped by allocation (budget_for).
        Only accepts from_date/to_date. If neither provided, defaults to year-to-date.
        Includes all statuses in KPIs and breakdown; pending/denied are still reported separately.
        """

        # default date window if none provided: year-to-date
        if not from_date and not to_date:
            today = date.today()
            from_date = date(today.year, 1, 1)
            to_date = today

        # Base query with filters (for diagnostics) - includes all statuses
        base_q = db.query(FinanceRecord).filter(
            FinanceRecord.date >= from_date, FinanceRecord.date <= to_date
        )
        records_considered = base_q.count()

        # total inflow (all statuses)
        total_inflow_q = db.query(
            func.coalesce(
                func.sum(
                    case(
                        (FinanceRecord.transaction_type == TransactionType.INFLOW, FinanceRecord.amount),
                        else_=0,
                    )
                ),
                0,
            )
        ).filter(FinanceRecord.date >= from_date, FinanceRecord.date <= to_date)
        total_inflow = Decimal(total_inflow_q.scalar() or 0)

        # total outflow (all statuses)
        total_outflow_q = db.query(
            func.coalesce(
                func.sum(
                    case(
                        (FinanceRecord.transaction_type == TransactionType.OUTFLOW, FinanceRecord.amount),
                        else_=0,
                    )
                ),
                0,
            )
        ).filter(FinanceRecord.date >= from_date, FinanceRecord.date <= to_date)
        total_outflow = Decimal(total_outflow_q.scalar() or 0)

        # pending inflow/outflow (status == PENDING)
        pending_inflow_q = db.query(
            func.coalesce(
                func.sum(
                    case(
                        (
                            (FinanceRecord.transaction_type == TransactionType.INFLOW)
                            & (FinanceRecord.status == RecordStatus.PENDING),
                            FinanceRecord.amount,
                        ),
                        else_=0,
                    )
                ),
                0,
            )
        ).filter(FinanceRecord.date >= from_date, FinanceRecord.date <= to_date)
        pending_inflow = Decimal(pending_inflow_q.scalar() or 0)

        pending_outflow_q = db.query(
            func.coalesce(
                func.sum(
                    case(
                        (
                            (FinanceRecord.transaction_type == TransactionType.OUTFLOW)
                            & (FinanceRecord.status == RecordStatus.PENDING),
                            FinanceRecord.amount,
                        ),
                        else_=0,
                    )
                ),
                0,
            )
        ).filter(FinanceRecord.date >= from_date, FinanceRecord.date <= to_date)
        pending_outflow = Decimal(pending_outflow_q.scalar() or 0)

        # denied total (all denied amounts)
        denied_q = db.query(func.coalesce(func.sum(FinanceRecord.amount), 0)).filter(
            FinanceRecord.status == RecordStatus.DENIED,
            FinanceRecord.date >= from_date,
            FinanceRecord.date <= to_date,
        )
        denied_total = Decimal(denied_q.scalar() or 0)

        # last_updated (most recent updated_at for the window)
        max_updated = db.query(func.max(FinanceRecord.updated_at)).filter(
            FinanceRecord.date >= from_date,
            FinanceRecord.date <= to_date,
        ).scalar()
        last_updated_val = max_updated or datetime.utcnow()

        # Breakdown by allocation (always group by budget_for)
        breakdown_allocation = []
        grp_query = (
            db.query(
                FinanceRecord.budget_for.label("allocation"),
                func.coalesce(
                    func.sum(
                        case(
                            (FinanceRecord.transaction_type == TransactionType.INFLOW, FinanceRecord.amount),
                            else_=0,
                        )
                    ),
                    0,
                ).label("inflow"),
                func.coalesce(
                    func.sum(
                        case(
                            (FinanceRecord.transaction_type == TransactionType.OUTFLOW, FinanceRecord.amount),
                            else_=0,
                        )
                    ),
                    0,
                ).label("outflow"),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                (FinanceRecord.transaction_type == TransactionType.INFLOW)
                                & (FinanceRecord.status == RecordStatus.PENDING),
                                FinanceRecord.amount,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label("pending_inflow"),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                (FinanceRecord.transaction_type == TransactionType.OUTFLOW)
                                & (FinanceRecord.status == RecordStatus.PENDING),
                                FinanceRecord.amount,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label("pending_outflow"),
                func.coalesce(
                    func.sum(
                        case(
                            (FinanceRecord.status == RecordStatus.DENIED, FinanceRecord.amount),
                            else_=0,
                        )
                    ),
                    0,
                ).label("denied"),
            )
            .filter(FinanceRecord.date >= from_date, FinanceRecord.date <= to_date)
            .group_by(FinanceRecord.budget_for)
        )

        rows = grp_query.all()
        for r in rows:
            inflow = Decimal(r.inflow or 0)
            outflow = Decimal(r.outflow or 0)
            pending_in = Decimal(r.pending_inflow or 0)
            pending_out = Decimal(r.pending_outflow or 0)
            denied = Decimal(r.denied or 0)
            net = inflow - outflow
            allocation_name = r.allocation.name if hasattr(r.allocation, "name") else str(r.allocation)
            breakdown_allocation.append(
                {
                    "allocation": allocation_name,
                    "inflow": _decimal_to_str(inflow),
                    "outflow": _decimal_to_str(outflow),
                    "net": _decimal_to_str(net),
                    "pending_inflow": _decimal_to_str(pending_in),
                    "pending_outflow": _decimal_to_str(pending_out),
                    "denied": _decimal_to_str(denied),
                }
            )

        result = {
            "filters": {
                "from_date": from_date.isoformat() if from_date else None,
                "to_date": to_date.isoformat() if to_date else None,
            },
            "kpis": {
                "total_inflow": _decimal_to_str(total_inflow),
                "total_outflow": _decimal_to_str(total_outflow),
                "net_balance": _decimal_to_str(total_inflow - total_outflow),
                "pending_inflow": _decimal_to_str(pending_inflow),
                "pending_outflow": _decimal_to_str(pending_outflow),
                "denied_total": _decimal_to_str(denied_total),
                "last_updated": last_updated_val.isoformat(),
            },
            "breakdown": {"allocation": breakdown_allocation},
            "diagnostics": {"records_considered": int(records_considered)},
        }

        return result



def _decimal_to_str(d: Decimal) -> str:
    if d is None:
        d = Decimal("0.00")
    return f"{d.quantize(Decimal('0.01'))}"
