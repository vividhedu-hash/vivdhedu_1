"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

/**
 * Profession AI-exposure matrix.
 *
 * The numbers come from `PROFESSIONS_SAFETY_MATRIX` in the backend — a
 * hand-calibrated table, not a labour-force series. The page says so. It does
 * not turn a missing response into a score.
 */

type Profession = {
  safety_score?: number;
  safety_label?: string;
  base_disruption_pct?: number;
  human_resilience_pct?: number;
  "5y_layoff_risk_pct"?: number;
  "10y_layoff_risk_pct"?: number;
  vulnerable_tasks?: string[];
  resilient_skills?: string[];
  ai_strategy?: string;
};

type MatrixResponse = {
  matrix?: Record<string, Profession>;
  total_professions?: number;
  horizon?: string;
  error?: string;
  reason?: string;
  _source?: string;
};

export default function JobSecurityPage() {
  const [body, setBody] = useState<MatrixResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/ai/professions-safety")
      .then(async (res) => {
        const json = (await res.json()) as MatrixResponse;
        if (!res.ok) throw new Error(json.reason || "The profession matrix did not respond.");
        return json;
      })
      .then((json) => {
        if (!cancelled) setBody(json);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    const matrix = body?.matrix ?? {};
    return Object.entries(matrix).sort(
      (a, b) => (b[1].safety_score ?? -1) - (a[1].safety_score ?? -1),
    );
  }, [body]);

  const current = selected ? body?.matrix?.[selected] : undefined;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">AI exposure</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">How exposed is this kind of work?</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          Scores are from a hand-calibrated profession matrix inside the model
          {body?.horizon ? ` (${body.horizon})` : ""}. They are not measured layoff rates,
          and a profession that is missing from the matrix is not given a borrowed score here.
        </p>

        {loading && (
          <p className="mt-8 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading the profession matrix…
          </p>
        )}

        {error && (
          <div className="mt-8 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">The matrix is not available.</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <p className="mt-8 text-sm text-slate-600">The model returned no professions.</p>
        )}

        {rows.length > 0 && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Profession</th>
                  <th className="px-4 py-3 font-medium">Safety score</th>
                  <th className="px-4 py-3 font-medium">Label</th>
                  <th className="px-4 py-3 font-medium">10-year layoff figure</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([name, profession]) => (
                  <tr
                    key={name}
                    className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                    onClick={() => setSelected(name)}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{name}</td>
                    <td className="px-4 py-3 font-mono">{profession.safety_score ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{profession.safety_label ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {profession["10y_layoff_risk_pct"] == null ? "—" : `${profession["10y_layoff_risk_pct"]}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selected && current && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">{selected}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{current.ai_strategy}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tasks the matrix marks as exposed</h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
                  {(current.vulnerable_tasks ?? []).map((task) => (
                    <li key={task}>{task}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Skills the matrix marks as resilient</h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
                  {(current.resilient_skills ?? []).map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
