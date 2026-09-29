"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The number transition — the product's second permitted motion.
 *
 * A figure that changes from 0 to 74 does not read as a change if it simply
 * swaps. Counting to it is what makes the delta visible, which matters a great
 * deal in a product whose whole claim is that it shows you what changed.
 *
 * Three rules this implements, all from the MOTION SYSTEM block in
 * `globals.css`:
 *
 * 1. **Reduced motion is checked in JS, not CSS.** A count-up is a `requestAnimationFrame`
 *    loop, not an animation — the global `prefers-reduced-motion` rule has
 *    nothing to collapse, so the value would tween anyway. `prefersReducedMotion()`
 *    short-circuits to the final value.
 *
 * 2. **A null never counts.** `null` is the product's "not measured" state.
 *    Tweening `null → 84` would animate a number into existence that was never
 *    there. `null` renders as its placeholder, statically, forever.
 *
 * 3. **The format function is the source of truth.** The caller passes
 *    `format`, not a `toFixed`. That way ₹ and % and the em dash all go through
 *    one place and the tween cannot produce a string the resting state would
 *    not have produced.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * `value` is the target. `format` renders any intermediate value AND the final
 * one, so the caller never sees a differently-formatted tween than the resting
 * state. Pass a stable function (module scope or `useCallback`) — an inline
 * arrow re-runs the effect on every render and the number restarts forever.
 */
export function useCountUp(
  value: number | null,
  format: (v: number) => string,
  { durationMs = 700, enabled = true }: { durationMs?: number; enabled?: boolean } = {},
): string {
  const from = useRef(0);
  const [display, setDisplay] = useState<string>(() =>
    value == null ? "" : format(value),
  );

  useEffect(() => {
    // Not measured. Rendered by the caller as a dash; nothing to tween.
    if (value == null) return;

    if (!enabled || prefersReducedMotion() || durationMs <= 0) {
      setDisplay(format(value));
      from.current = value;
      return;
    }

    const start = from.current;
    // A tiny change should not visibly re-run the whole tween.
    if (Math.abs(value - start) < 1e-9) {
      setDisplay(format(value));
      return;
    }

    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs);
      const v = start + (value - start) * easeOutCubic(p);
      setDisplay(format(v));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, format, durationMs, enabled]);

  return display;
}

/** Convenience wrappers for the figures that appear most often. */
export const formatScore = (v: number) => v.toFixed(1);
export const formatPct = (v: number) => `${Math.round(v)}%`;
export const formatLakh = (v: number) => `₹${(v / 100000).toFixed(1)}L`;
