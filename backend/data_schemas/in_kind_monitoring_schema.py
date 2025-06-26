from pydantic import BaseModel

class InKindMonitoringSummary(BaseModel):
    available_relief_packs: int
    currently_in_transit: int
    already_distributed: int

