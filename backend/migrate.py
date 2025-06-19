import os
import time
import importlib.util
from pathlib import Path
from sqlalchemy.exc import OperationalError
from sqlalchemy import text
from database import engine

def wait_for_database(max_retries=30, retry_interval=2):
    """Wait for database to be ready before running migrations"""
    for attempt in range(max_retries):
        try:
            conn = engine.connect()
            conn.close()
            print(f"✅ Database connection successful! (attempt {attempt + 1})")
            return True
        except OperationalError as e:
            print(f"⏳ Waiting for database... (attempt {attempt + 1}/{max_retries})")
            print(f"   Error: {str(e)[:100]}...")
            time.sleep(retry_interval)
        except Exception as e:
            print(f"⏳ Waiting for database... (attempt {attempt + 1}/{max_retries})")
            print(f"   Unexpected error: {str(e)[:100]}...")
            time.sleep(retry_interval)
    
    print("❌ Could not connect to database after maximum retries")
    raise Exception("Database connection failed")

def ensure_migration_table():
    """Create migration tracking table if it doesn't exist"""
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS migration_history (
                id SERIAL PRIMARY KEY,
                migration_name VARCHAR(255) UNIQUE NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        conn.commit()

def is_migration_applied(migration_name):
    """Check if a migration has already been applied"""
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT COUNT(*) FROM migration_history WHERE migration_name = :name"),
            {"name": migration_name}
        )
        return result.scalar() > 0

def mark_migration_applied(migration_name):
    """Mark a migration as applied"""
    with engine.connect() as conn:
        conn.execute(
            text("INSERT INTO migration_history (migration_name) VALUES (:name)"),
            {"name": migration_name}
        )
        conn.commit()

def run_migrations():
    # Wait for database to be ready
    wait_for_database()
    
    # Ensure migration tracking table exists
    ensure_migration_table()
    
    migrations_dir = Path("migrations")
    if not migrations_dir.exists():
        print("❌ Migrations directory not found!")
        return
    
    migration_files = sorted([f for f in migrations_dir.glob("*.py") if f.name != "__init__.py"])
    
    if not migration_files:
        print("ℹ️  No migration files found")
        return
    
    for migration_file in migration_files:
        migration_name = migration_file.stem  # filename without .py
        
        if is_migration_applied(migration_name):
            print(f"⏭️  Skipping {migration_file.name} (already applied)")
            continue
            
        print(f"Running migration: {migration_file.name}")
        
        try:
            # Load the migration module
            spec = importlib.util.spec_from_file_location("migration", migration_file)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            
            # Run the upgrade function
            module.upgrade(engine)
            
            # Mark as applied
            mark_migration_applied(migration_name)
            
            print(f"✅ Completed migration: {migration_file.name}")
        except Exception as e:
            print(f"❌ Failed to run migration {migration_file.name}: {e}")
            raise

if __name__ == "__main__":
    run_migrations()