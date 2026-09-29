"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Brain, Shield, AlertTriangle, Zap, Globe, FlaskConical,
  Building2, Heart, Palette, Anchor, MessageSquare, Activity, Calculator,
} from "lucide-react";
import { finiteOrNull } from "@/lib/mock-data";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { Notice } from "@/components/Notice";
import { Skeleton } from "@/components/Skeleton";

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
/**
 * Trait label → CSS custom property, not a hex.
 *
 * These were eight hardcoded light-palette hexes drawn as inline
 * `backgroundColor` on a bar. A dark-mode visitor got the light palette's
 * colour on a black surface, which reads as a different colour entirely.
 * `var(--red)` / `var(--accent)` etc. resolve per theme, so a bar means the
 * same thing in both — and the palette is now the one in `globals.css`.
 */
const TRAITS = [
  { key: "risk",        label: "Risk Appetite",         color: "var(--red)" },
  { key: "value",       label: "ROI Orientation",       color: "var(--amber)" },
  { key: "autonomy",    label: "Autonomy Drive",        color: "var(--purple)" },
  { key: "ai_adapt",    label: "AI Adaptability",       color: "var(--teal)" },
  { key: "openness",    label: "Intellectual Openness", color: "var(--green)" },
  { key: "diligence",   label: "Diligence",             color: "var(--blue)" },
  { key: "social",      label: "Social Drive",          color: "var(--accent)" },
  { key: "security",    label: "Security Need",         color: "var(--text-tertiary)" },
];

const ARCHETYPE_ICONS: Record<string, React.ReactNode> = {
  VENTURE_BUILDER:     <Zap className="h-8 w-8" />,
  TECHNOLOGIST:        <Brain className="h-8 w-8" />,
  IRR_OPTIMIZER:       <Calculator className="h-8 w-8" />,
  GLOBAL_ARBITRAGEUR:  <Globe className="h-8 w-8" />,
  RESEARCH_INNOVATOR:  <FlaskConical className="h-8 w-8" />,
  ENTERPRISE_OPERATOR: <Building2 className="h-8 w-8" />,
  PEOPLE_LEADER:       <Heart className="h-8 w-8" />,
  CREATIVE_DISRUPTOR:  <Palette className="h-8 w-8" />,
  STABILITY_ANCHOR:    <Anchor className="h-8 w-8" />,
  POLICY_AGENT:        <MessageSquare className="h-8 w-8" />,
  CLINICAL_SPECIALIST: <Heart className="h-8 w-8" />,
  FINANCIAL_ENGINEER:  <Activity className="h-8 w-8" />,
};

