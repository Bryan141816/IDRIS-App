"""add date_issued column to transparency_report table

Revision ID: 007_add_date_issued_column
Revises: 006_transparency_report
Create Date: 2025-07-02 12:00:00.000000
"""

from sqlalchemy import text

# Revision identifiers, used by Alembic.
revision = '007_add_date_issued_column'
down_revision = '006_transparency_report'
branch_labels = None
depends_on = None


def upgrade(engine):
    with engine.connect() as conn:
        try:
            conn.execute(text("""
                ALTER TABLE transparency_report
                ADD COLUMN IF NOT EXISTS date_issued TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
            """))
            conn.commit()
            print("✅ Added 'date_issued' column to transparency_report.")
        except Exception as e:
            conn.rollback()
            print(f"❌ Error during upgrade: {e}")
            raise


def downgrade(engine):
    with engine.connect() as conn:
        try:
            conn.execute(text("""
                ALTER TABLE transparency_report
                DROP COLUMN IF EXISTS date_issued;
            """))
            conn.commit()
            print("✅ Dropped 'date_issued' column from transparency_report.")
        except Exception as e:
            conn.rollback()
            print(f"❌ Error during downgrade: {e}")
            raise
