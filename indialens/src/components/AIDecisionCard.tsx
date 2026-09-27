import React from 'react';
import { Sparkles, Plus, MessageSquare, AlertCircle, Compass } from 'lucide-react';
import { NO_DATA } from '../lib/mock-data';

export interface DeltaMetric {
  label: string;
  from: string;
  to: string;
  delta: string;
  positive: boolean;
}

export interface AIDecisionResult {
  /** Wall-clock duration of the call, measured by the caller. */
  simulationMs: number;
  confidence: number;
  recommendation: string;
  rationale: string;
  primaryAction: string;
  deltaMetrics: DeltaMetric[];
  loading: boolean;
  error?: string;
  /**
   * Whether `recommendation` came from the live advisor endpoint. A locally
   * composed response is shown without a "Verified Simulation" badge, because
   * "verified" has to mean something.
   */
  verified?: boolean;
}

export interface AIDecisionCardProps {
  result: AIDecisionResult | null;
  onAddToRoadmap?: (action: string) => void;
  onExploreLabs?: () => void;
  onSaveAnalysis?: () => void;
  /** Focuses the query input for a follow-up question. */
  onAskFollowUp?: () => void;
}

export const AIDecisionCard: React.FC<AIDecisionCardProps> = ({
  result,
  onAddToRoadmap,
  onExploreLabs,
  onSaveAnalysis,
  onAskFollowUp,
}) => {
  if (!result) {
    return (
      <div className="flex items-center justify-center p-12 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-slate-400 text-sm text-center leading-relaxed">
        Ask a question to run a grounded decision analysis.
        <br />
        <span className="text-xs text-slate-400">
          Answers come from the advisor engine with sources attached.
        </span>
      </div>
    );
  }

  if (result.loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-pulse space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-purple-600 animate-spin" />
            <span className="text-xs font-bold text-slate-800">Decision Engine</span>
          </div>
        </div>
        <div className="h-20 bg-slate-100 rounded-xl" />
        <div className="h-24 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-800 flex items-start gap-3">
        <AlertCircle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold block">The advisor did not answer</span>
          <span className="leading-relaxed">{result.error}</span>
        </div>
      </div>
    );
  }

  // The two forecast boxes below used to be hardcoded to "78 → 84" and
  // "54% → 89%" regardless of what the engine returned, and the strategic
  // table compared a fixed "Path A: Standardized Testing" against a fixed
  // "Path B: 2nd SSRN Working Paper" — including a claim that co-authorship
  // moves Tier-1 Economics odds by ~2.4x, and a reference to LSE and Warwick
  // gating in a product for choosing Indian colleges. The engine's own
  // `deltaMetrics` is the only quantified output we actually have, so that
  // is what renders. Nothing is filled in when it is missing.
  const hasDeltas = result.deltaMetrics.length > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm transition-all">
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-600" />
          <h3 className="text-xs font-bold text-slate-900 tracking-tight">
            Decision Engine
          </h3>
          {result.verified ? (
            <span className="text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
              Grounded
            </span>
          ) : (
            <span className="text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
              Unverified source
            </span>
          )}
        </div>
        <span className="font-mono text-xs text-slate-400">
          {result.simulationMs > 0 ? `Query runtime: ${(result.simulationMs / 1000).toFixed(2)}s` : "—"}
        </span>
      </div>

      {/* Recommendation */}
      <div className="mt-4 bg-slate-50 border border-slate-100 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E11D48] flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-xs font-bold text-slate-950">
              {result.recommendation
                ? result.recommendation.startsWith("Recommendation:")
                  ? result.recommendation
                  : `Recommendation: ${result.recommendation}`
                : "No recommendation returned"}
            </h4>
            {result.rationale ? (
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{result.rationale}</p>
            ) : (
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                The engine returned no rationale for this answer.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Confidence — reported only when the engine supplied one */}
      <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-slate-500">
        <span>Engine confidence</span>
        <span className="font-bold text-slate-900">
          {typeof result.confidence === "number" && result.confidence > 0
            ? `${result.confidence}/100`
            : NO_DATA}
        </span>
      </div>

      {/* Delta metrics — straight from the engine, never a placeholder pair */}
      {hasDeltas && (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {result.deltaMetrics.map((m) => (
            <div
              key={m.label}
              className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                  {m.label}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold font-mono text-slate-950 truncate">
                    {m.from} → {m.to}
                  </span>
                  <span
                    className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      m.positive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {m.delta}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => result.primaryAction && onAddToRoadmap?.(result.primaryAction)}
            disabled={!result.primaryAction}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            <Plus size={14} />
            Add to Roadmap
          </button>
          <button
            onClick={() => onExploreLabs?.()}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors inline-flex items-center gap-1.5"
          >
            <Compass size={13} />
            Explore programs
          </button>
          <button
            onClick={() => onSaveAnalysis?.()}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
          >
            Save Analysis
          </button>
        </div>

        <button
          onClick={() => onAskFollowUp?.()}
          disabled={!onAskFollowUp}
          className="text-xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <MessageSquare size={13} />
          <span>Ask follow-up</span>
        </button>
      </div>
    </div>
  );
};
