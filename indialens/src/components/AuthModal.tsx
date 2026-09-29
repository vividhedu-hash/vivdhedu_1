"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Lock, Mail, ArrowRight, ShieldCheck, Zap, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { BRAND } from "@/lib/brand";

export function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, loginWithGoogle, loginWithGithub, loginWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  /* Focus handling. A modal that appears without moving focus is invisible to a
     keyboard user, and one that leaves focus on <body> after closing strands
     them at the top of the document. Focus moves in on open, to the first
     field, and back to the invoking element on close. */
  useEffect(() => {
    if (!isAuthModalOpen) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    emailRef.current?.focus();
    return () => returnFocusRef.current?.focus?.();
  }, [isAuthModalOpen]);

  /* Escape closes, and Tab is kept inside the panel. Without the focus trap,
     Tab walks into the page behind the overlay, which is visible and looks
     interactive but is unreachable by design. */
  useEffect(() => {
    if (!isAuthModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAuthModalOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isAuthModalOpen, setIsAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setOtpSent(false);

    const res = await loginWithEmail(email, name);
    setIsSubmitting(false);
    if (res.success) {
      if (res.isOtpSent) {
        setOtpSent(true);
      }
    } else {
      setErrorMessage(res.error || "Authentication failed. Please try again.");
    }
  };

  const handleGoogleLogin = async () => {
    setOauthLoading("google");
    setErrorMessage(null);
    const res = await loginWithGoogle();
    setOauthLoading(null);
    // A successful OAuth call navigates away and never resolves here. Reaching
    // this line therefore means the flow did not start, and the returned error
    // is the only signal the user gets — it must not be swallowed.
    if (!res.success) {
      setErrorMessage(res.error || "Could not start Google sign-in.");
    }
  };

  const handleGithubLogin = async () => {
    setOauthLoading("github");
    setErrorMessage(null);
    const res = await loginWithGithub();
    setOauthLoading(null);
    if (!res.success) {
      setErrorMessage(res.error || "Could not start GitHub sign-in.");
    }
  };

  return (
    <div
      // The backdrop is presentational; the dialog is named and described so a
      // screen reader announces what opened rather than just "dialog".
      onClick={() => setIsAuthModalOpen(false)}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      // A token scrim, not `bg-black/85`. A hardcoded black scrim is opaque
      // in both themes: in light mode it is an unnaturally heavy black wall
      // over a white page, and in dark mode it is indistinguishable from the
      // page. `--bg-overlay` at 72% gives the same separation in each palette.
      style={{ background: "color-mix(in srgb, var(--bg) 72%, transparent)" }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        aria-describedby="auth-modal-desc"
        // Click inside must not bubble to the backdrop and close the dialog
        // mid-sign-in.
        onClick={(e) => e.stopPropagation()}
        className="t-elevated t-border t-shadow-lg relative w-full max-w-md rounded-2xl border p-6 t-text"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsAuthModalOpen(false)}
          aria-label="Close sign in"
          className="t-faint hover:t-text absolute right-4 top-4 rounded-lg p-1.5 transition-colors"
          style={{ borderRadius: "var(--r-sm)" }}
        >
          <X size={18} aria-hidden="true" />
        </button>

        {/* Brand Header */}
        <div className="mb-2 flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: "var(--accent)" }}
            aria-hidden="true"
          >
            <Zap size={14} style={{ color: "var(--text-inverse)" }} />
          </div>
          <span className="text-base font-extrabold tracking-tight t-text">
            {BRAND.name}
          </span>
        </div>

        <h2 id="auth-modal-title" className="mb-1 text-xl font-bold tracking-tight t-text">
          Sign in to {BRAND.name}
        </h2>
        <p id="auth-modal-desc" className="mb-5 text-xs leading-relaxed t-muted">
          Sign in to keep your saved reports and open them on any device. Without an account, a
          report is reachable only by its link.
        </p>

        {errorMessage && (
          <div role="alert" className="notice notice-err mb-4">
            {errorMessage}
          </div>
        )}

        {otpSent ? (
          <div className="notice notice-ok mb-4">
            <CheckCircle2 size={17} className="notice-icon" style={{ color: "var(--green)" }} />
            <div>
              <p className="t-text font-semibold">Magic link sent</p>
              <p className="mt-1 leading-relaxed t-muted">
                Check your inbox at <span className="num">{email}</span> and click the link to
                verify your session.
              </p>
            </div>
          </div>
        ) : null}

        {/* Social OAuth Buttons */}
        <div className="mb-4 space-y-2.5">
          {/* Google OAuth Button.
              The four brand fills in the inline SVG are Google's own marks and
              are deliberately left literal — they are a third party's identity
              and have nothing to do with this product's palette. */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={oauthLoading !== null}
            className="btn-secondary w-full disabled:opacity-60"
          >
            {oauthLoading === "google" ? (
              <Loader2 size={16} className="spinner" aria-hidden="true" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            {oauthLoading === "google" ? "Redirecting to Google…" : "Continue with Google"}
          </button>

          {/* GitHub OAuth Button */}
          <button
            type="button"
            onClick={handleGithubLogin}
            disabled={oauthLoading !== null}
            className="btn-secondary w-full disabled:opacity-60"
          >
            {oauthLoading === "github" ? (
              <Loader2 size={16} className="spinner" aria-hidden="true" />
            ) : (
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            )}
            {oauthLoading === "github" ? "Redirecting to GitHub…" : "Continue with GitHub"}
          </button>
        </div>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: "var(--divider)" }} />
          <span className="metric-label">Or a one-time email link</span>
          <div className="h-px flex-1" style={{ background: "var(--divider)" }} />
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <div>
            {/* `htmlFor`/`id` pairing: a <label> wrapping nothing gives a
                screen reader an unassociated text node instead of a field
                label, and clicking the label does not focus the input. */}
            <label htmlFor="auth-name" className="form-label">
              Your name (optional)
            </label>
            <input
              id="auth-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="e.g. Arjun Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input text-[13px]"
            />
          </div>

          <div>
            <label htmlFor="auth-email" className="form-label">
              Institutional or personal email
            </label>
            <div className="relative">
              <Mail
                className="t-faint absolute left-3 top-1/2 -translate-y-1/2"
                size={14}
                aria-hidden="true"
              />
              <input
                id="auth-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                ref={emailRef}
                aria-describedby="auth-email-hint"
                aria-invalid={!!errorMessage}
                placeholder="student@college.edu or name@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input pl-9 text-[13px]"
              />
            </div>
            <p id="auth-email-hint" className="mt-1.5 text-[11px] t-faint">
              We send a one-time sign-in link. No password is created or stored.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || oauthLoading !== null}
            className="btn-accent w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Authenticating…" : "Send my sign-in link"}
            <ArrowRight size={13} aria-hidden="true" />
          </button>
        </form>

        {/* Trust Badges */}
        <div
          className="mt-6 flex items-center justify-between border-t pt-4"
          style={{ borderColor: "var(--divider)" }}
        >
          <span className="mono flex items-center gap-1 text-[11px] t-faint">
            <Lock size={11} style={{ color: "var(--green)" }} aria-hidden="true" />
            Encrypted in transit
          </span>
          <span className="mono flex items-center gap-1 text-[11px] t-faint">
            <ShieldCheck size={11} style={{ color: "var(--teal)" }} aria-hidden="true" />
            No ads, no data sold
          </span>
        </div>
      </div>
    </div>
  );
}
