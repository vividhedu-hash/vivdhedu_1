"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TraitRadarChart } from "./TraitRadarChart";
import { MicroDilemmaCard, DilemmaItem, Option } from "./MicroDilemmaCard";
import { PointAllocator } from "./PointAllocator";
import {
  GraduationCap, DollarSign, MapPin, Target, Sparkles, Brain,
  ChevronRight, Loader2, CheckCircle2, ShieldCheck, Activity
} from "lucide-react";

// 20-item graded IRT bank — 5 items per trait, b: easy(-1.2) → vhard(+1.5)
// Matches the backend adaptive_cat.py item bank exactly
const ITEM_BANK: DilemmaItem[] = [
  // RISK trait
  { id: "risk_easy", trait: "risk", prompt: "Your family offers to fully fund any degree in India — zero loan required. How important is college brand name to you?", options: [
    { label: "A) Extremely — prestige signals quality and alumni network", score: 0.5, value_bias: 0.4 },
    { label: "B) Matters, but ROI and placement data matters more", score: 1.0, value_bias: 0.8 },
    { label: "C) Not at all — best fee/outcome ratio wins", score: 1.5 },
    { label: "D) I would defer and work a year before deciding", score: -0.5 },
  ]},
  { id: "risk_belavg", trait: "risk", prompt: "NIT Trichy CSE at ₹5.5L total vs a private Tier-1 college CSE at ₹15L with 92% placement. Your family can fund ₹10L max.", options: [
    { label: "A) Take NIT Trichy — government brand, lower cost, safe", score: -0.8, value_bias: 0.3 },
    { label: "B) Private college — placement data supports the higher investment", score: 1.2, value_bias: 1.2 },
    { label: "C) Take an education loan for the private college — worth the risk", score: 1.6 },
    { label: "D) Reappear for JEE next year to get a better NIT seat", score: -1.5 },
  ]},
  { id: "risk_med", trait: "risk", prompt: "A venture studio offers ₹6L stipend + 5% equity in an early-stage AI firm vs. a ₹12L fixed package at an established IT major. Your reaction?", options: [
    { label: "A) Take the IT major — guaranteed stability & zero risk", score: -1.5, value_bias: 0.2 },
    { label: "B) Negotiate higher fixed salary at IT, ignore equity", score: -0.8, value_bias: 0.5 },
    { label: "C) Choose venture studio — equity upside and early ownership matter more", score: 1.4, autonomy_bias: 1.2 },
    { label: "D) Split: take IT job, build startup prototype on weekends", score: 0.6, autonomy_bias: 0.8 },
  ]},
  { id: "risk_hard", trait: "risk", prompt: "Bangalore offer at ₹18L. YCombinator application live (3% acceptance). Deadline clashes — must choose NOW.", options: [
    { label: "A) Accept Bangalore offer immediately — certainty of income is paramount", score: -1.8 },
    { label: "B) Apply to YC, negotiate Bangalore deadline (risky but calculated)", score: 1.2, autonomy_bias: 0.8 },
    { label: "C) Apply YC only — if rejected, scramble in next hiring cycle", score: 1.7, autonomy_bias: 1.5 },
    { label: "D) Withdraw both — travel 3 months to ideate properly", score: -0.5 },
  ]},
  { id: "risk_vhard", trait: "risk", prompt: "Age 25, ₹22L/yr job, ₹8L savings. MIT Media Lab PhD (5-year, ~$38K stipend) accepts you. Family depends on your income. Do you go?", options: [
    { label: "A) No — financial responsibility to family is non-negotiable right now", score: -1.8 },
    { label: "B) Yes — once-in-a-decade opportunity, family will adapt", score: 1.9 },
    { label: "C) Defer 1 year to build a savings buffer, then accept", score: 0.4 },
    { label: "D) Negotiate remote PhD or part-time options before deciding", score: 0.8 },
  ]},
  // VALUE trait
  { id: "value_easy", trait: "value", prompt: "A friend says: 'follow your passion, salary will follow.' How much do you agree?", options: [
    { label: "A) Completely — passion-driven careers are sustainable long-term", score: -1.5 },
    { label: "B) Mostly — but salary must cross a livable minimum", score: -0.5, risk_bias: -0.2 },
    { label: "C) Somewhat — I model expected earnings before choosing any path", score: 0.8 },
    { label: "D) Disagree entirely — career choice is a financial decision first", score: 1.5 },
  ]},
  { id: "value_belavg", trait: "value", prompt: "When choosing a degree, what is your non-negotiable decision metric?", options: [
    { label: "A) 1-Year Median Salary Placement & Payback Horizon (< 3 years)", score: 1.5, risk_bias: 0.2 },
    { label: "B) Institutional Alumni Network & Global Brand Reputation", score: 0.4, autonomy_bias: -0.3 },
    { label: "C) WLB, Location Flexibility & Low Stress Working Conditions", score: -1.2, risk_bias: -0.5 },
    { label: "D) Alignment with personal passion, regardless of initial pay", score: -1.5, risk_bias: 0.5 },
  ]},
  { id: "value_med", trait: "value", prompt: "After 2 years at your job, two promotions are offered simultaneously:", options: [
    { label: "A) Team Lead at current company: 15% hike, steady workload, familiar team", score: -0.5, risk_bias: -0.6 },
    { label: "B) High-Growth IC role at competitor: 60% hike, intense hours, new stack", score: 1.6, risk_bias: 0.9 },
    { label: "C) International transfer to regional office: 30% hike, global exposure", score: 0.8, autonomy_bias: 0.5 },
    { label: "D) Internal mobility to R&D division: same pay, cutting-edge tech learning", score: -0.2, ai_bias: 1.2 },
  ]},
  { id: "value_hard", trait: "value", prompt: "IIM-A MBA (₹26L, top India network, 2 yrs) vs TU Munich Masters (€0 tuition, EU Blue Card path, 2 yrs). Choose?", options: [
    { label: "A) IIM-A — domestic network + immediate India CTC (₹35-50L) is unmatched", score: 1.5, risk_bias: -0.2 },
    { label: "B) TU Munich — zero-cost + EU PR path + long-term global upside", score: 0.8, autonomy_bias: 0.5 },
    { label: "C) Quantify 10-year NPV for both, then decide — let the numbers speak", score: 1.8 },
    { label: "D) Neither — online MBA, deploy ₹26L as startup capital", score: -0.2, autonomy_bias: 1.2 },
  ]},
  { id: "value_vhard", trait: "value", prompt: "Path A: ₹1.2Cr cumulative over 20 years + high WLB. Path B: ₹2.8Cr cumulative + 60-hr weeks. NPV at 7% discount favors B. Choose?", options: [
    { label: "A) Path A — money isn't everything; health and time are irreplaceable", score: -1.5 },
    { label: "B) Path B — NPV is the correct framework; I optimize for financial wealth", score: 1.9 },
    { label: "C) Path B for 10 years, then transition to Path A at peak earnings", score: 1.2, risk_bias: 0.5 },
    { label: "D) Build a hybrid: high-pay project-based consulting model instead", score: 0.8, autonomy_bias: 1.0 },
  ]},
  // AUTONOMY trait
  { id: "auto_easy", trait: "autonomy", prompt: "In your dream work environment, who sets your daily tasks?", options: [
    { label: "A) My manager — I want clear direction and defined deliverables", score: -1.5 },
    { label: "B) My team — collaborative goal-setting with shared ownership", score: -0.3 },
    { label: "C) I define my own OKRs aligned to broader business goals", score: 1.2 },
    { label: "D) Nobody — I'm building my own product entirely", score: 1.8 },
  ]},
  { id: "auto_belavg", trait: "autonomy", prompt: "If given a semester off to pursue any independent project, what would you build?", options: [
    { label: "A) An open-source tool, API, or hardware prototype with GitHub traction", score: 1.8, ai_bias: 0.8 },
    { label: "B) Complete 3 certified online specializations from top universities", score: 0.2, value_bias: 0.6 },
    { label: "C) Secure a structured 6-month corporate internship at an established MNC", score: -1.2, risk_bias: -0.6 },
    { label: "D) Prepare rigorously for GATE/CAT/GRE competitive exams", score: -0.8, value_bias: 0.4 },
  ]},
  { id: "auto_med", trait: "autonomy", prompt: "Your ideal 5-year work culture is best described as:", options: [
    { label: "A) Founding/Early Employee at a high-velocity startup with unstructured responsibilities", score: 1.8, risk_bias: 1.0 },
    { label: "B) Specialist Consultant at a top firm with clear promotion tracks", score: -0.5, value_bias: 0.8 },
    { label: "C) Core Engineer at a Fortune 500 company with solid WLB", score: -1.2, risk_bias: -0.8 },
    { label: "D) Independent Freelancer / Solopreneur managing client retainers", score: 1.5, risk_bias: 0.6 },
  ]},
  { id: "auto_hard", trait: "autonomy", prompt: "Your SaaS earns ₹1.2L/month but requires 50-hr weeks. A ₹25L/yr Google offer lands in your inbox. What do you do?", options: [
    { label: "A) Accept Google — brand, compensation, and structured growth beats uncertainty", score: -1.5 },
    { label: "B) Keep the SaaS — ownership and equity potential is non-negotiable", score: 1.8 },
    { label: "C) Take Google, maintain SaaS on the side at lower hours", score: 0.3, risk_bias: -0.2 },
    { label: "D) Hire someone to run the SaaS, take Google 18 months, then revisit", score: 0.8, value_bias: 0.5 },
  ]},
  { id: "auto_vhard", trait: "autonomy", prompt: "Age 28, startup fails (₹15L personal investment lost). 3 months of runway. Your next move?", options: [
    { label: "A) Get a salaried job immediately — financial recovery takes absolute priority", score: -1.8 },
    { label: "B) Start over with lessons learned — failure is the tuition for startup education", score: 1.9 },
    { label: "C) Join a Series-B company as early employee — near-founder upside, lower risk", score: 1.2, risk_bias: 0.4 },
    { label: "D) Consult for 6 months to rebuild capital, then decide on next venture", score: 0.5 },
  ]},
  // AI ADAPTABILITY trait
  { id: "ai_easy", trait: "ai_adaptability", prompt: "How often do you use AI tools (ChatGPT, Gemini, Copilot) in your current work or studies?", options: [
    { label: "A) Never — I prefer not to rely on AI tools", score: -1.5 },
    { label: "B) Occasionally for simple tasks like grammar checks", score: -0.5 },
    { label: "C) Regularly — for research, drafting, debugging, ideation", score: 1.2 },
    { label: "D) Daily and deeply — I've built multi-agent AI automation workflows", score: 1.9 },
  ]},
  { id: "ai_belavg", trait: "ai_adaptability", prompt: "GenAI tools automate 40% of entry-level tasks in your target domain. How do you respond?", options: [
    { label: "A) Immediately master AI workflow tools & double down on system design", score: 1.6, risk_bias: 0.5 },
    { label: "B) Shift focus toward human-centric roles (Management, Client Strategy, Sales)", score: 0.4, autonomy_bias: 0.2 },
    { label: "C) Seek government or regulated sectors protected from rapid automation", score: -1.4, risk_bias: -1.2 },
    { label: "D) Wait and see how industry trends standardize before making changes", score: -0.8, risk_bias: -0.4 },
  ]},
  { id: "ai_med", trait: "ai_adaptability", prompt: "When evaluating your 10-year career resilience, where do you place your defensive moat?", options: [
    { label: "A) AI agent development, prompt engineering & autonomous system orchestration", score: 1.9, risk_bias: 0.6 },
    { label: "B) Deep physical engineering, wet-lab research, or clinical physical care", score: 1.2, risk_bias: -0.3 },
    { label: "C) C-suite stakeholder management, executive negotiation, high-empathy sales", score: 0.8, autonomy_bias: 0.5 },
    { label: "D) Statutory professional licenses (CA, Bar, Medical Council) as regulatory barriers", score: -0.6, risk_bias: -1.2 },
  ]},
  { id: "ai_hard", trait: "ai_adaptability", prompt: "₹30L/yr as 'Prompt Engineer & AI Systems Lead' vs ₹32L/yr as Standard Software Engineer (Java stack) at same firm. Which?", options: [
    { label: "A) Software Engineer — the Java role is more stable and proven long-term", score: -1.2 },
    { label: "B) Prompt Engineer — AI infrastructure is the next decade's backbone", score: 1.7 },
    { label: "C) Neither — freelance as an AI integration consultant at ₹50K/day", score: 1.5, autonomy_bias: 1.2 },
    { label: "D) Ask for a hybrid role combining both skill sets first", score: 0.4 },
  ]},
  { id: "ai_vhard", trait: "ai_adaptability", prompt: "GPT-6 level models (2027) automate 70% of coding tasks. Your 3-year pivot strategy?", options: [
    { label: "A) Stay in coding — there will always be a human-in-the-loop premium", score: -0.5 },
    { label: "B) Move to AI systems architecture: training pipelines, RL fine-tuning, inference optimization", score: 1.9 },
    { label: "C) Pivot to business roles that use AI as a tool, not as the product itself", score: 0.6, value_bias: 0.5 },
    { label: "D) Launch an AI-native product company before the window closes", score: 1.6, autonomy_bias: 1.2, risk_bias: 0.8 },
  ]},
];

