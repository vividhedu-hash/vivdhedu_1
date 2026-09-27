import { NextResponse } from "next/server";
import { fetchBackend } from "../../../lib/backend";

export const dynamic = "force-dynamic";

/**
 * Public data-correction intake.
 *
 * The working recorder is POST /api/admin/feedback, which does not require an
 * admin key. The catch-all /api/admin proxy does require one, so educator
 * corrections cannot go through it. This route is the public door.
 *
 * It fails closed. A timeout is a 503, not a "received" the student can trust.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const resp = await fetchBackend("/api/admin/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    timeoutMs: 8_000,
  });

  if (!resp) {
    return NextResponse.json(
      {
        error: "backend_unavailable",
        _source: "unavailable",
        message: "The correction was not saved. Submit it again when the service responds.",
      },
      { status: 503 },
    );
  }

  const text = await resp.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: resp.status });
  } catch {
    return new NextResponse(text, { status: resp.status });
  }
}
