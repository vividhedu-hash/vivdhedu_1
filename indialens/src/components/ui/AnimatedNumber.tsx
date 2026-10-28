"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number | null | undefined;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number; // in ms
  className?: string;
  fallback?: string;
}

/**
 * Animated odometer / number ticker.
 * Eases smoothly from old value to new value on state changes without layout shift.
 */
export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 500,
  className = "",
  fallback = "—",
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState<number | null>(value ?? null);
  const prevValueRef = useRef<number | null>(value ?? null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (value == null) {
      setDisplayValue(null);
      prevValueRef.current = null;
      return;
    }

    const startVal = prevValueRef.current ?? (value * 0.85);
    const targetVal = value;
    prevValueRef.current = targetVal;

    // If identical, no need to animate
    if (Math.abs(startVal - targetVal) < 0.001) {
      setDisplayValue(targetVal);
      return;
    }

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic: 1 - pow(1 - progress, 3)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (targetVal - startVal) * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetVal);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current != null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [value, duration]);

  if (value == null || displayValue == null) {
    return <span className={className}>{fallback}</span>;
  }

  const formatted = displayValue.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={`inline-flex items-baseline font-mono tracking-tight ${className}`}>
      {prefix && <span className="opacity-80 mr-0.5">{prefix}</span>}
      <span>{formatted}</span>
      {suffix && <span className="opacity-80 ml-0.5">{suffix}</span>}
    </span>
  );
}
