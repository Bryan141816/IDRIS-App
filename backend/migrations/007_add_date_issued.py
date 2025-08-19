"""Add autoincrement to transparency_id

Revision ID: 008_autoincrement_transparency_report
Revises: 007_add_date_issued_column
Create Date: 2025-08-14 08:00:00
"""

from sqlalchemy import text

# Revision identifiers, used by Alembic.
revision = '008_autoincrement_transparency_report'
down_revision = '007_add_date_issued_column'
branch_labels = None
depends_on = None


def upgrade(engine):
    with engine.connect() as conn:
        try:
            # Create sequence if it doesn't exist
            conn.execute(text("""
                CREATE SEQUENCE IF NOT EXISTS transparency_report_transparency_id_seq
                START WITH 1
                INCREMENT BY 1
                OWNED BY transparency_report.transparency_id;
            """))

            # Set the sequence as the default for transparency_id
            conn.execute(text("""
                ALTER TABLE transparency_report
                ALTER COLUMN transparency_id SET DEFAULT nextval('transparency_report_transparency_id_seq');
            """))

            # Adjust sequence to start after the current max ID
            conn.execute(text("""
                SELECT setval(
                    'transparency_report_transparency_id_seq',
                    COALESCE((SELECT MAX(transparency_id) FROM transparency_report), 0) + 1,
                    false
                );
            """))

            conn.commit()
            print("✅ Added autoincrement to transparency_id in transparency_report.")
        except Exception as e:
            conn.rollback()
            print(f"❌ Error during upgrade: {e}")
            raise


def downgrade(engine):
    with engine.connect() as conn:
        try:
            # Remove default
            conn.execute(text("""
                ALTER TABLE transparency_report
                ALTER COLUMN transparency_id DROP DEFAULT;
            """))

            # Drop sequence
            conn.execute(text("""
                DROP SEQUENCE IF EXISTS transparency_report_transparency_id_seq;
            """))

            conn.commit()
            print("✅ Removed autoincrement from transparency_id in transparency_report.")
        except Exception as e:
            conn.rollback()
            print(f"❌ Error during downgrade: {e}")
            raise
