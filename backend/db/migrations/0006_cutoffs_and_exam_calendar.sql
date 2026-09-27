-- =============================================================================
-- Migration 0006 — cutoffs + exam_calendar
-- =============================================================================
-- Why
-- ---
-- `ml/admissions_engine.py` carries the entire admissions dataset as two frozen
-- Python literals:
--
--   COLLEGE_BENCHMARK_RANKS  — 43 rows of historical closing ranks
--   EXAM_RANK_VARIABILITY    — a hardcoded sigma per exam
--
-- Closing ranks are the most perishable data this product touches. A rank without
-- a year is meaningless; a rank without a source is unfalsifiable. For a product
-- whose whole positioning is "evidence over brochure", freezing the evidence in a
-- .py file is the single most load-bearing inconsistency in the codebase.
--
-- This migration moves both into versioned, provenance-carrying tables.
--
-- ROW COUNT — the plan says "~60 rows". The literal actually contains 43.
-- Verified by AST parse of the literal, cross-checked against six independent
-- key occurrences ("college", "degree", "exam", "tier", "base_closing_rank",
-- "roi_score") all of which return exactly 43. The seed below is generated
-- mechanically from that AST parse, not retyped, so it is exact.
--
-- Grain
-- ----
-- The brief proposed (exam, program, vintage_year) — NOT (exam, college) — and
-- was right to exclude exam+college alone, since a college runs many programs
-- and ranks differ by branch. Measured against the real data that grain turned
-- out to be too COARSE, not too fine: 'NEET' + 'MBBS' + 2024 matches four
-- different colleges. The shipped constraint is therefore
-- (exam, college_name, program_name, vintage_year) — college AND program, since
-- the closing rank is a property of the pair. Verified to admit all 43 rows.
--
-- Append-only by vintage
-- ---------------------
-- There is no `is_current` flag-flip here, deliberately. The schema.sql idiom
-- (`is_current` + partial unique index) is for scalar scrapes where you want one
-- live value. Cutoffs are a TIME SERIES: year-over-year movement is the signal.
-- Overwriting 2024's cutoff with 2025's destroys the only thing worth storing.
-- New years append rows; history is never rewritten.
--
-- RLS posture
-- ----------
-- cutoffs + exam_calendar are public catalogue data — the same class as
-- `colleges`/`degrees`/`programs`, all of which are anon-readable. So: SELECT to
-- anon+authenticated, and NO INSERT/UPDATE/DELETE policy for either role, plus
-- explicit REVOKEs. Seeds are maintenance, run by service_role (which bypasses
-- RLS), not by the anon key that ships in the client bundle.
--
-- Rollback
-- -------
--   DROP TABLE IF EXISTS public.cutoffs;
--   DROP TABLE IF EXISTS public.exam_calendar;
-- =============================================================================

BEGIN;

