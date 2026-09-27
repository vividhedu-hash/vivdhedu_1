"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, FileText } from "lucide-react";

/**
 * /report/[token] error boundary.
 *
 * Scoped deliberately. A shared report link that fails to render is a
 * different failure from a full outage, so this offers only a retry and a way
 * back — it does not invite the reader to assume anything about whether the
 * report exists.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-lg py-20">
      <div className="max-w-md mx-auto text-center">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={22} className="text-rose-400" />
        </div>

        <h1 className="text-2xl font-bold text-[#F0F0F5]">This report could not be rendered</h1>
        <p className="text-[13px] text-[#8B8BA7] mt-3 leading-relaxed">
          The report link may have expired, or the data store did not respond. We are not rendering a
          partial report in its place.
        </p>

        {error.digest && (
          <p className="font-mono text-[11px] text-[#4A4A6A] mt-4">ref {error.digest}</p>
        )}

        <div className="flex flex-wrap gap-2.5 justify-center mt-7">
          <button onClick={() => reset()} className="btn-secondary" style={{ padding: "9px 18px", fontSize: 13 }}>
            <RefreshCw size={13} /> Retry
          </button>
          <Link href="/analyze" className="btn-ghost" style={{ padding: "9px 14px", fontSize: 13 }}>
            <FileText size={13} /> Run a new analysis
          </Link>
          <Link href="/" className="btn-ghost" style={{ padding: "9px 14px", fontSize: 13 }}>
            <Home size={13} /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
