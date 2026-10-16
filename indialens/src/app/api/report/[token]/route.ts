import { NextRequest, NextResponse } from "next/server";
import { reportStore } from "../../../../lib/report-store";
import { fetchBackend } from "../../../../lib/backend";

export const dynamic = "force-dynamic";

function toClientReport(payload: Record<string, unknown>, token: string) {
  const results =
    payload.results && typeof payload.results === "object"
      ? payload.results
      : payload;
  return {
    token: payload.token ?? token,
    created_at: payload.created_at ?? payload.generated_at ?? null,
    expires_at: payload.expires_at ?? null,
    student_input: payload.student_input ?? payload.profile_parsed ?? payload.profile_data ?? {},
    results,
    recommendations: payload.recommendations,
    pathways: payload.pathways,
    model_version: payload.model_version,
    generated_at: payload.generated_at ?? payload.created_at,
    _source: payload._source ?? "database",
  };
}

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  const { token } = params;

  const cached = reportStore.get(token);
  if (cached) {
    return NextResponse.json(cached);
  }

  const resp = await fetchBackend(`/api/analyze/report/${encodeURIComponent(token)}`, {
    timeoutMs: 8000,
  });
  if (resp?.ok) {
    const payload = (await resp.json()) as Record<string, unknown>;
    const savedReport = toClientReport(payload, token);
    reportStore.set(token, savedReport);
    return NextResponse.json(savedReport);
  }
  if (resp?.status === 404) {
    return NextResponse.json({ error: "Report not found or expired" }, { status: 404 });
  }

  return NextResponse.json({ error: "Report not found or expired" }, { status: 404 });
}
