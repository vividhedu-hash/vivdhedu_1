import React from 'react';
import { Calendar, Radio, Building2, CircleAlert, Compass } from 'lucide-react';
import Link from 'next/link';
import { NO_DATA } from '../lib/mock-data';

/**
 * Every field here is `number | null` / `string | null` and null means
 * **not measured**.
 *
 * This panel used to merge a `DEFAULT_TELEMETRY` constant into whatever the
 * page passed, so a signed-out student — or any student whose report token
 * had not loaded — saw a fully populated dashboard belonging to a fictional
 * "Alex M., Class 11-12, Quantitative": resilience 78, "Top 8% in Quantitative
 * Track", profile strength 82/71/69, primary gap "Demonstrated research
 * co-authorship" with a "~2.4x" admittance multiplier, a 12-day sprint
 * labelled "SSRN Working Paper Draft Submission", and a "1.4x pace" velocity.
 *
 * None of those came from any engine. They were a persona, and the merge
 * made them the default rather than a demo — the exact failure the /report
 * honesty work was written to fix. So the defaults are gone: the panel now
 * renders "—" and says what is missing, and only shows a number that arrived
 * from somewhere real.
 */
export interface TelemetryProps {
  /** null until a real AI-resilience / adaptation score is measured. */
  aiResilienceScore: number | null;
  /** null when we cannot place this student in a percentile. */
  resilience_percentile: string | null;
  profileStrength: {
    academic: number | null;
    initiative: number | null;
    consistency: number | null;
  } | null;
  primaryGap: string | null;
  primaryGapOddsMultiplier: string | null;
  sprintDaysRemaining: number | null;
  sprintLabel: string | null;
  /** null — there is no milestone ledger to compute a velocity from. */
  milestoneVelocity: string | null;
  milestonesComplete: number;
  milestonesTotal: number;
}

const Pct = ({ value }: { value: number | null }) =>
  value == null ? (
    <span className="font-mono text-slate-400">{NO_DATA}</span>
  ) : (
    <span className="font-mono text-slate-900 font-medium">{Math.round(value)}%</span>
  );

