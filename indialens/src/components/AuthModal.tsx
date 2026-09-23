"use client";

import React, { useState } from "react";
import { X, Lock, Mail, ArrowRight, ShieldCheck, Zap, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, loginWithGoogle, loginWithGithub, loginWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);

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
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to initiate Google sign-in.");
      setOauthLoading(null);
    }
  };

  const handleGithubLogin = async () => {
    setOauthLoading("github");
    setErrorMessage(null);
    try {
      await loginWithGithub();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to initiate GitHub sign-in.");
      setOauthLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md p-6 bg-[#0A0A0A] border border-white/[0.1] rounded-2xl shadow-2xl text-[#F5F5F7]">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-[#86868B] hover:text-[#F5F5F7] rounded-lg hover:bg-white/[0.06] transition"
        >
          <X size={18} />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg bg-[#E11D48] flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-[#F5F5F7]">
            India<span className="text-[#E11D48]">Lens</span>
          </span>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-white mb-1">
          Sign In to Your Career OS
        </h2>
        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          Access your longitudinal path DAG, saved degree analyses, and actuarial debt stress tests across all devices.
        </p>

        {errorMessage && (
          <div className="p-3 mb-4 text-xs text-rose-400 bg-rose-950/40 border border-rose-800 rounded-lg">
            {errorMessage}
          </div>
        )}

        {otpSent ? (
          <div className="p-4 mb-4 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-800 rounded-xl flex items-start gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-200">Magic Link Dispatched</p>
              <p className="mt-1 text-slate-300 leading-relaxed">
                Check your inbox at <span className="font-mono text-emerald-300">{email}</span> and click the link to instantly verify your session.
              </p>
            </div>
          </div>
        ) : null}

        {/* Social OAuth Buttons */}
        <div className="space-y-2.5 mb-4">
          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={oauthLoading !== null}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white text-slate-900 font-semibold text-xs rounded-xl hover:bg-slate-100 transition shadow-md disabled:opacity-60"
          >
            {oauthLoading === "google" ? (
              <Loader2 size={16} className="animate-spin text-slate-700" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            {oauthLoading === "google" ? "Redirecting to Google..." : "Continue with Google"}
          </button>

          {/* GitHub OAuth Button */}
          <button
            onClick={handleGithubLogin}
            disabled={oauthLoading !== null}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs rounded-xl border border-slate-700 transition shadow-sm disabled:opacity-60"
          >
            {oauthLoading === "github" ? (
              <Loader2 size={16} className="animate-spin text-slate-300" />
            ) : (
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            )}
            {oauthLoading === "github" ? "Redirecting to GitHub..." : "Continue with GitHub"}
          </button>
        </div>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[11px] font-mono text-slate-500 uppercase">Or Passwordless Email</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              Your Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Arjun Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-[#0077C8]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              Institutional or Personal Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-slate-500" size={14} />
              <input
                type="email"
                required
                placeholder="student@college.edu or name@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-[#0077C8]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || oauthLoading !== null}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0077C8] hover:bg-[#0077C8]/90 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-blue-900/20 disabled:opacity-50"
          >
            {isSubmitting ? "Authenticating..." : "Send Magic Session Key"}
            <ArrowRight size={13} />
          </button>
        </form>

        {/* Trust Badges */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <Lock size={11} className="text-emerald-400" /> 256-bit Encrypted
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck size={11} className="text-[#0077C8]" /> Zero Ads / No Data Sold
          </span>
        </div>
      </div>
    </div>
  );
}
