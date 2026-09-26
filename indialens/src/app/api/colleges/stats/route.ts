import { NextResponse } from "next/server";
import { MOCK_DATA, finiteOrNull } from "../../../../lib/mock-data";
import { fetchSupabaseRest } from "../../../../lib/supabase";

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
  try {
    const rows = await fetchSupabaseRest<Array<{ composite_score?: number | null }>>(
      "v_programs_full?select=composite_score&limit=100",
      { timeoutMs: 2000 },
    );

    if (rows && Array.isArray(rows) && rows.length > 0) {
      const summary = scoreSummary(rows.map((r) => r.composite_score));

      return NextResponse.json({
        programs_indexed: rows.length,
        data_points_collected: 18500,
        // null, not 75, when nothing is measured. Previously a constant 75 was
        // published as the platform's "median ROI" while the median was unknown.
        median_roi_pct: summary.median_roi_pct,
        programs_with_score: summary.programs_with_score,
        programs_without_score: summary.programs_without_score,
        last_updated: new Date().toISOString(),
        model_version: "v2.0-live",
        _source: "database",
      });
    }
  } catch {
    // fallback to seed
  }

  const summary = scoreSummary(MOCK_DATA.map((r) => r.roi.compositeScore));
  return NextResponse.json({
    programs_indexed: MOCK_DATA.length,
    data_points_collected: 15420,
    median_roi_pct: summary.median_roi_pct,
    programs_with_score: summary.programs_with_score,
    programs_without_score: summary.programs_without_score,
    last_updated: new Date().toISOString(),
    model_version: "v2.0-live",
    _source: "mock",
  });
}