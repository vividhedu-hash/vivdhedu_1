import { NextRequest, NextResponse } from "next/server";
import { fetchBackend, unavailablePayload } from "../../../../lib/backend";

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

    const status = resp?.status && resp.status >= 400 ? resp.status : 503;
    return NextResponse.json(unavailablePayload("Could not persist report to FastAPI"), { status });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
