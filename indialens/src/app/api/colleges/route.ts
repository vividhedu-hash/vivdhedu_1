import { NextResponse } from "next/server";
import { allowMockFallback, getBackendUrl, unavailablePayload } from "../../../lib/backend";
import { fetchCollegeList } from "../../../lib/live-colleges";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const result = await fetchCollegeList({
    page: parseInt(searchParams.get("page") ?? "1", 10),
    per_page: parseInt(searchParams.get("per_page") ?? "50", 10),
    field: searchParams.get("field"),
    tier: searchParams.get("tier"),
    state: searchParams.get("state"),
    search: searchParams.get("search"),
    sort_by: searchParams.get("sort_by"),
    sort_dir: searchParams.get("sort_dir"),
  });

  return NextResponse.json({
    data: result.data,
    total: result.total,
    page: parseInt(searchParams.get("page") ?? "1", 10),
    per_page: parseInt(searchParams.get("per_page") ?? "50", 10),
    model_version: result.source === "mock" ? "v1.0-seed" : undefined,
    generated_at: new Date().toISOString(),
    _source: result.source,
  });
}
