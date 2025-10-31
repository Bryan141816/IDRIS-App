from datetime import date
from decimal import Decimal
from typing import Iterable, List, Dict, Any, Optional
from uuid import uuid4

from sqlalchemy.orm import Session
from sqlalchemy import select, func, case, literal, and_, cast, String
from crud_functions.utils import uid_from_string, random_suffix
from models import FinanceRecord, TransactionType, InflowSource, SpendCategory, Donation, DonationType
from data_schemas.finance_record_schema import (
    InflowFinanceRecordCreate,
    OutflowFinanceRecordCreate,
    FinanceRecordUpdate,
)


def _gen_finance_id() -> str:
    # Human-friendly, unique-ish ID like FIN-AB12CD34EF
    return f"FIN-{uuid4().hex[:10].upper()}"


class FinanceRecordCRUD:
    @staticmethod
    def create_inflow_record(db: Session, payload: InflowFinanceRecordCreate) -> FinanceRecord:
        obj = FinanceRecord(
            finance_id=uid_from_string(f"{payload.date}{random_suffix(6)}"),
            counterparty=payload.counterparty,
            transaction_type=TransactionType.INFLOW,
            amount=payload.amount,
            date=payload.date,
            description=payload.description,
            inflow_source = InflowSource(payload.inflow_source)
        )
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def create_outflow_record(db: Session, payload: OutflowFinanceRecordCreate) -> FinanceRecord:
        obj = FinanceRecord(
            finance_id=uid_from_string(f"{payload.date}{random_suffix(6)}"),
            counterparty=payload.counterparty,
            transaction_type=TransactionType.OUTFLOW,
            amount=payload.amount,
            date=payload.date,
            description=payload.description,
            spend_category = SpendCategory(payload.spend_category)
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
        limit: int = 50,
        offset: int = 0,
    ) -> List[FinanceRecord]:
        stmt = select(FinanceRecord).outerjoin(Donation).where(
            (Donation.donation_type == None) | (Donation.donation_type != DonationType.INKIND)
        )
        if transaction_type:
            stmt = stmt.filter(FinanceRecord.transaction_type == transaction_type)
        stmt = stmt.order_by(FinanceRecord.date.desc()).limit(limit).offset(offset)
        return list(db.execute(stmt).scalars().all())
    
    @staticmethod
    def get_inflows(db: Session, page: int = 1, limit: int = 100):
        skip = (page - 1) * limit
        return (
            db.query(FinanceRecord)
            .outerjoin(Donation)
            .filter(
                (FinanceRecord.transaction_type == TransactionType.INFLOW) &
                ((Donation.donation_type == None) | (Donation.donation_type != DonationType.INKIND))
            )
            .offset(skip)
            .limit(limit)
            .all()
        )
        
    @staticmethod
    def get_outflows(db: Session, page: int = 1, limit: int = 100):
        skip = (page - 1) * limit
        return (
            db.query(FinanceRecord)
            .outerjoin(Donation)
            .filter(
                (FinanceRecord.transaction_type == TransactionType.OUTFLOW) &
                ((Donation.donation_type == None) | (Donation.donation_type != DonationType.INKIND))
            )
            .offset(skip)
            .limit(limit)
            .all()
        )
        
    @staticmethod
    def update(db: Session, finance_id: str, patch: FinanceRecordUpdate) -> Optional[FinanceRecord]:
        obj = db.get(FinanceRecord, finance_id)
        if not obj:
            return None

        if patch.counterparty is not None:
            obj.counterparty = patch.counterparty
        if patch.transaction_type is not None:
            obj.transaction_type = patch.transaction_type
        if patch.amount is not None:
            obj.amount = patch.amount
        if patch.date is not None:
            obj.date = patch.date
        if patch.inflow_source is not None:
            obj.inflow_source = patch.inflow_source
        if patch.spend_category is not None:
            obj.spend_category = patch.spend_category
        if patch.description is not None:
            obj.description = patch.description

        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

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
        include_zero_rows: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Returns a list of dicts like:
        {
        "budget_for": "FOOD AND WATER",
        "inflow_total": Decimal("12345.67"),
        "outflow_total": Decimal("890.00"),
        "net_total": Decimal("11455.67"),
        "percentage_spent": Decimal("7.21")
        }
        """

        filters = [
            # Exclude INKIND donations from all financial summaries
            (Donation.donation_type == None) | (Donation.donation_type != DonationType.INKIND)
        ]

        if start_date:
            filters.append(FinanceRecord.date >= start_date)
        if end_date:
            filters.append(FinanceRecord.date <= end_date)

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

        # percentage_spent = (outflow_total / inflow_total) * 100 (guard divide-by-zero)
        denom = func.nullif(inflow_sum, 0)
        percentage_spent = func.coalesce((outflow_sum * 100.0) / denom, 0.0)

        # --- KEY FIX: cast enum branches to a single common type (TEXT) ---
        grouping_key = case(
            (
                FinanceRecord.transaction_type == TransactionType.INFLOW,
                cast(FinanceRecord.inflow_source, String),
            ),
            (
                FinanceRecord.transaction_type == TransactionType.OUTFLOW,
                cast(FinanceRecord.spend_category, String),
            ),
            else_=cast(literal(None), String),
        ).label("budget_for")

        base_select = select(
            grouping_key,
            inflow_sum.label("inflow_total"),
            outflow_sum.label("outflow_total"),
            (inflow_sum - outflow_sum).label("net_total"),
            percentage_spent.label("percentage_spent"),
        )

        stmt = (
            base_select.outerjoin(Donation).where(and_(*filters))
            if filters else base_select
        ).group_by(grouping_key).order_by(grouping_key)

        rows = db.execute(stmt).all()

        # Use string values for categories
        all_categories = {cat.value for cat in InflowSource}

        # Convert rows -> dicts; budget_for is now a string (TEXT), not an enum
        result_map: Dict[str, Dict[str, Any]] = {
            (r.budget_for or "UNKNOWN"): {
                "budget_for": (r.budget_for or "UNKNOWN"),
                "inflow_total": Decimal(r.inflow_total or 0),
                "outflow_total": Decimal(r.outflow_total or 0),
                "net_total": Decimal(r.net_total or 0),
                "percentage_spent": Decimal(str(r.percentage_spent or 0)),
            }
            for r in rows
            if r.budget_for is not None
        }

        if include_zero_rows:
            for cat_value in all_categories:
                if cat_value not in result_map:
                    result_map[cat_value] = {
                        "budget_for": cat_value,
                        "inflow_total": Decimal("0"),
                        "outflow_total": Decimal("0"),
                        "net_total": Decimal("0"),
                        "percentage_spent": Decimal("0"),
                    }

        ordered = [result_map[cat] for cat in sorted(result_map.keys())]
        return ordered