"""
One-time migration: add new columns to existing tables.
Run from backend/ directory:  python migrate_add_columns.py
"""
from app.core.config import settings
import psycopg2

conn = psycopg2.connect(settings.DATABASE_URL)
cur = conn.cursor()

migrations = [
    # JobAnalysis — cv_customization_plan
    """
    ALTER TABLE job_analyses
    ADD COLUMN IF NOT EXISTS cv_customization_plan JSONB;
    """,
    # Job — posting_legitimacy
    """
    ALTER TABLE jobs
    ADD COLUMN IF NOT EXISTS posting_legitimacy VARCHAR;
    """,
    # Job — legitimacy_signals
    """
    ALTER TABLE jobs
    ADD COLUMN IF NOT EXISTS legitimacy_signals JSONB;
    """,
]

for sql in migrations:
    try:
        cur.execute(sql)
        print(f"OK: {sql.strip()[:60]}")
    except Exception as e:
        print(f"SKIP ({e}): {sql.strip()[:60]}")
        conn.rollback()

conn.commit()
cur.close()
conn.close()
print("Migration complete.")
