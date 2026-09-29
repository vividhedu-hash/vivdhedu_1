"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, GitBranch, UserRound, Sparkles } from "lucide-react";
import { AcademicPathChart } from "./AcademicPathChart";
import { GroundedAnswer } from "./GroundedAnswer";
import { AIUnavailable } from "./AIUnavailable";
import { Notice } from "./Notice";
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

/**
 * AI Mode.
 *
 * ## The availability model
 *
 * This surface is built and shipped, and it stays in the nav. Its upstream —
 * a search-grounded engine reached through OpenRouter, optionally Gemini —
 * is not connected yet, because no key has been supplied. That is a
 * *configuration* state, and it is presented as one.
 *
 * The distinction the interface is built around:
 *
 *   - **Not connected** (503, `integration_unavailable` / `backend_unavailable`
 *     / `sonar_unavailable`) → `<AIUnavailable>`. Says plainly that nothing is
 *     listening, shows the backend's own reason, and states what still works.
 *   - **Upstream failed** (502, timeout, anything else) → a `Notice tone="warn"`.
 *     Something IS configured and it did not answer, which is a different
 *     claim and must not be dressed up as "not connected".
 *
 * The status probe runs once on mount and its result drives the whole surface:
 * while the probe is in flight the form is present but disabled, so a user
 * cannot type a question into a box that is already known to be unusable.
 *
 * ## What is never done here
 *
 * No fallback answer, no cached response, no example answer, and no citation
 * that was not returned by an upstream. Every panel below renders `null` as
 * "not measured" and an error as an error.
 */
