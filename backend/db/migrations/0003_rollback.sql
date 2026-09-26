-- =============================================================================
-- Rollback for migration 0003 — restores the pre-migration state
-- =============================================================================
-- Captured from live production on 2026-09-26, immediately BEFORE 0003 was
-- applied. Use only if the token-scoped policies break report delivery.
--
-- WARNING: this re-opens the vulnerabilities that 0003 closed. anon can once
-- again read and overwrite every row in these three tables. Prefer fixing the
-- x-report-token header path over running this.
-- =============================================================================

-- ── student_reports ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Report token scoped read on student_reports" ON public.student_reports;
ALTER TABLE public.student_reports DROP CONSTRAINT IF EXISTS student_reports_insert_shape;
CREATE POLICY "Public access to student_reports by token"
  ON public.student_reports FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "Public insert to student_reports"
  ON public.student_reports FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- ── personal_intelligence ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Token scoped read on personal_intelligence" ON public.personal_intelligence;
ALTER TABLE public.personal_intelligence DROP CONSTRAINT IF EXISTS personal_intelligence_insert_shape;
CREATE POLICY "Public access to personal_intelligence by token"
  ON public.personal_intelligence FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "Public insert to personal_intelligence"
  ON public.personal_intelligence FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Public update to personal_intelligence"
  ON public.personal_intelligence FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);
GRANT UPDATE, DELETE ON public.personal_intelligence TO anon, authenticated;

-- ── portfolio_profiles ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Token scoped read on portfolio_profiles" ON public.portfolio_profiles;
ALTER TABLE public.portfolio_profiles DROP CONSTRAINT IF EXISTS portfolio_profiles_insert_shape;
CREATE POLICY "Public access to portfolio_profiles by token"
  ON public.portfolio_profiles FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "Public insert to portfolio_profiles"
  ON public.portfolio_profiles FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Public update to portfolio_profiles"
  ON public.portfolio_profiles FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);
GRANT UPDATE, DELETE ON public.portfolio_profiles TO anon, authenticated;

-- ── Views ──────────────────────────────────────────────────────────────────
-- Captured ACL was:
--   v_programs_full: {postgres=arwdDxtm/postgres,anon=r/postgres,
--                     authenticated=r/postgres,service_role=r/postgres}
--   v_anomaly_queue: identical
ALTER VIEW public.v_programs_full RESET (security_invoker);
ALTER VIEW public.v_anomaly_queue RESET (security_invoker);
GRANT SELECT ON public.v_anomaly_queue TO anon, authenticated;

-- ── service_role policies (unchanged by 0003, re-asserted for completeness)
CREATE POLICY "Service role full access on student_reports"
  ON public.student_reports FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on personal_intelligence"
  ON public.personal_intelligence FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on portfolio_profiles"
  ON public.portfolio_profiles FOR ALL TO service_role
  USING (true) WITH CHECK (true);
