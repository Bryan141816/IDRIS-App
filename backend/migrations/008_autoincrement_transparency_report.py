# 008_autoincrement_transparency_report.py

from sqlalchemy import text

def upgrade(engine):
    """
    Adds an autoincrement sequence to the transparency_id column
    in the transparency_report table, and sets it to start at the
    correct value based on existing data.
    """
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE SEQUENCE IF NOT EXISTS transparency_report_transparency_id_seq
            START WITH 1
            INCREMENT BY 1
            OWNED BY transparency_report.transparency_id;
        """))

        conn.execute(text("""
            ALTER TABLE transparency_report
            ALTER COLUMN transparency_id SET DEFAULT nextval('transparency_report_transparency_id_seq');
        """))

        conn.execute(text("""
            SELECT setval(
                'transparency_report_transparency_id_seq',
                COALESCE((SELECT MAX(transparency_id) FROM transparency_report), 0) + 1,
                false
            );
        """))


def downgrade(engine):
    """
    Removes the autoincrement sequence from transparency_id.
    """
    with engine.connect() as conn:
        conn.execute(text("""
            ALTER TABLE transparency_report
            ALTER COLUMN transparency_id DROP DEFAULT;
        """))

        conn.execute(text("""
            DROP SEQUENCE IF EXISTS transparency_report_transparency_id_seq;
        """))
