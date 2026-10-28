"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Command,
  ArrowRight,
  TrendingUp,
  Sliders,
  Scale,
  Sparkles,
  BookOpen,
  Compass,
  Zap,
  X,
} from "lucide-react";
import { playUiPop, playSliderTick } from "@/lib/ui-sound";

interface CommandItem {
  id: string;
  category: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: "cockpit",
      category: "Simulation & Tools",
      label: "Open Actuarial Cockpit (20-Year NPV)",
      shortcut: "↵",
      icon: <TrendingUp size={14} className="text-emerald-500" />,
      action: () => {
        router.push("/workspace");
        setIsOpen(false);
      },
    },
    {
      id: "compare",
      category: "Simulation & Tools",
      label: "Compare Degree Programs Side-by-Side",
      shortcut: "↵",
      icon: <Scale size={14} className="text-indigo-500" />,
      action: () => {
        router.push("/compare");
        setIsOpen(false);
      },
    },
    {
      id: "weights",
      category: "Simulation & Tools",
      label: "Adjust 7-Vector Decision Weights",
      shortcut: "↵",
      icon: <Sliders size={14} className="text-accent" />,
      action: () => {
        router.push("/workspace");
        setIsOpen(false);
      },
    },
    {
      id: "explore",
      category: "Navigation",
      label: "Explore All Verified College Programs",
      shortcut: "↵",
      icon: <Compass size={14} className="text-amber-500" />,
      action: () => {
        router.push("/explore");
        setIsOpen(false);
      },
    },
    {
      id: "methodology",
      category: "Documentation",
      label: "Actuarial Methodology & Data Provenance",
      shortcut: "↵",
      icon: <BookOpen size={14} className="text-sys-blue" />,
      action: () => {
        router.push("/methodology");
        setIsOpen(false);
      },
    },
    {
      id: "advisor",
      category: "Navigation",
      label: "AI Admissions & Career Advisor",
      shortcut: "↵",
      icon: <Sparkles size={14} className="text-purple-500" />,
      action: () => {
        router.push("/advisor");
        setIsOpen(false);
      },
    },
    {
      id: "iit-bombay",
      category: "Quick Program Lookups",
      label: "IIT Bombay — B.Tech Computer Science (20Y NPV: ₹4.8Cr)",
      icon: <Zap size={14} className="text-accent" />,
      action: () => {
        router.push("/explore?q=IIT+Bombay");
        setIsOpen(false);
      },
    },
    {
      id: "bits-pilani",
      category: "Quick Program Lookups",
      label: "BITS Pilani — B.E. Electronics & Instrumentation",
      icon: <Zap size={14} className="text-accent" />,
      action: () => {
        router.push("/explore?q=BITS+Pilani");
        setIsOpen(false);
      },
    },
    {
      id: "iim-ahmedabad",
      category: "Quick Program Lookups",
      label: "IIM Ahmedabad — Post Graduate Programme (MBA)",
      icon: <Zap size={14} className="text-accent" />,
      action: () => {
        router.push("/explore?q=IIM+Ahmedabad");
        setIsOpen(false);
      },
    },
  ];

  const filtered = query.trim()
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  // Global Hotkey Listener (Cmd+K, Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        playUiPop(520);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleArrowKeys = useCallback(
    (e: React.KeyboardEvent) => {
      if (filtered.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = (prev + 1) % filtered.length;
          playSliderTick(350 + next * 20);
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = (prev - 1 + filtered.length) % filtered.length;
          playSliderTick(350 + next * 20);
          return next;
        });
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          playUiPop(600);
          filtered[selectedIndex].action();
        }
      }
    },
    [filtered, selectedIndex]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-xl bg-elevated border border-line/20 rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line/10 bg-surface/50">
          <Search size={16} className="text-ink-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleArrowKeys}
            placeholder="Search programs, tools, or run simulation..."
            className="w-full bg-transparent border-none text-xs sm:text-sm text-ink placeholder:text-ink-3 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-ink-3 hover:text-ink text-xs p-1"
            >
              <X size={14} />
            </button>
          )}
          <span className="hidden sm:inline-block font-mono text-[10px] text-ink-3 bg-chip border border-line/10 px-1.5 py-0.5 rounded">
            ESC to close
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-ink-3">
              No matching tools or programs found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    playUiPop(600);
                    item.action();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-accent/10 text-ink font-semibold"
                      : "text-ink-2 hover:bg-surface hover:text-ink"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-ink-3 shrink-0 ml-2">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-surface/80 border-t border-line/10 flex items-center justify-between text-[11px] font-mono text-ink-3">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
          <span>VividhEdu Quick Command</span>
        </div>
      </div>
    </div>
  );
}
