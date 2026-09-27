"""Align model_versions with the columns the code actually reads and writes.

Revision ID: 0004_model_versions_metrics
Revises: 0003_waitlist
Create Date: 2026-09-27
"""
from alembic import op

revision = "0004_model_versions_metrics"
down_revision = "0003_waitlist"
branch_labels = None
depends_on = None

# `validation_mae` / `validation_r2` are the names five call sites use
# (ModelRegistry.register and .compare, the promotion gate in
# ml/training_pipeline.py, and /api/ml/status + /api/ml/compare). `promoted_at`
# is written by ModelRegistry.promote() and read by ModelRegistry.rollback().
# None of the three existed in the table created by db/schema.sql, so on a
# schema-built database every retrain, promote and rollback failed.
#
# The legacy `mse` / `r2_score` columns are kept rather than dropped: they are
# unused in this repo, but the table is small and an unknown external reader
# breaking on a metadata change is a worse outcome than two dead columns.
#
# `IF NOT EXISTS` throughout, because deployments have drifted — some were
# created by running db/schema.sql directly, and the live database may already
# carry a hand-applied subset of these columns.


def upgrade() -> None:
    op.execute("""
        ALTER TABLE model_versions
          ADD COLUMN IF NOT EXISTS validation_mae DECIMAL(12,4),
          ADD COLUMN IF NOT EXISTS validation_r2  DECIMAL(8,6),
          ADD COLUMN IF NOT EXISTS promoted_at    TIMESTAMPTZ
    """)

    # Widen the legacy metric columns. The originals were DECIMAL(8,4) and
    # DECIMAL(6,4); DECIMAL(6,4) tops out at 99.9999 and cannot hold an R² at
    # all once a model is worse than predicting the mean, which is exactly when
    # an analyst most wants to see the number.
    op.execute("ALTER TABLE model_versions ALTER COLUMN mse TYPE DECIMAL(12,4)")
    op.execute("ALTER TABLE model_versions ALTER COLUMN r2_score TYPE DECIMAL(8,6)")

    # rollback() orders candidate champions by promoted_at DESC. Without this
    # the rollback endpoint still worked but scanned the whole table.
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_model_versions_promoted "
        "ON model_versions (promoted_at DESC)"
    )

    # Backfill a promoted_at for the live champion, so "which model is serving
    # traffic" and "when did it start" agree. Rows that are not live stay NULL:
    # only a model that has actually been promoted has a promotion time.
    op.execute("""
        UPDATE model_versions
           SET promoted_at = COALESCE(promoted_at, trained_at)
         WHERE is_live = TRUE
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_model_versions_promoted")
    op.execute("ALTER TABLE model_versions ALTER COLUMN mse TYPE DECIMAL(8,4)")
    op.execute("ALTER TABLE model_versions ALTER COLUMN r2_score TYPE DECIMAL(6,4)")
    op.execute("""
        ALTER TABLE model_versions
          DROP COLUMN IF EXISTS validation_mae,
          DROP COLUMN IF EXISTS validation_r2,
          DROP COLUMN IF EXISTS promoted_at
    """)
