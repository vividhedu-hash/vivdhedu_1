import { MOCK_DATA, type CollegeDegreeRecord, finiteOrNull, compareNullableAsc, compareNullableDesc } from "./mock-data";
import { allowMockFallback, fetchBackend } from "./backend";
import { fetchSupabaseRest, mapSupabaseRowToRecord, type SupabaseProgramRow } from "./supabase";

const SORT_MAP: Record<string, string> = {
  compositeScore: "composite_score",
  financialRoiPct: "financial_roi",
  riskScore: "risk_score",
  year1Salary: "composite_score",
  composite_score: "composite_score",
  financial_roi: "financial_roi",
  placement_rate: "placement_rate",
};

/**
 * Where a set of rows came from.
 *
 * `unavailable` is new and load-bearing. Previously the list helper had two
 * outcomes — rows from a real store, or rows from `MOCK_DATA` — so a failed
 * fetch and a successful one were indistinguishable unless the caller
 * remembered to check `.source`. `MOCK_DATA.length` as `total` in particular
 * reads exactly like a real count, and the landing page renders that count as
 * a headline figure.
 *
 * With a third state, "we could not reach the index" is representable, and
 * each caller is forced to decide what a page looks like when it happens.
 */
export type CollegeDataSource = "database" | "mock" | "unavailable";

export type CollegeListResult = {
  data: CollegeDegreeRecord[];
  /**
   * `null` when unknown, NOT `0`. A zero here would be indistinguishable from
   * an index that is genuinely empty, and the landing page prints this value
   * as a headline number.
   */
  total: number | null;
  source: CollegeDataSource;
  /** Human-readable failure reason, present only when `source === "unavailable"`. */
  reason?: string;
};

export type CollegeDetailResult =
  | { record: CollegeDegreeRecord; source: "database" | "mock" }
  /** Checked, and genuinely absent. A 404 is a statement about the catalogue. */
  | { record: null; source: "not_found" }
  /** Could not check. Distinct from `not_found` — see the docstring below. */
  | { record: null; source: "unavailable"; reason: string };

export function mapCollegeSort(sortBy?: string | null): string {
  if (!sortBy) return "composite_score";
  return SORT_MAP[sortBy] ?? "composite_score";
}

export async function fetchCollegeList(query: {
  page?: number;
  per_page?: number;
  field?: string | null;
  tier?: string | null;
  state?: string | null;
  search?: string | null;
  sort_by?: string | null;
  sort_dir?: string | null;
} = {}): Promise<CollegeListResult> {
  // 1. Direct Supabase Query (Primary - ultra fast on Vercel Serverless)
  try {
    const supabaseParams = new URLSearchParams();
    if (query.field) supabaseParams.set("degree_field", `eq.${query.field}`);
    if (query.tier) supabaseParams.set("tier", `eq.${query.tier}`);
    if (query.state) supabaseParams.set("state", `eq.${query.state}`);
    if (query.search) {
      supabaseParams.set(
        "or",
        `(college_full_name.ilike.*${query.search}*,degree_full_name.ilike.*${query.search}*)`,
      );
    }
    const sortCol = query.sort_by === "financialRoiPct" ? "financial_roi_pct" : "composite_score";
    supabaseParams.set("order", `${sortCol}.${query.sort_dir === "asc" ? "asc" : "desc"}`);
    supabaseParams.set("limit", String(query.per_page ?? 20));
    supabaseParams.set("offset", String(((query.page ?? 1) - 1) * (query.per_page ?? 20)));

    const rows = await fetchSupabaseRest<SupabaseProgramRow[]>(`v_programs_full?${supabaseParams}`, {
      timeoutMs: 1200,
    });
    if (rows && Array.isArray(rows) && rows.length > 0) {
      const perPage = query.per_page ?? 20;
      const offset = ((query.page ?? 1) - 1) * perPage;
      return {
        data: rows.map(mapSupabaseRowToRecord),
        // Lower-bound estimate; PostgREST count headers are not requested here.
        total: offset + rows.length,
        source: "database",
      };
    }
  } catch {
    // Supabase query failed; fall through
  }

  // 2. Secondary: Backend API if reachable
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    per_page: String(query.per_page ?? 20),
    sort_by: mapCollegeSort(query.sort_by),
    sort_dir: query.sort_dir ?? "desc",
  });
  if (query.field) params.set("field", query.field);
  if (query.tier) params.set("tier", query.tier);
  if (query.state) params.set("state", query.state);
  if (query.search) params.set("q", query.search);

  const resp = await fetchBackend(`/api/colleges?${params}`, {
    timeoutMs: 1500,
    next: { revalidate: 300 },
  });

  if (resp?.ok) {
    const json = await resp.json();
    // Rows from the FastAPI list endpoint are already in `CollegeDegreeRecord`
    // shape — same camelCase keys the Supabase mapper produces, including the
    // `costs` block and `number | null` for every unmeasured figure. The cast
    // is therefore sound, but it is a cast, not a validation: the endpoint is
    // a separate deployable and could be an older build whose rows predate the
    // `costs` block entirely. Consumers must read these fields defensively
    // (`record.costs?.totalTuitionInr`) rather than assume the block exists.
    // See the `tuitionInr` helper in src/app/explore/page.tsx.
    const rows: CollegeDegreeRecord[] = Array.isArray(json.data) ? json.data : [];
    if (rows.length > 0) {
      return {
        data: rows,
        total: json.total ?? rows.length,
        source: "database",
      };
    }
  }

  // GUARD: seed data is a local-dev affordance, not a fallback.
  //
  // Both real sources are unreachable at this point. Returning `MOCK_DATA`
  // here meant a dead Supabase and a dead FastAPI produced a page that looked
  // exactly like a working one: 73 fake programmes with plausible composite
  // scores, tuition, and placement rates, and a `total` that the landing page
  // renders as a headline figure. The old code carried a `source` field, but
  // nothing in the render path consulted it — `source` was advisory, so the
  // honesty was opt-in and the default was the lie.
  //
  // With ALLOW_MOCK_FALLBACK unset in production, this returns an explicit
  // unavailable result and the pages render their empty state. Set
  // ALLOW_MOCK_FALLBACK=1 in a local .env file to keep the demo dataset.
  if (allowMockFallback()) {
    return applyMockFilters(query);
  }

  return {
    data: [],
    total: null,
    source: "unavailable",
    reason:
      "The programme index is unreachable. Supabase and the analytics API both did not answer, and seed data is disabled in this environment.",
  };
}

