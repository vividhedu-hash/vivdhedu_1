import { NextResponse } from "next/server";
import { fetchBackend } from "../../../../../lib/backend";

export const dynamic = "force-dynamic";

/**
 * `/api/v2/career/*` — thin proxy to the FastAPI Markov career router.
 *
 * Fails closed. The model's job is to tell a student the *shape* of a career
 * distribution, and a fabricated fallback would be worse than no answer at all:
 * a stubbed "you will be a Senior by year 10" is precisely the unearned
 * certainty this endpoint exists to avoid. If FastAPI is unreachable, return a
 * 503 carrying `_source: "unavailable"` and let the page render its own error
 * state.
 *
 * The Monte-Carlo block on the backend is a ~2-10s simulation, so the budget
 * here has to be generous. The default 3s used elsewhere in this app would abort
 * every real request.
 */
const SIMULATION_TIMEOUT_MS = Number(process.env.CAREER_TIMEOUT_MS ?? 45_000);

type Params = { params: { path: string[] } };

async function proxy(request: Request, path: string[], method: "GET" | "POST") {
  const subpath = (path ?? []).join("/");
  const url = new URL(request.url);
  const body = method === "POST" ? await request.text() : undefined;

  const resp = await fetchBackend(`/api/v2/career/${subpath}${url.search}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body || undefined,
    timeoutMs: SIMULATION_TIMEOUT_MS,
  });

  if (resp) {
    const text = await resp.text();
    try {
      return NextResponse.json(JSON.parse(text), { status: resp.status });
    } catch {
      return new NextResponse(text, { status: resp.status });
    }
  }

  return NextResponse.json(
    {
      error: "backend_unavailable",
      _source: "unavailable",
      reason:
        "The career-trajectory model did not respond. It has no fallback answer " +
        "because any single number it could return here would be a guess about a " +
        "student's life.",
      detail: { subpath },
    },
    { status: 503 },
  );
}

export async function GET(request: Request, { params }: Params) {
  return proxy(request, params.path, "GET");
}

export async function POST(request: Request, { params }: Params) {
  return proxy(request, params.path, "POST");
}
