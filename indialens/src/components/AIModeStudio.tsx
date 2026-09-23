"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, GitBranch, Sparkles, UserRound } from "lucide-react";
import { AcademicPathChart } from "./AcademicPathChart";
import { GroundedAnswer } from "./GroundedAnswer";
import {
  aiErrorMessage,
  getAi,
  postAi,
  type GroundedPayload,
  type IntelligencePayload,
} from "../lib/grounded";

const FIELDS = [
  { value: "engineering-cs", label: "Engineering — CS / AI" },
  { value: "engineering-non-cs", label: "Engineering — non-CS" },
  { value: "management", label: "Management" },
  { value: "medicine", label: "Medicine" },
  { value: "law", label: "Law" },
  { value: "design", label: "Design" },
  { value: "commerce", label: "Commerce" },
];

export function AIModeStudio({ initialToken }: { initialToken?: string }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<GroundedPayload | null>(null);
  const [modeError, setModeError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  const [token, setToken] = useState(initialToken ?? "");
  const [budget, setBudget] = useState(12);
  const [field, setField] = useState("engineering-cs");
  const [risk, setRisk] = useState("medium");
  const [intel, setIntel] = useState<IntelligencePayload | null>(null);
  const [intelError, setIntelError] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [engineReady, setEngineReady] = useState<boolean | null>(null);
  const [engineName, setEngineName] = useState("gemini-3.7-flash");

  const profile = useMemo(
    () => ({
      total_budget: budget,
      target_field: field,
      risk_tolerance: risk,
    }),
    [budget, field, risk],
  );

  useEffect(() => {
    void getAi<{ configured?: boolean; engine?: string }>("/api/v1/ai/status").then(({ ok, data }) => {
      if (!ok) {
        setEngineReady(false);
        return;
      }
      setEngineReady(Boolean(data.configured));
      if (data.engine) setEngineName(data.engine);
    });
  }, []);

  useEffect(() => {
    if (!initialToken) return;
    void getAi<IntelligencePayload>(`/api/v1/ai/intelligence/${encodeURIComponent(initialToken)}`).then(
      ({ ok, data }) => {
        if (ok && data.headline) setIntel(data);
      },
    );
  }, [initialToken]);

  async function ask(nextQuery?: string) {
    const q = (nextQuery ?? query).trim();
    if (q.length < 3) return;
    setAsking(true);
    setModeError(null);
    const { ok, status, data } = await postAi<GroundedPayload | { detail?: { reason?: string } }>(
      "/api/v1/ai/mode",
      { query: q, context: profile },
    );
    setAsking(false);
    if (!ok) {
      setMode(null);
      setModeError(aiErrorMessage(data, `AI Mode unavailable (${status}).`));
      return;
    }
    setMode(data as GroundedPayload);
  }

  async function buildIntelligence() {
    setBuilding(true);
    setIntelError(null);
    const { ok, status, data } = await postAi<IntelligencePayload | { detail?: { reason?: string } }>(
      "/api/v1/ai/intelligence",
      {
        token: token || undefined,
        profile,
        question: query || undefined,
      },
    );
    setBuilding(false);
    if (!ok) {
      setIntel(null);
      setIntelError(aiErrorMessage(data, `Intelligence unavailable (${status}).`));
      return;
    }
    const payload = data as IntelligencePayload;
    setIntel(payload);
    if (payload.token) setToken(payload.token);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-600">
          <Sparkles size={14} />
          {engineName} · Google Search
          {engineReady === false && (
            <span className="normal-case font-medium text-amber-600">Engine not configured on FastAPI</span>
          )}
          {engineReady === true && (
            <span className="normal-case font-medium text-emerald-600">Live</span>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void ask();
          }}
          className="space-y-3"
        >
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            placeholder="Ask a live, source-backed question — e.g. What did NIRF 2025 change for NIT Trichy CSE payback vs a private deemed university?"
            className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white"
          />
          <div className="flex flex-wrap gap-2">
            {[
              "Current JEE Advanced counselling timeline and who it actually affects",
              "Is MBBS still a better P10 outcome than tier-2 CSE in 2026?",
              "What official sources say about IIM-A vs FMS Delhi cost vs median",
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setQuery(preset);
                  void ask(preset);
                }}
                className="text-[11px] px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-slate-50 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                {preset}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={asking}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-950 hover:bg-slate-800 disabled:opacity-50 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {asking ? "Searching official and news sources…" : "Ask with citations"}
          </button>
        </form>
        {modeError && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-xl flex gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
            {modeError}
          </p>
        )}
        {mode && <GroundedAnswer payload={mode} />}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
          <UserRound size={14} />
          Personal intelligence
        </div>
        <p className="text-sm text-slate-500">
          Built from your stated constraints plus Search-grounded gates. Catalog program IDs are only attached when they exist in Postgres.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="text-xs text-slate-500 space-y-1">
            Budget (₹ Lakh)
            <input
              type="number"
              min={1}
              max={80}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </label>
          <label className="text-xs text-slate-500 space-y-1">
            Field
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
            >
              {FIELDS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-500 space-y-1">
            Risk
            <select
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
            >
              <option value="low">Low — payback first</option>
              <option value="medium">Medium — balanced</option>
              <option value="high">High — optionality</option>
            </select>
          </label>
        </div>
        <label className="text-xs text-slate-500 space-y-1 block">
          Analyze report token (optional)
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste a report token from /analyze"
            className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-slate-900"
          />
        </label>
        <button
          type="button"
          disabled={building}
          onClick={() => void buildIntelligence()}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-950 hover:bg-slate-800 disabled:opacity-50 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {building ? "Grounding your path…" : "Build intelligence + path"}
        </button>
        {intelError && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-xl flex gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
            {intelError}
          </p>
        )}
        {intel && (
          <div className="space-y-5 pt-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-mono">
                {intel.archetype || "Profile"}
                {intel.persisted ? " · saved" : ""}
                {intel.token ? ` · ${intel.token}` : ""}
              </p>
              <h2 className="text-xl font-bold text-slate-950 mt-1">{intel.headline}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <p className="text-[11px] font-semibold uppercase text-emerald-800 mb-2">Strengths</p>
                <ul className="space-y-1 text-slate-700">
                  {(intel.strengths ?? []).map((s) => (
                    <li key={s}>· {s}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                <p className="text-[11px] font-semibold uppercase text-amber-800 mb-2">Risks</p>
                <ul className="space-y-1 text-slate-700">
                  {(intel.risks ?? []).map((s) => (
                    <li key={s}>· {s}</li>
                  ))}
                </ul>
              </div>
            </div>
            {(intel.decision_rules ?? []).length > 0 && (
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                <p className="text-[11px] font-semibold uppercase text-blue-800 mb-2">Decision rules</p>
                <ul className="space-y-1 text-sm text-slate-700">
                  {intel.decision_rules!.map((s) => (
                    <li key={s}>· {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {(intel.open_questions ?? []).length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[11px] font-semibold uppercase text-slate-600 mb-2">Still unverified</p>
                <ul className="space-y-1 text-sm text-slate-700">
                  {intel.open_questions!.map((s) => (
                    <li key={s}>· {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {intel.grounding && <GroundedAnswer payload={intel.grounding} />}
          </div>
        )}
      </section>

      {intel?.path?.nodes && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-900">
            <GitBranch size={14} />
            Academic path
          </div>
          <AcademicPathChart nodes={intel.path.nodes} edges={intel.path.edges ?? []} />
        </section>
      )}
    </div>
  );
}
