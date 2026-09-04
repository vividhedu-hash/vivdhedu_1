"""Baseline schema from db/schema.sql

Revision ID: 0001_baseline
Revises:
Create Date: 2026-08-21
"""
from pathlib import Path

from alembic import op

revision = "0001_baseline"
down_revision = None
branch_labels = None
depends_on = None

SCHEMA_PATH = Path(__file__).resolve().parents[2] / "db" / "schema.sql"


def upgrade() -> None:
    sql = SCHEMA_PATH.read_text(encoding="utf-8")
    # psycopg2 can run a multi-statement script; op.execute() cannot.
    op.get_bind().exec_driver_sql(sql)


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS v_anomaly_queue CASCADE")
    op.execute("DROP VIEW IF EXISTS v_programs_full CASCADE")
    op.execute("DROP TABLE IF EXISTS student_reports CASCADE")
    op.execute("DROP TABLE IF EXISTS educator_feedback CASCADE")
    op.execute("DROP TABLE IF EXISTS anomalies CASCADE")
    op.execute("DROP TABLE IF EXISTS cost_data CASCADE")
    op.execute("DROP TABLE IF EXISTS placement_data CASCADE")
    op.execute("DROP TABLE IF EXISTS risk_indicators CASCADE")
    op.execute("DROP TABLE IF EXISTS salary_trajectories CASCADE")
    op.execute("DROP TABLE IF EXISTS roi_scores CASCADE")
    op.execute("DROP TABLE IF EXISTS data_points CASCADE")
    op.execute("DROP TABLE IF EXISTS scrape_runs CASCADE")
    op.execute("DROP TABLE IF EXISTS macro_indicators CASCADE")
    op.execute("DROP TABLE IF EXISTS programs CASCADE")
    op.execute("DROP TABLE IF EXISTS degrees CASCADE")
    op.execute("DROP TABLE IF EXISTS colleges CASCADE")
    op.execute("DROP TABLE IF EXISTS model_versions CASCADE")
    op.execute("DROP TYPE IF EXISTS feedback_status CASCADE")
    op.execute("DROP TYPE IF EXISTS confidence_level CASCADE")
    op.execute("DROP TYPE IF EXISTS anomaly_status CASCADE")
    op.execute("DROP TYPE IF EXISTS scrape_status CASCADE")
    op.execute("DROP TYPE IF EXISTS degree_field CASCADE")
    op.execute("DROP TYPE IF EXISTS degree_level CASCADE")
    op.execute("DROP TYPE IF EXISTS college_type CASCADE")
    op.execute("DROP TYPE IF EXISTS college_tier CASCADE")
