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
    source: str
    amount: Decimal
    date: date
    description: Optional[str] = None
    status: RecordStatus


class InflowFinanceRecordCreate(BaseModel):
    # finance_id is NOT required for create; DB should generate it
    source: str
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
        source: str = Form(...),
        transaction_type: TransactionType = Form(TransactionType.INFLOW),
        amount: Decimal = Form(...),
        category: str = Form(...),
        status: RecordStatus = Form(RecordStatus.PENDING),
        description: Optional[str] = Form(None),
        date: date = Form(...),
        budget_for: BudgetAllocation = Form(BudgetAllocation.GENERAL),
        
    ) -> "InflowFinanceRecordCreate":
        return cls(
            source=source,
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
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)