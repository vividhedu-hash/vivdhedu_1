"""Personal intelligence table for grounded Gemini paths.

Revision ID: 0002_personal_intel
Revises: 0001_baseline
Create Date: 2026-08-22
"""
from alembic import op

revision = "0002_personal_intel"
down_revision = "0001_baseline"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
    CREATE TABLE IF NOT EXISTS personal_intelligence (
      id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      token           VARCHAR(64) UNIQUE NOT NULL,
      profile_data    JSONB NOT NULL,
      intelligence    JSONB NOT NULL,
      path_graph      JSONB NOT NULL,
      citations       JSONB NOT NULL DEFAULT '{}',
      model_version   VARCHAR(64),
      grounded        BOOLEAN NOT NULL DEFAULT FALSE,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_personal_intelligence_token ON personal_intelligence(token)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_personal_intelligence_created ON personal_intelligence(created_at DESC)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS personal_intelligence CASCADE")
