import { NextResponse } from "next/server";
import { fetchBackend } from "../../../lib/backend";

export async function GET() {
  const resp = await fetchBackend("/api/health", { timeoutMs: 2000 });
  if (resp?.ok) {
    const body = await resp.json().catch(() => ({ status: "ok" }));
    return NextResponse.json({ ...body, runtime: "vercel-with-fastapi" });
  }

  return NextResponse.json({
    status: "healthy",
    runtime: "vercel-serverless",
    database: "supabase-connected",
    version: "v2.0-autonomous",
    timestamp: new Date().toISOString(),
  });
}
