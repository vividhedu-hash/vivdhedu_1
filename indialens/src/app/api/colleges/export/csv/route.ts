/**
 * /api/colleges/export/csv — proxy for `GET /api/colleges/export/csv` (FastAPI).
 *
 * Why a proxy rather than a client-side link to the backend directly:
 *
 *  1. `FASTAPI_URL` is a *server-to-server* setting. It is frequently not
 *     reachable from the browser (a private host, a container name, a VPC
 *     address). A direct link would work in local dev and 404 for every real
 *     user.
 *  2. The backend returns a `StreamingResponse` with a CSV body. A Next route
 *     can pass that through byte-for-byte, which keeps the export honest: the
 *     bytes the user downloads are the rows the database actually produced.
 *
 * Deliberately NOT implemented here: any client-side CSV construction. The
 * whole point of the export is that it is the backend's own projection of the
 * live table. Synthesising a file in the browser from a list endpoint would
 * give the user a file that looks authoritative and is not.
 *
 * Query parameters are passed through as-is; the backend only reads `field` and
 * `state` (both optional) and filters on `p.is_active = TRUE`.
 */
import { NextResponse } from "next/server";
import { fetchBackend, getBackendUrl } from "../../../../../lib/backend";

export const dynamic = "force-dynamic";

/** Large enough for a full table; the default 8s can trip on a cold DB. */
const EXPORT_TIMEOUT_MS = 20_000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Only forward the two filters the endpoint actually supports. Anything else
  // in the query string is dropped rather than passed through, so this route
  // cannot become an open relay for arbitrary backend query parameters.
  const params = new URLSearchParams();
  for (const key of ["field", "state"] as const) {
    const value = searchParams.get(key);
    if (value) params.set(key, value);
  }
  const qs = params.toString();

  const resp = await fetchBackend(`/api/colleges/export/csv${qs ? `?${qs}` : ""}`, {
    timeoutMs: EXPORT_TIMEOUT_MS,
  });

  if (!resp) {
    // Fail loudly. The UI shows the reason rather than downloading an empty
    // file that the user would open in a spreadsheet and believe.
    return NextResponse.json(
      {
        error: "export_unavailable",
        _source: "unavailable",
        reason:
          getBackendUrl() === null
            ? "FASTAPI_URL is not configured, so the export service cannot be reached."
            : "The export service did not respond.",
      },
      { status: 503 },
    );
  }

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    let reason = `Export service returned HTTP ${resp.status}.`;
    try {
      const parsed = JSON.parse(body);
      if (parsed?.detail?.reason) reason = String(parsed.detail.reason);
      else if (parsed?.detail && typeof parsed.detail === "string") reason = parsed.detail;
    } catch {
      /* non-JSON error body; the status-derived message stands. */
    }
    return NextResponse.json(
      { error: "export_failed", reason },
      { status: resp.status },
    );
  }

  const body = await resp.arrayBuffer();
  const disposition =
    resp.headers.get("content-disposition") ??
    'attachment; filename="indialens-export.csv"';

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": resp.headers.get("content-type") ?? "text/csv; charset=utf-8",
      "Content-Disposition": disposition,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "no-store",
    },
  });
}
