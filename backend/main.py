from fastapi import FastAPI
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database URL (use environment variable or hardcode for local testing)
DATABASE_URL = "postgresql://postgres:password@db:5432/mydatabase"


# SQLAlchemy setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# SQLAlchemy model
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String)

# Pydantic model
class UserSchema(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True  # ✅ instead of orm_mode = True


# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Insert data if table is empty
def init_data():
    db = SessionLocal()
    if db.query(User).count() == 0:
        user = User(name="John Doe", email="john@example.com")
        db.add(user)
        db.commit()
    db.close()

init_data()

@app.get("/users", response_model=list[UserSchema])
def read_users():
    db = SessionLocal()
    users = db.query(User).all()
    db.close()
    return users
