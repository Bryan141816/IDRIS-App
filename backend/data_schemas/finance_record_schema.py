# schemas/finance_record_schema.py
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, Literal, Annotated
from fastapi import Form
from pydantic import BaseModel, ConfigDict, Field

from models import FinanceRecord, TransactionType, SpendCategory, InflowSource

class FinanceRecordBase(BaseModel):
    counterparty: str
    amount: Decimal
    date: date
    purpose: Optional[str] = None


class InflowFinanceRecordCreate(BaseModel):
    # finance_id is NOT required for create; DB should generate it
    counterparty: str
    transaction_type: TransactionType = TransactionType.INFLOW
    amount: Decimal
    purpose: Optional[str] = None
    date: date  # expects "YYYY-MM-DD" from the form
    inflow_source: InflowSource =  Field(default=InflowSource.MONETARY_DONATIONS)
    inflow_type: str
    attachment: Optional[str] = None

    @classmethod
    def as_form(
        cls,
        counterparty: str = Form(...),
        transaction_type: TransactionType = Form(TransactionType.INFLOW),
        amount: Decimal = Form(...),
        purpose: Optional[str] = Form(None),
        date: date = Form(...),
        inflow_source: InflowSource = Form(InflowSource.MONETARY_DONATIONS),
        inflow_type: str = Form(...),
        
    ) -> "InflowFinanceRecordCreate":
        return cls(
            counterparty=counterparty,
            transaction_type=transaction_type,
            amount=amount,
            purpose=purpose,
            date=date,
            inflow_source = inflow_source,
            inflow_type=inflow_type,
        )

class OutflowFinanceRecordCreate(BaseModel):
    # finance_id is NOT required for create; DB should generate it
    counterparty: str
    transaction_type: TransactionType = TransactionType.OUTFLOW
    amount: Decimal
    purpose: Optional[str] = None
    date: date  # expects "YYYY-MM-DD" from the form
    spend_category: SpendCategory =  Field(default=SpendCategory.ADMINISTRATIVE)
    inflow_source: InflowSource = Field(default=InflowSource.MONETARY_DONATIONS)
    attachment: Optional[str] = None

    @classmethod
    def as_form(
        cls,
        counterparty: str = Form(...),
        transaction_type: TransactionType = Form(TransactionType.OUTFLOW),
        amount: Decimal = Form(...),
        purpose: Optional[str] = Form(None),
        date: date = Form(...),
        spend_category: SpendCategory = Form(SpendCategory.ADMINISTRATIVE),
        inflow_source: InflowSource = Form(InflowSource.MONETARY_DONATIONS),

    ) -> "OutflowFinanceRecordCreate":
        return cls(
            counterparty=counterparty,
            transaction_type=transaction_type,
            amount=amount,
            purpose=purpose,
            date=date,
            spend_category = spend_category,
            inflow_source=inflow_source
        )
        
class FinanceRecordUpdate(BaseModel):
    finance_id: str
    transaction_type: Optional[TransactionType] = TransactionType.INFLOW
    counterparty: Optional[str] = None
    amount: Optional[Decimal] = None
    purpose: Optional[str] = None
    date: Optional[date] = None
    inflow_source: Optional[InflowSource] = None
    spend_category: Optional[SpendCategory] = None
    attachment: Optional[str] = None

    @classmethod
    def as_form(
        cls,
        finance_id: str = Form(...),
        transaction_type: Optional[TransactionType] = Form(None),   
        counterparty: Optional[str] = Form(None),
        amount: Optional[Decimal] = Form(None),
        purpose: Optional[str] = Form(None),
        date: Optional[str] = None,
        inflow_source: Optional[InflowSource] = Form(None),
        spend_category: Optional[SpendCategory] = Form(None),
    ) -> "FinanceRecordUpdate":
        return cls(
            finance_id=finance_id,
            counterparty=counterparty,
            transaction_type=transaction_type,
            amount=amount,
            purpose=purpose,
            date=_parse_date_maybe(date),
            inflow_source=inflow_source,
            spend_category=spend_category,
            attachment=None, # Attachment is handled separately as a file upload
        )
        
class FinanceRecordRead(FinanceRecordBase):
    finance_id: str
    date: datetime
    inflow_source: Optional[InflowSource] = None
    spend_category: Optional[SpendCategory] = None
    attachment: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)



def _parse_date_maybe(s: Optional[str]) -> Optional[date]:
    if not s:
        return None
    # expects "YYYY-MM-DD"
    return date.fromisoformat(s)