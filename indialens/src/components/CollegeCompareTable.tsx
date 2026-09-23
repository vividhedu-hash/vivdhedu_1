"use client";

import React, { useState } from "react";
import {
  Check, X, ArrowUpRight, ShieldAlert, Award, DollarSign,
  Briefcase, Activity, Scale, Sparkles, TrendingUp
} from "lucide-react";
import { formatInr } from "../lib/mock-data";

interface ProgramItem {
  id: string;
  name: string;
  college: string;
  tier: string;
  fee_lakhs: number;
  placement_rate_pct: number;
  median_salary_lpa: number;
  ai_risk_pct: number;
  payback_years: number;
  npv_20yr_lakhs: number;
}

interface CollegeCompareTableProps {
  programs: ProgramItem[];
}

export default function CollegeCompareTable({ programs }: CollegeCompareTableProps) {
  const [selectedPair, setSelectedPair] = useState<[number, number]>([0, 1]);
  const [counterfactual, setCounterfactual] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  if (!programs || programs.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400">
        No colleges selected for comparison. Add programs to compare ROI.
      </div>
    );
  }

  const pA = programs[selectedPair[0]] || programs[0];
  const pB = programs[selectedPair[1]] || programs[1] || programs[0];

  const handleRunCounterfactual = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "counterfactual",
          program_a: {
            college_name: `${pA.college} ${pA.name}`,
            total_cost_of_degree_inr: pA.fee_lakhs * 100000,
            y5_p50: pA.median_salary_lpa * 100000 * 1.8,
          },
          program_b: {
            college_name: `${pB.college} ${pB.name}`,
            total_cost_of_degree_inr: pB.fee_lakhs * 100000,
            y5_p50: pB.median_salary_lpa * 100000 * 1.8,
          },
        }),
      });

      if (!res.ok) throw new Error(`analytics ${res.status}`);
      const data = await res.json();
      setCounterfactual(data);
    } catch (e) {
      // Local fallback calculation
      const npvDeltaLakhs = Number((pA.npv_20yr_lakhs - pB.npv_20yr_lakhs).toFixed(1));
      setCounterfactual({
        strategic_winner: npvDeltaLakhs >= 0 ? `${pA.college} ${pA.name}` : `${pB.college} ${pB.name}`,
        counterfactual_verdict: `Choosing ${pA.college} ${pA.name} over ${pB.college} ${pB.name} yields ₹${Math.abs(npvDeltaLakhs)}L ${npvDeltaLakhs >= 0 ? "higher" : "lower"} 20-year career NPV with a ${(pB.payback_years - pA.payback_years).toFixed(1)} years payback delta.`,
        npv_delta_20yr_inr: npvDeltaLakhs * 100000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Side-by-Side Comparison Table ───────────────────────────────── */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md shadow-2xl">
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80">
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/4">
                Comparison Metric
              </th>
              {programs.map((p, idx) => (
                <th key={p.id} className="p-4 text-sm font-bold text-white border-l border-slate-800/80">
                  <div className="text-indigo-400 text-xs font-semibold">{p.college}</div>
                  <div className="text-base text-white font-extrabold">{p.name}</div>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    Tier {p.tier}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-sm">
            {/* Total Fee */}
            <tr>
              <td className="p-4 font-semibold text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-400" /> Total Degree Fee
              </td>
              {programs.map((p) => (
                <td key={p.id} className="p-4 border-l border-slate-800/80 text-white font-bold font-mono">
                  ₹{p.fee_lakhs} Lakhs
                </td>
              ))}
            </tr>

            {/* Placement Rate */}
            <tr>
              <td className="p-4 font-semibold text-slate-300 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-emerald-400" /> Placement Consistency
              </td>
              {programs.map((p) => (
                <td key={p.id} className="p-4 border-l border-slate-800/80 text-emerald-400 font-bold font-mono">
                  {p.placement_rate_pct}%
                </td>
              ))}
            </tr>

            {/* Starting Salary */}
            <tr>
              <td className="p-4 font-semibold text-slate-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-400" /> Median Year-1 Salary
              </td>
              {programs.map((p) => (
                <td key={p.id} className="p-4 border-l border-slate-800/80 text-indigo-300 font-bold font-mono">
                  ₹{p.median_salary_lpa} LPA
                </td>
              ))}
            </tr>

            {/* Payback Horizon */}
            <tr>
              <td className="p-4 font-semibold text-slate-300">Net Payback Horizon</td>
              {programs.map((p) => (
                <td key={p.id} className="p-4 border-l border-slate-800/80 text-slate-200 font-mono">
                  {p.payback_years} Years
                </td>
              ))}
            </tr>

            {/* 20-Year NPV */}
            <tr className="bg-emerald-500/5">
              <td className="p-4 font-bold text-emerald-400">20-Year Net Present Value (NPV)</td>
              {programs.map((p) => (
                <td key={p.id} className="p-4 border-l border-slate-800/80 text-emerald-400 font-extrabold text-base font-mono">
                  ₹{p.npv_20yr_lakhs} Lakhs
                </td>
              ))}
            </tr>

            {/* AI Risk */}
            <tr>
              <td className="p-4 font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-400" /> AI Automation Risk
              </td>
              {programs.map((p) => (
                <td key={p.id} className="p-4 border-l border-slate-800/80 font-mono">
                  <span className={`font-bold ${p.ai_risk_pct > 30 ? "text-amber-400" : "text-emerald-400"}`}>
                    {p.ai_risk_pct}%
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Synthetic Control Counterfactual Verdict Suite ──────────────── */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-indigo-500/30 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-semibold mb-1">
              <Scale className="w-3 h-3" /> Econometric Counterfactual Engine (Abadie Standard)
            </div>
            <h3 className="text-base font-bold text-white">Pairwise Counterfactual Delta Evaluation</h3>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedPair[0]}
              onChange={(e) => setSelectedPair([Number(e.target.value), selectedPair[1]])}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
            >
              {programs.map((p, idx) => (
                <option key={p.id} value={idx}>
                  {p.college} ({p.name})
                </option>
              ))}
            </select>

            <span className="text-xs text-slate-400 font-bold">VS</span>

            <select
              value={selectedPair[1]}
              onChange={(e) => setSelectedPair([selectedPair[0], Number(e.target.value)])}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
            >
              {programs.map((p, idx) => (
                <option key={p.id} value={idx}>
                  {p.college} ({p.name})
                </option>
              ))}
            </select>

            <button
              onClick={handleRunCounterfactual}
              disabled={loading}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5"
            >
              {loading ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
              Run Econometric Analysis
            </button>
          </div>
        </div>

        {counterfactual ? (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold">
              <span>🏆 Strategic Verdict Winner: {counterfactual.strategic_winner}</span>
              <span>20-Year NPV Delta</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {counterfactual.counterfactual_verdict}
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            Select two programs above and click &quot;Run Econometric Analysis&quot; to calculate the counterfactual career NPV delta.
          </p>
        )}
      </div>
    </div>
  );
}
