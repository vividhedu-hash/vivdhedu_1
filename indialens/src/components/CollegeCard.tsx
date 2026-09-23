"use client";

import Link from "next/link";
import { ScoreRing } from "./ScoreRing";
import { DataFreshnessBadge } from "./DataFreshnessBadge";
import { formatInr } from "../lib/mock-data";
import type { CollegeDegreeRecord } from "../lib/mock-data";
import { TrendingUp, Users } from "lucide-react";

interface CollegeCardProps {
  record: CollegeDegreeRecord;
  rank?: number;
  compact?: boolean;
}

const TIER_LABELS: Record<number, string> = { 1: "Tier 1", 2: "Tier 2", 3: "Tier 3" };

const AI_RISK_CLASS: Record<string, string> = {
  Low:       "badge-green",
  Medium:    "badge-amber",
  High:      "badge-red",
  "Very High":"badge-red",
};

const AI_RISK_COLOR: Record<string, string> = {
  Low:       "#30D158",
  Medium:    "#FF9F0A",
  High:      "#FF453A",
  "Very High":"#FF453A",
};

export function CollegeCard({ record, rank, compact = false }: CollegeCardProps) {
  const { college, degree, roi, salary, placement, meta } = record;
  const riskColor = AI_RISK_COLOR[meta?.aiRiskLabel] ?? "#FF9F0A";

  return (
    <Link href={`/college/${record.id}`} className="block group">
      <div
        className="bg-white border border-slate-200/90 rounded-2xl p-5 transition-all duration-200 hover:border-slate-300 hover:-translate-y-1 hover:shadow-md shadow-xs"
      >
        {/* Score ring + info row */}
        <div className="flex items-start gap-4">
          <ScoreRing score={roi?.compositeScore ?? 0} size={68} strokeWidth={4.5} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5">
                {rank && (
                  <span className="text-[11px] font-mono font-bold text-rose-600">
                    #{rank}
                  </span>
                )}
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                  {college.shortName}
                </span>
              </div>
              <DataFreshnessBadge days={meta?.dataFreshnessDays ?? 0} />
            </div>

            <h3 className="font-semibold leading-snug truncate text-[15px] text-zinc-900 group-hover:text-rose-600 transition-colors">
              {degree.shortName}
            </h3>

            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className={`badge ${AI_RISK_CLASS[meta?.aiRiskLabel] ?? "badge-amber"}`}>
                AI Risk: {meta?.aiRiskLabel ?? "—"}
              </span>
              <span className="badge badge-blue">{TIER_LABELS[college.tier]}</span>
              <span className="text-[11px] text-zinc-400 font-mono">{college.city}</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        {!compact && (
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
            <StatBlock
              icon={<TrendingUp size={11} />}
              label="Median Y1"
              value={formatInr(salary?.year1?.p50 ?? placement?.medianSalaryInr ?? 0)}
            />
            <StatBlock
              icon={<TrendingUp size={11} />}
              label="Median Y10"
              value={formatInr(salary?.year10?.p50 ?? 0)}
            />
            <StatBlock
              icon={<Users size={11} />}
              label="Placement"
              value={
                placement?.rate != null
                  ? `${placement.rate <= 1 ? Math.round(placement.rate * 100) : Math.round(placement.rate)}%`
                  : "—"
              }
            />
          </div>
        )}

        {/* Confidence bar */}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 h-[2px] bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${roi?.compositeScore ?? 0}%`,
                background: `linear-gradient(90deg, ${riskColor}80, ${riskColor})`,
              }}
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-400 whitespace-nowrap">
            CI: {roi?.confidenceIntervalLow ?? "—"}–{roi?.confidenceIntervalHigh ?? "—"}
          </span>
        </div>
      </div>
    </Link>
  );
}

function StatBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1 text-zinc-400">
        {icon}
        <span className="text-[9px] font-mono uppercase tracking-wider">{label}</span>
      </div>
      <span className="font-mono font-bold text-[13px] text-zinc-900">{value}</span>
    </div>
  );
}
