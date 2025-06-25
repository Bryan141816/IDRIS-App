
from sqlalchemy import text
from alembic import op
import sqlalchemy as sa

# Revision identifiers, used by Alembic.
revision = '004_delete_organization_donor'
down_revision = '003_fix_timestamp'
branch_labels = None
depends_on = None


def upgrade(engine):
    with engine.connect() as conn:
        try:
            # Step 1: Drop donor -> organization constraint and column
            conn.execute(text("""
                ALTER TABLE donors
                DROP CONSTRAINT IF EXISTS donors_organization_id_fkey;
            """))
            conn.execute(text("""
                ALTER TABLE donors
                DROP COLUMN IF EXISTS organization_id;
            """))

            # Step 2: Drop the donor_type constraint function and trigger if they exist
            conn.execute(text("""
                DROP TRIGGER IF EXISTS tr_validate_donor_type_and_fk ON donors;
            """))
            conn.execute(text("""
                DROP FUNCTION IF EXISTS validate_donor_type_and_fk();
            """))

            # Step 3: Drop the organizations table
            conn.execute(text("""
                DROP TABLE IF EXISTS organizations CASCADE;
            """))

            # Step 4: Rename donors.name → donors.organization_name
            conn.execute(text("""
                ALTER TABLE donors
                RENAME COLUMN name TO organization_name;
            """))

            conn.commit()
            print("✅ Removed donor-organization constraints and dropped 'organizations' table.")
        except Exception as e:
            conn.rollback()
            print(f"❌ Error during migration: {e}")
            raise

def downgrade(engine):
    with engine.connect() as conn:
        try:
            # Step 1: Rename organization_name back to name
            conn.execute(text("""
                ALTER TABLE donors
                RENAME COLUMN organization_name TO name;
            """))
            
            # Step 1: Recreate the organizations table
            conn.execute(text("""
                CREATE TABLE organizations (
                    "organizationId" SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL UNIQUE,
                    phone_number VARCHAR(50),
                    email VARCHAR(255),
                    address VARCHAR(255),
                    date_created TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
            """))

            # Step 2: Add back organization_id column and FK to donors
            conn.execute(text("""
                ALTER TABLE donors
                ADD COLUMN organization_id INTEGER REFERENCES organizations("organizationId");
            """))

            # Step 3: Recreate validate_donor_type_and_fk function and trigger
            conn.execute(text("""
                CREATE OR REPLACE FUNCTION validate_donor_type_and_fk()
                RETURNS TRIGGER AS $$
                BEGIN
                    IF NOT (
                        (NEW.donor_type = 'Individual' AND NEW.user_id IS NOT NULL AND NEW.organization_id IS NULL) OR
                        (NEW.donor_type = 'Organization' AND NEW.user_id IS NULL AND NEW.organization_id IS NOT NULL)
                    ) THEN
                        RAISE EXCEPTION 'Invalid donor type configuration';
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            """))

            conn.execute(text("""
                CREATE TRIGGER tr_validate_donor_type_and_fk
                BEFORE INSERT OR UPDATE ON donors
                FOR EACH ROW
                EXECUTE FUNCTION validate_donor_type_and_fk();
            """))

            conn.commit()
            print("✅ Downgrade completed: restored donors->organization constraints and table.")
        except Exception as e:
            conn.rollback()
            print(f"❌ Error during downgrade: {e}")
            raise