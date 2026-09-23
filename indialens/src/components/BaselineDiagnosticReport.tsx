"use client";

import React from "react";
import {
  Compass,
  Shield,
  Sliders,
  Target,
  ArrowRight,
  Edit3,
  Bookmark,
  HelpCircle,
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
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-zinc-950 font-sans">
      {/* Top Bar matching Screen 09 */}
      <header className="px-6 py-3.5 flex items-center justify-between border-b border-slate-200/80 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center text-white font-bold text-[10px]">
            OS
          </div>
          <span className="font-bold text-sm text-zinc-900 tracking-tight">Student OS</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-zinc-600 font-semibold">
            Stage 09 / 10
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1 text-zinc-500 cursor-pointer hover:text-zinc-800">
            <HelpCircle size={13} />
            <span>Support</span>
          </div>
          <span className="text-zinc-300">|</span>
          <button
            onClick={() => alert("Diagnostic archived to session profile.")}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-zinc-700 font-medium transition cursor-pointer"
          >
            <Bookmark size={12} className="text-zinc-400" />
            <span>Save & Exit</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Title Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200/60 text-rose-700 text-[10px] font-bold font-mono tracking-wider uppercase mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            <span>SYNTHESIS COMPLETE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight mb-1.5">
            Here’s what we know so far.
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-2xl leading-relaxed">
            Your starting profile has been synthesized. We’ve configured your initial models around these parameters.
          </p>
        </div>

        {/* 2x2 Grid of Cards matching Screen 09 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Card 1: ACADEMIC HORIZON */}
          <div className="p-5 rounded-xl border border-slate-200 bg-white relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Compass size={14} className="text-zinc-400" />
                <span className="text-[10px] font-mono uppercase font-bold text-zinc-400">
                  ACADEMIC HORIZON
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                Class 11–12 trajectory
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 block mb-1">Primary Direction</span>
            <h3 className="font-bold text-base text-zinc-900 mb-3">
              Economics, Quantitative Analysis & Computing
            </h3>
            <div className="flex flex-wrap gap-2">
              {["Applied Econometrics", "Stochastic Modeling", "Algorithm Design"].map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-50 text-zinc-700 border border-slate-200"
                >
                  • {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Card 2: CALCULATED DIAGNOSTIC */}
          <div className="p-5 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-rose-500" />
                <span className="text-[10px] font-mono uppercase font-bold text-zinc-400">
                  CALCULATED DIAGNOSTIC
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">Benchmark: Upper Decile</span>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs text-zinc-500">Initial AI Resilience Score</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-zinc-950 font-mono">87</span>
                <span className="text-xs text-zinc-400 font-mono">/100</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div className="w-[87%] h-full bg-rose-600 rounded-full" />
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-zinc-600 leading-relaxed">
              <strong className="text-zinc-900 font-semibold">Core Asset:</strong> Strong quantitative problem solving & independent initiative against emerging computational shifts.
            </div>
          </div>

          {/* Card 3: CALIBRATION VECTORS */}
          <div className="p-5 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <Sliders size={14} className="text-zinc-400" />
              <span className="text-[10px] font-mono uppercase font-bold text-zinc-400">
                CALIBRATION VECTORS
              </span>
            </div>
            <h4 className="text-xs font-bold text-zinc-900 mb-3">Top Decision Weights</h4>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-black text-white text-[10px] font-mono font-bold flex items-center justify-center">1</span>
                    <span className="text-zinc-700">Career outcomes</span>
                  </div>
                  <span className="font-mono font-bold text-zinc-900">95%</span>
                </div>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-[95%] h-full bg-black rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-zinc-800 text-white text-[10px] font-mono font-bold flex items-center justify-center">2</span>
                    <span className="text-zinc-700">Cost & Affordability</span>
                  </div>
                  <span className="font-mono font-bold text-zinc-900">82%</span>
                </div>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-[82%] h-full bg-zinc-800 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-zinc-700 text-white text-[10px] font-mono font-bold flex items-center justify-center">3</span>
                    <span className="text-zinc-700">Prestige</span>
                  </div>
                  <span className="font-mono font-bold text-zinc-900">70%</span>
                </div>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-[70%] h-full bg-zinc-600 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: EXECUTION SCOPE */}
          <div className="p-5 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target size={14} className="text-zinc-400" />
                <span className="text-[10px] font-mono uppercase font-bold text-zinc-400">
                  EXECUTION SCOPE
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 block mb-1">Primary Focus</span>
              <h4 className="font-bold text-sm text-zinc-900 mb-3">
                College discovery + Research portfolio development
              </h4>
            </div>

            <div>
              <span className="text-[11px] text-zinc-400 block mb-1.5">Calculated Constraints</span>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-zinc-400 block">Aid Category</span>
                  <span className="font-bold text-[11px] text-zinc-900 block leading-tight mt-0.5">Need-aware</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-zinc-400 block">Target Geography</span>
                  <span className="font-bold text-[11px] text-zinc-900 block leading-tight mt-0.5">UK / Europe & Hubs</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-zinc-400 block">Performance Cohort</span>
                  <span className="font-bold text-[11px] text-zinc-900 block leading-tight mt-0.5">Top 5% Baseline</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wide Card: Complimentary Advisory Session matching Screen 09 */}
        <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm mb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <Shield size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-zinc-900">Complimentary Advisory Session</h4>
                <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-zinc-900 text-white">
                  Included
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                1 free strategic counselling session reserved for you (with optional parent participation).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">Priority scheduling enabled</span>
            <button
              onClick={() => alert("Advisory consultation booked. Your sovereign profile has been linked.")}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-zinc-800 text-xs font-semibold transition border border-slate-200 cursor-pointer"
            >
              Claim Spot
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Actions matching Screen 09 */}
      <footer className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between">
        <button
          onClick={() => window.location.href = "/onboard"}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-zinc-700 hover:bg-slate-50 transition dashed-ring cursor-pointer"
        >
          <Edit3 size={13} />
          <span>Edit my inputs</span>
        </button>

        <button
          onClick={onEnterWorkspace}
          className="flex items-center gap-2.5 px-6 py-2 rounded-lg bg-black text-white text-xs font-semibold hover:bg-zinc-800 transition dashed-ring cursor-pointer"
        >
          <span>See my starting point</span>
          <ArrowRight size={14} className="text-rose-500" />
        </button>
      </footer>
    </div>
  );
};
