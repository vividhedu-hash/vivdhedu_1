"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  TrendingUp,
  Shield,
  Zap,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Sliders,
  AlertTriangle,
  ArrowRight,
  Info,
  Calendar,
  Layers,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  Award,
} from "lucide-react";
import { TiltCard } from "@/components/ui/TiltCard";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { playSliderTick, playUiPop, playSuccessChime, isAudioMuted, setAudioMuted } from "@/lib/ui-sound";

interface Archetype {
  id: string;
  name: string;
  badge: string;
  costLakhs: number;
  startingLpa: number;
  baseGrowthPct: number;
  baseAiExposurePct: number;
  placementRate: number;
}

const ARCHETYPES: Archetype[] = [
  {
    id: "premier-tech",
    name: "IIT / BITS Premier Tech",
    badge: "Tier-1 Engineering",
    costLakhs: 16,
    startingLpa: 22,
    baseGrowthPct: 14,
    baseAiExposurePct: 18,
    placementRate: 94,
  },
  {
    id: "tier1-mgmt",
    name: "IIM / XLRI Flagship Mgmt",
    badge: "Tier-1 Management",
    costLakhs: 26,
    startingLpa: 28,
    baseGrowthPct: 16,
    baseAiExposurePct: 14,
    placementRate: 96,
  },
  {
    id: "private-stem",
    name: "Leading Private STEM",
    badge: "Tier-2 Tech",
    costLakhs: 22,
    startingLpa: 11,
    baseGrowthPct: 11,
    baseAiExposurePct: 26,
    placementRate: 82,
  },
  {
    id: "state-stem",
    name: "State University STEM",
    badge: "Public Tech",
    costLakhs: 6,
    startingLpa: 6.5,
    baseGrowthPct: 9,
    baseAiExposurePct: 32,
    placementRate: 68,
  },
];

const CAREER_MILESTONES = [
  { year: 0, label: "Matriculation", icon: GraduationCap, tip: "Initial tuition outlay & living investment" },
  { year: 4, label: "First Placement", icon: Briefcase, tip: "Graduation and entry into formal labour market" },
  { year: 7, label: "Zero Debt Breakeven", icon: CheckCircle2, tip: "Full payback of tuition & living capital outlay" },
  { year: 12, label: "Senior/Lead Inflection", icon: TrendingUp, tip: "High leverage domain leadership & equity vesting" },
  { year: 20, label: "20-Year Terminal Wealth", icon: Award, tip: "Cumulative discounted actuarial net capital" },
];

