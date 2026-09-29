"use client";

import { Clock } from "lucide-react";

/**
 * How long ago a programme's data was last refreshed.
 *
 * The colour is a claim about the age of a number, and it is a *directional*
 * one — it must read the same in both themes or a "stale" badge becomes
 * invisible in dark. The previous version returned three separate hex/rgba
 * triples per threshold; they are now the `--green` / `--amber` / `--red`
 * tokens plus their `-dim` variants, so `data-fresh` in dark is the dark
 * palette's green rather than the light palette's leaking through.
 *
 * The thresholds themselves are unchanged: 7 days, 30 days, then older.
 */
interface DataFreshnessBadgeProps {
  days: number;
  showIcon?: boolean;
}

export function DataFreshnessBadge({ days, showIcon = true }: DataFreshnessBadgeProps) {
  const tone =
    days <= 7 ? "green" : days <= 30 ? "amber" : "red";

  const label =
    days === 0
      ? "Today"
      : days > 365
        ? `${Math.floor(days / 30)}mo ago`
        : `${days}d ago`;

  return (
    <span
      className={`badge badge-${tone}`}
      title={`Data last updated ${days} day${days === 1 ? "" : "s"} ago${
        days > 30 ? " — worth re-checking before you rely on it" : ""
      }`}
    >
      {showIcon && <Clock size={9} aria-hidden="true" />}
      {label}
    </span>
  );
}
