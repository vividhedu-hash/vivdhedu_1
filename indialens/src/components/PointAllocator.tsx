"use client";

import React, { useState } from "react";
import { Sliders, RotateCcw } from "lucide-react";

interface PointAllocatorProps {
  onComplete: (allocations: Record<string, number>) => void;
}

const DRIVERS = [
  { id: "salary", label: "Salary & Financial IRR", desc: "10-year Net Present Value & Max Median Package", color: "#4F6EF7" },
  { id: "wlb", label: "Work-Life Balance & Health", desc: "Predictable hours, low burnout, location flexibility", color: "#10B981" },
  { id: "brand", label: "Brand Prestige & Alumni", desc: "Tier-1 tag, peer group network, social status", color: "#F59E0B" },
  { id: "autonomy", label: "Autonomy & Ownership", desc: "Startup equity, fast promotion, creative freedom", color: "#EC4899" },
  { id: "ai_security", label: "AI Resilience & Longevity", desc: "Protection against 10-year AI automation vectors", color: "#8B5CF6" },
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
    <div
      style={{
        background: "rgba(18, 18, 30, 0.75)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(79, 110, 247, 0.3)",
        borderRadius: 20,
        padding: 24,
        boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sliders size={18} style={{ color: "#7B96FF" }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#F0F0F5" }}>
              Allocate Your 100 Priority Points
            </h3>
          </div>
          <p style={{ fontSize: 13, color: "#8B8BA7" }}>
            Distribute 100 trade-off points across your non-negotiable career drivers.
          </p>
        </div>

        {/* Budget Chip */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 8,
              padding: "6px 10px",
              color: "#8B8BA7",
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <RotateCcw size={12} /> Reset
          </button>
          <div
            style={{
              padding: "8px 16px",
              borderRadius: 12,
              background: remaining === 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
              border: `1px solid ${remaining === 0 ? "#10B981" : "#F59E0B"}`,
              textAlign: "right",
            }}
          >
            <span style={{ fontSize: 10, color: remaining === 0 ? "#10B981" : "#F59E0B", display: "block" }}>
              POINTS REMAINING
            </span>
            <span className="font-mono" style={{ fontSize: 18, fontWeight: 800, color: "#F0F0F5" }}>
              {remaining} / 100
            </span>
          </div>
        </div>
      </div>

      {/* Driver Sliders */}
      <div className="space-y-5">
        {DRIVERS.map((driver) => {
          const val = points[driver.id] || 0;
          return (
            <div
              key={driver.id}
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: 12,
                padding: "12px 16px",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#F0F0F5" }}>
                    {driver.label}
                  </span>
                  <span style={{ fontSize: 11, color: "#8B8BA7", marginLeft: 8 }}>
                    — {driver.desc}
                  </span>
                </div>
                <span className="font-mono font-bold" style={{ fontSize: 15, color: driver.color }}>
                  {val} pts
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={60}
                value={val}
                onChange={(e) => handleSliderChange(driver.id, parseInt(e.target.value))}
                style={{
                  width: "100%",
                  accentColor: driver.color,
                  cursor: "pointer",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Confirm Button */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={remaining !== 0}
          onClick={() => onComplete(points)}
          style={{
            padding: "12px 28px",
            borderRadius: 12,
            background: remaining === 0 ? "linear-gradient(135deg, #4F6EF7 0%, #7B96FF 100%)" : "rgba(79, 110, 247, 0.5)",
            color: "#FFFFFF",
            fontWeight: 700,
            fontSize: 14,
            border: "none",
            cursor: remaining === 0 ? "pointer" : "not-allowed",
            boxShadow: remaining === 0 ? "0 8px 24px rgba(79, 110, 247, 0.35)" : "none",
            transition: "all 0.2s ease",
          }}
        >
          {remaining === 0 ? "Confirm Allocation →" : `Allocate remaining ${remaining} pts`}
        </button>
      </div>
    </div>
  );
}
