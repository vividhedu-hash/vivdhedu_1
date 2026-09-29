"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Scroll entry motion.
 *
 * The product has exactly three motions it is allowed to use (see the MOTION
 * SYSTEM block in `globals.css`): section entry, number transitions, and chart
 * reveal. This is the first.
 *
 * Design constraints that shaped this:
 *
 * - **It never hides content permanently.** The initial `opacity: 0` comes
 *   from the `.reveal` class, which only JS ever adds. Server HTML is fully
 *   visible, so a failed hydration, a blocked bundle, or a search crawler all
 *   get the real page. This is why there is no `prefers-reduced-motion` guard
 *   around the *initial* state — reduced motion is handled by the CSS class,
 *   which forces the end state.
 * - **Once, then stop.** The observer disconnects after the first intersection.
 *   A page that re-animates on every scroll-back is a page that has been
 *   playing an animation at you for ten minutes.
 * - **No layout shift.** The transform is `translateY` only, so nothing
 *   reflows when the element settles.
 * - **`threshold: 0.08`, `rootMargin` slightly negative**, so an element
 *   animates once it is genuinely readable rather than as its top pixel clips
 *   the viewport edge.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  /** Extra delay in ms. Keep under ~200ms or the page feels broken, not choreographed. */
  delay?: number;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Already in view on mount (above the fold, or a short page) — reveal at
    // once rather than waiting for a scroll event that may never come.
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`reveal ${shown ? "is-in" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

/**
 * A group whose children stagger in. Used for card grids and metric rows,
 * where the point is that the eye can follow an order.
 */
export function RevealGroup({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul" | "section";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -5% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref as never} className={`reveal-stagger ${shown ? "is-in" : ""} ${className}`}>
      {children}
    </Tag>
  );
}
