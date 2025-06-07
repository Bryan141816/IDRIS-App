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
