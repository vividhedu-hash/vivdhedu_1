"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw, Compass } from "lucide-react";

/**
 * /explore error boundary.
 *
 * The route's own copy is explicit that unmeasured data renders as "—" rather
 * than a guess, so this boundary must not soften a total fetch failure into a
 * partial-looking page. A failed index load says so; it does not render an
 * empty table that reads like "no programs match your filters".
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-black text-[#F5F5F7] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#0A0A0A] border border-white/[0.08] rounded-2xl p-8">
        <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5">
          <AlertTriangle size={18} className="text-rose-400" />
        </div>

        <p className="kicker-web mb-2">Index unavailable</p>
        <h1 className="text-xl font-bold tracking-tight text-[#F5F5F7]">
          The program index could not be loaded
        </h1>
        <p className="mt-2 text-[13px] text-[#86868B] leading-relaxed">
          We are not showing a partial index in place of a failed one — a shorter list that looks
          complete is worse than an explicit error. Retry, or browse from the home page.
        </p>

        {error.digest && (
          <p className="mt-4 font-mono text-[11px] text-[#48484A]">ref {error.digest}</p>
        )}

        <div className="mt-6 flex flex-wrap gap-2.5">
          <button
            onClick={() => reset()}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <RefreshCw size={13} /> Retry
          </button>
          <Link href="/" className="btn-ghost inline-flex items-center gap-2">
            <Compass size={13} /> Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
