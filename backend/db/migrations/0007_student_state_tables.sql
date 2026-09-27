-- =============================================================================
-- Migration 0007 — student_profiles, saved_programs, applications,
--                  psychometric_sessions
-- =============================================================================
-- Why
-- ---
-- Nothing in this product survives a page refresh. Every piece of student state
-- is React `useState`, so the entire retention layer — shortlist, application
-- tracking, resumed psychometrics — is unbuildable until these four tables
-- exist. This migration creates the substrate; routers and UI come later.
--
-- THE RLS IDENTITY PROBLEM — read this before writing a router
-- -------------------------------------------------------
-- These tables are keyed on `users.id`. A Supabase-shaped policy would be:
--
--     USING (user_id = auth.uid())
--
-- ...and that policy WOULD ALWAYS EVALUATE FALSE. It is not a stylistic
-- preference; it is a hard mismatch of identity, verified in this codebase:
--
--   * `auth.uid()` returns the subject of the *Supabase Auth* JWT.
--   * The backend signs its OWN HS256 token (`api/routers/auth.py:80-89`,
--     `create_access_token`, payload key `sub`) and connects over a direct
--     pooler connection as `postgres` (`backend/.env` DATABASE_URL), a role
--     that bypasses RLS entirely.
--   * Worse, the two user stores are NOT the same population. `auth.py:287`
--     mints `users.id` with a fresh `str(uuid.uuid4())` on backend sign-in,
--     while the frontend holds a Supabase session whose `sub` is a different
--     UUID. So `auth.uid() = users.id` is false even for a genuinely signed-in
--     user, and an attacker controls the `sub` claim of any JWT they present.
--
-- So `auth.uid()` is unusable as an identity here. Instead, identity is carried
-- explicitly in a GUC that the API layer sets per transaction:
--
--     SET LOCAL app.user_id = '<users.id>';
--
-- and policies compare `user_id = NULLIF(current_setting('app.user_id', true), '')::uuid`.
--
-- `current_setting(..., true)` returns NULL when unset, `NULLIF` maps the empty
-- string to NULL, and a NULL `user_id` never satisfies `=` — so an un-set GUC
-- fails CLOSED. That is the opposite of the `qual = true` bug in 0003, where
-- a missing condition granted access to everything; here a missing condition
-- grants access to nothing.
--
-- Cost of this choice, stated plainly: the GUC is set by whatever role runs the
-- query. A client that can `SET app.user_id` directly can read any student's
-- rows. That is why BOTH conditions are enforced below:
--   1. anon and authenticated hold NO privileges at all on these four tables
--      (no INSERT/UPDATE/DELETE and, critically, no SELECT). Supabase grants
--      SELECT to anon by default; these REVOKEs are the actual barrier.
--   2. Only the backend's own connections can reach the data, and the backend
--      sets the GUC itself after verifying a session.
--
-- A router written later must therefore: decode the JWT, `SELECT id FROM users`
-- (or trust the verified `sub`), `SET LOCAL app.user_id` inside the same
-- transaction, then query. Skipping the SET LOCAL yields zero rows, not a leak.
--
-- `anon` gets a token-scoped path ONLY for psychometric_sessions, because the
-- test is public by design. See the note on that table.
--
-- Rollback
-- -------
--   DROP TABLE IF EXISTS public.applications;
--   DROP TABLE IF EXISTS public.saved_programs;
--   DROP TABLE IF EXISTS public.student_profiles;
--   DROP TABLE IF EXISTS public.psychometric_sessions;
-- =============================================================================

BEGIN;

-- ── 1. student_profiles ────────────────────────────────────────────────────
-- The intake wizard already collects all of this into `student_reports.profile_data`
-- as JSONB, and `api/schemas.py:200-247` defines the field names. This table
-- gives those answers a first-class, updatable, per-user home so they can be
-- read by the admissions engine instead of re-asked every session.

