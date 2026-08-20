import { NextRequest, NextResponse } from "next/server";
import { reportStore } from "../../../../lib/report-store";
import { fetchBackend, unavailablePayload } from "../../../../lib/backend";

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  const { token } = params;

  const cached = reportStore.get(token);
  if (cached) {
    return NextResponse.json(cached);
  }

  const resp = await fetchBackend(`/api/analyze/report/${encodeURIComponent(token)}`, {
    timeoutMs: 5000,
  });
  if (resp?.ok) {
    return NextResponse.json(await resp.json());
  }
  if (resp?.status === 404) {
    return NextResponse.json({ error: "Report not found or expired" }, { status: 404 });
  }

  return NextResponse.json(unavailablePayload("Report service unavailable"), { status: 503 });
}
