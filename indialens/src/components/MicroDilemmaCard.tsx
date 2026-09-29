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

/**
 * One adaptive-assessment scenario and its four options.
 *
 * Behaviour is untouched — the same 1–4 key handler, the same `onSelect`, the
 * same props. The prompt lost its serif face, which was the single largest
 * outlier in the product's typography: one serif prompt inside an otherwise
 * Inter-and-mono surface, and the reason `/advisor` and
 * `/career-trajectory` were flagged in DESIGN-SYSTEM.md as reading like a
 * different website. It is `.page-title-sm` now, which is the size the rest of
 * the product uses for a question at the top of a panel.
 *
 * The options are `.selection-card` — the shared interactive-card treatment,
 * which is the correct class here because these genuinely are clickable and
 * genuinely do change on hover. The numbered key chip is the affordance for the
 * keyboard shortcut, so it is `aria-hidden` (the shortcut is announced in the
 * header instead) and it inverts to the accent on hover/focus, as it did.
 *
 * The progress read-out is `.num`, because "1 of 8" is a figure and the position
 * in the run is the one thing a candidate checks before every answer.
 */
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
    <section className="panel min-w-0">
      <div className="panel-head">
        <span className="flex flex-wrap items-center gap-2">
          {item.is_generative ? (
            <span className="badge badge-purple">
              <Sparkles size={10} aria-hidden="true" />
              Personalised scenario
            </span>
          ) : (
            <span className="badge badge-rose">
              <Zap size={10} aria-hidden="true" />
              Adaptive scenario
            </span>
          )}
          {/* `tag-match` rather than a status badge: the position in the run is
              a match between where you are and how long the run is, not a
              health state. */}
          <span className="epistemic-tag tag-match num">
            {itemIndex} of {totalItems}
          </span>
        </span>
        <span className="num flex items-center gap-1 text-[10px] t-faint">
          <Key size={11} aria-hidden="true" />
          Keys 1&ndash;4
        </span>
      </div>

      <div className="panel-pad-lg">
        <h2 className="page-title-sm mb-6 text-balance">{item.prompt}</h2>

        <div className="space-y-2.5">
          {item.options.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect(opt)}
              className="selection-card group flex w-full items-center gap-3.5 text-left"
            >
              <span
                aria-hidden="true"
                className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line/10 bg-elevated text-[12px] font-bold text-ink-2 transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-bg"
              >
                {idx + 1}
              </span>
              <span className="min-w-0 flex-1 text-[14px] leading-snug t-text">
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
