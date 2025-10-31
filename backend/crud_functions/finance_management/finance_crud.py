from datetime import date
from decimal import Decimal
from typing import Iterable, List, Dict, Any, Optional
from uuid import uuid4

from sqlalchemy.orm import Session
from sqlalchemy import select, func, case, literal, and_
from crud_functions.utils import uid_from_string, random_suffix
from models import FinanceRecord, TransactionType, BudgetAllocation, Donation, DonationType
from data_schemas.finance_record_schema import (
    InflowFinanceRecordCreate, 
    FinanceRecordUpdate,
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
        if patch.budget_for is not None:
            obj.budget_for = patch.budget_for
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
