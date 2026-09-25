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
  /** null = not measured. Rendered as "—" rather than a fabricated 0/100. */
  placement_rate_pct: number | null;
  median_salary_lpa: number | null;
  ai_risk_pct: number | null;
  payback_years: number | null;
  npv_20yr_lakhs: number | null;
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
      <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 shadow-sm">
        No colleges selected for comparison. Add programs to compare ROI.
      </div>
    );
  }

  const pA = programs[selectedPair[0]] || programs[0];
  const pB = programs[selectedPair[1]] || programs[1] || programs[0];

  const handleRunCounterfactual = async () => {
    // A counterfactual needs a measured salary for both programs. Without one
    // the arithmetic would be built on a null, so refuse rather than invent.
    if (pA.median_salary_lpa == null || pB.median_salary_lpa == null) {
      setCounterfactual({
        strategic_winner: null,
        counterfactual_verdict:
          "Not enough measured salary data to compare these two programs. We do not model figures we have not measured.",
        npv_delta_20yr_inr: null,
      });
      setLoading(false);
      return;
    }
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
      const npvDeltaLakhs =
        pA.npv_20yr_lakhs == null || pB.npv_20yr_lakhs == null
          ? null
          : Number((pA.npv_20yr_lakhs - pB.npv_20yr_lakhs).toFixed(1));
      const paybackDelta =
        pA.payback_years == null || pB.payback_years == null
          ? null
          : Math.abs(pB.payback_years - pA.payback_years).toFixed(1);
      setCounterfactual({
        strategic_winner:
          npvDeltaLakhs == null
            ? null
            : npvDeltaLakhs >= 0
              ? `${pA.college} ${pA.name}`
              : `${pB.college} ${pB.name}`,
        counterfactual_verdict:
          npvDeltaLakhs == null
            ? "Not enough measured data to compare these two programs."
            : `Choosing ${pA.college} ${pA.name} over ${pB.college} ${pB.name} yields ₹${Math.abs(npvDeltaLakhs)}L ${npvDeltaLakhs >= 0 ? "higher" : "lower"} 20-year career NPV${paybackDelta ? ` with a ${paybackDelta} years payback delta` : ""}.`,
        npv_delta_20yr_inr: npvDeltaLakhs == null ? null : npvDeltaLakhs * 100000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Side-by-Side Comparison Table ───────────────────────────────── */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">
                Comparison Metric
              </th>
              {programs.map((p, idx) => (
                <th key={p.id} className="p-4 text-sm font-bold text-slate-900 border-l border-slate-200">
                  <div className="text-slate-500 text-xs font-semibold">{p.college}</div>
                  <div className="text-base text-slate-950 font-extrabold">{p.name}</div>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                    Tier {p.tier}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {/* Total Fee */}
            <tr>
              <td className="p-4 font-semibold text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-500" /> Total Degree Fee
              </td>
              {programs.map((p) => (
                <td key={p.id} className="p-4 border-l border-slate-200 text-slate-900 font-bold font-mono">
                  ₹{p.fee_lakhs} Lakhs
                </td>
              ))}
            </tr>

            {/* Placement Rate */}
            <tr>
              <td className="p-4 font-semibold text-slate-700 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-emerald-600" /> Placement Consistency
              </td>
              {programs.map((p) => (
                <td key={p.id} className="p-4 border-l border-slate-200 text-emerald-700 font-bold font-mono">
                  {p.placement_rate_pct}%
                </td>
              ))}
            </tr>

            {/* Starting Salary */}
            <tr>
              <td className="p-4 font-semibold text-slate-700 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-600" /> Median Year-1 Salary
              </td>
              {programs.map((p) => (
                <td key={p.id} className="p-4 border-l border-slate-200 text-slate-900 font-bold font-mono">
                  ₹{p.median_salary_lpa} LPA
                </td>
              ))}
            </tr>

            {/* Payback Horizon */}
            <tr>
              <td className="p-4 font-semibold text-slate-700">Net Payback Horizon</td>
              {programs.map((p) => (
                <td key={p.id} className="p-4 border-l border-slate-200 text-slate-700 font-mono">
                  {p.payback_years == null ? "—" : `${p.payback_years} Years`}
                </td>
              ))}
            </tr>

            {/* 20-Year NPV */}
            <tr className="bg-emerald-50/50">
              <td className="p-4 font-bold text-emerald-800">20-Year Net Present Value (NPV)</td>
              {programs.map((p) => (
                <td key={p.id} className="p-4 border-l border-slate-200 text-emerald-700 font-extrabold text-base font-mono">
                  {p.npv_20yr_lakhs == null ? "—" : `₹${p.npv_20yr_lakhs} Lakhs`}
                </td>
              ))}
            </tr>

            {/* AI Risk */}
            <tr>
              <td className="p-4 font-semibold text-slate-700 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-500" /> AI Automation Risk
              </td>
              {programs.map((p) => (
                <td key={p.id} className="p-4 border-l border-slate-200 font-mono">
                  {p.ai_risk_pct == null ? (
                    <span className="text-slate-400">—</span>
                  ) : (
                    <span className={`font-bold ${p.ai_risk_pct > 30 ? "text-amber-600" : "text-emerald-600"}`}>
                      {p.ai_risk_pct}%
                    </span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Synthetic Control Counterfactual Verdict Suite ──────────────── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold mb-1">
              <Scale className="w-3 h-3 text-slate-500" /> Econometric Counterfactual Engine (Abadie Standard)
            </div>
            <h3 className="text-base font-bold text-slate-950">Pairwise Counterfactual Delta Evaluation</h3>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedPair[0]}
              onChange={(e) => setSelectedPair([Number(e.target.value), selectedPair[1]])}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
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
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
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
              className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {loading ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
              Run Econometric Analysis
            </button>
          </div>
        </div>

        {counterfactual ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
              <span className="text-slate-900 font-bold">🏆 Strategic Verdict Winner: {counterfactual.strategic_winner}</span>
              <span className="font-mono text-emerald-700 font-bold">20-Year NPV Delta</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              {counterfactual.counterfactual_verdict}
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">
            Select two programs above and click &quot;Run Econometric Analysis&quot; to calculate the counterfactual career NPV delta.
          </p>
        )}
      </div>
    </div>
  );
}
