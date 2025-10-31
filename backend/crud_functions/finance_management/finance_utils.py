from typing import List, Optional, Union
from datetime import date
from sqlalchemy.orm import Session
from models import BudgetAllocation, FinanceRecord

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

