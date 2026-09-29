"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Globe,
  AlertTriangle,
  ArrowRight,
  Calculator,
  Info,
  RefreshCw,
  ExternalLink,
  GlobeX,
  FilterX,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { NO_DATA, finiteOrNull } from "@/lib/mock-data";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { Notice, UnmeasuredNote } from "@/components/Notice";
import { Metric } from "@/components/Metric";
import { Skeleton, SkeletonStatus, SkeletonCards } from "@/components/Skeleton";

/*
 * Every number on this page comes from the FastAPI v2 global router
 * (backend/api/routers/global_programs.py) or the actuarial engine it calls
 * (backend/ml/nextgen_engine.py, `GlobalDegreeROIEngine`).
 *
 * There is deliberately no local program array and no local USD→INR constant.
 * The previous version hardcoded 9 universities and a private `USD_TO_INR =
 * 86.5`, then re-derived cost, salary and savings client-side — so a student
 * saw numbers the engine never produced, and a program the engine could not
 * value still looked evaluated. The engine already does FX, city-level tax
 * drag, 20-year discounting and the H-1B lottery; the client does arithmetic
 * only on what the engine returns.
 */

/** One row of `GET /api/v2/global/programs` (global_programs.py:39). */
interface GlobalProgram {
  university_name: string;
  country: string;
  city: string;
  degree_name: string;
  major: string;
  global_tier: string;
  is_stem_designated: boolean;
  annual_tuition_usd: number | null;
  living_cost_annual_usd: number | null;
  median_salary_usd_y1: number | null;
  median_salary_usd_y5: number | null;
  visa_type: string;
  visa_survival_prob: number | null;
  effective_tax_rate: number | null;
  monthly_rent_median_usd?: number | null;
  website_url?: string | null;
}

interface ProgramsResponse {
  programs: GlobalProgram[];
  total: number;
  source: string;
}

interface CityIndexEntry {
  tax_rate: number;
  monthly_rent: number;
  monthly_living: number;
}

/** `GET /api/v2/global/city-benchmarks` (global_programs.py:82). */
interface CityBenchmarks {
  cities: Record<string, CityIndexEntry>;
  fx_rates: Record<string, number>;
}

/** `POST /api/v2/global/cross-border-npv` → `evaluate_global_program_npv` (nextgen_engine.py:755). */
interface CrossBorderNPV {
  university_name: string;
  city: string;
  visa_survival_prob: number;
  total_investment_usd: number;
  total_investment_inr: number;
  median_starting_salary_usd: number;
  median_starting_salary_inr: number;
  net_annual_savings_y1_usd: number;
  net_annual_savings_y1_inr: number;
  effective_tax_drag_pct: number;
  npv_20y_inr: number;
  roi_multiple: number;
  verdict: string;
}

type NPVState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: CrossBorderNPV }
  | { status: "unavailable"; reason: string };

const PROGRAM_KEY = (p: GlobalProgram) =>
  `${p.university_name}|${p.city}|${p.degree_name}|${p.major}`;

const usd = (n: number | null) => (n == null ? NO_DATA : `$${Math.round(n).toLocaleString()}`);
const inrLakhs = (n: number | null) => (n == null ? NO_DATA : `₹${(n / 100000).toFixed(1)} L`);
const pct = (n: number | null, digits = 1) => (n == null ? NO_DATA : `${(n * 100).toFixed(digits)}%`);

/**
 * Visa survival → a CLASS, not a colour string.
 *
 * It returned light-palette hex-derived classes (`text-emerald-700`) that do
 * not exist in the dark theme, where a dark-mode visitor got a near-black
 * green on a near-black surface. The system tokens are the same meaning in
 * both. A null survival rate is `text-ink-3` — grey, never red, because an
 * unmeasured probability is not a low one.
 */
function visaTone(prob: number | null): string {
  if (prob == null) return "text-ink-3";
  if (prob >= 0.9) return "text-sys-green";
  if (prob >= 0.6) return "text-sys-amber";
  return "text-sys-red";
}

