"use client";

import { finiteOrNull } from "../lib/mock-data";

interface RiskItem {
  label: string;
  /** 0–1, or null when this risk dimension was not measured. */
  value: number | null;
  description?: string;
}

interface RiskGridProps {
  items: RiskItem[];
  dots?: number; // total dots per indicator (default 5)
}

const NO_DATA_COLOR = "#94A3B8";

function getColor(value: number): string {
  if (value <= 0.2) return "#22C55E";
  if (value <= 0.4) return "#84CC16";
  if (value <= 0.6) return "#F59E0B";
  if (value <= 0.8) return "#F97316";
  return "#EF4444";
}

function getRiskLevel(value: number): string {
  if (value <= 0.2) return "Very Low";
  if (value <= 0.4) return "Low";
  if (value <= 0.6) return "Medium";
  if (value <= 0.8) return "High";
  return "Very High";
}

export function RiskGrid({ items, dots = 5 }: RiskGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item) => {
        // Unmeasured risks render as a neutral "no data" tile. Defaulting to 0
        // would light up all five dots in the safest colour and assert "very
        // low risk" for something we know nothing about.
        const value = finiteOrNull(item.value);
        const filled = value == null ? 0 : Math.round(value * dots);
        const color = value == null ? NO_DATA_COLOR : getColor(value);
        return (
          <div
            key={item.label}
            className="glass-card p-4 group"
            title={item.description}
          >
            <div className="flex items-start justify-between mb-2">
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#64748B", letterSpacing: "0.06em" }}
              >
                {item.label}
              </span>
              <span
                className="text-xs font-bold"
                style={{ color }}
              >
                {value == null ? "No data" : getRiskLevel(value)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              {Array.from({ length: dots }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: value != null && i < filled ? color : "#E2E8F0",
                    transition: `background 0.2s ease ${i * 0.05}s`,
                    boxShadow: value != null && i < filled ? `0 0 4px ${color}60` : "none",
                  }}
                />
              ))}
              <span className="ml-2 text-xs font-mono" style={{ color: "#64748B" }}>
                {value == null ? "—" : `${Math.round(value * 100)}%`}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
