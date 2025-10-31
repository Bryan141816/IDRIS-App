from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

class DisbursementItemBase(BaseModel):
    item_name: str
    quantity: int
    unit: str
    unit_cost: Decimal
    vendor: str

class DisbursementItemCreate(DisbursementItemBase):
    pass

class DisbursementItem(DisbursementItemBase):
    item_id: str

    class Config:
        from_attributes = True

class DisbursementBase(BaseModel):
    disbursement_name: str
    origin_name: str
    origin_id: int
    attachment: Optional[str] = None
    remarks: Optional[str] = None
    status: str
    date_created: datetime
    
    class Config:
        from_attributes = True
    
class DisbursementCreate(DisbursementBase):
    items: List[DisbursementItemCreate]

class Disbursement(DisbursementBase):
    disbursement_id: str
    status: str
    date_created: datetime
    date_updated: datetime
    items: List[DisbursementItem]

    class Config:
        from_attributes = True

class DisbursementUpdate(BaseModel):
    status: Optional[str] = None
