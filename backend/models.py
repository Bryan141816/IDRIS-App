# models.py
from enum import unique
from sqlalchemy import Column, Integer, String
from sqlalchemy.types import JSON
from database import Base  # <-- import Base here

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    user_type = Column(String)
    roles = Column(JSON, default=[])
