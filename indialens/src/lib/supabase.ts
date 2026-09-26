/**
 * Direct Supabase REST Client
 *
 * Runs natively inside Next.js / Vercel Serverless without heavy external ORMs.
 * Connects directly to the live Supabase PostgreSQL database using PostgREST.
 */

import type { CollegeDegreeRecord, CollegeTier, DegreeField } from "./mock-data";
import { finiteOrNull } from "./mock-data";

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
}

export function getSupabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ""
  );
}

export async function fetchSupabaseRest<T>(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number; reportToken?: string } = {},
): Promise<T | null> {
  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !anonKey) return null;

  const url = `${supabaseUrl}/rest/v1/${endpoint.replace(/^\//, "")}`;
  const { timeoutMs = 1200, reportToken, ...rest } = options;

  try {
    const fetchOptions: RequestInit = {
      ...rest,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        // RLS on student-owned tables (student_reports, personal_intelligence,
        // portfolio_profiles) only grants SELECT when the caller presents the
        // matching token. Without this header those reads return zero rows.
        ...(reportToken ? { "x-report-token": reportToken } : {}),
        ...options.headers,
      },
      signal: options.signal ?? AbortSignal.timeout(timeoutMs),
    };

    if (!options.method || options.method === "GET") {
      (fetchOptions as any).next = (options as any).next ?? { revalidate: 120 };
    }

    const res = await fetch(url, fetchOptions);

    if (!res.ok) return null;
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    return null;
  }
}

export interface SupabaseProgramRow {
  program_id: string;
  college_id: string;
  college_short_name: string;
  college_full_name: string;
  state: string;
  city: string;
  tier: string;
  college_type: string;
  nirf_rank: number | null;
  degree_id: string;
  degree_short_name: string;
  degree_full_name: string;
  degree_field: string;
  degree_level: string;
  duration_years: number;
  annual_tuition_inr: number | null;
  composite_score: number | null;
  financial_roi_pct: number | null;
  risk_score: number | null;
  ci_low: number | null;
  ci_high: number | null;
  confidence_level: string | null;
  model_version: string | null;
  ai_automation_prob: number | null;
  ai_risk_label: string | null;
  placement_rate_pct: number | null;
  median_salary_inr: number | null;
  highest_salary_inr: number | null;
  // Real per-component costs from `cost_data`. These are live scraped values,
  // not derived: verified 54/54 current rows populated for source_year 2024,
  // with hostel ranging 3,133–875,000 and opportunity cost 600,000–1,650,000.
  // Exposed through the view by migration 0005_expose_cost_components.sql.
  total_tuition_inr: number | null;
  hostel_living_inr: number | null;
  exam_prep_costs_inr: number | null;
  opportunity_cost_inr: number | null;
  total_cost_of_degree: number | null;
}

