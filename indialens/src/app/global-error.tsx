"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary.
 *
 * Replaces the entire document, including `<html>` and `<body>` — which means
 * it cannot use the app layout, the navbar, or the CSS variables defined on
 * `:root`. Any styling here must be self-contained inline styles or plain
 * Tailwind utilities that need no theme token, or the fallback page itself
 * renders unstyled and useless.
 *
 * It only fires when a failure happens in the root layout itself, which is
 * rare. It is included because the one case it covers is the one case where the
 * user would otherwise be shown a raw browser error page.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] Root layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#F8FAFC",
          color: "#09090B",
          fontFamily:
            "-apple-system, 'SF Pro Text', 'Inter', BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.09)",
            borderRadius: 16,
            padding: 32,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          <p
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#E11D48",
              margin: "0 0 8px",
            }}
          >
            Application error
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            The app could not start
          </h1>
          <p style={{ fontSize: 14, color: "#52525B", lineHeight: 1.6, margin: "0 0 20px" }}>
            A failure in the root layout took the whole site down, so navigation is unavailable.
            Reloading is the only recovery.
          </p>

          {error.digest && (
            <p
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: 11,
                color: "#A1A1AA",
                margin: "0 0 20px",
                wordBreak: "break-all",
              }}
            >
              ref {error.digest}
            </p>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => reset()}
              style={{
                padding: "10px 18px",
                background: "#09090B",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 9999,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload
            </button>
            <button
              onClick={() => {
                if (typeof window !== "undefined") window.location.href = "/";
              }}
              style={{
                padding: "10px 18px",
                background: "rgba(0,0,0,0.05)",
                color: "#09090B",
                border: "1px solid rgba(0,0,0,0.09)",
                borderRadius: 9999,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Go to home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