-- ── 1. cutoffs ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cutoffs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam              VARCHAR(64) NOT NULL,
  -- DELIBERATELY NOT A FOREIGN KEY to colleges(id).
  --
  -- The benchmark literal names colleges in a different vocabulary from the
  -- seeded `colleges` table, and an FK would reject the seed outright:
  --   "BITS Pilani (Pilani)"  vs colleges.short_name "BITS Pilani"
  --   "AIIMS New Delhi"       vs colleges.short_name "AIIMS Delhi"
  --   "NLSIU Bengaluru"      vs colleges.short_name "NLSIU Bangalore"
  --   "IIIT Hyderabad", "IIIT Allahabad", "RV College of Engineering",
  --   "Kasturba Medical College (Manipal)" and ~15 more have no `colleges` row
  -- at all — seed_db.py only creates 16 colleges.
  --
  -- Forcing a match would mean either (a) renaming the real college catalogue
  -- to fit a data literal, or (b) dropping real closing ranks to satisfy a
  -- referential constraint. Losing verified ranks is far worse than a name that
  -- has not been normalised yet, so the name is stored as text and a later
  -- migration can add `college_id` once a reconciliation pass has mapped it.
  -- JoAA is the natural source for that mapping.
  college_name      VARCHAR(128) NOT NULL,
  program_name      VARCHAR(128) NOT NULL,
  field             degree_field NOT NULL,
  tier              college_tier NOT NULL,
  state             VARCHAR(64) NOT NULL,
  closing_rank      INTEGER NOT NULL CHECK (closing_rank > 0),
  -- Cost and ROI travelled with each rank in the Python literal. They are
  -- per-row facts about that same historical offer, not properties of the
  -- program today, so they are versioned on the same grain.
  total_cost_inr    BIGINT,
  roi_score         DECIMAL(5,2) CHECK (roi_score BETWEEN 0 AND 100),
  -- Provenance. A rank with neither of these is not a fact, it is an assertion.
  -- NULL is permitted (the original literal carried no source) but the comment
  -- below marks those rows explicitly as unverified rather than letting them
  -- blend into rows someone actually checked.
  vintage_year      INTEGER NOT NULL CHECK (vintage_year BETWEEN 2000 AND 2100),
  source_url        VARCHAR(1024),
  source_label      VARCHAR(128),
  is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One closing rank per COLLEGE-PROGRAM pair, per exam, per year.
  --
  -- The brief specified (exam, program, vintage_year) and was right to exclude
  -- exam+college alone, since a college runs many programmes. But measured
  -- against the actual 43 rows, that grain is TOO COARSE and the seed is
  -- REJECTED by it — 7 collisions, e.g. ('NEET','MBBS',2024) matches AIIMS
  -- (rank 55), CMC (210), Kasturba (4800) and Grant (2150). Programme names
  -- like "B.Tech Computer Science" and "MBBS" are not unique across colleges.
  --
  -- So the real grain is (exam, college_name, program_name, vintage_year):
  -- college AND programme, because the rank is a property of the pair. Verified
  -- to admit all 43 rows with no collisions.
  CONSTRAINT cutoffs_grain_unique UNIQUE (exam, college_name, program_name, vintage_year)
);

COMMENT ON TABLE cutoffs IS
  'Historical closing ranks by exam/program/vintage year. Append-only: a new year adds rows, it never overwrites. A rank without vintage_year is meaningless and a rank without source_url is unfalsifiable, so both are carried per row.';
COMMENT ON COLUMN cutoffs.closing_rank IS
  'General-category closing rank as published for vintage_year. Category and home-state relaxation are applied at query time by admissions_engine.CATEGORY_MULTIPLIERS (SC 2.85, ST 4.60, PwD 5.20) and the 1.35x home-state quota — never baked into this column, so a single stored row serves every category.';
COMMENT ON COLUMN cutoffs.vintage_year IS
  'The admission cycle the rank belongs to. Part of the primary grain. Cutoffs move sharply year to year; treating them as timeless is how a 4-tier matrix starts advising students wrongly.';
COMMENT ON COLUMN cutoffs.source_url IS
  'Publisher of the cutoff (JoAA counselling cutoff list, college prospectus, official results portal). NULL on all seeded rows migrated from the Python literal, which carried no provenance — those rows are is_verified = FALSE and must be sourced before being presented to a student as evidence.';
COMMENT ON COLUMN cutoffs.is_verified IS
  'FALSE means "imported, not yet sourced". The /admissions surface must not present an unverified row as if it were a published cutoff. This is the flag that keeps the product honest during the migration window.';

