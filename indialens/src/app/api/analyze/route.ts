import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { MOCK_DATA } from "../../../lib/mock-data";
import { allowMockFallback, fetchBackend, unavailablePayload } from "../../../lib/backend";
import { reportStore } from "../../../lib/report-store";
import { fetchSupabaseRest } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

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
    timeoutMs: 1000,
  });
  if (resp?.ok) {
    const data = await resp.json();
    return NextResponse.json({ ...data, _source: data._source ?? "database" });
  }

  // Vercel Serverless Calculation Engine
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

    const rawPl = r.placement?.rate ?? 88;
    const normPl = rawPl > 1 ? rawPl / 100 : rawPl;

    const macroScenarios = {
      base_case: {
        name: "Base Case (Current Market)",
        y1_salary: trajectory.y1.p50,
        y5_salary: trajectory.y5.p50,
        y10_salary: trajectory.y10.p50,
        placement_rate: Math.round(normPl * 100),
        note: "Standard economic growth trajectory",
      },
      ai_acceleration: {
        name: "AI Shock (+40% Automation)",
        y1_salary: Math.round(trajectory.y1.p50 * 0.88),
        y5_salary: Math.round(trajectory.y5.p50 * 0.94),
        y10_salary: Math.round(trajectory.y10.p50 * 1.15),
        placement_rate: Math.round(normPl * 88),
        note: "Simulates entry automation shift toward senior system architects",
      },
      macro_recession: {
        name: "Recession Contraction (-20% Hiring)",
        y1_salary: Math.round(trajectory.y1.p50 * 0.82),
        y5_salary: Math.round(trajectory.y5.p50 * 0.88),
        y10_salary: Math.round(trajectory.y10.p50 * 0.95),
        placement_rate: Math.round(normPl * 80),
        note: "Hiring freeze safety buffer test",
      },
    };

    return {
      id: r.id,
      programId: r.id,
      rank: i + 1,
      college: r.college,
      degree: r.degree,
      roi: r.roi,
      salary: r.salary,
      risk: r.risk,
      placement: r.placement,
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
      placementRate: r.placement?.rate ? (r.placement.rate > 1 ? r.placement.rate : r.placement.rate * 100) : 75,
      macroScenarios,
      reasons: [
        `Multi-vector fit score based on your stated goals & CAT psychometric traits`,
        `Financial upside ${vectors.financial_upside}/100 — top tier career ceiling`,
        `Payback horizon speed ~${paybackYears} years to recoup full degree cost`,
        "Resilient placement history across major employment hubs",
      ],
      topRisks: [
        `AI automation risk: ${((r.roi.riskScore <= 1 ? r.roi.riskScore : r.roi.riskScore / 100) * 100).toFixed(0)}% — mitigated by specialization`,
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

  const topMatch = MOCK_DATA[0];
  const hiddenGemMatch = MOCK_DATA.find((p, idx) => idx > 1 && (p.college.tier === 2 || p.roi.financialRoiPct > 1500)) || MOCK_DATA[4];

  const hiddenGem = {
    id: hiddenGemMatch.id,
    college: hiddenGemMatch.college,
    degree: hiddenGemMatch.degree,
    roi: hiddenGemMatch.roi,
    modelConfidence: 89,
    gemReason: `High-conviction value opportunity: ${hiddenGemMatch.college.shortName} delivers top-quartile financial ROI (${hiddenGemMatch.roi.financialRoiPct}%) at significantly lower capital outlay than premier private counterparts.`,
  };

  const roadmap = {
    college: {
      college: topMatch.college,
      degree: topMatch.degree,
    },
    years: [
      {
        year: "Year 1: Foundation & Core Signals",
        focus: "Fundamentals & Tooling Mastery",
        skills: ["Programming & Algorithms", "Systems Thinking", "Statistical Foundations", "Git & CI/CD"],
        milestone: "Ship 3 production-grade projects and achieve top 10% cohort GPA",
      },
      {
        year: "Year 2: Applied Engineering & Specialization",
        focus: "Domain Depth & Competitive Moats",
        skills: ["Distributed Architectures", "Modern AI Toolchains", "Database Internals", "Open Source Traction"],
        milestone: "Complete first industrial research or venture studio internship",
      },
      {
        year: "Year 3: Market Leverage & Systems Design",
        focus: "High-Leverage Execution",
        skills: ["Scalable Cloud Microservices", "Quant Modeling", "Product Leadership", "Technical Writing"],
        milestone: "Secure pre-placement offer (PPO) or launch verified public MVP",
      },
      {
        year: "Year 4: Capstone & Career Launch",
        focus: "Strategic Positioning",
        skills: ["Executive Communication", "Equity Valuation", "Negotiation", "Multi-offer Strategy"],
        milestone: "Close offer exceeding p75 tier benchmark with accelerated equity",
      },
    ],
  };

  const pathNotTaken = {
    title: "Alternative Path: Early Venture Fellowship vs Traditional Tier-1 Degree",
    description: "Given your high autonomy trait, entering a high-growth startup or venture fellowship early yields an immediate trajectory acceleration, though traditional degree credentialing provides higher downside safety.",
    roiComparison: {
      recommended: topMatch.roi.compositeScore,
      alternative: Math.max(60, topMatch.roi.compositeScore - 8),
      note: "Traditional path offers 22% higher safety margin during macroeconomic recessions.",
    },
  };

  const payload = {
    token,
    recommendations,
    pathways,
    hiddenGem,
    roadmap,
    pathNotTaken,
    profile_parsed: profile,
    flags,
    model_version: "v2.0-multivector",
    using_ml: false,
    generated_at: new Date().toISOString(),
    _source: "mock" as const,
  };

  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  // Persist directly into Supabase student_reports table
  await fetchSupabaseRest("student_reports", {
    method: "POST",
    body: JSON.stringify({
      token,
      profile_data: profile,
      results_data: payload,
      model_version: payload.model_version,
      generated_at: payload.generated_at,
      viewed_count: 0,
      expires_at: expiresAt,
    }),
  }).catch(() => null);

  reportStore.set(token, {
    token,
    created_at: payload.generated_at,
    expires_at: expiresAt,
    student_input: profile,
    results: payload,
    _source: "database",
  });

  return NextResponse.json(payload);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  // 1. Fast in-memory check
  const cached = reportStore.get(token);
  if (cached) return NextResponse.json(cached);

  // 2. Direct Supabase Query
  try {
    const rows = await fetchSupabaseRest<any[]>(
      `student_reports?token=eq.${encodeURIComponent(token)}&limit=1`,
      { timeoutMs: 3000 },
    );
    if (rows && Array.isArray(rows) && rows.length > 0) {
      const row = rows[0];
      const savedReport = {
        token: row.token,
        created_at: row.generated_at,
        expires_at: row.expires_at,
        student_input: row.profile_data,
        results: row.results_data,
        _source: "database" as const,
      };
      reportStore.set(token, savedReport);
      return NextResponse.json(savedReport);
    }
  } catch {
    // continue
  }

  // 3. Fallback
  const resp = await fetchBackend(`/api/analyze/${encodeURIComponent(token)}`, { timeoutMs: 1500 });
  if (resp?.ok) return NextResponse.json(await resp.json());
  if (resp?.status === 404) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({ error: "Report not found or expired" }, { status: 404 });
}

export async function HEAD() {
  const resp = await fetchBackend("/api/ml/status");
  return new NextResponse(null, { status: resp?.ok ? 200 : 503 });
}
