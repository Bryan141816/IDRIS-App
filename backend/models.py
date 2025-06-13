# models.py
from datetime import timezone
from enum import unique
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.types import JSON
from sqlalchemy.sql import func
from database import Base  # <-- import Base here

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    user_type = Column(String)
    roles = Column(JSON, default=[])

class ResponseReport(Base):
    __tablename__ = "response_reports"

    id = Column(Integer, primary_key= True, index = True)
    date_time = Column(DateTime(timezone= True), server_default= func.now(), nullable = False)
    report_type = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False)

class FundingProposals(Base):
    __tablename__ = "funding_proposals"

    proposalId = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(String, nullable=False)
    progress = Column(Integer, default=0, nullable=False)  # Progress in percentage
    budgetRequired = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    status = Column(String(50), nullable=False)
    image = Column(String, nullable=True)
