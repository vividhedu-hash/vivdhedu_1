-- =============================================================================
-- Migration 0003 — Harden RLS on student-owned data
-- =============================================================================
-- Problem
-- -------
-- Three tables carried a SELECT policy literally named "… by token" whose
-- `qual` was `true` — i.e. NO row filter. Combined with the anon key shipping
-- in the client bundle, this granted unauthenticated, unfiltered, enumerable
-- read access to:
--
--   student_reports        (8 live rows: budget, finances, risk tolerance)
--   personal_intelligence  (Gemini output + citations)
--   portfolio_profiles     (essays, activities, research artifacts)
--
-- personal_intelligence and portfolio_profiles additionally had an anon
-- UPDATE policy with qual=true / with_check=true, meaning any anonymous
-- caller could OVERWRITE any student's record — data destruction, not just
-- disclosure.
--
-- Fix
-- ---
--  1. Revoke unconditional anon/authenticated SELECT on all three.
--  2. Grant anon SELECT on student_reports ONLY when the caller presents the
--     matching token in the `x-report-token` header. The Next.js report route
--     already knows the token, so it can pass it through.
--  3. Drop anon UPDATE on personal_intelligence and portfolio_profiles.
--     Writes move to the FastAPI backend (service_role bypasses RLS).
--  4. Keep anon INSERT on student_reports — the onboarding wizard posts
--     results from the browser with no session. Constrain the shape instead.
--  5. Make the two SECURITY DEFINER views invoker-scoped so RLS applies, and
--     lock the internal anomaly-review view to service_role.
--
-- Rollback
-- --------
--   DROP POLICY IF EXISTS "Report token scoped read on student_reports" ON student_reports;
--   ... (recreate the previous permissive policies as needed)
-- =============================================================================

-- ── 0. Preflight ────────────────────────────────────────────────────────────
-- The CHECK constraints below are validated against existing rows, not just new
-- ones. Verified against live data on 2026-09-26: 6 of 8 student_reports rows
-- satisfy the shape, and 2 rows are leftovers from an early debugging pass —
-- tokens `test-token` and `test-token-123`, one with profile_data = {"test":true}.
--
-- Left in place, those rows make ALTER TABLE ... ADD CONSTRAINT fail, and because
-- the file runs as a single transaction the ENTIRE migration rolls back —
-- including the policy drops that are the whole point of it. So they are removed
-- first, and anything unexpected is reported rather than silently discarded.
DO $$
DECLARE
    offenders integer;
    unexpected integer;
BEGIN
    -- A real report token is 32 chars of base64url (secrets.token_urlsafe(32)),
    -- so any token that is short AND test-prefixed is unambiguously a debug row.
    DELETE FROM public.student_reports
    WHERE length(btrim(coalesce(token, ''))) < 16
      AND (
        token IN ('test-token', 'test-token-123', 'test', 'demo', 'sample')
        OR token LIKE 'test%'
      );

    -- If anything still violates the shape, it is NOT safe to touch automatically.
    -- Fail loudly here, before any policy has been dropped, so the database is
    -- left exactly as it was.
    SELECT count(*) INTO offenders
    FROM public.student_reports
    WHERE NOT (
        length(btrim(coalesce(token, ''))) >= 16
        AND profile_data IS NOT NULL
        AND jsonb_typeof(profile_data) = 'object'
    );

    IF offenders > 0 THEN
        SELECT count(*) INTO unexpected FROM public.student_reports
        WHERE NOT (
            length(btrim(coalesce(token, ''))) >= 16
            AND profile_data IS NOT NULL
            AND jsonb_typeof(profile_data) = 'object'
        );
        RAISE EXCEPTION
            'student_reports still has % row(s) violating the insert-shape check. Refusing to continue — inspect and fix them manually, then re-run. Nothing has been changed.',
            unexpected;
    END IF;
END $$;

-- ── 1. student_reports ─────────────────────────────────────────────────────

-- Remove the unconditional read.
DROP POLICY IF EXISTS "Public access to student_reports by token" ON public.student_reports;

-- Token-scoped read: the caller must present the exact token in a header.
-- This keeps the existing "anyone with the link" share model intact while
-- removing the ability to enumerate or dump the table.
CREATE POLICY "Report token scoped read on student_reports"
  ON public.student_reports
  FOR SELECT
  TO anon, authenticated
  USING (
    NULLIF(current_setting('request.headers', true), '')
      IS NOT NULL
    AND current_setting('request.headers', true)::jsonb ->> 'x-report-token' = token
  );

