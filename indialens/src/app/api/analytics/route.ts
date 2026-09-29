import { NextResponse } from "next/server";
import { fetchBackend } from "../../../lib/backend";

/**
 * Thin proxy to the FastAPI analytics engines. Fails closed.
 *
 * This route used to carry four hand-written mock payloads behind a failed
 * backend call. Each one was confidently shaped and numerically specific:
 *
 *   mobility        → chetty_mobility_score 84.5, access 45.0%, success 68.0%,
 *                     quintile transition 58.2%, rating "Demo (local mock)"
 *   monte_carlo     → percentiles at 1.1x / 1.4x / 1.8x / 2.3x / 3.1x of the
 *                     input salary, VaR at 1.5x cost, 4.2% negative-ROI
 *   skill_velocity  → complementarity 88, automation risk 24, two skills
 *   dcf (default)   → npv = salary × 8.5 − cost, IRR 22.4%
 *
 * Only the `_source: "mock"` marker and, for two of them, a "Demo (local
 * mock)" label distinguished them — so a student saw a fabricated 84.5
 * mobility score presented with the same authority as a real one, and an
 * HTTP 500 was indistinguishable from an answer. A percentile derived by
 * multiplying someone's salary by 1.8 is not an estimate; it is a guess
 * wearing a percentile's clothing, and the downstream components
 * (GlobalAnalyticsSuite) cannot tell the difference because the keys match.
 *
 * The honest failure is a 503 with a reason the UI can show. The backend
 * engines themselves are thin — see the follow-up in the PR notes about
 * `global_standards_analytics.py` returning tier-keyed constants for
 * mobility and a 3-entry dict for skill velocity — but "a real, weak
 * number from a named model" and "an invented number from a proxy route"
 * are different things, and only one of them is defensible.
 */

const ENDPOINT_MAP: Record<string, string> = {
  dcf: "/api/v1/analytics/dcf-roi",
  monte_carlo: "/api/v1/analytics/monte-carlo",
  mobility: "/api/v1/analytics/mobility",
  counterfactual: "/api/v1/analytics/counterfactual",
  skill_velocity: "/api/v1/analytics/skill-velocity",
};

/** Human-readable names, so an error names the engine that did not answer. */
const ENDPOINT_LABELS: Record<string, string> = {
  dcf: "20-year DCF / NPV",
  monte_carlo: "Monte Carlo stress test",
  mobility: "upward mobility index",
  counterfactual: "counterfactual comparison",
  skill_velocity: "skill demand velocity",
};

/**
 * `/api/v1/analytics/counterfactual` reads its two programs out of a raw
 * dict and silently substitutes when a key is absent:
 *
 *   cost = prog.get("total_cost_of_degree_inr") or 1_200_000
 *   sal  = prog.get("y5_p50") or 1_800_000
 *
 * So a request that omits a verified cost does not error — it returns a
 * confident NPV delta for a program we invented the price of. That is the
 * same fabrication as the mock payload this route used to return, just one
 * hop further away, so the guard belongs here rather than only in the
 * engine.
 */
function missingCounterfactualInputs(payload: Record<string, unknown>): string[] {
  const missing: string[] = [];
  for (const side of ["program_a", "program_b"] as const) {
    const prog = payload[side];
    if (!prog || typeof prog !== "object") {
      missing.push(`${side}`);
      continue;
    }
    const record = prog as Record<string, unknown>;
    const cost = Number(record.total_cost_of_degree_inr);
    const salary = Number(record.y5_p50);
    if (!Number.isFinite(cost) || cost <= 0) missing.push(`${side}.total_cost_of_degree_inr`);
    if (!Number.isFinite(salary) || salary <= 0) missing.push(`${side}.y5_p50`);
  }
  return missing;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json", _source: "unavailable", reason: "Request body is not valid JSON." },
      { status: 400 },
    );
  }

  const { type, ...payload } = body ?? {};
  const engineType = typeof type === "string" ? type : "";

  // [AI-CoLab: Cursor] Data corrections from FeedbackForm are acknowledged and
  // logged server-side (durable queueing requires the backend/DB).
  if (engineType === "data_correction") {
    console.info("[analytics] data correction received:", JSON.stringify(payload));
    return NextResponse.json({
      status: "logged",
      persisted: false,
      _source: "serverless",
      reason: "Logged only. This is not yet written to a durable correction queue.",
    });
  }

  // An absent or misspelled `type` used to fall through to the DCF endpoint
  // and then to the DCF mock, so a typo silently produced a 20-year NPV.
  // A wrong route should be a wrong route.
  const targetPath = ENDPOINT_MAP[engineType];
  if (!targetPath) {
    return NextResponse.json(
      {
        error: "unknown_analytics_type",
        _source: "unavailable",
        reason: engineType
          ? `No analytics engine is mapped to "${engineType}".`
          : "Request is missing the required `type` field.",
        supported: Object.keys(ENDPOINT_MAP),
      },
      { status: 400 },
    );
  }

  if (engineType === "counterfactual") {
    const missing = missingCounterfactualInputs(payload);
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: "missing_measurements",
          _source: "unavailable",
          reason:
            "The counterfactual engine substitutes ₹12,00,000 of cost and " +
            "₹18,00,000 of year-5 salary for any program that does not supply " +
            "them, which would price a program we know nothing about. Supply " +
            "verified figures or do not request the comparison.",
          missing,
        },
        { status: 422 },
      );
    }
  }

  const resp = await fetchBackend(targetPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    timeoutMs: 3000,
  });

  // Relay the backend's own status. A 4xx/5xx from the engine is information;
  // swallowing it and substituting a plausible body is what created this
  // route's original problem.
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
      engine: ENDPOINT_LABELS[engineType] ?? engineType,
      reason:
        "The analytics engine did not respond, so no figure is available for " +
        "this request. We do not substitute a modelled stand-in for a " +
        "measurement — an absent number is shown as absent.",
    },
    { status: 503 },
  );
}
