import React from 'react';
import { Calendar, Radio, Sparkles, Building2, BookOpen, Clock } from 'lucide-react';

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
  resilience_percentile: 'Top 8% in Quantitative Track',
  profileStrength: { academic: 82, initiative: 71, consistency: 69 },
  primaryGap: 'Demonstrated research co-authorship',
  primaryGapOddsMultiplier: '~2.4x',
  sprintDaysRemaining: 12,
  sprintLabel: 'SSRN Working Paper Draft Submission',
  milestoneVelocity: '1.4x pace',
  milestonesComplete: 6,
  milestonesTotal: 10,
};

export const WorkspaceTelemetrySidebar: React.FC<Partial<TelemetryProps>> = (props) => {
  const data = { ...DEFAULT_TELEMETRY, ...props };
  const score = data.aiResilienceScore;
  const strokeDash = `${(score / 100) * 150.8} 150.8`;

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-slate-700" />
          <span className="text-sm font-bold text-slate-900">Your Signal</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Telemetry</span>
        </div>
      </div>

      {/* 1. AI Resilience Score Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
              AI Resilience
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono text-slate-950">{score}</span>
              <span className="text-xs font-mono text-slate-400">/ 100</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              {data.resilience_percentile}
            </p>
          </div>

          {/* Circular SVG Gauge with Red Arc */}
          <div className="relative w-14 h-14 flex-shrink-0 flex items-center justify-center">
            <svg width="56" height="56" viewBox="0 0 56 56" className="rotate-[-90deg]">
              <circle cx="28" cy="28" r="24" stroke="#F1F5F9" strokeWidth="4" fill="none" />
              <circle
                cx="28"
                cy="28"
                r="24"
                stroke="#E11D48"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={strokeDash}
              />
            </svg>
            <span className="absolute font-mono font-bold text-xs text-slate-900">
              {score}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Target Vector */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
          Target Vector
        </span>
        <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
          <Building2 size={14} className="text-slate-500 flex-shrink-0" />
          <span className="truncate">Economics → Research &amp; Quant...</span>
        </div>
      </div>

      {/* 3. Profile Strength */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Profile Strength
          </span>
          <span className="text-xs font-mono font-bold text-slate-900">74%</span>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span>Academic Rigor</span>
              <span className="font-mono text-slate-900 font-medium">{data.profileStrength.academic}%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-slate-900 rounded-full" style={{ width: `${data.profileStrength.academic}%` }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span>Initiative &amp; Research</span>
              <span className="font-mono text-slate-900 font-medium">{data.profileStrength.initiative}%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-slate-900 rounded-full" style={{ width: `${data.profileStrength.initiative}%` }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span>Execution Consistency</span>
              <span className="font-mono text-slate-900 font-medium">{data.profileStrength.consistency}%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-slate-900 rounded-full" style={{ width: `${data.profileStrength.consistency}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Primary Gap */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Primary Gap
          </span>
          <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
            Priority: High
          </span>
        </div>
        <h4 className="text-xs font-bold text-slate-900 leading-snug">
          {data.primaryGap}
        </h4>
        <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
          Solo preprint verified; adding an institutional co-author elevates Tier-1 Economics odds by {data.primaryGapOddsMultiplier}.
        </p>
      </div>

      {/* 5. Roadmap Status */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Roadmap Status
          </span>
          <span className="text-xs font-mono font-bold text-slate-900">
            {data.milestonesComplete} / {data.milestonesTotal} Milestones
          </span>
        </div>

        {/* Coral red progress bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-[#E11D48] rounded-full transition-all"
            style={{ width: `${(data.milestonesComplete / data.milestonesTotal) * 100}%` }}
          />
        </div>

        {/* Active Target Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Target
            </span>
            <span>{data.sprintDaysRemaining} days left</span>
          </div>
          <p className="text-xs font-semibold text-slate-900">
            {data.sprintLabel}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Reviewing empirical regression tables with mentor.
          </p>
        </div>
      </div>

      {/* 6. Book 1-on-1 Advisory CTA */}
      <button
        onClick={() => alert("Connecting with Senior Education Advisory Fiduciary...")}
        className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-center gap-2 transition-colors shadow-sm"
      >
        <Calendar size={14} className="text-slate-600" />
        <span>Book 1-on-1 Advisory Session (Free)</span>
      </button>
    </div>
  );
};
