import { MOCK_DATA, type CollegeDegreeRecord } from "./mock-data";
import { allowMockFallback, fetchBackend } from "./backend";

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
    timeoutMs: 8000,
    next: { revalidate: 300 },
  });

  if (resp?.ok) {
    const json = await resp.json();
    const rows: CollegeDegreeRecord[] = Array.isArray(json.data) ? json.data : [];
    if (rows.length > 0 || !allowMockFallback()) {
      return {
        data: rows,
        total: json.total ?? rows.length,
        source: "database",
      };
    }
  }

  if (allowMockFallback()) {
    return applyMockFilters(query);
  }

  return { data: [], total: 0, source: "database" };
}

export async function fetchCollegeById(
  id: string,
): Promise<{ record: CollegeDegreeRecord; source: "database" | "mock" } | null> {
  const resp = await fetchBackend(`/api/colleges/${encodeURIComponent(id)}`, {
    timeoutMs: 8000,
    next: { revalidate: 600 },
  });

  if (resp?.ok) {
    return { record: await resp.json(), source: "database" };
  }

  if (resp?.status === 404) return null;

  if (allowMockFallback()) {
    const record = MOCK_DATA.find((r) => r.id === id);
    return record ? { record, source: "mock" } : null;
  }

  return null;
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
  filtered.sort((a, b) => {
    const val = (r: CollegeDegreeRecord) => {
      if (sortBy === "financialRoiPct") return r.roi.financialRoiPct;
      if (sortBy === "riskScore") return r.roi.riskScore;
      if (sortBy === "year1Salary") return r.salary?.year1?.p50 ?? 0;
      return r.roi.compositeScore;
    };
    return sortDir === "asc" ? val(a) - val(b) : val(b) - val(a);
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
