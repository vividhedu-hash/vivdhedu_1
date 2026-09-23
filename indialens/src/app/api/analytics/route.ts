import { NextResponse } from "next/server";
import { allowMockFallback, fetchBackend, unavailablePayload } from "../../../lib/backend";

const ENDPOINT_MAP: Record<string, string> = {
  dcf: "/api/v1/analytics/dcf-roi",
  monte_carlo: "/api/v1/analytics/monte-carlo",
  mobility: "/api/v1/analytics/mobility",
  counterfactual: "/api/v1/analytics/counterfactual",
  skill_velocity: "/api/v1/analytics/skill-velocity",
};

export async function POST(request: Request) {
  const body = await request.json();
  const { type, ...payload } = body;

  // [AI-CoLab: Cursor] Data corrections from FeedbackForm are acknowledged and
  // logged server-side (durable queueing requires the backend/DB).
  if (type === "data_correction") {
    console.info("[analytics] data correction received:", JSON.stringify(payload));
    return NextResponse.json({ status: "queued", _source: "serverless" });
  }

  const targetPath = ENDPOINT_MAP[type] || ENDPOINT_MAP.dcf;

  const resp = await fetchBackend(targetPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    timeoutMs: 3000,
  });
  if (resp?.ok) {
    return NextResponse.json(await resp.json());
  }


  if (type === "monte_carlo") {
    return NextResponse.json({
      num_trials: 1000,
      percentiles_y5_salary: {
        p10: Math.round((payload.base_starting_salary || 1000000) * 1.1),
        p25: Math.round((payload.base_starting_salary || 1000000) * 1.4),
        p50_median: Math.round((payload.base_starting_salary || 1000000) * 1.8),
        p75: Math.round((payload.base_starting_salary || 1000000) * 2.3),
        p90: Math.round((payload.base_starting_salary || 1000000) * 3.1),
      },
      value_at_risk_95_inr: Math.round((payload.total_cost_inr || 1200000) * 1.5),
      prob_negative_roi_pct: 4.2,
      confidence_label: "Demo (local mock)",
      _source: "mock",
    });
  }

  if (type === "mobility") {
    return NextResponse.json({
      chetty_mobility_score: 84.5,
      access_rate_pct: 45.0,
      success_rate_pct: 68.0,
      top_quintile_transition_prob: 58.2,
      mobility_rating: "Demo (local mock)",
      _source: "mock",
    });
  }

  if (type === "skill_velocity") {
    return NextResponse.json({
      velocity_label: "Demo (local mock)",
      ai_complementarity_score: 88,
      automation_risk_score: 24,
      top_demanded_skills: ["System Design", "GenAI / LLM Engineering"],
      _source: "mock",
    });
  }

  const cost = payload.total_cost_inr || 1200000;
  const salary = payload.starting_salary_y1 || 1000000;
  return NextResponse.json({
    total_investment_inr: cost,
    npv_20yr_inr: salary * 8.5 - cost,
    approx_irr_pct: 22.4,
    _source: "mock",
  });
}
