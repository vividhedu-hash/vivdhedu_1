"use client";

import React, { useState } from "react";
import { X, Lock, Mail, ArrowRight, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, loginWithGoogle, loginWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await loginWithEmail(email, name);
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.error || "Authentication failed. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X size={18} />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg bg-[#002F6C] border border-[#0077C8]/40 flex items-center justify-center">
            <Zap size={14} className="text-[#0077C8]" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            The <span className="text-[#0077C8]">Project</span>
          </span>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-white mb-1">
          Sign In to Your Career OS
        </h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Access your longitudinal path DAG, saved degree analyses, and actuarial debt stress tests across all devices.
        </p>

        {errorMessage && (
          <div className="p-3 mb-4 text-xs text-rose-400 bg-rose-950/40 border border-rose-800 rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          onClick={() => loginWithGoogle()}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white text-slate-900 font-semibold text-xs rounded-xl hover:bg-slate-100 transition shadow-md mb-4"
        >
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
          Continue with Google
        </button>

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
            disabled={isSubmitting}
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
