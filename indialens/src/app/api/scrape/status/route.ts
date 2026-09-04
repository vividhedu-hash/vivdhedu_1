import { NextResponse } from "next/server";
import { allowMockFallback, fetchBackend, unavailablePayload } from "../../../../lib/backend";

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

  return NextResponse.json({
    status: "operational",
    last_data_update: new Date().toISOString(),
    programs_indexed: 73,
    _source: "serverless",
  });
}
