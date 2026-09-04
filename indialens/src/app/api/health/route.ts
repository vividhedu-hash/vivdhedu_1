import { NextResponse } from "next/server";
import { fetchBackend, unavailablePayload } from "../../../lib/backend";

export async function GET() {
  const resp = await fetchBackend("/api/health", { timeoutMs: 5000 });
  if (!resp) {
    return NextResponse.json(unavailablePayload("FastAPI is unreachable"), { status: 503 });
  }
  const body = await resp.json().catch(() => unavailablePayload("Invalid health payload"));
  return NextResponse.json(body, { status: resp.status });
}
