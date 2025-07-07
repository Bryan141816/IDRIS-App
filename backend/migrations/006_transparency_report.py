"""create transparency_report table

Revision ID: 006_transparency_report
Revises: 005_rename_donor_org_name
Create Date: 2025-07-02 10:00:00.000000
"""

from sqlalchemy import text

# Revision identifiers, used by Alembic.
revision = '006_transparency_report'
down_revision = '005_rename_donor_org_name'
branch_labels = None
depends_on = None


def upgrade(engine):
    with engine.connect() as conn:
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS transparency_report (
                    transparency_id INTEGER PRIMARY KEY,
                    file TEXT NOT NULL,
                    file_name VARCHAR(50) NOT NULL,
                    date_issued TIMESTAMP WITH TIME ZONE NOT NULL,
                    date_uploaded TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    date_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
            """))


            conn.commit()
            print("✅ Created 'transparency_report' table.")
        except Exception as e:
            conn.rollback()
            print(f"❌ Error during upgrade: {e}")
            raise


def downgrade(engine):
    with engine.connect() as conn:
        try:
            conn.execute(text("DROP TABLE IF EXISTS transparency_report;"))
            conn.commit()
            print("✅ Dropped 'transparency_report' table.")
        except Exception as e:
            conn.rollback()
            print(f"❌ Error during downgrade: {e}")
            raise
