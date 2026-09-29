"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, Compass } from "lucide-react";
import { BRAND } from "@/lib/brand";

/**
 * Root error boundary.
 *
 * Required to be a client component and to accept `{ error, reset }`.
 *
 * The digest is surfaced verbatim when present. In production Next.js sends
 * only a digest to the browser; the full message (with its stack) is matched
 * against the server log by that digest. Showing the real message in dev but
 * an opaque id in prod is the intended split — a thrown message is often a
 * fragment of a SQL string or a file path.
 *
 * This is the *root* boundary and so is deliberately plainer than
 * `components/RouteError`, which every individual route uses. They share the
 * same frame, the same primary/secondary button pair and the same
 * reference-id treatment, so a failure looks the same wherever it surfaces.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in the browser console only; production error reporting is
    // whatever the hosting platform installs, not this component.
    console.error("[app] Unhandled route error:", error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div className="t-bg t-text flex min-h-[70vh] items-center justify-center px-4 py-20">
      <div className="t-surface t-border t-shadow-card w-full max-w-lg rounded-2xl border p-8">
        <div
          className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: "var(--red-dim)", border: "1px solid var(--red-dim)" }}
          aria-hidden="true"
        >
          <AlertTriangle size={18} style={{ color: "var(--red)" }} />
        </div>

        <p className="kicker-web mb-2">Something broke</p>
        <h1 role="alert" className="text-xl font-bold tracking-tight t-text">
          This page failed to load
        </h1>
        <p className="mt-2 text-sm leading-relaxed t-muted">
          The error is contained to this route — the rest of {BRAND.name} is
          still up. Retrying usually clears it. If it does not, the underlying
          failure is in the server log.
        </p>

        <div
          className="mt-5 rounded-xl border p-4"
          style={{ background: "var(--bg-chip)", borderColor: "var(--border-subtle)" }}
        >
          <p className="metric-label mb-2">
            {isDev ? "Error" : "Reference"}
          </p>
          <p className="num break-words text-[12px] leading-relaxed t-muted">
            {isDev ? error.message || "No message." : (error.digest ?? "unavailable")}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5">
          <button type="button" onClick={() => reset()} className="btn-primary">
            <RotateCcw size={14} aria-hidden="true" />
            Try again
          </button>
          <Link href="/" className="btn-secondary">
            <Home size={14} aria-hidden="true" />
            Home
          </Link>
          <Link
            href="/explore"
            className="btn-ghost inline-flex items-center gap-2"
          >
            <Compass size={14} aria-hidden="true" />
            Browse programmes
          </Link>
        </div>
      </div>
    </div>
  );
}
