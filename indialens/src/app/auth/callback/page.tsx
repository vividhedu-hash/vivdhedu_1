"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase-client";
import { consumeReturnTo } from "@/lib/auth-context";
import { Loader2, AlertCircle, ShieldCheck } from "lucide-react";

/**
 * Only same-origin, absolute-path destinations are honoured. Accepting an
 * arbitrary `?next=` would make this page an open redirect on a URL reached
 * immediately after a credential exchange.
 */
function safeNext(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = getSupabaseClient();
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        // Precedence: an explicit `?next=` wins, otherwise fall back to the
        // destination the user was on when they hit "Sign in", so a gated
        // route is returned to rather than dropped on the landing page.
        const next = safeNext(urlParams.get("next") ?? consumeReturnTo() ?? "/");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw exchangeError;
          }
        } else {
          // If hash tokens were delivered (implicit flow)
          const { error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
        }

        router.replace(next);
      } catch (err: any) {
        console.error("[OAuth Callback] Error establishing session:", err);
        setError(err.message || "Failed to finalize authentication session");
        setTimeout(() => {
          router.replace("/");
        }, 3500);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="t-bg t-text flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="t-surface t-border t-shadow-md w-full max-w-sm rounded-2xl border p-8">
        {error ? (
          <div className="flex flex-col items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: "var(--red-dim)", border: "1px solid var(--red-dim)" }}
              aria-hidden="true"
            >
              <AlertCircle size={24} style={{ color: "var(--red)" }} />
            </div>
            <h2 role="alert" className="text-base font-bold t-text">
              Authentication failed
            </h2>
            <p className="text-xs leading-relaxed" style={{ color: "var(--red)" }}>
              {error}
            </p>
            <p className="mt-2 text-[11px] t-faint">
              Returning you to the home page…
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-dim)" }}
              aria-hidden="true"
            >
              <Loader2 size={24} className="spinner" style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h2 className="text-base font-bold t-text">Finalising sign-in</h2>
              <p className="mt-1 text-xs t-muted">
                Syncing your profile and report tokens…
              </p>
            </div>
            <div
              className="mono mt-2 flex items-center gap-1.5 text-[11px]"
              style={{ color: "var(--green)" }}
            >
              <ShieldCheck size={13} aria-hidden="true" />
              <span>Identity verified</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
