import { NextRequest, NextResponse } from "next/server";
import { fetchBackend } from "../../../../lib/backend";
import { reportStore } from "../../../../lib/report-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token : "";
    if (!token) {
      return NextResponse.json({ error: "token required" }, { status: 400 });
    }

    const resp = await fetchBackend("/api/analyze/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      timeoutMs: 10000,
    });

    if (resp?.ok) {
      return NextResponse.json(await resp.json());
    }

    reportStore.set(token, {
      token,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      student_input: body.student_input || body.profile || {},
      results: body.results || body,
      _source: "mock",
    });

    return NextResponse.json({ status: "saved", token, _source: "serverless" });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