const TRAIT_TYPE_LABELS: Record<string, string> = {
  SJT:   "Situation",
  PAIR:  "Preference",
  FREQ:  "Self-Report",
  LOSS:  "Economic",
  TIME:  "Time Preference",
  MATH:  "Quantitative",
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
      <div className="page-shell">
        <div className="container-md page-header">
          <PageHeader
            align="center"
            kicker="3PL Item Response Theory · Adaptive diagnostic"
            eyebrow={
              <span className="badge badge-rose">
                <Shield size={10} aria-hidden="true" />
                Adaptive · 12&ndash;15 calibrated items
              </span>
            }
            title="Your psychometric baseline."
            lead="An adaptive IRT engine — not a personality quiz. 12–15 calibrated items, stopped when the standard error on the trait estimate falls below 0.28."
          />

          <div className="panel mt-2">
            <div className="panel-head">
              <span className="panel-title">Engine specification</span>
            </div>
            <div className="panel-pad">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { head: "3PL IRT model", sub: "Parameters: a, b, c" },
                  { head: "Adaptive item selection", sub: "Maximum Fisher information" },
                  { head: "Bayesian convergence", sub: "Standard error < 0.28" },
                  { head: "8 career archetypes", sub: "Sovereign trait vector" },
                ].map((spec) => (
                  <div
                    key={spec.head}
                    className="t-chip rounded-lg border p-4"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <div className="text-[14px] font-semibold t-text">{spec.head}</div>
                    <div className="mono mt-0.5 text-[12px] t-muted">{spec.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button type="button" onClick={startSession} className="btn-primary">
              <span>Begin diagnostic</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (sessionState && !report && phase === "testing" && currentItem) {
    const currentTrait = TRAITS.find(t => t.key === currentItem.trait)?.label || currentItem.trait;

    return (
      <div className="page-shell">
        <div className="container-md py-10 md:py-16">
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">
                Item <span className="num">{itemsCompleted + 1}</span>
              </span>
              <span className="num text-[11px] t-faint">{currentTrait}</span>
            </div>

            <div className="panel-pad">
              {/* Progress. The track is a data surface, not decoration, so it
                  carries `aria` state rather than being a bare coloured bar. */}
              <div
                className="ci-track mb-7"
                role="progressbar"
                aria-label="Diagnostic progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progressPct}
              >
                <div
                  className="ci-fill"
                  style={{ width: `${progressPct}%`, background: "var(--accent)" }}
                />
              </div>

              <h2 className="page-title-sm mb-7 whitespace-pre-line">
                {currentItem.text}
              </h2>

              <div className="space-y-2.5">
                {currentItem.options.map((opt, i) => (
                  /* A real `<button>`, not a `div` with onClick: the answer
                     options were previously unreachable by keyboard and had no
                     focus ring at all. Same handler, same order, same options. */
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAnswer(i)}
                    disabled={isAnimating}
                    className="selection-card flex w-full items-start gap-3 text-left disabled:opacity-50"
                  >
                    <span className="num mt-0.5 font-bold t-faint" aria-hidden="true">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <span className="text-[14px] font-medium leading-relaxed t-text">
                      {opt.text}
                    </span>
                  </button>
                ))}
              </div>

              <p className="mt-7 text-center">
                <span className="num text-[11px] t-faint">
                  Convergence: SE({currentItem.trait}) &rarr; 0.28
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (report && phase === "result") {
    /**
     * The headline confidence figure.
     *
     * A missing `probability_pct` used to coerce to `0`, which drew an empty
     * ring and stamped "0" on the page — an assertion of no confidence rather
     * than an unmeasured one. It is now `null` and renders the unmeasured
     * state. When a number *is* present the original arithmetic is unchanged.
     */
    const reportedProbability = finiteOrNull(report.primary_archetype?.probability_pct);
    let score: number | null = reportedProbability == null ? null : Math.round(reportedProbability);
    if (score != null && score > 100) {
      const vals = Object.values(report.trait_percentiles ?? {});
      score = Math.round(vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length));
      if (score > 100) score = 100;
    }
    const circum = 2 * Math.PI * 40;
    const strokeDasharray = `${((score ?? 0) / 100) * circum} ${circum}`;
    const ringColor = score == null ? "var(--text-tertiary)" : "var(--accent)";

    return (
      <div className="page-shell">
        <div className="container-xl page-header-sm">
          {/* Primary archetype */}
          <div className="panel">
            <div className="panel-pad">
              <div className="flex flex-col items-center gap-7 md:flex-row">
                <div
                  className="relative flex h-[100px] w-[100px] flex-shrink-0 items-center justify-center"
                  role="img"
                  aria-label={
                    score == null
                      ? "Archetype confidence not measured"
                      : `Archetype confidence ${score} out of 100`
                  }
                >
                  <svg width="100" height="100" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
                    <circle
                      cx="50" cy="50" r="40"
                      fill="none" stroke="var(--bg-chip)" strokeWidth="8"
                    />
                    <circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke={ringColor}
                      strokeWidth="8"
                      strokeDasharray={strokeDasharray}
                      strokeLinecap="round"
                      opacity={score == null ? 0.35 : 1}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {score == null ? (
                      <span className="num-na text-2xl leading-none">&mdash;</span>
                    ) : (
                      <span className="metric-lg t-text">{score}</span>
                    )}
                  </div>
                </div>

                <div className="min-w-0 text-center md:text-left">
                  <span className="badge badge-rose">Primary archetype</span>
                  <h2 className="mt-3 flex items-center justify-center gap-3 text-[26px] font-bold t-text md:justify-start">
                    <span className="text-3xl" aria-hidden="true">
                      {report.primary_archetype.emoji}
                    </span>
                    {report.primary_archetype.label}
                  </h2>
                  <p className="lead-p mt-2.5">
                    {report.primary_archetype.description}
                  </p>
                  <p className="num mt-2.5 text-[11px] t-faint">
                    {score == null
                      ? "Confidence not reported by the engine"
                      : `Posterior ${score}% · ${report.items_completed} items completed`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="panel">
                <div className="panel-head">
                  <span className="panel-title">Secondary archetype</span>
                </div>
                <div className="panel-pad">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl" aria-hidden="true">
                      {report.secondary_archetype.emoji}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-bold t-text">
                        {report.secondary_archetype.label}
                      </h3>
                      <p className="num text-[12px] t-muted">
                        <span className="num-1">{report.secondary_archetype.probability_pct}</span>% match
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-head">
                  <span className="panel-title">Trait dimensions</span>
                  <span className="num text-[11px] t-faint">Percentile vs reference cohort</span>
                </div>
                <div className="panel-pad">
                  <div className="space-y-5">
                    {TRAITS.map((t) => {
                      /**
                       * No percentile in the report is drawn as an empty track
                       * with a dash, not as the 50th. The previous `?? 50`
                       * invented a cohort position the engine never produced.
                       */
                      const val = finiteOrNull(report.trait_percentiles?.[t.key]);
                      return (
                        <div key={t.key}>
                          <div className="mb-2 flex items-baseline justify-between gap-3">
                            <span className="text-[13px] font-medium t-muted">
                              {t.label}
                            </span>
                            <span
                              className={`text-[12px] font-bold t-text ${val == null ? "num-na" : "num"}`}
                            >
                              {val == null ? "—" : `${val}th`}
                            </span>
                          </div>
                          <div className="ci-track">
                            {val != null && (
                              <div
                                className="ci-fill"
                                style={{ width: `${val}%`, background: t.color }}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="panel flex flex-col">
              <div className="panel-head">
                <span className="panel-title">Career alignments</span>
              </div>
              <div className="panel-pad flex flex-1 flex-col">
                <div className="flex flex-wrap gap-2">
                  {report.primary_archetype.career_paths.length === 0 ? (
                    <span className="num-na text-[13px]">No career paths reported</span>
                  ) : (
                    report.primary_archetype.career_paths.map((cp) => (
                      <span
                        key={cp}
                        className="t-chip rounded-lg border px-3 py-1.5 text-[12px] font-medium t-text"
                        style={{ borderColor: "var(--border-subtle)" }}
                      >
                        {cp}
                      </span>
                    ))
                  )}
                </div>

                <div className="mt-6">
                  <Notice tone="warn" icon={AlertTriangle} title="Stated caution">
                    {report.primary_archetype.caution}
                  </Notice>
                </div>

                <Notice tone="info" className="mt-4" title="How to read this">
                  A trait percentile is a position against the engine&apos;s reference
                  cohort, not a measurement of ability. An archetype posterior is the
                  engine&apos;s probability for the label, not a prediction about a career.
                </Notice>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
            <Link href="/workspace" className="btn-primary">
              Take it to workspace
            </Link>
            <button type="button" onClick={handleRestart} className="btn-secondary">
              Retake diagnostic
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Awaiting the next adaptive item from the engine. A skeleton, not a
  // spinner: this is a data fetch, and a spinner promises a wait it cannot
  // know the length of while telling the reader nothing about what is coming.
  return (
    <div className="page-shell">
      <div className="container-md py-16">
        <div className="mx-auto max-w-xl" role="status" aria-live="polite">
          <span className="sr-only">Calibrating the adaptive engine…</span>
          <Skeleton className="h-2.5 w-28" />
          <Skeleton className="mt-5 h-8 w-4/5" delay={60} />
          <div className="mt-8 space-y-3">
            <Skeleton className="h-14" delay={100} />
            <Skeleton className="h-14" delay={160} />
            <Skeleton className="h-14" delay={220} />
            <Skeleton className="h-14" delay={280} />
          </div>
        </div>
      </div>
    </div>
  );
}
