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
import { fetchBackend, getBackendUrl, proxyRequestHeaders } from "../../../../lib/backend";
import { geminiConfigured, geminiGenerate } from "../../../../lib/gemini-direct";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Must exceed the backend's own LLM ceiling (45s in gemini_grounded.generate).
 * Vercel's default function limit is 10s on Hobby; the request budget is set
 * here and surfaced in the 503 body so a timeout is diagnosable.
 */
const AI_TIMEOUT_MS = Number(process.env.AI_PROXY_TIMEOUT_MS ?? 120_000);

function hasBackendConfigured(): boolean {
  return getBackendUrl() !== null;
}
async function proxy(request: Request, path: string[], method: string) {
  const subpath = (path ?? []).join("/");
  const url = new URL(request.url);
  const qs = url.search;
  const headers = proxyRequestHeaders(request);

  const body = method === "GET" || method === "HEAD" ? undefined : await request.text();

  // FastAPI is not running locally (Python 3.8-32 cannot boot the full stack).
  // Probe health in <1s so Gemini can answer without waiting the 120s LLM budget.
  if (subpath.startsWith("ai/")) {
    const health = await fetchBackend("/health", { timeoutMs: 800 });
    if (!health) {
      const geminiLive = await tryGeminiDirect(subpath, method, body);
      if (geminiLive) return geminiLive;
    }
  }

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

  // FastAPI is down. Gemini can still answer advisor/mode from this BFF
  // (server-side key only). Other v1 paths stay fail-closed.
  const geminiLive = await tryGeminiDirect(subpath, method, body);
  if (geminiLive) return geminiLive;

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

async function tryGeminiDirect(
  subpath: string,
  method: string,
  body: string | undefined,
): Promise<NextResponse | null> {
  if (subpath === "ai/status" && method === "GET") {
    const configured = geminiConfigured();
    const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.length > 10);
    return NextResponse.json({
      engine: configured
        ? hasOpenRouter
          ? process.env.OPENROUTER_PRIMARY_MODEL || "thinkingmachines/inkling:free"
          : process.env.GEMINI_MODEL || "gemma-4-26b-a4b-it"
        : "",
      mode: hasOpenRouter ? "openrouter" : "gemini",
      grounding: configured ? "tavily_search" : "none",
      configured,
      engines: { gemini: Boolean(process.env.GEMINI_API_KEY), openrouter: hasOpenRouter },
      models: {
        primary: process.env.OPENROUTER_PRIMARY_MODEL || "thinkingmachines/inkling:free",
        fallback: process.env.OPENROUTER_FALLBACK_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free",
      },
      _source: hasOpenRouter ? "openrouter-direct" : "gemini-direct",
    });
  }

  if (!geminiConfigured()) return null;

  if (subpath === "ai/mode" && method === "POST") {
    let parsed: { query?: string; context?: unknown; person_context?: string } = {};
    try {
      if (body) parsed = JSON.parse(body);
    } catch {
      parsed = {};
    }
    const query = (parsed.query || "").trim();
    if (query.length < 3) {
      return NextResponse.json(
        { error: "query_required", reason: "Ask a question of at least 3 characters." },
        { status: 400 },
      );
    }
    try {
      const extra = parsed.context
        ? `\nStudent context (user-stated): ${JSON.stringify(parsed.context)}\n`
        : "";
      const person = parsed.person_context
        ? `\nPERSON MEMORY:\n${parsed.person_context}\n`
        : "";
      const answer = await geminiGenerate(
        `Answer this India higher-education / career question with live web evidence.

Question: ${query}
${extra}${person}
Structure:
- Direct answer (2–6 sentences)
- What is verified vs unverified
- What the student should do next (max 3 bullets)
Cite sources. Do not invent ranks, fees, or CTC.`,
        { personContext: parsed.person_context },
      );
      return NextResponse.json(answer);
    } catch (err) {
      const status = (err as { status?: number }).status || 502;
      return NextResponse.json(
        {
          error: "gemini_unavailable",
          reason: err instanceof Error ? err.message : "Gemini request failed",
          _source: "gemini-direct",
        },
        { status },
      );
    }
  }

  if (subpath === "ai/advisor" && method === "POST") {
    let parsed: {
      total_budget?: number;
      target_field?: string;
      risk_tolerance?: string;
      preferred_cities?: string[];
      question?: string;
      person_context?: string;
    } = {};
    try {
      if (body) parsed = JSON.parse(body);
    } catch {
      parsed = {};
    }
    const field = parsed.target_field || "engineering-cs";
    const budget = parsed.total_budget ?? 10;
    const risk = parsed.risk_tolerance || "medium";
    const cities = (parsed.preferred_cities || []).join(", ") || "Bengaluru, NCR";
    const question =
      parsed.question ||
      "Provide an actuarial analysis of my choices and the highest risk-adjusted path.";
    try {
      const answer = await geminiGenerate(
        `Student profile:
- Budget: ₹${budget} lakh
- Target field: ${field}
- Risk tolerance: ${risk}
- Preferred cities: ${cities}

Student question: ${question}

Provide a structured fiduciary analysis:
1. Downside and solvency
2. Contradictions vs stated risk
3. Single highest risk-adjusted recommendation
4. Three concrete next actions for 90 days
Cite sources. Do not invent ranks, fees, or CTC.`,
        { personContext: parsed.person_context },
      );
      return NextResponse.json({
        ...answer,
        summary: answer.text.slice(0, 320),
        model: answer.engine,
      });
    } catch (err) {
      const status = (err as { status?: number }).status || 502;
      return NextResponse.json(
        {
          error: "gemini_unavailable",
          reason: err instanceof Error ? err.message : "Gemini request failed",
          _source: "gemini-direct",
        },
        { status },
      );
    }
  }

  return null;
}

export async function GET(request: Request, { params }: { params: { path: string[] } }) {
  return proxy(request, params.path, "GET");
}

export async function POST(request: Request, { params }: { params: { path: string[] } }) {
  return proxy(request, params.path, "POST");
}
