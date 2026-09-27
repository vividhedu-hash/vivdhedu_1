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
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm p-8 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl">
        {error ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-base font-bold text-white">Authentication Failed</h2>
            <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
            <p className="text-[11px] text-slate-500 mt-2">Redirecting to home in a moment...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#002F6C] border border-[#0077C8]/40 flex items-center justify-center text-[#0077C8]">
              <Loader2 size={24} className="animate-spin" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Finalizing Sign-In</h2>
              <p className="text-xs text-slate-400 mt-1">
                Synchronizing your Career OS and intelligence tokens...
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 mt-2">
              <ShieldCheck size={13} />
              <span>Supabase Authenticated</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
