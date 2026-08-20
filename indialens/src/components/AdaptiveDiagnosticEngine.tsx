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

const INITIAL_ITEM_BANK: DilemmaItem[] = [
  {
    id: "cat_q1",
    trait: "risk",
    prompt: "A venture studio offers ₹6L stipend + 5% equity in an early-stage AI firm vs. a ₹12L fixed package at an established IT Services major. What is your reaction?",
    options: [
      { label: "A) Take the IT Services major for guaranteed stability & zero risk", score: -1.5, value_bias: 0.2 },
      { label: "B) Negotiate higher fixed salary at IT services, ignore equity", score: -0.8, value_bias: 0.5 },
      { label: "C) Choose venture studio — equity upside and early ownership matter more", score: 1.4, autonomy_bias: 1.2 },
      { label: "D) Split time: take IT job, build startup prototype on weekends", score: 0.6, autonomy_bias: 0.8 },
    ],
  },
  {
    id: "cat_q2",
    trait: "value",
    prompt: "When choosing a degree, what is your non-negotiable decision metric?",
    options: [
      { label: "A) 1-Year Median Salary Placement & Payback Horizon (< 3 years)", score: 1.5, risk_bias: 0.2 },
      { label: "B) Institutional Alumni Network & Global Brand Reputation", score: 0.4, autonomy_bias: -0.3 },
      { label: "C) WLB, Location Flexibility & Low Stress Working Conditions", score: -1.2, risk_bias: -0.5 },
      { label: "D) Alignment with personal passion, regardless of initial pay", score: -1.5, risk_bias: 0.5 },
    ],
  },
  {
    id: "cat_q3",
    trait: "autonomy",
    prompt: "Your ideal 5-year work culture is best described as:",
    options: [
      { label: "A) Founding/Early Employee at a high-velocity startup with unstructured responsibilities", score: 1.8, risk_bias: 1.0 },
      { label: "B) Specialist Consultant at top firm with clear promotion tracks and structure", score: -0.5, value_bias: 0.8 },
      { label: "C) Core Engineer/Manager at a Fortune 500 company with solid WLB", score: -1.2, risk_bias: -0.8 },
      { label: "D) Independent Freelancer / Solopreneur managing client retainers", score: 1.5, risk_bias: 0.6 },
    ],
  },
  {
    id: "cat_q4",
    trait: "ai_adaptability",
    prompt: "GenAI tools automate 40% of entry-level tasks in your target domain. How do you prepare?",
    options: [
      { label: "A) Immediately master AI workflow tools & double down on high-level system design", score: 1.6, risk_bias: 0.5 },
      { label: "B) Shift focus toward human-centric roles (Management, Client Strategy, Sales)", score: 0.4, autonomy_bias: 0.2 },
      { label: "C) Seek government or heavily regulated sectors protected from rapid automation", score: -1.4, risk_bias: -1.2 },
      { label: "D) Wait and see how industry trends standardize before making changes", score: -0.8, risk_bias: -0.4 },
    ],
  },
];

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
    value: 0.5,
    autonomy: 0.0,
    ai_adaptability: 0.2,
  });
  const [currentItem, setCurrentItem] = useState<DilemmaItem>(INITIAL_ITEM_BANK[0]);
  const [itemIndex, setItemIndex] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [archetype, setArchetype] = useState("Pragmatic Explorer");

  // Point allocations
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const confidencePct = Math.min(98, Math.round(55 + history.length * 10));

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
    setHistory(updatedHistory);

    // Local trait update fallback
    const updatedTraits = { ...currentTraits };
    if (currentItem.trait in updatedTraits) {
      (updatedTraits as any)[currentItem.trait] += opt.score * 0.4;
    }
    if (opt.value_bias) updatedTraits.value += opt.value_bias * 0.3;
    if (opt.risk_bias) updatedTraits.risk += opt.risk_bias * 0.3;
    if (opt.autonomy_bias) updatedTraits.autonomy += opt.autonomy_bias * 0.3;
    if (opt.ai_bias) updatedTraits.ai_adaptability += opt.ai_bias * 0.3;
    setCurrentTraits(updatedTraits);

    // Update Archetype
    if (updatedTraits.autonomy > 0.8 && updatedTraits.risk > 0.5) {
      setArchetype("High-Growth Venture Builder");
    } else if (updatedTraits.value > 0.8 && updatedTraits.risk < 0.0) {
      setArchetype("Pragmatic High-IRR Optimizer");
    } else if (updatedTraits.ai_adaptability > 0.8) {
      setArchetype("AI-Native Technical Specialist");
    } else {
      setArchetype("Balanced Strategic Professional");
    }

    // Attempt backend CAT API call for dynamic next item
    try {
      const res = await fetch("/api/v1/ai/adaptive-next-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_profile: { twelfth_stream: stream, total_budget: budget },
          response_history: updatedHistory,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.traits) setCurrentTraits(data.traits);
        if (data.next_item && !data.is_converged && itemIndex < 5) {
          setCurrentItem(data.next_item);
          setItemIndex((prev) => prev + 1);
          return;
        }
      }
    } catch (e) {
      console.warn("Backend CAT API unavailable, running client adaptive selection:", e);
    }

    // Client-side fallback item selection
    if (itemIndex < INITIAL_ITEM_BANK.length) {
      setCurrentItem(INITIAL_ITEM_BANK[itemIndex]);
      setItemIndex((prev) => prev + 1);
    } else {
      // Transition to Phase 3 (Point Allocator)
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
      setSubmitError("Could not generate a report from live data. Check that FASTAPI_URL is set and the backend is running.");
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
            Find your best degree match
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
              totalItems={5}
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
                Each answer shifts what we ask next. Your career profile updates in real time on the left.
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
