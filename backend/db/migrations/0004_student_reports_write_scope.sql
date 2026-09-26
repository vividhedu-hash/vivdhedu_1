-- =============================================================================
-- Migration 0004 — Correct the anon write scope on student_reports
-- =============================================================================
-- Follow-up to 0003. Applying 0003 broke two things, both discovered by probing
-- the live API with the real anon key rather than by reading the catalogue:
--
--   1. The onboarding wizard could no longer save a report.
--      /api/analyze and /api/report/save POST with the anon key. That worked,
--      but fetchSupabaseRest always sends `Prefer: return=representation`, so
--      PostgREST issues a follow-up SELECT to return the inserted row. 0003
--      scoped SELECT to the matching token, and the insert request did not
--      carry that header — so the SELECT was denied and the whole insert
--      failed with 42501. Fixed in the frontend by passing reportToken.
--
--   2. The view counter silently stopped incrementing.
--      0003 granted no anon UPDATE, and /api/report/[token] bumps viewed_count
--      with the anon key. The PATCH matched zero rows and returned 200, so it
--      failed silently. Data was never at risk, but the metric was dead.
--
-- The subtlety that matters
-- -----------------------
-- The obvious fix for (2) — a token-scoped UPDATE policy — is NOT sufficient.
-- RLS decides which ROWS an UPDATE may touch; it cannot decide which COLUMNS.
-- A token holder would therefore be able to rewrite their own profile_data,
-- results_data, or expires_at. That is exactly as bad as the 0003 vulnerability
-- it was meant to fix, just scoped to one report instead of the whole table.
--
-- So the row gate is the token policy, and the column gate is a column-level
-- GRANT. Both are required: the policy alone permits rewriting the report body,
-- and the GRANT alone would permit touching any report in the table.
--
-- Verified against live data 2026-09-26:
--   PATCH profile_data with a valid token -> 42501, row unchanged
--   PATCH viewed_count with a valid token -> 200, increments
--   PATCH with no token                   -> 0 rows, no change
-- =============================================================================

-- ── 1. Column-level write scope ─────────────────────────────────────────────
-- RLS cannot restrict columns, so remove table-level UPDATE and re-grant it for
-- viewed_count only. service_role is untouched and still bypasses RLS.
REVOKE UPDATE ON public.student_reports FROM anon, authenticated;
GRANT UPDATE (viewed_count) ON public.student_reports TO anon, authenticated;

-- Supabase grants these by default on every table. No anon caller may ever
-- delete or wipe a report, and RLS alone is a weaker guarantee than simply not
-- holding the privilege. Verified: DELETE currently matches zero rows only
-- because no DELETE policy exists — that is one dropped policy away from being
-- a live data-loss bug.
REVOKE DELETE, TRUNCATE ON public.student_reports FROM anon, authenticated;

-- ── 2. Row-level gate for the counter ───────────────────────────────────────
DROP POLICY IF EXISTS "Token scoped view count bump on student_reports"
  ON public.student_reports;

CREATE POLICY "Token scoped view count bump on student_reports"
  ON public.student_reports
  FOR UPDATE
  TO anon, authenticated
  USING (
    NULLIF(current_setting('request.headers', true), '') IS NOT NULL
    AND current_setting('request.headers', true)::jsonb ->> 'x-report-token' = token
  )
  WITH CHECK (
    NULLIF(current_setting('request.headers', true), '') IS NOT NULL
    AND current_setting('request.headers', true)::jsonb ->> 'x-report-token' = token
  );

-- ── 3. Do not grant UPDATE on the other two tables at all ──────────────────
-- personal_intelligence and portfolio_profiles have no counter to bump, and
-- 0003 correctly left anon without UPDATE. Assert it so a future migration
-- cannot quietly re-open this.
DO $$
DECLARE
    offenders text;
BEGIN
    SELECT string_agg(format('%s (%s)', table_name, privilege_type), ', ')
      INTO offenders
    FROM information_schema.role_table_grants
    WHERE grantee IN ('anon', 'authenticated')
      AND table_schema = 'public'
      AND table_name IN ('personal_intelligence', 'portfolio_profiles')
      AND privilege_type IN ('UPDATE', 'DELETE', 'TRUNCATE');

    IF offenders IS NOT NULL THEN
        RAISE EXCEPTION
            'anon/authenticated must not hold write privileges on student-owned tables, found: %. Revoke them.',
            offenders;
    END IF;

    -- student_reports may hold UPDATE(viewed_count) and INSERT, nothing else.
    SELECT string_agg(format('%s (%s)', table_name, privilege_type), ', ')
      INTO offenders
    FROM information_schema.role_table_grants
    WHERE grantee IN ('anon', 'authenticated')
      AND table_schema = 'public'
      AND table_name = 'student_reports'
      AND privilege_type IN ('DELETE', 'TRUNCATE');

    IF offenders IS NOT NULL THEN
        RAISE EXCEPTION
            'anon must not be able to delete or truncate student_reports, found: %. Revoke them.',
            offenders;
    END IF;
END $$;
