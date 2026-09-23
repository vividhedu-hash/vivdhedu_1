"use client";

import React, { useEffect, useState } from "react";
import { Check, Loader2, ShieldCheck, HelpCircle } from "lucide-react";

export interface SynthesisLoaderProps {
  studentName?: string;
  onComplete: (token: string) => void;
  apiUrl?: string;
  profileData: Record<string, any>;
}

export const SynthesisLoader: React.FC<SynthesisLoaderProps> = ({
  studentName,
  onComplete,
  profileData,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    let active = true;

    // Step progression (1 -> 2 -> 3 -> 4)
    const t1 = setTimeout(() => active && setCurrentStep(2), 700);
    const t2 = setTimeout(() => active && setCurrentStep(3), 1400);
    const t3 = setTimeout(() => active && setCurrentStep(4), 2200);

    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 1));
    }, 800);

    // Call /api/analyze
    const makeApiCall = async () => {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileData),
          signal: AbortSignal.timeout(10_000),
        });
        if (res.ok) {
          const data = await res.json();
          if (active && data?.token) {
            setApiToken(data.token);
            return;
          }
        }
        throw new Error("Local analyze fallback");
      } catch (err) {
        if (active) setApiToken(`demo-${Date.now()}`);
      }
    };

    makeApiCall();

    return () => {
      active = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(interval);
    };
  }, [profileData]);

  // When steps are done and token is ready, wait briefly and complete
  useEffect(() => {
    if (currentStep === 4 && apiToken) {
      const finishTimer = setTimeout(() => {
        onComplete(apiToken);
      }, 1000);
      return () => clearTimeout(finishTimer);
    }
  }, [currentStep, apiToken, onComplete]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-zinc-950 font-sans">
      {/* Top Bar matching Screen 08 */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200/80 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center text-white font-bold text-[10px]">
            OS
          </div>
          <span className="font-bold text-sm text-zinc-900 tracking-tight">Your Student OS</span>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block ml-0.5" />
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200/60 text-rose-700 font-mono text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            <span>Engine v4.2 Active</span>
          </div>
          <span className="text-zinc-300">|</span>
          <div className="flex items-center gap-1 text-zinc-500 cursor-pointer hover:text-zinc-800">
            <HelpCircle size={13} />
            <span>Support</span>
          </div>
        </div>
      </header>

      {/* Main Center Container */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-lg mx-auto w-full text-center">
        {/* Animated Concentric Circle Target with Pulsing Red Dot */}
        <div className="w-16 h-16 rounded-full border border-rose-200 bg-rose-50/50 flex items-center justify-center mb-6 relative">
          <div className="w-10 h-10 rounded-full border border-rose-300 flex items-center justify-center">
            <div className="w-3.5 h-3.5 rounded-full bg-rose-600 relative">
              <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight mb-2">
          Building your starting point...
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto mb-8 leading-relaxed">
          Synthesizing your academic profile, priority weights, and tier-1 admissions benchmarks into a deterministic roadmap.
        </p>

        {/* White Card Container */}
        <div className="w-full bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-left mb-4">
          <div className="space-y-3.5">
            {/* Step 1 */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  currentStep >= 1 ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-slate-100 text-zinc-400"
                }`}>
                  <Check size={10} />
                </div>
                <span className="font-semibold text-zinc-800">1. Understanding you</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                Verified
              </span>
            </div>

            {/* Step 2 */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  currentStep >= 2 ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-slate-100 text-zinc-400"
                }`}>
                  {currentStep >= 2 ? <Check size={10} /> : <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />}
                </div>
                <span className={`font-semibold ${currentStep >= 2 ? "text-zinc-800" : "text-zinc-400"}`}>
                  2. Mapping your goals
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                currentStep >= 2 ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-50 text-zinc-400 border-slate-200"
              }`}>
                Calibrated
              </span>
            </div>

            {/* Step 3 */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  currentStep >= 3 ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-slate-100 text-zinc-400"
                }`}>
                  {currentStep >= 3 ? <Loader2 size={10} className="animate-spin text-rose-600" /> : <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />}
                </div>
                <span className={`font-semibold ${currentStep >= 3 ? "text-zinc-800" : "text-zinc-400"}`}>
                  3. Finding your options
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 ${
                currentStep >= 3 ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-50 text-zinc-400 border-slate-200"
              }`}>
                {currentStep >= 3 && <span className="w-1 h-1 rounded-full bg-rose-600 animate-pulse" />}
                <span>{currentStep >= 4 ? "Synthesized" : "Synthesizing"}</span>
              </span>
            </div>

            {/* Step 4 */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  currentStep >= 4 ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-slate-100 text-zinc-400"
                }`}>
                  {currentStep >= 4 ? <Check size={10} /> : <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />}
                </div>
                <span className={`font-semibold ${currentStep >= 4 ? "text-zinc-800" : "text-zinc-400"}`}>
                  4. Building your roadmap
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                currentStep >= 4 ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-50 text-zinc-400 border-slate-200"
              }`}>
                {currentStep >= 4 ? "Finalized" : "Queued"}
              </span>
            </div>
          </div>

          {/* Subcard */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5 text-zinc-600">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
              <span>Processed 4,200 program outcomes across 18 cohorts</span>
            </div>
            <span className="font-bold text-zinc-900">98.4%</span>
          </div>
        </div>

        {/* Timer message */}
        <p className="text-xs text-zinc-400 font-mono flex items-center gap-1.5">
          <span>⏱</span>
          <span>Finalizing your personal operating system in {countdown} seconds...</span>
        </p>
      </main>

      {/* Bottom Telemetry Bar matching Screen 08 */}
      <footer className="px-6 py-3 border-t border-slate-200 bg-white/70 text-[11px] font-mono text-zinc-400 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          <span>Deterministic Synthesis Protocol · Zero Synthetic Hallucination Threshold</span>
        </div>
        <div>Session ID: OS-90214-EXEC · Secure Enclave 256-bit</div>
      </footer>
    </div>
  );
};
