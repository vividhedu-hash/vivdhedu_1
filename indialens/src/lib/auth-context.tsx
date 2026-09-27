"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getSupabaseClient } from "./supabase-client";
import { BRAND } from "./brand";

/**
 * Supabase Auth is the single source of truth for "is this browser signed in".
 *
 * This file previously carried a development-only sign-in helper that
 * fabricated a complete session whenever OAuth returned an error: a random
 * pseudo-token string in localStorage, a stock avatar, and a hardcoded
 * placeholder address on a now-retired domain. `AuthProvider` then rehydrated
 * that fake session on every page load, so a misconfigured or rate-limited
 * provider looked like a successful sign-in and survived reloads. Any error
 * path that invents an identity is worse than a visible failure, so all of it
 * is gone: errors are returned to the caller and surfaced in the auth modal.
 */

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at?: string;
}

/** Result of a sign-in attempt. Errors are reported, never substituted. */
export type LoginResult = { success: true } | { success: false; error: string };

export type EmailLoginResult =
  | { success: true; isOtpSent: true }
  | { success: false; error: string };

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  loginWithGoogle: () => Promise<LoginResult>;
  loginWithGithub: () => Promise<LoginResult>;
  loginWithEmail: (email: string, name?: string) => Promise<EmailLoginResult>;
  logout: () => void;
  saveReport: (reportToken: string, title?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Local mirror of the Supabase access token, kept so other code can read the
 * current session without a second round trip to Supabase.
 *
 * This is NOT a credential of its own: it is the same HS256 token Supabase
 * already issued, and the backend verifies it with the Supabase JWT secret.
 * The key is derived from BRAND so the product rename does not leave stale
 * branding behind, and it is deliberately distinct from the key Supabase uses
 * for its own session store — writing a raw token over Supabase's session blob
 * corrupted the session on the next reload.
 */
const TOKEN_KEY = `${brandSlug()}_auth_token`;

/**
 * Where the user was when they hit "Sign in", so OAuth can return them to the
 * route they asked for instead of dropping them on the landing page.
 *
 * `AuthGate` never redirects — it renders a sign-in wall in place of the page —
 * so this is the only thing carrying the intended destination across the OAuth
 * round trip. Without it, a student who opens /workspace, hits the wall, signs
 * in, and lands on the homepage has to navigate back to the tool they came for.
 *
 * `sessionStorage`, not `localStorage`: this is per-tab intent, not a durable
 * preference. A user who abandons a sign-in in one tab should not be silently
 * redirected there days later in another.
 */
const RETURN_TO_KEY = "vividhedu_auth_return_to";

/** Records the current path as the post-sign-in destination. */
export function rememberReturnTo(path?: string): void {
  if (typeof window === "undefined") return;
  try {
    const target = path ?? `${window.location.pathname}${window.location.search}`;
    // Only same-origin, absolute paths. Storing an absolute URL would make the
    // OAuth callback an open redirect.
    if (!target.startsWith("/") || target.startsWith("//")) return;
    window.sessionStorage.setItem(RETURN_TO_KEY, target);
  } catch {
    // Storage unavailable; the user simply returns to the landing page.
  }
}

/**
 * Reads and clears the stored destination. Single-use, so a later sign-in is
 * not redirected to a stale path. Returns null when nothing was stored or the
 * stored value is not a same-origin path.
 */
export function consumeReturnTo(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(RETURN_TO_KEY);
    window.sessionStorage.removeItem(RETURN_TO_KEY);
    if (!stored) return null;
    if (!stored.startsWith("/") || stored.startsWith("//")) return null;
    return stored;
  } catch {
    return null;
  }
}

/** Brand-derived, storage-safe. Declared before TOKEN_KEY uses it. */
function brandSlug(): string {
  return BRAND.name.replace(/[^a-z0-9_-]/gi, "").toLowerCase() || "vividhedu";
}

/**
 * Builds a user from a Supabase auth record.
 *
 * Note what is deliberately absent: premium status. `user_metadata` is
 * writable by the account holder through the Supabase client, so deriving an
 * entitlement flag from it meant anyone could grant themselves the PRO badge by
 * editing their own profile. Entitlement is server-owned state and is not read
 * from client-writable metadata here.
 */
function mapSupabaseUser(supabaseUser: any): AuthUser {
  const meta = supabaseUser.user_metadata || {};
  const email = supabaseUser.email || "";
  const localPart = email.includes("@") ? email.split("@")[0] : "";
  const name = meta.full_name || meta.name || (localPart ? localPart.charAt(0).toUpperCase() + localPart.slice(1) : "Scholar");

  return {
    id: supabaseUser.id,
    email,
    full_name: name,
    avatar_url: meta.avatar_url || meta.picture || null,
    created_at: supabaseUser.created_at,
  };
}

/**
 * Drops the local token mirror.
 *
 * Note what is deliberately NOT here: `theproject_auth_token`. That key is also
 * the name `supabase-client.ts` passes to Supabase as its own `storageKey`, so
 * it holds a serialized Supabase session, not a bare token. Removing it here
 * would sign out every real user on their next load. Supabase owns and clears
 * its own session; this mirror is a convenience copy in a separate key.
 */
