"use client";

import { useState } from "react";
import { Download, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

/**
 * CsvExportButton — downloads the backend's own CSV projection of the live
 * program table.
 *
 * Honesty rules this component is built around:
 *
 *  - It never builds a CSV in the browser. If the backend is unreachable the
 *    button reports the failure; it does not fall back to serialising whatever
 *    happens to be on screen. A file assembled from a different (smaller,
 *    possibly mock-sourced) list than the one the user is looking at is the
 *    exact failure mode the rest of this codebase has been removing.
 *  - It does not report success until the file has actually been handed to the
 *    browser, and it does not report a fabricated row count.
 *
 * `field` and `state` are the only filters the endpoint accepts; both are
 * optional and omitted from the query string when unset rather than sent empty.
 */
export function CsvExportButton({ field, state }: { field?: string; state?: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleExport = async () => {
    setStatus("loading");
    setMessage("");

    try {
      const params = new URLSearchParams();
      if (field) params.set("field", field);
      if (state) params.set("state", state);
      const qs = params.toString();

      const res = await fetch(`/api/colleges/export/csv${qs ? `?${qs}` : ""}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        // Try to read the proxy's structured reason so the message is
        // diagnostic rather than a generic "failed".
        let reason = `Export service returned HTTP ${res.status}.`;
        try {
          const body = await res.json();
          if (typeof body?.reason === "string" && body.reason) reason = body.reason;
        } catch {
          /* non-JSON body; the status-derived message stands. */
        }
        setStatus("error");
        setMessage(reason);
        return;
      }

      const blob = await res.blob();

      // A 200 with an empty body means the query matched no active programs.
      // Handing the user a 0-byte file that opens as a blank sheet reads as a
      // broken download, so it is treated as a failure.
      if (blob.size === 0) {
        setStatus("error");
        setMessage("The export came back empty — no active programs matched this filter.");
        return;
      }

      const disposition = res.headers.get("content-disposition") ?? "";
      const filename =
        disposition.match(/filename="?([^"]+)"?/)?.[1] ?? "indialens-export.csv";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Revoking immediately can cancel the download in Safari; one frame of
      // grace is the conventional fix.
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setStatus("done");
      setMessage("Download started.");
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 4000);
    } catch {
      setStatus("error");
      setMessage("Could not reach the export service. Check your connection and try again.");
    }
  };

  const isLoading = status === "loading";

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={handleExport}
        disabled={isLoading}
        aria-busy={isLoading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {isLoading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Download size={14} className="text-emerald-600" />
        )}
        {isLoading ? "Preparing…" : "Export CSV"}
      </button>

      {status === "error" && message && (
        <p
          role="alert"
          className="max-w-xs text-right text-[11px] text-rose-600 flex items-start gap-1.5"
        >
          <AlertCircle size={12} className="shrink-0 mt-0.5" />
          <span>{message}</span>
        </p>
      )}

      {status === "done" && message && (
        <p role="status" className="text-[11px] text-emerald-600 flex items-center gap-1.5">
          <CheckCircle2 size={12} />
          {message}
        </p>
      )}
    </div>
  );
}
