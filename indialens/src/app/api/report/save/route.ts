import { NextRequest, NextResponse } from "next/server";
import { reportStore, type SavedReport } from "../../../../lib/report-store";
import { allowMockFallback } from "../../../../lib/backend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token : "";
    if (!token) {
      return NextResponse.json({ error: "token required" }, { status: 400 });
    }

    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    if (allowMockFallback()) {
      const savedRecord: SavedReport = {
        token,
        created_at: createdAt,
        expires_at: expiresAt,
        student_input: body.profile_parsed || body.student_input || {},
        results: body,
        _source: "mock",
      };
      reportStore.set(token, savedRecord);
    }

    return NextResponse.json({ status: "ok", token, expires_at: expiresAt });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