// ── Client-side SE-based adaptive routing (mirrors backend 3PL engine) ──────
const ALL_TRAITS = ["risk", "value", "autonomy", "ai_adaptability"] as const;
type Trait = typeof ALL_TRAITS[number];

function calc3PLProb(theta: number, a = 1.5, b = 0.0, c = 0.05): number {
  const logit = Math.max(-12, Math.min(12, -a * (theta - b)));
  return c + (1 - c) / (1 + Math.exp(logit));
}

function clientFisherInfo(item: DilemmaItem, theta: number): number {
  const p = calc3PLProb(theta, 1.5, (item as any).difficulty_b ?? 0.0, 0.05);
  if (p <= 0.051 || p >= 0.999) return 0.001;
  const c = 0.05;
  return Math.max(0.001, (1.5 * 1.5 * Math.pow(p - c, 2) * (1 - p)) / (Math.pow(1 - c, 2) * p));
}

function computeClientSE(trait: string, answeredItems: DilemmaItem[], theta: number): number {
  const totalInfo = answeredItems
    .filter((it) => it.trait === trait)
    .reduce((acc, it) => acc + clientFisherInfo(it, theta), 0);
  return totalInfo < 0.01 ? 1.2 : 1 / Math.sqrt(totalInfo);
}

function selectClientNextItem(
  answeredIds: string[],
  traits: Record<string, number>
): DilemmaItem | null {
  const unanswered = ITEM_BANK.filter((it) => !answeredIds.includes(it.id));
  if (!unanswered.length || answeredIds.length >= 8) return null;
  const answeredItems = ITEM_BANK.filter((it) => answeredIds.includes(it.id));

  const traitSE: Record<string, number> = {};
  for (const t of ALL_TRAITS) {
    traitSE[t] = computeClientSE(t, answeredItems, traits[t] ?? 0);
  }
  const maxSE = Math.max(...Object.values(traitSE));
  if (maxSE < 0.40 && answeredIds.length >= 4) return null;

  const targetTrait = Object.entries(traitSE).sort((a, b) => b[1] - a[1])[0][0];
  const targetItems = unanswered.filter((it) => it.trait === targetTrait);
  const pool = targetItems.length > 0 ? targetItems : unanswered;
  return pool.reduce((best, it) =>
    clientFisherInfo(it, traits[it.trait] ?? 0) > clientFisherInfo(best, traits[best.trait] ?? 0) ? it : best
  , pool[0]);
}

