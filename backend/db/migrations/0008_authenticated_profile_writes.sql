-- =============================================================================
-- Migration 0008 — let a signed-in student write their OWN name and link their
--                   own report, without widening what anon can do
-- =============================================================================
-- Problem
-- -------
-- The browser signs students in through SUPABASE AUTH, and the whole product
-- assumes the session is real. But the `users` row that a session is supposed
-- to have was never actually written, and the report a student builds was never
-- linked back to them. So:
--
--   1. A student who completed onboarding had nowhere to put their own name.
--      `student_reports.profile_data` is reachable by anyone holding the
--      report token, and anon can INSERT into it, so it is the wrong home for
--      PII — a bearer-token table is not an identity.
--   2. `users` has the correct policies but nobody can use them. Live as of
--      2026-09-28: `users` and `user_saved_reports` hold ONLY SELECT for
--      `authenticated` (`has_table_privilege('authenticated','users','UPDATE')`
--      = false). The three owner policies on `users` and the three on
--      `user_saved_reports` are dormant: no route exists to exercise them.
--
-- This migration grants the privileges those policies were already written for.
-- It creates NO policy and changes NO policy.
--
-- Why this is not a new unauthenticated write path
-- -------------------------------------------------
-- Every grant here is TO `authenticated` only, and every one is COLUMN-scoped.
-- `anon` is not touched: it keeps exactly the SELECT it has today and gains
-- nothing. The existing policies do the scoping, and they scope by identity:
--
--     users                  INSERT  with check (auth.uid() = id)
--     users                  UPDATE  using / with check (auth.uid() = id)
--     user_saved_reports     INSERT  with check (auth.uid() = id)
--
-- All three are `auth.uid()`, which is the subject of the Supabase JWT the
-- browser is already holding and which a caller cannot choose. So a caller can
-- write their own row and nobody else's, or create no row at all.
--
-- Why COLUMN-scoped, and not the table
-- ------------------------------------
-- RLS decides ROWS, never COLUMNS. This repository has already been bitten by
-- exactly that, and migration 0004 and 0007 both say so in their own headers:
-- a table-level UPDATE plus a row-scoped policy would let any student rewrite
-- any column of their own row.
--
-- That matters concretely here rather than hypothetically: `users` carries
-- `is_premium`, `premium_tier` and `premium_until`. A table-level UPDATE would
-- let a student set `is_premium = true` on their own account, which is
-- self-service purchase of a paid entitlement. `users` also has
-- `oauth_provider` / `oauth_id`, where a table-level INSERT would let a student
-- mint a second identity under another provider's claim.
--
-- So the grant is the narrowest one that still does the job:
--
--     INSERT (id, email, full_name, avatar_url, oauth_provider, oauth_id)
--     UPDATE (full_name, avatar_url, updated_at)
--
-- `created_at` keeps its DEFAULT, `updated_at` is written explicitly (the table
-- has no trigger on it). `is_premium`, `premium_tier` and `premium_until` are
-- not granted to anyone here; they remain server-owned.
--
-- Rollback
-- -------
--   REVOKE INSERT (id, email, full_name, avatar_url, oauth_provider, oauth_id)
--     ON public.users FROM authenticated;
--   REVOKE UPDATE (full_name, avatar_url, updated_at)
--     ON public.users FROM authenticated;
--   REVOKE INSERT (user_id, report_token, title)
--     ON public.user_saved_reports FROM authenticated;
-- =============================================================================

BEGIN;

-- ── 1. users ───────────────────────────────────────────────────────────────

GRANT INSERT (id, email, full_name, avatar_url, oauth_provider, oauth_id)
  ON public.users TO authenticated;

GRANT UPDATE (full_name, avatar_url, updated_at)
  ON public.users TO authenticated;

-- ── 2. user_saved_reports ──────────────────────────────────────────────────
-- The link between a report token and the account that owns it. `title` is the
-- only optional text, and it is the student's own words about their own report.
-- `report_token` is already UNIQUE per (user_id, report_token), so re-running
-- onboarding is an upsert rather than a duplicate row.

