import { NextResponse } from "next/server";
import { searchWithSonar, SonarUnavailable } from "../../../../lib/sonar-search";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();

function allowed(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allowed(ip)) {
    return NextResponse.json(
      { error: "rate_limited", reason: "Too many live searches. Wait a minute and try again." },
      { status: 429 },
    );
  }

  let query = "";
  try {
    const body = (await request.json()) as { query?: unknown };
    query = typeof body.query === "string" ? body.query.trim() : "";
  } catch {
    query = "";
  }

  if (query.length < 3 || query.length > 200) {
    return NextResponse.json(
      { error: "bad_query", reason: "Enter at least 3 characters to search live sources." },
      { status: 400 },
    );
  }

  try {
    const result = await searchWithSonar(query);
    return NextResponse.json({ ...result, grounded: true });
  } catch (err) {
    if (err instanceof SonarUnavailable) {
      const missing = err.message.includes("OPENROUTER_API_KEY");
      return NextResponse.json(
        {
          error: "sonar_unavailable",
          reason: missing
            ? "Live sources are not available for this search right now."
            : "Live sources could not be retrieved for this search.",
          detail: err.message,
        },
        { status: err.status },
      );
    }
    return NextResponse.json(
      { error: "sonar_unavailable", reason: "Live sources could not be retrieved for this search." },
      { status: 502 },
    );
  }
}
