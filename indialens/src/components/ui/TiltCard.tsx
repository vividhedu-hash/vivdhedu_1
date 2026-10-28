"use client";

import React, { useRef, useState, useCallback } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // max tilt degrees (default 7)
  glareColor?: string;
  spotlightColor?: string;
}

/**
 * 3D Physics-based Perspective Tilt Card with specular glare and edge spotlight.
 * Follows mouse movement with spring physics to give cards physical weight and spatial depth.
 */
export function TiltCard({
  children,
  className = "",
  maxTilt = 6,
  glareColor = "rgba(255, 255, 255, 0.12)",
  spotlightColor = "rgba(var(--c-accent-rgb, 225 29 72) / 0.1)",
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });

  // Spring physics for smooth tilt recovery
  const springConfig = { stiffness: 260, damping: 20, mass: 0.5 };
  const mouseX = useSpring(0, springConfig);
  const mouseY = useSpring(0, springConfig);

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-maxTilt, maxTilt]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      mouseX.set(x);
      mouseY.set(y);

      setGlarePos({
        x: Math.round(((e.clientX - rect.left) / rect.width) * 100),
        y: Math.round(((e.clientY - rect.top) / rect.height) * 100),
      });
    },
    [mouseX, mouseY]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <div style={{ perspective: 1000 }} className="inline-block w-full">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={`relative overflow-hidden rounded-2xl border border-line/10 bg-elevated transition-shadow duration-300 ${
          isHovered ? "shadow-2xl border-line/25" : "shadow-md"
        } ${className}`}
        {...props}
      >
        {/* ── Dynamic Specular Glare & Spotlight ── */}
        {isHovered && (
          <>
            {/* Ambient Radial Spotlight */}
            <div
              className="pointer-events-none absolute inset-0 z-0 opacity-100 transition-opacity duration-300"
              style={{
                background: `radial-gradient(400px circle at ${glarePos.x}% ${glarePos.y}%, ${spotlightColor}, transparent 75%)`,
              }}
            />
            {/* Specular White Glare */}
            <div
              className="pointer-events-none absolute inset-0 z-0 opacity-60 mix-blend-overlay transition-opacity duration-300"
              style={{
                background: `radial-gradient(320px circle at ${glarePos.x}% ${glarePos.y}%, ${glareColor}, transparent 80%)`,
              }}
            />
          </>
        )}

        {/* ── Inner Content (Lifted slightly in Z-space) ── */}
        <div className="relative z-10" style={{ transform: "translateZ(20px)" }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
