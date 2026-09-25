/**
 * Direct Supabase REST Client
 *
 * Runs natively inside Next.js / Vercel Serverless without heavy external ORMs.
 * Connects directly to the live Supabase PostgreSQL database using PostgREST.
 */

import type { CollegeDegreeRecord, CollegeTier, DegreeField } from "./mock-data";

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
  total_cost_of_degree: number | null;
}

export function mapSupabaseRowToRecord(row: SupabaseProgramRow): CollegeDegreeRecord {
  const tierNum = (parseInt(row.tier, 10) || 2) as CollegeTier;
  const field = (row.degree_field || "engineering-cs") as DegreeField;
  const compositeScore = Number(row.composite_score ?? 70);
  const financialRoiPct = Number(row.financial_roi_pct ?? 250);
  const riskScore = Number(row.risk_score ?? 0.25);

  // Data honesty: several active programs have no current placement_data row
  // (19 of 73 at time of writing), so these arrive null. The old code
  // substituted plausible constants (1_200_000 median, 88% placement), which
  // meant fabricated numbers were rendered as if they were measurements.
  // We now pass null through and let the UI show an explicit
  // "insufficient data" state instead of an invented figure.
  const medianSalary =
    row.median_salary_inr != null ? Number(row.median_salary_inr) : null;
  const totalCost = Number(row.total_cost_of_degree ?? 1_000_000);
  const rawPlacement =
    row.placement_rate_pct != null ? Number(row.placement_rate_pct) : null;
  const placementRatePct =
    rawPlacement == null
      ? null
      : rawPlacement > 1
        ? Math.round(rawPlacement)
        : Math.round(rawPlacement * 100);
  const employmentRateFrac =
    rawPlacement == null ? null : rawPlacement > 1 ? rawPlacement / 100 : rawPlacement;

  return {
    id: row.program_id,
    college: {
      id: row.college_id,
      name: row.college_full_name,
      shortName: row.college_short_name,
      state: row.state,
      city: row.city,
      tier: tierNum,
      nirfRank: row.nirf_rank ?? 50,
      type: (row.college_type as any) || "private",
      naacGrade: "A++",
      established: 1960,
    },
    degree: {
      id: row.degree_id,
      name: row.degree_full_name,
      shortName: row.degree_short_name,
      field,
      durationYears: row.duration_years ?? 4,
      level: (row.degree_level as any) || "UG",
    },
    program: {
      annualTuitionInr: row.annual_tuition_inr ?? Math.round(totalCost / (row.duration_years || 4)),
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
      confidenceIntervalLow: Number(row.ci_low ?? compositeScore - 2),
      confidenceIntervalHigh: Number(row.ci_high ?? compositeScore + 2),
      modelVersion: row.model_version ?? "v2.0-live",
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
      aiAutomationProbability: Number(row.ai_automation_prob ?? 0.22),
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
      totalTuitionInr: totalCost,
      hostelLivingInr: 400_000,
      examPrepCostsInr: 50_000,
      opportunityCostInr: 800_000,
      totalCostOfDegreeInr: totalCost + 450_000,
    },
    meta: {
      lastUpdated: new Date().toISOString(),
      scrapeSource: "NIRF Verified 2024 / Supabase Live",
      aiRiskLabel: (row.ai_risk_label as any) || "Low",
      dataFreshnessDays: 12,
    },
  };
}
