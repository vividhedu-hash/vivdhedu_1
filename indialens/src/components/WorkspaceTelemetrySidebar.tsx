import React from 'react';
import { TrendingUp, Target, Zap, AlertCircle } from 'lucide-react';

export interface TelemetryProps {
  aiResilienceScore: number;
  resilience_percentile: string;
  profileStrength: {
    academic: number;
    initiative: number;
    consistency: number;
  };
  primaryGap: string;
  primaryGapOddsMultiplier: string;
  sprintDaysRemaining: number;
  sprintLabel: string;
  milestoneVelocity: string;
  milestonesComplete: number;
  milestonesTotal: number;
}

const DEFAULT_TELEMETRY: TelemetryProps = {
  aiResilienceScore: 78,
  resilience_percentile: 'top 8% Quant',
  profileStrength: { academic: 82, initiative: 71, consistency: 69 },
  primaryGap: 'Faculty co-authorship',
  primaryGapOddsMultiplier: '2.4x',
  sprintDaysRemaining: 12,
  sprintLabel: 'SSRN Draft Submission',
  milestoneVelocity: '1.4x pace',
  milestonesComplete: 6,
  milestonesTotal: 10,
};

export const WorkspaceTelemetrySidebar: React.FC<Partial<TelemetryProps>> = (props) => {
  const data = { ...DEFAULT_TELEMETRY, ...props };
  const score = data.aiResilienceScore;
  const dasharray = `${(score / 100) * 201.06} 201.06`;

  return (
    <div className="flex flex-col gap-6 p-4 rounded-xl bg-slate-900/50 backdrop-blur-md border border-slate-800 text-white w-full max-w-sm">
      {/* AI Resilience Score */}
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg width="80" height="80" viewBox="0 0 80 80" className="rotate-[-90deg]">
            <circle cx="40" cy="40" r="32" stroke="#1E1E2E" strokeWidth="5" fill="none" />
            <circle 
              cx="40" 
              cy="40" 
              r="32" 
              stroke="#1A6CF6" 
              strokeWidth="5" 
              fill="none" 
              strokeLinecap="round" 
              strokeDasharray={dasharray} 
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold font-mono">{score}</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-slate-400 font-medium">AI Resilience Score</span>
          <span className="text-sm text-emerald-400 font-mono mt-1">{data.resilience_percentile}</span>
        </div>
      </div>

      {/* Profile Strength */}
      <div className="flex flex-col gap-3">
        <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Profile Strength</div>
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">Academic</span>
            <span className="font-mono text-slate-300">{data.profileStrength.academic}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-[#1A6CF6] rounded-full telemetry-bar-fill" style={{ width: `${data.profileStrength.academic}%` }} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">Initiative</span>
            <span className="font-mono text-slate-300">{data.profileStrength.initiative}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-[#0D9488] rounded-full telemetry-bar-fill" style={{ width: `${data.profileStrength.initiative}%` }} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">Consistency</span>
            <span className="font-mono text-slate-300">{data.profileStrength.consistency}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-[#7C3AED] rounded-full telemetry-bar-fill" style={{ width: `${data.profileStrength.consistency}%` }} />
          </div>
        </div>
      </div>

      {/* Primary Gap */}
      <div className="flex flex-col p-3 rounded-lg bg-red-950/30 border border-red-900/50 relative overflow-hidden">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs text-red-300 font-semibold uppercase tracking-wider mb-1">Primary Gap</span>
            <span className="text-sm text-red-100">{data.primaryGap}</span>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs bg-red-900/60 text-red-200 px-1.5 py-0.5 rounded font-mono">+{data.primaryGapOddsMultiplier} odds</span>
              <span className="text-xs text-red-400">if resolved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sprint Countdown */}
      <div className="flex flex-col p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Current Sprint</span>
            </div>
            <span className="text-sm text-emerald-100">{data.sprintLabel}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xl font-bold font-mono text-emerald-400">{data.sprintDaysRemaining}</span>
            <span className="text-xs text-emerald-500/70">days left</span>
          </div>
        </div>
      </div>

      {/* Milestone Velocity */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-slate-300">Velocity</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded">{data.milestoneVelocity}</span>
          <span className="text-sm font-mono text-slate-400">{data.milestonesComplete}/{data.milestonesTotal}</span>
        </div>
      </div>
    </div>
  );
};
