"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ImageIcon,
  BarChart3,
  ExternalLink,
  Brain,
  CheckCircle2,
  Bookmark,
  Share2,
  Maximize2,
  Copy,
  Check,
  CheckSquare,
} from "lucide-react";
import type { GroundedPayload } from "../lib/grounded";
import { usePersonMemory } from "@/lib/person-memory-context";

interface AIModeSlideDeckProps {
  payload: GroundedPayload;
  query: string;
  onAskFollowUp?: (q: string) => void;
}

export function AIModeSlideDeck({
  payload,
  query,
  onAskFollowUp,
}: AIModeSlideDeckProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copied, setCopied] = useState(false);
  const { packet, remember } = usePersonMemory();

  const text = payload.text || payload.advice_markdown || "";
  const citations = payload.citations ?? [];
  const images = payload.images ?? [];

  const slides = [
    {
      id: "overview",
      title: "Executive AI Overview & Verdict",
      icon: <Sparkles size={16} className="text-blue-500" />,
      tag: "Slide 1 of 5",
    },
    {
      id: "media",
      title: "Visual Evidence & Campus Media",
      icon: <ImageIcon size={16} className="text-teal-500" />,
      tag: "Slide 2 of 5",
    },
    {
      id: "analysis",
      title: "Deep Dive & Comparative Breakdown",
      icon: <BarChart3 size={16} className="text-purple-500" />,
      tag: "Slide 3 of 5",
    },
    {
      id: "sources",
      title: "Verified Sources & Live Citations",
      icon: <ExternalLink size={16} className="text-amber-500" />,
      tag: "Slide 4 of 5",
    },
    {
      id: "memory",
      title: "Student Roadmap & Personal Memory",
      icon: <Brain size={16} className="text-indigo-500" />,
      tag: "Slide 5 of 5",
    },
  ];

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides.length]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${query}\n\n${text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* ── Slide Navigation Controls Header ──────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-line/20 bg-surface">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                currentSlide === idx
                  ? "bg-accent text-white shadow-sm"
                  : "hover:bg-chip text-ink-2"
              }`}
            >
              {s.icon}
              <span className="hidden sm:inline">{s.title.split(" ")[0]}</span>
              <span className="sm:hidden">{idx + 1}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
            disabled={currentSlide === 0}
            className="p-1.5 rounded-lg border border-line/20 hover:bg-chip disabled:opacity-40 disabled:cursor-not-allowed text-ink transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[12px] font-mono text-ink-2 px-1">
            {currentSlide + 1} / {slides.length}
          </span>
          <button
            onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))}
            disabled={currentSlide === slides.length - 1}
            className="p-1.5 rounded-lg border border-line/20 hover:bg-chip disabled:opacity-40 disabled:cursor-not-allowed text-ink transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Active Slide Canvas ─────────────────────────────── */}
      <div className="relative min-h-[420px] rounded-2xl border border-line/25 bg-gradient-to-br from-surface to-elevated p-6 sm:p-8 shadow-lg flex flex-col justify-between">
        <div className="space-y-4">
          {/* Slide Header */}
          <div className="flex items-center justify-between border-b border-line/15 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-chip/60 border border-line/15">
                {slides[currentSlide].icon}
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold">
                  {slides[currentSlide].tag}
                </span>
                <h3 className="text-[18px] sm:text-[20px] font-bold text-ink">
                  {slides[currentSlide].title}
                </h3>
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-lg border border-line/20 hover:bg-chip text-[12px] text-ink-2 flex items-center gap-1.5"
            >
              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span>{copied ? "Copied" : "Copy Slide"}</span>
            </button>
          </div>

          {/* Slide Content Dynamic View */}
          <div className="pt-2">
            {/* Slide 1: Executive Overview */}
            {currentSlide === 0 && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-2">
                  <span className="text-[11px] font-mono uppercase font-semibold text-blue-500 tracking-wider">
                    Question Researched
                  </span>
                  <p className="text-[15px] font-medium text-ink leading-snug">{query}</p>
                </div>

                <div className="text-[14px] leading-relaxed text-ink whitespace-pre-wrap">
                  {text.split("\n\n").slice(0, 3).join("\n\n")}
                </div>

                <div className="p-3.5 rounded-xl border border-line/20 bg-chip/40 flex items-center justify-between text-[12px]">
                  <span className="text-ink-2">Model Engine:</span>
                  <span className="font-mono text-accent font-semibold">
                    {payload.engine || "Nemotron 3.5 Lightning (Free)"}
                  </span>
                </div>
              </div>
            )}

            {/* Slide 2: Visual Evidence & Media */}
            {currentSlide === 1 && (
              <div className="space-y-4">
                {images.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {images.map((img, i) => (
                      <div
                        key={img.url + i}
                        className="rounded-xl overflow-hidden border border-line/20 bg-chip/30 space-y-2 pb-3"
                      >
                        <div className="h-44 overflow-hidden relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url}
                            alt={img.title || "Evidence"}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        </div>
                        <div className="px-3">
                          <p className="text-[12px] font-semibold text-ink line-clamp-1">
                            {img.title || "Campus & Placement Visual"}
                          </p>
                          {img.description && (
                            <p className="text-[11px] text-ink-3 line-clamp-2 mt-0.5">
                              {img.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-ink-3 space-y-2">
                    <ImageIcon size={32} className="mx-auto opacity-40" />
                    <p className="text-[13px]">No media images returned for this specific search query.</p>
                  </div>
                )}
              </div>
            )}

            {/* Slide 3: Deep Dive */}
            {currentSlide === 2 && (
              <div className="space-y-4 text-[14px] leading-relaxed text-ink whitespace-pre-wrap max-h-[400px] overflow-y-auto pr-2">
                {text}
              </div>
            )}

            {/* Slide 4: Verified Sources */}
            {currentSlide === 3 && (
              <div className="space-y-3">
                <p className="text-[12px] text-ink-3">
                  Every figure in this slide was verified across official portals and verified education news:
                </p>
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {citations.map((c, i) => (
                    <a
                      key={c.url + i}
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl border border-line/20 bg-surface hover:bg-chip/50 flex items-center justify-between gap-3 group transition-all"
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-ink group-hover:text-accent truncate">
                          {c.title || c.url}
                        </p>
                        <p className="text-[11px] text-ink-3 font-mono truncate">{c.url}</p>
                      </div>
                      <ExternalLink size={14} className="shrink-0 text-ink-3 group-hover:text-accent" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Slide 5: Student Memory & Action Checklist */}
            {currentSlide === 4 && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-3">
                  <div className="flex items-center gap-2 text-purple-600 font-semibold text-[13px]">
                    <Brain size={16} />
                    Personal Memory Profile
                  </div>
                  <p className="text-[12px] text-ink-2 leading-relaxed">
                    This research has been automatically connected to your student profile. Future queries in VividhEdu will remember your interest in this path.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-ink-2">
                    Student Action Checklist
                  </span>
                  {[
                    "Verify official counselling portal registration deadlines",
                    "Download and inspect NIRF 2025 raw data submission for this college",
                    "Compare payback with alternative low-debt NIT/IIT options",
                    "Review student-verified reviews in VividhEdu Explore",
                  ].map((task, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-line/15 bg-chip/30 flex items-center gap-3 text-[13px] text-ink"
                    >
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span>{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Slide Footer */}
        <div className="pt-6 border-t border-line/15 flex items-center justify-between text-[11px] text-ink-3">
          <span>Use Left / Right arrow keys to navigate slides</span>
          <span className="font-mono">VividhEdu · Google AI Mode</span>
        </div>
      </div>
    </div>
  );
}
