"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  ExternalLink,
  ImageIcon,
  CheckCircle2,
  Bookmark,
  Copy,
  Check,
  Brain,
  GraduationCap,
  TrendingUp,
  ShieldCheck,
  HelpCircle,
  X,
  Maximize2,
  ChevronRight,
  Info,
} from "lucide-react";
import type { GroundedPayload, GroundedMediaImage } from "../lib/grounded";
import { usePersonMemory } from "@/lib/person-memory-context";

interface GoogleAIModeViewProps {
  payload: GroundedPayload;
  query: string;
  onAskFollowUp?: (q: string) => void;
  selectedModel?: string;
}

export function GoogleAIModeView({
  payload,
  query,
  onAskFollowUp,
  selectedModel,
}: GoogleAIModeViewProps) {
  const [copied, setCopied] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GroundedMediaImage | null>(null);
  const { packet, remember } = usePersonMemory();

  const text = payload.text || payload.advice_markdown || "";
  const citations = payload.citations ?? [];
  const images = payload.images ?? [];
  const isGrounded = Boolean(payload.grounded) && citations.length > 0;

  // Extract student structured takeaways if text has them or synthesize from content
  const takeaways = useMemo(() => {
    const list: Array<{ icon: React.ReactNode; label: string; text: string; color: string }> = [];

    // Look for fee/costs
    const feeMatch = text.match(/(?:fees?|cost|budget|tuition|total fee)[^.\n]{5,100}/i);
    if (feeMatch) {
      list.push({
        icon: <TrendingUp size={14} />,
        label: "Fee & Investment",
        text: feeMatch[0].trim(),
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      });
    }

    // Look for placements/salary
    const placementMatch = text.match(/(?:placement|salary|ctc|lpa|package|median)[^.\n]{5,100}/i);
    if (placementMatch) {
      list.push({
        icon: <GraduationCap size={14} />,
        label: "Placements & Median",
        text: placementMatch[0].trim(),
        color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      });
    }

    // Look for cutoffs/eligibility
    const cutoffMatch = text.match(/(?:cutoff|rank|percentile|eligibility|jee|neet|cat)[^.\n]{5,100}/i);
    if (cutoffMatch) {
      list.push({
        icon: <ShieldCheck size={14} />,
        label: "Cutoffs & Admission",
        text: cutoffMatch[0].trim(),
        color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      });
    }

    // Look for action/warning/next steps
    const actionMatch = text.match(/(?:next step|recommend|verified|counselling|caution)[^.\n]{5,100}/i);
    if (actionMatch) {
      list.push({
        icon: <Brain size={14} />,
        label: "Student Recommendation",
        text: actionMatch[0].trim(),
        color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      });
    }

    return list;
  }, [text]);

  // People Also Ask generator based on query
  const relatedQuestions = useMemo(() => {
    const qLower = query.toLowerCase();
    const suggestions: string[] = [];

    if (qLower.includes("vs") || qLower.includes("compare")) {
      suggestions.push("Which institution has a better 20-year alumni network?");
      suggestions.push("What is the real hostel & campus culture breakdown?");
      suggestions.push("Median salary comparison after excluding international offers");
    } else if (qLower.includes("iit") || qLower.includes("nit") || qLower.includes("bits")) {
      suggestions.push("Category-wise closing ranks for round 6 JoSAA");
      suggestions.push("Fee waiver and scholarship options for ₹5L income bracket");
      suggestions.push("Core branch vs CSE branch placement statistics");
    } else if (qLower.includes("ca") || qLower.includes("mba") || qLower.includes("finance")) {
      suggestions.push("What is the payback period after considering 3-year articleship?");
      suggestions.push("AI automation vulnerability score in investment banking");
    } else {
      suggestions.push(`What are the hidden costs beyond tuition fees for this path?`);
      suggestions.push(`How does NIRF ranking compare with international QS rankings?`);
      suggestions.push(`What are the backup options if cutoff percentile falls short?`);
    }

    return suggestions;
  }, [query]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${query}\n\n${text}\n\nSources:\n` + citations.map(c => `- ${c.title}: ${c.url}`).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToMemory = () => {
    remember({
      key: "researched_query",
      value: query,
      confidence: 0.9,
      source: "google-ai-mode",
    });
    alert("Saved research question to your student memory profile!");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Google AI Overview Header ───────────────────────── */}
      <div className="p-4 sm:p-5 rounded-2xl border border-line/25 bg-gradient-to-br from-surface to-elevated/80 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line/15">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-teal-400 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold tracking-tight text-ink">AI Overview</span>
                <span className="badge badge-teal text-[10px] py-0 px-2">Google Mode</span>
              </div>
              <p className="text-[11px] text-ink-3">
                Live research synthesis grounded with Tavily & OpenRouter Free Frontier
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-chip text-ink-2 border border-line/20">
              {payload.engine || selectedModel || "Nemotron 3.5 Lightning (Free)"}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg border border-line/20 hover:bg-chip text-ink-2 transition-colors"
              title="Copy Research Summary"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
            <button
              onClick={handleSaveToMemory}
              className="p-1.5 rounded-lg border border-line/20 hover:bg-chip text-ink-2 transition-colors"
              title="Save to Personal Memory"
            >
              <Bookmark size={14} />
            </button>
          </div>
        </div>

        {/* ── Tavily Live Image Gallery (Like Google AI Mode) ─── */}
        {images.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-3 flex items-center gap-1.5">
                <ImageIcon size={12} className="text-blue-500" />
                Live Media & Evidence ({images.length})
              </span>
              <span className="text-[11px] text-ink-3">Click to zoom</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 overflow-x-auto pb-1">
              {images.slice(0, 4).map((img, idx) => (
                <div
                  key={img.url + idx}
                  onClick={() => setSelectedImage(img)}
                  className="group relative h-28 rounded-xl overflow-hidden border border-line/20 bg-chip/40 cursor-pointer hover:border-accent/40 transition-all shadow-xs"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.title || "Research Evidence"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                  <div className="absolute bottom-1.5 left-2 right-2 text-[10px] text-white line-clamp-2 font-medium">
                    {img.title || "Campus & Placement Data"}
                  </div>
                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-md p-1 text-white">
                    <Maximize2 size={10} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Key Student Takeaway Badges ─────────────────────── */}
        {takeaways.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {takeaways.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-[12px] flex items-start gap-2.5 ${item.color}`}
              >
                <div className="mt-0.5 shrink-0">{item.icon}</div>
                <div className="min-w-0">
                  <div className="font-semibold text-[11px] tracking-wide uppercase opacity-90">
                    {item.label}
                  </div>
                  <div className="text-[12px] leading-snug line-clamp-2 mt-0.5 font-medium">
                    {item.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Core Synthesized Research Body ──────────────────── */}
        <div className="pt-2 text-[14px] leading-relaxed text-ink space-y-3 font-normal whitespace-pre-wrap selection:bg-blue-500/20">
          {text}
        </div>

        {/* ── Student Personal Memory Grounding Badge ──────────── */}
        {packet.prompt_block && (
          <div className="p-2.5 rounded-xl border border-line/15 bg-chip/40 flex items-center justify-between text-[11px] text-ink-3">
            <span className="flex items-center gap-1.5">
              <Brain size={12} className="text-purple-500" />
              Tailored with your student preferences & target constraints
            </span>
            <span className="font-mono text-[10px] text-purple-400">Memory Active</span>
          </div>
        )}
      </div>

      {/* ── Verified Sources & Google Favicons ───────────────── */}
      {citations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold uppercase tracking-wider text-ink-2">
                Verified Sources ({citations.length})
              </span>
              <span className="badge badge-teal text-[10px] py-0 px-2 flex items-center gap-1">
                <CheckCircle2 size={10} />
                Live Grounded
              </span>
            </div>
            <span className="text-[11px] text-ink-3">Direct external links</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {citations.map((c, i) => {
              let domain = "source";
              try {
                domain = new URL(c.url).hostname.replace(/^www\./, "");
              } catch {
                domain = c.url;
              }
              const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

              return (
                <a
                  key={c.url + "-" + i}
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-line/20 bg-surface hover:bg-chip/60 hover:border-accent/30 transition-all flex flex-col justify-between group shadow-xs"
                >
                  <div className="flex items-start gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={faviconUrl}
                      alt={domain}
                      className="w-4 h-4 rounded mt-0.5 shrink-0 opacity-80 group-hover:opacity-100"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-ink group-hover:text-accent line-clamp-1 transition-colors">
                        {c.title || domain}
                      </p>
                      <p className="text-[10px] text-ink-3 font-mono truncate">{domain}</p>
                    </div>
                  </div>

                  {c.snippet && (
                    <p className="text-[11px] text-ink-2 line-clamp-2 mt-2 leading-tight">
                      {c.snippet}
                    </p>
                  )}

                  <div className="mt-2.5 pt-2 border-t border-line/10 flex items-center justify-between text-[10px] text-ink-3 group-hover:text-accent">
                    <span>Source #{i + 1}</span>
                    <ExternalLink size={10} />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* ── People Also Ask / Related Student Research Queries ─ */}
      {relatedQuestions.length > 0 && onAskFollowUp && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center gap-1.5 text-[12px] font-bold text-ink-2 uppercase tracking-wider">
            <HelpCircle size={13} className="text-amber-500" />
            Students Also Research
          </div>
          <div className="flex flex-wrap gap-2">
            {relatedQuestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onAskFollowUp(q)}
                className="px-3 py-1.5 rounded-full border border-line/20 bg-surface hover:bg-chip hover:border-accent/40 text-[12px] text-ink text-left flex items-center gap-1.5 transition-all shadow-xs group"
              >
                <span>{q}</span>
                <ChevronRight size={12} className="text-ink-3 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Image Lightbox Modal ─────────────────────────────── */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-surface rounded-2xl overflow-hidden border border-line/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 border-b border-line/15 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-ink line-clamp-1">
                {selectedImage.title || "Visual Evidence"}
              </span>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1 rounded-lg hover:bg-chip text-ink-2"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-black/30 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage.url}
                alt={selectedImage.title || "Evidence"}
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
            {selectedImage.description && (
              <div className="p-3 text-[12px] text-ink-2 bg-chip/30 border-t border-line/10">
                {selectedImage.description}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
