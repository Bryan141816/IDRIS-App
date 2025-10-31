# schemas/finance_record_schema.py
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, Literal, Annotated
from fastapi import Form
from pydantic import BaseModel, ConfigDict, Field

from models import FinanceRecord, TransactionType, BudgetAllocation

class FinanceRecordBase(BaseModel):
    counterparty: str
    amount: Decimal
    date: date
    description: Optional[str] = None
    budget_for: str


class InflowFinanceRecordCreate(BaseModel):
    # finance_id is NOT required for create; DB should generate it
    counterparty: str
    transaction_type: TransactionType = TransactionType.INFLOW
    amount: Decimal
    description: Optional[str] = None
    date: date  # expects "YYYY-MM-DD" from the form
    budget_for: BudgetAllocation =  Field(default=BudgetAllocation.GENERAL)

    @classmethod
    def as_form(
        cls,
        counterparty: str = Form(...),
        transaction_type: TransactionType = Form(TransactionType.INFLOW),
        amount: Decimal = Form(...),
        description: Optional[str] = Form(None),
        date: date = Form(...),
        budget_for: BudgetAllocation = Form(BudgetAllocation.GENERAL),
        
    ) -> "InflowFinanceRecordCreate":
        return cls(
            counterparty=counterparty,
            transaction_type=transaction_type,
            amount=amount,
            description=description,
            date=date,
            budget_for = budget_for
        )
        
class FinanceRecordUpdate(BaseModel):
    finance_id: str
    transaction_type: Optional[TransactionType] = TransactionType.INFLOW
    counterparty: Optional[str] = None
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    date: Optional[date] = None
    budget_for: Optional[BudgetAllocation] = None

    @classmethod
    def as_form(
        cls,
        finance_id: str = Form(...),
        transaction_type: Optional[TransactionType] = Form(None),   
        counterparty: Optional[str] = Form(None),
        amount: Optional[Decimal] = Form(None),
        description: Optional[str] = Form(None),
        date: Optional[str] = None,
        budget_for: Optional[BudgetAllocation] = Form(None),
    ) -> "FinanceRecordUpdate":
        return cls(
            finance_id=finance_id,
            counterparty=counterparty,
            transaction_type=transaction_type,
            amount=amount,
            description=description,
            date=_parse_date_maybe(date),
            budget_for=budget_for,
        )
        
class FinanceRecordRead(FinanceRecordBase):
    finance_id: str
    date: datetime

    model_config = ConfigDict(from_attributes=True)



def _parse_date_maybe(s: Optional[str]) -> Optional[date]:
    if not s:
        return None
    # expects "YYYY-MM-DD"
    return date.fromisoformat(s)