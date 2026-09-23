"use client";

import { useEffect, useRef, useState } from "react";

interface ScoreRingProps {
  score: number; // 0–100
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  animate?: boolean;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 85) return "#30D158"; // Apple green
  if (score >= 70) return "#5AC8F5"; // Apple teal
  if (score >= 55) return "#FF9F0A"; // Apple amber
  if (score >= 40) return "#FF6B35"; // orange
  return "#FF453A"; // Apple red
}

function getScoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Average";
  if (score >= 40) return "Below Avg";
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
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);
  const [offset, setOffset] = useState<number>(0);
  const hasAnimated = useRef(false);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = getScoreColor(score);
  const targetOffset = circumference - (score / 100) * circumference;

  useEffect(() => {
    if (!animate || hasAnimated.current) return;
    hasAnimated.current = true;

    // Animate score number
    const duration = 1200;
    const start = Date.now();
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // Animate ring
    setOffset(targetOffset);
  }, [score, animate, targetOffset]);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
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
          style={{
            transition: animate ? "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
            filter: `drop-shadow(0 0 5px ${color}50)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono font-bold leading-none"
          style={{ fontSize: size * 0.24, color }}
        >
          {Math.round(displayScore)}
        </span>
        {showLabel && size >= 72 && (
          <span
            className="mt-0.5 font-body text-center leading-tight"
            style={{
              fontSize: size * 0.1,
              color: "#48484A",
              letterSpacing: "0.04em",
            }}
          >
            {getScoreLabel(score)}
          </span>
        )}
      </div>
    </div>
  );
}
