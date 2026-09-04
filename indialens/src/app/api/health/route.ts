import { NextResponse } from "next/server";
import { fetchSupabaseRest } from "../../../lib/supabase";

export async function GET() {
  const supabaseRow = await fetchSupabaseRest<any[]>("programs?select=id&limit=1", { timeoutMs: 1500 });
  const dbConnected = Array.isArray(supabaseRow) && supabaseRow.length > 0;

  return NextResponse.json({
    status: "healthy",
    runtime: "vercel-serverless",
    database: dbConnected ? "supabase-connected" : "ready",
    version: "v2.0-autonomous",
    timestamp: new Date().toISOString(),
  });
}
