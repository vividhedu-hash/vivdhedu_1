"use client";

import React from "react";

interface TraitRadarProps {
  traits: {
    risk: number; // -2.5 to +2.5
    value: number;
    autonomy: number;
    ai_adaptability: number;
  };
  archetype?: string;
}

export function TraitRadarChart({ traits, archetype }: TraitRadarProps) {
  // Convert -2.5..+2.5 to 0..1 scale for radar vertices
  const normalize = (val: number) => Math.max(0.15, Math.min(1.0, (val + 2.5) / 5.0));

  const r = 65; // radius
  const cx = 90;
  const cy = 90;

  // 4 Axes: Risk (Top), Value (Right), Autonomy (Bottom), AI Adaptability (Left)
  const axes = [
    { name: "Risk Appetite", val: normalize(traits.risk), angle: -Math.PI / 2 },
    { name: "Value / IRR", val: normalize(traits.value), angle: 0 },
    { name: "Autonomy", val: normalize(traits.autonomy), angle: Math.PI / 2 },
    { name: "AI Resilience", val: normalize(traits.ai_adaptability), angle: Math.PI },
  ];

  // Calculate polygon points
  const points = axes
    .map((axis) => {
      const dist = r * axis.val;
      const x = cx + dist * Math.cos(axis.angle);
      const y = cy + dist * Math.sin(axis.angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // Grid concentric circles
  const gridLevels = [0.33, 0.66, 1.0];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
            Career Profile Radar
          </span>
        </div>
        <span className="font-mono text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
          Real-time
        </span>
      </div>

      <div className="flex items-center justify-center relative py-2">
        <svg width="180" height="180" viewBox="0 0 180 180" style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="polyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E11D48" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Grid Circles */}
          {gridLevels.map((lvl, idx) => (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r={r * lvl}
              fill="none"
              stroke="#E2E8F0"
              strokeDasharray={idx < 2 ? "3,3" : undefined}
            />
          ))}

          {/* Axis lines */}
          {axes.map((axis, i) => {
            const x2 = cx + r * Math.cos(axis.angle);
            const y2 = cy + r * Math.sin(axis.angle);
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={x2}
                y2={y2}
                stroke="#E2E8F0"
                strokeWidth="1"
              />
            );
          })}

          {/* Filled trait polygon */}
          <polygon
            points={points}
            fill="url(#polyGradient)"
            stroke="#E11D48"
            strokeWidth="2"
            style={{ transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          />

          {/* Vertex dots */}
          {axes.map((axis, i) => {
            const dist = r * axis.val;
            const vx = cx + dist * Math.cos(axis.angle);
            const vy = cy + dist * Math.sin(axis.angle);
            return (
              <circle
                key={i}
                cx={vx}
                cy={vy}
                r="3.5"
                fill="#FFFFFF"
                stroke="#09090B"
                strokeWidth="2"
                style={{ transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
              />
            );
          })}

          {/* Axis Labels */}
          <text x={cx} y={cy - r - 8} textAnchor="middle" fill="#64748B" fontSize="9" fontWeight="600">
            Risk
          </text>
          <text x={cx + r + 14} y={cy + 3} textAnchor="start" fill="#64748B" fontSize="9" fontWeight="600">
            Value
          </text>
          <text x={cx} y={cy + r + 14} textAnchor="middle" fill="#64748B" fontSize="9" fontWeight="600">
            Autonomy
          </text>
          <text x={cx - r - 14} y={cy + 3} textAnchor="end" fill="#64748B" fontSize="9" fontWeight="600">
            AI-Native
          </text>
        </svg>
      </div>

      {archetype && (
        <div className="mt-3 pt-3 text-center border-t border-slate-100">
          <span className="text-[11px] text-slate-500 block mb-0.5">Predicted Archetype</span>
          <span className="text-xs font-bold text-slate-900 font-mono">{archetype}</span>
        </div>
      )}
    </div>
  );
}