export default function GlobalDegreesPage() {
  const [selectedCountry, setSelectedCountry] = useState<string>("All");
  const [selectedTier, setSelectedTier] = useState<string>("All");
  const [stemOnly, setStemOnly] = useState<boolean>(false);

  const [programs, setPrograms] = useState<GlobalProgram[]>([]);
  const [benchmarks, setBenchmarks] = useState<CityBenchmarks | null>(null);
  const [registrySource, setRegistrySource] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [npv, setNpv] = useState<Record<string, NPVState>>({});

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    // Both endpoints are read together: the NPV engine draws its city tax rate
    // and rent from the same COLI index the second call returns, so the page
    // needs both to describe a result honestly.
    const [programsRes, benchRes] = await Promise.allSettled([
      fetch("/api/v2/global/programs", { cache: "no-store" }),
      fetch("/api/v2/global/city-benchmarks", { cache: "no-store" }),
    ]);

    let nextPrograms: GlobalProgram[] | null = null;
    let loadErrorMsg: string | null = null;

    try {
      if (programsRes.status !== "fulfilled" || !programsRes.value.ok) {
        throw new Error("program registry unavailable");
      }
      const body = (await programsRes.value.json()) as Partial<ProgramsResponse>;
      if (!Array.isArray(body.programs)) throw new Error("program registry unavailable");
      nextPrograms = body.programs;
      setRegistrySource(typeof body.source === "string" ? body.source : null);
    } catch {
      loadErrorMsg = "The global program registry could not be loaded.";
    }

    if (benchRes.status === "fulfilled" && benchRes.value.ok) {
      const body = (await benchRes.value.json().catch(() => null)) as CityBenchmarks | null;
      if (body && typeof body === "object" && body.cities && body.fx_rates) setBenchmarks(body);
    }

    setPrograms(nextPrograms ?? []);
    if (loadErrorMsg) setLoadError(loadErrorMsg);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const countries = useMemo(
    () => ["All", ...Array.from(new Set(programs.map((p) => p.country).filter(Boolean))).sort()],
    [programs],
  );
  const tiers = useMemo(
    () => ["All", ...Array.from(new Set(programs.map((p) => p.global_tier).filter(Boolean))).sort()],
    [programs],
  );

  const filteredPrograms = useMemo(
    () =>
      programs.filter((p) => {
        if (selectedCountry !== "All" && p.country !== selectedCountry) return false;
        if (selectedTier !== "All" && p.global_tier !== selectedTier) return false;
        if (stemOnly && !p.is_stem_designated) return false;
        return true;
      }),
    [programs, selectedCountry, selectedTier, stemOnly],
  );

  /**
   * Registry-wide rollups. These are aggregates over rows the engine already
   * returned — not a second source of truth — and the card says so.
   */
  const rollup = useMemo(() => {
    const probs = programs
      .map((p) => finiteOrNull(p.visa_survival_prob))
      .filter((n): n is number => n != null)
      .sort((a, b) => a - b);
    const median =
      probs.length === 0
        ? null
        : probs.length % 2 === 1
          ? probs[(probs.length - 1) / 2]
          : (probs[probs.length / 2 - 1] + probs[probs.length / 2]) / 2;

    const usdRate = finiteOrNull(benchmarks?.fx_rates?.USD_INR);
    const eurRate = finiteOrNull(benchmarks?.fx_rates?.EUR_INR);

    return { medianVisaSurvival: median, usdRate, eurRate, measured: probs.length };
  }, [programs, benchmarks]);

  const modelNpv = async (program: GlobalProgram) => {
    const key = PROGRAM_KEY(program);
    setNpv((prev) => ({ ...prev, [key]: { status: "loading" } }));

    const tuition = finiteOrNull(program.annual_tuition_usd);
    const living = finiteOrNull(program.living_cost_annual_usd);
    const salary = finiteOrNull(program.median_salary_usd_y1);

    // The request model requires all three. Refuse rather than substitute 0 —
    // a 0 tuition would read as a free degree and a 0 salary as a worthless one.
    if (tuition == null || living == null || salary == null) {
      setNpv((prev) => ({
        ...prev,
        [key]: {
          status: "unavailable",
          reason:
            "This program is missing tuition, living-cost, or starting-salary data, so the NPV model has no input to run on.",
        },
      }));
      return;
    }

    try {
      const res = await fetch("/api/v2/global/cross-border-npv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          university_name: program.university_name,
          country: program.country,
          city: program.city,
          is_stem_designated: program.is_stem_designated,
          annual_tuition_usd: tuition,
          living_cost_annual_usd: living,
          median_salary_usd_y1: salary,
          duration_years: 2.0,
        }),
      });
      const body = (await res.json().catch(() => null)) as
        | (Partial<CrossBorderNPV> & { reason?: string; error?: string })
        | null;

      if (!res.ok || !body || typeof body.npv_20y_inr !== "number") {
        setNpv((prev) => ({
          ...prev,
          [key]: {
            status: "unavailable",
            reason:
              (typeof body?.reason === "string" && body.reason) ||
              "The cross-border NPV engine did not return a result for this program.",
          },
        }));
        return;
      }
      setNpv((prev) => ({ ...prev, [key]: { status: "ready", data: body as CrossBorderNPV } }));
    } catch {
      setNpv((prev) => ({
        ...prev,
        [key]: {
          status: "unavailable",
          reason: "The cross-border NPV engine could not be reached. No estimate is shown in its place.",
        },
      }));
    }
  };

  const cityEntries = useMemo(
    () => Object.entries(benchmarks?.cities ?? {}),
    [benchmarks],
  );

  const clearFilters = () => {
    setSelectedCountry("All");
    setSelectedTier("All");
    setStemOnly(false);
  };

  return (
    <div className="page-shell">
      <div className="container-xl page-header">
        <PageHeader
          kicker="Cross-border actuarial valuation hub · Section 10"
          eyebrow={
            <span className="badge badge-rose">
              <Globe size={10} aria-hidden="true" />
              Engine-priced · 20-year NPV
            </span>
          }
          title="Global Degree Valuation & Visa Arbitrage"
          lead="Each programme below is priced by the server-side engine: 20-year cross-border net present value, STEM OPT H-1B retention probability, and city-level cost-of-living tax drag. Where a programme has not been valued, this page says so instead of estimating."
        >
          {/* Actuarial KPI ribbon — every figure is a live registry value or a
              median over registry rows. FX comes from the engine's own rate
              table, not a constant in this file. */}
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Registry rollup</span>
              <span className="num text-[11px] t-faint">
                {registrySource
                  ? registrySource.replace(/_/g, " ")
                  : isLoading
                    ? "loading"
                    : "no source reported"}
              </span>
            </div>
            <div className="panel-pad">
              {isLoading ? (
                <>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="metric-cell">
                        <Skeleton className="h-2.5 w-20" />
                        <Skeleton className="mt-2 h-7 w-24" />
                      </div>
                    ))}
                  </div>
                  <SkeletonStatus label="Loading the program registry" />
                </>
              ) : (
                <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
                  <Metric
                    label="Programs in registry"
                    value={programs.length}
                    format={(v) => String(v)}
                    caption="Rows returned by /global/programs"
                  />
                  <Metric
                    label="Median visa survival"
                    value={rollup.medianVisaSurvival}
                    format={(v) => pct(v, 1)}
                    caption={
                      rollup.measured > 0
                        ? `Median of ${rollup.measured} registry rows`
                        : "No row carries a survival rate"
                    }
                    tone={
                      rollup.medianVisaSurvival == null
                        ? "default"
                        : rollup.medianVisaSurvival >= 0.9
                          ? "good"
                          : rollup.medianVisaSurvival >= 0.6
                            ? "warn"
                            : "bad"
                    }
                  />
                  <Metric
                    label="USD → INR"
                    value={rollup.usdRate}
                    format={(v) => `₹${v.toFixed(2)}`}
                    caption="Engine FX table · /global/city-benchmarks"
                  />
                  <Metric
                    label="EUR → INR"
                    value={rollup.eurRate}
                    format={(v) => `₹${v.toFixed(2)}`}
                    caption="Engine FX table · /global/city-benchmarks"
                  />
                </div>
              )}
            </div>
          </div>
        </PageHeader>
      </div>

      <div className="container-xl pb-16">
        {/* Filter bar */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Filters</span>
            {(selectedCountry !== "All" || selectedTier !== "All" || stemOnly) && (
              <button type="button" onClick={clearFilters} className="btn-ghost">
                Clear all
              </button>
            )}
          </div>
          <div className="panel-pad space-y-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="metric-label mr-1">Country</span>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by country">
                {countries.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={selectedCountry === c}
                    onClick={() => setSelectedCountry(c)}
                    disabled={isLoading}
                    className={`domain-chip ${selectedCountry === c ? "selected" : ""}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="metric-label mr-1">Tier</span>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by global tier">
                {tiers.map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={selectedTier === t}
                    onClick={() => setSelectedTier(t)}
                    disabled={isLoading}
                    className={`domain-chip ${selectedTier === t ? "selected" : ""}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="stem"
                checked={stemOnly}
                onChange={(e) => setStemOnly(e.target.checked)}
                className="h-4 w-4 rounded border-line accent-[var(--accent)]"
              />
              <label htmlFor="stem" className="cursor-pointer text-[13px] t-muted">
                STEM OPT designated only
              </label>
            </div>

            {!isLoading && (
              <p className="num text-[11px] t-faint">
                {filteredPrograms.length} of {programs.length} programme
                {programs.length === 1 ? "" : "s"} shown
              </p>
            )}
          </div>
        </div>

        {/* Grid states: loading → error → empty → data */}
        {isLoading ? (
          <div className="mt-6">
            <SkeletonCards count={6} />
            <SkeletonStatus label="Loading global program registry" />
          </div>
        ) : loadError ? (
          <div className="panel mt-6">
            <div className="panel-head">
              <span className="panel-title">Registry unavailable</span>
            </div>
            <div className="panel-pad">
              <Notice tone="error" title="The registry could not be loaded">
                {loadError} Programmes are not substituted from a local list, because a list
                that is not the engine&apos;s registry would look priced when it is not.
              </Notice>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="btn-secondary mt-4"
              >
                <RefreshCw size={13} aria-hidden="true" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        ) : filteredPrograms.length === 0 ? (
          /* Same distinction as the marketplace: an empty registry is a fact
             about the data, an empty filter result is a fact about the query. */
          <div className="mt-6">
            <EmptyState
              icon={programs.length === 0 ? GlobeX : FilterX}
              title={
                programs.length === 0
                  ? "The program registry returned no programs"
                  : "No programs match these filters"
              }
              hint={
                programs.length === 0
                  ? "No global programme records are published yet. We would rather show this than display illustrative figures, which would be indistinguishable from real valuations."
                  : "Programmes exist in the registry, but none match the country, tier, and field you have selected."
              }
              action={
                programs.length > 0
                  ? { label: "Clear filters", onClick: clearFilters }
                  : { label: "Browse the program index", href: "/explore" }
              }
              secondaryAction={
                programs.length > 0
                  ? { label: "How we value degrees", href: "/methodology" }
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredPrograms.map((p) => {
              const key = PROGRAM_KEY(p);
              const state = npv[key]?.status ?? "idle";
              const result = npv[key]?.status === "ready" ? npv[key].data : null;
              const reason = npv[key]?.status === "unavailable" ? npv[key].reason : null;
              const visaProb = finiteOrNull(p.visa_survival_prob);
              // The engine falls back to a generic national index for a city it
              // has not indexed (nextgen_engine.py:769). Say so, because the
              // resulting NPV is then less precise than the number suggests.
              const cityIndexed = benchmarks ? Boolean(benchmarks.cities?.[p.city]) : null;

              return (
                <div key={key} className="panel flex flex-col">
                  <div className="panel-pad flex-1">
                    <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                      <span className="badge badge-blue">{p.global_tier}</span>
                      <span className={`num text-[11px] font-semibold ${visaTone(visaProb)}`}>
                        Visa survival{" "}
                        {visaProb == null ? (
                          <span className="num-na">{NO_DATA}</span>
                        ) : (
                          pct(visaProb, 0)
                        )}
                      </span>
                    </div>

                    <h3 className="text-[15px] font-bold leading-tight t-text">
                      {p.university_name}
                    </h3>
                    <p className="mt-0.5 text-[12px] t-muted">
                      {p.city}, {p.country}
                    </p>
                    <div
                      className="t-chip mt-2.5 rounded-lg border p-2 text-[12px] font-medium t-text"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      {p.degree_name} in {p.major}
                    </div>

                    {/* Registry facts only. No client-side FX, no client-side
                        tax, no client-side rent model — the card shows what was
                        ingested and nothing derived. */}
                    <div
                      className="mt-4 grid grid-cols-2 gap-3 border-t pt-3.5"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      <div className="metric-cell">
                        <span className="metric-label">Annual tuition · Y1</span>
                        <span className="num text-[13px] font-bold t-text">
                          {usd(finiteOrNull(p.annual_tuition_usd))}
                        </span>
                        <span className="num text-[10px] t-faint">
                          Living {usd(finiteOrNull(p.living_cost_annual_usd))}/yr
                        </span>
                      </div>
                      <div className="metric-cell">
                        <span className="metric-label">Median salary · Y1</span>
                        <span className="num text-[13px] font-bold text-sys-green">
                          {usd(finiteOrNull(p.median_salary_usd_y1))}
                        </span>
                        <span className="num text-[10px] t-faint">
                          Y5 {usd(finiteOrNull(p.median_salary_usd_y5))}
                        </span>
                      </div>
                    </div>

                    <dl
                      className="mt-3 space-y-1.5"
                    >
                      <div className="metric-cell-row">
                        <dt className="metric-label">Visa pathway</dt>
                        <dd className="num text-[11px] t-text">
                          {p.visa_type || <span className="num-na">{NO_DATA}</span>}
                        </dd>
                      </div>
                      <div className="metric-cell-row">
                        <dt className="metric-label">Effective tax rate</dt>
                        <dd className="num text-[11px] t-text">
                          {pct(finiteOrNull(p.effective_tax_rate), 1)}
                        </dd>
                      </div>
                    </dl>

                    {cityIndexed === false && (
                      <div className="mt-3">
                        <Notice tone="warn" icon={AlertTriangle}>
                          {p.city} is not in the engine&apos;s city cost-of-living index, so the
                          model applies a generic national tax and rent assumption.
                        </Notice>
                      </div>
                    )}

                    {state === "loading" && (
                      <div className="mt-3 space-y-2" role="status" aria-live="polite">
                        <Skeleton className="h-2.5 w-32" />
                        <Skeleton className="h-2.5 w-full" />
                        <Skeleton className="h-2.5 w-2/3" />
                        <span className="sr-only">Running the NPV model…</span>
                      </div>
                    )}

                    {state === "ready" && result && (
                      <div
                        className="t-elevated mt-3.5 rounded-lg border p-3.5"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <span className="metric-label flex items-center gap-1.5">
                          <Calculator size={12} style={{ color: "var(--accent)" }} aria-hidden="true" />
                          20-year engine NPV
                        </span>
                        <dl className="mt-2.5 space-y-1.5">
                          <div className="metric-cell-row">
                            <dt className="t-muted text-[11px]">Total investment</dt>
                            <dd className="num text-[12px] t-text">
                              {inrLakhs(result.total_investment_inr)}
                            </dd>
                          </div>
                          <div className="metric-cell-row">
                            <dt className="t-muted text-[11px]">Net annual savings · Y1</dt>
                            <dd className="num text-[12px] t-text">
                              {inrLakhs(result.net_annual_savings_y1_inr)}
                            </dd>
                          </div>
                          <div className="metric-cell-row">
                            <dt className="t-muted text-[11px]">Tax drag applied</dt>
                            <dd className="num text-[12px] t-text">
                              <span className="num-1">{result.effective_tax_drag_pct}</span>%
                            </dd>
                          </div>
                          <div
                            className="metric-cell-row border-t pt-1.5"
                            style={{ borderColor: "var(--border-subtle)" }}
                          >
                            <dt className="text-[11px] font-semibold t-text">NPV · 20y discounted</dt>
                            <dd className="num text-[13px] font-bold t-text">
                              {inrLakhs(result.npv_20y_inr)}
                            </dd>
                          </div>
                          <div className="metric-cell-row">
                            <dt className="metric-label">ROI multiple</dt>
                            <dd className="num text-[12px] t-text">
                              <span className="num-1">{result.roi_multiple}</span>×
                            </dd>
                          </div>
                        </dl>
                        <p className="body-p mt-2.5 italic">{result.verdict}</p>
                      </div>
                    )}

                    {state === "unavailable" && reason && (
                      <UnmeasuredNote className="mt-3.5" what="20-year NPV">
                        {reason}
                      </UnmeasuredNote>
                    )}
                  </div>

                  <div
                    className="flex flex-wrap items-center justify-between gap-3 border-t px-[22px] py-3"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <span className="num text-[11px] t-faint">
                      {state === "loading"
                        ? "Running model…"
                        : `Visa: ${p.visa_type || NO_DATA}`}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {p.website_url && (
                        <a
                          href={p.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-ghost num text-[11px]"
                        >
                          <span>Source</span>
                          <ExternalLink size={12} aria-hidden="true" />
                        </a>
                      )}
                      <Link
                        href={`/analyze?country=${encodeURIComponent(p.country)}`}
                        className="btn-ghost num text-[11px]"
                      >
                        <span>Analyze</span>
                        <ArrowRight size={12} aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => void modelNpv(p)}
                        disabled={state === "loading"}
                        className="btn-primary"
                      >
                        {state === "loading" ? (
                          <span className="spinner" aria-hidden="true" />
                        ) : (
                          <Calculator size={13} aria-hidden="true" />
                        )}
                        <span>{state === "ready" ? "Re-run NPV" : "Model NPV"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Spatial cost-of-living index — published values only. The previous
            copy of this panel asserted a "300% higher capital accumulation
            rate" from a worked example nobody could audit. */}
        <div className="panel mt-12">
          <div className="panel-head">
            <span className="panel-title flex items-center gap-2">
              <Calculator size={12} aria-hidden="true" />
              City cost-of-living index applied by the NPV engine
            </span>
          </div>
          <div className="panel-pad">
            <p className="body-p">
              The cross-border NPV model draws a city&apos;s effective tax rate, median rent and
              residual living cost from this index. A destination absent from it falls back to a
              generic national assumption, which is flagged on the programme card above.
            </p>

            {!benchmarks ? (
              isLoading ? (
                <div className="mt-4 space-y-2" role="status" aria-live="polite">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-3 w-2/3" />
                  <span className="sr-only">Loading the city index…</span>
                </div>
              ) : (
                <UnmeasuredNote
                  className="mt-4"
                  what="City cost-of-living index"
                >
                  The engine&apos;s city benchmarks endpoint did not return an index, so no tax
                  rate, rent or living figure is shown. The NPV cards above fall back to a
                  generic national assumption for any city it cannot price.
                </UnmeasuredNote>
              )
            ) : cityEntries.length === 0 ? (
              <EmptyState
                variant="bare"
                title="The city index is empty"
                hint="The engine returned the endpoint but no city rows, so the tax and rent assumptions behind the NPV figures above cannot be shown."
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="mt-4 hidden overflow-x-auto md:block">
                  <table className="data-table w-full">
                    <thead>
                      <tr>
                        <th className="text-left">City</th>
                        <th className="text-left">Tax rate</th>
                        <th className="text-left">Median rent / mo</th>
                        <th className="text-left">Living / mo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cityEntries.map(([city, entry]) => (
                        <tr key={city}>
                          <td className="font-semibold t-text">{city}</td>
                          <td className="num num-1 t-muted">
                            {(entry.tax_rate * 100).toFixed(1)}%
                          </td>
                          <td className="num t-muted">
                            ${entry.monthly_rent.toLocaleString()}
                          </td>
                          <td className="num t-muted">
                            ${entry.monthly_living.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="mt-4 grid grid-cols-1 gap-2.5 md:hidden">
                  {cityEntries.map(([city, entry]) => (
                    <div
                      key={city}
                      className="t-chip rounded-lg border p-3"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      <div className="mb-2 text-[13px] font-semibold t-text">{city}</div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="metric-cell">
                          <span className="metric-label">Tax</span>
                          <span className="num text-[12px] t-text">
                            {(entry.tax_rate * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="metric-cell">
                          <span className="metric-label">Rent</span>
                          <span className="num text-[12px] t-text">
                            ${entry.monthly_rent.toLocaleString()}
                          </span>
                        </div>
                        <div className="metric-cell">
                          <span className="metric-label">Living</span>
                          <span className="num text-[12px] t-text">
                            ${entry.monthly_living.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <Notice tone="info" className="mt-5" icon={Info}>
              Visa survival is the engine&apos;s H-1B lottery math (1 &minus; (1 &minus; 0.25)ⁿ
              over the OPT attempts a programme buys), not an observed approval rate. Treat it
              as a structural hazard, not a promise.
            </Notice>
          </div>
        </div>

        <div className="mt-10">
          <SectionHeader
            kicker="How to read these cards"
            title="Nothing on this page is computed in the browser"
            lead="Cost, salary, FX, tax drag and the visa hazard all come from the engine's own registry and model. A figure the engine did not return is drawn as a dash."
          />
        </div>
      </div>
    </div>
  );
}
