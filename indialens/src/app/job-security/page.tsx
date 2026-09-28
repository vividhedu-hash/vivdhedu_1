"use client";

/**
 * /job-security — "is this career safe in 2035?"
 *
 * Placement decision: a standalone page rather than a block on /explore or
 * /college/[id]. This question is asked BEFORE a student has a program, not
 * after — it is a function of a field, not of a program record, so keying it to
 * a single college would answer a question nobody asked. It also needs room
 * neither of those pages has: a 12-row comparison matrix, a task-level
 * breakdown, and a free-text profession probe.
 *
 * What this page will NOT do: present the score as a measured outcome. The
 * matrix in `ml/nextgen_engine.py` is a hand-curated set of priors, and the
 * on-the-spot evaluator is keyword matching against four coarse buckets. A
 * student and their parents are exactly the audience that will read "82/100" as
 * a fact, so the priors are labelled as priors on every card, and the evaluator
 * states which of its two modes produced the number.
 */

import { useCallback, useEffect, useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Search,
  Info,
  Target,
  Wrench,
  TrendingDown,
  ExternalLink,
  ShieldOff,
} from "lucide-react";
/* This route already has a local, purpose-built `EmptyState` for the
   "no profession selected yet" case, which is a different state from an empty
   matrix. The shared component is aliased so both can coexist. */
import { EmptyState as SharedEmptyState } from "@/components/EmptyState";
import Link from "next/link";
import {
  evaluateJobSecurity,
  evaluateProfession,
  fetchProfessionsSafety,
  type JobSecurityResult,
  type ProfessionSafetyRow,
  type ProfessionsSafetyMatrix,
} from "@/lib/career";
import { NO_DATA, finiteOrNull } from "@/lib/mock-data";

const FIELDS = [
  { value: "engineering-cs", label: "Engineering — CS / IT" },
  { value: "engineering-non-cs", label: "Engineering — non-CS" },
  { value: "management", label: "Management / MBA" },
  { value: "medicine", label: "Medicine" },
  { value: "law", label: "Law" },
  { value: "commerce", label: "Commerce" },
  { value: "design", label: "Design" },
  { value: "pure-sciences", label: "Pure sciences" },
  { value: "social-sciences", label: "Social sciences / Humanities" },
];

const TIERS = [
  { value: "1", label: "Tier 1" },
  { value: "2", label: "Tier 2" },
  { value: "3", label: "Tier 3" },
];

const EXAMPLE_PROFESSIONS = [
  "Clinical Medicine & Surgery",
  "Software Engineering",
  "Data Science",
  "Corporate Law",
  "Accounting",
  "Digital Marketing",
  "Architecture",
];

function pct(v: number | null | undefined, suffix = "%"): string {
  const n = finiteOrNull(v);
  return n === null ? NO_DATA : `${n.toFixed(1)}${suffix}`;
}

function scoreTone(score: number | null | undefined): string {
  const n = finiteOrNull(score);
  if (n === null) return "text-slate-400";
  if (n >= 85) return "text-emerald-600";
  if (n >= 70) return "text-amber-600";
  return "text-rose-600";
}

/* ── Result card ─────────────────────────────────────────────────────── */

