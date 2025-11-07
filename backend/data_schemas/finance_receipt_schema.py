from pydantic import BaseModel
from typing import Optional
from datetime import date as dt_date, datetime

class DonorDetailsSchema(BaseModel):
    donor_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None

    model_config = {"from_attributes": True}

class FinanceRecordDetailsSchema(BaseModel):
    finance_id: str
    amount: Optional[float] = None
    inflow_source: Optional[str] = None
    date: Optional[dt_date] = None

    model_config = {"from_attributes": True}

class FinanceReceiptSchema(BaseModel):
    finance_record: FinanceRecordDetailsSchema
    donor: DonorDetailsSchema

    class Config:
        from_attributes = True
