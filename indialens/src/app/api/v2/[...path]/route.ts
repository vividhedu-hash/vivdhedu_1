import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { fetchBackend } from "../../../../lib/backend";

export const dynamic = "force-dynamic";

/**
 * Must exceed the backend's own LLM ceiling (45s in gemini_grounded.generate).
 * Previously 1200ms, which guaranteed every call fell through to the
 * serverless handlers below.
 */
const AI_TIMEOUT_MS = Number(process.env.AI_PROXY_TIMEOUT_MS ?? 60_000);

type TraitVector = {
  risk: number;
  value: number;
  autonomy: number;
  ai_adapt: number;
  openness: number;
  diligence: number;
  social: number;
  security: number;
};

const PSYCH_ITEMS = [
  {
    id: "G01",
    type: "SJT",
    trait: "risk",
    text: "You receive two job offers. Offer A: ₹14L fixed salary, MNC, clear career ladder. Offer B: ₹7L base + uncapped commission at a 2-year-old startup, equity worth ₹0 today. You have ₹3.5L in student loans. What do you do?",
    options: [
      { text: "Accept Offer A without negotiating — certainty of income is the only rational choice with loans outstanding.", scores: { risk: -1.8, security: 1.5 } },
      { text: "Accept Offer A, but aggressively renegotiate salary and ask for a performance bonus clause.", scores: { risk: -0.6, value: 1.2 } },
      { text: "Accept Offer B — the upside asymmetry is too large to ignore; I'll manage the loan from base salary.", scores: { risk: 1.4, autonomy: 0.8 } },
      { text: "Counter both simultaneously — see who blinks first.", scores: { risk: 1.8, autonomy: 1.5, value: 1.4 } },
    ],
  },
  {
    id: "G02",
    type: "FREQ",
    trait: "value",
    text: "When evaluating any career decision, I naturally convert it into numbers: expected income, cost, payback period, net present value.",
    options: [
      { text: "Never — reducing decisions to money misses what matters most.", scores: { value: -1.8, openness: 0.3 } },
      { text: "Rarely — I sometimes run rough estimates but mostly go with intuition.", scores: { value: -0.7, social: 0.2 } },
      { text: "Often — I do a mental calculation and that informs, but doesn't determine, my choice.", scores: { value: 0.9, diligence: 0.4 } },
      { text: "Always — I build a spreadsheet. If the NPV is negative I don't proceed.", scores: { value: 1.9, diligence: 1.2 } },
    ],
  },
  {
    id: "G03",
    type: "SJT",
    trait: "autonomy",
    text: "Your manager assigns a project and says: 'Here's the goal. How you get there is entirely up to you — no check-ins for 6 weeks.' How do you feel?",
    options: [
      { text: "Uncomfortable. I work best with clear milestones and regular feedback.", scores: { autonomy: -1.8, security: 1.4 } },
      { text: "Slightly anxious but I'll manage — I'll set my own check-ins to stay on track.", scores: { autonomy: -0.4, diligence: 0.8 } },
      { text: "Energized. This is exactly how I work best.", scores: { autonomy: 1.5, diligence: 0.6 } },
      { text: "Ideal. I'll likely reinvent the brief if I discover a better goal along the way.", scores: { autonomy: 1.9, openness: 1.2 } },
    ],
  },
  {
    id: "G04",
    type: "SJT",
    trait: "ai_adapt",
    text: "A new AI tool automates 60% of your daily work tasks with 90% accuracy. Your company adopts it. What is your primary response?",
    options: [
      { text: "Concern — my role may become redundant and I'm not sure how to adapt.", scores: { ai_adapt: -1.6, security: 1.2 } },
      { text: "Cautious adoption — I'll use it for simple tasks while keeping manual control of important ones.", scores: { ai_adapt: -0.2, security: 0.6 } },
      { text: "Active adoption — I'll master it within 2 weeks and redirect my time to higher-leverage work.", scores: { ai_adapt: 1.4, value: 0.6, diligence: 0.8 } },
      { text: "I'd already have built an internal tool that does this. I'm running the workshop to train colleagues.", scores: { ai_adapt: 1.9, autonomy: 1.2 } },
    ],
  },
  {
    id: "G05",
    type: "FREQ",
    trait: "openness",
    text: "I find myself genuinely curious about fields I know nothing about — spending hours exploring ideas that have no immediate practical value.",
    options: [
      { text: "Never — I focus on what's relevant to my immediate goals.", scores: { openness: -1.7, diligence: 0.4 } },
      { text: "Rarely — I sometimes read broadly but quickly return to what's applicable.", scores: { openness: -0.5 } },
      { text: "Often — I have several 'rabbit holes' I explore regularly outside of work.", scores: { openness: 1.3, autonomy: 0.3 } },
      { text: "Always — my browser has 40 unread tabs on topics ranging from mycology to Byzantine tax law. I can't help it.", scores: { openness: 1.9, diligence: -0.4 } },
    ],
  },
  {
    id: "G06",
    type: "PAIR",
    trait: "diligence",
    text: "Which more accurately describes you when starting a major project?",
    options: [
      { text: "I map out the full timeline, break it into milestones, set buffer time, and track progress daily.", scores: { diligence: 1.8, security: 0.6 } },
      { text: "I dive in immediately — too much planning kills momentum.", scores: { diligence: -1.2, autonomy: 0.8, risk: 0.6 } },
      { text: "I sketch a rough plan and adjust as I go — structured enough to have direction, flexible enough to pivot.", scores: { diligence: 0.4, openness: 0.4 } },
      { text: "I delegate the planning while I focus on execution and ideas.", scores: { diligence: -0.5, social: 0.8 } },
    ],
  },
  {
    id: "G07",
    type: "SJT",
    trait: "social",
    text: "After an intense week of solo deep-work — no meetings, no calls, full focus — you have a free Saturday. You most naturally:",
    options: [
      { text: "Call friends, go out, talk to people — the week of isolation drained me.", scores: { social: 1.8, autonomy: -0.3 } },
      { text: "Mix it up — a short coffee with one or two close friends, then alone time in the evening.", scores: { social: 0.5, openness: 0.3 } },
      { text: "Continue working on a personal project — I find solo work energizing, not draining.", scores: { social: -0.8, autonomy: 1.0 } },
      { text: "Completely off-grid. No screens, no people. A long walk or reading.", scores: { social: -1.7, openness: 0.8 } },
    ],
  },
  {
    id: "G08",
    type: "LOSS",
    trait: "security",
    text: "Two career paths with identical 20-year NPV:\n\nPath SECURE: ₹12L Year 1, growing 8% annually, very low variance (PSU-like stability).\nPath VARIABLE: ₹8L Year 1, but 60% chance of reaching ₹30L by Year 7, and 40% chance of stagnating below ₹10L.\n\nBoth have identical expected NPV. Which do you choose?",
    options: [
      { text: "SECURE, without hesitation. If the NPV is equal, the certain outcome is strictly superior.", scores: { security: 1.9, risk: -1.6 } },
      { text: "SECURE, but only because my current financial obligations require stability.", scores: { security: 0.8, risk: -0.5 } },
      { text: "VARIABLE. Equal NPV, but the upside tail is asymmetric. The 60% probability of ₹30L matters more.", scores: { security: -0.8, risk: 1.4 } },
      { text: "VARIABLE. I don't care about the downside — if I stagnate I'll pivot. The ceiling is what matters.", scores: { security: -1.8, risk: 1.9 } },
    ],
  },
];

