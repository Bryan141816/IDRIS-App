from pydantic import BaseModel

class InKindMonitoring(BaseModel):
    available_relief_packs: int
    currently_in_transit: int
    already_distributed: int
    remaining_days: int

