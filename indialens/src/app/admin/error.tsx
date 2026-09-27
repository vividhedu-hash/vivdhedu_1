"use client";

import { AlertTriangle, RefreshCw, Shield } from "lucide-react";

/**
 * /admin error boundary.
 *
 * No "sign in" link here: the session gate and the key gate both live inside
 * the page, so any link out of this boundary would bypass the audit trail for
 * whatever action actually failed. Retry only.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ padding: "80px 24px" }}>
      <div style={{ maxWidth: 440, margin: "0 auto", textAlign: "center" }}>
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

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}>
          <Shield size={12} color="#4F6EF7" />
          <span style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4A4A6A" }}>
            Admin console
          </span>
        </div>

        <h1 className="font-display font-bold" style={{ fontSize: 20, color: "#F0F0F5" }}>
          The admin console failed to render
        </h1>
        <p style={{ fontSize: 13, color: "#8B8BA7", marginTop: 10, lineHeight: 1.7 }}>
          Nothing was changed. If a retrain or scrape trigger was in flight when this fired, check
          the backend log before re-issuing it — some actions are not idempotent.
        </p>

        {error.digest && (
          <p style={{ fontFamily: "monospace", fontSize: 11, color: "#4A4A6A", marginTop: 12 }}>
            ref {error.digest}
          </p>
        )}

        <button
          onClick={() => reset()}
          className="btn-secondary"
          style={{ padding: "9px 18px", fontSize: 13, marginTop: 22 }}
        >
          <RefreshCw size={13} /> Retry
        </button>
      </div>
    </div>
  );
}
