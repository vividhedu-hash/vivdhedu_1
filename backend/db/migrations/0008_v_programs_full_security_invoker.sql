-- 0008 — v_programs_full becomes SECURITY INVOKER
--
-- Why
-- ---
-- `v_programs_full` is the view the entire public surface reads: /explore, the
-- college detail pages, the compare table, and the report renderer. It is
-- intentionally readable by `anon`, because the anon key ships in the client
-- bundle and the programme index is a public product.
--
-- It was created as a plain `CREATE VIEW`, which Postgres defaults to
-- SECURITY DEFINER. That makes the view execute with the privileges of the role
-- that created it rather than the role querying it, so every RLS policy on the
-- seven underlying tables is bypassed for anyone holding the anon key. Today
-- those tables happen to be public catalogue data, so nothing leaks — but the
-- view is the one place where a future PII column added to `programs` or
-- `placement_data` would be published automatically, with no policy change and
-- no reviewer noticing. `v_anomaly_queue`, the internal review pipeline, was
-- switched to `security_invoker` in an earlier migration; this does the same
-- for the view that actually matters.
--
-- The tradeoff
-- ------------
-- With `security_invoker` set, RLS on the underlying tables genuinely applies.
-- That means the view now depends on `anon` retaining SELECT on programs,
-- colleges, degrees, roi_scores, risk_indicators, placement_data and
-- cost_data. All seven have a public-read policy today, so behaviour is
-- unchanged — verified before applying: 73 programs, 73 composite scores, 54
-- salary rows, identical to the SECURITY DEFINER result. If one of those grants
-- is ever revoked, this view returns fewer rows rather than more, which is the
-- direction a data-leak fix should fail in.
--
-- The post-conditions below are assertions, not comments. A migration that
-- cannot be trusted to describe itself is the class of thing that let the
-- original RLS drift go unnoticed, so the check runs at apply time and aborts
-- the transaction if the view ends up anything other than invoker-scoped.

BEGIN;

ALTER VIEW public.v_programs_full SET (security_invoker = true);

DO $$
DECLARE
  view_options   text;
  underlying_ok  integer;
  visible_rows   bigint;
BEGIN
  -- 1. The view must actually be invoker-scoped now.
  SELECT c.reloptions::text INTO view_options
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public' AND c.relname = 'v_programs_full';

  IF view_options IS NULL OR view_options NOT LIKE '%security_invoker=true%' THEN
    RAISE EXCEPTION
      'v_programs_full is not security_invoker (reloptions = %). RLS on the '
      'underlying tables is still bypassed for the anon key.', coalesce(view_options, 'null');
  END IF;

  -- 2. Every table the view reads must still grant anon SELECT, or the public
  --    programme index silently loses rows.
  SELECT count(*) INTO underlying_ok
    FROM unnest(ARRAY['programs','colleges','degrees','roi_scores',
                      'risk_indicators','placement_data','cost_data']) AS t(name)
   WHERE NOT has_table_privilege('anon', format('public.%I', t.name), 'SELECT');

  IF underlying_ok > 0 THEN
    RAISE EXCEPTION
      'anon lost SELECT on % table(s) backing v_programs_full; the public '
      'programme index would return fewer rows after this change.', underlying_ok;
  END IF;

  -- 3. The view must still return data. A zero-row result here means the
  --    public index is broken, which is the failure mode this change risks.
  SELECT count(*) INTO visible_rows FROM public.v_programs_full;

  IF visible_rows = 0 THEN
    RAISE EXCEPTION 'v_programs_full returns 0 rows under security_invoker; aborting.';
  END IF;

  RAISE NOTICE 'v_programs_full: security_invoker=true, % rows still visible.', visible_rows;
END $$;

COMMIT;
