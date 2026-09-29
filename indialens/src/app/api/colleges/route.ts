import { NextResponse } from "next/server";
import { fetchCollegeList } from "../../../lib/live-colleges";
import { unavailablePayload } from "../../../lib/backend";

/**
 * List endpoint.
 *
 * The seed-data gate lives in `fetchCollegeList` (see `lib/live-colleges.ts`),
 * not here — this route only has to propagate the verdict. What changed is the
 * status code: an unavailable index is now a 503, not a 200 carrying an empty
 * `data` array.
 *
 * The reason is that every client of this endpoint is a fetch whose failure
 * path already exists. `useColleges` throws on `!resp.ok` and `explore/page.tsx`
 * sets `loadError`, so a 503 routes them to the real "index could not be
 * loaded" state. A 200 with `data: []` would instead have rendered the
 * "no programmes match these filters" empty state, which asserts that the
 * index loaded successfully and that nothing in it matched — the exact
 * misreading `EmptyState`'s own docstring warns against.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const perPage = parseInt(searchParams.get("per_page") ?? "50", 10);

  const result = await fetchCollegeList({
    page,
    per_page: perPage,
    field: searchParams.get("field"),
    tier: searchParams.get("tier"),
    state: searchParams.get("state"),
    search: searchParams.get("search"),
    sort_by: searchParams.get("sort_by"),
    sort_dir: searchParams.get("sort_dir"),
  });

  if (result.source === "unavailable") {
    return NextResponse.json(unavailablePayload(result.reason), { status: 503 });
  }

  return NextResponse.json({
    data: result.data,
    total: result.total,
    page,
    per_page: perPage,
    model_version: result.source === "mock" ? "v1.0-seed" : undefined,
    generated_at: new Date().toISOString(),
    _source: result.source,
  });
}
