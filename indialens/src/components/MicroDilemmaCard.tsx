"use client";

import React, { useEffect } from "react";
import { Sparkles, Zap, Key } from "lucide-react";

export interface Option {
  label: string;
  score: number;
  value_bias?: number;
  risk_bias?: number;
  autonomy_bias?: number;
  ai_bias?: number;
}

export interface DilemmaItem {
  id: string;
  trait: string;
  prompt: string;
  options: Option[];
  is_generative?: boolean;
}

interface MicroDilemmaCardProps {
  item: DilemmaItem;
  onSelect: (option: Option) => void;
  itemIndex: number;
  totalItems: number;
}

export function MicroDilemmaCard({ item, onSelect, itemIndex, totalItems }: MicroDilemmaCardProps) {
  // Keyboard listener for 1, 2, 3, 4
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["1", "2", "3", "4"].includes(e.key)) {
        const idx = parseInt(e.key) - 1;
        if (item.options[idx]) {
          onSelect(item.options[idx]);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [item, onSelect]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm transition-all duration-300">
      {/* Top badges */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {item.is_generative ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              <Sparkles className="w-3.5 h-3.5" /> Personalised scenario
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <Zap className="w-3.5 h-3.5" /> Adaptive Scenario
            </span>
          )}

          <span className="text-xs font-mono text-slate-400 font-semibold">
            {itemIndex} of {totalItems}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
          <Key className="w-3.5 h-3.5" /> Keys 1–4
        </div>
      </div>

      {/* Scenario Question Prompt */}
      <h2 className="text-xl sm:text-2xl font-bold text-slate-950 mb-6 leading-relaxed font-serif">
        {item.prompt}
      </h2>

      {/* Options List */}
      <div className="space-y-3">
        {item.options.map((opt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(opt)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-400 hover:bg-slate-100/70 text-slate-800 text-sm font-medium text-left transition-all duration-150 group"
          >
            <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shadow-2xs group-hover:bg-[#09090B] group-hover:text-white group-hover:border-[#09090B] transition-colors shrink-0">
              {idx + 1}
            </div>
            <span className="leading-snug flex-1">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