-- Query patterns the engine actually issues: "which programs close at rank R for
-- this exam", "what does this look like in my state", "show me tier-1 options".
--
-- NOTE: there is deliberately no standalone (exam) index. The composite below
-- leads with exam, and the UNIQUE constraint also leads with exam, so either one
-- already serves a bare `WHERE exam = ?` lookup. A third index on the same
-- leading column would be pure write amplification on a table that gets an
-- insert per exam per year.
CREATE INDEX idx_cutoffs_exam_rank ON cutoffs(exam, vintage_year, closing_rank);
CREATE INDEX idx_cutoffs_state ON cutoffs(state);
CREATE INDEX idx_cutoffs_tier ON cutoffs(tier);
-- Trend analysis reads a single program's whole history. The UNIQUE constraint
-- indexes (exam, college_name, program_name, vintage_year) with exam leading,
-- which does NOT serve a program-only lookup, so this one earns its place.
CREATE INDEX idx_cutoffs_program_history ON cutoffs(program_name, vintage_year DESC);
-- The sourcing backlog: which years still need verification. The UNIQUE index
-- leads with exam, so it cannot serve a vintage_year-only scan.
CREATE INDEX idx_cutoffs_unverified ON cutoffs(vintage_year) WHERE is_verified = FALSE;

CREATE TRIGGER cutoffs_updated_at BEFORE UPDATE ON cutoffs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 2. Seed the 43 migrated benchmark rows ─────────────────────────────────
-- Ported verbatim from COLLEGE_BENCHMARK_RANKS. vintage_year is set to 2024:
-- that is the year the surrounding seed data already uses (cost_data.source_year
-- is 2024 across all 54 rows, per migration 0005), so the cutoffs sit in the
-- same vintage as the tuition figures they are compared against. This is an
-- assumption inherited from the codebase, NOT a verified fact, which is exactly
-- why is_verified = FALSE and source_url is NULL on every one of these rows.

