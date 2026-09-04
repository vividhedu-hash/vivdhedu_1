import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { MOCK_DATA } from "../../../lib/mock-data";
import { allowMockFallback, fetchBackend, unavailablePayload } from "../../../lib/backend";
import { reportStore } from "../../../lib/report-store";

function buildMockTrajectory(baseSalary: number, field: string) {
  const growthRates: Record<string, number> = {
    "engineering-cs": 0.18, "management": 0.16, "medicine": 0.13,
    "law": 0.12, "engineering-non-cs": 0.10, "design": 0.14,
    "commerce": 0.10, "pure-sciences": 0.09, "social-sciences": 0.08, "arts": 0.07,
  };
  const r = growthRates[field] ?? 0.12;

  const project = (years: number) => {
    const p50 = baseSalary * Math.pow(1 + r, years);
    return {
      p10: Math.round(p50 * 0.72),
      p25: Math.round(p50 * 0.82),
      p50: Math.round(p50),
      p75: Math.round(p50 * 1.22),
      p90: Math.round(p50 * 1.45),
    };
  };

  return {
    y1: project(1),
    y3: project(3),
    y5: project(5),
    y10: project(10),
    y15: project(15),
    y20: project(20),
  };
}

export async function POST(request: Request) {
  const profile = await request.json();

  const resp = await fetchBackend("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
    timeoutMs: 20000,
  });
  if (resp?.ok) {
    const data = await resp.json();
    return NextResponse.json({ ...data, _source: data._source ?? "database" });
  }

  if (!allowMockFallback()) {
    const status = resp?.status && resp.status >= 400 ? resp.status : 503;
    return NextResponse.json(unavailablePayload("Analyze service unavailable"), { status });
  }

  // Local demo only — never used in production unless ALLOW_MOCK_FALLBACK=1
  const token = randomBytes(24).toString("base64url");

  const recommendations = MOCK_DATA.slice(0, 5).map((r, i) => {
    const baseSalary = r.salary?.year1?.p50 ?? 1_000_000;
    const field = r.degree?.field ?? "engineering-cs";
    const trajectory = buildMockTrajectory(baseSalary, field);
    const cost = r.costs?.totalCostOfDegreeInr ?? 1_200_000;
    const paybackYears = Number((cost / baseSalary).toFixed(1));

    const vectors = {
      financial_upside: Math.round(92 - i * 6),
      stability_resilience: Math.round(85 - i * 4),
      value_efficiency: Math.round(88 - i * 5),
      autonomy_wlb: Math.round(75 + i * 3),
    };

    const macroScenarios = {
      base_case: {
        name: "Base Case (Current Market)",
        y1_salary: trajectory.y1.p50,
        y5_salary: trajectory.y5.p50,
        y10_salary: trajectory.y10.p50,
        placement_rate: Math.round((r.placement?.rate ?? 0.85) * 100),
        note: "Standard economic growth trajectory",
      },
      ai_acceleration: {
        name: "AI Shock (+40% Automation)",
        y1_salary: Math.round(trajectory.y1.p50 * 0.88),
        y5_salary: Math.round(trajectory.y5.p50 * 0.94),
        y10_salary: Math.round(trajectory.y10.p50 * 1.15),
        placement_rate: Math.round((r.placement?.rate ?? 0.85) * 88),
        note: "Simulates entry automation shift toward senior system architects",
      },
      macro_recession: {
        name: "Recession Contraction (-20% Hiring)",
        y1_salary: Math.round(trajectory.y1.p50 * 0.82),
        y5_salary: Math.round(trajectory.y5.p50 * 0.88),
        y10_salary: Math.round(trajectory.y10.p50 * 0.95),
        placement_rate: Math.round((r.placement?.rate ?? 0.85) * 80),
        note: "Hiring freeze safety buffer test",
      },
    };

    return {
      rank: i + 1,
      programId: r.id,
      collegeName: r.college.name,
      degreeName: r.degree.name,
      state: r.college.state,
      tier: r.college.tier,
      compositeScore: r.roi.compositeScore,
      fitScore: Math.round(92 - i * 6),
      vectors,
      trajectory,
      predictedSalaryY1: trajectory.y1.p50,
      predictedSalaryY5: trajectory.y5.p50,
      paybackYears,
      totalCostInr: cost,
      placementRate: r.placement?.rate ? r.placement.rate / 100 : 0.75,
      macroScenarios,
      reasons: [
        `Multi-vector fit score based on your stated goals & CAT psychometric traits`,
        `Financial upside ${vectors.financial_upside}/100 — top tier career ceiling`,
        `Payback horizon speed ~${paybackYears} years to recoup full degree cost`,
        "Resilient placement history across major employment hubs",
      ],
      topRisks: [
        `AI automation risk: ${(r.roi.riskScore * 100).toFixed(0)}% — mitigated by specialization`,
        "Credential inflation ~7% YoY in this cohort",
      ],
    };
  });

  const pathways = {
    wealth_builder: [
      { collegeName: MOCK_DATA[0].college.name, degreeName: MOCK_DATA[0].degree.name, score: 96, y10_salary: 4_500_000 },
      { collegeName: MOCK_DATA[2].college.name, degreeName: MOCK_DATA[2].degree.name, score: 92, y10_salary: 3_800_000 },
      { collegeName: MOCK_DATA[3].college.name, degreeName: MOCK_DATA[3].degree.name, score: 89, y10_salary: 3_500_000 },
    ],
    stability_fortress: [
      { collegeName: MOCK_DATA[8].college.name, degreeName: MOCK_DATA[8].degree.name, score: 95, placement_rate: 0.99 },
      { collegeName: MOCK_DATA[0].college.name, degreeName: MOCK_DATA[0].degree.name, score: 92, placement_rate: 0.95 },
      { collegeName: MOCK_DATA[1].college.name, degreeName: MOCK_DATA[1].degree.name, score: 88, placement_rate: 0.91 },
    ],
    value_optimizer: [
      { collegeName: MOCK_DATA[5].college.name, degreeName: MOCK_DATA[5].degree.name, score: 94, payback_years: 1.1 },
      { collegeName: MOCK_DATA[0].college.name, degreeName: MOCK_DATA[0].degree.name, score: 90, payback_years: 1.4 },
      { collegeName: MOCK_DATA[3].college.name, degreeName: MOCK_DATA[3].degree.name, score: 86, payback_years: 1.7 },
    ],
    balanced_lifestyle: [
      { collegeName: MOCK_DATA[4].college.name, degreeName: MOCK_DATA[4].degree.name, score: 88 },
      { collegeName: MOCK_DATA[7].college.name, degreeName: MOCK_DATA[7].degree.name, score: 85 },
      { collegeName: MOCK_DATA[6].college.name, degreeName: MOCK_DATA[6].degree.name, score: 82 },
    ],
  };

  const flags: object[] = [];
  if (profile.cat_traits?.autonomy > 0.5) {
    flags.push({
      type: "archetype_alert",
      title: "High-Agency Venture Profile",
      message: "Your responses show high preference for autonomy and equity upside.",
      severity: "success",
    });
  }
  if ((profile.total_budget ?? 20) <= 5) {
    flags.push({
      type: "budget_alert",
      title: "Tight Budget (≤ ₹5L)",
      message: "State universities & NITs yield the highest IRR for your budget.",
      severity: "warning",
    });
  }

  const payload = {
    token,
    recommendations,
    pathways,
    profile_parsed: profile,
    flags,
    model_version: "v2.0-multivector",
    using_ml: false,
    generated_at: new Date().toISOString(),
    _source: "mock" as const,
  };

  const createdAt = payload.generated_at;
  reportStore.set(token, {
    token,
    created_at: createdAt,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    student_input: profile,
    results: payload,
    _source: "mock",
  });

  return NextResponse.json(payload);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const cached = reportStore.get(token);
  if (cached) return NextResponse.json(cached);

  const resp = await fetchBackend(`/api/analyze/${encodeURIComponent(token)}`);
  if (resp?.ok) return NextResponse.json(await resp.json());
  if (resp?.status === 404) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json(unavailablePayload("Analyze service unavailable"), { status: 503 });
}

export async function HEAD() {
  const resp = await fetchBackend("/api/ml/status");
  return new NextResponse(null, { status: resp?.ok ? 200 : 503 });
}
