from sqlalchemy import text
from alembic import op
import sqlalchemy as sa

# Revision identifiers, used by Alembic.
revision = '005_rename_donor_org_name'
down_revision = '004_delete_organization_donor'
branch_labels = None
depends_on = None


def upgrade(engine):
    with engine.connect() as conn:
        try:
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
            
            conn.commit()
            print("✅ Downgrade completed: restored donors->organization constraints and table.")
        except Exception as e:
            conn.rollback()
            print(f"❌ Error during downgrade: {e}")
            raise