INSERT INTO cutoffs (
  exam, college_name, program_name, field, tier, state,
  closing_rank, total_cost_inr, roi_score, vintage_year, is_verified
)
VALUES
  ('JEE Advanced', 'IIT Bombay', 'B.Tech Computer Science', 'engineering-cs', '1', 'Maharashtra', 67, 1200000, 94.5, 2024, FALSE),
  ('JEE Advanced', 'IIT Delhi', 'B.Tech Computer Science', 'engineering-cs', '1', 'Delhi', 115, 1200000, 93.8, 2024, FALSE),
  ('JEE Advanced', 'IIT Madras', 'B.Tech Electrical Engineering', 'engineering-cs', '1', 'Tamil Nadu', 480, 1200000, 91.2, 2024, FALSE),
  ('JEE Advanced', 'IIT Kanpur', 'B.Tech Computer Science', 'engineering-cs', '1', 'Uttar Pradesh', 235, 1200000, 93.0, 2024, FALSE),
  ('JEE Advanced', 'IIT Kharagpur', 'B.Tech Mechanical Engineering', 'engineering-non-cs', '1', 'West Bengal', 2400, 1150000, 86.4, 2024, FALSE),
  ('JEE Advanced', 'IIT Roorkee', 'B.Tech Data Science & AI', 'engineering-cs', '1', 'Uttarakhand', 720, 1200000, 90.5, 2024, FALSE),
  ('JEE Advanced', 'IIT Guwahati', 'B.Tech Computer Science', 'engineering-cs', '1', 'Assam', 610, 1180000, 89.8, 2024, FALSE),
  ('JEE Advanced', 'IIT Hyderabad', 'B.Tech Artificial Intelligence', 'engineering-cs', '1', 'Telangana', 820, 1200000, 91.5, 2024, FALSE),
  ('BITSAT', 'BITS Pilani (Pilani)', 'B.E. Computer Science', 'engineering-cs', '1', 'Rajasthan', 330, 2600000, 89.0, 2024, FALSE),
  ('BITSAT', 'BITS Pilani (Goa)', 'B.E. Electronics & Instrumentation', 'engineering-cs', '1', 'Goa', 245, 2500000, 84.5, 2024, FALSE),
  ('BITSAT', 'BITS Pilani (Hyderabad)', 'B.E. Computer Science', 'engineering-cs', '1', 'Telangana', 285, 2550000, 87.0, 2024, FALSE),
  ('JEE Main', 'NIT Trichy', 'B.Tech Computer Science', 'engineering-cs', '1', 'Tamil Nadu', 1500, 780000, 91.0, 2024, FALSE),
  ('JEE Main', 'NIT Surathkal', 'B.Tech Information Technology', 'engineering-cs', '1', 'Karnataka', 2600, 780000, 89.5, 2024, FALSE),
  ('JEE Main', 'NIT Warangal', 'B.Tech Electronics & Comm', 'engineering-cs', '1', 'Telangana', 4800, 780000, 87.2, 2024, FALSE),
  ('JEE Main', 'NIT Rourkela', 'B.Tech Computer Science', 'engineering-cs', '1', 'Odisha', 3800, 760000, 88.0, 2024, FALSE),
  ('JEE Main', 'NIT Calicut', 'B.Tech Computer Science', 'engineering-cs', '1', 'Kerala', 4500, 760000, 87.5, 2024, FALSE),
  ('JEE Main', 'IIIT Hyderabad', 'B.Tech Computer Science', 'engineering-cs', '1', 'Telangana', 950, 1800000, 93.0, 2024, FALSE),
  ('JEE Main', 'IIIT Bangalore', 'Integrated M.Tech CS', 'engineering-cs', '1', 'Karnataka', 6200, 2200000, 88.2, 2024, FALSE),
  ('JEE Main', 'IIIT Allahabad', 'B.Tech Information Technology', 'engineering-cs', '1', 'Uttar Pradesh', 5200, 920000, 89.0, 2024, FALSE),
  ('WBJEE', 'Jadavpur University', 'B.E. Computer Science', 'engineering-cs', '1', 'West Bengal', 85, 24000, 96.2, 2024, FALSE),
  ('MHT-CET', 'COEP Technological University', 'B.Tech Computer Engineering', 'engineering-cs', '2', 'Maharashtra', 120, 420000, 88.5, 2024, FALSE),
  ('MHT-CET', 'VJTI Mumbai', 'B.Tech Information Technology', 'engineering-cs', '2', 'Maharashtra', 180, 380000, 87.8, 2024, FALSE),
  ('JEE Main', 'DTU Delhi', 'B.Tech Computer Science', 'engineering-cs', '1', 'Delhi', 3800, 950000, 89.4, 2024, FALSE),
  ('JEE Main', 'NSUT Delhi', 'B.Tech Artificial Intelligence', 'engineering-cs', '1', 'Delhi', 4900, 920000, 88.0, 2024, FALSE),
  ('TNEA', 'College of Engineering Guindy (Anna Univ)', 'B.E. Computer Science', 'engineering-cs', '1', 'Tamil Nadu', 150, 180000, 92.4, 2024, FALSE),
  ('KCET', 'RV College of Engineering', 'B.E. Computer Science', 'engineering-cs', '2', 'Karnataka', 350, 1100000, 86.8, 2024, FALSE),
  ('KCET', 'BMS College of Engineering', 'B.E. Information Science', 'engineering-cs', '2', 'Karnataka', 820, 1050000, 84.5, 2024, FALSE),
  ('KCET', 'Ramaiah Institute of Technology', 'B.E. Computer Science', 'engineering-cs', '2', 'Karnataka', 1100, 1050000, 83.2, 2024, FALSE),
  ('JEE Main', 'Thapar University', 'B.Tech Computer Science', 'engineering-cs', '2', 'Punjab', 24000, 2100000, 76.5, 2024, FALSE),
  ('MET', 'Manipal Institute of Technology', 'B.Tech Computer Science', 'engineering-cs', '2', 'Karnataka', 1400, 2200000, 75.8, 2024, FALSE),
  ('VITEEE', 'VIT Vellore', 'B.Tech Computer Science', 'engineering-cs', '2', 'Tamil Nadu', 7500, 1900000, 74.2, 2024, FALSE),
  ('JEE Main', 'DA-IICT Gandhinagar', 'B.Tech ICT', 'engineering-cs', '2', 'Gujarat', 15500, 1450000, 84.0, 2024, FALSE),
  ('NEET', 'AIIMS New Delhi', 'MBBS', 'medicine', '1', 'Delhi', 55, 10000, 98.5, 2024, FALSE),
  ('NEET', 'CMC Vellore', 'MBBS', 'medicine', '1', 'Tamil Nadu', 210, 220000, 95.0, 2024, FALSE),
  ('NEET', 'Kasturba Medical College (Manipal)', 'MBBS', 'medicine', '1', 'Karnataka', 4800, 7200000, 78.5, 2024, FALSE),
  ('NEET', 'Grant Medical College Mumbai', 'MBBS', 'medicine', '1', 'Maharashtra', 2150, 650000, 91.2, 2024, FALSE),
  ('IPMAT', 'IIM Indore (IPM)', 'Integrated BBA+MBA', 'management', '1', 'Madhya Pradesh', 85, 3500000, 88.5, 2024, FALSE),
  ('CUET', 'SRCC Delhi', 'B.Com (Hons)', 'commerce', '1', 'Delhi', 120, 95000, 95.5, 2024, FALSE),
  ('CUET', 'St. Xavier''s College Mumbai', 'Bachelor of Management Studies', 'management', '1', 'Maharashtra', 140, 180000, 91.0, 2024, FALSE),
  ('CUET', 'Shaheed Sukhdev College of Business Studies', 'BBA (FIA)', 'management', '1', 'Delhi', 95, 110000, 94.2, 2024, FALSE),
  ('CLAT', 'NLSIU Bengaluru', 'B.A. LL.B. (Hons)', 'law', '1', 'Karnataka', 98, 1600000, 92.5, 2024, FALSE),
  ('CLAT', 'NALSAR Hyderabad', 'B.A. LL.B. (Hons)', 'law', '1', 'Telangana', 175, 1550000, 90.8, 2024, FALSE),
  ('CLAT', 'WBNUJS Kolkata', 'B.A. LL.B. (Hons)', 'law', '1', 'West Bengal', 265, 1500000, 88.4, 2024, FALSE);

