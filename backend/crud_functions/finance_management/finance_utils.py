from typing import List, Optional, Union
from datetime import date
from sqlalchemy.orm import Session
from models import BudgetAllocation, FinanceRecord, RecordStatus

# helpers (no switches; supports fuzzy matching with "includes")
def _to_alloc_enums(items: List[Union[str, BudgetAllocation]]) -> List[BudgetAllocation]:
    out: List[BudgetAllocation] = []
    for raw in items or []:
        if isinstance(raw, BudgetAllocation):
            out.append(raw); continue
        s = str(raw).strip().lower()
        if "emergency" in s: out.append(BudgetAllocation.EMERGENCY); continue
        if "food" in s or "water" in s: out.append(BudgetAllocation.FOOD_WATER); continue
        if "transport" in s: out.append(BudgetAllocation.TRANSPORTATION); continue
        if "equip" in s: out.append(BudgetAllocation.EQUIPMENT); continue
        if "admin" in s: out.append(BudgetAllocation.ADMINISTRATIVE); continue
        if "donation" in s: out.append(BudgetAllocation.DONATIONS); continue
        if "general" in s: out.append(BudgetAllocation.GENERAL); continue
        # exact fallback by value or name
        for mem in BudgetAllocation:
            if s == mem.value.lower() or s == mem.name.lower():
                out.append(mem); break
    return out

def _to_status_enums(items: List[Union[str, RecordStatus]]) -> List[RecordStatus]:
    out: List[RecordStatus] = []
    for raw in items or []:
        if isinstance(raw, RecordStatus):
            out.append(raw); continue
        s = str(raw).strip().lower()
        if "pending" in s: out.append(RecordStatus.PENDING); continue
        if "received" in s: out.append(RecordStatus.RECEIVED); continue
        if "paid" in s: out.append(RecordStatus.PAID); continue
        if "approved" in s: out.append(RecordStatus.APPROVED); continue
        if "denied" in s: out.append(RecordStatus.DENIED); continue
        if "reconcil" in s: out.append(RecordStatus.RECONCILED); continue
        for mem in RecordStatus:
            if s == mem.value.lower() or s == mem.name.lower():
                out.append(mem); break
    return out
