"use client";

import { Link2Off, PlugZap, RefreshCw } from "lucide-react";
import { BRAND } from "@/lib/brand";

/**
 * AI Mode's "not connected yet" state.
 *
 * ## Why this exists as its own component
 *
 * `/advisor` is a real, finished, reachable feature whose upstream is not yet
 * switched on. `OPENROUTER_API_KEY` (and optionally `GEMINI_API_KEY`) have not
 * been supplied. The route stays, the nav link stays, the page stays — the
 * feature ships and the key arrives later.
 *
 * The failure this component exists to prevent: a user types a real question,
 * the request fails, and the interface says something that reads as *"your
 * question could not be answered"*. That is a false claim. The question is
 * answerable; nothing is currently listening. This product's entire premise is
 * that it distinguishes "we don't know" from "we didn't look", and collapsing
 * those two is the exact error its methodology page warns against.
 *
 * ## What the copy is derived from
 *
 * Every string here comes from an actual response, not from a guess:
 *
 *  - `GET /api/v1/ai/status` returns `configured: false` and
 *    `engines: { gemini: false, openrouter: false }` when no key is set
 *    (`backend/api/routers/ai.py`; `active_engine_name()` returns `""`).
 *  - `POST /api/v1/ai/mode` returns **503** with
 *    `detail: { error: "integration_unavailable", reason, missing_env }`
 *    (`IntegrationUnavailable.as_http_detail()`).
 *  - The Next proxy `src/app/api/v1/[...path]/route.ts` returns **503** with
 *    `detail: { error: "backend_unavailable", reason }` when FastAPI is
 *    unreachable, and states the timeout it waited.
 *  - `POST /api/search/ground` returns **503** with
 *    `{ error: "sonar_unavailable", reason }`, and distinguishes a missing key
 *    from a genuine upstream failure in its `reason`.
 *
 * So the two conditions are told apart by the *status and payload shape*, not
 * by guessing: a 503 carrying `missing_env` / `integration_unavailable` is
 * "not connected", and a 502 or a timeout is "the upstream failed". The first
 * gets this panel. The second gets a plain error, because claiming a key is
 * missing when the key is present and the provider is down would be its own
 * kind of lie.
 *
 * ## What it deliberately does not do
 *
 * It renders no sample answer, no illustrative citation, and no "in the
 * meantime, here's what we would have said". A canned response on a
 * citation-first surface is indistinguishable from a real one once it is on
 * screen, and a fabricated citation is the single worst thing this codebase
 * could ship.
 */
export function AIUnavailable({
  status,
  reason,
  engine,
  engines,
  onRetry,
  retryLabel = "Check again",
}: {
  status?: number;
  reason?: string;
  engine?: string;
  engines?: { gemini?: boolean; openrouter?: boolean };
  onRetry?: () => void;
  retryLabel?: string;
}) {
  // `engine` is the backend's own word for which model would answer. When no
  // engine is configured the backend returns "" — so an empty string is shown
  // as "none configured", never as a fabricated model name.
  const anyEngine =
    Boolean(engine) || Boolean(engines?.gemini) || Boolean(engines?.openrouter);

  return (
    <div role="status" className="panel">
      <div className="panel-head">
        <span className="panel-title flex items-center gap-2">
          <PlugZap size={12} aria-hidden="true" />
          AI Mode
        </span>
        <span className="badge badge-amber">Not connected</span>
      </div>

      <div className="panel-pad">
        <div className="flex items-start gap-3.5">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
            style={{
              background: "var(--amber-dim)",
              border: "1px solid var(--amber-dim)",
            }}
            aria-hidden="true"
          >
            <Link2Off size={17} style={{ color: "var(--amber)" }} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold t-text">
              AI Mode is not connected yet
            </p>

            <p className="mt-2 text-[13px] leading-relaxed t-muted">
              This feature is built and shipped, but it has no search provider
              connected behind it yet. Your question was not rejected and nothing
              was searched &mdash; there is simply no live web to search. The
              connection is switched on by configuration, not by anything you
              do, and no other part of {BRAND.name} is affected.
            </p>

            {/* The actual reason, when the upstream gave one. This is the
                backend's own sentence, passed through verbatim rather than
                paraphrased into a nicer-sounding claim. */}
            {reason && (
              <p
                className="mt-3.5 rounded-lg border px-3 py-2.5 text-[12px] leading-relaxed"
                style={{
                  background: "var(--bg-chip)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
              >
                <span className="metric-label mr-2 inline">Reported</span>
                <span className="num text-[11px]">{reason}</span>
              </p>
            )}

            <dl className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="metric-cell">
                <span className="metric-label">Grounded engine</span>
                <span className="num text-[12px] t-text">
                  {anyEngine ? engine || "configured" : "none configured"}
                </span>
              </div>
              <div className="metric-cell">
                <span className="metric-label">Response</span>
                <span className="num text-[12px] t-text">
                  {status ? `HTTP ${status}` : "no response"}
                </span>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <RefreshCw size={13} aria-hidden="true" />
                  {retryLabel}
                </button>
              )}
              <a href="/methodology" className="btn-ghost">
                How answers are grounded
              </a>
            </div>

            {/* What still works. Stating this is the difference between
                "broken" and "not switched on" — a user who lands here and
                believes the whole product is down will not come back. */}
            <p className="mt-4 text-[11px] leading-relaxed t-faint">
              Everything that runs on stored data is unaffected: the programme
              index, the composite scores, the NPV and AI-exposure models, the
              adaptive assessment, and every report you have already generated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