-- ── 3. exam_rank_variability ───────────────────────────────────────────────
-- Ported from `EXAM_RANK_VARIABILITY` (admissions_engine.py:32). Sigma is the
-- denominator of the Z-score in Equation 9.1: an uncalibrated sigma silently
-- compresses or inflates every admission probability the product publishes, so
-- it belongs in the database where it can be re-estimated from real rank
-- outcomes, not in a dict nobody can update.

CREATE TABLE IF NOT EXISTS exam_rank_variability (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam              VARCHAR(64) NOT NULL,
  rank_sigma        DOUBLE PRECISION NOT NULL CHECK (rank_sigma > 0),
  -- The 'Default' key in the Python dict is a fallback, not an exam. It is
  -- seeded as a real row with is_default = TRUE, and the partial unique index
  -- below guarantees at most one such row can ever exist.
  is_default        BOOLEAN NOT NULL DEFAULT FALSE,
  sample_size       INTEGER,
  source_url        VARCHAR(1024),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT exam_rank_variability_exam_unique UNIQUE (exam)
);

-- At most one fallback row. A unique index on the bare boolean, restricted to
-- is_default = TRUE, is how you express "exactly one Default" in Postgres.
CREATE UNIQUE INDEX idx_exam_rank_var_single_default
  ON exam_rank_variability (is_default) WHERE is_default;

COMMENT ON TABLE exam_rank_variability IS
  'Empirical sigma of rank movement around a cutoff, per exam. Feeds the Z-score denominator in admissions_engine.calculate_admission_probability. A wrong sigma does not error — it quietly changes every admission probability the product shows a student.';

INSERT INTO exam_rank_variability (exam, rank_sigma, is_default) VALUES
  ('JEE Main',    2200.0, FALSE),
  ('JEE Advanced', 650.0, FALSE),
  ('NEET',        3500.0, FALSE),
  ('CUET',        1800.0, FALSE),
  ('CAT',          850.0, FALSE),
  ('BITSAT',       400.0, FALSE),
  ('MHT-CET',     2800.0, FALSE),
  ('GATE',         750.0, FALSE),
  ('Default',     1500.0, TRUE);