export function InteractiveActuarialCockpit() {
  const [selectedArchId, setSelectedArchId] = useState<string>("premier-tech");
  const [compareArchId, setCompareArchId] = useState<string | null>("private-stem");
  const [isCompareActive, setIsCompareActive] = useState<boolean>(true);
  const [discountRate, setDiscountRate] = useState<number>(8.5);
  const [growthVolatility, setGrowthVolatility] = useState<"standard" | "recession" | "expansion">("standard");
  const [aiExposureShock, setAiExposureShock] = useState<number>(15);
  const [loanInterestPct, setLoanInterestPct] = useState<number>(9.5);
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const [muted, setMuted] = useState<boolean>(isAudioMuted());

  const currentArchetype = useMemo(() => {
    return ARCHETYPES.find((a) => a.id === selectedArchId) || ARCHETYPES[0];
  }, [selectedArchId]);

  const compareArchetype = useMemo(() => {
    if (!compareArchId || !isCompareActive) return null;
    return ARCHETYPES.find((a) => a.id === compareArchId) || null;
  }, [compareArchId, isCompareActive]);

  const toggleSound = useCallback(() => {
    const nextState = !muted;
    setMuted(nextState);
    setAudioMuted(nextState);
    if (!nextState) {
      playUiPop(520);
    }
  }, [muted]);

  const handleArchetypeSelect = useCallback((id: string) => {
    setSelectedArchId(id);
    const arch = ARCHETYPES.find((a) => a.id === id);
    if (arch) {
      setAiExposureShock(arch.baseAiExposurePct);
    }
    playUiPop(480);
  }, []);

  const resetDefaults = useCallback(() => {
    setDiscountRate(8.5);
    setGrowthVolatility("standard");
    setAiExposureShock(currentArchetype.baseAiExposurePct);
    setLoanInterestPct(9.5);
    playSuccessChime();
  }, [currentArchetype.baseAiExposurePct]);

  // Macro volatility growth modifier
  const macroMultiplier = useMemo(() => {
    if (growthVolatility === "recession") return 0.75;
    if (growthVolatility === "expansion") return 1.25;
    return 1.0;
  }, [growthVolatility]);

  // Helper: Compute 20-Year Cashflow Trajectory for any Archetype
  const computeTrajectory = useCallback(
    (arch: Archetype, customAiShock: number) => {
      const cost = arch.costLakhs;
      const baseSalary = arch.startingLpa;
      const annualOutlay = cost / 4;
      const annualGrowth = (arch.baseGrowthPct * macroMultiplier) / 100;
      const aiDrag = (customAiShock * 0.45) / 100;
      const effectiveGrowth = Math.max(0.02, annualGrowth - aiDrag);
      const discount = discountRate / 100;

      let cumulativeCashflow = 0;
      let cumulativeP10 = 0;
      let cumulativeP90 = 0;
      let paybackYear: number | null = null;

      const trajectory: Array<{
        year: number;
        label: string;
        annualIncome: number;
        cumulativeNpv: number;
        p10Npv: number;
        p90Npv: number;
      }> = [];

      for (let yr = 0; yr <= 4; yr++) {
        if (yr === 0) {
          trajectory.push({
            year: 0,
            label: "Year 0",
            annualIncome: 0,
            cumulativeNpv: 0,
            p10Npv: 0,
            p90Npv: 0,
          });
        } else {
          const discountedOutlay = annualOutlay / Math.pow(1 + discount, yr);
          cumulativeCashflow -= discountedOutlay;
          cumulativeP10 -= discountedOutlay * 1.1;
          cumulativeP90 -= discountedOutlay * 0.95;

          trajectory.push({
            year: yr,
            label: `Yr ${yr}`,
            annualIncome: 0,
            cumulativeNpv: cumulativeCashflow,
            p10Npv: cumulativeP10,
            p90Npv: cumulativeP90,
          });
        }
      }

      let currentSalary = baseSalary;
      for (let yr = 5; yr <= 20; yr++) {
        const careerYear = yr - 4;
        const yearSalary = currentSalary;
        const discountFactor = Math.pow(1 + discount, yr);

        const livingCost = 4 * Math.pow(1.05, careerYear - 1);
        const netSavings = Math.max(yearSalary * 0.4, yearSalary - livingCost);
        const loanService = careerYear <= 7 ? cost * 0.18 : 0;
        const netAnnualCash = netSavings - loanService;

        const discountedNet = netAnnualCash / discountFactor;
        cumulativeCashflow += discountedNet;

        const p10Net = (netAnnualCash * 0.72) / discountFactor;
        cumulativeP10 += p10Net;

        const p90Net = (netAnnualCash * 1.35) / discountFactor;
        cumulativeP90 += p90Net;

        if (paybackYear === null && cumulativeCashflow >= 0) {
          const prevNpv = trajectory[trajectory.length - 1].cumulativeNpv;
          const delta = cumulativeCashflow - prevNpv;
          const fraction = delta > 0 ? (0 - prevNpv) / delta : 0;
          paybackYear = Number((yr - 1 + Math.max(0, Math.min(1, fraction))).toFixed(1));
        }

        trajectory.push({
          year: yr,
          label: `Yr ${yr}`,
          annualIncome: Number(yearSalary.toFixed(1)),
          cumulativeNpv: Number(cumulativeCashflow.toFixed(1)),
          p10Npv: Number(cumulativeP10.toFixed(1)),
          p90Npv: Number(cumulativeP90.toFixed(1)),
        });

        currentSalary = currentSalary * (1 + effectiveGrowth);
      }

      const aiResilienceScore = Math.max(10, Math.min(99, Math.round(100 - customAiShock * 1.6)));

      return {
        trajectory,
        finalNpv: Number(cumulativeCashflow.toFixed(1)),
        finalP10: Number(cumulativeP10.toFixed(1)),
        paybackYear: paybackYear ?? 20,
        aiResilienceScore,
      };
    },
    [discountRate, macroMultiplier]
  );

  const primarySim = useMemo(() => {
    return computeTrajectory(currentArchetype, aiExposureShock);
  }, [computeTrajectory, currentArchetype, aiExposureShock]);

  const compareSim = useMemo(() => {
    if (!compareArchetype) return null;
    return computeTrajectory(compareArchetype, compareArchetype.baseAiExposurePct);
  }, [computeTrajectory, compareArchetype]);

  // SVG Chart Geometry
  const chartPoints = useMemo(() => {
    const list = primarySim.trajectory;
    const compareList = compareSim ? compareSim.trajectory : [];
    const allP10 = [...list.map((d) => d.p10Npv), ...compareList.map((d) => d.p10Npv)];
    const allP90 = [...list.map((d) => d.p90Npv), ...compareList.map((d) => d.p90Npv)];

    const minVal = Math.min(...allP10, -25);
    const maxVal = Math.max(...allP90, 85);
    const range = maxVal - minVal;

    const width = 640;
    const height = 230;
    const padX = 35;
    const padY = 22;

    const getY = (val: number) => {
      const normalized = (val - minVal) / range;
      return height - padY - normalized * (height - padY * 2);
    };

    const getX = (index: number) => {
      return padX + (index / (list.length - 1)) * (width - padX * 2);
    };

    const zeroY = getY(0);

    // Primary median path
    const medianPath = list
      .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(d.cumulativeNpv).toFixed(1)}`)
      .join(" ");

    // Primary P10 & P90
    const p10Path = list
      .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(d.p10Npv).toFixed(1)}`)
      .join(" ");
    const p90Path = list
      .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(d.p90Npv).toFixed(1)}`)
      .join(" ");

    const envelopePath =
      p90Path +
      " " +
      list
        .slice()
        .reverse()
        .map((d, i) => `L ${getX(list.length - 1 - i).toFixed(1)} ${getY(d.p10Npv).toFixed(1)}`)
        .join(" ") +
      " Z";

    // Secondary compare curve path
    const comparePath = compareList.length
      ? compareList
          .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(d.cumulativeNpv).toFixed(1)}`)
          .join(" ")
      : "";

    return {
      width,
      height,
      zeroY,
      medianPath,
      p10Path,
      p90Path,
      envelopePath,
      comparePath,
      list,
      getX,
      getY,
    };
  }, [primarySim.trajectory, compareSim]);

  const activeHoverData = useMemo(() => {
    if (hoverYear == null) return null;
    const primary = primarySim.trajectory.find((d) => d.year === hoverYear) || null;
    const compare = compareSim ? compareSim.trajectory.find((d) => d.year === hoverYear) || null : null;
    return { primary, compare };
  }, [hoverYear, primarySim.trajectory, compareSim]);

  // Delta calculation when comparing
  const deltaNpv = compareSim ? primarySim.finalNpv - compareSim.finalNpv : 0;
  const deltaPayback = compareSim ? compareSim.paybackYear - primarySim.paybackYear : 0;

  return (
    <div className="space-y-6">
      {/* ── COCKPIT HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-line/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-ink-3">
              Actuarial Cockpit · Live 20-Year Model
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink mt-0.5">
            Real-Time Valuation Surface & Dual Degree Arena
          </h2>
          <p className="text-xs text-ink-2 mt-0.5">
            Scrub financial assumptions at 60 FPS. Notice how confidence bands deform and compare two programs simultaneously.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setIsCompareActive(!isCompareActive)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
              isCompareActive
                ? "bg-accent/10 border-accent/30 text-accent font-bold"
                : "bg-elevated hover:bg-surface border-line/10 text-ink-2"
            }`}
            title="Toggle head-to-head comparison curve"
          >
            <Layers size={13} />
            <span className="text-[11px]">{isCompareActive ? "Comparing: ON" : "Compare Dual"}</span>
          </button>

          <button
            onClick={toggleSound}
            aria-label={muted ? "Enable tactile sounds" : "Mute tactile sounds"}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line/10 bg-elevated hover:bg-surface text-xs font-mono text-ink-2 transition-all cursor-pointer"
            title={muted ? "Sound: Off (Click to enable)" : "Sound: On (Click to mute)"}
          >
            {muted ? <VolumeX size={13} className="text-ink-3" /> : <Volume2 size={13} className="text-emerald-500" />}
            <span className="text-[11px]">{muted ? "Muted" : "Audio"}</span>
          </button>

          <button
            onClick={resetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line/10 bg-elevated hover:bg-surface text-xs font-mono text-ink-2 transition-all cursor-pointer"
            title="Reset to default baseline"
          >
            <RotateCcw size={12} className="text-ink-3" />
            <span className="text-[11px]">Reset</span>
          </button>
        </div>
      </div>

      {/* ── ARCHETYPE SELECTOR CHIPS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-mono text-ink-3 whitespace-nowrap mr-1">Primary:</span>
          {ARCHETYPES.map((arch) => {
            const isSelected = arch.id === selectedArchId;
            return (
              <button
                key={arch.id}
                onClick={() => handleArchetypeSelect(arch.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-ink text-bg border-ink shadow-sm scale-[1.02]"
                    : "bg-elevated hover:bg-surface text-ink-2 border-line/10 hover:border-line/25"
                }`}
              >
                <span>{arch.name}</span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-bg/20 text-bg" : "bg-chip text-ink-3"
                  }`}
                >
                  {arch.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Competitor Select (When Comparison is Active) */}
        {isCompareActive && (
          <div className="flex items-center gap-2 text-xs font-mono shrink-0">
            <span className="text-indigo-400 font-bold text-[11px]">vs:</span>
            <select
              value={compareArchId || ""}
              onChange={(e) => {
                setCompareArchId(e.target.value);
                playUiPop(500);
              }}
              className="bg-elevated border border-line/15 rounded-lg px-2.5 py-1 text-xs text-ink focus:outline-none"
            >
              {ARCHETYPES.filter((a) => a.id !== selectedArchId).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── 3D PERSPECTIVE TILT KPI BENTO CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: 20Y Net Present Value */}
        <TiltCard
          spotlightColor="rgba(16, 185, 129, 0.14)"
          glareColor="rgba(16, 185, 129, 0.25)"
          className="p-4"
        >
          <div className="flex items-center justify-between text-xs text-ink-3 font-mono">
            <span>20-Year Net NPV</span>
            <span className="text-emerald-500 font-bold text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
              P50 Median
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-ink mt-2">
            <AnimatedNumber value={primarySim.finalNpv} prefix="₹" suffix="L" decimals={1} />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[11px]">
            <span className="text-ink-2">Discounted at {discountRate}%</span>
            {compareSim && (
              <span className={`font-mono font-bold ${deltaNpv >= 0 ? "text-emerald-500" : "text-amber-500"}`}>
                {deltaNpv >= 0 ? `+₹${deltaNpv.toFixed(1)}L` : `-₹${Math.abs(deltaNpv).toFixed(1)}L`}
              </span>
            )}
          </div>
        </TiltCard>

        {/* Card 2: P10 Downside Tail Risk */}
        <TiltCard
          spotlightColor="rgba(245, 158, 11, 0.14)"
          glareColor="rgba(245, 158, 11, 0.25)"
          className="p-4"
        >
          <div className="flex items-center justify-between text-xs text-ink-3 font-mono">
            <span>P10 Downside Floor</span>
            <span className="text-amber-500 font-bold text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded">
              Worst 10%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-ink mt-2">
            <AnimatedNumber value={primarySim.finalP10} prefix="₹" suffix="L" decimals={1} />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[11px]">
            <span className="text-ink-2">Macro stress floor</span>
            <span className="text-amber-500 font-mono text-[10px] font-bold">90% Safety</span>
          </div>
        </TiltCard>

        {/* Card 3: Break-Even Payback */}
        <TiltCard
          spotlightColor="rgba(99, 102, 241, 0.14)"
          glareColor="rgba(99, 102, 241, 0.25)"
          className="p-4"
        >
          <div className="flex items-center justify-between text-xs text-ink-3 font-mono">
            <span>Payback Horizon</span>
            <span className="text-indigo-500 font-bold text-[10px] bg-indigo-500/10 px-1.5 py-0.5 rounded">
              Breakeven
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-ink mt-2">
            <AnimatedNumber value={primarySim.paybackYear} suffix=" yrs" decimals={1} />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[11px]">
            <span className="text-ink-2">Tuition amortized</span>
            {compareSim && (
              <span className={`font-mono font-bold ${deltaPayback >= 0 ? "text-emerald-500" : "text-amber-500"}`}>
                {deltaPayback >= 0 ? `${deltaPayback.toFixed(1)}y faster` : `${Math.abs(deltaPayback).toFixed(1)}y slower`}
              </span>
            )}
          </div>
        </TiltCard>

        {/* Card 4: AI Displacement Resilience */}
        <TiltCard
          spotlightColor="rgba(var(--c-accent-rgb, 225 29 72) / 0.14)"
          glareColor="rgba(var(--c-accent-rgb, 225 29 72) / 0.25)"
          className="p-4"
        >
          <div className="flex items-center justify-between text-xs text-ink-3 font-mono">
            <span>AI Resilience</span>
            <span className="text-accent font-bold text-[10px] bg-accent-dim px-1.5 py-0.5 rounded">
              Cognitive Depth
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-ink mt-2">
            <AnimatedNumber value={primarySim.aiResilienceScore} suffix="/100" decimals={0} />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[11px]">
            <span className="text-ink-2">Displacement shelter</span>
            <span className="text-accent font-mono text-[10px] font-bold">O*NET Grounded</span>
          </div>
        </TiltCard>
      </div>

      {/* ── INTERACTIVE 20-YEAR TRAJECTORY GRAPH & SCRUBBER ── */}
      <SpotlightCard className="p-5 sm:p-6" glowSize={450}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-accent" />
              <h3 className="text-sm font-bold text-ink tracking-tight">
                20-Year Cumulative Cash Flow Surface
              </h3>
            </div>
            <p className="text-xs text-ink-2 mt-0.5">
              Hover along the graph or click milestone tags below to analyze inflection points across decades.
            </p>
          </div>

          {activeHoverData?.primary && (
            <div className="flex items-center gap-3 bg-surface border border-line/15 rounded-xl px-3 py-1.5 text-xs font-mono shadow-xs">
              <span className="text-ink-3 font-semibold">{activeHoverData.primary.label}:</span>
              <span className="text-ink font-bold">
                NPV: ₹{activeHoverData.primary.cumulativeNpv}L
              </span>
              {activeHoverData.compare && (
                <span className="text-indigo-400 font-bold border-l border-line/15 pl-2">
                  vs: ₹{activeHoverData.compare.cumulativeNpv}L
                </span>
              )}
            </div>
          )}
        </div>

        {/* SVG Dynamic Responsive Chart */}
        <div className="relative w-full aspect-[2.8/1] max-h-[270px] bg-surface/50 rounded-xl border border-line/10 overflow-hidden select-none">
          <svg
            viewBox={`0 0 ${chartPoints.width} ${chartPoints.height}`}
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="envelopeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--c-accent-rgb, 225 29 72))" stopOpacity="0.16" />
                <stop offset="100%" stopColor="rgb(var(--c-accent-rgb, 225 29 72))" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Zero Neutral Line */}
            <line
              x1="0"
              y1={chartPoints.zeroY}
              x2={chartPoints.width}
              y2={chartPoints.zeroY}
              stroke="currentColor"
              strokeDasharray="4 4"
              className="text-line/25"
            />
            <text x="8" y={chartPoints.zeroY - 4} className="fill-ink-3 text-[9px] font-mono select-none">
              ₹0 Break-Even Line
            </text>

            {/* Shaded Confidence Envelope (P10 to P90) */}
            <path d={chartPoints.envelopePath} fill="url(#envelopeGrad)" />

            {/* P10 Downside Bound */}
            <path
              d={chartPoints.p10Path}
              fill="none"
              stroke="rgb(245, 158, 11)"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              opacity="0.6"
            />

            {/* P90 Upside Bound */}
            <path
              d={chartPoints.p90Path}
              fill="none"
              stroke="rgb(16, 185, 129)"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              opacity="0.6"
            />

            {/* Competitor Curve (Dual Degree Comparison) */}
            {chartPoints.comparePath && (
              <path
                d={chartPoints.comparePath}
                fill="none"
                stroke="rgb(99, 102, 241)"
                strokeWidth="2.2"
                strokeDasharray="4 2"
                strokeLinecap="round"
                opacity="0.9"
              />
            )}

            {/* Primary Median P50 Trajectory */}
            <path
              d={chartPoints.medianPath}
              fill="none"
              stroke="rgb(var(--c-accent-rgb, 225 29 72))"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Break-even crossover ping */}
            {primarySim.paybackYear < 20 && (
              <g
                transform={`translate(${chartPoints.getX(Math.min(20, Math.floor(primarySim.paybackYear)))}, ${chartPoints.zeroY})`}
              >
                <circle r="7" className="fill-accent/20 animate-ping" />
                <circle r="3.5" className="fill-accent stroke-surface stroke-[1.5]" />
              </g>
            )}

            {/* Hover Scrubber Line & Dot */}
            {hoverYear != null && (
              <g transform={`translate(${chartPoints.getX(hoverYear)}, 0)`}>
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2={chartPoints.height}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-ink/40"
                  strokeDasharray="2 2"
                />
                {activeHoverData?.primary && (
                  <circle
                    cx="0"
                    cy={chartPoints.getY(activeHoverData.primary.cumulativeNpv)}
                    r="5"
                    className="fill-accent stroke-bg stroke-2"
                  />
                )}
                {activeHoverData?.compare && (
                  <circle
                    cx="0"
                    cy={chartPoints.getY(activeHoverData.compare.cumulativeNpv)}
                    r="4.5"
                    className="fill-indigo-500 stroke-bg stroke-2"
                  />
                )}
              </g>
            )}
          </svg>

          {/* Interactive touch/cursor tracking overlay */}
          <div
            className="absolute inset-0 cursor-crosshair"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              const yr = Math.round(ratio * 20);
              if (yr !== hoverYear) {
                setHoverYear(yr);
                playSliderTick(360 + yr * 14);
              }
            }}
            onMouseLeave={() => setHoverYear(null)}
          />
        </div>

        {/* ── INTERACTIVE CAREER MILESTONE CHIPS ── */}
        <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-mono font-bold uppercase text-ink-3 shrink-0 mr-1">
            Inflections:
          </span>
          {CAREER_MILESTONES.map((m) => {
            const Icon = m.icon;
            const isHovered = hoverYear === m.year;
            return (
              <button
                key={m.year}
                onClick={() => {
                  setHoverYear(m.year);
                  playUiPop(500 + m.year * 10);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer border shrink-0 flex items-center gap-1.5 ${
                  isHovered
                    ? "bg-accent text-white border-accent shadow-xs scale-105"
                    : "bg-surface hover:bg-elevated text-ink-2 border-line/10 hover:border-line/20"
                }`}
                title={m.tip}
              >
                <Icon size={11} />
                <span>Yr {m.year}: {m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-ink-3 mt-3 pt-3 border-t border-line/10">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-accent rounded" /> {currentArchetype.name}
            </span>
            {compareArchetype && (
              <span className="flex items-center gap-1.5 text-indigo-400 font-bold">
                <span className="w-3 h-0.5 bg-indigo-500 rounded stroke-dash" /> {compareArchetype.name}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 rounded stroke-dash" /> P90 Upside
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-500 rounded stroke-dash" /> P10 Downside
            </span>
          </div>

          <span className="text-ink-2">
            Primary Outlay: <strong className="text-ink">₹{currentArchetype.costLakhs}L</strong> · Starting: <strong className="text-ink">₹{currentArchetype.startingLpa} LPA</strong>
          </span>
        </div>
      </SpotlightCard>

      {/* ── TACTILE PARAMETER SCRUBBERS (60 FPS CONTROLS) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scrubber 1: Base Discount Rate */}
        <SpotlightCard className="p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Sliders size={13} className="text-accent" />
              <label htmlFor="discount-rate-slider" className="font-semibold text-ink">
                Annual Discount Rate (Hurdle Rate)
              </label>
            </div>
            <span className="font-mono font-bold text-ink bg-surface px-2 py-0.5 rounded border border-line/10">
              {discountRate}%
            </span>
          </div>
          <input
            id="discount-rate-slider"
            type="range"
            min="6.0"
            max="14.0"
            step="0.5"
            value={discountRate}
            onChange={(e) => {
              setDiscountRate(Number(e.target.value));
              playSliderTick(480);
            }}
            className="w-full h-1.5 bg-chip rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
          />
          <div className="flex justify-between text-[10px] font-mono text-ink-3">
            <span>6.0% (Low Inflation)</span>
            <span>8.5% (Actuarial Standard)</span>
            <span>14.0% (Aggressive Risk)</span>
          </div>
        </SpotlightCard>

        {/* Scrubber 2: AI Task Automation Drag */}
        <SpotlightCard className="p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Zap size={13} className="text-accent" />
              <label htmlFor="ai-shock-slider" className="font-semibold text-ink">
                Routine Task Automation Exposure
              </label>
            </div>
            <span className="font-mono font-bold text-ink bg-surface px-2 py-0.5 rounded border border-line/10">
              {aiExposureShock}%
            </span>
          </div>
          <input
            id="ai-shock-slider"
            type="range"
            min="0"
            max="45"
            step="5"
            value={aiExposureShock}
            onChange={(e) => {
              setAiExposureShock(Number(e.target.value));
              playSliderTick(520);
            }}
            className="w-full h-1.5 bg-chip rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
          />
          <div className="flex justify-between text-[10px] font-mono text-ink-3">
            <span>0% (Fully Insulated)</span>
            <span>20% (Empirical Baseline)</span>
            <span>45% (Heavy Displacement)</span>
          </div>
        </SpotlightCard>

        {/* Scrubber 3: Macro Growth Scenario */}
        <SpotlightCard className="p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-accent" />
              <span className="font-semibold text-ink">Macro Hiring & Salary Climate</span>
            </div>
            <span className="font-mono text-xs font-bold text-ink uppercase">
              {growthVolatility}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "recession", label: "Recession Drag", sub: "-25% growth" },
              { id: "standard", label: "Baseline 2026", sub: "Standard" },
              { id: "expansion", label: "Tech Boom", sub: "+25% growth" },
            ].map((v) => {
              const active = growthVolatility === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    setGrowthVolatility(v.id as typeof growthVolatility);
                    playUiPop(440);
                  }}
                  className={`py-2 px-2 rounded-xl text-center text-xs transition-all cursor-pointer border ${
                    active
                      ? "bg-ink text-bg border-ink font-bold shadow-sm"
                      : "bg-surface hover:bg-elevated text-ink-2 border-line/10"
                  }`}
                >
                  <div className="leading-tight">{v.label}</div>
                  <div className={`text-[10px] font-mono mt-0.5 ${active ? "text-bg/80" : "text-ink-3"}`}>
                    {v.sub}
                  </div>
                </button>
              );
            })}
          </div>
        </SpotlightCard>

        {/* Scrubber 4: Education Loan Amortization */}
        <SpotlightCard className="p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Shield size={13} className="text-accent" />
              <label htmlFor="loan-interest-slider" className="font-semibold text-ink">
                Education Loan Financing (7-Yr Repayment)
              </label>
            </div>
            <span className="font-mono font-bold text-ink bg-surface px-2 py-0.5 rounded border border-line/10">
              {loanInterestPct}% p.a.
            </span>
          </div>
          <input
            id="loan-interest-slider"
            type="range"
            min="0"
            max="13"
            step="0.5"
            value={loanInterestPct}
            onChange={(e) => {
              setLoanInterestPct(Number(e.target.value));
              playSliderTick(460);
            }}
            className="w-full h-1.5 bg-chip rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
          />
          <div className="flex justify-between text-[10px] font-mono text-ink-3">
            <span>0% (Self-Funded / Grant)</span>
            <span>9.5% (SBI Scholar Loan)</span>
            <span>13% (Private NBFC)</span>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
