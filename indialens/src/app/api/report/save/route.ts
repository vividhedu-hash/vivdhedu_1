import { NextRequest, NextResponse } from "next/server";
import { fetchBackend, proxyRequestHeaders, unavailablePayload } from "../../../../lib/backend";

/**
 * Persist a shareable report through FastAPI. The browser no longer INSERTs
 * into student_reports with the anon key — that was a competing write path
 * beside `/api/analyze/save`, and RLS had to special-case it.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token : "";
    if (!token) {
      return NextResponse.json({ error: "token required" }, { status: 400 });
    }

    const headers = proxyRequestHeaders(request);
    headers["Content-Type"] = "application/json";

    const persist = await fetchBackend("/api/analyze/save", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      timeoutMs: 8000,
    });
    if (!persist?.ok) {
      return NextResponse.json(
        unavailablePayload("Could not save the report. The analytics API did not accept the write."),
        { status: persist?.status && persist.status >= 400 ? persist.status : 503 },
      );
    }

    if (headers.Authorization && body.token) {
      await fetchBackend("/api/v1/auth/save-report", {
        method: "POST",
        headers,
        body: JSON.stringify({
          report_token: token,
          title: body.title || "Degree ROI Analysis",
        }),
        timeoutMs: 8000,
      }).catch(() => null);
    }

    const saved = await persist.json().catch(() => ({ status: "saved", token }));
    return NextResponse.json({ ...saved, token, _source: "database" });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
