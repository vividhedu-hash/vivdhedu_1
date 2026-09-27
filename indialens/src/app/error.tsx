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
    <div className="min-h-[70vh] bg-[#F8FAFC] text-zinc-950 flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-5">
          <AlertTriangle size={18} className="text-rose-600" />
        </div>

        <p className="kicker-web mb-2">Something broke</p>
        <h1 className="text-xl font-bold tracking-tight text-zinc-950">
          This page failed to load
        </h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          The error is contained to this route — the rest of {BRAND.name} is still up. Retrying
          usually clears it. If it does not, the underlying failure is in the server log.
        </p>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-2">
            {isDev ? "Error" : "Reference"}
          </p>
          <p className="font-mono text-[12px] leading-relaxed text-slate-700 break-words">
            {isDev ? error.message || "No message." : (error.digest ?? "unavailable")}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 active:scale-[0.99] text-white text-sm font-semibold rounded-xl transition"
          >
            <RotateCcw size={14} />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-zinc-800 text-sm font-semibold rounded-xl transition"
          >
            <Home size={14} />
            Home
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-zinc-600 hover:text-zinc-950 text-sm font-medium rounded-xl transition"
          >
            <Compass size={14} />
            Explore programs
          </Link>
        </div>
      </div>
    </div>
  );
}
