import { NextResponse } from "next/server";
import { allowMockFallback, fetchBackend, unavailablePayload } from "../../../../lib/backend";
import { MOCK_DATA } from "../../../../lib/mock-data";

export async function GET() {
  const [countResp, dpResp, roiResp] = await Promise.all([
    fetchBackend("/api/colleges?page=1&per_page=1"),
    fetchBackend("/api/ml/status"),
    fetchBackend("/api/colleges?page=1&per_page=100"),
  ]);

  if (countResp?.ok || dpResp?.ok || roiResp?.ok) {
    let programs_indexed = 0;
    let last_updated: string | null = null;
    let model_version = "unknown";
    let median_roi = 0;

    if (countResp?.ok) {
      const d = await countResp.json();
      programs_indexed = d.total ?? 0;
    }

    if (dpResp?.ok) {
      const d = await dpResp.json();
      last_updated = d.last_data_update ?? null;
      model_version = d.champion?.version_tag ?? model_version;
    }

    if (roiResp?.ok) {
      const d = await roiResp.json();
      const rois = (d.data ?? [])
        .map((r: { roi?: { compositeScore?: number } }) => r.roi?.compositeScore ?? 0)
        .filter(Boolean)
        .sort((a: number, b: number) => a - b);
      if (rois.length > 0) {
        median_roi = rois[Math.floor(rois.length / 2)];
        if (!programs_indexed) programs_indexed = d.total ?? rois.length;
      }
    }

    return NextResponse.json({
      programs_indexed,
      data_points_collected: programs_indexed,
      median_roi_pct: median_roi,
      last_updated,
      model_version,
      _source: "database",
    });
  }

  if (allowMockFallback()) {
    const rois = MOCK_DATA.map((r) => r.roi.compositeScore).sort((a, b) => a - b);
    return NextResponse.json({
      programs_indexed: MOCK_DATA.length,
      data_points_collected: MOCK_DATA.length,
      median_roi_pct: rois[Math.floor(rois.length / 2)],
      last_updated: null,
      model_version: "v1.0-seed",
      _source: "mock",
    });
  }

  return NextResponse.json(unavailablePayload("Stats backend unavailable"), { status: 503 });
}
