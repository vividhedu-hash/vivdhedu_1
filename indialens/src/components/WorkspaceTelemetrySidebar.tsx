import React from 'react';
import { Radio, Building2, CircleAlert, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { NO_DATA } from '../lib/mock-data';

/**
 * Every field here is `number | null` / `string | null` and null means
 * **not measured**.
 *
* This panel used to merge a `DEFAULT_TELEMETRY` constant into whatever the
 * page passed, so a signed-out student — or any student whose report token
 * had not loaded — saw a fully populated dashboard belonging to a fictional
 * Class 11-12 student: resilience 78, "Top 8% in Quantitative Track", profile
 * strength 82/71/69, primary gap "Demonstrated research co-authorship" with a
 * "~2.4x" admittance multiplier, a 12-day sprint labelled "SSRN Working Paper
 * Draft Submission", and a "1.4x pace" velocity.
 *
 * The invented student's name is deliberately not repeated here. Leaving it in
 * the source is how it came back: the onboarding wizard was seeded with the
 * same persona, and a comment quoting it is an easy thing to copy from.
 *
* None of those numbers came from any engine. They were a persona, and the
 * merge made them the default rather than a demo — the exact failure the
 * /report honesty work was written to fix. So the defaults are gone: the panel
 * now renders "—" and says what is missing, and only shows a number that
 * arrived from somewhere real.
 *
 * ## What the restyle did and did not do
 *
 * The six blocks were six white bordered boxes. They are now six `.panel`
 * blocks with a `.panel-head` carrying the label, because none of them is
 * interactive and none of them may lift on hover.
 *
 * The figures all went through `.num` / `.metric*`, and — the part that matters
 * here — every unmeasured one renders in `.num-na`. The previous `Pct` helper
 * used a muted grey for a dash, which is the right *colour* but was applied to
 * a mono span with no letter-spacing, so the dash did not read as a deliberate
 * gap; `num-na` gives it the muted, letter-spaced treatment that distinguishes
 * "absent" from every real value in the panel.
 *
 * The meters use `.ci-track` / `.ci-fill`. The unfilled portion of that track
 * *is* the epistemics, which is the whole point of the class: a sub-score with
 * no value draws an empty track rather than a zero-width fill, because a 0%-wide
 * bar reads as a score of zero.
 *
 * The three hardcoded surface colours are gone: the gauge track is now
 * `--bg-chip` (the one value that reads as a track on both themes), the gauge
 * and roadmap fills are `--accent`, and the meter fill is `--text-primary`.
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

/** A percentage figure, or the muted unmeasured marker. */
const Pct = ({ value }: { value: number | null }) =>
  value == null ? (
    <span className="num text-[12px] num-na">{NO_DATA}</span>
  ) : (
    <span className="num text-[12px] font-semibold t-text">{Math.round(value)}%</span>
  );

/** Zero-length track + no fill, rather than a 0%-looking bar. */
const Meter = ({
  value,
  color = "var(--text-primary)",
}: {
  value: number | null;
  color?: string;
}) => (
  <div className="ci-track">
    {value != null && (
      <div
        className="ci-fill"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: color,
          opacity: 0.85,
        }}
      />
    )}
  </div>
);