GRANT INSERT (user_id, report_token, title)
  ON public.user_saved_reports TO authenticated;

-- ── 3. Post-conditions ─────────────────────────────────────────────────────
-- These assert the property this migration exists to create, so a later
-- migration that widens one of these grants fails at apply time instead of
-- shipping silently.

DO $$
DECLARE
  offenders text;
  entitled integer;
BEGIN
  -- 1. anon must gain NOTHING. It held SELECT on both tables before this
  --    migration and must hold no write privilege on either after it. A PII
  --    table that anon can write is the failure mode this whole file avoids.
  SELECT string_agg(format('%s (%s)', table_name, privilege_type), ', ')
    INTO offenders
  FROM information_schema.role_table_grants
  WHERE grantee = 'anon'
    AND table_schema = 'public'
    AND table_name IN ('users', 'user_saved_reports')
    AND privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN');

  IF offenders IS NOT NULL THEN
    RAISE EXCEPTION
      'anon must hold no write privileges on users / user_saved_reports, found: %. Revoke them.', offenders;
  END IF;

  -- 2. `authenticated` must NOT hold a TABLE-level INSERT or UPDATE on `users`.
  --    Column grants are reported in pg_attribute, not in role_table_grants, so
  --    their absence here is the property we want: a table-level grant is how
  --    is_premium becomes self-assignable.
  SELECT count(*) INTO entitled
  FROM information_schema.role_table_grants
  WHERE grantee = 'authenticated'
    AND table_schema = 'public'
    AND table_name IN ('users', 'user_saved_reports')
    AND privilege_type IN ('INSERT','UPDATE','DELETE');

  IF entitled > 0 THEN
    RAISE EXCEPTION
      'authenticated holds % table-level write grant(s) on users / user_saved_reports. These must stay column-scoped or a student can set their own is_premium.', entitled;
  END IF;

  -- 3. The privilege is useless — and the feature broken — unless the owner
  --    policies actually exist. Assert the three that scope the writes, so a
  --    dropped policy is caught here rather than as a 42501 in production.
  SELECT count(*) INTO entitled
  FROM pg_policies
  WHERE schemaname = 'public'
    AND ( (tablename = 'users'          AND cmd IN ('INSERT','UPDATE'))
       OR (tablename = 'user_saved_reports' AND cmd = 'INSERT') )
    AND 'authenticated' = ANY(roles)
    AND (coalesce(qual, '') || coalesce(with_check, '')) LIKE '%auth.uid()%';

  IF entitled < 3 THEN
    RAISE EXCEPTION
      'Expected 3 auth.uid()-scoped owner policies across users(INSERT,UPDATE) and user_saved_reports(INSERT), found %. Without them the grants cannot write anything.', entitled;
  END IF;

  -- 4. RLS must still be on. A grant without RLS is a public write path.
  SELECT string_agg(format('%s', c.relname), ', ')
    INTO offenders
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname IN ('users', 'user_saved_reports')
    AND NOT c.relrowsecurity;

  IF offenders IS NOT NULL THEN
    RAISE EXCEPTION
      'Row Level Security is not enabled on: %. Refusing to commit.', offenders;
  END IF;

  -- 5. `is_premium` must not be writable by any client role. Server-owned
  --    entitlement is the property; a client-writable one is a pricing bug.
  --    `has_column_privilege` is used rather than an information_schema view
  --    because it resolves the whole chain (table grant + column grant +
  --    ownership) exactly, and because the column-privilege views only exist
  --    for roles currently enabled to the session.
  IF has_column_privilege('anon', 'public.users', 'is_premium', 'INSERT,UPDATE')
     OR has_column_privilege('authenticated', 'public.users', 'is_premium', 'INSERT,UPDATE') THEN
    RAISE EXCEPTION
      'A client role can write users.is_premium. Entitlement is server-owned; revoke the column grant.';
  END IF;
END $$;

COMMIT;