export function clearStoredTokens(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    // A storage failure (private mode, disabled cookies) must not break auth:
    // Supabase's own session is the authority, this mirror is a convenience.
    console.warn("[Auth] Could not clear stored auth token:", err);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Synchronize auth state with Supabase Auth
  useEffect(() => {
    const supabase = getSupabaseClient();

    // 1. Initial session hydration — Supabase's session is the only thing that
    //    can produce a signed-in user. Anything else is treated as signed out.
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          setUser(mapSupabaseUser(session.user));
          setToken(session.access_token);
          try {
            window.localStorage.setItem(TOKEN_KEY, session.access_token);
          } catch {
            // Non-fatal: see clearStoredTokens.
          }
        } else {
          setUser(null);
          setToken(null);
          clearStoredTokens();
        }
      })
      .catch((err) => {
        // A failed session fetch means "not signed in", never "signed in as
        // someone invented". Surfaced so a broken Supabase config is visible.
        console.error("[Auth] Session fetch failed; treating as signed out:", err);
        setUser(null);
        setToken(null);
        clearStoredTokens();
      })
      .finally(() => {
        setIsLoading(false);
      });

    // 2. Real-time auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
        setToken(session.access_token);
        try {
          window.localStorage.setItem(TOKEN_KEY, session.access_token);
        } catch {
          // Non-fatal: see clearStoredTokens.
        }
      } else {
        setUser(null);
        setToken(null);
        clearStoredTokens();
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Shared OAuth initiation. Returns a real error on failure; never signs the
   * user in as a substitute identity.
   */
  const startOAuth = useCallback(async (provider: "google" | "github", label: string): Promise<LoginResult> => {
    try {
      rememberReturnTo();
      const supabase = getSupabaseClient();
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : "http://localhost:3000/auth/callback";

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectUrl },
      });

      if (error) {
        // Supabase reports a disabled or misconfigured provider here. That is a
        // deployment fault, so it is logged loudly and shown to the user rather
        // than papered over.
        console.error(`[Auth] ${label} sign-in could not be started:`, error.message);
        return { success: false, error: humanizeAuthError(error.message, provider) };
      }

      // A successful call redirects the browser away; reaching this line means
      // the redirect did not happen, so no session was established.
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Auth] Unexpected error during ${label} sign-in:`, err);
      return { success: false, error: humanizeAuthError(message, provider) };
    }
  }, []);

  const loginWithGoogle = useCallback(() => startOAuth("google", "Google"), [startOAuth]);

  const loginWithGithub = useCallback(() => startOAuth("github", "GitHub"), [startOAuth]);

  const loginWithEmail = useCallback(
    async (email: string, name?: string): Promise<EmailLoginResult> => {
      try {
        rememberReturnTo();
        const supabase = getSupabaseClient();
        const redirectUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : "http://localhost:3000/auth/callback";

        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: name || (email.includes("@") ? email.split("@")[0] : "Student Scholar"),
            },
          },
        });

        if (error) {
          // Rate limits and provider outages land here. The honest response is
          // to say the link was not sent.
          console.error("[Auth] Email OTP could not be sent:", error.message);
          return { success: false, error: humanizeAuthError(error.message, "email") };
        }

        return { success: true, isOtpSent: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[Auth] Unexpected error during email sign-in:", err);
        return { success: false, error: humanizeAuthError(message, "email") };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch (err) {
      // Even if the network call fails, the local session must go: leaving a
      // signed-in UI behind because signOut threw would be its own bug.
      console.error("[Auth] Sign-out request failed; clearing local session:", err);
    } finally {
      clearStoredTokens();
      setToken(null);
      setUser(null);
    }
  }, []);

  const saveReport = useCallback(
    async (reportToken: string, title?: string): Promise<boolean> => {
      if (!user) {
        setIsAuthModalOpen(true);
        return false;
      }
      try {
        const res = await fetch("/api/report/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            token: reportToken,
            title: title || "Degree ROI Analysis",
            user_id: user.id,
          }),
        });
        return res.ok;
      } catch (err) {
        console.error("[Auth] Saving report failed:", err);
        return false;
      }
    },
    [user, token]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loginWithGoogle,
        loginWithGithub,
        loginWithEmail,
        logout,
        saveReport,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Turns a provider error into something a student can act on.
 *
 * Supabase's raw messages name internal failure modes; the most common real
 * causes are a provider that has not been enabled in the Supabase project or a
 * redirect URL that is not on the allow list, so those are called out
 * explicitly instead of being shown as a bare status code.
 */
function humanizeAuthError(raw: string, provider: "google" | "github" | "email"): string {
  const message = raw.toLowerCase();
  const label = provider === "email" ? "email link" : `${provider} sign-in`;

  if (message.includes("rate") || message.includes("too many") || message.includes("429")) {
    return `Too many attempts at ${label}. Please wait a few minutes and try again.`;
  }
  if (message.includes("disabled") || message.includes("not enabled") || message.includes("provider is not")) {
    return `${provider} sign-in is not available right now. Please use email sign-in, or contact support if this keeps happening.`;
  }
  if (message.includes("redirect") || message.includes("url") || message.includes("not allowed")) {
    return `${provider} sign-in could not be completed because of a redirect configuration problem. Our team has been notified.`;
  }
  if (message.includes("fetch") || message.includes("network") || message.includes("failed to fetch")) {
    return `Could not reach the sign-in service. Please check your connection and try again.`;
  }
  return `${provider === "email" ? "Email sign-in" : `${provider} sign-in`} could not be completed. Please try again.`;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
