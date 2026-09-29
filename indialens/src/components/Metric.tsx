"use client";

import { useCountUp } from "@/lib/motion";

/**
 * `Metric` — the one component a figure on this product should be written as.
 *
 * It exists because the four things every metric needs kept getting written
 * four different ways: a mono uppercase label, a tabular value, a caption
 * naming where the number came from, and a visible state for "not measured".
 * Encoding all four in one place is what stops score displays drifting between
 * pages, which was the clearest single symptom of the template look.
 *
 * Two behaviours are load-bearing:
 *
 * 1. **`value={null}` is the unmeasured state, and it is a first-class one.**
 *    It renders `—` in `.num-na` — muted, letter-spaced, never red, never `0`,
 *    never tweened. Red would assert "this is the worst reading", which is a
 *    different claim from "we do not have this". The tween is skipped entirely
 *    because animating `null → 84` would animate a number into existence that
 *    was never measured.
 *
 * 2. **`caption` is provenance, not decoration.** A number with no stated
 *    source is precisely the thing this product's methodology warns against, so
 *    a figure that is not self-describing should pass a caption rather than
 *    nothing. `tone` is a semantic claim about the value ("this is good"), so
 *    it is deliberately separate from the caption ("this is the P50 of the
 *    published band").
 */
export function Metric({
  label,
  value,
  format,
  caption,
  tone = "default",
  size = "md",
  className = "",
}: {
  label: string;
  /** `null` renders the unmeasured state. */
  value: number | null;
  format?: (v: number) => string;
  caption?: string;
  tone?: "default" | "good" | "warn" | "bad" | "accent";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const fmt = format ?? formatScore;
  const shown = useCountUp(value, fmt);

  const toneClass =
    tone === "good" ? "score-high" :
    tone === "warn" ? "score-medium" :
    tone === "bad"  ? "score-poor" :
    tone === "accent" ? "t-accent" : "";

  const sizeClass =
    size === "xl" ? "metric-xl" :
    size === "lg" ? "metric-lg" :
    size === "sm" ? "num-1 font-semibold" : "metric";

  return (
    <div className={`metric-cell ${className}`}>
      <span className="metric-label">{label}</span>
      {value == null ? (
        <>
          <span className={`${sizeClass} num-na`}>
            &mdash;
          </span>
          <span className="text-[10px] leading-snug text-[var(--text-tertiary)]">
            Not measured
          </span>
        </>
      ) : (
        <>
          <span className={`${sizeClass} num-roll ${toneClass}`}>{shown}</span>
          {caption && (
            <span className="text-[10px] leading-snug text-[var(--text-tertiary)]">
              {caption}
            </span>
          )}
        </>
      )}
    </div>
  );
}

const formatScore = (v: number) => v.toFixed(1);

/**
 * A label/value pair on one line, for dense rows where a stacked metric would
 * cost too much vertical space (comparison tables, telemetry sidebars).
 */
export function MetricRow({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="metric-cell-row">
      <span
        className="metric-label"
        title={hint}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

/**
 * A figure with a visible interval beside it.
 *
 * The point is emphasised and the interval is tertiary, so a reader can see
 * that the number is a band rather than a reading — which is the difference
 * between "you will earn ₹12L" and "₹12L, somewhere between ₹8L and ₹19L".
 * A missing bound renders as a dash within the band, never as `0`, because a
 * zero lower bound would silently narrow the stated uncertainty.
 */
export function MetricRange({
  label,
  point,
  low,
  high,
  format,
  caption,
}: {
  label: string;
  point: number | null;
  low?: number | null;
  high?: number | null;
  format?: (v: number) => string;
  caption?: string;
}) {
  const fmt = format ?? ((v: number) => v.toFixed(1));
  const shown = useCountUp(point, fmt);

  return (
    <div className="metric-cell">
      <span className="metric-label">{label}</span>
      {point == null ? (
        <>
          <span className="metric num-na">&mdash;</span>
          <span className="text-[10px] leading-snug text-[var(--text-tertiary)]">
            Not measured
          </span>
        </>
      ) : (
        <>
          <span className="range">
            <span className="range-point">{shown}</span>
            {(low != null || high != null) && (
              <span className="range-band">
                {low != null ? fmt(low) : "—"}–{high != null ? fmt(high) : "—"}
              </span>
            )}
          </span>
          {caption && (
            <span className="text-[10px] leading-snug text-[var(--text-tertiary)]">
              {caption}
            </span>
          )}
        </>
      )}
    </div>
  );
}
