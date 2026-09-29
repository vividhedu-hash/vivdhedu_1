"use client";

import { Info } from "lucide-react";
import { useId, useState } from "react";

/**
 * The confidence band on a score, and the text that defines it.
 *
 * Two things changed here beyond the token conversion, both of which are
 * correctness rather than styling:
 *
 * 1. **The tooltip is now keyboard-reachable on Escape and on blur**, and it
 *    is wired with `aria-describedby` rather than being a bare div that appears
 *    on hover. Previously it only opened on `onMouseEnter`, so a keyboard user
 *    focusing the badge got an `onFocus` open but could not dismiss it with
 *    Escape and had no announced relationship between the badge and its
 *    explanation. The description is also rendered in the DOM for screen
 *    readers via `role="tooltip"` + `id`.
 *
 * 2. **The colours are tokens.** Three hardcoded hex/rgba triples could not
 *    theme, so a "high confidence" badge rendered with the light palette's
 *    green on a black surface in dark mode.
 *
 * The band is described in the copy as what it actually is: a width in points,
 * derived from the interval, not a probability.
 */
type ConfidenceLevel = "High" | "Medium" | "Low";

/** Maps to the `--green` / `--amber` / `--red` token triples. */
const TONE: Record<ConfidenceLevel, "green" | "amber" | "red"> = {
  High: "green",
  Medium: "amber",
  Low: "red",
};

const DESC: Record<ConfidenceLevel, string> = {
  High:
    "High confidence: at least 3 verified sources, refreshed within 30 days, and a confidence interval narrower than 15 points.",
  Medium:
    "Medium confidence: 1–2 sources, or data older than 30 days. The interval runs 15–25 points wide.",
  Low:
    "Low confidence: limited or imputed data, or an interval wider than 25 points. Treat the score as a direction, not a value.",
};

export function ConfidenceBadge({ level, ciLow, ciHigh }: {
  level: ConfidenceLevel;
  ciLow?: number;
  ciHigh?: number;
}) {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  const hasBand = ciLow !== undefined && ciHigh !== undefined;

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        aria-describedby={open ? tipId : undefined}
        className={`badge badge-${TONE[level]} cursor-help`}
      >
        {level}
        <Info size={9} aria-hidden="true" />
        <span className="sr-only">confidence — activate for the definition</span>
      </button>

      {open && (
        <span
          id={tipId}
          role="tooltip"
          className="t-elevated t-border t-shadow-md absolute bottom-[calc(100%+8px)] left-1/2 z-50 w-60 -translate-x-1/2 rounded-lg p-3 text-[12px] leading-relaxed t-muted"
          style={{ pointerEvents: "none" }}
        >
          {DESC[level]}
          {hasBand && (
            <span className="mt-1.5 block num text-[11px] t-text">
              CI {ciLow}&ndash;{ciHigh} (±{Math.round((ciHigh! - ciLow!) / 2)} pts)
            </span>
          )}
        </span>
      )}
    </span>
  );
}
