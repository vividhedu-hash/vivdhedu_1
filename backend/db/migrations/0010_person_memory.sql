-- =============================================================================
-- Migration 0010 — person_memory
-- =============================================================================
-- One JSONB snapshot per signed-in student: affinities, facts, episodes.
-- The algorithm that writes this shape lives in services/person_memory.py.
-- Identity and RLS follow migration 0007: app.user_id GUC, no anon access.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS person_memory (
  user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  snapshot    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE person_memory IS
  'Durable Instagram-style interest graph for one student. Snapshot is owned by services/person_memory.py. Not world-readable.';

CREATE INDEX IF NOT EXISTS idx_person_memory_updated ON person_memory(updated_at DESC);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS person_memory_updated_at ON person_memory;
CREATE TRIGGER person_memory_updated_at BEFORE UPDATE ON person_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.person_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner full access on person_memory"
  ON public.person_memory FOR ALL TO authenticated
  USING      (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
  WITH CHECK  (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid);

CREATE POLICY "Service role full access on person_memory"
  ON public.person_memory FOR ALL TO service_role
  USING (true) WITH CHECK (true);

REVOKE ALL ON public.person_memory FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.person_memory TO authenticated;
GRANT ALL ON public.person_memory TO service_role;

DO $$
DECLARE
  offenders text;
BEGIN
  SELECT string_agg(format('%s :: %s', tablename, policyname), ', ')
    INTO offenders
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'person_memory'
    AND roles && ARRAY['public','anon','authenticated']::name[]
    AND NOT (roles @> ARRAY['service_role']::name[])
    AND qual IN ('true', '( true )'::text);

  IF offenders IS NOT NULL THEN
    RAISE EXCEPTION
      'Unscoped (qual = true) policy on person_memory: %. Refusing to commit.', offenders;
  END IF;
END $$;

COMMIT;
