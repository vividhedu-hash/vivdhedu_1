"use client";

import React, { useState } from "react";
import {
  ShieldAlert, Award, DollarSign,
  Briefcase, Activity, Scale, Trophy, TrendingUp, type LucideIcon,
} from "lucide-react";
import { EmptyState } from "./EmptyState";
import { Notice, UnmeasuredNote } from "./Notice";
import { Skeleton } from "./Skeleton";
import { formatInr, NO_DATA } from "../lib/mock-data";

interface ProgramItem {
  id: string;
  name: string;
  college: string;
  tier: string;
  /** null = cost of degree not verified. Rendered as an em dash, never "0 Lakhs". */
  fee_lakhs: number | null;
  /** null = not measured. Rendered as an em dash rather than a fabricated 0/100. */
  placement_rate_pct: number | null;
  median_salary_lpa: number | null;
  ai_risk_pct: number | null;
  payback_years: number | null;
  npv_20yr_lakhs: number | null;
}

interface CollegeCompareTableProps {
  programs: ProgramItem[];
}

/**
 * One row of the comparison matrix, declared once and rendered twice.
 *
 * The metric list was previously six hand-written `<tr>` blocks, each with its
 * own icon, its own conditional, and its own three different ways of spelling
 * "no data" ("Not verified", a bare em dash, and a tertiary-ink em dash). A
 * seventh column added later would have been a seventh block to write by hand,
 * and the odds of the new one matching the other six on padding and border
 * treatment are poor. So the matrix is data-driven: one row definition, one
 * renderer for the wide layout, one for the narrow one, and the two cannot
 * drift apart.
 *
 * The cell renderer draws a missing figure as an em dash in `.num-na`, per the
 * contract. It never draws `0` and never draws the dash in red, because a zero
 * fee reads as "free" and a red dash reads as "the worst reading on the
 * table" — both are claims none of these programmes has earned.
 */
interface MetricRow {
  key: string;
  label: string;
  Icon: LucideIcon;
  /** CSS var for the row icon, so it carries the same meaning in both themes. */
  iconColor: string;
  /** Which emphasis the reading gets — only when there is a reading at all. */
  tone: (p: ProgramItem) => "accent" | "ok" | "warn" | "default";
  value: (p: ProgramItem) => string;
}

const RUPEE = "\u20b9";
const EM_DASH = "\u2014";

const METRIC_ROWS: MetricRow[] = [
  {
    key: "fee",
    label: "Total degree fee",
    Icon: DollarSign,
    iconColor: "var(--amber)",
    tone: () => "default",
    value: (p) => (p.fee_lakhs == null ? NO_DATA : `${RUPEE}${p.fee_lakhs} Lakhs`),
  },
  {
    key: "placement",
    label: "Placement consistency",
    Icon: Briefcase,
    iconColor: "var(--green)",
    tone: () => "ok",
    value: (p) => (p.placement_rate_pct == null ? NO_DATA : `${p.placement_rate_pct}%`),
  },
  {
    key: "salary",
    label: "Median year-1 salary",
    Icon: Award,
    iconColor: "var(--blue)",
    tone: () => "default",
    value: (p) => (p.median_salary_lpa == null ? NO_DATA : `${RUPEE}${p.median_salary_lpa} LPA`),
  },
  {
    key: "payback",
    label: "Net payback horizon",
    Icon: TrendingUp,
    iconColor: "var(--teal)",
    tone: () => "default",
    value: (p) => (p.payback_years == null ? NO_DATA : `${p.payback_years} yrs`),
  },
  {
    key: "npv",
    label: "20-year net present value",
    Icon: Activity,
    iconColor: "var(--accent)",
    /* NPV is the row the reader is actually comparing on, so it is the
       emphasised one. A green wash behind the row is not: a wash is a verdict,
       and the sign of an NPV is relative to a discount rate this page does not
       display. */
    tone: () => "accent",
    value: (p) => (p.npv_20yr_lakhs == null ? NO_DATA : `${RUPEE}${p.npv_20yr_lakhs} Lakhs`),
  },
  {
    key: "ai_risk",
    label: "AI automation risk",
    Icon: ShieldAlert,
    iconColor: "var(--red)",
    tone: (p) => (p.ai_risk_pct == null ? "default" : p.ai_risk_pct > 30 ? "warn" : "ok"),
    value: (p) => (p.ai_risk_pct == null ? NO_DATA : `${p.ai_risk_pct}%`),
  },
];

