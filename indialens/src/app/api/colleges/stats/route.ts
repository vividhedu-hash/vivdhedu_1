import { NextResponse } from "next/server";
import { MOCK_DATA, finiteOrNull } from "../../../../lib/mock-data";
import { allowMockFallback, fetchBackend, unavailablePayload } from "../../../../lib/backend";

export const dynamic = "force-dynamic";

/**
 * Median over the programs that actually have a score, plus an explicit count
 * of how many do not. Reporting a median with no coverage figure is how a
 * partial dataset silently presents itself as a complete one.
 */
function scoreSummary(raw: Array<number | null | undefined>) {
  const measured = raw
    .map(finiteOrNull)
    .filter((s): s is number => s != null)
    .sort((a, b) => a - b);
  return {
    median_roi_pct: measured.length > 0 ? measured[Math.floor(measured.length / 2)] : null,
    programs_with_score: measured.length,
    programs_without_score: raw.length - measured.length,
  };
}

export async function GET() {
  const resp = await fetchBackend("/api/colleges/stats", {
    timeoutMs: 8000,
    next: { revalidate: 120 },
  });
  if (resp?.ok) {
    return NextResponse.json(await resp.json());
  }

  if (allowMockFallback()) {
    const summary = scoreSummary(MOCK_DATA.map((r) => r.roi.compositeScore));
    return NextResponse.json({
      programs_indexed: MOCK_DATA.length,
      median_roi_pct: summary.median_roi_pct,
      programs_with_score: summary.programs_with_score,
      programs_without_score: summary.programs_without_score,
      last_updated: null,
      model_version: "v1.0-seed",
      synthetic: true,
      _source: "mock",
    });
  }

  return NextResponse.json(
    {
      programs_indexed: null,
      median_roi_pct: null,
      programs_with_score: null,
      programs_without_score: null,
      last_updated: null,
      model_version: null,
      ...unavailablePayload("Programme statistics unavailable — the analytics API did not answer."),
    },
    { status: 503 },
  );
}
