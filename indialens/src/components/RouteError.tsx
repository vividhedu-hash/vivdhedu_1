"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

/**
 * Shared route error surface.
 *
 * Every route boundary in the app renders this, so a failure looks and behaves
 * the same wherever the user hits it: the same framing, the same recovery
 * affordances, the same reference id. Route-specific `error.tsx` files pass a
 * `title`, `body`, and optionally a different fallback link.
 *
 * Two rules govern the copy, and both come from the product's own standard
 * rather than generic error-page habit:
 *
 * 1. A failure is stated as a failure. It is never softened into an empty
 *    result. A list that silently renders zero rows reads as "nothing matched
 *    your filters", which is a factual claim the data never made.
 * 2. Every surface offers a way forward. `reset()` re-runs the failed render
 *    in place; the fallback link is the escape hatch when retrying will keep
 *    failing. No dead ends.
 *
 * `error.digest` is a build-time identifier, not a message. It is safe to show
 * and is the only thing that ties a user report to a server log, so it is
 * rendered when present.
 */
export interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Kicker line above the headline, e.g. "Index unavailable". */
  kicker?: string;
  /** Headline. Keep it about what failed, not about the system. */
  title: string;
  /** One or two sentences. Say why it failed and what it is not showing. */
  body: string;
  /** Primary in-place retry label. */
  retryLabel?: string;
  /** Fallback link destination. Defaults to the home page. */
  fallbackHref?: string;
  fallbackLabel?: string;
}

export function RouteError({
  error,
  reset,
  kicker = "Something went wrong",
  title,
  body,
  retryLabel = "Retry",
  fallbackHref = "/",
  fallbackLabel = "Back to home",
}: RouteErrorProps) {
  return (
    <div className="t-bg t-text min-h-[70vh] flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md t-surface t-border border rounded-2xl p-8 t-shadow-card">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
          style={{ background: "var(--red-dim)", border: "1px solid var(--red-dim)" }}
        >
          <AlertTriangle size={18} style={{ color: "var(--red)" }} aria-hidden="true" />
        </div>

        <p className="kicker-web mb-2">{kicker}</p>

        {/* Announced as an alert so a screen reader interrupts with the
            failure rather than silently rendering the fallback markup. */}
        <h1 role="alert" className="text-xl font-bold tracking-tight t-text">
          {title}
        </h1>

        <p className="mt-2 text-[13px] t-muted leading-relaxed">{body}</p>

        {error.digest && (
          <p className="mt-4 mono text-[11px] t-faint">
            Reference&nbsp;{error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => reset()}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <RefreshCw size={13} aria-hidden="true" /> {retryLabel}
          </button>
          <Link href={fallbackHref} className="btn-ghost inline-flex items-center gap-2">
            <Home size={13} aria-hidden="true" /> {fallbackLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
