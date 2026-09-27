"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw, Compass, Scale } from "lucide-react";

/**
 * /compare error boundary.
 *
 * /compare deliberately renders a degraded state on a failed fetch rather than
 * throwing (see the try/catch in page.tsx), so reaching this boundary means
 * something worse than an unreachable backend — the page body itself failed.
 * The copy says that instead of guessing which one it was.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-[70vh] bg-[#F8FAFC] text-slate-950 flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-5">
          <AlertTriangle size={18} className="text-rose-600" />
        </div>

        <p className="kicker-web mb-2">Comparison failed</p>
        <h1 className="text-xl font-bold tracking-tight text-slate-950">
          The benchmark matrix could not be built
        </h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          A comparison is only meaningful if every figure in it was measured, so an incomplete
          matrix is not shown in place of a failed one.
        </p>

        {error.digest && (
          <p className="mt-4 font-mono text-[11px] text-slate-400">ref {error.digest}</p>
        )}

        <div className="mt-6 flex flex-wrap gap-2.5">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition"
          >
            <RefreshCw size={14} /> Try again
          </button>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl transition"
          >
            <Compass size={14} /> Browse programs
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-slate-950 text-sm font-medium rounded-xl transition"
          >
            <Scale size={14} /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
