import React from 'react';
import { Zap, ArrowRight, PlusCircle, ShoppingBag, AlertCircle } from 'lucide-react';

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
  onExploreMarketplace?: () => void;
}

export const AIDecisionCard: React.FC<AIDecisionCardProps> = ({
  result,
  onAddToRoadmap,
  onExploreMarketplace
}) => {
  if (!result) {
    return (
      <div className="flex items-center justify-center p-8 rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/20 text-slate-500 text-sm">
        Ask a question above to run a simulation
      </div>
    );
  }

  if (result.loading) {
    return (
      <div className="flex flex-col gap-4 p-6 rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-blue-500 animate-pulse" />
          <span className="text-sm font-mono text-blue-400">Running simulation...</span>
        </div>
        <div className="w-3/4 h-6 bg-slate-800/80 rounded animate-pulse" />
        <div className="w-full h-4 bg-slate-800/80 rounded animate-pulse mt-2" />
        <div className="w-5/6 h-4 bg-slate-800/80 rounded animate-pulse" />
        <div className="flex gap-3 mt-4">
          <div className="w-24 h-16 bg-slate-800/80 rounded animate-pulse" />
          <div className="w-24 h-16 bg-slate-800/80 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-red-900/50 bg-red-950/20 gap-3">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <div className="text-sm text-red-200 font-medium text-center">{result.error}</div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col p-6 rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-2xl">
      {/* Left blue accent border */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-mono font-semibold text-blue-400 tracking-wider">DECISION ENGINE</span>
        </div>
        <div className="text-xs font-mono text-slate-500">
          Simulated in {result.simulationMs}ms · {result.confidence}% confidence
        </div>
      </div>

      {/* Recommendation */}
      <h2 className="text-2xl font-serif text-slate-100 mb-6 leading-tight">
        {result.recommendation}
      </h2>

      {/* Delta Metrics */}
      <div className="flex flex-wrap gap-3 mb-6">
        {result.deltaMetrics.map((metric, idx) => (
          <div key={idx} className="flex flex-col p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 min-w-[140px]">
            <span className="text-xs text-slate-400 mb-2">{metric.label}</span>
            <div className="flex items-end gap-2">
              <span className="text-lg font-mono text-slate-200 line-through opacity-50">{metric.from}</span>
              <ArrowRight className="w-4 h-4 text-slate-500 mb-1" />
              <span className="text-xl font-mono font-semibold text-slate-100">{metric.to}</span>
            </div>
            <div className={`mt-2 text-xs font-mono font-medium px-1.5 py-0.5 rounded inline-flex w-fit ${metric.positive ? 'text-emerald-400 bg-emerald-950/50' : 'text-red-400 bg-red-950/50'}`}>
              {metric.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Rationale */}
      <p className="text-sm text-slate-300 mb-6 leading-relaxed">
        {result.rationale}
      </p>

      {/* Primary Action Box */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-blue-950/30 border border-blue-900/50 mb-6">
        <div className="flex flex-col">
          <span className="text-xs text-blue-400 uppercase tracking-wider font-semibold mb-1">Recommended Action</span>
          <span className="text-base text-blue-100 font-medium">{result.primaryAction}</span>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center gap-4 mt-auto border-t border-slate-800 pt-5">
        <button 
          onClick={() => onAddToRoadmap && onAddToRoadmap(result.primaryAction)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Add to Roadmap
        </button>
        <button 
          onClick={onExploreMarketplace}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-transparent hover:bg-slate-800 text-slate-300 text-sm font-medium transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          Explore Marketplace <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};
