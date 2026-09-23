"use client";

import { useState, useEffect, useCallback } from "react";
import { Brain, ChevronRight, Shield, AlertTriangle, CheckCircle, RotateCcw, TrendingUp, Star, Users, Zap, Globe, FlaskConical, Building2, Heart, Palette, Anchor, MessageSquare, Activity, Calculator } from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PsychItem {
  id: string;
  type: string;
  text: string;
  trait: string;
  options: { text: string }[];
}

interface TraitVector {
  risk: number;
  value: number;
  autonomy: number;
  ai_adapt: number;
  openness: number;
  diligence: number;
  social: number;
  security: number;
}

interface ArchetypeResult {
  key: string;
  label: string;
  emoji: string;
  description: string;
  career_paths: string[];
  caution: string;
  probability_pct: number;
}

interface SessionState {
  session_id: string;
  item: PsychItem | null;
  is_converged: boolean;
  items_completed: number;
  traits: TraitVector;
  trait_se?: Record<string, number>;
  archetype_posterior: Record<string, number>;
  primary_archetype?: string;
  estimated_remaining?: number;
}

interface FinalReport {
  session_id: string;
  items_completed: number;
  validity_ok: boolean;
  primary_archetype: ArchetypeResult;
  secondary_archetype: { key: string; label: string; emoji: string; probability_pct: number };
  top3_archetypes: [string, number][];
  trait_vector: TraitVector;
  trait_percentiles: Record<string, number>;
  trait_confidence: Record<string, string>;
  archetype_posterior: Record<string, number>;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TRAITS = [
  { key: "risk",      label: "Risk Appetite",     color: "#ef4444" },
  { key: "value",     label: "ROI Orientation",   color: "#f59e0b" },
  { key: "autonomy",  label: "Autonomy Drive",    color: "#8b5cf6" },
  { key: "ai_adapt",  label: "AI Adaptability",   color: "#06b6d4" },
  { key: "openness",  label: "Intellectual Openness", color: "#10b981" },
  { key: "diligence", label: "Diligence",         color: "#3b82f6" },
  { key: "social",    label: "Social Drive",      color: "#ec4899" },
  { key: "security",  label: "Security Need",     color: "#6b7280" },
];

const ARCHETYPE_ICONS: Record<string, React.ReactNode> = {
  VENTURE_BUILDER:    <Zap className="w-8 h-8" />,
  TECHNOLOGIST:       <Brain className="w-8 h-8" />,
  IRR_OPTIMIZER:      <Calculator className="w-8 h-8" />,
  GLOBAL_ARBITRAGEUR: <Globe className="w-8 h-8" />,
  RESEARCH_INNOVATOR: <FlaskConical className="w-8 h-8" />,
  ENTERPRISE_OPERATOR:<Building2 className="w-8 h-8" />,
  PEOPLE_LEADER:      <Users className="w-8 h-8" />,
  CREATIVE_DISRUPTOR: <Palette className="w-8 h-8" />,
  STABILITY_ANCHOR:   <Anchor className="w-8 h-8" />,
  POLICY_AGENT:       <MessageSquare className="w-8 h-8" />,
  CLINICAL_SPECIALIST:<Heart className="w-8 h-8" />,
  FINANCIAL_ENGINEER: <Activity className="w-8 h-8" />,
};

const TRAIT_TYPE_LABELS: Record<string, string> = {
  SJT:  "Situation",
  PAIR: "Preference",
  FREQ: "Self-Report",
  LOSS: "Economic",
  TIME: "Time Preference",
  MATH: "Quantitative",
  VALID: "Consistency",
};

// ─── Client-side fallback item bank (offline adaptive) ────────────────────────
const OFFLINE_GATEWAY = [
  {
    id: "G01", type: "SJT", trait: "risk",
    text: "You receive two job offers. Offer A: ₹14L fixed salary, MNC, clear career ladder. Offer B: ₹7L base + uncapped commission at a 2-year-old startup, equity worth ₹0 today. You have ₹3.5L in student loans. What do you do?",
    options: [
      { text: "Accept Offer A without negotiating — certainty of income is the only rational choice with loans outstanding.", scores: { risk: -1.8, security: 1.5 } },
      { text: "Accept Offer A, but aggressively renegotiate salary and ask for a performance bonus clause.", scores: { risk: -0.6, value: 1.2 } },
      { text: "Accept Offer B — the upside asymmetry is too large to ignore; I'll manage the loan from base salary.", scores: { risk: 1.4, autonomy: 0.8 } },
      { text: "Counter both simultaneously — see who blinks first.", scores: { risk: 1.8, autonomy: 1.5, value: 1.4 } },
    ]
  },
  {
    id: "G02", type: "FREQ", trait: "value",
    text: "When evaluating any career decision, I naturally convert it into numbers: expected income, cost, payback period, net present value.",
    options: [
      { text: "Never — reducing decisions to money misses what matters most.", scores: { value: -1.8, openness: 0.3 } },
      { text: "Rarely — I sometimes run rough estimates but mostly go with intuition.", scores: { value: -0.7, social: 0.2 } },
      { text: "Often — I do a mental calculation and that informs, but doesn't determine, my choice.", scores: { value: 0.9, diligence: 0.4 } },
      { text: "Always — I build a spreadsheet. If the NPV is negative I don't proceed.", scores: { value: 1.9, diligence: 1.2 } },
    ]
  },
  {
    id: "G03", type: "SJT", trait: "autonomy",
    text: "Your manager assigns a project and says: 'Here's the goal. How you get there is entirely up to you — no check-ins for 6 weeks.' How do you feel?",
    options: [
      { text: "Uncomfortable. I work best with clear milestones and regular feedback.", scores: { autonomy: -1.8, security: 1.4 } },
      { text: "Slightly anxious but I'll manage — I'll set my own check-ins to stay on track.", scores: { autonomy: -0.4, diligence: 0.8 } },
      { text: "Energized. This is exactly how I work best.", scores: { autonomy: 1.5, diligence: 0.6 } },
      { text: "Ideal. I'll likely reinvent the brief if I discover a better goal along the way.", scores: { autonomy: 1.9, openness: 1.2 } },
    ]
  },
  {
    id: "G04", type: "SJT", trait: "ai_adapt",
    text: "A new AI tool automates 60% of your daily work tasks with 90% accuracy. Your company adopts it. What is your primary response?",
    options: [
      { text: "Concern — my role may become redundant and I'm not sure how to adapt.", scores: { ai_adapt: -1.6, security: 1.2 } },
      { text: "Cautious adoption — I'll use it for simple tasks while keeping manual control of important ones.", scores: { ai_adapt: -0.2, security: 0.6 } },
      { text: "Active adoption — I'll master it within 2 weeks and redirect my time to higher-leverage work.", scores: { ai_adapt: 1.4, value: 0.6, diligence: 0.8 } },
      { text: "I'd already have built an internal tool that does this. I'm running the workshop to train colleagues.", scores: { ai_adapt: 1.9, autonomy: 1.2 } },
    ]
  },
  {
    id: "G05", type: "FREQ", trait: "openness",
    text: "I find myself genuinely curious about fields I know nothing about — spending hours exploring ideas that have no immediate practical value.",
    options: [
      { text: "Never — I focus on what's relevant to my immediate goals.", scores: { openness: -1.7, diligence: 0.4 } },
      { text: "Rarely — I sometimes read broadly but quickly return to what's applicable.", scores: { openness: -0.5 } },
      { text: "Often — I have several 'rabbit holes' I explore regularly outside of work.", scores: { openness: 1.3, autonomy: 0.3 } },
      { text: "Always — my browser has 40 unread tabs on topics ranging from mycology to Byzantine tax law. I can't help it.", scores: { openness: 1.9, diligence: -0.4 } },
    ]
  },
  {
    id: "G06", type: "PAIR", trait: "diligence",
    text: "Which more accurately describes you when starting a major project?",
    options: [
      { text: "I map out the full timeline, break it into milestones, set buffer time, and track progress daily.", scores: { diligence: 1.8, security: 0.6 } },
      { text: "I dive in immediately — too much planning kills momentum.", scores: { diligence: -1.2, autonomy: 0.8, risk: 0.6 } },
      { text: "I sketch a rough plan and adjust as I go — structured enough to have direction, flexible enough to pivot.", scores: { diligence: 0.4, openness: 0.4 } },
      { text: "I delegate the planning while I focus on execution and ideas.", scores: { diligence: -0.5, social: 0.8 } },
    ]
  },
  {
    id: "G07", type: "SJT", trait: "social",
    text: "After an intense week of solo deep-work — no meetings, no calls, full focus — you have a free Saturday. You most naturally:",
    options: [
      { text: "Call friends, go out, talk to people — the week of isolation drained me.", scores: { social: 1.8, autonomy: -0.3 } },
      { text: "Mix it up — a short coffee with one or two close friends, then alone time in the evening.", scores: { social: 0.5, openness: 0.3 } },
      { text: "Continue working on a personal project — I find solo work energizing, not draining.", scores: { social: -0.8, autonomy: 1.0 } },
      { text: "Completely off-grid. No screens, no people. A long walk or reading.", scores: { social: -1.7, openness: 0.8 } },
    ]
  },
  {
    id: "G08", type: "LOSS", trait: "security",
    text: "Two career paths with identical 20-year NPV:\n\nPath SECURE: ₹12L Year 1, growing 8% annually, very low variance (PSU-like stability).\nPath VARIABLE: ₹8L Year 1, but 60% chance of reaching ₹30L by Year 7, and 40% chance of stagnating below ₹10L.\n\nBoth have identical expected NPV. Which do you choose?",
    options: [
      { text: "SECURE, without hesitation. If the NPV is equal, the certain outcome is strictly superior.", scores: { security: 1.9, risk: -1.6 } },
      { text: "SECURE, but only because my current financial obligations require stability.", scores: { security: 0.8, risk: -0.5 } },
      { text: "VARIABLE. Equal NPV, but the upside tail is asymmetric. The 60% probability of ₹30L matters more.", scores: { security: -0.8, risk: 1.4 } },
      { text: "VARIABLE. I don't care about the downside — if I stagnate I'll pivot. The ceiling is what matters.", scores: { security: -1.8, risk: 1.9 } },
    ]
  },
] as const;

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PsychometricPage() {
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [currentItem, setCurrentItem] = useState<PsychItem | null>(null);
  const [itemsCompleted, setItemsCompleted] = useState(0);
  const [traits, setTraits] = useState<TraitVector>({ risk: 0, value: 0, autonomy: 0, ai_adapt: 0, openness: 0, diligence: 0, social: 0, security: 0 });
  const [traitSE, setTraitSE] = useState<Record<string, number>>({});
  const [posterior, setPosterior] = useState<Record<string, number>>({});
  const [primaryArchetype, setPrimaryArchetype] = useState<string | null>(null);
  const [estimatedRemaining, setEstimatedRemaining] = useState(16);
  const [isAnimating, setIsAnimating] = useState(false);
  const [phase, setPhase] = useState<"intro" | "testing" | "result">("intro");
  const [report, setReport] = useState<FinalReport | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [offlineIndex, setOfflineIndex] = useState(0);
  const [offlineAnswered, setOfflineAnswered] = useState<string[]>([]);
  const [offlineTraits, setOfflineTraits] = useState<TraitVector>({ risk: 0, value: 0, autonomy: 0, ai_adapt: 0, openness: 0, diligence: 0, social: 0, security: 0 });

  // ── Start Session ──────────────────────────────────────────────────────────
  const startSession = useCallback(async () => {
    setPhase("testing");
    setItemsCompleted(0);
    setTraits({ risk: 0, value: 0, autonomy: 0, ai_adapt: 0, openness: 0, diligence: 0, social: 0, security: 0 });
    setOfflineTraits({ risk: 0, value: 0, autonomy: 0, ai_adapt: 0, openness: 0, diligence: 0, social: 0, security: 0 });
    setOfflineIndex(0);
    setOfflineAnswered([]);
    setPosterior({});
    setPrimaryArchetype(null);
    setEstimatedRemaining(16);
    setReport(null);

    const initSessionState: SessionState = {
      session_id: "init",
      item: null,
      is_converged: false,
      items_completed: 0,
      traits: { risk: 0, value: 0, autonomy: 0, ai_adapt: 0, openness: 0, diligence: 0, social: 0, security: 0 },
      archetype_posterior: {},
    };
    setSessionState(initSessionState);

    try {
      const res = await fetch("/api/v2/psychometric/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stream: "", budget: 15 }),
      });
      if (res.ok) {
        const data: SessionState = await res.json();
        if (data && data.item && data.session_id) {
          setBackendAvailable(true);
          setSessionId(data.session_id);
          setCurrentItem(data.item);
          setTraits(data.traits || { risk: 0, value: 0, autonomy: 0, ai_adapt: 0, openness: 0, diligence: 0, social: 0, security: 0 });
          setPosterior(data.archetype_posterior || {});
          setSessionState(data);
          return;
        }
      }
    } catch {
      // fall through to offline mode
    }

    setBackendAvailable(false);
    setCurrentItem(OFFLINE_GATEWAY[0] as unknown as PsychItem);
    setOfflineIndex(1);
    setPosterior({});
  }, []);

