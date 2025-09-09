# schemas/finance_record_schema.py
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, Literal
from fastapi import Form
from pydantic import BaseModel, ConfigDict, Field

from models import FinanceRecord, TransactionType, RecordStatus, BudgetAllocation

class FinanceRecordBase(BaseModel):
    counterparty: str
    amount: Decimal
    date: date
    description: Optional[str] = None
    status: RecordStatus
    budget_for: str


class InflowFinanceRecordCreate(BaseModel):
    # finance_id is NOT required for create; DB should generate it
    counterparty: str
    transaction_type: TransactionType = TransactionType.INFLOW
    amount: Decimal
    category: str
    status: RecordStatus = RecordStatus.PENDING
    description: Optional[str] = None
    date: date  # expects "YYYY-MM-DD" from the form
    budget_for: BudgetAllocation =  Field(default=BudgetAllocation.GENERAL)

    @classmethod
    def as_form(
        cls,
        counterparty: str = Form(...),
        transaction_type: TransactionType = Form(TransactionType.INFLOW),
        amount: Decimal = Form(...),
        category: str = Form(...),
        status: RecordStatus = Form(RecordStatus.PENDING),
        description: Optional[str] = Form(None),
        date: date = Form(...),
        budget_for: BudgetAllocation = Form(BudgetAllocation.GENERAL),
        
    ) -> "InflowFinanceRecordCreate":
        return cls(
            counterparty=counterparty,
            transaction_type=transaction_type,
            amount=amount,
            category=category,
            status=status,
            description=description,
            date=date,
            budget_for = budget_for
        )
        
class FinanceRecordRead(FinanceRecordBase):
    finance_id: str
    date: datetime

    model_config = ConfigDict(from_attributes=True)