-- ── 4. exam_calendar ───────────────────────────────────────────────────────
-- Exam dates, registration deadlines and counselling windows. The Indian exam
-- landscape is a state-by-state patchwork: a single national calendar is not
-- just incomplete, it is wrong for WBJEE, KCET, COMEDK, TNEA and MHT-CET, all
-- of which gate on domicile and only accept candidates from their own state.

CREATE TABLE IF NOT EXISTS exam_calendar (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam                  VARCHAR(64) NOT NULL,
  year_number           INTEGER NOT NULL CHECK (year_number BETWEEN 2000 AND 2100),
  authority             VARCHAR(128),
  level                 VARCHAR(32),   -- 'national' | 'state'
  -- Registration/counselling dates are announcements, and boards revise them.
  -- They are kept nullable rather than defaulted to a guess: a fabricated date
  -- that reads as official is worse than an admitted gap.
  registration_opens_on DATE,
  registration_closes_on DATE,
  exam_date             DATE,
  result_date           DATE,
  counselling_start     DATE,
  counselling_end       DATE,
  -- States that gate admission on domicile. An out-of-state candidate reading
  -- a WBJEE or KCET date is a wasted cycle, so this is first-class data.
  state_scope           VARCHAR(64) NOT NULL DEFAULT 'All India',
  applies_to_categories VARCHAR(64) NOT NULL DEFAULT 'all',
  source_url            VARCHAR(1024) NOT NULL,
  is_verified           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT exam_calendar_grain_unique UNIQUE (exam, year_number, state_scope)
);

COMMENT ON TABLE exam_calendar IS
  'Registration deadlines, exam dates and counselling windows per exam per year. THIS TABLE IS INTENTIONALLY EMPTY — see the seed note below. Storing historical rows is what makes year-over-year trend analysis possible: a student asking "did this deadline move?" is asking a question about a series, and a series cannot be reconstructed from a single current row.';
COMMENT ON COLUMN exam_calendar.state_scope IS
  'Domicile gate. "All India" for JEE/NEET/CAT/GATE; a specific state for WBJEE, KCET, COMEDK, TNEA and MHT-CET. Part of the unique key because those exams run separate calendars per state.';
COMMENT ON COLUMN exam_calendar.source_url IS
  'NOT NULL. Every exam date must be traceable to the conducting body (NTA, JoAA, respective state board). An untraceable deadline cannot be published to a student, so the database refuses it rather than storing a guess.';

-- Indexes mirror the three questions a student actually asks: "when is my
-- exam", "how soon is my deadline", "how did the date move this year".
-- No standalone (state_scope) index: the UNIQUE constraint leads with exam, so
-- it cannot serve a state-only lookup, but exam_calendar is small enough that
-- a sequential scan is cheaper than another write-amplified index. Add it only
-- if the table grows past a few thousand rows.
CREATE INDEX idx_exam_calendar_exam_year ON exam_calendar(exam, year_number DESC);
CREATE INDEX idx_exam_calendar_upcoming ON exam_calendar(exam_date) WHERE exam_date IS NOT NULL;
CREATE INDEX idx_exam_calendar_deadline ON exam_calendar(registration_closes_on) WHERE registration_closes_on IS NOT NULL;

CREATE TRIGGER exam_calendar_updated_at BEFORE UPDATE ON exam_calendar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 5. RLS ─────────────────────────────────────────────────────────────────
-- Public catalogue. Readable by anon like colleges/degrees/programs; writable
-- by nobody at the client privilege level. Seeds above ran as the migration
-- owner (bypasses RLS); anon gets no INSERT/UPDATE/DELETE policy at all, and
-- the REVOKEs below mean a future policy added by mistake still cannot write.

