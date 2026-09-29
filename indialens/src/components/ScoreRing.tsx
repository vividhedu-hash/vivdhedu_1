"use client";

import { useEffect, useRef, useState } from "react";
import { NO_DATA, finiteOrNull } from "../lib/mock-data";
import { prefersReducedMotion } from "@/lib/motion";

interface ScoreRingProps {
  /**
   * 0–100, or null when the score was not measured. A null score renders an
   * explicit "—" state: it must never be coerced to 0, because a 0/100 ring
   * reads as "the worst possible outcome" rather than "we don't know".
   */
  score: number | null;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  animate?: boolean;
  className?: string;
}

/**
 * Score bands → CSS custom properties, not hex.
 *
 * The five hex literals this used to return could not theme: a dark-mode visitor
 * got the light palette's green on a black surface, which is a different colour
 * with a different perceived weight. `var(--green)` etc. resolve per theme, so
 * the ring is the same *meaning* in both.
 *
 * A fifth band exists below the previous four-tier split. `--red` at the bottom
 * was previously `#FF6B35` (a hardcoded orange that is not in the token
 * palette at all) and now falls through to `--red`, which themes correctly.
 */
function getScoreColor(score: number): string {
  if (score >= 85) return "var(--green)";
  if (score >= 70) return "var(--teal)";
  if (score >= 55) return "var(--amber)";
  if (score >= 40) return "var(--accent)";
  return "var(--red)";
}

function getScoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Average";
  if (score >= 40) return "Below avg";
  return "Poor";
}

export function ScoreRing({
  score,
  size = 80,
  strokeWidth = 6,
  showLabel = true,
  animate = true,
  className = "",
}: ScoreRingProps) {
  const measured = finiteOrNull(score);
  const [displayScore, setDisplayScore] = useState(measured ?? 0);
  const [offset, setOffset] = useState<number>(0);
  const hasAnimated = useRef(false);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = measured == null ? "var(--text-tertiary)" : getScoreColor(measured);
  const targetOffset =
    circumference - ((measured ?? 0) / 100) * circumference;

  useEffect(() => {
    if (measured == null) {
      setOffset(circumference);
      return;
    }
    if (!animate || hasAnimated.current) return;
    hasAnimated.current = true;

    // The count-up is a rAF loop, so the global `prefers-reduced-motion` CSS
    // rule cannot collapse it. It has to be checked here or the number tweens
    // regardless of the OS setting.
    if (prefersReducedMotion()) {
      setDisplayScore(measured);
      setOffset(targetOffset);
      return;
    }

    const duration = 1200;
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * measured));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    setOffset(targetOffset);

    return () => cancelAnimationFrame(raf);
  }, [measured, animate, targetOffset, circumference]);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      title={
        measured == null
          ? "Not enough verified data to score this programme"
          : `Composite score ${measured.toFixed(1)} of 100`
      }
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        {/* Track. `--bg-chip` is the right fill on both themes: a light grey
            disappears on white, a white one disappears on black. */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-chip)"
          strokeWidth={strokeWidth}
        />
        {/* Progress. No drop-shadow: a glow on a 4px ring is a heavy shadow
            by another name, and it did not survive the dark palette. */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animate ? offset : targetOffset}
          opacity={measured == null ? 0.4 : 1}
          style={{
            transition: animate ? "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`leading-none ${measured == null ? "num-na" : "num font-bold"}`}
          style={{ fontSize: size * 0.24, color }}
        >
          {measured == null ? NO_DATA : Math.round(displayScore)}
        </span>
        {showLabel && size >= 72 && (
          <span
            className="t-faint mt-0.5 text-center leading-tight"
            style={{
              fontSize: size * 0.1,
              letterSpacing: "0.04em",
            }}
          >
            {measured == null ? "No data" : getScoreLabel(measured)}
          </span>
        )}
      </div>
    </div>
  );
}