/** A panel with a `.panel-head` label and nothing in the right slot. */
function Block({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="panel min-w-0">
      <div className="panel-head">
        <span className="panel-title flex items-center gap-2">
          {Icon && <Icon size={12} aria-hidden="true" />}
          {label}
        </span>
      </div>
      <div className="panel-pad-sm">{children}</div>
    </section>
  );
}

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
    <div className="flex min-w-0 flex-col gap-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b t-divider pb-2">
        <div className="flex items-center gap-2">
          <Radio size={14} style={{ color: "var(--text-secondary)" }} aria-hidden="true" />
          <span className="text-[14px] font-semibold t-text">Your signal</span>
        </div>
      </div>

      {/* 1. AI Resilience Score */}
      <Block label="AI resilience">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="metric-cell">
              <span className="metric-label">Score</span>
              {hasScore ? (
                <span className="flex items-baseline gap-1">
                  <span className="metric-xl">{Math.round(aiResilienceScore)}</span>
                  <span className="num text-[12px] t-faint">/ 100</span>
                </span>
              ) : (
                <span className="metric-xl num-na">{NO_DATA}</span>
              )}
            </div>
            <p className="mt-1 text-[11px] t-muted">
              {props.resilience_percentile ?? "Not yet measured"}
            </p>
          </div>

          <div className="relative h-14 w-14 flex-shrink-0 flex items-center justify-center">
            <svg width="56" height="56" viewBox="0 0 56 56" className="rotate-[-90deg]" aria-hidden="true">
              <circle cx="28" cy="28" r="24" stroke="var(--bg-chip)" strokeWidth="4" fill="none" />
              <circle
                cx="28"
                cy="28"
                r="24"
                stroke="var(--accent)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={strokeDash}
                opacity={hasScore ? 1 : 0.4}
              />
            </svg>
            <span
              className={`absolute text-[12px] font-bold ${hasScore ? "num t-text" : "num num-na"}`}
            >
              {hasScore ? `${Math.round(aiResilienceScore)}%` : NO_DATA}
            </span>
          </div>
        </div>
        {!hasScore && (
          <p className="mt-3 border-t t-divider pt-2.5 text-[11px] leading-relaxed t-faint">
            This is the AI-adaptation trait from the psychometric assessment. It is a
            measurement of you, not a default &mdash; take the assessment and it appears here.
          </p>
        )}
      </Block>

      {/* 2. Target Vector — was hardcoded to "Economics → Research & Quant" */}
      <Block label="Target vector" icon={Building2}>
        <div className="t-chip t-border flex items-center gap-2 rounded-lg border p-2.5">
          <Building2 size={13} className="flex-shrink-0" style={{ color: "var(--text-tertiary)" }} aria-hidden="true" />
          <span className="truncate text-[12px] t-faint">Not set</span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed t-muted">
          A target field has not been chosen yet, so nothing is ranked against it.
        </p>
      </Block>

      {/* 3. Profile Strength — the "74%" header was hardcoded regardless of input */}
      <Block label="Profile strength">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <span className="text-[12px] font-semibold t-text">Mean of three</span>
          {profileStrength ? (
            <span className="num text-[13px] font-bold t-text">
              {pctMean([
                profileStrength.academic,
                profileStrength.initiative,
                profileStrength.consistency,
              ])}
            </span>
          ) : (
            <span className="num text-[13px] num-na">{NO_DATA}</span>
          )}
        </div>

        <div className="space-y-3">
          {([
            ['academic', 'Academic rigor'],
            ['initiative', 'Initiative & research'],
            ['consistency', 'Execution consistency'],
          ] as const).map(([key, label]) => {
            const value = profileStrength?.[key] ?? null;
            return (
              <div key={key} className="min-w-0">
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="text-[12px] t-muted">{label}</span>
                  <Pct value={value} />
                </div>
                <Meter value={value} />
              </div>
            );
          })}
        </div>

        {!profileStrength && (
          <p className="mt-3 border-t t-divider pt-2.5 text-[11px] leading-relaxed t-faint">
            These three map to diligence, autonomy and security traits from the
            assessment. They stay empty until it is run.
          </p>
        )}
      </Block>

      {/* 4. Primary Gap — the copy asserted a ~2.4x odds uplift from a preprint */}
      <Block label="Primary gap">
        {props.primaryGap ? (
          <>
            <h4 className="text-[12px] font-bold leading-snug t-text">
              {props.primaryGap}
            </h4>
            {props.primaryGapOddsMultiplier && (
              <p className="mt-1.5 text-[11px] leading-relaxed t-muted">
                Closing this is associated with a reported{" "}
                <span className="num">{props.primaryGapOddsMultiplier}</span> change
                in admittance odds.
              </p>
            )}
          </>
        ) : (
          <>
            <h4 className="text-[12px] font-bold leading-snug t-faint">
              Not identified
            </h4>
            <p className="mt-1.5 text-[11px] leading-relaxed t-muted">
              A primary gap is only named once an admissions engine has compared your
              profile against a real target program. We do not guess one.
            </p>
          </>
        )}
      </Block>

      {/* 5. Roadmap Status — derived entirely from the user's own list */}
      <Block label="Roadmap status">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="text-[12px] font-semibold t-text">Milestones</span>
          <span className="num text-[12px] font-bold t-text">
            {milestonesComplete} / {milestonesTotal}
          </span>
        </div>

        <div className="mb-3">
          <Meter value={progress} color="var(--accent)" />
        </div>

        {props.sprintLabel ? (
          <div className="t-chip t-border rounded-lg border p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="metric-label">Active target</span>
              {props.sprintDaysRemaining != null && (
                <span className="num text-[10px] t-faint">
                  {props.sprintDaysRemaining} days left
                </span>
              )}
            </div>
            <p className="text-[12px] font-semibold t-text">{props.sprintLabel}</p>
          </div>
        ) : (
          <div className="t-chip t-border rounded-lg border p-3">
            <p className="text-[11px] leading-relaxed t-muted">
              No active sprint. Deadlines come from the exam calendar and program
              intakes, neither of which is loaded on this page yet.
            </p>
          </div>
        )}
      </Block>

      {/* 6. Next step — replaced a button that fired a bare window.alert() */}
      <section className="panel min-w-0">
        <div className="panel-pad-sm flex items-start gap-2">
          <CircleAlert
            size={14}
            className="mt-0.5 flex-shrink-0"
            style={{ color: "var(--text-tertiary)" }}
            aria-hidden="true"
          />
          <p className="text-[11px] leading-relaxed t-muted">
            This panel has no AI-resilience figure, no target field and no sprint
            because none have been measured for this account.{" "}
            <Link href="/onboard" className="t-accent font-semibold">
              Start calibration
            </Link>{" "}
            to populate them.
          </p>
        </div>
      </section>
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