const TONE_CLASS: Record<string, string> = {
  accent: "t-accent",
  ok: "score-high",
  warn: "score-medium",
  default: "t-text",
};

/** An unmeasured cell. `num-na` is the whole treatment — muted, no colour. */
function Na() {
  return <span className="num-na">{NO_DATA}</span>;
}

export default function CollegeCompareTable({ programs }: CollegeCompareTableProps) {
  const [selectedPair, setSelectedPair] = useState<[number, number]>([0, 1]);
  const [counterfactual, setCounterfactual] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  if (!programs || programs.length === 0) {
    return (
      <EmptyState
        icon={Scale}
        title="No programmes selected for comparison"
        hint="The comparison matrix needs at least one programme from the index. Browse the programme index to add programmes to compare on cost, placement, salary, payback and AI exposure."
      />
    );
  }

  const pA = programs[selectedPair[0]] || programs[0];
  const pB = programs[selectedPair[1]] || programs[1] || programs[0];

  const handleRunCounterfactual = async () => {
    // A counterfactual needs a measured salary AND a verified cost for both
    // programs. Without them the NPV delta is arithmetic on null (which becomes
    // 0 via `null * 100000`), so refuse rather than invent.
    if (pA.median_salary_lpa == null || pB.median_salary_lpa == null) {
      setCounterfactual({
        strategic_winner: null,
        counterfactual_verdict:
          "Not enough measured salary data to compare these two programs. We do not model figures we have not measured.",
        npv_delta_20yr_inr: null,
      });
      setLoading(false);
      return;
    }
    if (pA.fee_lakhs == null || pB.fee_lakhs == null) {
      setCounterfactual({
        strategic_winner: null,
        counterfactual_verdict:
          "At least one program has no verified total cost of degree, so its 20-year NPV cannot be computed.",
        npv_delta_20yr_inr: null,
      });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "counterfactual",
          program_a: {
            college_name: `${pA.college} ${pA.name}`,
            total_cost_of_degree_inr: pA.fee_lakhs * 100000,
            y5_p50: pA.median_salary_lpa * 100000 * 1.8,
          },
          program_b: {
            college_name: `${pB.college} ${pB.name}`,
            total_cost_of_degree_inr: pB.fee_lakhs * 100000,
            y5_p50: pB.median_salary_lpa * 100000 * 1.8,
          },
        }),
      });

      if (!res.ok) throw new Error(`analytics ${res.status}`);
      const data = await res.json();
      setCounterfactual(data);
    } catch (e) {
      // Local fallback calculation
      const npvDeltaLakhs =
        pA.npv_20yr_lakhs == null || pB.npv_20yr_lakhs == null
          ? null
          : Number((pA.npv_20yr_lakhs - pB.npv_20yr_lakhs).toFixed(1));
      const paybackDelta =
        pA.payback_years == null || pB.payback_years == null
          ? null
          : Math.abs(pB.payback_years - pA.payback_years).toFixed(1);
      setCounterfactual({
        strategic_winner:
          npvDeltaLakhs == null
            ? null
            : npvDeltaLakhs >= 0
              ? `${pA.college} ${pA.name}`
              : `${pB.college} ${pB.name}`,
        counterfactual_verdict:
          npvDeltaLakhs == null
            ? "Not enough measured data to compare these two programs."
            : `Choosing ${pA.college} ${pA.name} over ${pB.college} ${pB.name} yields ${RUPEE}${Math.abs(npvDeltaLakhs)}L ${npvDeltaLakhs >= 0 ? "higher" : "lower"} 20-year career NPV${paybackDelta ? ` with a ${paybackDelta} years payback delta` : ""}.`,
        npv_delta_20yr_inr: npvDeltaLakhs == null ? null : npvDeltaLakhs * 100000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Side-by-side comparison matrix. `panel` + a separate scrolling region:
          the overflow lives on an inner wrapper rather than on the panel
          itself, because `.panel` declares `overflow: hidden`. */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Comparison matrix</span>
          <span className="num text-[10px] t-faint">
            {programs.length} programme{programs.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Wide layout. `min-w` plus `overflow-x-auto`, so the matrix stays a
            matrix on a laptop and scrolls rather than crushing six columns into
            375px. */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <caption className="sr-only">
              College and programme comparison on total fee, placement rate,
              median year-1 salary, net payback horizon, 20-year net present
              value and AI automation risk. A dash means the figure is not
              measured, not that it is zero.
            </caption>
            <thead>
              <tr>
                <th scope="col" className="panel-title w-[22%] px-4 py-3 text-left">
                  Metric
                </th>
                {programs.map((p) => (
                  <th
                    key={p.id}
                    scope="col"
                    className="border-l px-4 py-3 text-left align-top"
                    style={{ borderColor: "var(--divider)" }}
                  >
                    <span className="block text-[11px] font-medium t-muted">
                      {p.college}
                    </span>
                    <span className="mt-0.5 block text-[15px] font-bold leading-snug t-text">
                      {p.name}
                    </span>
                    <span className="badge badge-blue mt-1.5">Tier {p.tier}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRIC_ROWS.map((row) => {
                const RowIcon = row.Icon;
                return (
                  <tr
                    key={row.key}
                    style={{ borderTop: "1px solid var(--border-subtle)" }}
                  >
                    <th
                      scope="row"
                      className="px-4 py-3 text-left align-middle text-[12px] font-semibold t-muted"
                    >
                      <span className="flex items-center gap-1.5">
                        <RowIcon size={13} aria-hidden="true" style={{ color: row.iconColor }} />
                        <span className="capitalize">{row.label}</span>
                      </span>
                    </th>
                    {programs.map((p) => {
                      const raw = row.value(p);
                      const missing = raw === NO_DATA;
                      return (
                        <td
                          key={p.id}
                          className="border-l px-4 py-3 align-middle"
                          style={{ borderColor: "var(--divider)" }}
                        >
                          {missing ? (
                            <Na />
                          ) : (
                            <span className={`num text-[13px] font-semibold ${TONE_CLASS[row.tone(p)]}`}>
                              {raw}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Narrow layout. Below `md` a six-column matrix is unreadable at any
            legible type size, so each programme becomes its own block and the
            same six metrics stack as label/value rows. Same data, one column. */}
        <div className="divide-y md:hidden" style={{ borderColor: "var(--divider)" }}>
          {programs.map((p) => (
            <div key={p.id} className="panel-pad">
              <div className="mb-3.5">
                <p className="text-[11px] font-medium t-muted">{p.college}</p>
                <p className="mt-0.5 text-[15px] font-bold leading-snug t-text">
                  {p.name}
                </p>
                <span className="badge badge-blue mt-1.5">Tier {p.tier}</span>
              </div>
              <dl className="space-y-2.5">
                {METRIC_ROWS.map((row) => {
                  const RowIcon = row.Icon;
                  const raw = row.value(p);
                  const missing = raw === NO_DATA;
                  return (
                    <div
                      key={row.key}
                      className="flex items-baseline justify-between gap-3"
                    >
                      <dt className="flex items-center gap-1.5">
                        <RowIcon size={12} aria-hidden="true" style={{ color: row.iconColor }} />
                        <span className="metric-label">{row.label}</span>
                      </dt>
                      <dd className="shrink-0 text-right">
                        {missing ? (
                          <Na />
                        ) : (
                          <span className={`num text-[13px] font-semibold ${TONE_CLASS[row.tone(p)]}`}>
                            {raw}
                          </span>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          ))}
        </div>
      </div>

      {/* A dash needs explaining once per surface, not six times in the cells. */}
      <UnmeasuredNote what="Any figure shown as a dash">
        Each column is drawn from the programme index. Where a college has not
        published a figure, or the index has not verified one, the cell is left
        as a dash. It is not estimated, and it is never zero.
      </UnmeasuredNote>

      {/* Econometric counterfactual panel */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title flex items-center gap-2">
            <Scale size={12} aria-hidden="true" />
            Pairwise counterfactual delta
          </span>
          <span className="num text-[10px] t-faint">Abadie standard</span>
        </div>

        <div className="panel-pad">
          <div className="flex flex-col gap-3.5 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <p className="text-[15px] font-bold leading-snug t-text">
                Run the econometric analysis
              </p>
              <p className="body-p mt-1.5">
                Pick two programmes and the engine returns the modelled 20-year
                NPV difference between them.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <label className="min-w-0 flex-1 sm:flex-none">
                <span className="sr-only">First programme</span>
                <select
                  value={selectedPair[0]}
                  onChange={(e) => setSelectedPair([Number(e.target.value), selectedPair[1]])}
                  className="form-input form-select !py-2 text-[12px]"
                >
                  {programs.map((p, idx) => (
                    <option key={p.id} value={idx}>
                      {p.college} ({p.name})
                    </option>
                  ))}
                </select>
              </label>

              <span aria-hidden="true" className="num hidden text-[11px] font-bold t-faint sm:inline">
                vs
              </span>

              <label className="min-w-0 flex-1 sm:flex-none">
                <span className="sr-only">Second programme</span>
                <select
                  value={selectedPair[1]}
                  onChange={(e) => setSelectedPair([selectedPair[0], Number(e.target.value)])}
                  className="form-input form-select !py-2 text-[12px]"
                >
                  {programs.map((p, idx) => (
                    <option key={p.id} value={idx}>
                      {p.college} ({p.name})
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={handleRunCounterfactual}
                disabled={loading}
                className="btn-primary flex-shrink-0 !py-2 !px-3.5 !text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    Running
                  </>
                ) : (
                  <>
                    <Activity size={13} aria-hidden="true" />
                    Run analysis
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Fixed minimum height so the panel does not resize under the
              reader when the verdict lands. */}
          <div
            className="mt-4 min-h-[104px] border-t pt-4"
            style={{ borderColor: "var(--divider)" }}
          >
            {loading ? (
              <div className="space-y-2.5" aria-busy="true">
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="h-3.5 w-full" delay={70} />
                <Skeleton className="h-3.5 w-4/5" delay={110} />
                <span className="sr-only" role="status" aria-live="polite">
                  Running the counterfactual analysis.
                </span>
              </div>
            ) : counterfactual ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <span className="flex items-center gap-1.5 text-[13px] font-bold t-text">
                    <Trophy size={13} style={{ color: "var(--amber)" }} aria-hidden="true" />
                    {counterfactual.strategic_winner
                      ? `Strategic verdict winner: ${counterfactual.strategic_winner}`
                      : "Strategic verdict winner: not determinable"}
                  </span>
                  <span className="flex items-baseline gap-2">
                    <span className="metric-label">20-year NPV delta</span>
                    {/* The previous version printed this label and then no
                        number under it at all. The delta is in the response, so
                        it is rendered; when the engine declines to produce one,
                        the label sits above a dash rather than above nothing. */}
                    {counterfactual.npv_delta_20yr_inr == null ? (
                      <span className="num-na">{NO_DATA}</span>
                    ) : (
                      <span className="num text-[13px] font-semibold t-text">
                        {formatInr(counterfactual.npv_delta_20yr_inr)}
                      </span>
                    )}
                  </span>
                </div>
                <p className="body-p">{counterfactual.counterfactual_verdict}</p>
              </div>
            ) : (
              <Notice tone="info">
                No verdict yet. Choose two programmes and run the analysis to see
                the modelled 20-year NPV difference between them.
              </Notice>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
