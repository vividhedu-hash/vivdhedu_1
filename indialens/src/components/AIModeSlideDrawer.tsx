"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  X,
  Search,
  Maximize2,
  ExternalLink,
  ImageIcon,
  Brain,
  CheckCircle2,
  Bookmark,
  Layers,
  ChevronRight,
  TrendingUp,
  GraduationCap,
  Plus,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import {
  getAi,
  postAi,
  aiErrorMessage,
  type GroundedPayload,
  type GroundedMediaImage,
} from "@/lib/grounded";
import { OPENROUTER_FREE_MODELS } from "@/lib/gemini-direct";
import { usePersonMemory } from "@/lib/person-memory-context";

export function AIModeSlideDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState("nvidia/nemotron-3.5-lightning:free");
  const [activeSlide, setActiveSlide] = useState<"overview" | "images" | "deepdive" | "sources" | "memory">("overview");
  const [loading, setLoading] = useState(false);
  const [modePayload, setModePayload] = useState<GroundedPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customFactKey, setCustomFactKey] = useState("");
  const [customFactVal, setCustomFactVal] = useState("");
  const [copied, setCopied] = useState(false);

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { packet, remember, track, state } = usePersonMemory();

  // Listen for open events & keyboard shortcut (⌘J or Ctrl+J)
  useEffect(() => {
    function handleOpenEvent(e: Event) {
      const customEvent = e as CustomEvent<{ query?: string }>;
      setIsOpen(true);
      if (customEvent.detail?.query) {
        setQuery(customEvent.detail.query);
        void handleSearch(customEvent.detail.query);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    window.addEventListener("open-ai-slide", handleOpenEvent);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("open-ai-slide", handleOpenEvent);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  async function handleSearch(searchQuery?: string) {
    const q = (searchQuery ?? query).trim();
    if (q.length < 3) return;

    setLoading(true);
    setError(null);

    // Track query & auto-extract student memory
    track({ signal: "ask", text: q, path: "/ai-slide" });

    // Auto extract college or exam
    const lower = q.toLowerCase();
    if (lower.includes("iit")) {
      remember({ key: "interest_tier", value: "IIT", confidence: 0.85, source: "ai-slide" });
    }
    if (lower.includes("bits")) {
      remember({ key: "target_college", value: "BITS Pilani", confidence: 0.9, source: "ai-slide" });
    }
    if (lower.includes("nit")) {
      remember({ key: "interest_tier", value: "NIT", confidence: 0.85, source: "ai-slide" });
    }
    if (lower.includes("cse") || lower.includes("computer")) {
      remember({ key: "target_field", value: "engineering-cs", confidence: 0.9, source: "ai-slide" });
    }
    if (lower.includes("medical") || lower.includes("mbbs") || lower.includes("neet")) {
      remember({ key: "target_field", value: "medicine", confidence: 0.9, source: "ai-slide" });
    }
    if (lower.includes("mba") || lower.includes("cat")) {
      remember({ key: "target_field", value: "management", confidence: 0.9, source: "ai-slide" });
    }

    const { ok, status, data } = await postAi<GroundedPayload | { detail?: { reason?: string } }>(
      "/api/v1/ai/mode",
      {
        query: q,
        model: selectedModel,
        person_context: packet.prompt_block,
      },
    );

    setLoading(false);
    if (!ok) {
      setModePayload(null);
      setError(aiErrorMessage(data, `Search did not respond (HTTP ${status}).`));
      return;
    }

    setModePayload(data as GroundedPayload);
  }

  const handleAddCustomFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFactKey.trim() || !customFactVal.trim()) return;
    remember({
      key: customFactKey.trim(),
      value: customFactVal.trim(),
      confidence: 1.0,
      source: "student-custom",
    });
    setCustomFactKey("");
    setCustomFactVal("");
  };

  const handleCopySummary = () => {
    if (!modePayload) return;
    const text = modePayload.text || "";
    navigator.clipboard.writeText(`${query}\n\n${text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const citations = modePayload?.citations ?? [];
  const images = modePayload?.images ?? [];
  const text = modePayload?.text || "";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-fade-in">
      {/* ── Slide Drawer Panel ─────────────────────────────────── */}
      <div className="relative w-full max-w-xl sm:max-w-2xl h-full bg-surface border-l border-line/25 shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-left">
        {/* ── Header ───────────────────────────────────────────── */}
        <div className="p-4 border-b border-line/20 bg-elevated/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-teal-400 flex items-center justify-center text-white shadow-sm">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[14px] font-bold text-ink">Google AI Mode</h2>
                <span className="badge badge-teal text-[10px] py-0 px-2">Research Slide</span>
              </div>
              <p className="text-[11px] text-ink-3">Tavily Grounding · Free OpenRouter Models · Personal Memory</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push(`/advisor?q=${encodeURIComponent(query)}`);
              }}
              className="p-1.5 rounded-lg border border-line/20 hover:bg-chip text-ink-2 transition-colors"
              title="Expand to Full Page"
            >
              <Maximize2 size={15} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg border border-line/20 hover:bg-chip text-ink-2 transition-colors"
              title="Close Slide (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Search Input & Model Selector Bar ────────────────── */}
        <div className="p-3.5 border-b border-line/15 bg-surface space-y-2.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSearch();
            }}
            className="relative flex items-center"
          >
            <Search size={16} className="absolute left-3 text-ink-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything (e.g. BITS Pilani CSE vs NIT Trichy ROI 2025)..."
              disabled={loading}
              className="w-full pl-9 pr-24 py-2.5 text-[13px] rounded-xl border border-line/25 bg-chip/40 text-ink placeholder:text-ink-3 focus:outline-hidden focus:border-accent"
            />
            <button
              type="submit"
              disabled={loading || query.trim().length < 3}
              className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-[12px] font-medium disabled:opacity-50 transition-all"
            >
              {loading ? "Searching…" : "Search"}
            </button>
          </form>

          {/* Model picker & quick presets */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-ink-3">
              <span>Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-chip border border-line/20 rounded-md px-2 py-0.5 text-ink text-[11px] font-mono"
              >
                {OPENROUTER_FREE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
              {[
                "IIT vs BITS ROI",
                "JoSAA Round 6 cutoffs",
                "CA vs MBA salary",
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setQuery(preset);
                    void handleSearch(preset);
                  }}
                  className="px-2 py-0.5 rounded-md bg-chip hover:bg-chip/80 text-ink-2 border border-line/15 whitespace-nowrap"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Slide Tabs Navigation ────────────────────────────── */}
        {modePayload && (
          <div className="flex items-center gap-1 px-4 py-2 border-b border-line/15 bg-elevated/40 text-[12px]">
            <button
              onClick={() => setActiveSlide("overview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeSlide === "overview" ? "bg-accent text-white" : "text-ink-2 hover:bg-chip"
              }`}
            >
              <Sparkles size={13} />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveSlide("images")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeSlide === "images" ? "bg-accent text-white" : "text-ink-2 hover:bg-chip"
              }`}
            >
              <ImageIcon size={13} />
              <span>Images ({images.length})</span>
            </button>
            <button
              onClick={() => setActiveSlide("deepdive")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeSlide === "deepdive" ? "bg-accent text-white" : "text-ink-2 hover:bg-chip"
              }`}
            >
              <Layers size={13} />
              <span>Deep Dive</span>
            </button>
            <button
              onClick={() => setActiveSlide("sources")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeSlide === "sources" ? "bg-accent text-white" : "text-ink-2 hover:bg-chip"
              }`}
            >
              <ExternalLink size={13} />
              <span>Sources ({citations.length})</span>
            </button>
            <button
              onClick={() => setActiveSlide("memory")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeSlide === "memory" ? "bg-accent text-white" : "text-ink-2 hover:bg-chip"
              }`}
            >
              <Brain size={13} />
              <span>Student Memory</span>
            </button>
          </div>
        )}

        {/* ── Slide Content Body ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 text-[13px]">
              {error}
            </div>
          )}

          {loading && (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
              <p className="text-[13px] text-ink-2 font-medium">
                Searching verified web sources with Tavily & synthesizing with {selectedModel.split("/")[1] || "AI"}…
              </p>
            </div>
          )}

          {!modePayload && !loading && !error && (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-chip/60 border border-line/20 flex items-center justify-center mx-auto text-accent">
                <Sparkles size={24} />
              </div>
              <h3 className="text-[16px] font-bold text-ink">Google AI Student Mode</h3>
              <p className="text-[13px] text-ink-3 max-w-sm mx-auto leading-relaxed">
                Slide out anytime while browsing VividhEdu. Get live source citations, campus pictures, cutoff percentiles, and personalized memory.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                {[
                  "What is the realistic salary trajectory for NIT Trichy ECE?",
                  "IIT Bombay vs BITS Pilani CSE fees and payback",
                  "Is a ₹25L education loan worth it for private college?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setQuery(q);
                      void handleSearch(q);
                    }}
                    className="p-2 text-left rounded-lg border border-line/15 bg-chip/30 hover:bg-chip text-[12px] text-ink-2 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {modePayload && !loading && (
            <>
              {/* ── Slide Tab 1: Overview ────────────────────── */}
              {activeSlide === "overview" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-line/15">
                    <span className="text-[12px] font-bold text-ink uppercase tracking-wider">
                      Executive Research Overview
                    </span>
                    <button
                      onClick={handleCopySummary}
                      className="flex items-center gap-1 text-[11px] text-ink-3 hover:text-accent"
                    >
                      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  <div className="text-[14px] leading-relaxed text-ink whitespace-pre-wrap">
                    {text}
                  </div>

                  {images.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <span className="text-[11px] font-mono text-ink-3 uppercase">Visual Highlights</span>
                      <div className="grid grid-cols-2 gap-2">
                        {images.slice(0, 2).map((img, i) => (
                          <div key={i} className="h-28 rounded-lg overflow-hidden border border-line/20 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.url} alt="Evidence" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2">
                              <span className="text-[10px] text-white line-clamp-1">{img.title}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Slide Tab 2: Images ──────────────────────── */}
              {activeSlide === "images" && (
                <div className="space-y-4 animate-fade-in">
                  <span className="text-[12px] font-bold text-ink uppercase tracking-wider">
                    Campus & Placement Media from Web Evidence
                  </span>
                  {images.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {images.map((img, idx) => (
                        <div key={idx} className="rounded-xl overflow-hidden border border-line/20 bg-chip/30">
                          <div className="h-36 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.url} alt={img.title || "Evidence"} className="w-full h-full object-cover" />
                          </div>
                          <div className="p-2.5">
                            <p className="text-[12px] font-semibold text-ink line-clamp-1">{img.title || "Visual"}</p>
                            {img.description && <p className="text-[11px] text-ink-3 line-clamp-2 mt-0.5">{img.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-ink-3 py-10 text-center">No images found for this query.</p>
                  )}
                </div>
              )}

              {/* ── Slide Tab 3: Deep Dive ───────────────────── */}
              {activeSlide === "deepdive" && (
                <div className="space-y-4 animate-fade-in text-[14px] leading-relaxed text-ink whitespace-pre-wrap">
                  {text}
                </div>
              )}

              {/* ── Slide Tab 4: Sources ─────────────────────── */}
              {activeSlide === "sources" && (
                <div className="space-y-3 animate-fade-in">
                  <span className="text-[12px] font-bold text-ink uppercase tracking-wider">
                    Official & Verified Sources ({citations.length})
                  </span>
                  <div className="space-y-2">
                    {citations.map((c, idx) => (
                      <a
                        key={idx}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl border border-line/20 bg-surface hover:bg-chip/60 flex items-start justify-between gap-3 group transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-ink group-hover:text-accent line-clamp-1">
                            {c.title || c.url}
                          </p>
                          <p className="text-[11px] text-ink-3 font-mono truncate">{c.url}</p>
                          {c.snippet && <p className="text-[11px] text-ink-2 mt-1 line-clamp-2">{c.snippet}</p>}
                        </div>
                        <ExternalLink size={13} className="shrink-0 text-ink-3 group-hover:text-accent" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Slide Tab 5: Personal Memory ─────────────── */}
              {activeSlide === "memory" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-1.5">
                    <div className="flex items-center gap-2 text-purple-600 font-semibold text-[13px]">
                      <Brain size={15} />
                      Your Student Profile Memory
                    </div>
                    <p className="text-[12px] text-ink-2">
                      VividhEdu learns your preferences (interests, target colleges, budget) to personalize all research answers without hallucinating.
                    </p>
                  </div>

                  {/* Stored facts */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono text-ink-3 uppercase">Active Memory Facts</span>
                    <div className="space-y-1.5">
                      {state.facts.length > 0 ? (
                        state.facts.map((fact, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg border border-line/15 bg-chip/30 flex items-center justify-between text-[12px]"
                          >
                            <span className="font-semibold text-ink">{fact.key}:</span>
                            <span className="text-ink-2 font-mono">{String(fact.value)}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[12px] text-ink-3 py-2">No facts remembered yet. Ask questions or add below!</p>
                      )}
                    </div>
                  </div>

                  {/* Add fact form */}
                  <form onSubmit={handleAddCustomFact} className="p-3 rounded-xl border border-line/20 bg-elevated/40 space-y-2.5">
                    <span className="text-[11px] font-bold text-ink uppercase">Add Custom Memory Note</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Key (e.g. max_budget)"
                        value={customFactKey}
                        onChange={(e) => setCustomFactKey(e.target.value)}
                        className="p-2 rounded-lg border border-line/20 bg-surface text-[12px] text-ink"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. ₹15 Lakhs)"
                        value={customFactVal}
                        onChange={(e) => setCustomFactVal(e.target.value)}
                        className="p-2 rounded-lg border border-line/20 bg-surface text-[12px] text-ink"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!customFactKey || !customFactVal}
                      className="w-full py-1.5 rounded-lg bg-accent text-white text-[12px] font-medium disabled:opacity-50"
                    >
                      Save Memory Fact
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Drawer Footer ─────────────────────────────────────── */}
        <div className="p-3 border-t border-line/15 bg-elevated/40 flex items-center justify-between text-[11px] text-ink-3">
          <span>Press ⌘J or Ctrl+J to toggle anytime</span>
          <span className="font-mono">Google AI Mode · VividhEdu</span>
        </div>
      </div>
    </div>
  );
}
