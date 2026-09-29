"use client";

import Link from "next/link";
import { ScoreRing } from "./ScoreRing";
import { DataFreshnessBadge } from "./DataFreshnessBadge";
import { formatInr, finiteOrNull, NO_DATA } from "../lib/mock-data";
import type { CollegeDegreeRecord } from "../lib/mock-data";
import { TrendingUp, Users } from "lucide-react";

interface CollegeCardProps {
  record: CollegeDegreeRecord;
  rank?: number;
  compact?: boolean;
}

const TIER_LABELS: Record<number, string> = { 1: "Tier 1", 2: "Tier 2", 3: "Tier 3" };

const AI_RISK_CLASS: Record<string, string> = {
  Low:        "badge-green",
  Medium:     "badge-amber",
  High:       "badge-red",
  "Very High": "badge-red",
};

/**
 * The accent bar under a card is coloured by AI-exposure band.
 *
 * These were four hardcoded hexes (`#30D158` / `#FF9F0A` / `#FF453A`). They are
 * now the `--green` / `--amber` / `--red` tokens, so the bar carries the same
 * meaning in dark mode — previously a dark-mode visitor saw the *light*
 * palette's amber on black, which reads dimmer and more olive than intended.
 */
const AI_RISK_TOKEN: Record<string, string> = {
  Low:        "var(--green)",
  Medium:     "var(--amber)",
  High:       "var(--red)",
  "Very High": "var(--red)",
};

export function CollegeCard({ record, rank, compact = false }: CollegeCardProps) {
  const { college, degree, roi, salary, placement, meta } = record;
  const riskToken = AI_RISK_TOKEN[meta?.aiRiskLabel] ?? "var(--amber)";
  // A missing composite score must never be drawn as 0/100 — that reads as
  // "the worst programme on the list" rather than "not measured".
  const composite = finiteOrNull(roi?.compositeScore);
  const ciLow = finiteOrNull(roi?.confidenceIntervalLow);
  const ciHigh = finiteOrNull(roi?.confidenceIntervalHigh);
  const medianY1 = finiteOrNull(salary?.year1?.p50) ?? finiteOrNull(placement?.medianSalaryInr);
  const medianY10 = finiteOrNull(salary?.year10?.p50);

  return (
    <Link href={`/college/${record.id}`} className="group block h-full focus-visible:outline-none">
      <div className="card-interactive h-full">
        {/* Score ring + info row */}
        <div className="flex items-start gap-4">
          <ScoreRing score={composite} size={68} strokeWidth={4.5} />

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                {rank && (
                  <span className="num text-[11px] font-bold t-accent">
                    #{rank}
                  </span>
                )}
                <span className="truncate font-mono text-[10px] font-semibold uppercase tracking-wider t-faint">
                  {college.shortName}
                </span>
              </div>
              <DataFreshnessBadge days={meta?.dataFreshnessDays ?? 0} />
            </div>

            <h3 className="truncate text-[15px] font-semibold leading-snug t-text transition-colors group-hover:t-accent">
              {degree.shortName}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className={`badge ${AI_RISK_CLASS[meta?.aiRiskLabel] ?? "badge-amber"}`}>
                AI risk {meta?.aiRiskLabel ?? NO_DATA}
              </span>
              <span className="badge badge-blue">{TIER_LABELS[college.tier]}</span>
              <span className="num text-[11px] t-faint">{college.city}</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        {!compact && (
          <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
            <StatBlock
              icon={<TrendingUp size={11} />}
              label="Median Y1"
              value={formatInr(medianY1)}
            />
            <StatBlock
              icon={<TrendingUp size={11} />}
              label="Median Y10"
              value={formatInr(medianY10)}
            />
            <StatBlock
              icon={<Users size={11} />}
              label="Placement"
              value={
                placement?.rate != null
                  ? `${placement.rate <= 1 ? Math.round(placement.rate * 100) : Math.round(placement.rate)}%`
                  : NO_DATA
              }
            />
          </div>
        )}

        {/* Confidence bar. No bar at all when unscored — a zero-width bar would
            read as "0", which is the one thing this figure must not say. */}
        <div className="mt-4 flex items-center gap-2.5">
          <div className="ci-track flex-1">
            {composite != null && (
              <div
                className="ci-fill"
                style={{
                  width: `${composite}%`,
                  background: `linear-gradient(90deg, ${riskToken}, ${riskToken})`,
                  opacity: 0.85,
                }}
              />
            )}
          </div>
          <span className="num whitespace-nowrap text-[10px] t-faint" title="Confidence interval around the composite score">
            CI {ciLow ?? NO_DATA}&ndash;{ciHigh ?? NO_DATA}
          </span>
        </div>
      </div>
    </Link>
  );
}

function StatBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  // `NO_DATA` is an em dash; it gets the muted unmeasured treatment rather than
  // being rendered in primary ink as though it were a reading.
  const isMissing = value === NO_DATA;
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center gap-1 t-faint">
        {icon}
        <span className="metric-label">{label}</span>
      </div>
      <span className={`num text-[13px] font-bold ${isMissing ? "num-na" : "t-text"}`}>
        {value}
      </span>
    </div>
  );
}
