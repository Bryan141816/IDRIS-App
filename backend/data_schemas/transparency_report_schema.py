from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


# =========================
# Base (common read/write)
# =========================
class TransparencyReportBase(BaseModel):
    file: str
    file_name: str
    date_issued: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


# =========================
# Create
# =========================
class TransparencyReportCreate(BaseModel):
    file: str
    file_name: str
    date_issued: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


# =========================
# Update (partial/patch)
# =========================
class TransparencyReportUpdate(BaseModel):
    transparency_id: int = Field(..., alias="id")  # maps to model id
    file: Optional[str] = None
    file_name: Optional[str] = None
    date_issued: Optional[datetime] = None

    class Config:
        from_attributes = True
        populate_by_name = True


# =========================
# Read / Response
# =========================
class TransparencyReportOut(BaseModel):
    transparency_id: int = Field(..., alias="id")
    file: str
    file_name: str
    date_issued: datetime
    date_uploaded: datetime
    date_updated: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


# Slim item for lists, if you want lighter payloads
class TransparencyReportMini(BaseModel):
    transparency_id: int = Field(..., alias="id")
    file_name: str
    date_issued: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


# =========================
# Filters & Pagination
# =========================
class TransparencyReportFilter(BaseModel):
    file_name: Optional[str] = None
    date: Optional[datetime] = None  # interpreted as date_issued in queries
    limit: int = 5
    page: int = 1


class TransparencyReportResponsePaginated(BaseModel):
    max_page: int
    records: List[TransparencyReportOut]

    class Config:
        from_attributes = True
        populate_by_name = True


class TransparencyReportMiniPaginated(BaseModel):
    max_page: int
    reports: List[TransparencyReportMini]

    class Config:
        from_attributes = True
        populate_by_name = True
