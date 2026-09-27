"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw, Compass, Database } from "lucide-react";

/**
 * /college/[id] error boundary.
 *
 * Note the distinction this page has to keep: a *render* failure (this
 * boundary) is different from a *missing* program. The page handles the
 * latter itself with a "Program not found" state, so anything arriving here is
 * an actual fault, and it is reported as one.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ padding: "96px 24px" }}>
      <div style={{ maxWidth: 460, margin: "0 auto", textAlign: "center" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            margin: "0 auto 20px",
            background: "rgba(239,68,68,0.10)",
            border: "1px solid rgba(239,68,68,0.20)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AlertTriangle size={18} color="#EF4444" />
        </div>

        <h1 className="font-display font-bold" style={{ fontSize: 20, color: "#F0F0F5" }}>
          This program page failed to load
        </h1>
        <p style={{ fontSize: 13, color: "#8B8BA7", marginTop: 10, lineHeight: 1.7 }}>
          The underlying data store did not answer. We would rather show this than render a detail
          page with invented cost or salary figures.
        </p>

        {error.digest && (
          <p style={{ fontFamily: "monospace", fontSize: 11, color: "#4A4A6A", marginTop: 12 }}>
            ref {error.digest}
          </p>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
          <button onClick={() => reset()} className="btn-secondary" style={{ padding: "9px 18px", fontSize: 13 }}>
            <RefreshCw size={13} /> Retry
          </button>
          <Link href="/explore" className="btn-ghost" style={{ padding: "9px 14px", fontSize: 13 }}>
            <Compass size={13} /> Back to index
          </Link>
        </div>
      </div>
    </div>
  );
}
