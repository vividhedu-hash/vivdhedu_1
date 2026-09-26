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
} = {}): Promise<{ data: CollegeDegreeRecord[]; total: number; source: "database" | "mock" }> {
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

  return applyMockFilters(query);
}

export async function fetchCollegeById(
  id: string,
): Promise<{ record: CollegeDegreeRecord; source: "database" | "mock" } | null> {
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

  const record = MOCK_DATA.find((r) => r.id === id);
  return record ? { record, source: "mock" } : null;
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