-- Keep anon INSERT (onboarding wizard has no session) but constrain the payload:
-- a real report always carries a non-empty profile and a token.
ALTER TABLE public.student_reports DROP CONSTRAINT IF EXISTS student_reports_insert_shape;
ALTER TABLE public.student_reports
  ADD CONSTRAINT student_reports_insert_shape
  CHECK (
    length(btrim(coalesce(token, ''))) >= 16
    AND profile_data IS NOT NULL
    AND jsonb_typeof(profile_data) = 'object'
  );

-- Students must not be able to silently rewrite an existing report.
-- (No anon UPDATE policy exists, so this is already denied; this documents it.)

-- ── 2. personal_intelligence ───────────────────────────────────────────────

-- Drop BOTH the unconditional read and the world-writable update.
DROP POLICY IF EXISTS "Public access to personal_intelligence by token" ON public.personal_intelligence;
DROP POLICY IF EXISTS "Public update to personal_intelligence"         ON public.personal_intelligence;

-- Token-scoped read, same mechanism as student_reports.
CREATE POLICY "Token scoped read on personal_intelligence"
  ON public.personal_intelligence
  FOR SELECT
  TO anon, authenticated
  USING (
    NULLIF(current_setting('request.headers', true), '')
      IS NOT NULL
    AND current_setting('request.headers', true)::jsonb ->> 'x-report-token' = token
  );

-- INSERT stays for the wizard, shape-constrained.
ALTER TABLE public.personal_intelligence DROP CONSTRAINT IF EXISTS personal_intelligence_insert_shape;
ALTER TABLE public.personal_intelligence
  ADD CONSTRAINT personal_intelligence_insert_shape
  CHECK (
    length(btrim(coalesce(token, ''))) >= 16
    AND profile_data IS NOT NULL
    AND intelligence IS NOT NULL
  );

-- No anon UPDATE policy — writes go through the backend with service_role.

-- ── 3. portfolio_profiles ──────────────────────────────────────────────────

-- Drop the unconditional read and the world-writable update.
DROP POLICY IF EXISTS "Public access to portfolio_profiles by token" ON public.portfolio_profiles;
DROP POLICY IF EXISTS "Public update to portfolio_profiles"         ON public.portfolio_profiles;

-- Token-scoped read.
CREATE POLICY "Token scoped read on portfolio_profiles"
  ON public.portfolio_profiles
  FOR SELECT
  TO anon, authenticated
  USING (
    NULLIF(current_setting('request.headers', true), '')
      IS NOT NULL
    AND current_setting('request.headers', true)::jsonb ->> 'x-report-token' = student_token
  );

-- INSERT stays (portfolio builder is a client-side wizard), shape-constrained.
ALTER TABLE public.portfolio_profiles DROP CONSTRAINT IF EXISTS portfolio_profiles_insert_shape;
ALTER TABLE public.portfolio_profiles
  ADD CONSTRAINT portfolio_profiles_insert_shape
  CHECK (
    length(btrim(coalesce(student_token, ''))) >= 16
    AND length(btrim(coalesce(spike_domain, ''))) > 0
    AND length(btrim(coalesce(target_major, ''))) > 0
  );

-- No anon UPDATE policy — a student editing their own portfolio must go
-- through the backend, which can verify session ownership first.

-- ── 4. Views ───────────────────────────────────────────────────────────────

-- SECURITY DEFINER views run with the creator's privileges and bypass RLS on
-- the underlying tables. Make them invoker-scoped so RLS applies.
ALTER VIEW public.v_programs_full SET (security_invoker = true);
ALTER VIEW public.v_anomaly_queue SET (security_invoker = true);

-- v_programs_full is the public catalogue surface (colleges/explore) — anon
-- read stays allowed because every underlying table is public data.
-- v_anomaly_queue exposes the internal data-quality review pipeline
-- (prior_value, new_value, reviewed_by, review_notes) and must not be public.
REVOKE ALL ON public.v_anomaly_queue FROM anon, authenticated;
GRANT  SELECT ON public.v_anomaly_queue TO service_role;

-- ── 5. Defence in depth ────────────────────────────────────────────────────

-- Ensure anon cannot UPDATE/DELETE these tables even if a policy is added
-- later by mistake. service_role bypasses RLS entirely, so the backend is
-- unaffected.
REVOKE UPDATE, DELETE ON public.personal_intelligence FROM anon, authenticated;
REVOKE UPDATE, DELETE ON public.portfolio_profiles    FROM anon, authenticated;
