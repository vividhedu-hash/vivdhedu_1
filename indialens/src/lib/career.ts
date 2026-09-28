/**
 * Job-security + career-trajectory client contracts.
 *
 * Both surfaces here read from engines that are honest about being
 * approximations, so the types carry `| null` deliberately. The rule the
 * backend follows (see `colleges.py::_optional_float`) is that a measurement of
 * 0 and "we never measured this" must not serialise identically — and a UI can
 * only honour that if it can tell them apart at the type level. Every field
 * marked optional here is nullable in the response, and every consumer renders
 * `NO_DATA` ("—") rather than substituting a plausible figure.
 */

import { aiErrorMessage } from "./grounded";

/* ── AI job security ─────────────────────────────────────────────────── */

/**
 * One row of the 12-profession safety matrix (`ml/nextgen_engine.py`).
 * These are curated priors, not measured outcomes — see `method` on the page.
 */
export type ProfessionSafetyRow = {
  safety_score: number | null;
  safety_label: string | null;
  risk_color: string | null;
  base_disruption_pct: number | null;
  human_resilience_pct: number | null;
  "5y_layoff_risk_pct": number | null;
  "10y_layoff_risk_pct": number | null;
  vulnerable_tasks: string[] | null;
  resilient_skills: string[] | null;
  ai_strategy: string | null;
  field: string | null;
};

export type ProfessionsSafetyMatrix = {
  matrix: Record<string, ProfessionSafetyRow> | null;
  total_professions: number | null;
  horizon: string | null;
  _source?: string;
};

/** Shape returned by POST /ai/job-security and /ai/evaluate-profession. */
export type JobSecurityResult = {
  job_security_score: number | null;
  security_label: string | null;
  risk_color: string | null;
  base_disruption_pct: number | null;
  human_resilience_pct: number | null;
  displacement_risk: {
    layoff_probability_5y_pct: number | null;
    layoff_probability_10y_pct: number | null;
  } | null;
  upskilling_requirements: {
    estimated_capital_10y_inr: number | null;
    recommended_annual_hours: number | null;
  } | null;
  role_breakdown: {
    vulnerable_tasks: string[] | null;
    resilient_skills: string[] | null;
  } | null;
  strategic_advice: string | null;
  /** Present on the on-the-spot evaluator, absent on the field evaluator. */
  profession?: string;
  evaluation_mode?: string;
  category?: string;
};

/**
 * `message` is present on BOTH branches (null on success) so that callers can
 * destructure `{ ok, data, message }` in one statement. A discriminated union
 * narrowed by destructuring silently loses the guarantee, and every call site
 * here would otherwise need an `if (!ok) { …message… }` guard to satisfy TS.
 */
export type ApiResult<T> =
  | { ok: true; status: number; data: T; message: null }
  | { ok: false; status: number; data: unknown; message: string };

/**
 * These three AI endpoints take their inputs as QUERY PARAMETERS on a POST, not
 * as a JSON body. That is inconsistent with every other endpoint in `ai.py`
 * (which use Pydantic request models), but it is the deployed contract and
 * changing it would break any existing caller, so the client encodes it here
 * rather than papering over it.
 *
 * The body is still sent (empty) because that is what a POST-with-query-params
 * looks like on the wire; nothing on the backend reads it.
 */
async function postWithQuery<T>(path: string, params: Record<string, string | number>): Promise<ApiResult<T>> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") qs.set(key, String(value));
  }
  const url = `/api/v1/ai/${path}?${qs.toString()}`;

  let res: Response;
  try {
    res = await fetch(url, { method: "POST", signal: AbortSignal.timeout(20_000) });
  } catch {
    return {
      ok: false,
      status: 0,
      data: null,
      message: "The job-security model did not respond. No score is shown rather than a substitute one.",
    };
  }
  const data = (await res.json().catch(() => ({}))) as T;
  if (!res.ok) {
    return { ok: false, status: res.status, data, message: aiErrorMessage(data, `Job-security model unavailable (${res.status}).`) };
  }
  return { ok: true, status: res.status, data, message: null };
}

