import React from 'react';
import { Sparkles, Plus, MessageSquare, Compass } from 'lucide-react';
import { EmptyState } from "./EmptyState";
import { Notice } from "./Notice";
import { MetricRow } from "./Metric";
import { Skeleton } from "./Skeleton";
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

/**
 * The advisor's answer surface.
 *
 * Restyled to the token system with no change to what it reports. The
 * structural decision worth naming: this is a **readout**, not a link, so the
 * frame is `.panel` — flat, hairline, no hover lift. It was a white rounded
 * box with a `transition-all` that implied it was interactive.
 *
 * The three states are the shared ones, in the same order the workspace page
 * asks for them: an `EmptyState` before a question exists, a `Skeleton` shaped
 * like the answer while the engine is thinking, and a `Notice tone="error"`
 * when it did not answer. The previous error block was a hand-rolled rose
 * panel, and the previous loading block was a `pulse` on a box with two grey
 * rectangles — which is what a skeleton is, so it is now the shared
 * `Skeleton` and it no longer pulses the whole card, which made the
 * surrounding text flicker for the whole duration of a long advisor call.
 */
export const AIDecisionCard: React.FC<AIDecisionCardProps> = ({
  result,
  onAddToRoadmap,
  onExploreLabs,
  onSaveAnalysis,
  onAskFollowUp,
}) => {
  if (!result) {
    return (
      <EmptyState
        variant="inline"
        title="No decision analysis yet"
        hint="Ask a question above and the advisor engine will answer it with its sources attached. Nothing is generated until you ask."
      />
    );
  }

  if (result.loading) {
    return (
      <div className="panel" aria-busy="true">
        <div className="panel-head">
          <span className="panel-title flex items-center gap-2">
            <Sparkles size={12} style={{ color: "var(--purple)" }} aria-hidden="true" />
            Decision engine
          </span>
          <span className="num text-[10px] t-faint">In flight</span>
        </div>
        <div className="panel-pad space-y-3.5">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-3.5 w-4/5" delay={70} />
          <Skeleton className="h-16 w-full" delay={110} />
        </div>
        <span className="sr-only" role="status" aria-live="polite">
          The advisor is answering.
        </span>
      </div>
    );
  }

  if (result.error) {
    return (
      <Notice tone="error" title="The advisor did not answer">
        <p className="leading-relaxed">{result.error}</p>
      </Notice>
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
  const hasConfidence =
    typeof result.confidence === "number" && result.confidence > 0;

  return (
    <div className="panel">
      {/* Top meta bar — the standard internal panel header. */}
      <div className="panel-head">
        <span className="flex flex-wrap items-center gap-2">
          <span className="panel-title flex items-center gap-2">
            <Sparkles size={12} style={{ color: "var(--purple)" }} aria-hidden="true" />
            Decision engine
          </span>
          {result.verified ? (
            <span className="epistemic-tag tag-evidence">Grounded</span>
          ) : (
            /* Amber, and it is the `warn` half of the vocabulary: an
               ungrounded answer is a degraded one, not a failed one. */
            <span className="epistemic-tag tag-gap">Unverified source</span>
          )}
        </span>
        <span className="num whitespace-nowrap text-[10px] t-faint">
          {result.simulationMs > 0
            ? `Runtime ${(result.simulationMs / 1000).toFixed(2)}s`
            : NO_DATA}
        </span>
      </div>

      <div className="panel-pad">
        {/* Recommendation — a raised block, because it is the one thing on
            this surface the reader came for. */}
        <div
          className="t-elevated rounded-xl border p-4"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
              style={{ background: "var(--accent)" }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold leading-snug t-text">
                {result.recommendation
                  ? result.recommendation.startsWith("Recommendation:")
                    ? result.recommendation
                    : `Recommendation: ${result.recommendation}`
                  : "No recommendation returned"}
              </p>
              {result.rationale ? (
                <p className="body-p mt-2">{result.rationale}</p>
              ) : (
                <p className="mt-2 text-[12px] leading-relaxed t-faint">
                  The engine returned no rationale for this answer.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Confidence — reported only when the engine supplied one, and drawn
            in `.num-na` when it did not, so a missing value never reads as a
            low one. */}
        <div className="mt-3.5 border-t pt-3.5" style={{ borderColor: "var(--divider)" }}>
          <MetricRow label="Engine confidence" hint="Self-reported by the advisor engine, out of 100">
            <span className={`num text-[12px] font-semibold ${hasConfidence ? "t-text" : "num-na"}`}>
              {hasConfidence ? `${result.confidence}/100` : NO_DATA}
            </span>
          </MetricRow>
        </div>

        {/* Delta metrics — straight from the engine, never a placeholder pair. */}
        {hasDeltas && (
          <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            {result.deltaMetrics.map((m) => (
              <div
                key={m.label}
                className="t-chip rounded-xl border p-3.5"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <span className="metric-label">{m.label}</span>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="num metric truncate text-ink">
                    {m.from} &rarr; {m.to}
                  </span>
                  <span
                    className={`delta-pill ${m.positive ? "delta-pill-green" : "delta-pill-red"}`}
                  >
                    {m.delta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action footer */}
        <div
          className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4"
          style={{ borderColor: "var(--divider)" }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => result.primaryAction && onAddToRoadmap?.(result.primaryAction)}
              disabled={!result.primaryAction}
              className="btn-primary !py-2 !px-4 !text-xs disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={13} aria-hidden="true" />
              Add to roadmap
            </button>
            <button
              type="button"
              onClick={() => onExploreLabs?.()}
              className="btn-secondary !py-2 !px-3.5 !text-xs"
            >
              <Compass size={13} aria-hidden="true" />
              Explore programmes
            </button>
            <button
              type="button"
              onClick={() => onSaveAnalysis?.()}
              className="btn-secondary !py-2 !px-3.5 !text-xs"
            >
              Save analysis
            </button>
          </div>

          <button
            type="button"
            onClick={() => onAskFollowUp?.()}
            disabled={!onAskFollowUp}
            className="btn-ghost !py-2 !text-xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MessageSquare size={13} aria-hidden="true" />
            <span>Ask follow-up</span>
          </button>
        </div>
      </div>
    </div>
  );
};
