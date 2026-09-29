import { NextResponse } from "next/server";
import { MOCK_DATA, finiteOrNull } from "../../../../lib/mock-data";
import { fetchSupabaseRest } from "../../../../lib/supabase";
import { allowMockFallback, unavailablePayload } from "../../../../lib/backend";

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
        // REMOVED: `data_points_collected: 18500`. This was a constant on the
        // DATABASE path, so it was not a mock fallback being quarantined — it
        // was an invented number attached to a live source tag, which is the
        // worse of the two failures. It described no quantity this query
        // measures, it did not vary with the size of the table, and a client
        // rendering it next to `programs_indexed` would have shown a 100-row
        // count beside a 18,500 data-point count and called both live.
        //
        // A real count would need a second query against the fact tables, and
        // guessing which tables those are would be a guess. So the field is
        // dropped rather than approximated, and clients that want it get
        // `undefined` instead of a number that was never measured.
        //
        // Note also `programs_indexed: rows.length` is capped by `limit=100`,
        // so it is a lower bound, not the table size. It is a row count of
        // rows actually returned, which is at least true.
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
    // Supabase did not answer; fall through to the handling below.
  }

  // GUARD: local dev only. Set ALLOW_MOCK_FALLBACK=1 to keep the demo stats.
  //
  // The previous failure path returned a payload tagged
  // `model_version: "v2.0-live"` and `_source: "mock"` — computed entirely
  // from the seed array. The `model_version` string is the problem: it is the
  // one field a client is most likely to surface as proof the numbers are real,
  // and it was emitted verbatim alongside figures that came from a literal in
  // this file. It is now `v1.0-seed`, matching what `/api/colleges` already
  // uses for the same data, so no endpoint labels seed numbers "live".
  //
  // `data_points_collected: 15420` is removed rather than relabelled. It does
  // not count anything in `MOCK_DATA`; it was a number typed into this file.
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

  // Fail closed. Every field is explicitly null rather than absent or zero:
  // the index is unreachable, which is a different statement from "the index
  // is empty" and from "we measured zero ROI". `StatsBar` renders each null as
  // an em dash, so the user sees dashes and an amber SEED→unavailable state
  // rather than a confident row of numbers.
  return NextResponse.json(
    {
      programs_indexed: null,
      median_roi_pct: null,
      programs_with_score: null,
      programs_without_score: null,
      last_updated: null,
      model_version: null,
      ...unavailablePayload("Programme statistics unavailable — the database did not answer."),
    },
    { status: 503 },
  );
}
