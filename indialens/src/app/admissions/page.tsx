"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

/**
 * Admissions odds from the cutoffs table.
 *
 * Every row carries is_verified. An unverified rank is shown as imported,
 * not as a published cutoff. If the table cannot be read, the page says so
 * and does not draw a matrix from anywhere else.
 */

type Entry = {
  college: string;
  degree: string;
  exam: string;
  admission_probability_pct: number;
  z_score: number;
  tier_badge?: string;
  is_verified?: boolean;
  vintage_year?: number | null;
  source_url?: string | null;
  pruning_reason?: string;
};

type Portfolio = {
  cutoff_data?: string;
  provenance?: { verified_rows: number; unverified_rows: number; note: string };
  portfolio_summary?: Record<string, number>;
  tiers?: Record<string, Entry[]>;
  detail?: { message?: string } | string;
  message?: string;
};

const EXAMS = ["JEE Main", "JEE Advanced", "NEET", "BITSAT", "CUET", "CLAT", "MHT-CET", "KCET"];
const CATEGORIES = ["General", "EWS", "OBC-NCL", "SC", "ST", "PwD"];
const TIER_ORDER = ["safety", "target", "reach", "hidden_gems", "pruned"] as const;
const TIER_LABEL: Record<string, string> = {
  safety: "Safety",
  target: "Target",
  reach: "Reach",
  hidden_gems: "Hidden gem",
  pruned: "Pruned",
};

export default function AdmissionsPage() {
  const [rank, setRank] = useState("15000");
  const [exam, setExam] = useState("JEE Main");
  const [category, setCategory] = useState("General");
  const [homeState, setHomeState] = useState("Maharashtra");
  const [budget, setBudget] = useState("2000000");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Portfolio | null>(null);

  async function evaluate() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/v2/admissions/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_rank: Number(rank),
          exam_name: exam,
          category,
          home_state: homeState,
          max_budget_inr: Number(budget),
        }),
      });
      const body = (await response.json()) as Portfolio;
      if (!response.ok) {
        const detail = typeof body.detail === "string" ? body.detail : body.detail?.message;
        throw new Error(detail || body.message || "No portfolio was computed.");
      }
      setResult(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No portfolio was computed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="min-h-screen t-bg text-slate-900">
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Admissions odds</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Where this rank actually lands</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          Probabilities use closing ranks stored in the database, with the category multiplier
          applied at calculation time. A row marked unverified was imported without a source URL.
          It is not a published cutoff.
        </p>

        <form
          className="mt-8 grid gap-4 rounded-2xl border t-border t-surface p-5 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void evaluate();
          }}
        >
          <label className="text-sm">
            <span className="mb-1 block font-medium">Expected rank</span>
            <input className="w-full rounded-lg border t-border px-3 py-2" value={rank} onChange={(e) => setRank(e.target.value)} inputMode="numeric" required />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Exam</span>
            <select className="w-full rounded-lg border t-border px-3 py-2" value={exam} onChange={(e) => setExam(e.target.value)}>
              {EXAMS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Category</span>
            <select className="w-full rounded-lg border t-border px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Home state</span>
            <input className="w-full rounded-lg border t-border px-3 py-2" value={homeState} onChange={(e) => setHomeState(e.target.value)} required />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-medium">Budget, INR</span>
            <input className="w-full rounded-lg border t-border px-3 py-2" value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="numeric" required />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" disabled={running} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {running && <Loader2 className="h-4 w-4 animate-spin" />}
              {running ? "Computing…" : "Compute odds"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-6 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {result?.provenance && (
          <p className="mt-6 text-sm text-slate-600">
            {result.provenance.verified_rows} verified, {result.provenance.unverified_rows} unverified. {result.provenance.note}
          </p>
        )}

        {result?.tiers && TIER_ORDER.map((key) => {
          const rows = result.tiers?.[key] ?? [];
          if (rows.length === 0) return null;
          return (
            <section key={key} className="mt-6">
              <h2 className="text-lg font-semibold text-slate-950">{TIER_LABEL[key]} ({rows.length})</h2>
              <ul className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border t-border t-surface">
                {rows.map((row) => (
                  <li key={`${row.college}-${row.degree}-${row.exam}`} className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium text-slate-900">{row.college}</span>
                      <span className="font-mono text-slate-700">{row.admission_probability_pct}%</span>
                    </div>
                    <p className="text-slate-600">{row.degree} · {row.exam}{row.vintage_year ? ` · ${row.vintage_year}` : ""}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.is_verified ? "Verified" : "Unverified — imported, no source URL"}
                      {row.tier_badge ? ` · ${row.tier_badge}` : ""}
                      {row.pruning_reason ? ` · ${row.pruning_reason}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </main>
    </div>
  );
}
