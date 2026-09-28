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
  Loader2,
  CircleAlert,
  ExternalLink,
  GlobeX,
  FilterX,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { NO_DATA, finiteOrNull } from "@/lib/mock-data";

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

function visaTone(prob: number | null): string {
  if (prob == null) return "text-slate-400";
  if (prob >= 0.9) return "text-emerald-700";
  if (prob >= 0.6) return "text-amber-700";
  return "text-rose-700";
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Section */}
        <div className="border-b border-slate-200 pb-8 mb-10">
          <div className="flex items-center gap-2 text-rose-600 text-xs uppercase tracking-widest font-mono font-semibold mb-2">
            <Globe className="w-4 h-4" />
            <span>Cross-Border Actuarial Valuation Hub · Section 10 Specification</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
            Global Degree Valuation & Visa Arbitrage
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-3xl leading-relaxed">
            Each card below is priced by the server-side engine: 20-year cross-border Net Present
            Value, STEM OPT H-1B retention probability, and city-level cost-of-living tax drag.
            Where a program has not been valued, this page says so instead of estimating.
          </p>

          {/* Actuarial KPI Ribbon — every figure is a live registry value or a
              median over registry rows. FX comes from the engine's own rate
              table, not a constant in this file. */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
              <span className="text-xs font-mono text-slate-500 uppercase">Programs in registry</span>
              <div className="text-2xl font-bold text-slate-950 mt-1">
                {isLoading ? NO_DATA : programs.length}
              </div>
              <span className="text-[11px] text-slate-400">
                {registrySource ? `Source: ${registrySource.replace(/_/g, " ")}` : "Awaiting registry"}
              </span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
              <span className="text-xs font-mono text-slate-500 uppercase">Median visa survival</span>
              <div className={`text-2xl font-bold mt-1 ${visaTone(rollup.medianVisaSurvival)}`}>
                {isLoading ? NO_DATA : rollup.medianVisaSurvival == null ? NO_DATA : pct(rollup.medianVisaSurvival, 1)}
              </div>
              <span className="text-[11px] text-slate-400">
                {rollup.measured > 0 ? `Median of ${rollup.measured} registry rows` : "No visa data loaded"}
              </span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
              <span className="text-xs font-mono text-slate-500 uppercase">USD → INR</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                {isLoading ? NO_DATA : rollup.usdRate == null ? NO_DATA : `₹${rollup.usdRate.toFixed(2)}`}
              </div>
              <span className="text-[11px] text-slate-400">Engine FX table · /global/city-benchmarks</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
              <span className="text-xs font-mono text-slate-500 uppercase">EUR → INR</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                {isLoading ? NO_DATA : rollup.eurRate == null ? NO_DATA : `₹${rollup.eurRate.toFixed(2)}`}
              </div>
              <span className="text-[11px] text-slate-400">Engine FX table · /global/city-benchmarks</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-mono text-slate-500 uppercase">Country:</label>
            {countries.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCountry(c)}
                disabled={isLoading}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-40 ${
                  selectedCountry === c
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-mono text-slate-500 uppercase">Tier:</label>
            {tiers.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTier(t)}
                disabled={isLoading}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-40 ${
                  selectedTier === t
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="stem"
              checked={stemOnly}
              onChange={(e) => setStemOnly(e.target.checked)}
              className="rounded bg-white border-slate-300 text-slate-950 focus:ring-0"
            />
            <label htmlFor="stem" className="text-xs font-mono text-slate-600 cursor-pointer">
              STEM OPT Designated Only
            </label>
          </div>
        </div>

        {/* Grid states: loading → error → empty → data */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-3" />
            <p className="text-sm font-mono">Loading global program registry…</p>
          </div>
        ) : loadError ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
            <CircleAlert className="w-6 h-6 text-rose-600 mx-auto mb-3" />
            <p className="text-sm text-slate-700">{loadError}</p>
            <p className="text-xs text-slate-500 mt-1">
              Programs are not substituted from a local list, because a list that is not the engine&apos;s
              registry would look priced when it is not.
            </p>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="mt-5 inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl px-4 py-2.5 text-xs font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : filteredPrograms.length === 0 ? (
          /* Same distinction as the marketplace: an empty registry is a fact
             about the data, an empty filter result is a fact about the query. */
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
                ? {
                    label: "Clear filters",
                    onClick: () => {
                      setSelectedCountry("All");
                      setSelectedTier("All");
                      setStemOnly(false);
                    },
                  }
                : { label: "Browse the program index", href: "/explore" }
            }
            secondaryAction={programs.length > 0 ? { label: "How we value degrees", href: "/methodology" } : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map((p) => {
              const key = PROGRAM_KEY(p);
              const state = npv[key]?.status ?? "idle";
              const result = npv[key]?.status === "ready" ? npv[key].data : null;
              const reason = npv[key]?.status === "unavailable" ? npv[key].reason : null;
              // The engine falls back to a generic national index for a city it
                  // has not indexed (nextgen_engine.py:769). Say so, because the
                  // resulting NPV is then less precise than the number suggests.
              const cityIndexed = benchmarks ? Boolean(benchmarks.cities?.[p.city]) : null;

              return (
                <div
                  key={key}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {p.global_tier}
                      </span>
                      <span className={`text-[11px] font-mono font-semibold ${visaTone(finiteOrNull(p.visa_survival_prob))}`}>
                        {finiteOrNull(p.visa_survival_prob) == null
                          ? "Visa survival: —"
                          : `Visa survival: ${pct(finiteOrNull(p.visa_survival_prob), 0)}`}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-950 leading-tight">{p.university_name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{p.city}, {p.country}</p>
                    <div className="text-xs text-slate-700 font-medium mt-2 bg-slate-50 border border-slate-100 p-2 rounded-xl">
                      {p.degree_name} in {p.major}
                    </div>

                    {/* Registry facts only. No client-side FX, no client-side
                        tax, no client-side rent model — the card shows what was
                        ingested and nothing derived. */}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
                      <div>
                        <span className="text-slate-400 font-mono text-[11px]">Annual Tuition (Y1):</span>
                        <div className="text-slate-900 font-bold font-mono">{usd(finiteOrNull(p.annual_tuition_usd))}</div>
                        <span className="text-[10px] text-slate-500">Living: {usd(finiteOrNull(p.living_cost_annual_usd))}/yr</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-mono text-[11px]">Median Salary (Y1):</span>
                        <div className="text-emerald-700 font-bold font-mono">{usd(finiteOrNull(p.median_salary_usd_y1))}</div>
                        <span className="text-[10px] text-slate-500">Y5: {usd(finiteOrNull(p.median_salary_usd_y5))}</span>
                      </div>
                    </div>

                    <div className="mt-3 bg-slate-50 border border-slate-200 p-3 rounded-xl text-[11px] space-y-1.5">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Visa pathway:</span>
                        <span className="text-slate-950 font-semibold text-right">{p.visa_type || NO_DATA}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Effective tax rate:</span>
                        <span className="font-mono text-slate-700">
                          {finiteOrNull(p.effective_tax_rate) == null ? NO_DATA : pct(finiteOrNull(p.effective_tax_rate), 1)}
                        </span>
                      </div>
                      {cityIndexed === false && (
                        <div className="flex items-start gap-1.5 text-amber-700">
                          <AlertTriangle className="w-3 h-3 mt-px shrink-0" />
                          <span>
                            {p.city} is not in the engine&apos;s city cost-of-living index, so the model applies a
                            generic national tax and rent assumption.
                          </span>
                        </div>
                      )}
                    </div>

                    {state === "ready" && result && (
                      <div className="mt-3 border border-slate-300 bg-white p-3 rounded-xl text-[11px] space-y-1.5">
                        <div className="flex items-center gap-1.5 text-slate-950 font-bold">
                          <Calculator className="w-3.5 h-3.5 text-rose-600" />
                          <span>20-Year Engine NPV</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Total investment</span>
                          <span className="font-mono">{inrLakhs(result.total_investment_inr)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Net annual savings (Y1)</span>
                          <span className="font-mono">{inrLakhs(result.net_annual_savings_y1_inr)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Tax drag applied</span>
                          <span className="font-mono">{result.effective_tax_drag_pct}%</span>
                        </div>
                        <div className="flex justify-between text-slate-950 font-bold border-t border-slate-200 pt-1.5">
                          <span>NPV (20y, discounted)</span>
                          <span className="font-mono">{inrLakhs(result.npv_20y_inr)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>ROI multiple</span>
                          <span className="font-mono">{result.roi_multiple}×</span>
                        </div>
                        <div className="pt-1 text-slate-700 italic">{result.verdict}</div>
                      </div>
                    )}

                    {state === "unavailable" && reason && (
                      <div className="mt-3 border border-amber-200 bg-amber-50 text-amber-900 p-3 rounded-xl text-[11px] leading-relaxed">
                        <strong className="block mb-0.5">No valuation available</strong>
                        {reason}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-mono text-slate-500">
                      {state === "loading" ? "Running model…" : `Visa: ${p.visa_type || NO_DATA}`}
                    </span>
                    <div className="flex items-center gap-3">
                      {p.website_url && (
                        <a
                          href={p.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1"
                        >
                          <span>Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <Link
                        href={`/analyze?country=${encodeURIComponent(p.country)}`}
                        className="text-xs text-slate-500 hover:text-slate-950 hover:underline font-semibold flex items-center gap-1"
                      >
                        <span>Analyze</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => void modelNpv(p)}
                        disabled={state === "loading"}
                        className="bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        {state === "loading" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Calculator className="w-3.5 h-3.5" />
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
        <div className="mt-12 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-rose-600" />
            <span>City Cost-of-Living Index applied by the NPV engine</span>
          </h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            The cross-border NPV model draws a city&apos;s effective tax rate, median rent and residual
            living cost from this index. A destination absent from it falls back to a generic national
            assumption, which is flagged on the program card above.
          </p>

          {!benchmarks ? (
            <p className="text-xs text-slate-400 font-mono mt-4">
              {isLoading ? "Loading city index…" : "City cost-of-living index unavailable."}
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-400 font-mono uppercase text-[10px]">
                    <th className="py-2 pr-4 font-semibold">City</th>
                    <th className="py-2 pr-4 font-semibold">Tax rate</th>
                    <th className="py-2 pr-4 font-semibold">Median rent / mo</th>
                    <th className="py-2 pr-4 font-semibold">Living / mo</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(benchmarks.cities ?? {}).map(([city, entry]) => (
                    <tr key={city} className="border-t border-slate-100">
                      <td className="py-2 pr-4 font-semibold text-slate-900">{city}</td>
                      <td className="py-2 pr-4 font-mono text-slate-700">{(entry.tax_rate * 100).toFixed(1)}%</td>
                      <td className="py-2 pr-4 font-mono text-slate-700">${entry.monthly_rent.toLocaleString()}</td>
                      <td className="py-2 pr-4 font-mono text-slate-700">${entry.monthly_living.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-[11px] text-slate-500 mt-4 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 mt-px shrink-0 text-slate-400" />
            <span>
              Visa survival is the engine&apos;s H-1B lottery math (1 − (1 − 0.25)ⁿ over the OPT attempts a
              program buys), not an observed approval rate. Treat it as a structural hazard, not a promise.
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
