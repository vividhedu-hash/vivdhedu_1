/**
 * Single place for talking to FastAPI.
 *
 * Production fails closed: if FASTAPI_URL is missing or the backend is down,
 * callers get null / 503 instead of seed data dressed up as live results.
 *
 * Local demo: mock fallback is on unless ALLOW_MOCK_FALLBACK=0.
 * Production: mock fallback is off unless ALLOW_MOCK_FALLBACK=1.
 */

export type FetchBackendInit = RequestInit & {
  timeoutMs?: number;
  next?: { revalidate?: number | false };
};

export function getBackendUrl(): string | null {
  const url = (process.env.FASTAPI_URL || process.env.API_BASE_URL || "").replace(/\/$/, "");
  if (url) return url;
  if (process.env.NODE_ENV !== "production") return "http://localhost:8000";
  return null;
}

/**
 * The single switch that decides whether synthetic data may stand in for a
 * failed fetch.
 *
 * The contract, which the docstring above has always claimed and the body
 * never implemented:
 *
 *   - Local dev: mocks on unless `ALLOW_MOCK_FALLBACK=0`.
 *   - Production: mocks OFF unless `ALLOW_MOCK_FALLBACK=1`.
 *
 * The previous body only ever checked for the literal "0". That made the
 * default "allow", so a production deploy with the variable unset — the most
 * common way for it to be unset, since an unset server-side env var is not a
 * failure — served seed data through every guarded path. The `"0"` was the
 * only value that did anything, which is why the flag read as decorative.
 *
 * In production the burden of proof is on showing the data: opting in to
 * fabricated figures has to be a deliberate act, and a deploy that forgets the
 * variable gets an honest error page rather than a healthy-looking lie.
 */
export function allowMockFallback(): boolean {
  if (process.env.ALLOW_MOCK_FALLBACK === "1") return true;
  if (process.env.ALLOW_MOCK_FALLBACK === "0") return false;
  return process.env.NODE_ENV !== "production";
}

export async function fetchBackend(
  path: string,
  init: FetchBackendInit = {},
): Promise<Response | null> {
  const base = getBackendUrl();
  if (!base) return null;

  const { timeoutMs = 8000, next, ...rest } = init;
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    return await fetch(url, {
      ...rest,
      signal: rest.signal ?? AbortSignal.timeout(timeoutMs),
      ...(next ? { next } : {}),
    });
  } catch {
    return null;
  }
}

export function unavailablePayload(message = "Backend unavailable") {
  return { error: message, _source: "unavailable" as const };
}
