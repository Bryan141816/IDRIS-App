# migrations/003_fix_timestamp_function.py
from sqlalchemy import text

def upgrade(engine):
    """Fix the update_updated_at_column function to handle different column names"""
    with engine.connect() as conn:
        try:
            # Fix the update_updated_at_column function
            conn.execute(text("""
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    -- Handle tables with 'updated_at' column (like funding_proposals)
                    IF TG_TABLE_NAME = 'funding_proposals' THEN
                        NEW.updated_at = CURRENT_TIMESTAMP;
                    -- Handle tables with 'last_updated' column (like organizations, donors)
                    ELSIF TG_TABLE_NAME IN ('organizations', 'donors') THEN
                        NEW.last_updated = CURRENT_TIMESTAMP;
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            """))
            
            conn.commit()
            print("✅ Timestamp function fixed successfully!")
            
        except Exception as e:
            conn.rollback()
            print(f"❌ Error fixing timestamp function: {e}")
            raise


def downgrade(engine):
    """Revert to the broken version (not recommended)"""
    with engine.connect() as conn:
        try:
            # Revert to the broken version
            conn.execute(text("""
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.last_updated = CURRENT_TIMESTAMP;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            """))
            
            conn.commit()
            print("✅ Reverted to broken timestamp function!")
            
        except Exception as e:
            conn.rollback()
            print(f"❌ Error reverting timestamp function: {e}")
            raise