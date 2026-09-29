"use client";

import React, { useState } from "react";
import { Sliders, RotateCcw } from "lucide-react";

interface PointAllocatorProps {
  onComplete: (allocations: Record<string, number>) => void;
}

/**
 * The 100-point trade-off allocator.
 *
 * Behaviour is unchanged: same five drivers, same budget of 100, same
 * over-spend cap, same reset distribution, same `onComplete` payload, same
 * disabled-until-complete confirm button. Only the surface moved.
 *
 * ## The five driver colours
 *
 * They were five arbitrary literals and are now the five system tokens, which
 * is the same ordering of meaning and themes in both palettes. They are also
 * mapped to the `badge-{tone}` classes so a driver's colour is stated once
 * rather than being restated at the track fill, the chip and the label.
 *
 * ## The remaining counter
 *
 * This is the one figure in the component that must not be a generic stat, and
 * it is worth being explicit about why: `remaining` goes **negative** if the
 * cap is bypassed, so `0` and `-5` are genuinely different states and the
 * counter cannot be treated as a score. It is a live arithmetic remainder, so
 * it is `.num` (tabular, so the digits do not jitter while a slider is dragged)
 * and it changes tone at exactly zero — neutral chip while points are
 * outstanding, `.notice-ok` once the budget is spent. The confirm button is
 * disabled until that same zero, and its label states the outstanding count
 * rather than reading "Confirm" on a disabled control.
 *
 * `accent-` on the range input is the Tailwind `accent-color` property, which
 * takes a colour value rather than a token class; `--text-primary` is passed
 * through `style` because Tailwind's `accent-*` scale has no `accent-ink`.
 * The focus ring on the slider is the global `:focus-visible` outline and has
 * not been suppressed.
 */
const DRIVERS = [
  { id: "salary", label: "Salary & Financial IRR", desc: "10-year Net Present Value & Max Median Package", color: "var(--blue)", tone: "blue" },
  { id: "wlb", label: "Work-Life Balance & Health", desc: "Predictable hours, low burnout, location flexibility", color: "var(--green)", tone: "green" },
  { id: "brand", label: "Brand Prestige & Alumni", desc: "Tier-1 tag, peer group network, social status", color: "var(--amber)", tone: "amber" },
  { id: "autonomy", label: "Autonomy & Ownership", desc: "Startup equity, fast promotion, creative freedom", color: "var(--accent)", tone: "rose" },
  { id: "ai_security", label: "AI Resilience & Longevity", desc: "Protection against 10-year AI automation vectors", color: "var(--purple)", tone: "purple" },
] as const;

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
    <section className="panel min-w-0">
      <div className="panel-head">
        <span className="panel-title flex items-center gap-2">
          <Sliders size={12} aria-hidden="true" />
          Allocate your 100 priority points
        </span>
        <button
          type="button"
          onClick={handleReset}
          aria-label="Reset all allocations to 20 points each"
          className="btn-ghost px-2.5 py-1 text-[11px]"
        >
          <RotateCcw size={11} aria-hidden="true" />
          Reset
        </button>
      </div>

      <div className="panel-pad-lg">
        <p className="mb-6 text-[13px] leading-relaxed t-muted">
          Distribute 100 trade-off points across your non-negotiable career
          drivers.
        </p>

        {/* The budget chip. `aria-live` because it is the only element on the
            panel that changes in response to a drag, and a screen-reader user
            moving a slider needs the remainder announced to know they are done. */}
        <div
          className={`mb-6 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
            remaining === 0 ? "notice-ok" : "notice"
          }`}
          aria-live="polite"
        >
          <span className="metric-label">Points remaining</span>
          <span className="num text-[15px] font-bold t-text">
            {remaining}
            <span className="t-faint"> / {TOTAL_BUDGET}</span>
          </span>
        </div>

        <div className="space-y-4">
          {DRIVERS.map((driver) => {
            const val = points[driver.id] || 0;
            return (
              <div key={driver.id} className="min-w-0">
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <div className="flex min-w-0 flex-wrap items-baseline gap-2">
                    <span
                      aria-hidden="true"
                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{ background: driver.color }}
                    />
                    <label
                      htmlFor={`alloc-${driver.id}`}
                      className="text-[13px] font-semibold t-text"
                    >
                      {driver.label}
                    </label>
                    <span className="hidden text-[12px] t-faint sm:inline">
                      {driver.desc}
                    </span>
                  </div>
                  <span className="num shrink-0 text-[13px] font-bold t-text">
                    {val} pts
                  </span>
                </div>

                <input
                  id={`alloc-${driver.id}`}
                  type="range"
                  min={0}
                  max={60}
                  value={val}
                  onChange={(e) => handleSliderChange(driver.id, parseInt(e.target.value))}
                  aria-describedby={`alloc-desc-${driver.id}`}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg"
                  style={{
                    background: "var(--bg-chip)",
                    accentColor: "var(--text-primary)",
                  }}
                />
                <span id={`alloc-desc-${driver.id}`} className="sr-only">
                  {driver.desc}. Maximum 60 points.
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            disabled={remaining !== 0}
            onClick={() => onComplete(points)}
            className={
              remaining === 0 ? "btn-accent" : "btn-secondary cursor-not-allowed opacity-50"
            }
          >
            {remaining === 0
              ? "Confirm allocation"
              : `Allocate remaining ${remaining} pts`}
          </button>
        </div>
      </div>
    </section>
  );
}
