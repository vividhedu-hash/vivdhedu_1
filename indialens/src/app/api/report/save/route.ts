import { NextRequest, NextResponse } from "next/server";
import { reportStore } from "../../../../lib/report-store";
import { fetchSupabaseRest } from "../../../../lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token : "";
    if (!token) {
      return NextResponse.json({ error: "token required" }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const profileData = body.student_input || body.profile || {};
    const resultsData = body.results || body;

    // Save directly to Supabase persistent table
    await fetchSupabaseRest("student_reports", {
      method: "POST",
      // See the note in api/analyze/route.ts: the token-scoped SELECT policy
      // must also match, because `Prefer: return=representation` makes
      // PostgREST read the row back after inserting it.
      reportToken: token,
      body: JSON.stringify({
        token,
        profile_data: profileData,
        results_data: resultsData,
        model_version: resultsData.model_version || "v2.0-multivector",
        generated_at: new Date().toISOString(),
        viewed_count: 0,
        expires_at: expiresAt,
      }),
    }).catch(() => null);

    // Also update in-memory cache
    reportStore.set(token, {
      token,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
      student_input: profileData,
      results: resultsData,
      _source: "database",
    });

    return NextResponse.json({ status: "saved", token, _source: "supabase" });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
