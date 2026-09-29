"use client";

import { useState } from "react";
import { Download, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Skeleton } from "./Skeleton";

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
 *    optional and omitted from the query string when unset rather than sent empty.
 *
 * The fetch logic and the status machine are untouched. What changed is the
 * control and the two status lines:
 *
 *  - `focus:outline-none focus:ring-2 focus:ring-blue-500` was a focus
 *    treatment that only ever rendered in Tailwind's default blue — it did not
 *    theme, and it replaced the product's single `:focus-visible` ring with a
 *    second, differently-coloured one. `.btn-secondary` uses the global rule,
 *    so the ring is now `--focus-ring` in both themes. No focus style is
 *    removed, it is unified with the rest of the product.
 *  - The in-flight state is a width-stable button with a `.spinner` (this is a
 *    user-initiated action, which is the one case where a spinner is correct —
 *    the user pressed a button and knows something is in flight). The previous
 *    `animate-spin` `Loader2` is the same thing wearing a hardcoded currentColor
 *    that inherited a hardcoded grey currentColor; `.spinner` draws its track
 *    in `--border-focus` and its arc in `--accent`, so it is visible in both
 *    themes.
 *  - Success and failure are stated as they are, in `--green` and `--red`, with
 *    `role="status"` and `role="alert"` preserved. `AlertCircle` and
 *    `CheckCircle2` are decorative; the message carries the meaning, so they are
 *    `aria-hidden` and the colour is not the only channel.
 *
 * The pending bar is a `.skeleton` rather than a new element type, so the
 * "preparing" state is the same primitive every other loading state in the
 * product uses.
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
        type="button"
        onClick={handleExport}
        disabled={isLoading}
        aria-busy={isLoading}
        className="btn-secondary text-[12px]"
      >
        {isLoading ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Preparing…
          </>
        ) : (
          <>
            <Download size={13} style={{ color: "var(--green)" }} aria-hidden="true" />
            Export CSV
          </>
        )}
      </button>

      {isLoading && (
        <Skeleton className="h-2.5 w-28" />
      )}

      {status === "error" && message && (
        <p
          role="alert"
          className="flex max-w-xs items-start gap-1.5 text-right text-[11px]"
          style={{ color: "var(--red)" }}
        >
          <AlertCircle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{message}</span>
        </p>
      )}

      {status === "done" && message && (
        <p
          role="status"
          className="flex items-center gap-1.5 text-[11px]"
          style={{ color: "var(--green)" }}
        >
          <CheckCircle2 size={12} aria-hidden="true" />
          {message}
        </p>
      )}
    </div>
  );
}