const PROFILES: Record<string, { label: string; emoji: string; description: string; career_paths: string[]; caution: string }> = {
  VENTURE_BUILDER: { label: "High-Growth Venture Builder", emoji: "🚀", description: "You are energized by building what doesn't exist. Uncertainty feels like asymmetric opportunity.", career_paths: ["Startup Founder", "Early-Stage VC", "Chief Product Officer", "CTO"], caution: "Validate unit economics rigorously before committing personal capital." },
  TECHNOLOGIST: { label: "AI-Native Systems Architect", emoji: "🤖", description: "You are at the frontier of technical change, finding technical mastery and distributed systems deeply fulfilling.", career_paths: ["ML Systems Engineer", "AI Infrastructure Architect", "Principal Staff Engineer"], caution: "Ensure technical depth directly translates to measurable commercial outcomes." },
  IRR_OPTIMIZER: { label: "Pragmatic IRR Optimizer", emoji: "📊", description: "You make career decisions with clear return metrics, payback horizons, and Net Present Value modeled.", career_paths: ["Investment Banking", "Private Equity", "Chief Financial Officer", "Quant Trading"], caution: "Hyper-optimization for financial return can discount non-quantifiable compounding gains." },
  STABILITY_ANCHOR: { label: "Stability-Seeking Anchor", emoji: "⚓", description: "You value predictability, institutional backing, and genuine long-term downside protection.", career_paths: ["Civil Services (IAS/IES)", "PSU Engineering Leadership", "Regulatory Finance"], caution: "Optimize within your chosen stability path — intellectual depth still compounds." },
  RESEARCH_INNOVATOR: { label: "Deep Research Innovator", emoji: "🔬", description: "Driven by understanding fundamental mechanisms at a depth that standard industry roles overlook.", career_paths: ["PhD Research", "Deep Tech R&D", "Quantitative Research", "National Labs"], caution: "Research careers require navigating institutional tenure and grant politics." },
  PEOPLE_LEADER: { label: "People-Centric Leader", emoji: "🤝", description: "Energized by cultivating talent, building high-trust organizations, and cross-functional leadership.", career_paths: ["VP Engineering", "General Management", "Enterprise Organization Leader"], caution: "People leadership without clear context-setting often leads to operational burnout." },
};

