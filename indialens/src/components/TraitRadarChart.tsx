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

/**
 * The career-profile radar: four EAP trait estimates as one polygon.
 *
 * The drawing surface is now `.panel` (flat, hairline, no lift) rather than
 * `.card`, because nothing in here is clickable — it is a readout. It was a
 * `.card` with `hover:translate`, which made a static figure behave like a
 * link.
 *
 * **Why the vertex dot is an open ring, not a filled disc.** Each vertex was
 * previously a white-filled circle with a near-black stroke, which on the light
 * palette meant four white pips sitting on a rose polygon — a colour that only
 * reads as "this is a measured reading" against a dark surface. They are now
 * the page background with the accent stroke, so a vertex reads the same way on
 * both themes, and the stroke is 2px against a 2px polygon edge so the dot is
 * legible at 180px.
 *
 * The "Real-time" chip was a rose tint on a rose border; it is now
 * `.badge-rose`, the token equivalent. Note that the chip claims the *chart*
 * is live, not that any value is certain — the vertex positions are EAP
 * estimates, which is what the caption says.
 */
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
    <div className="panel min-w-0">
      <div className="panel-head">
        <span className="panel-title flex items-center gap-2">
          <span className="pulse-dot-rose" aria-hidden="true" />
          Career profile radar
        </span>
        <span className="badge badge-rose">Real-time</span>
      </div>

      <div className="panel-pad-sm flex min-w-0 items-center justify-center">
        <svg
          width="180"
          height="180"
          viewBox="0 0 180 180"
          style={{ overflow: "visible" }}
          role="img"
          aria-label={`Trait radar: risk ${traits.risk.toFixed(1)}, value ${traits.value.toFixed(1)}, autonomy ${traits.autonomy.toFixed(1)}, AI adaptability ${traits.ai_adaptability.toFixed(1)}, on a minus 2.5 to plus 2.5 scale`}
        >
          <defs>
            {/* Both stops are the accent, at two opacities. The previous
                gradient ran rose → blue, so the fill's colour meant something
                different at the far corner of the polygon from the stroke that
                bounded it. */}
            <linearGradient id="polyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.14" />
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
              stroke="var(--border-subtle)"
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
                stroke="var(--border-subtle)"
                strokeWidth="1"
              />
            );
          })}

          {/* Filled trait polygon. The transition is a value transition — the
              vertex moves when an answer changes the estimate — so it is one of
              the three permitted motions. No overshoot: a radar that bounces
              past its new vertex misstates where the estimate is. */}
          <polygon
            points={points}
            fill="url(#polyGradient)"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinejoin="round"
            style={{ transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }}
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
                fill="var(--bg-elevated)"
                stroke="var(--accent)"
                strokeWidth="2"
                style={{ transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }}
              />
            );
          })}

          {/* Axis Labels */}
          <text x={cx} y={cy - r - 8} textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontWeight="600">
            Risk
          </text>
          <text x={cx + r + 14} y={cy + 3} textAnchor="start" fill="var(--text-tertiary)" fontSize="9" fontWeight="600">
            Value
          </text>
          <text x={cx} y={cy + r + 14} textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontWeight="600">
            Autonomy
          </text>
          <text x={cx - r - 14} y={cy + 3} textAnchor="end" fill="var(--text-tertiary)" fontSize="9" fontWeight="600">
            AI-Native
          </text>
        </svg>
      </div>

      <div className="border-t t-divider px-4 py-3">
        <p className="metric-label mb-1">Predicted archetype</p>
        {archetype ? (
          <p className="text-[13px] font-semibold t-text">{archetype}</p>
        ) : (
          // The archetype is a label derived from the four estimates. With no
          // estimate there is no archetype, and naming one would be the chart
          // asserting a finding it has no reading for.
          <p className="num text-[13px] num-na">Not measured</p>
        )}
        <p className="mt-2 text-[10px] leading-relaxed t-faint">
          Vertices are EAP estimates on a &minus;2.5 to +2.5 scale, shown
          relative to the axis. Distance from the centre is distance from
          neutral, not a score out of 100.
        </p>
      </div>
    </div>
  );
}
