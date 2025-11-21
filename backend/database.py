
import os
import time
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
from decouple import config

# Support both Docker and local development
DATABASE_URL = config("DATABASE_URL")

# Fix postgres:// URL format for SQLAlchemy
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Connection pool settings for better performance
if "sqlite" in DATABASE_URL:
     engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Verify connections before use
        pool_recycle=3600,  # Recycle connections every hour
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,  # Verify connections before use
        pool_recycle=3600,  # Recycle connections every hour
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def wait_for_db(max_retries=30, delay=1):
    """Wait for database to be ready with retries and ensure required extensions exist"""
    for attempt in range(max_retries):
        try:
            with engine.connect() as conn:
                # Simple check first
                conn.execute(text("SELECT 1"))
                print(f"✅ Database connection successful! (attempt {attempt+1})")

                # Try to enable extensions safely
                try:
                    conn.execute(text("CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;"))
                    conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm;"))
                    conn.commit()  # SQLAlchemy 2.x / psycopg3 requires commit
                    print("🔧 Required extensions ensured (fuzzystrmatch, pg_trgm).")
                except Exception as ext_err:
                    print(
                        f"⚠️ Could not create extensions (might lack privileges): {ext_err}"
                    )

                return True

        except OperationalError as e:
            print(f"❌ Database connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(delay)
            else:
                print("⛔ Max retries reached. Database connection failed.")
                raise

    return False


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)
