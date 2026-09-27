/**
 * POST /api/waitlist — Next.js BFF proxy to FastAPI's /api/waitlist.
 *
 * This is the only way the browser reaches the waitlist table. Two reasons it
 * is proxied rather than written to Supabase directly from the client:
 *
 *   1. The anon key ships in the client bundle, and the anon key must not be
 *      able to read a lead list. Migration 0003 enables RLS on
 *      `waitlist_signups` with no anon/authenticated policy, so a direct
 *      PostgREST write would be rejected and a direct read would return zero
 *      rows. service_role (the backend) bypasses RLS.
 *   2. The endpoint needs the shared slowapi limiter and the PII-safe logging
 *      that lives in the backend.
 *
 * The rate limit is applied HERE as well as in the backend. The backend limit
 * is per-process in-memory and is an abuse backstop, not a security control;
 * a second limiter in the edge/BFF layer holds even when the API is running
 * with multiple workers.
 */
import { NextResponse } from "next/server";
import { fetchBackend, getBackendUrl } from "../../../lib/backend";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const hits = new Map<string, number[]>();

function allowed(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allowed(ip)) {
    return NextResponse.json(
      {
        error: "rate_limited",
        reason: "Too many signup attempts. Wait a minute and try again.",
      },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "bad_request", reason: "Send a JSON body." },
      { status: 400 },
    );
  }

  // Shape-check here as well as in the backend. This is a cheap guard so a
  // malformed client payload never becomes a backend round-trip; the backend's
  // own pydantic model is still the authority.
  if (typeof body.email !== "string" || !body.email.includes("@")) {
    return NextResponse.json(
      { error: "invalid_email", reason: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const resp = await fetchBackend("/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    timeoutMs: 6000,
  });

  if (resp) {
    const text = await resp.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }

    if (resp.ok) {
      return NextResponse.json(parsed ?? { status: "ok" });
    }

    // Surface the backend's reason so the form can show something useful, but
    // never its raw internals.
    const detail =
      parsed && typeof parsed === "object" && "detail" in parsed
        ? (parsed as { detail?: unknown }).detail
        : null;
    const reason =
      detail && typeof detail === "object" && "reason" in detail
        ? String((detail as { reason?: unknown }).reason)
        : "Could not record the signup. Try again in a moment.";

    return NextResponse.json({ error: "signup_failed", reason }, { status: resp.status });
  }

  // ── Degrade, don't 500 ───────────────────────────────────────────────────
  // The backend is unreachable. Telling the user "something broke" after they
  // just typed their address is the worst outcome available, so we return a
  // retryable response with the address echoed back and let the form offer
  // the fallback contact path. We do NOT report success: that would be a
  // fabricated confirmation for a signup that was never stored.
  const configured = getBackendUrl() !== null;
  return NextResponse.json(
    {
      error: "backend_unavailable",
      reason: configured
        ? "We could not reach the signup service. Please try again, or email us instead."
        : "Signups are not configured right now. Please email us instead.",
      email: typeof body.email === "string" ? body.email : null,
      _source: "unavailable",
    },
    { status: 503 },
  );
}
