import { NextResponse } from "next/server";
import { allowMockFallback, fetchBackend, unavailablePayload } from "../../../../lib/backend";

/**
 * Model + index health.
 *
 * Three states, and the third one used to be missing:
 *
 *   1. Backend answered  -> real figures from the database.
 *   2. Backend down, mocks permitted -> seed figures, tagged `_source: "serverless"`.
 *   3. Backend down, mocks forbidden  -> HTTP 503 and an explicit `unavailable`.
 *
 * State 3 is the one this route is now honest about. The previous version had
 * no third state: any failure at all returned
 *
 *     status: "operational",
 *     last_data_update: new Date().toISOString(),
 *     programs_indexed: 73,
 *
 * `new Date()` is the time the *request* was served, not the time anything was
 * scraped, so the field it fed was a heartbeat for the endpoint rather than a
 * claim about the data — and it was labelled as though it were the latter.
 * `programs_indexed: 73` was a constant, and the page that consumes this
 * renders it as "N programmes indexed" with a green dot, so a dead backend
 * produced a status bar indistinguishable from a healthy one.
 *
 * Note that `unavailablePayload()` is imported but not used here: its shape is
 * `{ error, _source }`, and this endpoint's consumer (`useModelStatus`) reads
 * `status` and `programs_indexed`. Returning it would leave those undefined,
 * which `?? 0` would then render as a real zero. So the unavailable payload is
 * built explicitly here, with both fields present and explicitly empty.
 */

export async function GET() {
  const resp = await fetchBackend("/api/ml/status", { timeoutMs: 5000 });
  if (resp?.ok) {
    const data = await resp.json();
    return NextResponse.json({
      status: data.model_health ?? "ok",
      last_data_update: data.last_data_update ?? null,
      programs_indexed: data.programs_indexed ?? 0,
      champion: data.champion ?? null,
      _source: "database",
    });
  }

  // GUARD: local dev only. Set ALLOW_MOCK_FALLBACK=1 to keep the demo
  // dataset here; production fails closed at the branch below.
  if (allowMockFallback()) {
    return NextResponse.json({
      status: "seed_mode",
      // Deliberately NOT a timestamp. We do not know when anything was last
      // scraped, and the previous `new Date().toISOString()` claimed the time
      // of this request was the freshness of the data.
      last_data_update: null,
      programs_indexed: 73,
      synthetic: true,
      _source: "serverless",
    });
  }

  // Fail closed. `programs_indexed: null` and `last_data_update: null` are the
  // honest readings: unknown, not zero and not now. `_source: "unavailable"`
  // is what downstream code tests for, distinct from both "database" and the
  // mock sources.
  return NextResponse.json(
    {
      status: "unavailable",
      last_data_update: null,
      programs_indexed: null,
      champion: null,
      ...unavailablePayload("Model status unavailable — the backend did not answer."),
    },
    { status: 503 },
  );
}
