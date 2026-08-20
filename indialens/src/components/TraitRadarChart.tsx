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
  const gridLevels = [0.3, 0.6, 1.0];

  return (
    <div
      style={{
        background: "rgba(18, 18, 30, 0.65)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(79, 110, 247, 0.25)",
        borderRadius: 16,
        padding: "16px 20px",
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.35)",
        transition: "all 0.3s ease",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#4F6EF7",
              boxShadow: "0 0 10px #4F6EF7",
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#F0F0F5", letterSpacing: "0.02em" }}>
            Your career profile
          </span>
        </div>
        <span
          className="font-mono"
          style={{ fontSize: 10, color: "#8B8BA7", background: "rgba(79, 110, 247, 0.12)", padding: "2px 8px", borderRadius: 999 }}
        >
          Live
        </span>
      </div>

      <div className="flex items-center justify-center relative py-1">
        <svg width="180" height="180" viewBox="0 0 180 180" style={{ overflow: "visible" }}>
          <defs>
            <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4F6EF7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#7B96FF" stopOpacity="0.05" />
            </radialGradient>
            <linearGradient id="polyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F6EF7" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#9333EA" stopOpacity="0.45" />
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
              stroke="rgba(255, 255, 255, 0.08)"
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
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1"
              />
            );
          })}

          {/* Filled trait polygon */}
          <polygon
            points={points}
            fill="url(#polyGradient)"
            stroke="#7B96FF"
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
                fill="#F0F0F5"
                stroke="#4F6EF7"
                strokeWidth="2"
                style={{ transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
              />
            );
          })}

          {/* Axis Labels */}
          <text x={cx} y={cy - r - 8} textAnchor="middle" fill="#8B8BA7" fontSize="9" fontWeight="600">
            Risk
          </text>
          <text x={cx + r + 14} y={cy + 3} textAnchor="start" fill="#8B8BA7" fontSize="9" fontWeight="600">
            Value
          </text>
          <text x={cx} y={cy + r + 14} textAnchor="middle" fill="#8B8BA7" fontSize="9" fontWeight="600">
            Autonomy
          </text>
          <text x={cx - r - 14} y={cy + 3} textAnchor="end" fill="#8B8BA7" fontSize="9" fontWeight="600">
            AI-Native
          </text>
        </svg>
      </div>

      {archetype && (
        <div
          className="mt-3 pt-2 text-center"
          style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}
        >
          <span style={{ fontSize: 10, color: "#8B8BA7" }}>Predicted Archetype: </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#7B96FF" }}>{archetype}</span>
        </div>
      )}
    </div>
  );
}