export async function fetchCollegeById(id: string): Promise<CollegeDetailResult> {
  // 1. Direct Supabase Query (Primary)
  try {
    const rows = await fetchSupabaseRest<SupabaseProgramRow[]>(
      `v_programs_full?program_id=eq.${encodeURIComponent(id)}&limit=1`,
      { timeoutMs: 3000 },
    );
    if (rows && Array.isArray(rows) && rows.length > 0) {
      return { record: mapSupabaseRowToRecord(rows[0]), source: "database" };
    }
  } catch {
    // continue
  }

  // 2. Secondary Backend API
  const resp = await fetchBackend(`/api/colleges/${encodeURIComponent(id)}`, {
    timeoutMs: 1500,
    next: { revalidate: 600 },
  });

  if (resp?.ok) {
    return { record: await resp.json(), source: "database" };
  }

  // GUARD: same rule as the list path — a single unreachable store must not
  // yield a fabricated detail page. This one matters more than the list does:
  // a programme page is the product, and it renders a composite score, a
  // placement rate, a median salary and a total cost of degree. Every one of
  // those is a financial claim about a real institution, and a URL that
  // resolves to a real institution's fake numbers is worse than a 503.
  //
  // The distinction that matters: `null` here now means "could not check",
  // not "checked and absent". Those used to be the same value, so a dead
  // database and a typo'd id were indistinguishable to the caller.
  if (allowMockFallback()) {
    const record = MOCK_DATA.find((r) => r.id === id);
    // `not_found` rather than `source: "mock"` for the miss case: we did check
    // the seed catalogue, and it does not contain this id. Reporting that as
    // "mock" would make a genuine absence look like an outage.
    if (record) return { record, source: "mock" };
    return { record: null, source: "not_found" };
  }

  return {
    record: null,
    source: "unavailable",
    reason:
      "This programme could not be loaded. The data stores did not answer, and seed data is disabled in this environment.",
  };
}

function applyMockFilters(query: {
  page?: number;
  per_page?: number;
  field?: string | null;
  tier?: string | null;
  state?: string | null;
  search?: string | null;
  sort_by?: string | null;
  sort_dir?: string | null;
}): { data: CollegeDegreeRecord[]; total: number; source: "mock" } {
  let filtered = [...MOCK_DATA];
  if (query.field) filtered = filtered.filter((r) => r.degree.field === query.field);
  if (query.tier) filtered = filtered.filter((r) => String(r.college.tier) === query.tier);
  if (query.state) filtered = filtered.filter((r) => r.college.state === query.state);
  if (query.search) {
    const q = query.search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.college.name.toLowerCase().includes(q) ||
        r.degree.name.toLowerCase().includes(q),
    );
  }

  const sortBy = query.sort_by ?? "compositeScore";
  const sortDir = query.sort_dir ?? "desc";
  // Unmeasured scores sort last in both directions. Subtracting null directly
  // yields NaN, which Array#sort treats as "keep original order" — so the gap
  // would be arbitrary rather than deliberate.
  filtered.sort((a, b) => {
    const val = (r: CollegeDegreeRecord): number | null => {
      if (sortBy === "financialRoiPct") return finiteOrNull(r.roi.financialRoiPct);
      if (sortBy === "riskScore") return finiteOrNull(r.roi.riskScore);
      if (sortBy === "year1Salary") return finiteOrNull(r.salary?.year1?.p50);
      return finiteOrNull(r.roi.compositeScore);
    };
    return sortDir === "asc"
      ? compareNullableAsc(val(a), val(b))
      : compareNullableDesc(val(a), val(b));
  });

  const page = query.page ?? 1;
  const perPage = query.per_page ?? 20;
  const start = (page - 1) * perPage;
  return {
    data: filtered.slice(start, start + perPage),
    total: filtered.length,
    source: "mock",
  };
}
