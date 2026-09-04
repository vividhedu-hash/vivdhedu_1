import { NextRequest, NextResponse } from "next/server";
import { reportStore } from "../../../../lib/report-store";
import { fetchBackend } from "../../../../lib/backend";
import { fetchSupabaseRest } from "../../../../lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  const { token } = params;

  // 1. Fast in-memory check
  const cached = reportStore.get(token);
  if (cached) {
    return NextResponse.json(cached);
  }

  // 2. Query Supabase database for persistent student reports
  try {
    const rows = await fetchSupabaseRest<any[]>(
      `student_reports?token=eq.${encodeURIComponent(token)}&limit=1`,
      { timeoutMs: 3000 },
    );
    if (rows && Array.isArray(rows) && rows.length > 0) {
      const row = rows[0];
      const savedReport = {
        token: row.token,
        created_at: row.generated_at,
        expires_at: row.expires_at,
        student_input: row.profile_data,
        results: row.results_data,
        _source: "database" as const,
      };

      // Cache locally in this lambda
      reportStore.set(token, savedReport);

      // Asynchronously bump view count
      fetchSupabaseRest(`student_reports?token=eq.${encodeURIComponent(token)}`, {
        method: "PATCH",
        body: JSON.stringify({ viewed_count: (row.viewed_count || 0) + 1 }),
      }).catch(() => null);

      return NextResponse.json(savedReport);
    }
  } catch {
    // Supabase query failed, fall through to backend/fallback
  }

  // 3. Fallback to secondary backend if configured
  const resp = await fetchBackend(`/api/analyze/report/${encodeURIComponent(token)}`, {
    timeoutMs: 1500,
  });
  if (resp?.ok) {
    return NextResponse.json(await resp.json());
  }

  return NextResponse.json({ error: "Report not found or expired" }, { status: 404 });
}