function computeArchetypes(traits: TraitVector) {
  const scores: Record<string, number> = {
    VENTURE_BUILDER: traits.risk * 1.8 + traits.autonomy * 1.8,
    TECHNOLOGIST: traits.ai_adapt * 2.0 + traits.openness * 1.4,
    IRR_OPTIMIZER: traits.value * 2.0 + traits.diligence * 1.5,
    STABILITY_ANCHOR: -traits.risk * 1.8 + traits.security * 2.0,
    RESEARCH_INNOVATOR: traits.openness * 1.9 + traits.diligence * 1.6,
    PEOPLE_LEADER: traits.social * 2.0 + traits.openness * 0.8,
  };

  const totalScore = Object.values(scores).reduce((s, v) => s + Math.exp(v), 0);
  const posterior: Record<string, number> = {};
  Object.entries(scores).forEach(([k, v]) => {
    posterior[k] = Math.exp(v) / (totalScore || 1);
  });

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const primaryKey = sorted[0][0];
  const secondaryKey = sorted[1][0];

  return { scores, posterior, primaryKey, secondaryKey };
}

// In-memory session tracking for psychometric evaluation in Lambda
const sessionStates = new Map<string, { traits: TraitVector; completedIndex: number }>();

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

  const resp = await fetchBackend(`/api/v2/${subpath}${qs}`, {
    method,
    headers,
    body: body || undefined,
    // Was 1200ms — shorter than any real backend call, so this always aborted
    // and always fell through to the handlers below.
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

  // =========================================================================
  // 100% Autonomous Vercel Serverless Handlers
  // =========================================================================

  // 1. Portfolio Builder: Google X-Y-Z Transform
  //
  // REMOVED. This used to invent metrics for the student: any bullet became
  // "achieving a 42% latency reduction and supporting 1,200+ concurrent active
  // sessions", a research bullet became "14,000+ data points & 95% statistical
  // significance", a club bullet became "35% engagement increase & 85+
  // verified participants". Those numbers have no source — they were template
  // literals. A student submitting them to an admissions or hiring reviewer
  // would be asserting fabricated achievements, and the portfolio_profiles
  // table is student-owned and persisted. Refuse instead of inventing.
  if (subpath === "portfolio/transform-xyz") {
    return NextResponse.json(
      {
        error: "unavailable",
        _source: "unavailable",
        reason:
          "X-Y-Z portfolio rewriting is not available. This endpoint previously " +
          "invented metrics (e.g. '42% latency reduction', '14,000+ data points') " +
          "with no source, which would put fabricated claims in a student's " +
          "portfolio. Metrics must come from the student.",
      },
      { status: 501 },
    );
  }

  // 2. Course Marketplace Click Tracking
  if (subpath === "marketplace/track-click") {
    return NextResponse.json({ status: "ok", tracked: true });
  }

  // 3. Psychometric CAT Engine: Start Assessment
  if (subpath === "psychometric/start") {
    const sessionId = "psy_" + randomBytes(8).toString("hex");
    const initialTraits: TraitVector = {
      risk: 0, value: 0, autonomy: 0, ai_adapt: 0,
      openness: 0, diligence: 0, social: 0, security: 0,
    };
    sessionStates.set(sessionId, { traits: initialTraits, completedIndex: 0 });

    const { posterior, primaryKey } = computeArchetypes(initialTraits);

    return NextResponse.json({
      session_id: sessionId,
      item: PSYCH_ITEMS[0],
      traits: initialTraits,
      archetype_posterior: posterior,
      primary_archetype: primaryKey,
      estimated_remaining: PSYCH_ITEMS.length,
      _source: "serverless",
    });
  }

  // 4. Psychometric CAT Engine: Respond to Item
  if (subpath === "psychometric/respond") {
    let parsed: any = {};
    try { if (body) parsed = JSON.parse(body); } catch {}
    const sessionId = parsed.session_id || "psy_default";
    const itemId = parsed.item_id;
    const optionIndex = Number(parsed.option_index ?? 0);

    const state = sessionStates.get(sessionId) || {
      traits: { risk: 0, value: 0, autonomy: 0, ai_adapt: 0, openness: 0, diligence: 0, social: 0, security: 0 },
      completedIndex: 0,
    };

    const item = PSYCH_ITEMS.find((p) => p.id === itemId) || PSYCH_ITEMS[state.completedIndex];
    if (item && item.options[optionIndex]) {
      const scores = item.options[optionIndex].scores;
      for (const [k, v] of Object.entries(scores)) {
        const traitKey = k as keyof TraitVector;
        state.traits[traitKey] = Math.max(-3, Math.min(3, (state.traits[traitKey] || 0) + (v ?? 0)));
      }
    }

    state.completedIndex += 1;
    sessionStates.set(sessionId, state);

    const { posterior, primaryKey } = computeArchetypes(state.traits);
    const nextItem = PSYCH_ITEMS[state.completedIndex];

    if (!nextItem || state.completedIndex >= PSYCH_ITEMS.length) {
      return NextResponse.json({
        session_id: sessionId,
        is_converged: true,
        item: null,
        traits: state.traits,
        archetype_posterior: posterior,
        primary_archetype: primaryKey,
        estimated_remaining: 0,
        _source: "serverless",
      });
    }

    return NextResponse.json({
      session_id: sessionId,
      is_converged: false,
      item: nextItem,
      traits: state.traits,
      archetype_posterior: posterior,
      primary_archetype: primaryKey,
      estimated_remaining: Math.max(0, PSYCH_ITEMS.length - state.completedIndex),
      _source: "serverless",
    });
  }

  // 5. Psychometric CAT Engine: Result Report
  if (subpath.startsWith("psychometric/result")) {
    const parts = subpath.split("/");
    const sessionId = parts[parts.length - 1] || "psy_default";
    const state = sessionStates.get(sessionId);

    // A session lives in this module's in-memory Map, so it is lost on any
    // cold start and never shared across serverless instances. Previously an
    // unknown session_id silently produced a confident-looking report from a
    // hardcoded trait vector (risk 0.8, ai_adapt 1.4, ...) with
    // `validity_ok: true`. That is a fabricated psychometric result, which is
    // the single most misleading thing this codebase could invent: it tells a
    // student who they are based on nothing.
    if (!state) {
      return NextResponse.json(
        {
          error: "session_not_found",
          _source: "unavailable",
          reason:
            "No psychometric session in memory for this id. Sessions do not " +
            "survive a serverless cold start — rerun the assessment.",
        },
        { status: 404 },
      );
    }

    const { scores, posterior, primaryKey, secondaryKey } = computeArchetypes(state.traits);
    const pa = PROFILES[primaryKey] ?? PROFILES.TECHNOLOGIST;
    const sa = PROFILES[secondaryKey] ?? PROFILES.IRR_OPTIMIZER;

    const traitPct: Record<string, number> = {};
    for (const [k, v] of Object.entries(state.traits)) {
      traitPct[k] = Math.round(((v + 3) / 6) * 100);
    }

    // Confidence must follow the evidence: how many items actually backed these
    // trait estimates. Previously every trait was hardcoded "high".
    const answered = state.completedIndex;
    const conf = (n: number): string => {
      if (answered >= 8) return "high";
      if (answered >= 4) return n >= 2 ? "high" : "medium";
      return "low";
    };
    const traitConfidence: Record<string, string> = {
      risk: conf(2), value: conf(2), autonomy: conf(2), ai_adapt: conf(2),
      openness: conf(1), diligence: conf(1), social: conf(1), security: conf(2),
    };

    return NextResponse.json({
      session_id: sessionId,
      items_completed: answered,
      validity_ok: answered >= 4,
      primary_archetype: {
        key: primaryKey,
        ...pa,
        probability_pct: Math.round((posterior[primaryKey] ?? 0) * 100),
      },
      secondary_archetype: {
        key: secondaryKey,
        label: sa.label,
        emoji: sa.emoji,
        probability_pct: Math.round((posterior[secondaryKey] ?? 0) * 100),
      },
      top3_archetypes: Object.entries(scores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([k]) => [k, Math.round((posterior[k] ?? 0) * 100)]),
      trait_vector: state.traits,
      trait_percentiles: traitPct,
      trait_confidence: traitConfidence,
      archetype_posterior: posterior,
      _source: "serverless",
    });
  }

  if (subpath === "health") {
    return NextResponse.json({ status: "healthy", runtime: "vercel-serverless", v2: true });
  }

  // Previously any unmatched path returned 200 `{status: "ok"}`, so a frontend
  // bug or a typo'd endpoint looked like a working backend. Fail explicitly.
  return NextResponse.json(
    {
      error: "not_implemented",
      _source: "unavailable",
      reason: `No FastAPI route or local handler for /api/v2/${subpath}.`,
    },
    { status: 501 },
  );
}

export async function GET(request: Request, { params }: { params: { path: string[] } }) {
  return proxy(request, params.path, "GET");
}

export async function POST(request: Request, { params }: { params: { path: string[] } }) {
  return proxy(request, params.path, "POST");
}
