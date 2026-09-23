"use client";

import React, { useState } from "react";
import { Sliders, RotateCcw } from "lucide-react";

interface PointAllocatorProps {
  onComplete: (allocations: Record<string, number>) => void;
}

const DRIVERS = [
  { id: "salary", label: "Salary & Financial IRR", desc: "10-year Net Present Value & Max Median Package", color: "#2563EB" },
  { id: "wlb", label: "Work-Life Balance & Health", desc: "Predictable hours, low burnout, location flexibility", color: "#059669" },
  { id: "brand", label: "Brand Prestige & Alumni", desc: "Tier-1 tag, peer group network, social status", color: "#D97706" },
  { id: "autonomy", label: "Autonomy & Ownership", desc: "Startup equity, fast promotion, creative freedom", color: "#E11D48" },
  { id: "ai_security", label: "AI Resilience & Longevity", desc: "Protection against 10-year AI automation vectors", color: "#7C3AED" },
];

export function PointAllocator({ onComplete }: PointAllocatorProps) {
  const [points, setPoints] = useState<Record<string, number>>({
    salary: 30,
    wlb: 20,
    brand: 20,
    autonomy: 15,
    ai_security: 15,
  });

  const TOTAL_BUDGET = 100;
  const currentTotal = Object.values(points).reduce((a, b) => a + b, 0);
  const remaining = TOTAL_BUDGET - currentTotal;

  const handleSliderChange = (key: string, val: number) => {
    const diff = val - points[key];
    if (diff > 0 && remaining < diff) {
      // Cap at remaining budget
      setPoints((prev) => ({ ...prev, [key]: prev[key] + remaining }));
    } else {
      setPoints((prev) => ({ ...prev, [key]: val }));
    }
  };

  const handleReset = () => {
    setPoints({
      salary: 20,
      wlb: 20,
      brand: 20,
      autonomy: 20,
      ai_security: 20,
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="w-5 h-5 text-slate-800" />
            <h3 className="text-xl font-bold text-slate-950 font-serif">
              Allocate Your 100 Priority Points
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Distribute 100 trade-off points across your non-negotiable career drivers.
          </p>
        </div>

        {/* Budget Chip */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <div
            className={`px-4 py-2 rounded-xl text-right border ${
              remaining === 0
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}
          >
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase block">
              Points Remaining
            </span>
            <span className="font-mono text-base font-black">
              {remaining} / 100
            </span>
          </div>
        </div>
      </div>

      {/* Driver Sliders */}
      <div className="space-y-4">
        {DRIVERS.map((driver) => {
          const val = points[driver.id] || 0;
          return (
            <div
              key={driver.id}
              className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-bold text-slate-900">
                    {driver.label}
                  </span>
                  <span className="text-xs text-slate-500 ml-2 hidden sm:inline">
                    — {driver.desc}
                  </span>
                </div>
                <span className="font-mono font-bold text-sm text-slate-900">
                  {val} pts
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={60}
                value={val}
                onChange={(e) => handleSliderChange(driver.id, parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#09090B]"
              />
            </div>
          );
        })}
      </div>

      {/* Confirm Button */}
      <div className="mt-8 flex justify-end">
        <button
          type="button"
          disabled={remaining !== 0}
          onClick={() => onComplete(points)}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
            remaining === 0
              ? "bg-[#09090B] hover:bg-[#27272A] text-white cursor-pointer"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          {remaining === 0 ? "Confirm Allocation →" : `Allocate remaining ${remaining} pts`}
        </button>
      </div>
    </div>
  );
}