// Alias for compat
const INITIAL_ITEM_BANK = ITEM_BANK;

const STREAMS = [
  "Engineering — CS / IT",
  "Engineering — Non-CS",
  "Commerce / Finance",
  "Management / Business",
  "Medicine / Healthcare",
  "Design / Creative",
  "Law / Policy",
  "Sciences & Humanities",
];

export function AdaptiveDiagnosticEngine() {
  const router = useRouter();

  // Engine Phase: 1 (Demographics) -> 2 (CAT Scenarios) -> 3 (Point Allocator) -> 4 (Submitting)
  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(1);

  // Demographics state
  const [stream, setStream] = useState("Engineering — CS / IT");
  const [tenthPct, setTenthPct] = useState("90");
  const [twelfthPct, setTwelfthPct] = useState("88");
  const [budget, setBudget] = useState(15); // INR Lakhs
  const [homeState, setHomeState] = useState("Karnataka");

  // CAT state
  const [history, setHistory] = useState<Array<{ item_id: string; score: number; [key: string]: any }>>([]);
  const [currentTraits, setCurrentTraits] = useState({
    risk: 0.0,
    value: 0.0,
    autonomy: 0.0,
    ai_adaptability: 0.0,
  });
  // First item: risk_med (medium difficulty, good discriminability for cold start)
  const [currentItem, setCurrentItem] = useState<DilemmaItem>(
    ITEM_BANK.find((it) => it.id === "risk_med") ?? ITEM_BANK[0]
  );
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);
  const [itemIndex, setItemIndex] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [archetype, setArchetype] = useState("Pragmatic Explorer");

  // Point allocations
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const confidencePct = Math.min(98, Math.round(40 + history.length * 7.5));

  const startAdaptiveTest = () => {
    setPhase(2);
  };

  // Process Option Selection in CAT Engine
  const handleSelectOption = async (opt: Option) => {
    const newRecord = {
      item_id: currentItem.id,
      score: opt.score,
      trait: currentItem.trait,
      value_bias: opt.value_bias,
      risk_bias: opt.risk_bias,
      autonomy_bias: opt.autonomy_bias,
      ai_bias: opt.ai_bias,
    };
    const updatedHistory = [...history, newRecord];
    const updatedAnsweredIds = [...answeredIds, currentItem.id];
    setHistory(updatedHistory);
    setAnsweredIds(updatedAnsweredIds);

    // EAP trait update from response scores (runs even without backend)
    const updatedTraits = { ...currentTraits };
    const traitKey = currentItem.trait as keyof typeof updatedTraits;
    if (traitKey in updatedTraits) {
      // Running EAP: weight new score into current estimate
      const n = updatedAnsweredIds.filter((id) =>
        ITEM_BANK.find((it) => it.id === id)?.trait === currentItem.trait
      ).length;
      updatedTraits[traitKey] = Math.max(-3.0, Math.min(3.0,
        ((updatedTraits[traitKey] * (n - 1)) + opt.score) / n
      ));
    }
    if (opt.value_bias) updatedTraits.value = Math.max(-3, Math.min(3, updatedTraits.value + opt.value_bias * 0.25));
    if (opt.risk_bias) updatedTraits.risk = Math.max(-3, Math.min(3, updatedTraits.risk + opt.risk_bias * 0.25));
    if (opt.autonomy_bias) updatedTraits.autonomy = Math.max(-3, Math.min(3, updatedTraits.autonomy + opt.autonomy_bias * 0.25));
    if (opt.ai_bias) updatedTraits.ai_adaptability = Math.max(-3, Math.min(3, updatedTraits.ai_adaptability + opt.ai_bias * 0.25));
    setCurrentTraits(updatedTraits);

    // Update Archetype
    if (updatedTraits.autonomy > 0.8 && updatedTraits.risk > 0.5) {
      setArchetype("High-Growth Venture Builder");
    } else if (updatedTraits.value > 0.8 && updatedTraits.risk < 0.0) {
      setArchetype("Pragmatic High-IRR Optimizer");
    } else if (updatedTraits.ai_adaptability > 0.8) {
      setArchetype("AI-Native Technical Specialist");
    } else if (updatedTraits.risk < -0.8 && updatedTraits.autonomy < 0) {
      setArchetype("Stability-First Conservative");
    } else {
      setArchetype("Balanced Strategic Professional");
    }

    // Client-side adaptive routing — instant, zero-latency 3PL Fisher Information engine
    const nextItem = selectClientNextItem(updatedAnsweredIds, updatedTraits);

    if (nextItem && itemIndex < 8) {
      setCurrentItem(nextItem);
      setItemIndex((prev) => prev + 1);
    } else {
      // All items answered or SE converged — transition to Phase 3
      setPhase(3);
    }
  };

  // Phase 3 Complete -> Final Analysis Submission
  const handlePointAllocationComplete = async (alloc: Record<string, number>) => {
    setAllocations(alloc);
    setPhase(4);
    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      tenth_pct: tenthPct,
      twelfth_pct: twelfthPct,
      twelfth_stream: stream,
      jee_rank: "",
      neet_score: "",
      backlog: "none",
      learning_style: "mixed",
      family_income: "5-10L",
      total_budget: budget,
      loan_willingness: "up-to-5l",
      family_support_needed: "no",
      home_state: homeState,
      relocation_india: "yes",
      relocation_abroad: "maybe",
      return_home: "no",
      primary_goals: Object.keys(alloc).filter((k) => alloc[k] > 20),
      risk_appetite: Math.max(1, Math.min(10, Math.round((currentTraits.risk + 2.5) * 2))),
      wlb_priority: Math.max(1, Math.min(10, Math.round((alloc.wlb || 20) / 10))),
      financial_independence_age: "30",
      lower_pay_meaningful: "depends",
      sports_level: "none",
      arts_level: "none",
      coding_level: stream.includes("CS") ? "intermediate" : "beginner",
      entrepreneurship_level: currentTraits.autonomy > 0.5 ? "active" : "none",
      leadership_level: "intermediate",
      p_q1: "A",
      p_q2: currentTraits.risk > 0 ? "B" : "A",
      p_q3: "C",
      fields_of_interest: [stream],
      colleges_heard_of: "",
      fields_ruled_out: "",
      future_vision: `Targeting ${archetype} career trajectory`,
      preferred_work_structure: "hybrid",
      cat_traits: currentTraits,
      archetype: archetype,
    };

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const token = data.token || data.report_token;
        if (token) {
          router.push(`/report/${token}`);
          return;
        }
      }
      setSubmitError("Could not generate your report. Please try again.");
    } catch (err) {
      console.error("Failed to submit intake report to API:", err);
      setSubmitError("Could not reach the analyze service. No demo report was generated.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6">
      {/* Top Header & Confidence Progress Bar */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-blue flex items-center gap-1">
              <span className="pulse-dot" style={{ width: 5, height: 5 }} /> Live
            </span>
            <span style={{ fontSize: 12, color: "#8B8BA7" }}>Personalized for your profile</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#F0F0F5", letterSpacing: "-0.02em" }}>
            Price my degree
          </h1>
        </div>

        {/* Confidence Meter */}
        <div style={{ textAlign: "right", minWidth: 180 }}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span style={{ fontSize: 11, color: "#8B8BA7" }} className="flex items-center gap-1">
              <Activity size={12} style={{ color: "#7B96FF" }} /> Profile accuracy
            </span>
            <span className="font-mono font-bold" style={{ fontSize: 13, color: "#7B96FF" }}>
              {confidencePct}%
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: 6,
              background: "rgba(255, 255, 255, 0.08)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${confidencePct}%`,
                height: "100%",
                background: "linear-gradient(90deg, #4F6EF7 0%, #C084FC 100%)",
                borderRadius: 999,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* PHASE 1: Fast Demographic Setup */}
      {phase === 1 && (
        <div
          style={{
            background: "rgba(18, 18, 30, 0.75)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(79, 110, 247, 0.25)",
            borderRadius: 24,
            padding: 32,
          }}
        >
          <div className="mb-6">
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#F0F0F5", marginBottom: 6 }}>
              Start with the basics
            </h2>
            <p style={{ fontSize: 13, color: "#8B8BA7" }}>
              Takes 30 seconds. This shapes which scenarios we show you next.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Stream */}
            <div>
              <label className="form-label" style={{ fontSize: 12, color: "#8B8BA7", marginBottom: 6, display: "block" }}>
                Target Field / Stream
              </label>
              <select
                className="form-input"
                value={stream}
                onChange={(e) => setStream(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "#0D0D16",
                  border: "1px solid #1E1E2E",
                  color: "#F0F0F5",
                }}
              >
                {STREAMS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Budget */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label style={{ fontSize: 12, color: "#8B8BA7" }}>Total Degree Budget (INR Lakhs)</label>
                <span className="font-mono font-bold" style={{ color: "#4F6EF7", fontSize: 14 }}>
                  ₹{budget} Lakhs
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={50}
                value={budget}
                onChange={(e) => setBudget(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "#4F6EF7" }}
              />
            </div>

            {/* 10th % */}
            <div>
              <label style={{ fontSize: 12, color: "#8B8BA7", marginBottom: 6, display: "block" }}>
                10th Class Percentage (%)
              </label>
              <input
                type="number"
                value={tenthPct}
                onChange={(e) => setTenthPct(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "#0D0D16",
                  border: "1px solid #1E1E2E",
                  color: "#F0F0F5",
                }}
              />
            </div>

            {/* 12th % */}
            <div>
              <label style={{ fontSize: 12, color: "#8B8BA7", marginBottom: 6, display: "block" }}>
                12th Class Percentage / GPA (%)
              </label>
              <input
                type="number"
                value={twelfthPct}
                onChange={(e) => setTwelfthPct(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "#0D0D16",
                  border: "1px solid #1E1E2E",
                  color: "#F0F0F5",
                }}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={startAdaptiveTest}
              className="btn btn-primary"
              style={{
                padding: "14px 32px",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Start the assessment <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2: Dynamic CAT Scenarios + Live Radar */}
      {phase === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Decision Card */}
          <div className="lg:col-span-8">
            <MicroDilemmaCard
              item={currentItem}
              onSelect={handleSelectOption}
              itemIndex={itemIndex}
              totalItems={8}
            />
          </div>

          {/* Side panel */}
          <div className="lg:col-span-4">
            <TraitRadarChart traits={currentTraits} archetype={archetype} />

            <div
              className="mt-4 p-4"
              style={{
                background: "rgba(18, 18, 30, 0.5)",
                borderRadius: 16,
                border: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={14} style={{ color: "#10B981" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#F0F0F5" }}>
                  Personalizing as you go
                </span>
              </div>
              <p style={{ fontSize: 11, color: "#8B8BA7", lineHeight: 1.5 }}>
                Each answer shifts what we ask next. Your career profile updates in real time.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 3: Point Allocator Trade-off Allocator */}
      {phase === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <PointAllocator onComplete={handlePointAllocationComplete} />
          </div>
          <div className="lg:col-span-4">
            <TraitRadarChart traits={currentTraits} archetype={archetype} />
          </div>
        </div>
      )}

      {/* PHASE 4: Submitting & Loading */}
      {phase === 4 && (
        <div
          style={{
            background: "rgba(18, 18, 30, 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(79, 110, 247, 0.3)",
            borderRadius: 24,
            padding: 60,
            textAlign: "center",
          }}
        >
          {submitError ? (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#F0F0F5", marginBottom: 8 }}>
                Report not generated
              </h2>
              <p style={{ fontSize: 14, color: "#8B8BA7", maxWidth: 460 }} className="mx-auto">
                {submitError}
              </p>
            </>
          ) : (
            <>
              <Loader2 size={48} className="animate-spin mx-auto mb-4" style={{ color: "#4F6EF7" }} />
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#F0F0F5", marginBottom: 8 }}>
                Building your report...
              </h2>
              <p style={{ fontSize: 14, color: "#8B8BA7", maxWidth: 460 }} className="mx-auto">
                Matching your profile against placement records and 20-year career projections.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
