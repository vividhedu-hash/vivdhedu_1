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
  Loader2,
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

const DEFAULT_START = "Fresher";
const HORIZONS = [5, 10, 15, 20];

/** Colour ramp for the transition matrix / distribution cells. */
function cellTone(p: number | null): string {
  const n = finiteOrNull(p);
  if (n === null) return "bg-slate-50 text-slate-300";
  if (n >= 0.5) return "bg-slate-900 text-white";
  if (n >= 0.25) return "bg-slate-600 text-white";
  if (n >= 0.1) return "bg-slate-400 text-white";
  if (n >= 0.02) return "bg-slate-200 text-slate-700";
  if (n > 0) return "bg-slate-100 text-slate-500";
  return "bg-white text-slate-300";
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
    <div className="flex h-7 w-full overflow-hidden rounded-md bg-slate-100">
      {states.map((s) => {
        const v = finiteOrNull(row[s]) ?? 0;
        if (v <= 0.0005) return null;
        const isExit = s === "Exit";
        return (
          <div
            key={s}
            title={`${s}: ${(v * 100).toFixed(1)}%`}
            className={`h-full flex items-center justify-center text-[9px] font-bold transition-all ${
              isExit
                ? "bg-slate-300 text-slate-700"
                : v > 0.18
                  ? "bg-slate-800 text-white"
                  : "bg-slate-500 text-white"
            }`}
            style={{ width: `${v * 100}%` }}
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-24">
      {/* ── Honesty banner ── */}
      <div className="bg-white border-b border-slate-200 py-2.5">
        <div className="container-lg">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-emerald-600 shrink-0">
              <GitBranch size={14} />
            </span>
            <span className="text-xs text-slate-600">
              <strong className="text-slate-900 font-semibold">An 8-state Markov chain, shown as a distribution.</strong>{" "}
              Exact matrix-power solution (π(t) = π(0)·Pᵗ) plus an independent sampled run. We
              publish the matrix itself so you can check the assumptions.
            </span>
          </div>
        </div>
      </div>

      <div className="container-lg pt-10 pb-16">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-950 tracking-tight mb-3">
          Where does this career actually lead?
        </h1>
        <p className="text-base text-slate-600 mb-8 max-w-2xl leading-relaxed">
          Not &quot;where will you be&quot; — where the modelled population of people in your field
          ends up, with the spread intact. Pick your starting point and read the distribution.
        </p>

        {/* ── Controls ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm mb-8">
          {vocabError && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50/60 px-3.5 py-2.5">
              <p className="text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle size={13} /> {vocabError}
              </p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="ct-field" className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Field
              </label>
              <select
                id="ct-field"
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="mt-1.5 w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-slate-400"
              >
                {(vocab?.fields ?? []).map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
                {vocab?.default_field && (
                  <option value={vocab.default_field}>{vocab.default_field_label ?? vocab.default_field}</option>
                )}
              </select>
            </div>

            <div>
              <label htmlFor="ct-start" className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                You are today
              </label>
              <select
                id="ct-start"
                value={startState}
                onChange={(e) => setStartState(e.target.value)}
                className="mt-1.5 w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-slate-400"
              >
                {(vocab?.states ?? [DEFAULT_START]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ct-tier" className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                College tier
              </label>
              <select
                id="ct-tier"
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="mt-1.5 w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-slate-400"
              >
                {(vocab?.tiers ?? ["1", "2", "3"]).map((t) => (
                  <option key={t} value={t}>
                    Tier {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ct-horizon" className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Horizon
              </label>
              <select
                id="ct-horizon"
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
                className="mt-1.5 w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-slate-400"
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
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={runSalary}
                  onChange={(e) => setRunSalary(e.target.checked)}
                  className="accent-slate-900"
                />
                Scale to a real salary
              </label>
              <input
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                disabled={!runSalary}
                placeholder="First-year salary in ₹ (e.g. 800000)"
                inputMode="numeric"
                className="flex-1 min-w-[200px] bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
                aria-label="First-year base salary in INR"
              />
              <button onClick={run} disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.7 : 1 }}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
                Run projection
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
              Without a base salary the model stays silent on earnings — it knows how much each
              career state is worth <em>relative to</em> your first year, never what your first year
              is. Nothing is assumed on your behalf.
            </p>
          </div>
        </div>

        {/* ── States ── */}
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center mb-8">
            <Loader2 size={22} className="mx-auto text-slate-400 animate-spin mb-3" />
            <p className="text-xs text-slate-500">Running the matrix-power solution and 4,000 sampled paths…</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center mb-8">
            <AlertTriangle size={22} className="mx-auto text-rose-500 mb-3" />
            <p className="text-sm font-bold text-rose-900">Projection unavailable</p>
            <p className="text-xs text-rose-700 mt-1.5 max-w-md mx-auto leading-relaxed">{error}</p>
            <button onClick={run} className="btn-secondary mt-4 inline-flex items-center gap-2">
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {!loading && !error && !result && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
            <Grid3x3 size={24} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-600">No projection yet</p>
          </div>
        )}

        {!loading && !error && result && (
          <>
            {result.field_fallback && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 flex items-start gap-2.5">
                <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-relaxed">
                  <strong>Not calibrated for this field.</strong> {result.field_fallback_note}
                </p>
              </div>
            )}

            {/* ── Exit risk headline ── */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-1">
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Left the workforce by year {result.horizon_years}
                </p>
                <p className="text-3xl font-black font-mono text-slate-950 mt-1">
                  {pctText(result.exit_risk_at_horizon)}
                </p>
                <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">{result.exit_risk_note}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Most likely state
                </p>
                <MostLikely distribution={distribution} horizon={result.horizon_years} />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Exact vs sampled
                </p>
                {result.agreement ? (
                  <>
                    <p className="text-2xl font-black font-mono text-slate-950 mt-1">
                      {(finiteOrNull(result.agreement.tvd) ?? 0).toFixed(4)}
                    </p>
                    <p
                      className={`text-[10px] font-bold mt-1 ${
                        result.agreement.in_agreement ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {result.agreement.in_agreement ? "WITHIN SAMPLING NOISE" : "DISAGREEMENT — LOW CONFIDENCE"}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-400 mt-2">Not computed</p>
                )}
                <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                  {result.agreement?.note ?? `Total-variation distance at year ${result.horizon_years}.`}
                </p>
              </div>
            </div>

            {/* ── Year-by-year distribution ── */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-slate-950 mb-1">The distribution, year by year</h2>
              <p className="text-xs text-slate-500 mb-4 max-w-2xl leading-relaxed">
                Each bar is the share of modelled people in each state in that year. It never
                resolves to a single answer, because the model does not predict one.
              </p>

              {distribution && distribution.length > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[760px]">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5 w-16 font-mono font-bold uppercase tracking-wider text-[10px] text-slate-400">
                            Year
                          </th>
                          <th className="px-3 py-2.5 font-mono font-bold uppercase tracking-wider text-[10px] text-slate-400">
                            Distribution
                          </th>
                          {states.map((s) => (
                            <th
                              key={s}
                              className="px-2 py-2.5 text-right font-mono font-bold uppercase tracking-wider text-[10px] text-slate-400"
                            >
                              {s}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {distribution.map((row) => (
                          <tr
                            key={row.year}
                            className={`border-b border-slate-100 last:border-0 ${
                              sampledRows.has(row.year) ? "bg-slate-50/40" : ""
                            }`}
                          >
                            <td className="px-4 py-2 font-mono font-bold text-slate-700">{row.year}</td>
                            <td className="px-3 py-2 w-[280px]">
                              <StackedBar row={row} states={states} />
                            </td>
                            {states.map((s) => (
                              <td key={s} className={`px-2 py-2 text-right font-mono ${cellTone(finiteOrNull(row[s]))}`}>
                                {pctText(finiteOrNull(row[s]))}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/60">
                    <p className="text-[10px] text-slate-500">
                      {mcDistribution
                        ? `Highlighted rows are the ${result.horizon_years}-year checkpoints the salary model samples. The full ${result.monte_carlo?.n_simulations.toLocaleString()}-path sampled run is returned by the API alongside this exact solution.`
                        : "Exact matrix-power solution. No sampled run was requested."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
                  <p className="text-sm text-slate-500">The model returned no distribution rows.</p>
                </div>
              )}
            </section>

            {/* ── Transition matrix ── */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-slate-950 mb-1">The transition matrix</h2>
              <p className="text-xs text-slate-500 mb-4 max-w-2xl leading-relaxed">
                {result.transition_matrix?.note} These are the actual coefficients — every
                distribution above is this matrix, raised to a power.
              </p>

              {matrixRows && matrixRows.length > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[720px] border-collapse">
                      <thead>
                        <tr>
                          <th className="px-4 py-2.5 text-left font-mono font-bold uppercase tracking-wider text-[10px] text-slate-400 bg-slate-50">
                            from ↓ / to →
                          </th>
                          {states.map((s) => (
                            <th
                              key={s}
                              className="px-2 py-2.5 text-center font-mono font-bold uppercase tracking-wider text-[10px] text-slate-400 bg-slate-50"
                            >
                              {s}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {matrixRows.map((row) => (
                          <tr key={row.from_state}>
                            <th className="px-4 py-2 text-left font-semibold text-slate-700 bg-slate-50 whitespace-nowrap">
                              {row.from_state}
                            </th>
                            {states.map((s) => (
                              <td
                                key={s}
                                className={`px-2 py-2 text-center font-mono font-bold ${cellTone(finiteOrNull(row[s]))}`}
                              >
                                {pctText(finiteOrNull(row[s]))}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/60">
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Rows sum to 1.0. &quot;Exit&quot; is absorbing at 100% — once in it, the chain
                      never leaves, which is why exit risk compounds.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
                  <p className="text-sm text-slate-500">The model returned no matrix rows.</p>
                </div>
              )}
            </section>

            {/* ── Salary ── */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-slate-950 mb-4">Salary along the path</h2>
              {!salary ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
                  <Info size={20} className="mx-auto text-slate-300 mb-2.5" />
                  <p className="text-sm font-semibold text-slate-600">Not modelled without a base salary</p>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-lg mx-auto leading-relaxed">
                    {result.salary_trajectory_unavailable_reason}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[560px]">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {["Year", "p10", "p25", "Median", "p75", "p90", "Left workforce"].map((h, i) => (
                            <th
                              key={h}
                              className={`px-4 py-2.5 font-mono font-bold uppercase tracking-wider text-[10px] text-slate-400 ${
                                i === 0 ? "text-left" : "text-right"
                              }`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(salary.available_years ?? []).map((yearKey) => {
                          const band = salary.percentiles?.[yearKey];
                          if (!band) return null;
                          return (
                            <tr key={yearKey} className="border-b border-slate-100 last:border-0">
                              <td className="px-4 py-2.5 font-bold text-slate-800">
                                Year {yearKey.replace("y", "")}
                              </td>
                              {(["p10", "p25", "p50", "p75", "p90"] as const).map((k) => (
                                <td
                                  key={k}
                                  className={`px-4 py-2.5 text-right font-mono ${
                                    finiteOrNull(band[k]) === null ? "text-slate-300" : "text-slate-700"
                                  }`}
                                >
                                  {inr(band[k])}
                                </td>
                              ))}
                              <td className="px-4 py-2.5 text-right font-mono text-slate-500">
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
                  <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60 space-y-1.5">
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      {salary.method} {salary.checkpoints_note}
                    </p>
                    {anySuppressedGlobal(salary) ? (
                      <>
                        <p className="text-[10px] text-amber-700 leading-relaxed">
                          <strong>Some percentiles are deliberately blank.</strong>{" "}
                          {Object.values(salary.percentiles ?? {})
                            .map((b) => b.suppressed_reason)
                            .find(Boolean)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          A dash above means the model has no defensible figure there — it is not zero.
                        </p>
                      </>
                    ) : null}
                  </div>
                </div>
              )}
            </section>

            {/* ── Limits ── */}
            <section className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5">
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 mb-2">
                  What this model assumes
                </p>
                <ul className="space-y-1.5 text-xs text-slate-600 leading-relaxed">
                  <li>· Five hand-entered transition matrices, not a fitted one.</li>
                  <li>· No demographics, geography, gender, or institution type — only field and tier.</li>
                  <li>· Tier changes promotion speed only; it never changes which states are reachable.</li>
                  <li>· The Fresher state has no self-transition, so year 1 is fully determined.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Related models
                </p>
                <div className="space-y-2">
                  <Link
                    href="/job-security"
                    className="flex items-center justify-between text-xs font-semibold text-slate-800 hover:text-slate-950 group"
                  >
                    <span>Is this career safe from AI?</span>
                    <ArrowRight size={12} className="text-slate-400 group-hover:text-slate-700" />
                  </Link>
                  <Link
                    href="/methodology"
                    className="flex items-center justify-between text-xs font-semibold text-slate-800 hover:text-slate-950 group"
                  >
                    <span>Full methodology &amp; what we do not model</span>
                    <ExternalLink size={12} className="text-slate-400 group-hover:text-slate-700" />
                  </Link>
                </div>
              </div>
            </section>
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
  if (!row) return <p className="text-sm text-slate-400 mt-2">No row for the horizon year.</p>;
  const entries = Object.entries(row)
    .filter(([k]) => k !== "year")
    .map(([k, v]) => [k, finiteOrNull(v) ?? 0] as const)
    .sort((a, b) => b[1] - a[1]);
  const [name, value] = entries[0] ?? [null, 0];
  if (name === null || value <= 0) return <p className="text-sm text-slate-400 mt-2">No dominant state.</p>;
  return (
    <>
      <p className="text-2xl font-black text-slate-950 mt-1 leading-tight">{name}</p>
      <p className="text-xs text-slate-500 font-mono mt-0.5">
        {pctText(value)} of modelled paths — not a prediction for you
      </p>
    </>
  );
}
