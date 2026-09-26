"use client";

import { finiteOrNull } from "../lib/mock-data";

interface ROIComponent {
  label: string;
  value: number | null; // 0–100, or null when the score is not measured
  weight: number; // 0–1 (formula weight)
  color: string;
}

interface ROIBreakdownProps {
  /** null = not measured. Rendered as an explicit unavailable state, never 0. */
  financialRoi: number | null;
  /** null = not measured. */
  riskScore: number | null;
  /** null = not measured. These have no backing column in the schema. */
  optionalityScore: number | null;
  mobilityScore: number | null;
  satisfactionScore: number | null;
  networkScore: number | null;
}

/**
 * Normalize a score to 0–100, preserving "not measured" as null.
 *
 * The previous version substituted a hardcoded fallback (75, and 78/82/85/88 per
 * component), which meant unmeasured sub-scores were rendered as if they were
 * real model output. Null now stays null so the UI can label it honestly.
 */
function normalizeScore(val: number | null | undefined): number | null {
  if (val == null || isNaN(val)) return null;
  if (val <= 1 && val > 0) return Math.min(100, Math.max(0, Math.round(val * 100)));
  return Math.min(100, Math.max(0, Math.round(val)));
}

export function ROIBreakdown({
  financialRoi,
  riskScore,
  optionalityScore,
  mobilityScore,
  satisfactionScore,
  networkScore,
}: ROIBreakdownProps) {
  const risk = finiteOrNull(riskScore);
  const normalizedRisk = risk == null ? null : (risk > 1 ? risk / 100 : risk);
  const roi = finiteOrNull(financialRoi);

  const components: ROIComponent[] = [
    {
      label: "Financial ROI",
      // Previously `Math.round(financialRoi / 50)` with a non-null assumption;
      // a null ROI would have produced 0/100 — the worst possible score — for a
      // program we simply have not measured.
      value: roi == null ? null : Math.min(100, Math.max(0, Math.round(roi / 50))),
      weight: 0.35,
      color: "#4F6EF7",
    },
    {
      label: "Risk-Adjusted",
      value: normalizedRisk == null ? null : Math.min(100, Math.max(0, Math.round((1 - normalizedRisk) * 100))),
      weight: 0.2,
      color: "#22C55E",
    },
    {
      label: "Optionality",
      value: normalizeScore(optionalityScore),
      weight: 0.15,
      color: "#F7C94F",
    },
    {
      label: "Mobility",
      value: normalizeScore(mobilityScore),
      weight: 0.15,
      color: "#A78BFA",
    },
    {
      label: "Satisfaction",
      value: normalizeScore(satisfactionScore),
      weight: 0.1,
      color: "#F97316",
    },
    {
      label: "Network",
      value: normalizeScore(networkScore),
      weight: 0.05,
      color: "#EC4899",
    },
  ];

  // Only average over the components that were actually measured, and reweight
  // accordingly — otherwise a program with two missing inputs is silently
  // penalised for the gap.
  const measured = components.filter((c) => c.value != null);
  const measuredWeight = measured.reduce((sum, c) => sum + c.weight, 0);
  const totalWeighted = measured.reduce((sum, c) => sum + c.value! * c.weight, 0);

  return (
    <div className="space-y-3">
      {components.map((comp) => {
        const contribution = comp.value == null ? null : Math.round(comp.value * comp.weight);
        return (
          <div key={comp.label}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: comp.color,
                  }}
                />
                <span
                  className="text-xs font-semibold"
                  style={{ color: "#475569" }}
                >
                  {comp.label}
                </span>
                <span
                  className="text-xs font-mono"
                  style={{ color: "#94A3B8" }}
                >
                  ×{comp.weight}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {comp.value == null ? (
                  <span
                    className="text-xs font-mono"
                    style={{ color: "#94A3B8" }}
                  >
                    not measured
                  </span>
                ) : (
                  <>
                    <span
                      className="text-xs font-mono"
                      style={{ color: "#64748B" }}
                    >
                      {comp.value}/100
                    </span>
                    <span
                      className="text-xs font-mono font-bold"
                      style={{ color: comp.color, minWidth: 32, textAlign: "right" }}
                    >
                      +{contribution}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div
              style={{
                height: 6,
                background: "#E2E8F0",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              {comp.value != null && (
                <div
                  style={{
                    height: "100%",
                    width: `${comp.value}%`,
                    background: comp.color,
                    borderRadius: 3,
                    transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: `0 0 8px ${comp.color}40`,
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
      <div
        style={{
          borderTop: "1px solid #E2E8F0",
          paddingTop: 12,
          marginTop: 8,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "#64748B" }}
        >
          Composite Score
          {measured.length < components.length && (
            <span
              style={{
                textTransform: "none",
                letterSpacing: 0,
                fontWeight: 400,
                marginLeft: 8,
              }}
            >
              ({measured.length}/{components.length} inputs measured)
            </span>
          )}
        </span>
        <span
          className="font-mono font-bold text-lg"
          style={{ color: "#09090B" }}
        >
          {measuredWeight > 0
            ? `${Math.round(totalWeighted / measuredWeight)}/100`
            : "—"}
        </span>
      </div>
    </div>
  );
}
