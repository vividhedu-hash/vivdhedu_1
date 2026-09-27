"""Waitlist signups — the launch conversion mechanism.

Revision ID: 0003_waitlist
Revises: 0002_personal_intel
Create Date: 2026-09-27
"""
from alembic import op

revision = "0003_waitlist"
down_revision = "0002_personal_intel"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # uuid_generate_v4() is used rather than gen_random_uuid() to match every
    # other table in db/schema.sql. The uuid-ossp extension is created by
    # 0001_baseline, so it is already present.
    op.execute("""
    CREATE TABLE IF NOT EXISTS waitlist_signups (
      id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email            TEXT NOT NULL,
      full_name        TEXT,
      interest         TEXT,
      referral_source  TEXT,
      payload          JSONB,
      utm              JSONB,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    """)

    # `email` is TEXT, not CITEXT. The baseline schema does not create the
    # citext extension and CREATE EXTENSION needs a superuser, which migrations
    # do not have on Supabase. Uniqueness is enforced by an expression index on
    # LOWER(email) instead, which also covers direct SQL inserts that bypass the
    # API's own lowercase normalisation.
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_signups_email ON waitlist_signups (LOWER(email))")
    op.execute("CREATE INDEX IF NOT EXISTS idx_waitlist_signups_created ON waitlist_signups (created_at DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_waitlist_signups_interest ON waitlist_signups (interest)")

    # The waitlist is written by the FastAPI backend (service_role, which
    # bypasses RLS) through POST /api/waitlist. The browser never reads this
    # table directly — it goes through the Next.js route handler.
    #
    # RLS is enabled with NO policies, which denies anon and authenticated
    # outright. That is deliberate: a lead list is exactly the kind of table
    # that must not be enumerable through the public PostgREST endpoint that
    # ships in the client bundle. There is no SELECT/INSERT/UPDATE/DELETE
    # policy for anon, so every role except service_role gets zero rows.
    op.execute("ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY")
    op.execute("REVOKE ALL ON waitlist_signups FROM anon, authenticated")
    op.execute("GRANT ALL ON waitlist_signups TO service_role")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS waitlist_signups CASCADE")
