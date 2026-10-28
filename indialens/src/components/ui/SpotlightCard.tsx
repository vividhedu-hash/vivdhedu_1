"use client";

import React, { useRef, useState, useCallback } from "react";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  spotlightColor?: string;
  borderColor?: string;
  className?: string;
  glowSize?: number;
}

/**
 * Interactive Bento Spotlight Card.
 * Tracks cursor coordinates across the card surface to project a localized radial glow
 * and catch the hairline border, bringing depth and tactile immersion.
 */
export function SpotlightCard({
  children,
  spotlightColor = "rgba(var(--c-accent-rgb, 225 29 72) / 0.09)",
  borderColor = "rgba(var(--c-accent-rgb, 225 29 72) / 0.25)",
  className = "",
  glowSize = 350,
  ...props
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setPosition(null);
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-2xl border border-line/10 bg-elevated transition-all duration-300 hover:border-line/25 hover:shadow-lg ${className}`}
      {...props}
    >
      {/* ── Spotlight glow following cursor ── */}
      {isHovered && position && (
        <>
          <div
            className="pointer-events-none absolute -inset-px rounded-2xl opacity-100 transition-opacity duration-300 z-0"
            style={{
              background: `radial-gradient(${glowSize}px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 75%)`,
            }}
          />
          <div
            className="pointer-events-none absolute -inset-px rounded-2xl opacity-100 transition-opacity duration-300 z-0"
            style={{
              background: `radial-gradient(${glowSize * 0.7}px circle at ${position.x}px ${position.y}px, ${borderColor}, transparent 80%)`,
              maskImage: "linear-gradient(#fff, #fff) content-box, linear-gradient(#fff, #fff)",
              WebkitMaskImage: "linear-gradient(#fff, #fff) content-box, linear-gradient(#fff, #fff)",
              maskComposite: "exclude",
              WebkitMaskComposite: "xor",
              padding: "1px",
            }}
          />
        </>
      )}

      {/* ── Inner content layer ── */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