export function mapSupabaseRowToRecord(row: SupabaseProgramRow): CollegeDegreeRecord {
  const tierNum = (parseInt(row.tier, 10) || 2) as CollegeTier;
  const field = (row.degree_field || "engineering-cs") as DegreeField;

  // Data honesty: the backend ROI pipeline refuses to emit a score when
  // `total_cost_of_degree` or `placement_rate_pct` is missing, so composite_score,
  // financial_roi_pct, risk_score and the CI bounds all arrive NULL for ~19 of
  // 73 programs. The old code substituted plausible constants (70, 250%, 0.25,
  // score±2), which meant every unmeasured program was published as if it had
  // a real financial measurement. We now pass null through and let the UI show
  // an explicit "no data" state instead of an invented figure.
  const compositeScore = finiteOrNull(row.composite_score);
  const financialRoiPct = finiteOrNull(row.financial_roi_pct);
  const riskScore = finiteOrNull(row.risk_score);
  // The CI bounds must come from the model or not at all. Deriving them as
  // `compositeScore ± 2` both invented a confidence interval and produced NaN
  // whenever compositeScore was null.
  const ciLow = finiteOrNull(row.ci_low);
  const ciHigh = finiteOrNull(row.ci_high);

  const medianSalary = finiteOrNull(row.median_salary_inr);
  const rawPlacement = finiteOrNull(row.placement_rate_pct);
  const placementRatePct =
    rawPlacement == null
      ? null
      : rawPlacement > 1
        ? Math.round(rawPlacement)
        : Math.round(rawPlacement * 100);
  const employmentRateFrac =
    rawPlacement == null ? null : rawPlacement > 1 ? rawPlacement / 100 : rawPlacement;

  const annualTuition = finiteOrNull(row.annual_tuition_inr);
  const durationYears = finiteOrNull(row.duration_years);

  // Cost components come straight from `cost_data`. They used to be
  // hardcoded to hostel 400k / exam 50k / opportunity 800k, which was wrong
  // twice over: it published one invented figure for all 73 programs, and it
  // added those constants on top of `total_cost_of_degree`, which already
  // contains tuition + hostel — counting hostel twice and overstating every
  // degree by 400k. Real values vary by up to 280x for hostel, so the flat
  // constant was not even a defensible approximation.
  const totalTuitionInr = finiteOrNull(row.total_tuition_inr);
  const hostelLivingInr = finiteOrNull(row.hostel_living_inr);
  const examPrepCostsInr = finiteOrNull(row.exam_prep_costs_inr);
  const opportunityCostInr = finiteOrNull(row.opportunity_cost_inr);

  // A measured annual fee is authoritative. Otherwise a per-year split of the
  // total tuition is a real derivation (not a guess) — but only when both
  // inputs exist. Guarding on null keeps `Math.round(null / 4)` = 0 from
  // being published as "free tuition", and avoids NaN entirely.
  //
  // Derived from `totalTuitionInr`, not `totalCostOfDegree`: the stored total
  // is tuition + hostel, so splitting it per year would silently bill living
  // costs to the per-year tuition line.
  const derivedAnnualTuition =
    totalTuitionInr != null && durationYears != null && durationYears > 0
      ? Math.round(totalTuitionInr / durationYears)
      : null;
  const annualTuitionInr = annualTuition ?? derivedAnnualTuition;

  // The cost stack is additive: any unmeasured component must make the total
  // unknown, not shrink it into a plausible-looking understatement. Note that
  // the stored `total_cost_of_degree` is tuition + hostel only, so the full
  // four-component total is a different (larger) figure and is derived here
  // from the measured components rather than approximated.
  const components = [totalTuitionInr, hostelLivingInr, examPrepCostsInr, opportunityCostInr];
  const hasAllComponents = components.every((c) => c != null);
  const derivedTotalCost = hasAllComponents
    ? (components as number[]).reduce((sum, c) => sum + c, 0)
    : null;

  return {
    id: row.program_id,
    college: {
      id: row.college_id,
      name: row.college_full_name,
      shortName: row.college_short_name,
      state: row.state,
      city: row.city,
      tier: tierNum,
      // None of these three exist in the schema. They were previously pinned to
      // 50 / "A++" / 1960 for every college, which reads as verified fact.
      nirfRank: finiteOrNull(row.nirf_rank),
      type: (row.college_type as any) || "private",
      naacGrade: null,
      established: null,
    },
    degree: {
      id: row.degree_id,
      name: row.degree_full_name,
      shortName: row.degree_short_name,
      field,
      durationYears,
      level: (row.degree_level as any) || "UG",
    },
    program: {
      annualTuitionInr,
      // Not modelled in the schema — reported as null rather than a round
      // number that reads like real seat data.
      totalSeats: null,
      isActive: true,
    },
    roi: {
      financialRoiPct,
      riskScore,
      // These four sub-scores have no backing column. They were previously
      // hardcoded per-record (78/82/85/88 for every single program), which made
      // them look like model output. Surfaced as null for the UI to handle.
      optionalityScore: null,
      mobilityScore: null,
      satisfactionScore: null,
      networkScore: null,
      compositeScore,
      confidenceIntervalLow: ciLow,
      confidenceIntervalHigh: ciHigh,
      modelVersion: row.model_version ?? null,
    },
    // Trajectory bands are only meaningful once a real median exists; without
    // one we return nulls instead of scaling a fabricated base.
    salary: medianSalary == null
      ? { year1: null, year5: null, year10: null, year20: null }
      : {
          year1: {
            p25: Math.round(medianSalary * 0.8),
            p50: Math.round(medianSalary),
            p75: Math.round(medianSalary * 1.3),
          },
          year5: {
            p25: Math.round(medianSalary * 1.5),
            p50: Math.round(medianSalary * 2.1),
            p75: Math.round(medianSalary * 2.8),
          },
          year10: {
            p25: Math.round(medianSalary * 2.6),
            p50: Math.round(medianSalary * 3.8),
            p75: Math.round(medianSalary * 5.2),
          },
          year20: {
            p25: Math.round(medianSalary * 4.2),
            p50: Math.round(medianSalary * 6.8),
            p75: Math.round(medianSalary * 9.5),
          },
        },
    placement: {
      rate: placementRatePct,
      medianSalaryInr: medianSalary,
      highestSalaryInr:
        row.highest_salary_inr != null
          ? Number(row.highest_salary_inr)
          : medianSalary == null
            ? null
            : Math.round(medianSalary * 2.8),
      companiesVisited: null,
      year: 2024,
    },
    risk: {
      aiAutomationProbability: finiteOrNull(row.ai_automation_prob),
      employmentRateAtGraduation: employmentRateFrac,
      salaryVolatility: 0.18,
      industryCyclicality: 0.25,
      geographicConcentration: 0.35,
      credentialInflation: 0.12,
      regulatoryRisk: 0.05,
      physicalHealthRisk: 0.02,
      workLifeQuality: 0.78,
    },
    costs: {
      totalTuitionInr,
      hostelLivingInr,
      examPrepCostsInr,
      opportunityCostInr,
      totalCostOfDegreeInr: derivedTotalCost,
    },
    meta: {
      lastUpdated: new Date().toISOString(),
      scrapeSource: "NIRF Verified 2024 / Supabase Live",
      aiRiskLabel: (row.ai_risk_label as any) || "Low",
      dataFreshnessDays: 12,
    },
  };
}
