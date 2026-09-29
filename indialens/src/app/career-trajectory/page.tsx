"use client";

/**
 * /career-trajectory — the Markov chain, shown as a distribution.
 *
 * The design rule for this page is that it must never make the single-sentence
 * claim: "in 10 years you will be a Senior". The model is a stochastic process
 * and its exact output is a distribution over 8 states. So the headline is the
 * whole distribution, the transition matrix is rendered in full, and the
 * Monte-Carlo estimate is shown next to the exact solution with their
 * disagreement stated — a student should be able to see that the number is a
 * modelled distribution with a spread, not a prophecy.
 */

import { useEffect, useMemo, useState } from "react";
import {
  GitBranch,
  AlertTriangle,
  RefreshCw,
  Grid3x3,
  TrendingUp,
  Info,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import {
  fetchCareerStates,
  fetchCareerTrajectory,
  type CareerStates,
  type CareerTrajectory,
  type DistributionRow,
} from "@/lib/career";
import { NO_DATA, finiteOrNull } from "@/lib/mock-data";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { Notice, UnmeasuredNote } from "@/components/Notice";
import { Metric } from "@/components/Metric";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton, SkeletonStatus } from "@/components/Skeleton";

const DEFAULT_START = "Fresher";
const HORIZONS = [5, 10, 15, 20];

/**
 * Probability cell → inline style, as CSS custom properties.
 *
 * This used to return light-palette Tailwind classes (`bg-slate-900`,
 * `text-slate-300`, `bg-white`) for the matrix heatmap. In the dark theme
 * those invert into pale-on-pale: `bg-white` cells with `text-slate-300` are
 * genuinely unreadable, and the ramp stops being a ramp. The ramp is now drawn
 * from the surface scale plus the accent at graded alpha, so the ordering
 * survives the theme change and a zero cell is visibly a *track* rather than
 * a hole.
 */
function cellTone(p: number | null): React.CSSProperties {
  const n = finiteOrNull(p);
  if (n === null) return {};
  if (n <= 0) return {};
  if (n >= 0.5) return { background: "var(--accent)", color: "#ffffff" };
  if (n >= 0.25) return { background: "var(--accent-dim)", color: "var(--text-primary)" };
  if (n >= 0.1) return { background: "var(--bg-chip)", color: "var(--text-secondary)" };
  if (n >= 0.02) return { background: "var(--bg-hover)", color: "var(--text-tertiary)" };
  return {};
}

function pctText(p: number | null): string {
  const n = finiteOrNull(p);
  if (n === null) return NO_DATA;
  if (n === 0) return "0";
  return n >= 0.01 ? `${(n * 100).toFixed(0)}%` : `${(n * 100).toFixed(1)}%`;
}

