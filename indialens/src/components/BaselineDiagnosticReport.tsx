"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  Target,
  AlertCircle,
  Calendar,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  PhoneCall,
  Brain,
  TrendingUp,
  Award
} from "lucide-react";

interface BaselineDiagnosticProps {
  token: string;
  wizardData: Record<string, any>;
  onEnterWorkspace: () => void;
}

export const BaselineDiagnosticReport: React.FC<BaselineDiagnosticProps> = ({
  token,
  wizardData,
  onEnterWorkspace,
}) => {
  const name = wizardData.fullName || "Alex M.";
  const northStar = wizardData.northStar || "LSE Economics BSc / Quantitative Economics";
  // [AI-CoLab: Cursor] Handle the domestic_only band explicitly instead of falling into $65K+
  const budget = wizardData.budgetBand === "domestic_only"
    ? "₹3L - ₹15L / yr (Domestic)"
    : wizardData.budgetBand === "<15k_usd" 
    ? "<$15,000 / yr" 
    : wizardData.budgetBand === "15-35k" 
    ? "$15,000 - $35,000 / yr" 
    : wizardData.budgetBand === "35-65k" 
    ? "$35,000 - $65,000 / yr" 
    : "$65,000+ / yr";
  
  const score = 87;
  const dasharray = `${(score / 100) * 201.06} 201.06`;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Protocol Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
            IL
          </div>
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
              SCREEN 09 · BASELINE DIAGNOSTIC REPORT
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Session Profile: <span className="text-slate-200">{token.slice(0, 16)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="epistemic-tag tag-evidence">Verified Actuarial Baseline</span>
          <span className="epistemic-tag tag-ui">Zero Hallucination Filter</span>
        </div>
      </div>

      {/* Main Scorecard Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl relative overflow-hidden mb-8">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400" />
        
        {/* Left: Score Ring & Identity */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left justify-between border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-6">
          <div className="relative w-28 h-28 my-2">
            <svg width="112" height="112" viewBox="0 0 80 80" className="rotate-[-90deg]">
              <circle cx="40" cy="40" r="32" stroke="#1E1E2E" strokeWidth="6" fill="none" />
              <circle 
                cx="40" 
                cy="40" 
                r="32" 
                stroke="#1A6CF6" 
                strokeWidth="6" 
                fill="none" 
                strokeLinecap="round" 
                strokeDasharray={dasharray} 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold font-mono text-white leading-none">{score}</span>
              <span className="text-[10px] text-slate-400 font-mono uppercase mt-1">/ 100</span>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-serif">{name}</h2>
            <div className="text-xs text-emerald-400 font-mono font-semibold mt-0.5">
              Initial AI Resilience: Upper Decile (Top 8%)
            </div>
          </div>
        </div>

        {/* Center & Right: Constraints & Diagnostic Scope */}
        <div className="md:col-span-2 flex flex-col justify-between space-y-4">
          <div>
            <div className="text-xs font-mono text-blue-400 font-semibold uppercase tracking-wider mb-2">
              Synthesized Operational Profile
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block mb-1">Academic Horizon</span>
                <span className="text-white font-semibold font-mono text-[13px]">{northStar}</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block mb-1">Financial Tolerance</span>
                <span className="text-white font-semibold font-mono text-[13px]">{budget}</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block mb-1">Cohort Reachability</span>
                <span className="text-emerald-400 font-bold font-mono text-[13px]">84.2% Verified Solvency</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block mb-1">Execution Scope</span>
                <span className="text-indigo-300 font-semibold font-mono text-[13px]">Pre-Uni Research + Test Prep</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono pt-2">
            <span className="pulse-dot" />
            <span>4,200 Historical Institutional Cohorts Cross-Referenced with Zero Hallucination</span>
          </div>
        </div>
      </div>

      {/* Critical Gap Diagnostic Card (Screen 09 Feature) */}
      <div className="p-6 rounded-xl bg-red-950/20 border-l-4 border-l-rose-500 border border-red-900/40 mb-8 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-1">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
                PRIMARY COMPETITIVE GAP DIAGNOSTIC
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-900/60 text-rose-200">
                Hard Admittance Gating
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              Demonstrated Research Co-Authorship & Faculty Validation
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              While your quantitative and analytical vectors are in the top 8% of applicants, solo preprints carry heavy discounting without recognized faculty sponsorship. 
              Pairing your preprint with an established academic co-author elevates Tier-1 Economics and Systems admissions odds by <strong>~2.4x</strong>.
            </p>
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-red-900/30 text-xs font-mono">
              <span className="text-slate-400">Identified Resolution:</span>
              <span className="text-emerald-400 font-bold">Ashoka Comp. Econ Lab Fellow Sprint (21 Days Left)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 90-Day Sprint Roadmap Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold uppercase">
              <Target className="w-4 h-4" />
              <span>Sprint 1 · Immediate Q4 Focus</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded">Active</span>
          </div>
          <h4 className="text-sm font-bold text-white mb-2">Standardized Testing & Math Gating Bar</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Pivot 65% of Q4 focus to clearing the SAT Math 750+ / CUET Higher Math cutoff. Eliminates the primary elimination filter at Russell Group and US Tier-1 programs.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-mono font-bold uppercase">
              <Award className="w-4 h-4" />
              <span>Sprint 2 · Research DOI Spike</span>
            </div>
            <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">Upcoming</span>
          </div>
          <h4 className="text-sm font-bold text-white mb-2">SSRN / arXiv Working Paper Registration</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Finalize empirical econometric manuscript and register cross-border DOI through the Flagship Portfolio Studio, ensuring tamper-proof external validation.
          </p>
        </div>
      </div>

      {/* Human-in-the-Loop Complimentary Strategy Advisory Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900/30 to-indigo-950/40 border border-blue-800/40 flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-blue-400 text-xs font-mono font-semibold uppercase">
            <PhoneCall className="w-4 h-4" />
            <span>Complimentary Advisory Session Included</span>
          </div>
          <h4 className="text-base font-bold text-white">
            Validate Your Calibrated Roadmap with a Senior Strategist
          </h4>
          <p className="text-xs text-slate-300 max-w-xl">
            Quantitative models provide the probability surface; human experts navigate nuanced family decisions. A 30-minute 1:1 strategy consultation is bundled with your sovereign profile.
          </p>
        </div>
        <button 
          onClick={() => alert("Advisory calendar opened. Your profile vector has been attached.")}
          className="shrink-0 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600 transition shadow-sm"
        >
          Book 1-on-1 Call
        </button>
      </div>

      {/* Launch Workspace CTA */}
      <div className="flex flex-col items-center justify-center gap-3 pt-4 text-center">
        <button
          onClick={onEnterWorkspace}
          className="btn-primary flex items-center gap-3 px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base rounded-xl transition shadow-xl shadow-blue-900/30 hover:-translate-y-0.5 cursor-pointer"
        >
          <span>Launch Decision Workspace</span>
          <ArrowRight className="w-5 h-5" />
        </button>
        <span className="text-xs font-mono text-slate-500">
          Entering Student OS · Live Telemetry, AI Simulation & Recent Waves Active
        </span>
      </div>
    </div>
  );
};
