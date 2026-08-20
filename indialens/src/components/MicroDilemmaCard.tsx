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
    <div
      style={{
        background: "rgba(18, 18, 30, 0.8)",
        backdropFilter: "blur(20px)",
        border: item.is_generative
          ? "1px solid rgba(147, 51, 234, 0.4)"
          : "1px solid rgba(79, 110, 247, 0.3)",
        borderRadius: 24,
        padding: 32,
        boxShadow: item.is_generative
          ? "0 20px 50px rgba(147, 51, 234, 0.15)"
          : "0 20px 50px rgba(0, 0, 0, 0.4)",
        transition: "all 0.3s ease",
      }}
    >
      {/* Top badges */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {item.is_generative ? (
            <span
              className="badge"
              style={{
                background: "rgba(147, 51, 234, 0.15)",
                color: "#C084FC",
                border: "1px solid rgba(147, 51, 234, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <Sparkles size={12} /> Personalised scenario
            </span>
          ) : (
            <span
              className="badge"
              style={{
                background: "rgba(79, 110, 247, 0.15)",
                color: "#7B96FF",
                border: "1px solid rgba(79, 110, 247, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <Zap size={12} /> Scenario
            </span>
          )}

          <span style={{ fontSize: 11, color: "#8B8BA7" }} className="font-mono">
            {itemIndex} of {totalItems}
          </span>
        </div>

        <div className="flex items-center gap-1" style={{ fontSize: 11, color: "#6B6B80" }}>
          <Key size={12} /> 1–4
        </div>
      </div>

      {/* Scenario Question Prompt */}
      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          lineHeight: 1.5,
          color: "#F0F0F5",
          marginBottom: 24,
        }}
      >
        {item.prompt}
      </h2>

      {/* Options List */}
      <div className="space-y-3">
        {item.options.map((opt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(opt)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "16px 20px",
              borderRadius: 14,
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "#E2E8F0",
              fontSize: 14,
              fontWeight: 500,
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = item.is_generative
                ? "rgba(147, 51, 234, 0.12)"
                : "rgba(79, 110, 247, 0.12)";
              e.currentTarget.style.borderColor = item.is_generative
                ? "#C084FC"
                : "#4F6EF7";
              e.currentTarget.style.transform = "translateX(4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.transform = "none";
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 800,
                color: item.is_generative ? "#C084FC" : "#7B96FF",
                flexShrink: 0,
              }}
            >
              {idx + 1}
            </div>
            <span style={{ lineHeight: 1.4 }}>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