export function fetchProfessionsSafety(): Promise<ApiResult<ProfessionsSafetyMatrix>> {
  return (async () => {
    try {
      const res = await fetch("/api/v1/ai/professions-safety", { signal: AbortSignal.timeout(20_000) });
      const data = (await res.json().catch(() => ({}))) as ProfessionsSafetyMatrix;
      if (!res.ok) {
        return { ok: false, status: res.status, data, message: `Safety matrix unavailable (${res.status}).` };
      }
      return { ok: true, status: res.status, data, message: null };
    } catch {
      return {
        ok: false,
        status: 0,
        data: null,
        message: "The profession safety matrix did not respond. Nothing is shown in place of it.",
      };
    }
  })();
}

export function evaluateJobSecurity(params: {
  degree_field: string;
  college_tier: string;
  student_ai_adaptability: number;
}): Promise<ApiResult<JobSecurityResult>> {
  return postWithQuery<JobSecurityResult>("job-security", params);
}

export function evaluateProfession(params: {
  profession_name: string;
  college_tier: string;
  student_ai_adaptability: number;
}): Promise<ApiResult<JobSecurityResult>> {
  return postWithQuery<JobSecurityResult>("evaluate-profession", params);
}

/* ── Markov career trajectory ────────────────────────────────────────── */

export type CareerStates = {
  states: string[] | null;
  fields: { key: string; label: string }[] | null;
  default_field: string | null;
  default_field_label: string | null;
  field_fallback_note: string | null;
  tiers: string[] | null;
  tier_speed_multiplier: Record<string, number> | null;
  tier_speed_note: string | null;
  _source?: string;
};

export type DistributionRow = { year: number } & Record<string, number | null>;

export type MatrixRow = { from_state: string; row_sum: number | null } & Record<string, number | null>;

export type SalaryBand = {
  p10: number | null;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  p90: number | null;
  exit_mass_pct: number | null;
  suppressed_bands: string[] | null;
  suppressed_reason: string | null;
};

export type CareerTrajectory = {
  field: string;
  field_label: string | null;
  field_fallback: boolean;
  field_fallback_note: string | null;
  tier: string;
  start_state: string;
  horizon_years: number;
  states: string[] | null;
  transition_matrix: { rows: MatrixRow[] | null; note: string | null } | null;
  distribution: DistributionRow[] | null;
  distribution_source: string;
  distribution_at_horizon: Record<string, number | null> | null;
  exit_risk_at_horizon: number | null;
  exit_risk_note: string | null;
  salary_trajectory: {
    base_salary_y1_inr: number;
    available_years: string[] | null;
    percentiles: Record<string, SalaryBand> | null;
    method: string | null;
    checkpoints_note: string | null;
  } | null;
  salary_trajectory_unavailable_reason: string | null;
  monte_carlo: {
    n_simulations: number;
    is_sampled_estimate: boolean;
    distribution: DistributionRow[] | null;
    note: string | null;
  } | null;
  monte_carlo_unavailable_reason: string | null;
  agreement: {
    method: string;
    tvd: number | null;
    tvd_threshold: number;
    in_agreement: boolean;
    note: string | null;
  } | null;
  _source?: string;
  model_version?: string;
};

export function fetchCareerStates(): Promise<ApiResult<CareerStates>> {
  return (async () => {
    try {
      const res = await fetch("/api/v2/career/states", { signal: AbortSignal.timeout(20_000) });
      const data = (await res.json().catch(() => ({}))) as CareerStates;
      if (!res.ok) {
        return { ok: false, status: res.status, data, message: `Model vocabulary unavailable (${res.status}).` };
      }
      return { ok: true, status: res.status, data, message: null };
    } catch {
      return {
        ok: false,
        status: 0,
        data: null,
        message: "The career model's vocabulary could not be loaded, so no field list is shown.",
      };
    }
  })();
}

export async function fetchCareerTrajectory(body: {
  field: string;
  tier: string;
  start_state: string;
  horizon_years: number;
  base_salary_y1_inr?: number | null;
  include_monte_carlo: boolean;
}): Promise<ApiResult<CareerTrajectory>> {
  try {
    const res = await fetch("/api/v2/career/trajectory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // The Monte-Carlo block is a multi-second simulation; the default
      // browser timeout would abort a perfectly healthy response.
      signal: AbortSignal.timeout(60_000),
    });
    const data = (await res.json().catch(() => ({}))) as CareerTrajectory;
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data,
        message: aiErrorMessage(data, `The career projection failed (${res.status}).`),
      };
    }
    return { ok: true, status: res.status, data, message: null };
  } catch {
    return {
      ok: false,
      status: 0,
      data: null,
      message: "The career-trajectory model did not respond. No trajectory is shown in its place.",
    };
  }
}