function inr(v: number | null | undefined): string {
  const n = finiteOrNull(v);
  if (n === null) return NO_DATA;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

/* ── Stacked distribution bar ────────────────────────────────────────── */

function StackedBar({ row, states }: { row: DistributionRow; states: string[] }) {
  return (
    <div className="t-chip flex h-7 w-full overflow-hidden rounded-md">
      {states.map((s) => {
        const v = finiteOrNull(row[s]) ?? 0;
        if (v <= 0.0005) return null;
        const isExit = s === "Exit";
        return (
          <div
            key={s}
            title={`${s}: ${(v * 100).toFixed(1)}%`}
            className="flex h-full items-center justify-center text-[9px] font-bold"
            style={{
              width: `${v * 100}%`,
              background: isExit ? "var(--text-tertiary)" : "var(--accent)",
              color: isExit ? "var(--bg)" : "#ffffff",
            }}
          >
            {v > 0.14 ? `${(v * 100).toFixed(0)}%` : ""}
          </div>
        );
      })}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function CareerTrajectoryPage() {
  const [vocab, setVocab] = useState<CareerStates | null>(null);
  const [vocabError, setVocabError] = useState<string | null>(null);

  const [field, setField] = useState("");
  const [tier, setTier] = useState("2");
  const [startState, setStartState] = useState(DEFAULT_START);
  const [horizon, setHorizon] = useState(20);
  const [baseSalary, setBaseSalary] = useState<string>("");
  const [runSalary, setRunSalary] = useState(false);

  const [result, setResult] = useState<CareerTrajectory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { ok, data, message } = await fetchCareerStates();
      if (ok) {
        setVocab(data);
        setField((prev) => prev || data.default_field || "default");
      } else {
        setVocabError(message);
      }
    })();
  }, []);

  const states = result?.states ?? vocab?.states ?? [];
  const matrixRows = result?.transition_matrix?.rows ?? null;

  async function run() {
    setLoading(true);
    setError(null);
    const salary = baseSalary.trim() === "" ? null : Number(baseSalary.replace(/[^0-9.]/g, ""));
    const { ok, data, message } = await fetchCareerTrajectory({
      field,
      tier,
      start_state: startState,
      horizon_years: horizon,
      base_salary_y1_inr:
        runSalary && salary !== null && Number.isFinite(salary) && salary > 0 ? salary : null,
      include_monte_carlo: true,
    });
    setLoading(false);
    if (!ok) {
      setResult(null);
      setError(message);
      return;
    }
    setResult(data);
  }

  // Re-run automatically on the structural inputs; the salary toggle is the
  // only one that costs another round-trip, so it stays a deliberate action.
  useEffect(() => {
    if (!field) return;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field, tier, startState, horizon]);

  const distribution = result?.distribution ?? null;
  const mcDistribution = result?.monte_carlo?.distribution ?? null;
  const salary = result?.salary_trajectory ?? null;

  const sampledRows = useMemo(() => {
    if (!distribution) return new Set<number>();
    return new Set(HORIZONS.filter((y) => y <= (result?.horizon_years ?? 0)));
  }, [distribution, result?.horizon_years]);

  return (
    <div className="page-shell">
      {/* ── Honesty banner ── */}
      <div className="status-strip">
        <div className="container-xl flex flex-wrap items-center gap-3">
          <GitBranch size={13} style={{ color: "var(--teal)" }} aria-hidden="true" />
          <span className="t-muted">
            <strong className="t-text">An 8-state Markov chain, shown as a distribution.</strong>{" "}
            Exact matrix-power solution (π(t) = π(0)·Pᵗ) plus an independent sampled run. We
            publish the matrix itself so you can check the assumptions.
          </span>
        </div>
      </div>

      <div className="container-xl page-header">
        <PageHeader
          kicker="Career trajectory model"
          eyebrow={
            <span className="badge badge-teal">
              <GitBranch size={10} aria-hidden="true" />
              Markov chain · 8 states
            </span>
          }
          title="Where does this career actually lead?"
          lead="Not &quot;where will you be&quot; — where the modelled population of people in your field ends up, with the spread intact. Pick your starting point and read the distribution."
        />
      </div>

      <div className="container-xl pb-16">
        {/* ── Controls ── */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Model inputs</span>
          </div>
          <div className="panel-pad">
            {vocabError && (
              <div role="alert" className="mb-4">
                <Notice tone="error" title="The state vocabulary could not be loaded">
                  {vocabError} The controls below fall back to the field defaults, which are not
                  the same thing as a loaded vocabulary.
                </Notice>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="ct-field" className="form-label">
                  Field
                </label>
                <select
                  id="ct-field"
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  className="form-input form-select text-[13px]"
                >
                  {(vocab?.fields ?? []).map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                  {vocab?.default_field && (
                    <option value={vocab.default_field}>
                      {vocab.default_field_label ?? vocab.default_field}
                    </option>
                  )}
                </select>
              </div>

              <div>
                <label htmlFor="ct-start" className="form-label">
                  You are today
                </label>
                <select
                  id="ct-start"
                  value={startState}
                  onChange={(e) => setStartState(e.target.value)}
                  className="form-input form-select text-[13px]"
                >
                  {(vocab?.states ?? [DEFAULT_START]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="ct-tier" className="form-label">
                  College tier
                </label>
                <select
                  id="ct-tier"
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="form-input form-select text-[13px]"
                >
                  {(vocab?.tiers ?? ["1", "2", "3"]).map((t) => (
                    <option key={t} value={t}>
                      Tier {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="ct-horizon" className="form-label">
                  Horizon
                </label>
                <select
                  id="ct-horizon"
                  value={horizon}
                  onChange={(e) => setHorizon(Number(e.target.value))}
                  className="form-input form-select text-[13px]"
                >
                  {HORIZONS.map((h) => (
                    <option key={h} value={h}>
                      {h} years
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Salary is opt-in: the model only knows multipliers, not salaries. */}
            <div
              className="mt-5 border-t pt-4"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium t-text">
                  <input
                    type="checkbox"
                    checked={runSalary}
                    onChange={(e) => setRunSalary(e.target.checked)}
                    className="h-4 w-4 rounded border-line accent-[var(--accent)]"
                  />
                  Scale to a real salary
                </label>
                <div className="min-w-0 flex-1">
                  <label htmlFor="ct-salary" className="sr-only">
                    First-year base salary in INR
                  </label>
                  <input
                    id="ct-salary"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    disabled={!runSalary}
                    placeholder="First-year salary in ₹ (e.g. 800000)"
                    inputMode="numeric"
                    aria-label="First-year base salary in INR"
                    className="form-input text-[13px]"
                  />
                </div>
                <button
                  type="button"
                  onClick={run}
                  disabled={loading}
                  className="btn-primary"
                  style={{ opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? (
                    <span className="spinner" aria-hidden="true" />
                  ) : (
                    <TrendingUp size={14} aria-hidden="true" />
                  )}
                  Run projection
                </button>
              </div>
              <p className="mt-2.5 text-[11px] leading-relaxed t-faint">
                Without a base salary the model stays silent on earnings — it knows how much each
                career state is worth <em>relative to</em> your first year, never what your first
                year is. Nothing is assumed on your behalf.
              </p>
            </div>
          </div>
        </div>

        {/* ── States ── */}
        {loading && (
          <div className="panel mt-6">
            <div className="panel-head">
              <span className="panel-title">Projection in progress</span>
            </div>
            <div className="panel-pad" role="status" aria-live="polite">
              <div className="grid gap-5 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="metric-cell">
                    <Skeleton className="h-2.5 w-24" />
                    <Skeleton className="mt-2.5 h-8 w-32" delay={i * 70} />
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-2">
                <Skeleton className="h-3 w-full" delay={120} />
                <Skeleton className="h-3 w-full" delay={170} />
                <Skeleton className="h-3 w-4/5" delay={220} />
              </div>
              <SkeletonStatus label="Running the matrix-power solution and 4,000 sampled paths" />
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="mt-6">
            <Notice tone="error" title="Projection unavailable">
              {error} No distribution is shown in its place — a partial distribution would read
              as a complete one.
            </Notice>
            <button type="button" onClick={run} className="btn-secondary mt-4">
              <RefreshCw size={13} aria-hidden="true" /> Retry
            </button>
          </div>
        )}

        {!loading && !error && !result && (
          <div className="mt-6">
            <EmptyState
              icon={Grid3x3}
              title="No projection yet"
              hint="Choose a field and a starting state and the model will return the full distribution across all eight career states."
            />
          </div>
        )}

        {!loading && !error && result && (
          <>
            {result.field_fallback && (
              <div className="mt-6">
                <Notice tone="warn" title="Not calibrated for this field" icon={AlertTriangle}>
                  {result.field_fallback_note}
                </Notice>
              </div>
            )}

            {/* ── Headline figures ── */}
            <div className="panel mt-6">
              <div className="panel-head">
                <span className="panel-title">Headline · year {result.horizon_years}</span>
                <span className="num text-[11px] t-faint">{field || "—"} · tier {tier}</span>
              </div>
              <div className="panel-pad">
                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="metric-cell">
                    <span className="metric-label">
                      Left the workforce by year {result.horizon_years}
                    </span>
                    <span className="metric-xl t-text">
                      {pctText(result.exit_risk_at_horizon)}
                    </span>
                    <span className="text-[10px] leading-snug t-faint">
                      {result.exit_risk_note}
                    </span>
                  </div>

                  <div className="metric-cell">
                    <span className="metric-label">Most likely state</span>
                    <MostLikely distribution={distribution} horizon={result.horizon_years} />
                  </div>

                  <div className="metric-cell">
                    <span className="metric-label">Exact vs sampled</span>
                    {result.agreement ? (
                      <>
                        <span className="metric-lg t-text">
                          {(finiteOrNull(result.agreement.tvd) ?? 0).toFixed(4)}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-[0.08em] ${
                            result.agreement.in_agreement
                              ? "text-sys-green"
                              : "text-sys-red"
                          }`}
                        >
                          {result.agreement.in_agreement
                            ? "Within sampling noise"
                            : "Disagreement — low confidence"}
                        </span>
                      </>
                    ) : (
                      <span className="metric num-na">&mdash;</span>
                    )}
                    <span className="text-[10px] leading-snug t-faint">
                      {result.agreement?.note ??
                        `Total-variation distance at year ${result.horizon_years}.`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Year-by-year distribution ── */}
            <section className="panel mt-6">
              <div className="panel-head">
                <span className="panel-title">The distribution, year by year</span>
                <span className="num text-[11px] t-faint">
                  {distribution ? `${distribution.length} rows` : "no rows"}
                </span>
              </div>
              <div className="panel-pad">
                <p className="body-p">
                  Each bar is the share of modelled people in each state in that year. It never
                  resolves to a single answer, because the model does not predict one.
                </p>

                {distribution && distribution.length > 0 ? (
                  <>
                    {/* Desktop table */}
                    <div className="mt-4 hidden overflow-x-auto lg:block">
                      <table className="data-table w-full min-w-[760px]">
                        <thead>
                          <tr>
                            <th className="text-left">Year</th>
                            <th className="text-left">Distribution</th>
                            {states.map((s) => (
                              <th key={s} className="text-right">{s}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {distribution.map((row) => (
                            <tr
                              key={row.year}
                              style={
                                sampledRows.has(row.year)
                                  ? { background: "var(--bg-hover)" }
                                  : undefined
                              }
                            >
                              <td className="num font-bold t-muted">{row.year}</td>
                              <td className="w-[280px]">
                                <StackedBar row={row} states={states} />
                              </td>
                              {states.map((s) => {
                                const cell = finiteOrNull(row[s]);
                                return (
                                  <td
                                    key={s}
                                    className={`text-right num ${cell == null ? "num-na" : ""}`}
                                    style={cellTone(cell)}
                                  >
                                    {pctText(cell)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile cards — an 9-column table cannot be read at 375px */}
                    <div className="mt-4 space-y-3 lg:hidden">
                      {distribution.map((row) => (
                        <div
                          key={row.year}
                          className="t-chip rounded-lg border p-3"
                          style={{ borderColor: "var(--border-subtle)" }}
                        >
                          <div className="mb-2 flex items-baseline justify-between gap-2">
                            <span className="metric-label">Year</span>
                            <span className="num text-[13px] font-bold t-text">
                              {row.year}
                            </span>
                          </div>
                          <StackedBar row={row} states={states} />
                          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
                            {states.map((s) => {
                              const cell = finiteOrNull(row[s]);
                              return (
                                <div key={s} className="metric-cell-row">
                                  <dt className="text-[11px] t-faint">{s}</dt>
                                  <dd className={`num text-[12px] t-text ${cell == null ? "num-na" : ""}`}>
                                    {pctText(cell)}
                                  </dd>
                                </div>
                              );
                            })}
                          </dl>
                        </div>
                      ))}
                    </div>

                    <Notice tone="info" className="mt-4" icon={Info}>
                      {mcDistribution
                        ? `Highlighted rows are the ${result.horizon_years}-year checkpoints the salary model samples. The full ${result.monte_carlo?.n_simulations.toLocaleString()}-path sampled run is returned by the API alongside this exact solution.`
                        : "Exact matrix-power solution. No sampled run was requested."}
                    </Notice>
                  </>
                ) : (
                  <div className="mt-4">
                    <UnmeasuredNote what="Year-by-year distribution">
                      The model returned no distribution rows for this field, tier and horizon.
                      Every share above the axis would be an assumption, so none is drawn.
                    </UnmeasuredNote>
                  </div>
                )}
              </div>
            </section>

            {/* ── Transition matrix ── */}
            <section className="panel mt-6">
              <div className="panel-head">
                <span className="panel-title">The transition matrix</span>
                <span className="num text-[11px] t-faint">
                  {matrixRows ? `${matrixRows.length} × ${states.length}` : "not computed"}
                </span>
              </div>
              <div className="panel-pad">
                <p className="body-p">
                  {result.transition_matrix?.note} These are the actual coefficients — every
                  distribution above is this matrix, raised to a power.
                </p>

                {matrixRows && matrixRows.length > 0 ? (
                  <>
                    <div className="mt-4 overflow-x-auto">
                      <table className="data-table w-full min-w-[720px]">
                        <thead>
                          <tr>
                            <th className="text-left">from ↓ / to →</th>
                            {states.map((s) => (
                              <th key={s} className="text-center">{s}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {matrixRows.map((row) => (
                            <tr key={row.from_state}>
                              <th
                                scope="row"
                                className="whitespace-nowrap text-left t-text"
                              >
                                {row.from_state}
                              </th>
                              {states.map((s) => {
                                const cell = finiteOrNull(row[s]);
                                return (
                                  <td
                                    key={s}
                                    className={`text-center num ${cell == null ? "num-na" : ""}`}
                                    style={cellTone(cell)}
                                  >
                                    {pctText(cell)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-3 text-[11px] leading-relaxed t-faint">
                      Rows sum to 1.0. &quot;Exit&quot; is absorbing at 100% — once in it, the chain
                      never leaves, which is why exit risk compounds.
                    </p>
                  </>
                ) : (
                  <div className="mt-4">
                    <UnmeasuredNote what="Transition matrix">
                      The model returned no matrix rows, so the assumptions behind every
                      distribution above cannot be inspected.
                    </UnmeasuredNote>
                  </div>
                )}
              </div>
            </section>

            {/* ── Salary ── */}
            <section className="panel mt-6">
              <div className="panel-head">
                <span className="panel-title">Salary along the path</span>
              </div>
              <div className="panel-pad">
                {!salary ? (
                  <UnmeasuredNote what="Salary trajectory">
                    {result.salary_trajectory_unavailable_reason}
                  </UnmeasuredNote>
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="overflow-x-auto">
                      <table className="data-table w-full min-w-[560px]">
                        <thead>
                          <tr>
                            <th className="text-left">Year</th>
                            {["p10", "p25", "Median", "p75", "p90"].map((h) => (
                              <th key={h} className="text-right">{h}</th>
                            ))}
                            <th className="text-right">Left workforce</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(salary.available_years ?? []).map((yearKey) => {
                            const band = salary.percentiles?.[yearKey];
                            if (!band) return null;
                            return (
                              <tr key={yearKey}>
                                <td className="font-bold t-text">
                                  Year {yearKey.replace("y", "")}
                                </td>
                                {(["p10", "p25", "p50", "p75", "p90"] as const).map((k) => {
                                  const v = finiteOrNull(band[k]);
                                  return (
                                    <td
                                      key={k}
                                      className={`text-right num ${v == null ? "num-na" : "t-text"}`}
                                    >
                                      {inr(band[k])}
                                    </td>
                                  );
                                })}
                                <td className="text-right num t-muted">
                                  {pctText(
                                    finiteOrNull(band.exit_mass_pct) === null
                                      ? null
                                      : (finiteOrNull(band.exit_mass_pct) ?? 0) / 100,
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <Notice tone="info" className="mt-4" icon={Info}>
                      {salary.method} {salary.checkpoints_note}
                    </Notice>

                    {anySuppressedGlobal(salary) && (
                      <>
                        <Notice tone="warn" className="mt-3" title="Some percentiles are deliberately blank">
                          {Object.values(salary.percentiles ?? {})
                            .map((b) => b.suppressed_reason)
                            .find(Boolean)}{" "}
                          A dash above means the model has no defensible figure there — it is not
                          zero.
                        </Notice>
                      </>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* ── Limits + related ── */}
            <section className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="panel">
                <div className="panel-head">
                  <span className="panel-title">What this model assumes</span>
                </div>
                <div className="panel-pad">
                  <ul className="space-y-2">
                    {[
                      "Five hand-entered transition matrices, not a fitted one.",
                      "No demographics, geography, gender, or institution type — only field and tier.",
                      "Tier changes promotion speed only; it never changes which states are reachable.",
                      "The Fresher state has no self-transition, so year 1 is fully determined.",
                    ].map((line) => (
                      <li key={line} className="flex items-start gap-2">
                        <span className="num text-[11px] t-faint" aria-hidden="true">▪</span>
                        <span className="text-[12px] leading-relaxed t-muted">{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="panel">
                <div className="panel-head">
                  <span className="panel-title">Related models</span>
                </div>
                <div className="panel-pad">
                  <div className="space-y-2">
                    <Link
                      href="/job-security"
                      className="flex items-center justify-between gap-3 text-[12px] font-semibold t-text transition-colors hover:t-accent"
                    >
                      <span>Is this career safe from AI?</span>
                      <ArrowRight size={13} className="t-faint" aria-hidden="true" />
                    </Link>
                    <Link
                      href="/methodology"
                      className="flex items-center justify-between gap-3 text-[12px] font-semibold t-text transition-colors hover:t-accent"
                    >
                      <span>Full methodology &amp; what we do not model</span>
                      <ExternalLink size={13} className="t-faint" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-10">
              <SectionHeader
                kicker="Reading the output"
                title="A distribution is the finding, not a hedge"
                lead="Nothing on this page resolves to a single predicted outcome, and none of the blanks are zeros. Where the model could not produce a defensible figure, the cell is a dash."
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function anySuppressedGlobal(
  salary: NonNullable<CareerTrajectory["salary_trajectory"]>,
): boolean {
  return Object.values(salary.percentiles ?? {}).some((b) => Boolean(b.suppressed_bands?.length));
}

function MostLikely({ distribution, horizon }: { distribution: DistributionRow[] | null; horizon: number }) {
  const row = distribution?.find((r) => r.year === horizon) ?? null;
  if (!row) {
    return (
      <>
        <span className="metric num-na">&mdash;</span>
        <span className="text-[10px] leading-snug t-faint">No row for the horizon year</span>
      </>
    );
  }
  const entries = Object.entries(row)
    .filter(([k]) => k !== "year")
    .map(([k, v]) => [k, finiteOrNull(v) ?? 0] as const)
    .sort((a, b) => b[1] - a[1]);
  const [name, value] = entries[0] ?? [null, 0];
  if (name === null || value <= 0) {
    return (
      <>
        <span className="metric num-na">&mdash;</span>
        <span className="text-[10px] leading-snug t-faint">No dominant state at this horizon</span>
      </>
    );
  }
  return (
    <>
      <span className="metric-lg leading-tight t-text">{name}</span>
      <span className="text-[10px] leading-snug t-faint">
        <span className="num">{pctText(value)}</span> of modelled paths — not a prediction for you
      </span>
    </>
  );
}