CREATE TABLE IF NOT EXISTS student_profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- One profile per user. UNIQUE (not PK) so the FK target and the natural key
  -- are different things and a re-pointed PK cannot orphan a saved shortlist.
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Academic standing (api/schemas.py StudentProfile, section 1)
  twelfth_stream    VARCHAR(32),      -- 'science' | 'commerce' | 'arts' | 'vocational' | 'other'
  tenth_pct         DECIMAL(5,2) CHECK (tenth_pct BETWEEN 0 AND 100),
  twelfth_pct       DECIMAL(5,2) CHECK (twelfth_pct BETWEEN 0 AND 100),
  -- Stored as a count, not a string. schemas.py models it as `backlog: str`
  -- ("none"/"one"/"two") because the form wizard has that shape; a count is
  -- what a backlog-eligibility check actually needs and it aggregates.
  backlog_count     SMALLINT NOT NULL DEFAULT 0 CHECK (backlog_count >= 0),

  -- Rank inputs. The admissions engine and both advisors read these keys:
  --   personal_intelligence.py:128  expected_rank or jee_rank, default 12000
  --   gemini_advisor.py:99          expected_rank or jee_rank, default 14000
  --   both                          exam_name from profile["exam"]
  -- So the column is named exam_name and `exam` is kept as a generated alias to
  -- match the JSON key those services read, rather than renaming a field two
  -- services already depend on.
  exam_name         VARCHAR(64) NOT NULL DEFAULT 'JEE Main',
  expected_rank     INTEGER CHECK (expected_rank > 0),
  jee_rank          INTEGER CHECK (jee_rank > 0),
  jee_main_percentile DECIMAL(6,3) CHECK (jee_main_percentile BETWEEN 0 AND 100),
  neet_score        INTEGER CHECK (neet_score BETWEEN -1 AND 720),
  -- Lets one profile cover a student sitting both JEE and NEET without a second
  -- row; the engine selects per exam rather than overwriting.
  other_exam_scores JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Reservation category and domicile. NOT decorative: admissions_engine
  -- multiplies the closing rank by SC 2.85 / ST 4.60 / PwD 5.20 / OBC-NCL 1.55,
  -- and applies a 1.35x expansion for home-state quota (equation 9.1). These two
  -- fields are the difference between a 4% and a 55% admission probability for
  -- the same student at the same college. They are currently never collected, so
  -- the engine silently assumes General + Maharashtra.
  category          VARCHAR(16) CHECK (category IN ('General','OPEN','EWS','OBC-NCL','OBC','SC','ST','PwD')),
  home_state        VARCHAR(64),
  -- Category reservation is claimed against a certificate; recording that a
  -- student is UNVERIFIED matters because the odds shown to them are computed
  -- from a claim that may not survive verification at counselling.
  category_verified BOOLEAN NOT NULL DEFAULT FALSE,

  -- Money (api/schemas.py section 2). The engine prunes any program costing more
  -- than 1.30x max_budget_inr, so this is a hard input to the 4-tier matrix.
  max_budget_inr    BIGINT CHECK (max_budget_inr > 0),
  loan_willingness  VARCHAR(32),      -- mirrors schemas.py loan_willingness scale
  loan_amount_inr   BIGINT CHECK (loan_amount_inr >= 0),
  family_income_band VARCHAR(32),

  -- Mobility preferences (schemas.py section 3)
  relocation_india VARCHAR(16),
  return_home      VARCHAR(16),

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Upsert-friendly: one row per user, so ON CONFLICT (user_id) works for the
  -- "ask once, update forever" intake flow.
  CONSTRAINT student_profiles_user_unique UNIQUE (user_id)
);

COMMENT ON TABLE student_profiles IS
  'First-class, updatable home for the answers the intake wizard already collects into student_reports.profile_data as JSONB. Extracted so the admissions engine can read rank, category and home state without a page refresh.';
