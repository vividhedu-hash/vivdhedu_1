"use client";

import React, { useState } from "react";
import {
  TrendingUp, ShieldCheck, Zap, Heart, AlertTriangle,
  Layers, ArrowUpRight, CheckCircle2, ChevronRight, Activity
} from "lucide-react";
import { formatInr } from "../lib/mock-data";

interface PathwayItem {
  collegeName: string;
  degreeName: string;
  score?: number;
  y10_salary?: number;
  placement_rate?: number;
  payback_years?: number;
}

interface MultiDirectionalProps {
  recommendations: any[];
  pathways?: {
    wealth_builder?: PathwayItem[];
    stability_fortress?: PathwayItem[];
    value_optimizer?: PathwayItem[];
    balanced_lifestyle?: PathwayItem[];
  };
}

export function MultiDirectionalAnalysis({ recommendations, pathways }: MultiDirectionalProps) {
  const [activePathway, setActivePathway] = useState<"wealth" | "stability" | "value" | "balanced">("wealth");
  const [activeScenario, setActiveScenario] = useState<"base" | "ai" | "recession">("base");

  // Fallback pathways if backend mock not populated
  const safePathways = pathways || {
    wealth_builder: recommendations.slice(0, 3).map((r) => ({
      collegeName: r.collegeName || r.college?.name,
      degreeName: r.degreeName || r.degree?.name,
      score: r.vectors?.financial_upside || 90,
      y10_salary: (r.predictedSalaryY5 || 1500000) * 2,
    })),
    stability_fortress: recommendations.slice(0, 3).map((r) => ({
      collegeName: r.collegeName || r.college?.name,
      degreeName: r.degreeName || r.degree?.name,
      score: r.vectors?.stability_resilience || 88,
      placement_rate: r.placementRate || 0.9,
    })),
    value_optimizer: recommendations.slice(0, 3).map((r) => ({
      collegeName: r.collegeName || r.college?.name,
      degreeName: r.degreeName || r.degree?.name,
      score: r.vectors?.value_efficiency || 85,
      payback_years: r.paybackYears || 1.8,
    })),
    balanced_lifestyle: recommendations.slice(0, 3).map((r) => ({
      collegeName: r.collegeName || r.college?.name,
      degreeName: r.degreeName || r.degree?.name,
      score: r.vectors?.autonomy_wlb || 82,
    })),
  };

  const topRec = recommendations[0] || {};
  const macroScenarios = topRec.macroScenarios || {
    base_case: {
      name: "Base Case (Current Market)",
      y1_salary: topRec.predictedSalaryY1 || 1000000,
      y5_salary: topRec.predictedSalaryY5 || 2200000,
      y10_salary: (topRec.predictedSalaryY5 || 2200000) * 1.8,
      placement_rate: Math.round((topRec.placementRate || 0.85) * 100),
      note: "Standard projected career trajectory based on current baseline hiring.",
    },
    ai_acceleration: {
      name: "AI Shock (+40% Automation)",
      y1_salary: Math.round((topRec.predictedSalaryY1 || 1000000) * 0.88),
      y5_salary: Math.round((topRec.predictedSalaryY5 || 2200000) * 0.94),
      y10_salary: Math.round((topRec.predictedSalaryY5 || 2200000) * 2.2),
      placement_rate: Math.round((topRec.placementRate || 0.85) * 88),
      note: "Simulates entry automation shift — rewards high-level architecture & domain mastery.",
    },
    macro_recession: {
      name: "Recession Contraction (-20% Hiring)",
      y1_salary: Math.round((topRec.predictedSalaryY1 || 1000000) * 0.82),
      y5_salary: Math.round((topRec.predictedSalaryY5 || 2200000) * 0.88),
      y10_salary: Math.round((topRec.predictedSalaryY5 || 2200000) * 1.6),
      placement_rate: Math.round((topRec.placementRate || 0.85) * 80),
      note: "Simulates hiring slowdown; tests alumni network and safety margin.",
    },
  };

  const currentScenarioData =
    activeScenario === "base"
      ? macroScenarios.base_case
      : activeScenario === "ai"
      ? macroScenarios.ai_acceleration
      : macroScenarios.macro_recession;

  return (
    <div className="space-y-8 my-8">
      {/* ── SECTION 1: 4 STRATEGIC PATHWAYS ───────────────────────────── */}
      <div className="glass-card p-6" style={{ borderRadius: 20 }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-blue flex items-center gap-1">
                <Layers size={12} /> Multi-Directional Lenses
              </span>
              <span style={{ fontSize: 12, color: "#8B8BA7" }}>4 Strategic Pathways</span>
            </div>
            <h2 className="font-display font-bold text-xl text-slate-100">
              Choose your career strategy pathway
            </h2>
          </div>

          {/* Pathway Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-white/[0.08]">
            <button
              onClick={() => setActivePathway("wealth")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activePathway === "wealth"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <TrendingUp size={13} /> Wealth & Growth
            </button>

            <button
              onClick={() => setActivePathway("stability")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activePathway === "stability"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ShieldCheck size={13} /> AI Stability Fortress
            </button>

            <button
              onClick={() => setActivePathway("value")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activePathway === "value"
                  ? "bg-amber-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap size={13} /> High IRR / Value
            </button>

            <button
              onClick={() => setActivePathway("balanced")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activePathway === "balanced"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Heart size={13} /> Balanced Career
            </button>
          </div>
        </div>

        {/* Pathway Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activePathway === "wealth" &&
            (safePathways.wealth_builder || []).map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-indigo-500/20 hover:border-indigo-500/40 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="badge badge-blue" style={{ fontSize: 10 }}>Rank #{i + 1} Growth</span>
                  <span className="font-mono font-bold text-xs text-indigo-400">{item.score}/100 Upside</span>
                </div>
                <h3 className="font-semibold text-sm text-slate-100 mb-1">{item.collegeName}</h3>
                <p className="text-xs text-slate-400 mb-3">{item.degreeName}</p>
                {item.y10_salary && (
                  <p className="text-xs text-emerald-400 font-mono font-semibold">
                    10-Yr Ceiling: {formatInr(item.y10_salary)}
                  </p>
                )}
              </div>
            ))}

          {activePathway === "stability" &&
            (safePathways.stability_fortress || []).map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="badge badge-green" style={{ fontSize: 10 }}>Rank #{i + 1} Resilience</span>
                  <span className="font-mono font-bold text-xs text-emerald-400">{item.score}/100 Stability</span>
                </div>
                <h3 className="font-semibold text-sm text-slate-100 mb-1">{item.collegeName}</h3>
                <p className="text-xs text-slate-400 mb-3">{item.degreeName}</p>
                {item.placement_rate && (
                  <p className="text-xs text-emerald-400 font-mono font-semibold">
                    Placement Consistency: {(item.placement_rate * (item.placement_rate <= 1 ? 100 : 1)).toFixed(0)}%
                  </p>
                )}
              </div>
            ))}

          {activePathway === "value" &&
            (safePathways.value_optimizer || []).map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-amber-500/20 hover:border-amber-500/40 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="badge badge-gold" style={{ fontSize: 10 }}>Rank #{i + 1} High IRR</span>
                  <span className="font-mono font-bold text-xs text-amber-400">{item.score}/100 Value</span>
                </div>
                <h3 className="font-semibold text-sm text-slate-100 mb-1">{item.collegeName}</h3>
                <p className="text-xs text-slate-400 mb-3">{item.degreeName}</p>
                {item.payback_years && (
                  <p className="text-xs text-amber-300 font-mono font-semibold">
                    Payback Horizon: ~{item.payback_years} years
                  </p>
                )}
              </div>
            ))}

          {activePathway === "balanced" &&
            (safePathways.balanced_lifestyle || []).map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-purple-500/20 hover:border-purple-500/40 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="badge badge-blue" style={{ fontSize: 10 }}>Rank #{i + 1} Autonomy</span>
                  <span className="font-mono font-bold text-xs text-purple-400">{item.score}/100 WLB</span>
                </div>
                <h3 className="font-semibold text-sm text-slate-100 mb-1">{item.collegeName}</h3>
                <p className="text-xs text-slate-400 mb-3">{item.degreeName}</p>
                <p className="text-xs text-purple-300 font-mono">
                  Low Burnout & High Geographical Flexibility
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* ── SECTION 2: MACROECONOMIC STRESS-TESTING ─────────────────── */}
      <div className="glass-card p-6" style={{ borderRadius: 20, border: "1px solid rgba(79, 110, 247, 0.25)" }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-gold flex items-center gap-1">
                <Activity size={12} /> Stress Test Simulation
              </span>
              <span style={{ fontSize: 12, color: "#8B8BA7" }}>Macro Scenario Analysis</span>
            </div>
            <h2 className="font-display font-bold text-xl text-slate-100">
              How your top match holds up under market shocks
            </h2>
          </div>

          {/* Scenario Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveScenario("base")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeScenario === "base"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              Base Case
            </button>
            <button
              onClick={() => setActiveScenario("ai")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeScenario === "ai"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              AI Automation Shock
            </button>
            <button
              onClick={() => setActiveScenario("recession")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeScenario === "recession"
                  ? "bg-rose-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              Recession Contraction
            </button>
          </div>
        </div>

        {/* Scenario Details */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="p-4 bg-slate-900/80 rounded-xl border border-white/[0.06]">
            <span className="text-xs text-slate-400 block mb-1">Starting Salary (Yr 1)</span>
            <span className="text-xl font-bold font-mono text-indigo-400">
              {formatInr(currentScenarioData.y1_salary)}
            </span>
          </div>

          <div className="p-4 bg-slate-900/80 rounded-xl border border-white/[0.06]">
            <span className="text-xs text-slate-400 block mb-1">Year 5 Midpoint</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              {formatInr(currentScenarioData.y5_salary)}
            </span>
          </div>

          <div className="p-4 bg-slate-900/80 rounded-xl border border-white/[0.06]">
            <span className="text-xs text-slate-400 block mb-1">10-Year Career Peak</span>
            <span className="text-xl font-bold font-mono text-purple-400">
              {formatInr(currentScenarioData.y10_salary)}
            </span>
          </div>

          <div className="p-4 bg-slate-900/80 rounded-xl border border-white/[0.06]">
            <span className="text-xs text-slate-400 block mb-1">Placement Rate</span>
            <span className="text-xl font-bold font-mono text-amber-400">
              {currentScenarioData.placement_rate}%
            </span>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-white/[0.04]">
          💡 <strong className="text-slate-200">Simulation Insight:</strong> {currentScenarioData.note}
        </p>
      </div>
    </div>
  );
}
