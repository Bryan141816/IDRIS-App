from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


# Shared base for creation/update
class TransparencyReportBase(BaseModel):
    file: str
    file_name: str
    date_issued: datetime


# For creation (date_uploaded and date_updated are auto)
class TransparencyReportCreate(TransparencyReportBase):
    pass

class TransparencyReportUpdate(TransparencyReportBase):
    transparency_id: int
    pass

# For updating (optional fields)
# class TransparencyReportUpdate(BaseModel):
#     file: str | None = None
#     file_name: str | None = None
#     date_issued: datetime | None = None


# For reading/response
class TransparencyReportOut(TransparencyReportBase):
    transparency_id: int
    date_uploaded: datetime

    class Config:
        from_attributes = True

class TransparencyReportFilter(BaseModel):
    file_name: Optional[str] = None
    date: Optional[datetime] = None
    limit: int = 5
    page: int = 1