/** Zero-length track + a muted "no bar" label, rather than a 0%-looking bar. */
const Meter = ({ value, tone = "dark" }: { value: number | null; tone?: "dark" | "coral" }) => (
  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
    {value == null ? (
      <div className="h-full w-full bg-slate-100" />
    ) : (
      <div
        className={`h-full rounded-full ${tone === "coral" ? "bg-[#E11D48]" : "bg-slate-900"}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    )}
  </div>
);

export const WorkspaceTelemetrySidebar: React.FC<TelemetryProps> = (props) => {
  const { aiResilienceScore, profileStrength, milestonesComplete, milestonesTotal } = props;

  // The gauge arc is derived from the score, so it is only drawn when a
  // score exists — otherwise the ring reads as a real 0/100.
  const hasScore = aiResilienceScore != null;
  const strokeDash = hasScore
    ? `${(Math.max(0, Math.min(100, aiResilienceScore)) / 100) * 150.8} 150.8`
    : "0 150.8";

  const progress = milestonesTotal > 0 ? (milestonesComplete / milestonesTotal) * 100 : null;

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-slate-700" />
          <span className="text-sm font-bold text-slate-900">Your Signal</span>
        </div>
      </div>

      {/* 1. AI Resilience Score */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
              AI Resilience
            </span>
            <div className="flex items-baseline gap-1">
              {hasScore ? (
                <>
                  <span className="text-3xl font-bold font-mono text-slate-950">
                    {Math.round(aiResilienceScore)}
                  </span>
                  <span className="text-xs font-mono text-slate-400">/ 100</span>
                </>
              ) : (
                <span className="text-3xl font-bold font-mono text-slate-300">{NO_DATA}</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              {props.resilience_percentile ?? "Not yet measured"}
            </p>
          </div>

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
              {hasScore ? `${Math.round(aiResilienceScore)}%` : NO_DATA}
            </span>
          </div>
        </div>
        {!hasScore && (
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500 border-t border-slate-100 pt-2.5">
            This is the AI-adaptation trait from the psychometric assessment. It is a
            measurement of you, not a default — take the assessment and it appears here.
          </p>
        )}
      </div>

      {/* 2. Target Vector — was hardcoded to "Economics → Research & Quant" */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
          Target Vector
        </span>
        <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
          <Building2 size={14} className="text-slate-500 flex-shrink-0" />
          <span className="truncate text-slate-500">Not set</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
          A target field has not been chosen yet, so nothing is ranked against it.
        </p>
      </div>

      {/* 3. Profile Strength — the "74%" header was hardcoded regardless of input */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Profile Strength
          </span>
          <span className="text-xs font-mono font-bold text-slate-900">
            {profileStrength ? (
              pctMean([profileStrength.academic, profileStrength.initiative, profileStrength.consistency])
            ) : (
              <span className="text-slate-400">{NO_DATA}</span>
            )}
          </span>
        </div>

        <div className="space-y-3">
          {([
            ['academic', 'Academic Rigor'],
            ['initiative', 'Initiative & Research'],
            ['consistency', 'Execution Consistency'],
          ] as const).map(([key, label]) => (
            <div key={key}>
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <span>{label}</span>
                <Pct value={profileStrength?.[key] ?? null} />
              </div>
              <Meter value={profileStrength?.[key] ?? null} />
            </div>
          ))}
        </div>

        {!profileStrength && (
          <p className="text-[11px] text-slate-500 mt-3 leading-relaxed border-t border-slate-100 pt-2.5">
            These three map to diligence, autonomy and security traits from the
            assessment. They stay empty until it is run.
          </p>
        )}
      </div>

      {/* 4. Primary Gap — the copy asserted a ~2.4x odds uplift from a preprint */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Primary Gap
          </span>
        </div>
        {props.primaryGap ? (
          <>
            <h4 className="text-xs font-bold text-slate-900 leading-snug">{props.primaryGap}</h4>
            {props.primaryGapOddsMultiplier && (
              <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                Closing this is associated with a reported{" "}
                {props.primaryGapOddsMultiplier} change in admittance odds.
              </p>
            )}
          </>
        ) : (
          <>
            <h4 className="text-xs font-bold text-slate-400 leading-snug">Not identified</h4>
            <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
              A primary gap is only named once an admissions engine has compared your
              profile against a real target program. We do not guess one.
            </p>
          </>
        )}
      </div>

      {/* 5. Roadmap Status — derived entirely from the user's own list */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Roadmap Status
          </span>
          <span className="text-xs font-mono font-bold text-slate-900">
            {milestonesComplete} / {milestonesTotal} Milestones
          </span>
        </div>

        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
          {progress == null ? (
            <div className="h-full w-full bg-slate-100" />
          ) : (
            <div
              className="h-full bg-[#E11D48] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          )}
        </div>

        {props.sprintLabel ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
                Active Target
              </span>
              {props.sprintDaysRemaining != null && <span>{props.sprintDaysRemaining} days left</span>}
            </div>
            <p className="text-xs font-semibold text-slate-900">{props.sprintLabel}</p>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              No active sprint. Deadlines come from the exam calendar and program
              intakes, neither of which is loaded on this page yet.
            </p>
          </div>
        )}
      </div>

      {/* 6. Next step — replaced a button that fired alert("Connecting with…") */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-start gap-2">
          <CircleAlert size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            This panel has no AI-resilience figure, no target field and no sprint
            because none have been measured for this account.{" "}
            <Link href="/onboard" className="text-rose-600 font-semibold hover:underline">
              Start calibration
            </Link>{" "}
            to populate them.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Mean of the measured sub-scores, or null when none were measured. Averaging
 * three values one of which is unknown would silently reweight the other two,
 * so a partial set reports nothing rather than a flattering number.
 */
function pctMean(values: Array<number | null>): string {
  const measured = values.filter((v): v is number => v != null);
  if (measured.length !== values.length || measured.length === 0) return NO_DATA;
  return `${Math.round(measured.reduce((a, b) => a + b, 0) / measured.length)}%`;
}