type EngineState = "checking" | "ready" | "unavailable";

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

  const [engineState, setEngineState] = useState<EngineState>("checking");
  const [engineName, setEngineName] = useState("");
  const [probe, setProbe] = useState<{ status?: number; reason?: string }>({});

  const profile = useMemo(
    () => ({
      total_budget: budget,
      target_field: field,
      risk_tolerance: risk,
    }),
    [budget, field, risk],
  );

  /** Re-probe `/api/v1/ai/status`. Exposed as the retry action. */
  const probeEngine = useCallback(() => {
    setEngineState("checking");
    void getAi<{
      configured?: boolean;
      engine?: string;
      engines?: { gemini?: boolean; openrouter?: boolean };
    }>("/api/v1/ai/status").then(({ ok, data }) => {
      if (!ok) {
        setEngineState("unavailable");
        return;
      }
      if (data.engine) setEngineName(data.engine);
      // `configured` is the backend's own boolean and is false whenever no
      // engine can answer. Trusting it is what keeps the UI from claiming a
      // model that does not exist.
      setEngineState(data.configured ? "ready" : "unavailable");
    });
  }, []);

  useEffect(probeEngine, [probeEngine]);

  useEffect(() => {
    if (!initialToken) return;
    void getAi<IntelligencePayload>(
      `/api/v1/ai/intelligence/${encodeURIComponent(initialToken)}`,
    ).then(({ ok, data }) => {
      if (ok && data.headline) setIntel(data);
    });
  }, [initialToken]);

  async function ask(nextQuery?: string) {
    const q = (nextQuery ?? query).trim();
    if (q.length < 3) return;
    setAsking(true);
    setModeError(null);
    const { ok, status, data } = await postAi<
      GroundedPayload | { detail?: { reason?: string } }
    >("/api/v1/ai/mode", { query: q, context: profile });
    setAsking(false);
    if (!ok) {
      setMode(null);
      // A 503 means nothing is connected — re-probe so the whole surface
      // settles into the unavailable state rather than showing a stale form.
      if (status === 503) probeEngine();
      setModeError(aiErrorMessage(data, `AI Mode did not respond (HTTP ${status}).`));
      return;
    }
    setMode(data as GroundedPayload);
  }

  async function buildIntelligence() {
    setBuilding(true);
    setIntelError(null);
    const { ok, status, data } = await postAi<
      IntelligencePayload | { detail?: { reason?: string } }
    >("/api/v1/ai/intelligence", {
      token: token || undefined,
      profile,
      question: query || undefined,
    });
    setBuilding(false);
    if (!ok) {
      setIntel(null);
      if (status === 503) probeEngine();
      setIntelError(
        aiErrorMessage(data, `Intelligence was not returned (HTTP ${status}).`),
      );
      return;
    }
    const payload = data as IntelligencePayload;
    setIntel(payload);
    if (payload.token) setToken(payload.token);
  }

  const unavailable = engineState === "unavailable";
  const busy = engineState === "checking";

  return (
    <div className="space-y-5">
      {/* ── Grounded Q&A ─────────────────────────────────────────── */}
      <section className="panel">
        <div className="panel-head">
          <span className="panel-title flex items-center gap-2">
            <Sparkles size={12} aria-hidden="true" />
            Grounded search
          </span>
          {engineState === "ready" ? (
            <span className="badge badge-teal">{engineName || "Live"}</span>
          ) : engineState === "checking" ? (
            <span className="badge">Checking…</span>
          ) : (
            <span className="badge badge-amber">Not connected</span>
          )}
        </div>

        <div className="panel-pad space-y-4">
          {unavailable ? (
            <AIUnavailable
              status={probe.status}
              reason={probe.reason}
              engine={engineName}
              onRetry={probeEngine}
            />
          ) : (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void ask();
                }}
                className="space-y-3"
              >
                <label htmlFor="ai-mode-query" className="sr-only">
                  Ask a question to be answered from live sources
                </label>
                <textarea
                  id="ai-mode-query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={3}
                  disabled={busy}
                  placeholder="Ask a live, source-backed question — e.g. what did NIRF 2025 change for NIT Trichy CSE payback against a private deemed university?"
                  className="form-input resize-y text-[14px]"
                />

                <div className="flex flex-wrap gap-2">
                  {[
                    "Current JEE Advanced counselling timeline, and who it actually affects",
                    "Is MBBS still a better P10 outcome than a tier-2 CSE degree?",
                    "What official sources say about IIM-A vs FMS Delhi, cost against median",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setQuery(preset);
                        void ask(preset);
                      }}
                      className="goal-chip disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={asking || busy || query.trim().length < 3}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {asking ? "Searching official and news sources…" : "Ask with citations"}
                </button>
              </form>

              {modeError && (
                <Notice tone="warn" title="No grounded answer was returned">
                  {modeError}
                </Notice>
              )}
              {mode && <GroundedAnswer payload={mode} />}
            </>
          )}
        </div>
      </section>

      {/* ── Personal intelligence ────────────────────────────────── */}
      <section className="panel">
        <div className="panel-head">
          <span className="panel-title flex items-center gap-2">
            <UserRound size={12} aria-hidden="true" />
            Personal intelligence
          </span>
        </div>

        <div className="panel-pad space-y-4">
          <p className="text-[13px] leading-relaxed t-muted">
            Built from the constraints you state plus Search-grounded gates.
            Catalogue programme IDs are attached only when they exist in the
            live index.
          </p>

          {unavailable ? (
            <Notice tone="info">
              This section is waiting on the same connection as the search box
              above. It will work as soon as AI Mode is connected &mdash; your
              budget, field and risk settings are held on this page and are not
              lost.
            </Notice>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="form-label">
                  Budget (₹ lakh)
                  <input
                    type="number"
                    min={1}
                    max={80}
                    value={budget}
                    disabled={busy}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="form-input num"
                  />
                </label>
                <label className="form-label">
                  Field
                  <select
                    value={field}
                    disabled={busy}
                    onChange={(e) => setField(e.target.value)}
                    className="form-input form-select"
                  >
                    {FIELDS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-label">
                  Risk
                  <select
                    value={risk}
                    disabled={busy}
                    onChange={(e) => setRisk(e.target.value)}
                    className="form-input form-select"
                  >
                    <option value="low">Low — payback first</option>
                    <option value="medium">Medium — balanced</option>
                    <option value="high">High — optionality</option>
                  </select>
                </label>
              </div>

              <label className="form-label">
                Analyse report token (optional)
                <input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste a report token from /analyze"
                  className="form-input num text-[12px]"
                />
              </label>

              <button
                type="button"
                disabled={building || busy}
                onClick={() => void buildIntelligence()}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {building ? "Grounding your path…" : "Build intelligence + path"}
              </button>

              {intelError && (
                <Notice tone="warn" title="No intelligence was returned">
                  {intelError}
                </Notice>
              )}

              {intel && (
                <div className="space-y-4 pt-1">
                  <div>
                    <p className="metric-label">
                      {intel.archetype || "Profile"}
                      {intel.persisted ? " · saved" : ""}
                      {intel.token ? ` · ${intel.token}` : ""}
                    </p>
                    <h3 className="mt-1 text-[17px] font-bold t-text">
                      {intel.headline}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <ListPanel
                      title="Strengths"
                      tone="green"
                      items={intel.strengths ?? []}
                    />
                    <ListPanel title="Risks" tone="amber" items={intel.risks ?? []} />
                  </div>

                  {(intel.decision_rules ?? []).length > 0 && (
                    <ListPanel
                      title="Decision rules"
                      tone="blue"
                      items={intel.decision_rules ?? []}
                    />
                  )}
                  {(intel.open_questions ?? []).length > 0 && (
                    <ListPanel
                      title="Still unverified"
                      tone="neutral"
                      items={intel.open_questions ?? []}
                    />
                  )}
                  {intel.grounding && <GroundedAnswer payload={intel.grounding} />}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {intel?.path?.nodes && (
        <section className="panel">
          <div className="panel-head">
            <span className="panel-title flex items-center gap-2">
              <GitBranch size={12} aria-hidden="true" />
              Academic path
            </span>
          </div>
          <div className="panel-pad">
            <AcademicPathChart nodes={intel.path.nodes} edges={intel.path.edges ?? []} />
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * A titled list inside a panel.
 *
 * The four variants previously used four hardcoded pastel backgrounds
 * (`emerald-50`, `amber-50`, `blue-50`, `slate-50`), which is why the section
 * read as four different components. The only difference now is the accent
 * colour of the title rule; the surface is one token.
 */
function ListPanel({
  title,
  items,
  tone = "neutral",
}: {
  title: string;
  items: string[];
  tone?: "green" | "amber" | "blue" | "neutral";
}) {
  if (items.length === 0) return null;
  const accent =
    tone === "green" ? "var(--green)" :
    tone === "amber" ? "var(--amber)" :
    tone === "blue" ? "var(--blue)" : "var(--text-tertiary)";

  return (
    <div
      className="rounded-xl border p-3.5"
      style={{ background: "var(--bg-chip)", borderColor: "var(--border-subtle)" }}
    >
      <p className="metric-label mb-2 flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: accent }}
        />
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((s) => (
          <li key={s} className="text-[13px] leading-relaxed t-muted">
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
