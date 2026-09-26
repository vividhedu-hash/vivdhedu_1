/**
 * /api/v1/* — thin proxy to FastAPI. Fails closed.
 *
 * This route used to carry ~360 lines of "autonomous serverless" handlers that
 * returned hardcoded answers whenever the backend was slow. Combined with a
 * 1200ms timeout — shorter than any grounded LLM call — it meant the fabricated
 * branch was the ONLY branch production ever took. That output included invented
 * CTC/payback figures presented as verified, a `persisted: true` flag for
 * intelligence that was never written, and a hardcoded signed-in identity
 * (`student@theproject.in`) returned to every caller of /auth/me.
 *
 * All of that is gone. If FastAPI is unreachable or slow, we return 503 and the
 * UI shows its existing error state. No invented data.
 */
import { NextResponse } from "next/server";
import { fetchBackend, getBackendUrl } from "../../../../lib/backend";

export const dynamic = "force-dynamic";

/**
 * Must exceed the backend's own LLM ceiling (45s in gemini_grounded.generate).
 * Vercel's default function limit is 10s on Hobby; the request budget is set
 * here and surfaced in the 503 body so a timeout is diagnosable.
 */
const AI_TIMEOUT_MS = Number(process.env.AI_PROXY_TIMEOUT_MS ?? 60_000);

function hasBackendConfigured(): boolean {
  return getBackendUrl() !== null;
}
async function proxy(request: Request, path: string[], method: string) {
  const subpath = (path ?? []).join("/");
  const url = new URL(request.url);
  const qs = url.search;
  const headers: Record<string, string> = {};
  const contentType = request.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;
  const apiKey = request.headers.get("x-api-key");
  if (apiKey) headers["X-API-KEY"] = apiKey;

  const body = method === "GET" || method === "HEAD" ? undefined : await request.text();

  // Timeout must exceed the backend's own ceiling. A Search-grounded LLM call
  // takes 5-45s (see services/gemini_grounded.py: timeout=45.0). The old 1200ms
  // budget meant fetchBackend ALWAYS aborted and ALWAYS fell through to the
  // hardcoded block below, so no AI response was ever reachable in production.
  const resp = await fetchBackend(`/api/v1/${subpath}${qs}`, {
    method,
    headers,
    body: body || undefined,
    timeoutMs: AI_TIMEOUT_MS,
  });

  if (resp) {
    const text = await resp.text();
    try {
      return NextResponse.json(JSON.parse(text), { status: resp.status });
    } catch {
      return new NextResponse(text, { status: resp.status });
    }
  }

  // ── Fail closed ──────────────────────────────────────────────────────────
  // The backend is the only source of truth for AI output, auth identity, and
  // job-market telemetry. Returning invented answers here is worse than an
  // error: it presented fabricated CTC/payback figures and a hardcoded user
  // identity as live results. We surface a 503 and let the UI show its
  // existing "engine not configured" / error state.
  const configured = hasBackendConfigured();
  return NextResponse.json(
    {
      error: "backend_unavailable",
      _source: "unavailable",
      reason: configured
        ? `FastAPI did not respond within ${AI_TIMEOUT_MS}ms.`
        : "FASTAPI_URL is not set, so no backend can be reached.",
      detail: {
        error: "backend_unavailable",
        _source: "unavailable",
        reason: configured
          ? `FastAPI did not respond within ${AI_TIMEOUT_MS}ms.`
          : "FASTAPI_URL is not set, so no backend can be reached.",
        subpath,
      },
    },
    { status: 503 },
  );
}

export async function GET(request: Request, { params }: { params: { path: string[] } }) {
  return proxy(request, params.path, "GET");
}

export async function POST(request: Request, { params }: { params: { path: string[] } }) {
  return proxy(request, params.path, "POST");
}