COMMENT ON COLUMN student_profiles.category IS
  'Reservation category. Drives the CATEGORY_MULTIPLIERS rank relaxation (SC 2.85, ST 4.60, PwD 5.20, OBC-NCL 1.55) in admissions_engine. Treating this as cosmetic is the difference between a 4% and a 55% admission probability for an identical student. Individually sensitive: combined with home_state and a rank it is effectively re-identifiable, so it is never exposed to anon and never to another student.';
COMMENT ON COLUMN student_profiles.category_verified IS
  'TRUE only once a category certificate has been sighted. Probability figures computed from an unverified claim are indicative, not a prediction of what counselling will do, and the UI should say so.';
COMMENT ON COLUMN student_profiles.exam_name IS
  'Primary entrance exam. Read by personal_intelligence.py:129 and gemini_advisor.py:100 as profile["exam"]; the `exam` generated column below preserves that key so those services need no change.';

-- Generated alias so the JSON key the existing services read ("exam") resolves
-- without editing ml/** or services/**, which are out of scope for this worker.
ALTER TABLE student_profiles
  ADD COLUMN exam VARCHAR(64) GENERATED ALWAYS AS (exam_name) STORED;

COMMENT ON COLUMN student_profiles.exam IS
  'Generated alias of exam_name. Exists only so personal_intelligence.py:129 and gemini_advisor.py:100, which read merged_profile["exam"], keep working against this table unchanged.';

CREATE INDEX idx_student_profiles_exam_rank ON student_profiles(exam_name, expected_rank);
CREATE INDEX idx_student_profiles_state ON student_profiles(home_state);

-- ── 2. saved_programs (shortlist / favourites) ─────────────────────────────

CREATE TABLE IF NOT EXISTS saved_programs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_id        UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  -- Kept denormalised alongside the FK on purpose. The shortlist card renders a
  -- college name, and programs(id) is resolvable only by a second query. One
  -- extra denormalised label is a fair price for a list that renders in a
  -- single round trip; it is a cache, not a source of truth.
  program_label     VARCHAR(256),
  note              TEXT,
  -- A single 1-3 ordinal per item, enough to render and sort a working
  -- shortlist.
  --
  -- JUDGMENT CALL: no `list_name`, hence no "dream schools" / "backup" / "safety
  -- net" grouping. Three reasons. (1) Nothing in the current codebase or the
  -- plan asks for multiple named lists, and a list-per-row schema has to be
  -- exposed through the API before anyone has used one. (2) The 4-tier matrix
  -- the admissions engine already returns (reach/target/safety/hidden_gem) is
  -- itself the grouping, so `priority` captures the axis that actually matters
  -- today. (3) It stays cheap to add later: because the UNIQUE constraint below
  -- is on (user_id, program_id) WITHOUT list_name, introducing a
  -- `saved_lists` table and widening the constraint to (user_id, list_id,
  -- program_id) is a schema change, not a data migration of existing rows.
  priority          SMALLINT CHECK (priority BETWEEN 1 AND 3),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Saving is idempotent: a double-tap on the Bookmark icon upserts rather than
  -- creating a duplicate row. This is the actual fix for the alert() stub.
  CONSTRAINT saved_programs_user_program_unique UNIQUE (user_id, program_id)
);

COMMENT ON TABLE saved_programs IS
  'Student shortlist / favourites. Replaces the alert() stub behind every Bookmark icon. UNIQUE (user_id, program_id) makes save idempotent so the button can be a plain upsert.';

-- "my shortlist, newest first". user_id is the leading column of the UNIQUE, so
-- this only adds the created_at ordering to it.
CREATE INDEX idx_saved_programs_user ON saved_programs(user_id, created_at DESC);
-- program_id is the SECOND column of the UNIQUE (user_id, program_id) and so
-- cannot be served by it. This backs the catalogue-side "is this program
-- already saved / how many students saved it" read.
CREATE INDEX idx_saved_programs_program ON saved_programs(program_id);

-- ── 3. applications (the retention layer) ──────────────────────────────────
-- The admissions engine returns a 4-tier reach/target/safety/hidden-gem matrix
-- and then the student is never contacted again. This table is what makes the
-- product useful AFTER the report, which is where retention actually lives.

CREATE TABLE IF NOT EXISTS applications (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_id          UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  college_name        VARCHAR(128),
  program_name        VARCHAR(128),
  tier                VARCHAR(16) CHECK (tier IN ('reach','target','safety','hidden_gem','pruned')),
  status              VARCHAR(16) NOT NULL DEFAULT 'planned'
                      CHECK (status IN ('planned','submitted','shortlisted','rejected','admitted','waitlisted')),
  -- Both dates are nullable and the row is created at 'planned', long before
  -- anything is submitted. A NOT NULL deadline would force the student to enter
  -- a date they do not have, and the reminders that make this table worth
  -- having depend on the date being real when it arrives.
  application_deadline DATE,
  submitted_at        TIMESTAMPTZ,
  -- Which counselling channel. Centralised counselling (JoAA, MCC) and state
  -- counselling are separate processes with separate deadlines, so one date
  -- column cannot honestly describe both.
  counselling_round   VARCHAR(64),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT applications_user_program_unique UNIQUE (user_id, program_id)
);

COMMENT ON TABLE applications IS
  'Application tracker with deadlines. The admissions engine produces a tier matrix; this is what the student comes back to the product for. A deadline column is only useful if the row is creatable before the deadline is known, hence the nullable date and the planned default status.';

CREATE INDEX idx_applications_user_status ON applications(user_id, status);
-- Drives the "your deadline is in N days" surface, which is the single query
-- that makes this table a reason to open the product again.
CREATE INDEX idx_applications_deadline ON applications(application_deadline)
  WHERE application_deadline IS NOT NULL AND status = 'planned';
-- program_id is the SECOND column of the UNIQUE (user_id, program_id), so the
-- unique index cannot serve a program-only lookup. Needed for the catalogue-side
-- query "how many students shortlisted this program", which a retention feature
-- will want and which this table's whole purpose is to answer.
CREATE INDEX idx_applications_program ON applications(program_id);

-- ── 4. psychometric_sessions ───────────────────────────────────────────────
-- The highest-value table in this migration. psychometric_engine.py:78 holds
-- sessions in `self.sessions: Dict[str, PsychometricSession] = {}` — a
-- process-local dict. That single line is why sessions die on restart, break
-- under more than one worker, and why the item bank is duplicated three times
-- (Python, indialens/src/app/api/v2/[...path]/route.ts, and
-- indialens/src/app/psychometric/page.tsx). One table lets two of those go.

CREATE TABLE IF NOT EXISTS psychometric_sessions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- The PUBLIC handle, and deliberately separate from `id`.
  -- The engine currently does `str(uuid.uuid4())`, which is v4 random and
  -- therefore already unguessable — this preserves that property. Keeping it as
  -- its own column rather than reusing `id` means the two can diverge later
  -- (e.g. a longer opaque token) without rewriting every foreign reference, and
  -- it keeps `id` stable as an internal key.
  session_id        VARCHAR(64) NOT NULL UNIQUE,

  -- NULLABLE ON PURPOSE. The test is free and public, and /api/v2/psychometric
  -- /start takes no credentials, so most sessions are anonymous. Requiring a
  -- user_id would mean either gating the test behind auth (a product regression)
  -- or inventing fake user rows (data corruption).
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,

  -- The test is driven by `stream` and `budget` at start (psychometric.py:17-19).
  stream            VARCHAR(32) NOT NULL DEFAULT '',
  budget            INTEGER NOT NULL DEFAULT 15 CHECK (budget BETWEEN 1 AND 100),

  -- ── Resumability ──────────────────────────────────────────────────────
  -- The engine's gateway is (phase, gateway_index) plus a queue. Persisting them
  -- is what lets an interrupted test resume instead of restarting.
  phase             VARCHAR(16) NOT NULL DEFAULT 'gateway'
                    CHECK (phase IN ('gateway','cluster','converged')),
  gateway_index     INTEGER NOT NULL DEFAULT 0,
  cluster_queue     JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- The administered items and their responses, in order. This is the audit
  -- trail: an adaptive test's scores are only interpretable alongside WHICH
  -- items produced them, and it is also what makes item selection reproducible
  -- for review.
  answered_item_ids TEXT[] NOT NULL DEFAULT '{}',
  -- One entry per response: {item_id, option_index, primary_trait, option_text,
  -- scores}. Deliberately a JSONB array in append order, matching the engine's
  -- `session.responses` list exactly so persistence is a straight serialise.
  responses         JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- ── The 8-trait vector ───────────────────────────────────────────────
  -- TRAITS = risk, value, autonomy, ai_adapt, openness, diligence, social,
  -- security (psychometric_engine.py:40). θ is bounded to [-3, +3].
  traits            JSONB NOT NULL DEFAULT '{"risk":0,"value":0,"autonomy":0,"ai_adapt":0,"openness":0,"diligence":0,"social":0,"security":0}'::jsonb,
  trait_se          JSONB NOT NULL DEFAULT '{"risk":1.2,"value":1.2,"autonomy":1.2,"ai_adapt":1.2,"openness":1.2,"diligence":1.2,"social":1.2,"security":1.2}'::jsonb,
  items_completed   INTEGER NOT NULL DEFAULT 0 CHECK (items_completed >= 0 AND items_completed <= 40),
  archetype_posterior JSONB NOT NULL DEFAULT '{}'::jsonb,
  archetype_key     VARCHAR(64),
  -- The percentile vector the engine already computes for the radar display
  -- ((theta + 3) / 6 * 100). Stored so a report can be re-rendered without
  -- re-running the test.
  trait_percentiles JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Validity instrumentation. The engine flags a session when
  -- validity_flags >= 3 AND acquiescence > 85%, which is a response-style
  -- signal, not a score. Persisting it means a flagged session can be excluded
  -- from later analysis rather than silently mixed in.
  validity_flags    INTEGER NOT NULL DEFAULT 0,
  acquiescence_count INTEGER NOT NULL DEFAULT 0,
  potentially_invalid BOOLEAN NOT NULL DEFAULT FALSE,

  status            VARCHAR(16) NOT NULL DEFAULT 'in_progress'
                    CHECK (status IN ('in_progress','completed','abandoned')),
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A session id must actually look like the uuid4 the engine mints; an empty
  -- or 4-character handle would be enumerable.
  CONSTRAINT psychometric_sessions_id_shape
    CHECK (length(btrim(coalesce(session_id, ''))) >= 16)
);

COMMENT ON TABLE psychometric_sessions IS
  'Durable psychometric CAT sessions. Replaces the process-local dict in psychometric_engine.py:78 that made sessions die on restart and break under more than one worker — the root cause of the three divergent item-bank copies. answered_item_ids + responses make an interrupted test resumable and its adaptive item selection auditable.';
COMMENT ON COLUMN psychometric_sessions.session_id IS
  'Public opaque handle returned to the client. Generated by the engine as a v4 uuid, which is unguessable; the CHECK constraint rejects any handle under 16 characters so an enumerable id cannot be introduced by a later refactor. Separate from the internal `id` so the public handle can be re-shaped without touching references.';
COMMENT ON COLUMN psychometric_sessions.user_id IS
  'NULL for anonymous sessions, which is the common case: the test is free and public and /start takes no credentials. Backed by ON DELETE SET NULL so deleting an account orphans the session into anonymous rather than cascading away a student''s completed test — the row survives, its PII linkage does not.';
COMMENT ON COLUMN psychometric_sessions.status IS
  'in_progress sessions are resumable; abandoned marks one a user walked away from. Only completed sessions should feed any aggregate trait statistics.';

CREATE INDEX idx_psychometric_sessions_user ON psychometric_sessions(user_id, created_at DESC);
CREATE INDEX idx_psychometric_sessions_status ON psychometric_sessions(status);
CREATE INDEX idx_psychometric_sessions_completed ON psychometric_sessions(completed_at DESC)
  WHERE status = 'completed';

-- ── 5. Triggers ────────────────────────────────────────────────────────────
-- update_updated_at() is defined in db/schema.sql:436-442. It exists in the live
-- database, but this migration must not depend on a migration-ordered guess, so
-- it is re-created defensively. CREATE OR REPLACE makes the IF NOT EXISTS-style
-- no-op safe.

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER student_profiles_updated_at BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER saved_programs_updated_at BEFORE UPDATE ON saved_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER psychometric_sessions_updated_at BEFORE UPDATE ON psychometric_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 6. RLS ─────────────────────────────────────────────────────────────────
-- Every table here: RLS on, no anon SELECT, owner-scoped policies via the
-- app.user_id GUC, service_role bypass, and explicit REVOKEs so the anon key
-- that ships in the client bundle holds nothing at all on these four tables.

ALTER TABLE public.student_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_programs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psychometric_sessions   ENABLE ROW LEVEL SECURITY;

-- Owner policies. `authenticated` is included in the TO list so this remains
-- correct if the app is ever switched to Supabase Auth, but the GRANTs below
-- mean neither role can actually reach these tables directly today.
CREATE POLICY "Owner full access on student_profiles"
  ON public.student_profiles FOR ALL TO authenticated
  USING      (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
  WITH CHECK  (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid);

CREATE POLICY "Owner full access on saved_programs"
  ON public.saved_programs FOR ALL TO authenticated
  USING      (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
  WITH CHECK  (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid);

CREATE POLICY "Owner full access on applications"
  ON public.applications FOR ALL TO authenticated
  USING      (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
  WITH CHECK  (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid);

-- Signed-in psychometric sessions. Deliberately TWO policies rather than one
-- `user_id = <guc>` policy, because `user_id IS NULL` would be a hole: it is
-- true for every anonymous session in the table. Anonymous sessions are handled
-- by the separate token-scoped policy below and nothing else.
CREATE POLICY "Owner access on signed-in psychometric sessions"
  ON public.psychometric_sessions FOR ALL TO authenticated
  USING (
    user_id IS NOT NULL
    AND user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
  )
  WITH CHECK (
    user_id IS NOT NULL
    AND user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
  );

-- Anonymous sessions, token-scoped. This reuses the x-report-token idiom from
-- migration 0003 (the header read via current_setting('request.headers')), so
-- there is one established mechanism in this codebase rather than two.
--
-- It is deliberately NOT granted to `anon` for SELECT-on-anything. The caller
-- must present the exact handle for the row. Without the header, the expression
-- is NULL, NULL = session_id is NULL, and the row is invisible. This is the
-- direct opposite of the 0003 P0 (`USING (true)`), and it is the reason an
-- anonymous psychometric session — which contains a full 8-trait personality
-- vector — is not world-readable the way personal_intelligence was.
--
-- UPDATE for anonymous sessions is deliberately ABSENT — not merely
-- token-scoped. Two reasons, and the second is the important one:
--
--   1. RLS decides ROWS, never COLUMNS. Even a perfectly token-scoped UPDATE
--      would let the holder of one handle rewrite its own traits, percentiles,
--      archetype, validity_flags and status — i.e. forge a perfect result.
--      This is precisely the mistake migration 0004 documented and fixed by
--      granting UPDATE on the single `viewed_count` column rather than the
--      table.
--   2. There is no need for it. /api/v2/psychometric/respond already receives
--      every answer over FastAPI, and the backend writes this table as its own
--      owner. The browser never needs a direct write path, so it does not get
--      one.
--
-- The result: anon holds SELECT only, and only for a row whose session_id it
-- can present. That is a strictly narrower grant than the 0003 policies this
-- codebase previously had to roll back.
--
-- INSERT is likewise not granted to anon: session_id is minted by the backend,
-- so rows are created server-side and no client needs to create one.
--
-- The `user_id IS NULL` predicate in the SELECT policy is what stops an
-- anonymous caller from reaching a SIGNED-IN student's session by guessing, and
-- the `user_id IS NOT NULL` predicate in the owner policy is what stops an
-- anonymous row from being adopted. Neither condition is decorative.
CREATE POLICY "Token scoped read on anonymous psychometric sessions"
  ON public.psychometric_sessions
  FOR SELECT
  TO anon, authenticated
  USING (
    user_id IS NULL
    AND NULLIF(current_setting('request.headers', true), '') IS NOT NULL
    AND current_setting('request.headers', true)::jsonb ->> 'x-psychometric-token' = session_id
  );

-- service_role bypasses RLS as a superuser-ish role, but explicit policies are
-- asserted anyway so a changed role configuration is caught by a test rather
-- than discovered in production.
CREATE POLICY "Service role full access on student_profiles"
  ON public.student_profiles FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on saved_programs"
  ON public.saved_programs FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on applications"
  ON public.applications FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on psychometric_sessions"
  ON public.psychometric_sessions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── 7. Grants ──────────────────────────────────────────────────────────────
-- Grants and policies are two halves of one control, and here they are set
-- together rather than independently. Supabase's default ACL includes ALL on
-- every new table for `anon` and `authenticated`, so both are revoked
-- explicitly and then re-granted to exactly the reach each role should have.
-- Without this, RLS policies would be describing a door that the roles are
-- already standing outside of.
--
-- anon holds NOTHING on the three owner tables. Zero. Not a scoped read, not a
-- token read — the anon key ships in the client bundle, so "it is behind RLS"
-- and "it cannot reach the table at all" are very different guarantees and only
-- the second one survives a future dropped policy.
REVOKE ALL ON public.student_profiles      FROM anon;
REVOKE ALL ON public.saved_programs        FROM anon;
REVOKE ALL ON public.applications          FROM anon;

-- Forward-looking: if the app is ever moved to Supabase Auth, these grants make
-- the owner policies above actually load-bearing instead of dormant. Today the
-- backend connects as `postgres`, which bypasses RLS, so these grants gate
-- nothing right now — but they are correct, and if the connection role ever
-- changes these tables are already right.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_programs   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications     TO authenticated;

-- psychometric_sessions is the one table anon may read, and only through the
-- token-scoped policy above: the caller must present the exact session_id in
-- x-psychometric-token. The handle is a v4 uuid, so it is not enumerable, and
-- no policy grants anon a read that does not compare against it.
--
-- anon is deliberately NOT granted UPDATE. RLS decides ROWS, never COLUMNS, so
-- a table-level UPDATE grant plus a token-scoped row gate would let the holder
-- of one handle rewrite its own traits, percentiles, archetype and status — i.e.
-- fabricate a perfect result. That is precisely the mistake migration 0004
-- documented and fixed by granting UPDATE on the single `viewed_count` column
-- instead of the table. The same reasoning applies here, and the fix is simply
-- to not grant the privilege: the frontend already POSTs every answer to
-- /api/v2/psychometric/respond, so the backend performs all writes as the
-- table owner and anon never needs to write.
REVOKE ALL ON public.psychometric_sessions FROM anon;
GRANT SELECT ON public.psychometric_sessions TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.psychometric_sessions TO authenticated;

GRANT ALL ON public.student_profiles      TO service_role;
GRANT ALL ON public.saved_programs        TO service_role;
GRANT ALL ON public.applications          TO service_role;
GRANT ALL ON public.psychometric_sessions TO service_role;

-- ── 8. Post-conditions ─────────────────────────────────────────────────────
-- A bare `qual = true` on a student-owned table is the exact 0003 P0. This
-- asserts no such policy can exist on these four tables, so a future migration
-- that reintroduces one fails at apply time rather than shipping.

DO $$
DECLARE
  offenders text;
  unverified_token_scope integer;
BEGIN
  -- 1. No unscoped permissive policy may exist for anon / public. `true` on a
  --    student-owned table is the 0003 P0. service_role is excluded from this
  --    check on purpose: it legitimately holds USING (true) WITH CHECK (true) and
  --    is documented as such in migration 0003_rollback.sql.
  SELECT string_agg(format('%s :: %s', tablename, policyname), ', ')
    INTO offenders
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('student_profiles','saved_programs','applications','psychometric_sessions')
    AND roles && ARRAY['public','anon','authenticated']::name[]
    AND NOT (roles @> ARRAY['service_role']::name[])
    AND qual IN ('true', '( true )'::text);

  IF offenders IS NOT NULL THEN
    RAISE EXCEPTION
      'Unscoped (qual = true) policy on a student-owned table: %. Refusing to commit.', offenders;
  END IF;

  -- 2. anon must hold no write privilege on any of the four tables. Holding
  --    write is categorically worse than holding an unscoped read, and RLS
  --    cannot restrict columns — a table-level UPDATE grant would let a token
  --    holder rewrite its own trait vector and fabricate a perfect result.
  SELECT string_agg(format('%s (%s)', table_name, privilege_type), ', ')
    INTO offenders
  FROM information_schema.role_table_grants
  WHERE grantee = 'anon'
    AND table_schema = 'public'
    AND table_name IN ('student_profiles','saved_programs','applications','psychometric_sessions')
    AND privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN');

  IF offenders IS NOT NULL THEN
    RAISE EXCEPTION
      'anon must hold no write privileges on student-owned tables, found: %. Revoke them.', offenders;
  END IF;

  -- 3. anon must hold NO privileges whatsoever on the three owner tables.
  --    The lone exception is SELECT on psychometric_sessions, which is gated
  --    by the token-scoped policy; that grant is not a bypass of it.
  SELECT string_agg(format('%s (%s)', table_name, privilege_type), ', ')
    INTO offenders
  FROM information_schema.role_table_grants
  WHERE grantee = 'anon'
    AND table_schema = 'public'
    AND table_name IN ('student_profiles','saved_programs','applications')
    AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN');

  IF offenders IS NOT NULL THEN
    RAISE EXCEPTION
      'anon must hold no privileges on owner tables, found: %. Revoke them.', offenders;
  END IF;

  -- 4. Every table must actually have RLS enabled, and the anon-reachable
  --    table must have a policy that compares against a per-row secret rather
  --    than accepting the caller unconditionally.
  SELECT string_agg(format('%s', c.relname), ', ')
    INTO offenders
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname IN ('student_profiles','saved_programs','applications','psychometric_sessions')
    AND NOT c.relrowsecurity;

  IF offenders IS NOT NULL THEN
    RAISE EXCEPTION
      'Row Level Security is not enabled on: %. Refusing to commit.', offenders;
  END IF;

  SELECT count(*) INTO unverified_token_scope
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'psychometric_sessions'
    AND 'anon' = ANY(roles)
    AND qual LIKE '%x-psychometric-token%';

  IF unverified_token_scope < 1 THEN
    RAISE EXCEPTION
      'psychometric_sessions has no token-scoped anon policy. Anonymous sessions would be unreachable or, worse, world-readable. Refusing to commit.';
  END IF;
END $$;

COMMIT;
