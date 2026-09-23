import React from 'react';
import { Sparkles, TrendingUp, Grid, Plus, CheckCircle2, Bookmark, MessageSquare, AlertCircle } from 'lucide-react';

export interface DeltaMetric {
  label: string;
  from: string;
  to: string;
  delta: string;
  positive: boolean;
}

export interface AIDecisionResult {
  simulationMs: number;
  confidence: number;
  recommendation: string;
  rationale: string;
  primaryAction: string;
  deltaMetrics: DeltaMetric[];
  loading: boolean;
  error?: string;
}

export interface AIDecisionCardProps {
  result: AIDecisionResult | null;
  onAddToRoadmap?: (action: string) => void;
  onExploreLabs?: () => void;
  onSaveAnalysis?: () => void;
}

export const AIDecisionCard: React.FC<AIDecisionCardProps> = ({
  result,
  onAddToRoadmap,
  onExploreLabs,
  onSaveAnalysis,
}) => {
  if (!result) {
    return (
      <div className="flex items-center justify-center p-12 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-slate-400 text-sm">
        Ask a question above to simulate strategic trajectory outcomes.
      </div>
    );
  }

  if (result.loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-pulse space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-purple-600 animate-spin" />
            <span className="text-xs font-bold text-slate-800">Operating Engine Synthesis</span>
            <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">Simulating...</span>
          </div>
          <span className="font-mono text-xs text-slate-400">Query Runtime: ~0.28s</span>
        </div>
        <div className="h-20 bg-slate-100 rounded-xl" />
        <div className="h-24 bg-slate-100 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-800 flex items-center gap-3">
        <AlertCircle size={20} className="text-rose-600 flex-shrink-0" />
        <div className="text-xs">
          <span className="font-bold block">Simulation Error</span>
          <span>{result.error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm transition-all">
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-600" />
          <h3 className="text-xs font-bold text-slate-900 tracking-tight">
            Operating Engine Synthesis
          </h3>
          <span className="text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
            Verified Simulation
          </span>
        </div>
        <span className="font-mono text-xs text-slate-400">
          Query Runtime: {(result.simulationMs / 1000).toFixed(2)}s
        </span>
      </div>

      {/* Recommendation Box */}
      <div className="mt-4 bg-slate-50 border border-slate-100 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E11D48] flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-xs font-bold text-slate-950">
              {result.recommendation.startsWith("Recommendation:")
                ? result.recommendation
                : `Recommendation: ${result.recommendation}`}
            </h4>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              {result.rationale || "With your first working paper already in review, your second paper faces diminishing marginal returns for UK/US Economics tier-1 programs compared to an unverified testing profile."}
            </p>
          </div>
        </div>
      </div>

      {/* Strategic Vector Comparative Matrix Table */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              <th className="pb-2 font-medium">Strategic Vector</th>
              <th className="pb-2 font-medium">Academic Signal</th>
              <th className="pb-2 font-medium">Admittance Threshold</th>
              <th className="pb-2 font-medium">Effort Intensity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            <tr>
              <td className="py-2.5 font-bold text-slate-900 pr-3">
                Path A: Standardized Testing (SAT/CUET)
              </td>
              <td className="py-2.5 text-slate-600 pr-3">
                Unlocks hard cutoff gating at top 5 targets
              </td>
              <td className="py-2.5 pr-3">
                <span className="font-bold text-rose-600">Critical</span>{" "}
                <span className="text-slate-500">(Required for LSE/Warwick)</span>
              </td>
              <td className="py-2.5 text-slate-600">
                Moderate (6-8 wks sprint)
              </td>
            </tr>
            <tr>
              <td className="py-2.5 font-bold text-slate-900 pr-3">
                Path B: 2nd SSRN Working Paper
              </td>
              <td className="py-2.5 text-slate-600 pr-3">
                Exceptional spike in research rigor
              </td>
              <td className="py-2.5 text-slate-600 pr-3">
                High, but secondary to basic score gates
              </td>
              <td className="py-2.5 text-slate-600">
                High (14+ wks continuous)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Two Forecast Delta Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              Profile Resilience Forecast
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold font-mono text-slate-950">
                78 → 84
              </span>
              <span className="text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                +6 pts
              </span>
            </div>
          </div>
          <TrendingUp size={18} className="text-slate-400" />
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              LSE Math Gating Probability
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold font-mono text-slate-950">
                54% → 89%
              </span>
              <span className="text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                +35%
              </span>
            </div>
          </div>
          <Grid size={18} className="text-slate-400" />
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onAddToRoadmap?.(result.primaryAction || "Complete SAT Math Module 3 (Khan Academy)")}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            <Plus size={14} />
            Add to Roadmap
          </button>
          <button
            onClick={() => onExploreLabs?.()}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
          >
            Explore Test Prep Labs
          </button>
          <button
            onClick={() => onSaveAnalysis?.()}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
          >
            Save Analysis
          </button>
        </div>

        <button
          onClick={() => alert("Ready for your follow-up query!")}
          className="text-xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1.5 transition-colors"
        >
          <MessageSquare size={13} />
          <span>Ask follow-up</span>
        </button>
      </div>
    </div>
  );
};
