"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  MotionValue,
} from "framer-motion";
import {
  TrendingUp,
  Scale,
  Compass,
  Search,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Sparkles,
  Zap,
} from "lucide-react";
import { playUiPop, playSliderTick, isAudioMuted, setAudioMuted } from "@/lib/ui-sound";
import { useTheme } from "@/lib/theme";

interface DockItemProps {
  mouseX: MotionValue;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}

function DockIcon({ mouseX, icon, label, onClick, active }: DockItemProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // Proximity magnification curve (Apple macOS dock physics)
  const widthSync = useTransform(distance, [-120, 0, 120], [38, 52, 38]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 200, damping: 14 });

  return (
    <div className="relative flex items-center justify-center">
      <motion.button
        ref={ref}
        style={{ width, height: width }}
        onClick={() => {
          playUiPop(560);
          onClick();
        }}
        onMouseEnter={() => {
          setTooltipVisible(true);
          playSliderTick(420);
        }}
        onMouseLeave={() => setTooltipVisible(false)}
        className={`relative flex items-center justify-center rounded-full transition-colors cursor-pointer ${
          active
            ? "bg-accent text-white shadow-md shadow-accent/25"
            : "bg-surface hover:bg-chip text-ink border border-line/10 hover:border-line/25 shadow-xs"
        }`}
        aria-label={label}
      >
        <span className="shrink-0">{icon}</span>
      </motion.button>

      {/* Tooltip */}
      {tooltipVisible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.95 }}
          className="pointer-events-none absolute -top-9 px-2.5 py-1 rounded-lg bg-ink text-elevated text-[11px] font-mono whitespace-nowrap shadow-xl z-50"
        >
          {label}
        </motion.div>
      )}
    </div>
  );
}

export function FloatingDock() {
  const router = useRouter();
  const mouseX = useMotionValue(Infinity);
  const { isDark, toggle: toggleTheme } = useTheme();
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isAudioMuted());
  }, []);

  const handleToggleSound = () => {
    const nextState = !muted;
    setMuted(nextState);
    setAudioMuted(nextState);
    if (!nextState) {
      playUiPop(580);
    }
  };

  const openSearch = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  };

  return (
    <div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-line/20 bg-elevated/85 backdrop-blur-xl shadow-2xl transition-all hover:border-line/30 select-none animate-slide-up"
    >
      {/* 1. Actuarial Cockpit / Workspace */}
      <DockIcon
        mouseX={mouseX}
        icon={<TrendingUp size={16} />}
        label="Actuarial Cockpit"
        onClick={() => router.push("/workspace")}
      />

      {/* 2. Compare Arena */}
      <DockIcon
        mouseX={mouseX}
        icon={<Scale size={16} />}
        label="Compare Programs"
        onClick={() => router.push("/compare")}
      />

      {/* 3. Explore Directory */}
      <DockIcon
        mouseX={mouseX}
        icon={<Compass size={16} />}
        label="Explore Colleges"
        onClick={() => router.push("/explore")}
      />

      {/* Divider */}
      <div className="h-6 w-px bg-line/15 mx-0.5" />

      {/* 4. Quick Search (Cmd+K) */}
      <DockIcon
        mouseX={mouseX}
        icon={<Search size={16} />}
        label="Quick Search (⌘K)"
        onClick={openSearch}
      />

      {/* 5. Sound Micro-Haptics */}
      <DockIcon
        mouseX={mouseX}
        icon={muted ? <VolumeX size={16} className="text-ink-3" /> : <Volume2 size={16} className="text-emerald-500" />}
        label={muted ? "Unmute Audio" : "Tactile Sound: On"}
        onClick={handleToggleSound}
      />

      {/* 6. Theme Toggle */}
      <DockIcon
        mouseX={mouseX}
        icon={isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
        label={isDark ? "Light Mode" : "Dark Mode"}
        onClick={toggleTheme}
      />

      {/* 7. Start Analysis CTA */}
      <DockIcon
        mouseX={mouseX}
        icon={<Zap size={16} />}
        label="Run Free Analysis"
        active
        onClick={() => router.push("/onboard")}
      />
    </div>
  );
}
