"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, GraduationCap, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Notice } from "@/components/Notice";

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
    <div className="page-shell">
      <div className="container-xl page-header">
        <PageHeader
          kicker="Admissions odds"
          eyebrow={
            <span className="badge badge-purple">
              <GraduationCap size={10} aria-hidden="true" />
              Verified cutoff probabilities
            </span>
          }
          title="Where this rank actually lands"
          lead="Probabilities use closing ranks stored in the database, with the category multiplier applied at calculation time. A row marked unverified was imported without a source URL. It is not a published cutoff."
        />
      </div>

      <main className="container-xl pb-16">
        <form
          className="panel panel-pad grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void evaluate();
          }}
        >
          <label className="text-xs font-medium t-muted block">
            <span className="mb-1.5 block t-text font-semibold">Expected rank</span>
            <input
              className="form-input w-full"
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              inputMode="numeric"
              required
            />
          </label>
          <label className="text-xs font-medium t-muted block">
            <span className="mb-1.5 block t-text font-semibold">Exam</span>
            <select
              className="form-input w-full"
              value={exam}
              onChange={(e) => setExam(e.target.value)}
            >
              {EXAMS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium t-muted block">
            <span className="mb-1.5 block t-text font-semibold">Category</span>
            <select
              className="form-input w-full"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium t-muted block">
            <span className="mb-1.5 block t-text font-semibold">Home state</span>
            <input
              className="form-input w-full"
              value={homeState}
              onChange={(e) => setHomeState(e.target.value)}
              required
            />
          </label>
          <label className="text-xs font-medium t-muted block sm:col-span-2">
            <span className="mb-1.5 block t-text font-semibold">Budget (₹ INR)</span>
            <input
              className="form-input w-full"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              inputMode="numeric"
              required
            />
          </label>
          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              disabled={running}
              className="btn-primary"
            >
              {running && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {running ? "Computing…" : "Compute odds"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-6">
            <Notice tone="error">{error}</Notice>
          </div>
        )}

        {result?.provenance && (
          <div className="mt-6 p-4 rounded-xl t-chip border t-border flex items-center justify-between text-xs t-muted">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>
                <strong>{result.provenance.verified_rows}</strong> verified rows,{" "}
                <strong>{result.provenance.unverified_rows}</strong> unverified. {result.provenance.note}
              </span>
            </span>
          </div>
        )}

        {result?.tiers &&
          TIER_ORDER.map((key) => {
            const rows = result.tiers?.[key] ?? [];
            if (rows.length === 0) return null;
            return (
              <section key={key} className="mt-8 panel">
                <div className="panel-head flex items-center justify-between">
                  <span className="panel-title">{TIER_LABEL[key]} Cohorts</span>
                  <span className="badge badge-teal font-mono">{rows.length} matches</span>
                </div>
                <ul className="divide-y t-divider">
                  {rows.map((row) => (
                    <li
                      key={`${row.college}-${row.degree}-${row.exam}`}
                      className="px-5 py-3.5 text-sm hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-semibold t-text">{row.college}</span>
                        <span className="font-mono font-bold text-accent">
                          {row.admission_probability_pct}%
                        </span>
                      </div>
                      <p className="t-muted text-xs mt-0.5">
                        {row.degree} · {row.exam}
                        {row.vintage_year ? ` · ${row.vintage_year}` : ""}
                      </p>
                      <p className="mt-1 text-[11px] t-faint font-mono">
                        {row.is_verified ? "Verified Cutoff" : "Unverified — imported, no source URL"}
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