  // ── Handle Answer ──────────────────────────────────────────────────────────
  const handleAnswer = useCallback(async (optionIndex: number) => {
    if (!currentItem || isAnimating) return;

    setIsAnimating(true);
    await new Promise(r => setTimeout(r, 100)); // faster

    const newCompleted = itemsCompleted + 1;
    setItemsCompleted(newCompleted);

    // ── Backend mode ─────────────────────────────────────────────
    if (backendAvailable && sessionId) {
      try {
        const res = await fetch("/api/v2/psychometric/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, item_id: currentItem.id, option_index: optionIndex }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && (data.traits || data.item || data.is_converged)) {
            setTraits(data.traits ?? traits);
            setPosterior(data.archetype_posterior ?? posterior ?? {});
            setPrimaryArchetype(data.primary_archetype ?? primaryArchetype);
            setEstimatedRemaining(data.estimated_remaining ?? Math.max(0, estimatedRemaining - 1));
            setSessionState(data);

            if (data.is_converged || !data.item) {
              // Fetch final report
              const rRes = await fetch(`/api/v2/psychometric/result/${sessionId}`);
              if (rRes.ok) {
                const rData: FinalReport = await rRes.json();
                setReport(rData);
                setPhase("result");
                setIsAnimating(false);
                return;
              }
            } else {
              setCurrentItem(data.item);
              setIsAnimating(false);
              return;
            }
          }
        }
      } catch {
        // fall through to offline
        setBackendAvailable(false);
      }
    }

    // ── Offline mode ──────────────────────────────────────────────
    const item = OFFLINE_GATEWAY.find(it => it.id === currentItem.id);
    const updatedTraits = { ...offlineTraits };
    if (item) {
      const opt = item.options[optionIndex] as { text: string; scores: Partial<TraitVector> };
      const scores = opt.scores;
      (Object.keys(scores) as (keyof TraitVector)[]).forEach(k => {
        updatedTraits[k] = Math.max(-3, Math.min(3, updatedTraits[k] + (scores[k] ?? 0)));
      });
    }
    setOfflineTraits(updatedTraits);
    setTraits(updatedTraits);
    const newAnswered = [...offlineAnswered, currentItem.id];
    setOfflineAnswered(newAnswered);

    const nextIdx = offlineIndex;
    if (nextIdx < OFFLINE_GATEWAY.length) {
      setCurrentItem(OFFLINE_GATEWAY[nextIdx] as unknown as PsychItem);
      setOfflineIndex(nextIdx + 1);
      setEstimatedRemaining(Math.max(0, estimatedRemaining - 1));
    } else {
      // Generate offline report
      const PROFILES: Record<string, { label: string; emoji: string; description: string; career_paths: string[]; caution: string }> = {
        VENTURE_BUILDER: { label: "High-Growth Venture Builder", emoji: "🚀", description: "You are energized by building what doesn't exist. Uncertainty feels like opportunity.", career_paths: ["Startup Founder", "Early-Stage VC", "CPO", "CTO"], caution: "Validate rigorously before committing capital." },
        TECHNOLOGIST: { label: "AI-Native Technologist", emoji: "🤖", description: "You are at the frontier of technical change, finding mastery deeply fulfilling.", career_paths: ["ML Engineer", "AI Researcher", "Staff Engineer"], caution: "Ensure technical depth translates to business outcomes." },
        IRR_OPTIMIZER: { label: "Pragmatic IRR Optimizer", emoji: "📊", description: "You make career decisions with clear return metrics and payback periods modeled.", career_paths: ["Investment Banking", "Private Equity", "CFO"], caution: "Hyper-optimization for financial return can miss non-quantifiable gains." },
        STABILITY_ANCHOR: { label: "Stability-Seeking Anchor", emoji: "⚓", description: "You value predictability, institutional backing, and genuine security.", career_paths: ["Civil Services", "PSU Engineering", "Government Finance"], caution: "Optimize within your chosen stability path — depth still compounds." },
        RESEARCH_INNOVATOR: { label: "Deep Research Innovator", emoji: "🔬", description: "Driven by understanding things at a depth most find unnecessary.", career_paths: ["PhD Research", "R&D Deep Tech", "Quant Research"], caution: "Research careers require navigating institutional politics." },
        PEOPLE_LEADER: { label: "People-Centric Leader", emoji: "🤝", description: "Energized by helping others grow, building team cultures.", career_paths: ["HR Leadership", "People Manager", "Education", "Coaching"], caution: "People leadership without strong context-setting often burns out." },
      };

      // Simple archetype scoring from traits
      const scores: Record<string, number> = {
        VENTURE_BUILDER: updatedTraits.risk * 1.8 + updatedTraits.autonomy * 1.8,
        TECHNOLOGIST: updatedTraits.ai_adapt * 2.0 + updatedTraits.openness * 1.4,
        IRR_OPTIMIZER: updatedTraits.value * 2.0 + updatedTraits.diligence * 1.5,
        STABILITY_ANCHOR: (-updatedTraits.risk) * 1.8 + updatedTraits.security * 2.0,
        RESEARCH_INNOVATOR: updatedTraits.openness * 1.9 + updatedTraits.diligence * 1.6,
        PEOPLE_LEADER: updatedTraits.social * 2.0 + updatedTraits.openness * 0.8,
      };

      const primaryKey = Object.entries(scores).sort(([, a], [, b]) => b - a)[0][0];
      const secondaryKey = Object.entries(scores).sort(([, a], [, b]) => b - a)[1][0];
      const pa = PROFILES[primaryKey] ?? PROFILES.TECHNOLOGIST;
      const sa = PROFILES[secondaryKey] ?? PROFILES.IRR_OPTIMIZER;

      const totalScore = Object.values(scores).reduce((s, v) => s + Math.exp(v), 0);
      const posteriorOffline: Record<string, number> = {};
      Object.entries(scores).forEach(([k, v]) => { posteriorOffline[k] = Math.exp(v) / totalScore; });

      const traitPct: Record<string, number> = {};
      TRAITS.forEach(t => { traitPct[t.key] = Math.round(((updatedTraits[t.key as keyof TraitVector] + 3) / 6) * 100); });

      const offlineReport: FinalReport = {
        session_id: "offline",
        items_completed: newCompleted,
        validity_ok: true,
        primary_archetype: { key: primaryKey, ...pa, probability_pct: Math.round((posteriorOffline[primaryKey] ?? 0) * 100) },
        secondary_archetype: { key: secondaryKey, label: sa.label, emoji: sa.emoji, probability_pct: Math.round((posteriorOffline[secondaryKey] ?? 0) * 100) },
        top3_archetypes: Object.entries(scores).sort(([, a], [, b]) => b - a).slice(0, 3).map(([k]) => [k, Math.round((posteriorOffline[k] ?? 0) * 100)]) as [string, number][],
        trait_vector: updatedTraits,
        trait_percentiles: traitPct,
        trait_confidence: Object.fromEntries(TRAITS.map(t => [t.key, "medium"])),
        archetype_posterior: posteriorOffline,
      };
      setReport(offlineReport);
      setPhase("result");
    }

    setIsAnimating(false);
  }, [currentItem, isAnimating, itemsCompleted, backendAvailable, sessionId, traits, posterior, primaryArchetype, estimatedRemaining, offlineTraits, offlineIndex, offlineAnswered]);

  const handleRestart = () => {
    setPhase("intro");
    setSessionState(null);
    setReport(null);
    setSessionId(null);
    setCurrentItem(null);
    setBackendAvailable(null);
  };

  const progressPct = Math.min(100, Math.round((itemsCompleted / 15) * 100));

  // Render logic

  if (!sessionState && phase === "intro") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
              <span className="font-mono font-bold text-xl text-slate-950">IL</span>
            </div>
          </div>
          <div className="text-rose-600 uppercase tracking-widest text-xs font-mono font-semibold">
            3PL Item Response Theory · Adaptive Diagnostic
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-slate-950">
            Your psychometric baseline.
          </h1>
          <p className="text-slate-600 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            An adaptive IRT engine — not a personality quiz. 12–15 calibrated items with SE &lt; 0.28 convergence criterion.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto text-left mt-8">
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="text-sm font-semibold text-slate-900">3PL IRT Model</div>
              <div className="text-xs text-slate-500 mt-0.5">Parameters: a, b, c</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="text-sm font-semibold text-slate-900">Adaptive Item Selection</div>
              <div className="text-xs text-slate-500 mt-0.5">Maximum Fisher Info</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="text-sm font-semibold text-slate-900">Bayesian Convergence</div>
              <div className="text-xs text-slate-500 mt-0.5">Standard Error &lt; 0.28</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="text-sm font-semibold text-slate-900">8 Career Archetypes</div>
              <div className="text-xs text-slate-500 mt-0.5">Sovereign trait vector</div>
            </div>
          </div>

          <div className="pt-8">
            <button
              onClick={startSession}
              className="inline-flex items-center gap-2 px-8 py-4 bg-slate-950 hover:bg-slate-800 text-white rounded-xl font-bold transition shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Begin Diagnostic &mdash;&gt;
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (sessionState && !report && phase === "testing" && currentItem) {
    const currentTrait = TRAITS.find(t => t.key === currentItem.trait)?.label || currentItem.trait;

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="h-2 bg-slate-100 rounded-full mb-8 overflow-hidden">
            <div 
              className="h-full bg-rose-600 transition-all duration-300 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          
          <div className="font-mono text-slate-400 text-xs mb-4 uppercase tracking-wider font-semibold">
            Item {itemsCompleted + 1} · Trait: {currentTrait}
          </div>

          <h2 className="font-serif text-2xl md:text-3xl leading-relaxed mb-8 text-slate-950 font-bold">
            {currentItem.text}
          </h2>

          <div className="space-y-3">
            {currentItem.options.map((opt, i) => (
              <div
                key={i}
                onClick={() => handleAnswer(i)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 
                  ${isAnimating ? "opacity-50 pointer-events-none" : "hover:border-slate-400 hover:shadow-sm border-slate-200 bg-slate-50/50 hover:bg-white text-slate-800"}
                `}
              >
                <div className="flex items-start gap-3">
                  <span className="font-mono text-slate-400 font-bold mt-0.5">{String.fromCharCode(65 + i)}.</span>
                  <span className="text-sm font-medium leading-relaxed">{opt.text}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center font-mono text-xs text-slate-400">
            Convergence: SE({currentItem.trait}) &rarr; 0.28
          </div>
        </div>
      </div>
    );
  }

  if (report && phase === "result") {
    let score = Math.round(report.primary_archetype?.probability_pct ?? 0);
    if (score > 100) {
      const vals = Object.values(report.trait_percentiles ?? {});
      score = Math.round(vals.reduce((a,b)=>a+b,0) / Math.max(1, vals.length));
      if (score > 100) score = 100;
    }
    const circum = 2 * Math.PI * 40;
    const strokeDasharray = `${(score / 100) * circum} ${circum}`;

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 p-6 md:p-12">
        <div className="max-w-4xl mx-auto space-y-10">
          
          <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="relative w-[100px] h-[100px] flex items-center justify-center shrink-0">
              <svg width="100" height="100" className="transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#E2E8F0" strokeWidth="8" />
                <circle 
                  cx="50" cy="50" r="40" 
                  fill="transparent" 
                  stroke="#E11D48" 
                  strokeWidth="8" 
                  strokeDasharray={strokeDasharray}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-black text-slate-950">{score}</span>
              </div>
            </div>
            
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-mono mb-3 border border-rose-200 uppercase tracking-widest font-semibold">
                Primary Archetype
              </div>
              <h2 className="font-serif text-3xl font-bold text-slate-950 mb-2 flex items-center gap-3">
                <span className="text-4xl">{report.primary_archetype.emoji}</span>
                {report.primary_archetype.label}
              </h2>
              <p className="text-slate-600 leading-relaxed text-base max-w-2xl">
                {report.primary_archetype.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="inline-block px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-mono mb-3 border border-purple-200 uppercase tracking-widest font-semibold">
                  Secondary Archetype
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-3xl">{report.secondary_archetype.emoji}</span>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{report.secondary_archetype.label}</h3>
                    <p className="text-slate-500 font-mono text-sm">{report.secondary_archetype.probability_pct}% match</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-mono text-slate-500 uppercase tracking-widest text-xs mb-6 font-semibold">Trait Dimensions</h3>
                <div className="space-y-5">
                  {TRAITS.map(t => {
                    const val = report.trait_percentiles?.[t.key] ?? 50;
                    return (
                      <div key={t.key}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-700 font-medium">{t.label}</span>
                          <span className="font-mono text-slate-500 font-bold">{val}th</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${val}%`, backgroundColor: t.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col justify-between">
                <div>
                  <h3 className="font-mono text-slate-500 uppercase tracking-widest text-xs mb-6 font-semibold">Career Alignments</h3>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {report.primary_archetype.career_paths.map(cp => (
                      <span key={cp} className="px-3 py-1.5 bg-slate-50 text-slate-800 rounded-lg text-xs font-medium border border-slate-200">
                        {cp}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    {report.primary_archetype.caution}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 border-t border-slate-200">
            <Link href="/workspace" className="px-8 py-3 bg-slate-950 hover:bg-slate-800 text-white rounded-xl font-bold transition shadow-sm w-full sm:w-auto text-center focus:outline-none focus:ring-2 focus:ring-blue-500">
              Take to Workspace &mdash;&gt;
            </Link>
            <button onClick={handleRestart} className="px-8 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold transition w-full sm:w-auto">
              Retake Diagnostic
            </button>
          </div>
          
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="font-mono text-sm text-slate-500">Calibrating the adaptive engine…</p>
    </div>
  );
}
