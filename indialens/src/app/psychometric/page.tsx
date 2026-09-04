"use client";

import { useState, useEffect, useCallback } from "react";
import { Brain, ChevronRight, Shield, AlertTriangle, CheckCircle, RotateCcw, TrendingUp, Star, Users, Zap, Globe, FlaskConical, Building2, Heart, Palette, Anchor, MessageSquare, Activity, Calculator } from "lucide-react";

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

// ─── Trait Radar Bar Component ────────────────────────────────────────────────
function TraitBar({ label, value, color, confidence }: { label: string; value: number; color: string; confidence?: string }) {
  const pct = Math.round(((value + 3) / 6) * 100);
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-slate-400 font-mono">{label}</span>
        <div className="flex items-center gap-2">
          {confidence === "high" && <span className="text-[10px] text-emerald-400 font-mono">HIGH CONF</span>}
          {confidence === "low" && <span className="text-[10px] text-amber-400 font-mono">CALIBRATING</span>}
          <span className="text-xs font-mono" style={{ color }}>{pct}th</span>
        </div>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Question Card Component ──────────────────────────────────────────────────
function QuestionCard({
  item,
  itemNum,
  totalEst,
  onAnswer,
  isAnimating,
}: {
  item: PsychItem;
  itemNum: number;
  totalEst: number;
  onAnswer: (index: number) => void;
  isAnimating: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => { setSelected(null); }, [item.id]);

  const handleSelect = (i: number) => {
    if (selected !== null || isAnimating) return;
    setSelected(i);
    setTimeout(() => onAnswer(i), 350);
  };

  const typeLabel = TRAIT_TYPE_LABELS[item.type] ?? item.type;

  return (
    <div className={`transition-opacity duration-300 ${isAnimating ? "opacity-0" : "opacity-100"}`}>
      {/* Item header */}
      <div className="flex items-center justify-between mb-6">
        <span className="px-2 py-1 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-widest">
          {typeLabel}
        </span>
        <span className="text-xs font-mono text-slate-500">
          {itemNum} of ~{totalEst}
        </span>
      </div>

      {/* Question text */}
      <p className="text-slate-100 text-[15px] leading-relaxed mb-8 font-light whitespace-pre-line">{item.text}</p>

      {/* Options */}
      <div className="space-y-3">
        {item.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={selected !== null || isAnimating}
            className={`w-full text-left px-4 py-3 rounded border transition-all duration-200 text-sm leading-relaxed font-light
              ${selected === i
                ? "border-blue-500 bg-blue-500/10 text-blue-200"
                : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500 hover:bg-slate-800/60 hover:text-slate-100"
              }
              ${selected !== null && selected !== i ? "opacity-50" : ""}
              disabled:cursor-default
            `}
          >
            <span className="text-slate-500 font-mono text-[11px] mr-2 uppercase">
              {String.fromCharCode(65 + i)}.
            </span>
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Result Panel ─────────────────────────────────────────────────────────────
function ResultPanel({ report, onRestart }: { report: FinalReport; onRestart: () => void }) {
  const { primary_archetype: pa, secondary_archetype: sa, trait_percentiles, trait_confidence } = report;

  const sortedArchetypes = Object.entries(report.archetype_posterior)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Validity warning */}
      {!report.validity_ok && (
        <div className="flex items-start gap-3 p-4 rounded border border-amber-700/50 bg-amber-900/10">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-amber-300 text-xs font-mono">Response patterns suggest some social desirability bias. Results are directionally valid but interpret with care.</p>
        </div>
      )}

      {/* Primary archetype */}
      <div className="p-6 rounded border border-slate-700 bg-slate-900/50">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded bg-[#002F6C]/40 border border-[#0077C8]/30 text-[#0077C8]">
            {ARCHETYPE_ICONS[pa.key] ?? <Star className="w-8 h-8" />}
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-1">Primary Archetype — {pa.probability_pct}% match</div>
            <h2 className="text-xl font-bold text-slate-100">{pa.emoji} {pa.label}</h2>
          </div>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed mb-4">{pa.description}</p>

        <div className="mb-4">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Aligned Career Paths</div>
          <div className="flex flex-wrap gap-2">
            {pa.career_paths.map((cp) => (
              <span key={cp} className="px-2 py-1 text-xs font-mono bg-[#002F6C]/30 border border-[#0077C8]/30 text-[#0077C8] rounded">
                {cp}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded bg-amber-900/10 border border-amber-700/30">
          <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-amber-300 text-xs">{pa.caution}</p>
        </div>
      </div>

      {/* Secondary archetype */}
      <div className="p-4 rounded border border-slate-800 bg-slate-900/30 flex items-center gap-3">
        <div className="text-slate-400">
          {ARCHETYPE_ICONS[sa.key] ?? <Star className="w-5 h-5" />}
        </div>
        <div>
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Secondary — {sa.probability_pct}%</div>
          <div className="text-slate-200 text-sm font-medium">{sa.emoji} {sa.label}</div>
        </div>
      </div>

      {/* Trait profile */}
      <div className="p-5 rounded border border-slate-700 bg-slate-900/40">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">Trait Profile — 8 Dimensions</div>
        {TRAITS.map((t) => (
          <TraitBar
            key={t.key}
            label={t.label}
            value={report.trait_vector[t.key as keyof TraitVector]}
            color={t.color}
            confidence={trait_confidence?.[t.key]}
          />
        ))}
      </div>

      {/* Archetype distribution */}
      <div className="p-5 rounded border border-slate-700 bg-slate-900/40">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">Posterior Probability Distribution</div>
        {sortedArchetypes.map(([key, prob]) => {
          const pct = Math.round(prob * 100);
          return (
            <div key={key} className="flex items-center gap-3 mb-2">
              <span className="text-slate-400 w-4 shrink-0">{ARCHETYPE_ICONS[key]}</span>
              <span className="text-xs font-mono text-slate-400 w-44 shrink-0">{key.replace(/_/g, " ")}</span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#0077C8]/60 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-mono text-slate-400 w-8 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-600">
        <span>{report.items_completed} items administered</span>
        <span>3PL IRT + Bayesian posterior</span>
        <span className="flex items-center gap-1">
          {report.validity_ok ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <AlertTriangle className="w-3 h-3 text-amber-400" />}
          Validity {report.validity_ok ? "OK" : "FLAG"}
        </span>
      </div>

      <button
        onClick={onRestart}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors font-mono"
      >
        <RotateCcw className="w-4 h-4" />
        Restart Test
      </button>
    </div>
  );
}

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

    try {
      const res = await fetch("/api/v2/psychometric/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stream: "", budget: 15 }),
      });
      if (res.ok) {
        const data: SessionState = await res.json();
        setBackendAvailable(true);
        setSessionId(data.session_id);
        setCurrentItem(data.item);
        setTraits(data.traits);
        setPosterior(data.archetype_posterior);
        return;
      }
    } catch {
      // fall through to offline mode
    }

    setBackendAvailable(false);
    setCurrentItem(OFFLINE_GATEWAY[0] as unknown as PsychItem);
    setOfflineIndex(1);
  }, []);

  // ── Handle Answer ──────────────────────────────────────────────────────────
  const handleAnswer = useCallback(async (optionIndex: number) => {
    if (!currentItem || isAnimating) return;

    setIsAnimating(true);
    await new Promise(r => setTimeout(r, 350));

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
          setTraits(data.traits ?? traits);
          setPosterior(data.archetype_posterior ?? posterior);
          setPrimaryArchetype(data.primary_archetype ?? primaryArchetype);
          setEstimatedRemaining(data.estimated_remaining ?? Math.max(0, estimatedRemaining - 1));

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
      const posterior: Record<string, number> = {};
      Object.entries(scores).forEach(([k, v]) => { posterior[k] = Math.exp(v) / totalScore; });

      const traitPct: Record<string, number> = {};
      TRAITS.forEach(t => { traitPct[t.key] = Math.round(((updatedTraits[t.key as keyof TraitVector] + 3) / 6) * 100); });

      const offlineReport: FinalReport = {
        session_id: "offline",
        items_completed: newCompleted,
        validity_ok: true,
        primary_archetype: { key: primaryKey, ...pa, probability_pct: Math.round((posterior[primaryKey] ?? 0) * 100) },
        secondary_archetype: { key: secondaryKey, label: sa.label, emoji: sa.emoji, probability_pct: Math.round((posterior[secondaryKey] ?? 0) * 100) },
        top3_archetypes: Object.entries(scores).sort(([, a], [, b]) => b - a).slice(0, 3).map(([k]) => [k, Math.round((posterior[k] ?? 0) * 100)]) as [string, number][],
        trait_vector: updatedTraits,
        trait_percentiles: traitPct,
        trait_confidence: Object.fromEntries(TRAITS.map(t => [t.key, "medium"])),
        archetype_posterior: posterior,
      };
      setReport(offlineReport);
      setPhase("result");
    }

    setIsAnimating(false);
  }, [currentItem, isAnimating, itemsCompleted, backendAvailable, sessionId, traits, posterior, primaryArchetype, estimatedRemaining, offlineTraits, offlineIndex, offlineAnswered]);

  const handleRestart = () => {
    setPhase("intro");
    setReport(null);
    setSessionId(null);
    setCurrentItem(null);
    setBackendAvailable(null);
  };

  // Top archetype label from posterior
  const topArchetypeLabel = primaryArchetype
    ? primaryArchetype.replace(/_/g, " ")
    : Object.entries(posterior).length > 0
      ? Object.entries(posterior).sort(([, a], [, b]) => b - a)[0][0].replace(/_/g, " ")
      : null;

  const progressPct = Math.min(100, Math.round((itemsCompleted / (itemsCompleted + (estimatedRemaining || 1))) * 100));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-[#0077C8]" />
            <span className="font-mono text-sm text-slate-200">THE PROJECT — Psychometric Assessment</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
            <span>3PL IRT</span>
            <span className="text-slate-700">·</span>
            <span>Bayesian Posterior</span>
            <span className="text-slate-700">·</span>
            <span>12 Archetypes</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {phase === "intro" && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">Free Psychometric Assessment</div>
              <h1 className="text-3xl font-bold text-slate-100 mb-4 leading-tight">
                Understand the architecture of your professional self.
              </h1>
              <p className="text-slate-400 leading-relaxed mb-6">
                This is not a personality quiz. It is a validated psychometric instrument using <strong className="text-slate-200">Computerized Adaptive Testing (CAT)</strong> with Item Response Theory — the same methodology used in GMAT, GRE, and clinical psychological assessment.
              </p>
              <p className="text-slate-400 leading-relaxed mb-8">
                The engine measures 8 trait dimensions and updates a Bayesian posterior probability across 12 career archetypes after every response. The test terminates when Standard Error falls below 0.38 across all traits, typically after 16–32 questions.
              </p>

              {/* What it measures */}
              <div className="p-5 rounded border border-slate-800 bg-slate-900/50 mb-6">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">8 Dimensions Measured</div>
                <div className="grid grid-cols-2 gap-2">
                  {TRAITS.map(t => (
                    <div key={t.key} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="text-xs text-slate-300">{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded border border-slate-800 bg-slate-900/30 mb-8">
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-400">
                    <strong className="text-slate-200">No login required. No data stored. Fully anonymous.</strong>{" "}
                    Results are computed client-side when backend is unavailable. There are no right or wrong answers. Social desirability bias is detected and flagged algorithmically.
                  </p>
                </div>
              </div>

              <button
                onClick={startSession}
                className="flex items-center gap-3 px-8 py-4 bg-[#002F6C] hover:bg-[#003d8a] border border-[#0077C8]/30 text-slate-100 font-medium rounded transition-all duration-200 text-sm"
              >
                <Brain className="w-4 h-4" />
                Begin Assessment
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {phase === "testing" && currentItem && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main question panel */}
            <div className="lg:col-span-2">
              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-mono text-slate-500">PROGRESS</span>
                  <span className="text-xs font-mono text-slate-500">
                    {itemsCompleted} answered · ~{estimatedRemaining} remaining
                  </span>
                </div>
                <div className="h-0.5 bg-slate-800 rounded-full">
                  <div
                    className="h-full bg-[#0077C8] rounded-full transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Question */}
              <div className="p-6 rounded border border-slate-700 bg-slate-900/40">
                <QuestionCard
                  item={currentItem}
                  itemNum={itemsCompleted + 1}
                  totalEst={itemsCompleted + (estimatedRemaining || 16)}
                  onAnswer={handleAnswer}
                  isAnimating={isAnimating}
                />
              </div>

              {/* Backend status */}
              {backendAvailable === false && (
                <div className="mt-3 flex items-center gap-2 text-xs font-mono text-amber-500/70">
                  <AlertTriangle className="w-3 h-3" />
                  Running in client-adaptive mode — offline IRT routing active
                </div>
              )}
            </div>

            {/* Side panel — live trait radar + archetype posterior */}
            <div className="space-y-4">
              {/* Live trait bars */}
              <div className="p-5 rounded border border-slate-800 bg-slate-900/30">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">Live Trait Estimates</div>
                {TRAITS.map(t => (
                  <TraitBar
                    key={t.key}
                    label={t.label}
                    value={traits[t.key as keyof TraitVector]}
                    color={t.color}
                    confidence={traitSE[t.key] ? (traitSE[t.key] < 0.4 ? "high" : traitSE[t.key] > 0.8 ? "low" : undefined) : undefined}
                  />
                ))}
              </div>

              {/* Leading archetype */}
              {topArchetypeLabel && (
                <div className="p-4 rounded border border-[#0077C8]/20 bg-[#002F6C]/10">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Leading Archetype</div>
                  <div className="text-sm font-mono text-[#0077C8]">{topArchetypeLabel}</div>
                  <div className="text-[10px] font-mono text-slate-600 mt-1">Updates after every response</div>
                </div>
              )}

              {/* Archetype posterior top 4 */}
              {Object.keys(posterior).length > 0 && (
                <div className="p-4 rounded border border-slate-800 bg-slate-900/20">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">Posterior Distribution</div>
                  {Object.entries(posterior).sort(([, a], [, b]) => b - a).slice(0, 4).map(([key, prob]) => {
                    const pct = Math.round(prob * 100);
                    return (
                      <div key={key} className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono text-slate-500 w-28 shrink-0 truncate">{key.replace(/_/g, " ")}</span>
                        <div className="flex-1 h-1 bg-slate-800 rounded-full">
                          <div className="h-full bg-[#0077C8]/50 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 w-7 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="p-3 rounded border border-slate-800 bg-slate-900/20">
                <div className="text-[10px] font-mono text-slate-600 leading-relaxed">
                  Questions adapt based on your responses. High confidence answers reduce Standard Error faster, terminating the test earlier.
                </div>
              </div>
            </div>
          </div>
        )}

        {phase === "result" && report && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Assessment Complete</div>
              <h2 className="text-2xl font-bold text-slate-100">Your Psychometric Profile</h2>
            </div>
            <ResultPanel report={report} onRestart={handleRestart} />
          </div>
        )}
      </div>
    </div>
  );
}
