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


def _gen_finance_id() -> str:
    # Human-friendly, unique-ish ID like FIN-AB12CD34EF
    return f"FIN-{uuid4().hex[:10].upper()}"


class FinanceRecordCRUD:
    @staticmethod
    def create_finance_record(db: Session, payload: InflowFinanceRecordCreate) -> FinanceRecord:
        obj = FinanceRecord(
            finance_id=uid_from_string(f"{payload.date}{random_suffix(6)}"),
            counterparty=payload.counterparty,
            transaction_type=TransactionType(payload.transaction_type),
            amount=payload.amount,
            date=payload.date,
            description=payload.description,
            status=RecordStatus.PENDING,
            budget_for = BudgetAllocation(payload.budget_for)
        )
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def get(db: Session, finance_id: str) -> Optional[FinanceRecord]:
        return db.get(FinanceRecord, finance_id)

    @staticmethod
    def list(
        db: Session,
        *,
        transaction_type: Optional[TransactionType] = None,
        status: Optional[RecordStatus] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[FinanceRecord]:
        stmt = select(FinanceRecord)
        if transaction_type:
            stmt = stmt.filter(FinanceRecord.transaction_type == transaction_type)
        if status:
            stmt = stmt.filter(FinanceRecord.status == status)
        stmt = stmt.order_by(FinanceRecord.date.desc()).limit(limit).offset(offset)
        return list(db.execute(stmt).scalars().all())
    
    @staticmethod
    def get_inflows(db: Session, page: int = 1, limit: int = 100):
        skip = (page - 1) * limit
        return (
            db.query(FinanceRecord)
            .filter(FinanceRecord.transaction_type == TransactionType.INFLOW)
            .offset(skip)
            .limit(limit)
            .all()
        )
        
    @staticmethod
    def get_outflows(db: Session, page: int = 1, limit: int = 100):
        skip = (page - 1) * limit
        return (
            db.query(FinanceRecord)
            .filter(FinanceRecord.transaction_type == TransactionType.OUTFLOW)
            .offset(skip)
            .limit(limit)
            .all()
        )
        
    # @staticmethod
    # def update(db: Session, finance_id: str, patch: FinanceRecordUpdate) -> Optional[FinanceRecord]:
    #     obj = db.get(FinanceRecord, finance_id)
    #     if not obj:
    #         return None

    #     if patch.source is not None:
    #         obj.source = patch.source
    #     if patch.transaction_type is not None:
    #         obj.transaction_type = TransactionType(patch.transaction_type)
    #     if patch.amount is not None:
    #         obj.amount = patch.amount
    #     if patch.date is not None:
    #         obj.date = patch.date
    #     if patch.description is not None:
    #         obj.description = patch.description

    #     db.add(obj)
    #     db.commit()
    #     db.refresh(obj)
    #     return obj

    # @staticmethod
    # def update_status(db: Session, finance_id: str, payload: FinanceRecordStatusUpdate) -> Optional[FinanceRecord]:
    #     obj = db.get(FinanceRecord, finance_id)
    #     if not obj:
    #         return None
    #     obj.status = payload.status
    #     db.add(obj)
    #     db.commit()
    #     db.refresh(obj)
    #     return obj

    # @staticmethod
    # def delete(db: Session, finance_id: str) -> bool:
    #     obj = db.get(FinanceRecord, finance_id)
    #     if not obj:
    #         return False
    #     db.delete(obj)
    #     db.commit()
    #     return True
    
    @staticmethod
    def summarize_by_budget_allocation(
        db: Session,
        *,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        statuses: Optional[Iterable[RecordStatus]] = None,
        include_zero_rows: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Returns a list of dicts like:
        {
        "budget_for": "FOOD AND WATER",
        "inflow_total": Decimal("12345.67"),
        "outflow_total": Decimal("890.00"),
        "net_total": Decimal("11455.67"),
        "percentage_spent": Decimal("7.21")  # outflow / inflow * 100
        }
        """

        filters = []

        if start_date:
            filters.append(FinanceRecord.date >= start_date)
        if end_date:
            filters.append(FinanceRecord.date <= end_date)

        # By default, only count money that actually hit the books
        if statuses is None:
            statuses = [
                RecordStatus.RECEIVED,    # inflows received
                RecordStatus.PAID,        # outflows paid
                RecordStatus.RECONCILED,  # both sides cleared
            ]
        filters.append(FinanceRecord.status.in_(list(statuses)))

        inflow_sum = func.coalesce(
            func.sum(
                case(
                    (FinanceRecord.transaction_type == TransactionType.INFLOW, FinanceRecord.amount),
                    else_=literal(0),
                )
            ),
            0,
        )
        outflow_sum = func.coalesce(
            func.sum(
                case(
                    (FinanceRecord.transaction_type == TransactionType.OUTFLOW, FinanceRecord.amount),
                    else_=literal(0),
                )
            ),
            0,
        )

        # percentage_spent = (outflow_total / inflow_total) * 100, guard divide-by-zero
        denom = func.nullif(inflow_sum, 0)
        percentage_spent = func.coalesce((outflow_sum * 100.0) / denom, 0.0)

        base_select = select(
            FinanceRecord.budget_for.label("budget_for"),
            inflow_sum.label("inflow_total"),
            outflow_sum.label("outflow_total"),
            (inflow_sum - outflow_sum).label("net_total"),
            percentage_spent.label("percentage_spent"),
        )

        stmt = (base_select.where(and_(*filters)) if filters else base_select) \
            .group_by(FinanceRecord.budget_for) \
            .order_by(FinanceRecord.budget_for)

        rows = db.execute(stmt).all()

        # Convert result rows to dicts keyed by enum value (nice for JSON)
        result_map: Dict[BudgetAllocation, Dict[str, Any]] = {
            r.budget_for: {
                "budget_for": r.budget_for.value if hasattr(r.budget_for, "value") else str(r.budget_for),
                "inflow_total": Decimal(r.inflow_total or 0),
                "outflow_total": Decimal(r.outflow_total or 0),
                "net_total": Decimal(r.net_total or 0),
                # Convert to Decimal safely even if DB returns float
                "percentage_spent": Decimal(str(r.percentage_spent or 0)),
            }
            for r in rows
        }

        if include_zero_rows:
            # Ensure every enum appears, even if no records
            for cat in BudgetAllocation:
                if cat not in result_map:
                    result_map[cat] = {
                        "budget_for": cat.value,
                        "inflow_total": Decimal("0"),
                        "outflow_total": Decimal("0"),
                        "net_total": Decimal("0"),
                        "percentage_spent": Decimal("0"),
                    }

        # Stable order by enum name (or value)
        ordered = [result_map[cat] for cat in sorted(result_map.keys(), key=lambda c: c.name)]
        return ordered