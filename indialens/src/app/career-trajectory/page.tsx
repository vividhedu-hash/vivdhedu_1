"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";

/**
 * Career-state projection.
 *
 * The page shows the transition matrix and the year-by-year distribution the
 * Markov model actually returns. It does not collapse that into "you will be
 * a Senior in year 10". A salary figure appears only when the student supplies
 * a first-year salary; the model knows multipliers, not salaries.
 */

type StatesResponse = {
  states?: string[];
  fields?: { key: string; label: string }[];
  tiers?: string[];
  field_fallback_note?: string;
  error?: string;
  _source?: string;
  reason?: string;
};

type Trajectory = {
  field_label?: string;
  field_fallback?: boolean;
  field_fallback_note?: string | null;
  start_state?: string;
  horizon_years?: number;
  states?: string[];
  transition_matrix?: { rows?: Array<Record<string, number | string | null>>; note?: string };
  distribution_at_horizon?: Record<string, number | null>;
  exit_risk_at_horizon?: number | null;
  exit_risk_note?: string;
  agreement?: { in_agreement?: boolean; note?: string | null; tvd?: number | null } | null;
  error?: string;
  _source?: string;
  reason?: string;
  detail?: { message?: string } | string;
};

function pct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.round(value * 1000) / 10}%`;
}

export default function CareerTrajectoryPage() {
  const [catalog, setCatalog] = useState<StatesResponse | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const [field, setField] = useState("engineering-cs");
  const [tier, setTier] = useState("2");
  const [start, setStart] = useState("Fresher");
  const [horizon, setHorizon] = useState(10);
  const [salary, setSalary] = useState("");
  const [monteCarlo, setMonteCarlo] = useState(false);

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Trajectory | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v2/career/states")
      .then(async (res) => {
        const body = (await res.json()) as StatesResponse;
        if (!res.ok) throw new Error(body.reason || "The career model did not respond.");
        return body;
      })
      .then((body) => {
        if (cancelled) return;
        setCatalog(body);
        if (body.fields?.[0]) setField(body.fields[0].key);
        if (body.states?.includes("Fresher")) setStart("Fresher");
        else if (body.states?.[0]) setStart(body.states[0]);
      })
      .catch((err: Error) => {
        if (!cancelled) setCatalogError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingCatalog(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function project() {
    setRunning(true);
    setRunError(null);
    setResult(null);
    const salaryNumber = salary.trim() ? Number(salary.replace(/,/g, "")) : null;
    try {
      const res = await fetch("/api/v2/career/trajectory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field,
          tier,
          start_state: start,
          horizon_years: horizon,
          base_salary_y1_inr: salaryNumber && salaryNumber > 0 ? Math.round(salaryNumber) : null,
          include_monte_carlo: monteCarlo,
        }),
      });
      const body = (await res.json()) as Trajectory;
      if (!res.ok) {
        const detail = typeof body.detail === "string" ? body.detail : body.reason;
        throw new Error(detail || "The projection did not run.");
      }
      setResult(body);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "The projection did not run.");
    } finally {
      setRunning(false);
    }
  }

  const states = catalog?.states ?? [];
  const horizonDist = result?.distribution_at_horizon ?? {};

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Career states</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Where a career can go from here</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          This is an 8-state Markov model. It returns the probability of each state at each year,
          and the annual transition matrix those probabilities come from. It is not a prediction
          that you will hold a particular title.
        </p>

        {loadingCatalog && (
          <p className="mt-8 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading the model&apos;s state list…
          </p>
        )}

        {catalogError && (
          <div className="mt-8 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">The career model is not available.</p>
              <p className="mt-1">{catalogError}</p>
            </div>
          </div>
        )}

        {catalog && states.length === 0 && (
          <p className="mt-8 text-sm text-slate-600">The model published an empty state list, so there is nothing to project.</p>
        )}

        {catalog && states.length > 0 && (
          <form
            className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              void project();
            }}
          >
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Field</span>
              <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={field} onChange={(e) => setField(e.target.value)}>
                {(catalog.fields ?? []).map((item) => (
                  <option key={item.key} value={item.key}>{item.label}</option>
                ))}
                <option value="default">Other — cross-discipline average</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Starting state</span>
              <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={start} onChange={(e) => setStart(e.target.value)}>
                {states.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">College tier (changes speed only)</span>
              <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={tier} onChange={(e) => setTier(e.target.value)}>
                {(catalog.tiers ?? ["1", "2", "3"]).map((item) => (
                  <option key={item} value={item}>Tier {item}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Horizon (years)</span>
              <input
                type="number"
                min={1}
                max={40}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-slate-700">First-year salary, INR (optional)</span>
              <input
                inputMode="numeric"
                placeholder="Leave blank — the model will not invent a salary"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
              <input type="checkbox" checked={monteCarlo} onChange={(e) => setMonteCarlo(e.target.checked)} />
              Also run the sampled estimate (slower). The exact distribution is always shown.
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={running}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {running && <Loader2 className="h-4 w-4 animate-spin" />}
                {running ? "Projecting…" : "Project"}
              </button>
            </div>
          </form>
        )}

        {runError && (
          <div className="mt-6 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{runError}</p>
          </div>
        )}

        {result && (
          <section className="mt-8 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Distribution at year {result.horizon_years}, starting from {result.start_state}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{result.field_label}</p>
              {result.field_fallback && result.field_fallback_note && (
                <p className="mt-2 text-sm text-amber-800">{result.field_fallback_note}</p>
              )}
            </div>

            <ul className="space-y-2">
              {Object.entries(horizonDist).map(([state, share]) => (
                <li key={state} className="grid grid-cols-[8rem_1fr_4rem] items-center gap-3 text-sm">
                  <span className="text-slate-700">{state}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <span
                      className="block h-full rounded-full bg-slate-800"
                      style={{ width: `${Math.max(0, Math.min(100, (share ?? 0) * 100))}%` }}
                    />
                  </span>
                  <span className="text-right font-mono text-slate-600">{pct(share)}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-slate-600">
              Exit share at the horizon: {pct(result.exit_risk_at_horizon)}. {result.exit_risk_note}
            </p>
            {result.agreement?.note && (
              <p className="text-sm text-amber-800">{result.agreement.note}</p>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <p className="border-b border-slate-100 px-4 py-3 text-sm text-slate-600">
                {result.transition_matrix?.note}
              </p>
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500">
                    <th className="px-3 py-2 font-medium">From</th>
                    {(result.states ?? []).map((state) => (
                      <th key={state} className="px-3 py-2 font-medium">{state}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(result.transition_matrix?.rows ?? []).map((row) => (
                    <tr key={String(row.from_state)} className="border-t border-slate-100">
                      <th className="px-3 py-2 font-medium text-slate-800">{row.from_state}</th>
                      {(result.states ?? []).map((state) => (
                        <td key={state} className="px-3 py-2 font-mono text-slate-600">
                          {pct(typeof row[state] === "number" ? row[state] : null)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
