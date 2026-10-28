import { MOCK_DATA, type CollegeDegreeRecord, finiteOrNull, compareNullableAsc, compareNullableDesc } from "./mock-data";
import { allowCataloguePostgrest, allowMockFallback, fetchBackend } from "./backend";
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

const FASTAPI_CATALOGUE_TIMEOUT_MS = Number(process.env.CATALOGUE_TIMEOUT_MS ?? 8_000);

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

export type CollegeQueryParams = {
  page?: number;
  per_page?: number;
  field?: string | null;
  tier?: string | null;
  state?: string | null;
  search?: string | null;
  sort_by?: string | null;
  sort_dir?: string | null;
};

export function mapCollegeSort(sortBy?: string | null): string {
  if (!sortBy) return "composite_score";
  return SORT_MAP[sortBy] ?? "composite_score";
}

function catalogueParams(query: CollegeQueryParams = {}): URLSearchParams {
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
  return params;
}

async function fetchListFromFastApi(query: CollegeQueryParams = {}): Promise<CollegeListResult | null> {
  const resp = await fetchBackend(`/api/colleges?${catalogueParams(query)}`, {
    timeoutMs: FASTAPI_CATALOGUE_TIMEOUT_MS,
    next: { revalidate: 300 },
  });
  if (!resp?.ok) return null;

  const json = await resp.json();
  // Rows from the FastAPI list endpoint are already in `CollegeDegreeRecord`
  // shape. An empty array is a real, measured index — not a reason to fall
  // through to PostgREST or seed data.
  const rows: CollegeDegreeRecord[] = Array.isArray(json.data) ? json.data : [];
  return {
    data: rows,
    total: typeof json.total === "number" ? json.total : rows.length,
    source: "database",
  };
}

async function fetchListFromPostgrest(query: CollegeQueryParams = {}): Promise<CollegeListResult | null> {
  if (!allowCataloguePostgrest()) return null;

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
  if (!rows || !Array.isArray(rows) || rows.length === 0) return null;

  const perPage = query.per_page ?? 20;
  const offset = ((query.page ?? 1) - 1) * perPage;
  return {
    data: rows.map(mapSupabaseRowToRecord),
    total: offset + rows.length,
    source: "database",
  };
}

export async function fetchCollegeList(query: CollegeQueryParams = {}): Promise<CollegeListResult> {
  // 1. FastAPI is the only production catalogue. Empty results stay empty.
  try {
    const fromApi = await fetchListFromFastApi(query);
    if (fromApi) return fromApi;
  } catch {
    // Fall through to the explicit opt-in PostgREST break-glass, then mock.
  }

  // 2. Break-glass PostgREST — only when ALLOW_CATALOGUE_POSTGREST=1.
  try {
    const fromRest = await fetchListFromPostgrest(query);
    if (fromRest) return fromRest;
  } catch {
    // continue
  }

  if (allowMockFallback()) {
    return applyMockFilters(query);
  }

  return {
    data: [],
    total: null,
    source: "unavailable",
    reason:
      "The programme index is unreachable. The analytics API did not answer, and seed data is disabled in this environment.",
  };
}

export async function fetchCollegeById(id: string): Promise<CollegeDetailResult> {
  const resp = await fetchBackend(`/api/colleges/${encodeURIComponent(id)}`, {
    timeoutMs: FASTAPI_CATALOGUE_TIMEOUT_MS,
    next: { revalidate: 600 },
  });

  if (resp?.ok) {
    return { record: await resp.json(), source: "database" };
  }
  if (resp?.status === 404) {
    return { record: null, source: "not_found" };
  }

  if (allowCataloguePostgrest()) {
    try {
      const rows = await fetchSupabaseRest<SupabaseProgramRow[]>(
        `v_programs_full?program_id=eq.${encodeURIComponent(id)}&limit=1`,
        { timeoutMs: 3000 },
      );
      if (rows && Array.isArray(rows) && rows.length > 0) {
        return { record: mapSupabaseRowToRecord(rows[0]), source: "database" };
      }
      if (rows && Array.isArray(rows) && rows.length === 0) {
        return { record: null, source: "not_found" };
      }
    } catch {
      // continue
    }
  }

  if (allowMockFallback()) {
    const record = MOCK_DATA.find((r) => r.id === id);
    if (record) return { record, source: "mock" };
    return { record: null, source: "not_found" };
  }

  return {
    record: null,
    source: "unavailable",
    reason:
      "This programme could not be loaded. The analytics API did not answer, and seed data is disabled in this environment.",
  };
}

function applyMockFilters(query: CollegeQueryParams = {}): { data: CollegeDegreeRecord[]; total: number; source: "mock" } {
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