function JobSecurityCard({ result, sourceNote }: { result: JobSecurityResult; sourceNote: string }) {
  const score = finiteOrNull(result.job_security_score);
  const displacement = result.displacement_risk ?? null;
  const upskill = result.upskilling_requirements ?? null;
  const breakdown = result.role_breakdown ?? null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
            AI Resilience Index
          </p>
          <h3 className="text-base font-bold text-slate-950 truncate">{result.profession ?? "This field"}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {result.evaluation_mode ?? "Field-level evaluation"}
            {result.category ? ` · ${result.category}` : ""}
          </p>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-black font-mono ${scoreTone(score)}`}>
            {score === null ? NO_DATA : score}
            {score !== null && <span className="text-sm font-semibold text-slate-400">/100</span>}
          </div>
          {result.security_label && (
            <span
              className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
              style={{
                color: result.risk_color ?? "#64748B",
                backgroundColor: `${result.risk_color ?? "#64748B"}14`,
                border: `1px solid ${result.risk_color ?? "#64748B"}30`,
              }}
            >
              {result.security_label}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
        <p className="text-[11px] text-slate-500 leading-relaxed">
          <Info size={11} className="inline mr-1 -mt-0.5" />
          {sourceNote}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
        <Metric label="5y layoff risk" value={pct(displacement?.layoff_probability_5y_pct)} />
        <Metric label="10y layoff risk" value={pct(displacement?.layoff_probability_10y_pct)} />
        <Metric label="Disruption" value={pct(result.base_disruption_pct)} />
        <Metric label="Human resilience" value={pct(result.human_resilience_pct)} />
      </div>

      <div className="px-5 py-4 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <TaskList
            icon={<TrendingDown size={13} className="text-rose-500" />}
            title="Most exposed to automation"
            items={breakdown?.vulnerable_tasks}
            empty="Not modelled for this input."
            tone="rose"
          />
          <TaskList
            icon={<Wrench size={13} className="text-emerald-600" />}
            title="Holds up as AI improves"
            items={breakdown?.resilient_skills}
            empty="Not modelled for this input."
            tone="emerald"
          />
        </div>

        {upskill && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Target size={12} /> Upskilling estimate to 2035
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-slate-500">Estimated capital</p>
                <p className="text-sm font-bold text-slate-900 font-mono">
                  {(() => {
                    const v = finiteOrNull(upskill.estimated_capital_10y_inr);
                    return v === null ? NO_DATA : `₹${(v / 100000).toFixed(1)}L`;
                  })()}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Study time</p>
                <p className="text-sm font-bold text-slate-900 font-mono">
                  {(() => {
                    const v = finiteOrNull(upskill.recommended_annual_hours);
                    return v === null ? NO_DATA : `${v} hrs/yr`;
                  })()}
                </p>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
              A linear formula on the safety score, not a costing of an actual curriculum. Treat it
              as an order of magnitude.
            </p>
          </div>
        )}

        {result.strategic_advice && (
          <div>
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Strategy
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">{result.strategic_advice}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3.5">
      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-lg font-black text-slate-900 font-mono">{value}</p>
    </div>
  );
}

function TaskList({
  icon,
  title,
  items,
  empty,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[] | null | undefined;
  empty: string;
  tone: "rose" | "emerald";
}) {
  const list = Array.isArray(items) ? items : null;
  return (
    <div>
      <p
        className={`text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
          tone === "rose" ? "text-rose-600" : "text-emerald-700"
        }`}
      >
        {icon}
        {title}
      </p>
      {list && list.length > 0 ? (
        <ul className="space-y-1.5">
          {list.map((item) => (
            <li key={item} className="text-xs text-slate-600 leading-relaxed flex gap-2">
              <span className={tone === "rose" ? "text-rose-400" : "text-emerald-500"}>·</span>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-400 italic">{empty}</p>
      )}
    </div>
  );
}

/* ── Empty / error states ────────────────────────────────────────────── */

/**
 * Shown before a profession has been evaluated. Deliberately NOT the shared
 * `EmptyState`: that component's contract is "a result set came back and it was
 * empty", and it requires a next action. This one is a prompt — there is
 * nothing to be empty yet, so the call to action is the form above it, and
 * pointing at "browse programmes" here would send someone away from the field
 * they were about to score.
 */
function EvaluationPrompt() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
      <ShieldCheck size={26} className="mx-auto text-slate-300 mb-3" />
      <p className="text-sm font-semibold text-slate-700">No profession evaluated yet</p>
      <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
        Pick a field above, or type any profession. Every score here comes from a model with
        published assumptions — we show which one produced it.
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center">
      <AlertTriangle size={22} className="mx-auto text-rose-500 mb-3" />
      <p className="text-sm font-bold text-rose-900">Job-security model unavailable</p>
      <p className="text-xs text-rose-700 mt-1.5 max-w-md mx-auto leading-relaxed">{message}</p>
      <button onClick={onRetry} className="btn-secondary mt-4 inline-flex items-center gap-2">
        <RefreshCw size={13} /> Retry
      </button>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function JobSecurityPage() {
  const [field, setField] = useState("engineering-cs");
  const [tier, setTier] = useState("2");
  const [adaptability, setAdaptability] = useState(0.5);
  const [professionInput, setProfessionInput] = useState("");

  const [result, setResult] = useState<JobSecurityResult | null>(null);
  const [sourceNote, setSourceNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [matrix, setMatrix] = useState<ProfessionsSafetyMatrix | null>(null);
  const [matrixError, setMatrixError] = useState<string | null>(null);
  const [matrixLoading, setMatrixLoading] = useState(true);

  const loadMatrix = useCallback(async () => {
    setMatrixLoading(true);
    setMatrixError(null);
    const { ok, data, message } = await fetchProfessionsSafety();
    setMatrixLoading(false);
    if (ok) setMatrix(data);
    else setMatrixError(message);
  }, []);

  useEffect(() => {
    void loadMatrix();
  }, [loadMatrix]);

  async function runFieldEvaluation() {
    setLoading(true);
    setError(null);
    setResult(null);
    const { ok, data, message } = await evaluateJobSecurity({
      degree_field: field,
      college_tier: tier,
      student_ai_adaptability: adaptability,
    });
    setLoading(false);
    if (!ok) {
      setError(message);
      return;
    }
    setResult(data);
    setSourceNote(
      `Curated prior for the ${FIELDS.find((f) => f.value === field)?.label ?? field} archetype ` +
        "(ml/nextgen_engine.py), adjusted by ±4 for college tier and +3.5× your AI-adaptation " +
        "score. These are assumed priors, not observed layoff rates.",
    );
  }

  async function runProfessionEvaluation(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const { ok, data, message } = await evaluateProfession({
      profession_name: trimmed,
      college_tier: tier,
      student_ai_adaptability: adaptability,
    });
    setLoading(false);
    if (!ok) {
      setError(message);
      return;
    }
    setResult(data);
    const matched = data.evaluation_mode === "On-The-Spot Model Match";
    setSourceNote(
      matched
        ? "Matched to a specific row of the curated 12-profession matrix."
        : "NOT IN THE MATRIX. Classified by keyword matching into one of four broad buckets " +
          "(physical/hands-on, high-order systems, routine-transactional, general knowledge). " +
          "This is a coarse guess — not a result this page can defend for an unlisted profession.",
    );
  }

  const rows: [string, ProfessionSafetyRow][] = matrix?.matrix
    ? Object.entries(matrix.matrix).sort(
        (a, b) => (finiteOrNull(b[1].safety_score) ?? 0) - (finiteOrNull(a[1].safety_score) ?? 0),
      )
    : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-24">
      {/* ── Honesty banner ── */}
      <div className="bg-white border-b border-slate-200 py-2.5">
        <div className="container-lg">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-amber-600 shrink-0">
              <AlertTriangle size={14} />
            </span>
            <span className="text-xs text-slate-600">
              <strong className="text-slate-900 font-semibold">Model priors, not measured outcomes.</strong>{" "}
              The safety matrix is a hand-curated set of 12 professions. No longitudinal study of
              Indian AI displacement rates underpins these numbers. Use it to compare orders of
              magnitude, never as a forecast.
            </span>
          </div>
        </div>
      </div>

      <div className="container-lg pt-10 pb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold mb-3">
          <ShieldCheck size={12} />
          {matrix?.horizon ?? "2026–2035"} horizon · {matrix?.total_professions ?? NO_DATA} professions
          modelled
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-950 tracking-tight mb-3">
          Is this career safe in 2035?
        </h1>
        <p className="text-base text-slate-600 mb-8 max-w-2xl leading-relaxed">
          Every degree decision is also an automation-risk decision. Pick a field, or type any
          profession, and we show which model produced the number — including when the answer is
          only a keyword-matched guess.
        </p>

        {/* ── Controls ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm mb-8">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="js-field"
                className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400"
              >
                Field
              </label>
              <select
                id="js-field"
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="mt-1.5 w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-slate-400"
              >
                {FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="js-tier"
                className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400"
              >
                College tier
              </label>
              <select
                id="js-tier"
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="mt-1.5 w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-slate-400"
              >
                {TIERS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Worth ±4 points on a 100 scale.</p>
            </div>

            <div>
              <label
                htmlFor="js-adapt"
                className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400"
              >
                Your AI adaptability
              </label>
              <input
                id="js-adapt"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={adaptability}
                onChange={(e) => setAdaptability(Number(e.target.value))}
                className="mt-3 w-full accent-slate-900"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                {adaptability.toFixed(2)} — self-reported. Worth up to +3.5 points.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button onClick={runFieldEvaluation} disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              Evaluate this field
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void runProfessionEvaluation(professionInput);
              }}
              className="flex-1 min-w-[240px] flex gap-2"
            >
              <input
                value={professionInput}
                onChange={(e) => setProfessionInput(e.target.value)}
                placeholder="…or any profession: 'school teacher', 'chartered accountant'"
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                aria-label="Profession name"
              />
              <button
                type="submit"
                disabled={loading || !professionInput.trim()}
                className="btn-secondary"
                style={{ opacity: loading || !professionInput.trim() ? 0.6 : 1 }}
              >
                <Search size={13} /> Check
              </button>
            </form>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {EXAMPLE_PROFESSIONS.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setProfessionInput(p);
                  void runProfessionEvaluation(p);
                }}
                disabled={loading}
                className="px-2.5 py-1 rounded-full border border-slate-200 text-[11px] text-slate-600 hover:border-slate-400 hover:text-slate-900 transition disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* ── Result ── */}
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center mb-8">
            <Loader2 size={22} className="mx-auto text-slate-400 animate-spin mb-3" />
            <p className="text-xs text-slate-500">Running the resilience model…</p>
          </div>
        )}

        {!loading && error && (
          <div className="mb-8">
            <ErrorState message={error} onRetry={runFieldEvaluation} />
          </div>
        )}

        {!loading && !error && result && (
          <div className="mb-8">
            <JobSecurityCard result={result} sourceNote={sourceNote} />
          </div>
        )}

        {!loading && !error && !result && <EvaluationPrompt />}

        {/* ── Full matrix ── */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-950">The full 12-profession matrix</h2>
            <button onClick={loadMatrix} className="btn-ghost" disabled={matrixLoading}>
              <RefreshCw size={12} className={matrixLoading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          {matrixLoading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <Loader2 size={20} className="mx-auto text-slate-400 animate-spin mb-2" />
              <p className="text-xs text-slate-500">Loading safety matrix…</p>
            </div>
          )}

          {!matrixLoading && matrixError && <ErrorState message={matrixError} onRetry={loadMatrix} />}

          {!matrixLoading && !matrixError && rows.length === 0 && (
            /* The model answered but carried no rows. That is a fact about the
               response, not a failure, so it reads as an empty result and not
               as an error — and nothing is substituted for it. */
            <SharedEmptyState
              icon={ShieldOff}
              title="The safety matrix returned no rows"
              hint="The model responded but carried no profession data. We are not filling the table with placeholder occupations, because a plausible-looking row would be indistinguishable from a modelled one."
              action={{ label: "Browse programmes instead", href: "/explore" }}
              secondaryAction={{ label: "How exposure is modelled", href: "/methodology" }}
            />
          )}

          {!matrixLoading && !matrixError && rows.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[680px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {(
                        [
                          ["Profession", "px-4 text-left"],
                          ["Safety", "px-3 text-right"],
                          ["5y risk", "px-3 text-right"],
                          ["10y risk", "px-3 text-right"],
                          ["Verdict", "px-4 text-left"],
                        ] as const
                      ).map(([h, cls]) => (
                        <th
                          key={h}
                          className={`py-2.5 font-mono font-bold uppercase tracking-wider text-[10px] text-slate-400 ${cls}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(([name, row]) => (
                      <tr
                        key={name}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 cursor-pointer"
                        onClick={() => {
                          setProfessionInput(name);
                          void runProfessionEvaluation(name);
                        }}
                      >
                        <td className="px-4 py-3 font-semibold text-slate-800">{name}</td>
                        <td className={`px-3 py-3 text-right font-mono font-bold text-sm ${scoreTone(row.safety_score)}`}>
                          {finiteOrNull(row.safety_score) ?? NO_DATA}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-slate-600">{pct(row["5y_layoff_risk_pct"])}</td>
                        <td className="px-3 py-3 text-right font-mono text-slate-600">{pct(row["10y_layoff_risk_pct"])}</td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{
                              color: row.risk_color ?? "#64748B",
                              backgroundColor: `${row.risk_color ?? "#64748B"}14`,
                            }}
                          >
                            {row.safety_label ?? NO_DATA}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60">
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Click any row for its task-level breakdown. Scores are curated priors held in{" "}
                  <code className="font-mono">ml/nextgen_engine.py</code>; the 5y/10y columns are that
                  matrix&apos;s own assumptions, not observed displacement rates.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ── What this model cannot see ── */}
        <section className="mt-8 grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 mb-2">
              What this model cannot see
            </p>
            <ul className="space-y-1.5 text-xs text-slate-600 leading-relaxed">
              <li>· No employer or regional variation — the same score applies to every city.</li>
              <li>· No within-profession variation: &quot;accountant&quot; and &quot;forensic accountant&quot; score identically.</li>
              <li>· No macroeconomic cycle and no policy change.</li>
              <li>· Your adaptability score is self-reported and moves the result by 3.5 points.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
              Model it alongside
            </p>
            <div className="space-y-2">
              <Link
                href="/career-trajectory"
                className="flex items-center justify-between text-xs font-semibold text-slate-800 hover:text-slate-950 group"
              >
                <span>Career trajectory — where people actually end up</span>
                <ExternalLink size={12} className="text-slate-400 group-hover:text-slate-700" />
              </Link>
              <Link
                href="/methodology"
                className="flex items-center justify-between text-xs font-semibold text-slate-800 hover:text-slate-950 group"
              >
                <span>How every score on this site is computed</span>
                <ExternalLink size={12} className="text-slate-400 group-hover:text-slate-700" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
