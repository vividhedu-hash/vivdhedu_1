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
} from "lucide-react";
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

export function InteractiveActuarialCockpit() {
  const [selectedArchId, setSelectedArchId] = useState<string>("premier-tech");
  const [discountRate, setDiscountRate] = useState<number>(8.5);
  const [growthVolatility, setGrowthVolatility] = useState<"standard" | "recession" | "expansion">("standard");
  const [aiExposureShock, setAiExposureShock] = useState<number>(15);
  const [loanInterestPct, setLoanInterestPct] = useState<number>(9.5);
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const [muted, setMuted] = useState<boolean>(isAudioMuted());

  const currentArchetype = useMemo(() => {
    return ARCHETYPES.find((a) => a.id === selectedArchId) || ARCHETYPES[0];
  }, [selectedArchId]);

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

  // 20-Year Actuarial Cashflow Engine
  const simulationData = useMemo(() => {
    const cost = currentArchetype.costLakhs;
    const baseSalary = currentArchetype.startingLpa;
    const annualOutlay = cost / 4; // 4-year degree
    const annualGrowth = (currentArchetype.baseGrowthPct * macroMultiplier) / 100;
    const aiDrag = (aiExposureShock * 0.45) / 100;
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

    // Years 0 to 4: Education Phase
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
        cumulativeP10 -= discountedOutlay * 1.1; // 10% contingency
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

    // Years 5 to 20: Career Expansion
    let currentSalary = baseSalary;
    for (let yr = 5; yr <= 20; yr++) {
      const careerYear = yr - 4; // 1 to 16
      const yearSalary = currentSalary;
      const discountFactor = Math.pow(1 + discount, yr);

      // Living cost assumption (₹4L/yr inflating at 5%)
      const livingCost = 4 * Math.pow(1.05, careerYear - 1);
      const netSavings = Math.max(yearSalary * 0.4, yearSalary - livingCost);

      // Loan repayment deduction in years 5 to 11 (7-year tenure)
      const loanService = careerYear <= 7 ? (cost * 0.18) : 0;
      const netAnnualCash = netSavings - loanService;

      const discountedNet = netAnnualCash / discountFactor;
      cumulativeCashflow += discountedNet;

      // P10: 25% lower salary & higher shock
      const p10Net = (netAnnualCash * 0.72) / discountFactor;
      cumulativeP10 += p10Net;

      // P90: 30% upper-quartile promotion upside
      const p90Net = (netAnnualCash * 1.35) / discountFactor;
      cumulativeP90 += p90Net;

      if (paybackYear === null && cumulativeCashflow >= 0) {
        // Interpolate exact fractional payback year
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

    const finalNpv = cumulativeCashflow;
    const finalP10 = cumulativeP10;
    const aiResilienceScore = Math.max(10, Math.min(99, Math.round(100 - aiExposureShock * 1.6)));

    return {
      trajectory,
      finalNpv: Number(finalNpv.toFixed(1)),
      finalP10: Number(finalP10.toFixed(1)),
      paybackYear: paybackYear ?? 20,
      aiResilienceScore,
    };
  }, [currentArchetype, discountRate, macroMultiplier, aiExposureShock]);

  // SVG Chart Dimensions & Coordinates
  const chartPoints = useMemo(() => {
    const list = simulationData.trajectory;
    const minVal = Math.min(...list.map((d) => d.p10Npv), -25);
    const maxVal = Math.max(...list.map((d) => d.p90Npv), 80);
    const range = maxVal - minVal;

    const width = 640;
    const height = 220;
    const padX = 35;
    const padY = 20;

    const getY = (val: number) => {
      const normalized = (val - minVal) / range;
      return height - padY - normalized * (height - padY * 2);
    };

    const getX = (index: number) => {
      return padX + (index / (list.length - 1)) * (width - padX * 2);
    };

    const zeroY = getY(0);

    // Median curve path
    const medianPath = list
      .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(d.cumulativeNpv).toFixed(1)}`)
      .join(" ");

    // P10 curve path
    const p10Path = list
      .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(d.p10Npv).toFixed(1)}`)
      .join(" ");

    // P90 curve path
    const p90Path = list
      .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(d.p90Npv).toFixed(1)}`)
      .join(" ");

    // Shaded confidence envelope (P90 to P10 reversed)
    const envelopePath =
      p90Path +
      " " +
      list
        .slice()
        .reverse()
        .map((d, i) => `L ${getX(list.length - 1 - i).toFixed(1)} ${getY(d.p10Npv).toFixed(1)}`)
        .join(" ") +
      " Z";

    return {
      width,
      height,
      zeroY,
      medianPath,
      p10Path,
      p90Path,
      envelopePath,
      list,
      getX,
      getY,
    };
  }, [simulationData.trajectory]);

  const activeHoverData = useMemo(() => {
    if (hoverYear == null) return null;
    return simulationData.trajectory.find((d) => d.year === hoverYear) || null;
  }, [hoverYear, simulationData.trajectory]);

  return (
    <div className="space-y-6">
      {/* ── COCKPIT HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-line/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-ink-3">
              Actuarial Cockpit · Live Simulation
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink mt-0.5">
            20-Year Monte Carlo Valuation Surface
          </h2>
          <p className="text-xs text-ink-2 mt-0.5">
            Scrub actuarial parameters in real-time. Notice how P10 downside bands stretch as macro and AI shocks fluctuate.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={toggleSound}
            aria-label={muted ? "Enable tactile sounds" : "Mute tactile sounds"}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line/10 bg-elevated hover:bg-surface text-xs font-mono text-ink-2 transition-all cursor-pointer"
            title={muted ? "Sound: Off (Click to enable)" : "Sound: On (Click to mute)"}
          >
            {muted ? <VolumeX size={13} className="text-ink-3" /> : <Volume2 size={13} className="text-emerald-500" />}
            <span className="text-[11px]">{muted ? "Muted" : "Haptics"}</span>
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
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-mono text-ink-3 whitespace-nowrap mr-1">Archetype:</span>
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

      {/* ── TOP KPI BENTO CARDS WITH SPOTLIGHT & ODOMETER ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: 20Y Net Present Value */}
        <SpotlightCard
          spotlightColor="rgba(16, 185, 129, 0.12)"
          borderColor="rgba(16, 185, 129, 0.35)"
          className="p-4"
        >
          <div className="flex items-center justify-between text-xs text-ink-3 font-mono">
            <span>20-Year Net NPV</span>
            <span className="text-emerald-500 font-bold text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
              P50 Median
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-ink mt-2">
            <AnimatedNumber
              value={simulationData.finalNpv}
              prefix="₹"
              suffix="L"
              decimals={1}
            />
          </div>
          <p className="text-[11px] text-ink-2 mt-1 leading-tight">
            Net career capital gain discounted at {discountRate}%.
          </p>
        </SpotlightCard>

        {/* Card 2: P10 Downside Tail Risk */}
        <SpotlightCard
          spotlightColor="rgba(245, 158, 11, 0.12)"
          borderColor="rgba(245, 158, 11, 0.35)"
          className="p-4"
        >
          <div className="flex items-center justify-between text-xs text-ink-3 font-mono">
            <span>P10 Downside Floor</span>
            <span className="text-amber-500 font-bold text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded">
              Worst 10%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-ink mt-2">
            <AnimatedNumber
              value={simulationData.finalP10}
              prefix="₹"
              suffix="L"
              decimals={1}
            />
          </div>
          <p className="text-[11px] text-ink-2 mt-1 leading-tight">
            Stress floor under persistent macro friction.
          </p>
        </SpotlightCard>

        {/* Card 3: Break-Even Payback */}
        <SpotlightCard
          spotlightColor="rgba(99, 102, 241, 0.12)"
          borderColor="rgba(99, 102, 241, 0.35)"
          className="p-4"
        >
          <div className="flex items-center justify-between text-xs text-ink-3 font-mono">
            <span>Payback Horizon</span>
            <span className="text-indigo-500 font-bold text-[10px] bg-indigo-500/10 px-1.5 py-0.5 rounded">
              Break-Even
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-ink mt-2">
            <AnimatedNumber
              value={simulationData.paybackYear}
              suffix=" yrs"
              decimals={1}
            />
          </div>
          <p className="text-[11px] text-ink-2 mt-1 leading-tight">
            From enrollment to total financial neutrality.
          </p>
        </SpotlightCard>

        {/* Card 4: AI Displacement Resilience */}
        <SpotlightCard
          spotlightColor="rgba(var(--c-accent-rgb, 225 29 72) / 0.12)"
          borderColor="rgba(var(--c-accent-rgb, 225 29 72) / 0.35)"
          className="p-4"
        >
          <div className="flex items-center justify-between text-xs text-ink-3 font-mono">
            <span>AI Resilience</span>
            <span className="text-accent font-bold text-[10px] bg-accent-dim px-1.5 py-0.5 rounded">
              Cognitive Depth
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-ink mt-2">
            <AnimatedNumber
              value={simulationData.aiResilienceScore}
              suffix="/100"
              decimals={0}
            />
          </div>
          <p className="text-[11px] text-ink-2 mt-1 leading-tight">
            Insulation index against routine task automation.
          </p>
        </SpotlightCard>
      </div>

      {/* ── INTERACTIVE 20-YEAR TRAJECTORY GRAPH & SCRUBBER ── */}
      <SpotlightCard className="p-5 sm:p-6" glowSize={420}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-accent" />
              <h3 className="text-sm font-bold text-ink tracking-tight">
                Cumulative Discounted Cash Flow Envelope (Years 0–20)
              </h3>
            </div>
            <p className="text-xs text-ink-2 mt-0.5">
              Hover along the curve to inspect milestone cash balances. The shaded band shows the P10–P90 uncertainty margin.
            </p>
          </div>

          {activeHoverData && (
            <div className="flex items-center gap-3 bg-surface border border-line/15 rounded-xl px-3 py-1.5 text-xs font-mono">
              <span className="text-ink-3 font-semibold">{activeHoverData.label}:</span>
              <span className="text-ink font-bold">
                NPV: ₹{activeHoverData.cumulativeNpv}L
              </span>
              <span className="text-ink-2 text-[11px]">
                (Salary: ₹{activeHoverData.annualIncome} LPA)
              </span>
            </div>
          )}
        </div>

        {/* SVG Dynamic Responsive Chart */}
        <div className="relative w-full aspect-[2.9/1] max-h-[260px] bg-surface/50 rounded-xl border border-line/10 overflow-hidden select-none">
          <svg
            viewBox={`0 0 ${chartPoints.width} ${chartPoints.height}`}
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="envelopeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--c-accent-rgb, 225 29 72))" stopOpacity="0.18" />
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
            <text
              x="8"
              y={chartPoints.zeroY - 4}
              className="fill-ink-3 text-[9px] font-mono select-none"
            >
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
              opacity="0.65"
            />

            {/* P90 Upside Bound */}
            <path
              d={chartPoints.p90Path}
              fill="none"
              stroke="rgb(16, 185, 129)"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              opacity="0.65"
            />

            {/* Median P50 Trajectory */}
            <path
              d={chartPoints.medianPath}
              fill="none"
              stroke="rgb(var(--c-accent-rgb, 225 29 72))"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Break-even crossover dot */}
            {simulationData.paybackYear < 20 && (
              <g
                transform={`translate(${chartPoints.getX(Math.min(20, Math.floor(simulationData.paybackYear)))}, ${chartPoints.zeroY})`}
              >
                <circle r="6" className="fill-accent/20 animate-ping" />
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
                {activeHoverData && (
                  <circle
                    cx="0"
                    cy={chartPoints.getY(activeHoverData.cumulativeNpv)}
                    r="5"
                    className="fill-accent stroke-bg stroke-2"
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
                playSliderTick(380 + yr * 15);
              }
            }}
            onMouseLeave={() => setHoverYear(null)}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-ink-3 mt-3 pt-3 border-t border-line/10">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-accent rounded" /> P50 Median Trajectory
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 rounded stroke-dash" /> P90 High-Upside
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-500 rounded stroke-dash" /> P10 Downside Stress
            </span>
          </div>

          <span className="text-ink-2">
            Degree Cost: <strong className="text-ink">₹{currentArchetype.costLakhs}L</strong> · Starting Salary: <strong className="text-ink">₹{currentArchetype.startingLpa} LPA</strong>
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
