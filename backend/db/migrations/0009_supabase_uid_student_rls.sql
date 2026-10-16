-- =============================================================================
-- Migration 0009 — student RLS accepts Supabase auth.uid()
-- =============================================================================
-- FastAPI now verifies the browser's Supabase access JWT and upserts
-- public.users.id = auth.uid(). Owner policies in 0007 only compared
-- user_id to the app.user_id GUC (set by the backend after decoding its own
-- HS256 token). With a single identity, authenticated PostgREST callers and
-- the GUC path must agree.
--
-- Policies become:
--   user_id = auth.uid()
--   OR user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
--
-- The GUC remains because the API still connects as postgres (bypasses RLS)
-- and student routers still AND user_id = :id in SQL. This is additive.
-- =============================================================================

BEGIN;

DROP POLICY IF EXISTS "Owner full access on student_profiles" ON public.student_profiles;
CREATE POLICY "Owner full access on student_profiles"
  ON public.student_profiles FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
  )
  WITH CHECK (
    user_id = auth.uid()
    OR user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
  );

DROP POLICY IF EXISTS "Owner full access on saved_programs" ON public.saved_programs;
CREATE POLICY "Owner full access on saved_programs"
  ON public.saved_programs FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
  )
  WITH CHECK (
    user_id = auth.uid()
    OR user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
  );

DROP POLICY IF EXISTS "Owner full access on applications" ON public.applications;
CREATE POLICY "Owner full access on applications"
  ON public.applications FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
  )
  WITH CHECK (
    user_id = auth.uid()
    OR user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
  );

DROP POLICY IF EXISTS "Owner access on signed-in psychometric sessions" ON public.psychometric_sessions;
CREATE POLICY "Owner access on signed-in psychometric sessions"
  ON public.psychometric_sessions FOR ALL TO authenticated
  USING (
    user_id IS NOT NULL
    AND (
      user_id = auth.uid()
      OR user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    )
  )
  WITH CHECK (
    user_id IS NOT NULL
    AND (
      user_id = auth.uid()
      OR user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    )
  );

COMMIT;
