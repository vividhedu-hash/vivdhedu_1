"use client";

import { useState } from "react";
import { AlertTriangle, Sparkles } from "lucide-react";
import { GroundedAnswer } from "./GroundedAnswer";
import { aiErrorMessage, postAi, type GroundedPayload } from "../lib/grounded";

interface AIAdvisorWidgetProps {
  initialBudget?: number;
  initialField?: string;
  className?: string;
}

export default function AIAdvisorWidget({
  initialBudget = 10,
  initialField = "engineering-cs",
  className = "",
}: AIAdvisorWidgetProps) {
  const [budget, setBudget] = useState(initialBudget);
  const [field, setField] = useState(initialField);
  const [risk, setRisk] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<GroundedPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function consult() {
    setLoading(true);
    setError(null);
    const { ok, status, data } = await postAi<GroundedPayload | { detail?: { reason?: string } }>(
      "/api/v1/ai/advisor",
      {
        total_budget: budget,
        target_field: field,
        risk_tolerance: risk,
        preferred_cities: ["Bengaluru", "NCR", "Hyderabad"],
        top_programs: [],
      },
    );
    setLoading(false);
    if (!ok) {
      setPayload(null);
      setError(aiErrorMessage(data, `Advisor unavailable (${status})`));
      return;
    }
    setPayload(data as GroundedPayload);
  }

  return (
    <div className={`bg-slate-900/90 border border-slate-800 rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Grounded advisor</h3>
          <p className="text-xs text-slate-400">Gemini 3.7 Flash · Google Search citations required</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <input
          type="number"
          min={1}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
        />
        <select
          value={field}
          onChange={(e) => setField(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
        >
          <option value="engineering-cs">Engineering (CS / AI)</option>
          <option value="management">Management</option>
          <option value="medicine">Medicine</option>
          <option value="law">Law</option>
        </select>
        <select
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
        >
          <option value="low">Low risk</option>
          <option value="medium">Medium risk</option>
          <option value="high">High risk</option>
        </select>
      </div>
      <button
        onClick={() => void consult()}
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        {loading ? "Grounding…" : "Advise with sources"}
      </button>
      {error && (
        <p className="mt-4 text-sm text-amber-300 flex gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </p>
      )}
      {payload && (
        <div className="mt-5">
          <GroundedAnswer payload={payload} />
        </div>
      )}
    </div>
  );
}