ALTER TABLE public.cutoffs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_calendar       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_rank_variability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read on cutoffs"
  ON public.cutoffs
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read on exam_calendar"
  ON public.exam_calendar
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read on exam_rank_variability"
  ON public.exam_rank_variability
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- `USING (true)` is correct and unavoidable for catalogue tables: the entire
-- table is public by design, exactly as `colleges` and `programs` are. The
-- difference from the P0 bug in 0003 is that here `true` grants READ of
-- non-sensitive rows, whereas there it granted READ of a student's budget,
-- finances and risk tolerance. No write policy exists for either role.

CREATE POLICY "Service role full access on cutoffs"
  ON public.cutoffs FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on exam_calendar"
  ON public.exam_calendar FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on exam_rank_variability"
  ON public.exam_rank_variability FOR ALL TO service_role
  USING (true) WITH CHECK (true);

GRANT SELECT ON public.cutoffs              TO anon, authenticated;
GRANT SELECT ON public.exam_calendar        TO anon, authenticated;
GRANT SELECT ON public.exam_rank_variability TO anon, authenticated;
GRANT ALL    ON public.cutoffs              TO service_role;
GRANT ALL    ON public.exam_calendar        TO service_role;
GRANT ALL    ON public.exam_rank_variability TO service_role;

-- Defence in depth: hold no write privilege at all at the client role level.
-- RLS alone is one dropped policy away from being a data-integrity bug.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.cutoffs              FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.exam_calendar        FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.exam_rank_variability FROM anon, authenticated;

-- ── 6. Post-conditions ─────────────────────────────────────────────────────
-- Assert the seed landed and the write posture is correct, so a partial apply
-- fails loudly here rather than shipping a catalogue with no evidence in it.

DO $$
DECLARE
  seeded integer;
  dupes integer;
  verified_count integer;
  calendar_rows integer;
  offenders text;
BEGIN
  SELECT count(*) INTO seeded FROM public.cutoffs WHERE vintage_year = 2024;
  IF seeded <> 43 THEN
    RAISE EXCEPTION
      'Expected 43 seeded cutoff rows for vintage 2024, found %. Refusing to commit — the move out of admissions_engine.py would lose data.', seeded;
  END IF;

  -- The seed is a literal transcription, so a typo producing a duplicate grain
  -- key would be rejected by the UNIQUE constraint and take the whole
  -- transaction down with it. Assert it independently so the error names the
  -- real problem instead of surfacing as a bare constraint violation.
  SELECT count(*) INTO dupes FROM (
    SELECT 1 FROM public.cutoffs
    GROUP BY exam, college_name, program_name, vintage_year
    HAVING count(*) > 1
  ) collisions;
  IF dupes > 0 THEN
    RAISE EXCEPTION
      '% duplicate (exam, college, program, year) cutoff group(s) seeded. Refusing to commit.', dupes;
  END IF;

  -- Nothing migrated may silently present as a sourced, published cutoff.
  SELECT count(*) INTO verified_count FROM public.cutoffs WHERE is_verified;
  IF verified_count <> 0 THEN
    RAISE EXCEPTION
      '% cutoff row(s) are flagged is_verified. Every row migrated from the Python literal must be FALSE — it carried no provenance.', verified_count;
  END IF;

  -- exam_calendar ships EMPTY on purpose (see its table comment). A fabricated
  -- official-looking date is worse than an admitted gap.
  SELECT count(*) INTO calendar_rows FROM public.exam_calendar;
  IF calendar_rows <> 0 THEN
    RAISE EXCEPTION
      'exam_calendar has % row(s). It ships empty by design: exam dates must be sourced from the conducting body, not asserted.', calendar_rows;
  END IF;

  SELECT string_agg(format('%s (%s)', table_name, privilege_type), ', ')
    INTO offenders
  FROM information_schema.role_table_grants
  WHERE grantee IN ('anon', 'authenticated')
    AND table_schema = 'public'
    AND table_name IN ('cutoffs', 'exam_calendar', 'exam_rank_variability')
    AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE');

  IF offenders IS NOT NULL THEN
    RAISE EXCEPTION
      'anon/authenticated must not hold write privileges on public catalogue tables, found: %. Revoke them.', offenders;
  END IF;
END $$;

COMMIT;
