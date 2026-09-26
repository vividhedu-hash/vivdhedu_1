-- =============================================================================
-- Migration 0005 — Expose the real cost components through v_programs_full
-- =============================================================================
-- Why
-- ---
-- `cost_data` already stores every component of a degree's cost as its own
-- column, and all 54 current rows are fully populated for source_year 2024:
--
--   total_tuition_inr      54/54
--   hostel_living_inr       54/54
--   exam_prep_costs_inr     54/54
--   opportunity_cost_inr    54/54
--
-- But the view exposed only `cd.total_cost_of_degree`, so the frontend — which
-- reads the view directly over PostgREST — never saw the components. It filled
-- the gap with hardcoded constants (hostel 400k, exam 50k, opportunity 800k).
--
-- That was wrong twice over:
--
--   1. It invented numbers. Real hostel costs in the table range from
--      3,133 to 875,000 and real opportunity cost from 600,000 to 1,650,000.
--      A single flat constant published the same figure for every college and
--      in the process threw away data that had already been scraped.
--
--   2. It double-counted. `total_cost_of_degree` in this table is already
--      tuition + hostel (verified: 54/54 rows match that sum exactly, 0 match
--      tuition alone, 0 match the full four-component sum). Adding another
--      400k of "hostel" on top of it counted hostel twice, so every degree was
--      reported as more expensive than the stored record says.
--
-- The backend router (`api/routers/colleges.py`) already selects all five
-- columns and returns them under the same camelCase keys the frontend types
-- expect, so the view was the only path still missing them. This aligns the two.
--
-- Why DROP instead of CREATE OR REPLACE
-- ------------------------------------
-- The new columns are interleaved with the old ones (total_tuition_inr is
-- projected where the old view had no counterpart), and CREATE OR REPLACE VIEW
-- may only append to the end of the column list. Postgres rejects it with:
--
--   42P16: cannot change name of view column "total_cost_of_degree" to
--          "total_tuition_inr"
--
-- So the view is dropped and recreated in the same transaction, and its grants
-- are captured and restored explicitly. The ACL below was read from the live
-- catalogue before this migration, not assumed.
--
--   postgres=arwdDxtm/postgres, anon=r/postgres,
--   authenticated=r/postgres, service_role=r/postgres
--
-- The drop is safe: the view has no dependent views, functions, or rules
-- (internal_deps = 1, which is only the view's own rewrite rule). It is
-- never referenced in FROM position anywhere in the backend — the routers
-- join the base tables directly — so nothing is rebuilt against it.
--
-- What this does NOT change
-- -------------------------
-- No column is renamed, dropped, or recomputed. `total_cost_of_degree` keeps
-- its existing meaning and its existing value; we are only widening what the
-- view projects. Views execute with the definer's rights, so no new privilege
-- on `cost_data` is required.
--
-- Rolling back
-- ------------
-- Recreate the view from the previous projection (the `CREATE VIEW` in
-- db/schema.sql as of 0004, projecting only `cd.total_cost_of_degree`) and
-- restore the same ACL. Note that the frontend reads the four component
-- columns, so rolling back requires reverting src/lib/supabase.ts too.
-- =============================================================================

BEGIN;

DROP VIEW IF EXISTS v_programs_full;

CREATE VIEW v_programs_full AS
SELECT
  p.id AS program_id,
  c.id AS college_id,
  c.short_name AS college_short_name,
  c.full_name AS college_full_name,
  c.state,
  c.city,
  c.tier,
  c.college_type,
  c.nirf_rank,
  d.id AS degree_id,
  d.short_name AS degree_short_name,
  d.full_name AS degree_full_name,
  d.field AS degree_field,
  d.level AS degree_level,
  d.duration_years,
  p.annual_tuition_inr,
  r.composite_score,
  r.financial_roi_pct,
  r.risk_score,
  r.ci_low,
  r.ci_high,
  r.confidence_level,
  r.model_version,
  ri.ai_automation_prob,
  ri.ai_risk_label,
  pl.placement_rate_pct,
  pl.median_salary_inr,
  pl.highest_salary_inr,
  cd.total_tuition_inr,
  cd.hostel_living_inr,
  cd.exam_prep_costs_inr,
  cd.opportunity_cost_inr,
  cd.total_cost_of_degree
FROM programs p
JOIN colleges c ON c.id = p.college_id
JOIN degrees d ON d.id = p.degree_id
LEFT JOIN roi_scores r ON r.program_id = p.id AND r.is_current = TRUE
LEFT JOIN risk_indicators ri ON ri.program_id = p.id AND ri.is_current = TRUE
LEFT JOIN placement_data pl ON pl.program_id = p.id AND pl.is_current = TRUE
LEFT JOIN cost_data cd ON cd.program_id = p.id AND cd.is_current = TRUE
WHERE p.is_active = TRUE;

-- Restore the ACL captured from the live catalogue above. A recreated view
-- would otherwise fall back to owner-only access and take the frontend's
-- PostgREST reads down with it.
GRANT SELECT ON v_programs_full TO anon;
GRANT SELECT ON v_programs_full TO authenticated;
GRANT SELECT ON v_programs_full TO service_role;

COMMIT;
