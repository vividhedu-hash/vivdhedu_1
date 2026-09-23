"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { WorkspaceTelemetrySidebar } from "@/components/WorkspaceTelemetrySidebar";
import { RecentWavesFeed, WaveCard } from "@/components/RecentWavesFeed";
import { AIDecisionCard, AIDecisionResult } from "@/components/AIDecisionCard";
import {
  Compass,
  ArrowRight,
  TrendingUp,
  Target,
  Sparkles,
  Zap,
  Calendar,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Send,
  History,
  CheckSquare,
  Square,
  Award
} from "lucide-react";
import Link from "next/link";

interface TelemetryData {
  aiResilienceScore: number;
  resilience_percentile: string;
  profileStrength: { academic: number; initiative: number; consistency: number };
  primaryGap: string;
  primaryGapOddsMultiplier: string;
  sprintDaysRemaining: number;
  sprintLabel: string;
  milestoneVelocity: string;
  milestonesComplete: number;
  milestonesTotal: number;
}

const DEFAULT_TELEMETRY: TelemetryData = {
  aiResilienceScore: 78,
  resilience_percentile: "top 8% Quant",
  profileStrength: { academic: 82, initiative: 71, consistency: 69 },
  primaryGap: "Faculty co-authorship",
  primaryGapOddsMultiplier: "2.4x",
  sprintDaysRemaining: 12,
  sprintLabel: "SSRN Draft Submission",
  milestoneVelocity: "1.4x pace",
  milestonesComplete: 6,
  milestonesTotal: 10,
};

const INITIAL_FLAGSHIP_SIMULATION: AIDecisionResult = {
  simulationMs: 280,
  confidence: 94,
  recommendation: "Pivot 65% of Q4 bandwidth to Standardised Testing. The 2nd paper yields diminishing returns at current odds.",
  rationale: "Clearing the SAT Math 720+ gating cutoff elevates LSE and Warwick admittance probability from 54% → 89% (+35%). A second preprint without a faculty co-author adds minimal signal given your current co-authorship gap. Standardised scores are the lowest-hanging admissions lever available in Q4.",
  primaryAction: "Complete SAT Math Module 3 (Khan Academy) + 2 timed practice sets before October 14.",
  deltaMetrics: [
    { label: "LSE Admittance", from: "54%", to: "89%", delta: "+35%", positive: true },
    { label: "Profile Resilience", from: "78", to: "84", delta: "+6 pts", positive: true },
    { label: "2nd Paper Marginal Value", from: "High", to: "Low", delta: "−67%", positive: false },
  ],
  loading: false,
};

const QUICK_PROMPTS = [
  "Should I prioritize a 2nd research paper or SAT prep this quarter?",
  "What's my realistic admittance probability at LSE Economics?",
  "Which co-authorship opportunity addresses my primary gap?",
  "How does my AI resilience score compare to the LSE 2027 applicant pool?",
];

interface RoadmapItem {
  id: string;
  label: string;
  due: string;
  status: "active" | "urgent" | "pending";
  completed: boolean;
}

const INITIAL_ROADMAP: RoadmapItem[] = [
  { id: "r1", label: "SAT Math Module 3 (Khan Academy)", due: "Oct 14", status: "active", completed: false },
  { id: "r2", label: "SSRN Working Paper Draft v1", due: "Oct 4", status: "urgent", completed: false },
  { id: "r3", label: "Ashoka Comp. Econ Lab Fellow Application", due: "Oct 30", status: "pending", completed: false },
  { id: "r4", label: "LSE Application Portal Pre-Registration", due: "Jan 15", status: "pending", completed: false },
  { id: "r5", label: "Econometrics Factor Model Formulation", due: "Completed", status: "pending", completed: true },
  { id: "r6", label: "Literature Review on Indian Labor Automation", due: "Completed", status: "pending", completed: true },
];

export default function WorkspacePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#4A4A6A", fontFamily: "var(--font-mono)", fontSize: 13 }}>Loading workspace…</span>
      </div>
    }>
      <WorkspaceContent />
    </Suspense>
  );
}

function WorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? undefined;

  const [question, setQuestion] = useState("");
  const [decisionResult, setDecisionResult] = useState<AIDecisionResult | null>(INITIAL_FLAGSHIP_SIMULATION);
  const [telemetry, setTelemetry] = useState<TelemetryData>(DEFAULT_TELEMETRY);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>(INITIAL_ROADMAP);
  const [history, setHistory] = useState<string[]>([
    "Should I prioritize a 2nd research paper or SAT prep this quarter?"
  ]);
  const [activeTab, setActiveTab] = useState<"decision" | "roadmap">("decision");

  // [AI-CoLab: Cursor] Was fetching a dead external Render host; the report is
  // stored locally and served by /api/report/[token].
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`/api/report/${encodeURIComponent(token)}`, {
          signal: AbortSignal.timeout(8_000),
        });
        if (!res.ok) return;
        const payload = await res.json();
        const data = payload?.student_input ?? payload?.results?.profile_parsed ?? payload;
        if (data?.psychometric_traits) {
          setTelemetry((prev) => ({
            ...prev,
            aiResilienceScore: Math.round((data.psychometric_traits?.ai_adapt ?? 0.78) * 100),
            profileStrength: {
              academic: Math.round((data.psychometric_traits?.diligence ?? 0.82) * 100),
              initiative: Math.round((data.psychometric_traits?.autonomy ?? 0.71) * 100),
              consistency: Math.round((data.psychometric_traits?.security ?? 0.69) * 100),
            },
          }));
        }
      } catch {
        // fall through to defaults
      }
    })();
  }, [token]);

  const handleAsk = useCallback(async (q?: string) => {
    const finalQ = q ?? question;
    if (!finalQ.trim()) return;

    setHistory((h) => [finalQ, ...h.filter(item => item !== finalQ).slice(0, 4)]);
    setQuestion("");

    // Set loading state
    setDecisionResult({
      simulationMs: 0,
      confidence: 0,
      recommendation: "",
      rationale: "",
      primaryAction: "",
      deltaMetrics: [],
      loading: true,
    });

    const start = Date.now();

    try {
      const res = await fetch("/api/workspace/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: finalQ,
          profile_token: token,
          context: {
            ai_resilience_score: telemetry.aiResilienceScore,
            primary_gap: telemetry.primaryGap,
            sprint_label: telemetry.sprintLabel,
          },
        }),
      });

      const elapsed = Date.now() - start;

      if (!res.ok) throw new Error("API error");
      const data = await res.json();

      setDecisionResult({
        simulationMs: Math.max(elapsed, 240),
        confidence: data.confidence ?? 91,
        recommendation: data.recommendation ?? "Simulation complete.",
        rationale: data.rationale ?? "",
        primaryAction: data.primaryAction ?? "",
        deltaMetrics: data.deltaMetrics ?? [],
        loading: false,
      });
    } catch {
      // Offline fallback
      setDecisionResult({
        simulationMs: 280,
        confidence: 88,
        recommendation: "Focus on SAT Math Modules and verified faculty co-authorship.",
        rationale: "Standardised test percentiles act as hard gating at Russell Group institutions. Faculty co-authorship directly addresses your primary identified profile constraint.",
        primaryAction: "Reserve SAT exam slot and prepare timed quant practice tests.",
        deltaMetrics: [
          { label: "Target Gating", from: "54%", to: "89%", delta: "+35%", positive: true },
          { label: "AI Resilience", from: `${telemetry.aiResilienceScore}`, to: `${telemetry.aiResilienceScore + 6}`, delta: "+6 pts", positive: true },
        ],
        loading: false,
      });
    }
  }, [question, token, telemetry]);

  const handleAddToRoadmap = (action: string) => {
    const newItem: RoadmapItem = {
      id: `r-${Date.now()}`,
      label: action,
      due: "Active Sprint",
      status: "active",
      completed: false,
    };
    setRoadmap((prev) => [newItem, ...prev]);
    setTelemetry((prev) => ({
      ...prev,
      milestonesTotal: prev.milestonesTotal + 1,
    }));
    setActiveTab("roadmap");
  };

  const handleToggleRoadmapItem = (id: string) => {
    setRoadmap((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextCompleted = !item.completed;
          setTelemetry((t) => ({
            ...t,
            milestonesComplete: nextCompleted 
              ? Math.min(t.milestonesComplete + 1, t.milestonesTotal) 
              : Math.max(t.milestonesComplete - 1, 0),
          }));
          return { ...item, completed: nextCompleted };
        }
        return item;
      })
    );
  };

  const handleAddWaveToSprint = (wave: WaveCard) => {
    const newItem: RoadmapItem = {
      id: `w-${wave.id}`,
      label: `${wave.title} (${wave.source})`,
      due: wave.deadlineDays ? `${wave.deadlineDays}d` : "Rolling",
      status: "active",
      completed: false,
    };
    setRoadmap((prev) => [newItem, ...prev]);
    setTelemetry((prev) => ({
      ...prev,
      milestonesTotal: prev.milestonesTotal + 1,
    }));
    setActiveTab("roadmap");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", paddingBottom: 80 }}>

      {/* ── Status ticker bar */}
      <div style={{
        background: "rgba(26,108,246,0.04)",
        borderBottom: "1px solid rgba(26,108,246,0.12)",
        padding: "8px 0",
      }}>
        <div className="container-lg">
          <div className="flex items-center justify-between text-xs" style={{ flexWrap: "wrap", gap: 8 }}>
            <div className="flex items-center gap-3">
              <span className="epistemic-tag tag-ui">SCREEN 10 · THE HYBRID WORKSPACE</span>
              <span style={{ color: "#8B8BA7" }}>
                Session: <strong style={{ color: "#F0F0F5" }}>{token ? token.slice(0, 16) : "Alex M. · Baseline Active"}</strong>
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ fontFamily: "var(--font-mono)" }}>
              <span style={{ color: "#0D9488" }}>
                <span className="pulse-dot mr-1" />
                Live Telemetry Active
              </span>
              <span style={{ color: "#4A4A6A" }}>Query latency: ~0.28s</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container-lg" style={{ paddingTop: 28 }}>
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 300px", gap: 24, alignItems: "start" }}>

          {/* ── LEFT: Ambient Telemetry Sidebar */}
          <div style={{ position: "sticky", top: 108 }}>
            <WorkspaceTelemetrySidebar
              aiResilienceScore={telemetry.aiResilienceScore}
              resilience_percentile={telemetry.resilience_percentile}
              profileStrength={telemetry.profileStrength}
              primaryGap={telemetry.primaryGap}
              primaryGapOddsMultiplier={telemetry.primaryGapOddsMultiplier}
              sprintDaysRemaining={telemetry.sprintDaysRemaining}
              sprintLabel={telemetry.sprintLabel}
              milestoneVelocity={telemetry.milestoneVelocity}
              milestonesComplete={telemetry.milestonesComplete}
              milestonesTotal={telemetry.milestonesTotal}
            />

            {/* Quick link to psychometric calibration */}
            <div className="card-accent mt-3 p-3">
              <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#1A6CF6", marginBottom: 4 }}>
                Adaptive CAT Diagnostic
              </p>
              <p style={{ fontSize: 11, color: "#8B8BA7", lineHeight: 1.45, marginBottom: 8 }}>
                Recalibrate your 3PL IRT baseline trait vector across 8 AI resilience archetypes.
              </p>
              <Link href="/psychometric" style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 11, fontWeight: 700, color: "#60A5FA", textDecoration: "none",
              }}>
                Take CAT Assessment
                <ChevronRight size={11} />
              </Link>
            </div>
          </div>

          {/* ── CENTER: AI Decision Engine & Roadmap */}
          <div>
            {/* Header tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[
                { id: "decision", label: "AI Decision Engine", icon: <Zap size={13} /> },
                { id: "roadmap", label: `Active Roadmap (${roadmap.filter(r => !r.completed).length})`, icon: <Target size={13} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", borderRadius: 8,
                    fontSize: 12, fontWeight: 600,
                    cursor: "pointer", transition: "all 0.15s",
                    background: activeTab === tab.id ? "#1A6CF6" : "rgba(30,30,46,0.5)",
                    color: activeTab === tab.id ? "#FFFFFF" : "#8B8BA7",
                    border: activeTab === tab.id ? "1px solid #1A6CF6" : "1px solid rgba(30,30,46,0.8)",
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "decision" && (
              <>
                {/* Question input */}
                <div className="glass-card" style={{ padding: "14px 16px", marginBottom: 16 }}>
                  <div className="flex items-center justify-between mb-2">
                    <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A4A6A" }}>
                      Ask your Sovereign Decision OS
                    </p>
                    <span className="text-[10px] font-mono text-emerald-400">Zero Sycophancy Mode</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="form-input"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAsk()}
                      placeholder="Should I prioritize research or test prep this quarter?"
                      style={{ flex: 1, fontSize: 13 }}
                    />
                    <button
                      onClick={() => handleAsk()}
                      disabled={!question.trim() || decisionResult?.loading}
                      className="btn-primary"
                      style={{ padding: "10px 16px", flexShrink: 0, fontSize: 13 }}
                    >
                      <Send size={13} />
                    </button>
                  </div>

                  {/* Quick prompts */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => handleAsk(p)}
                        style={{
                          fontSize: 10, color: "#8B8BA7",
                          background: "rgba(30,30,46,0.6)",
                          border: "1px solid rgba(30,30,46,0.8)",
                          borderRadius: 999, padding: "3px 10px",
                          cursor: "pointer", transition: "all 0.15s",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220,
                          fontFamily: "var(--font-mono)",
                        }}
                        onMouseOver={(e) => { (e.target as HTMLElement).style.color = "#FFFFFF"; (e.target as HTMLElement).style.borderColor = "#1A6CF6"; }}
                        onMouseOut={(e) => { (e.target as HTMLElement).style.color = "#8B8BA7"; (e.target as HTMLElement).style.borderColor = "rgba(30,30,46,0.8)"; }}
                      >
                        {p.length > 42 ? p.slice(0, 40) + "…" : p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Decision Card */}
                <AIDecisionCard
                  result={decisionResult}
                  onAddToRoadmap={handleAddToRoadmap}
                  onExploreMarketplace={() => router.push("/marketplace")}
                />

                {/* Question History */}
                {history.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A4A6A", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                      <History size={10} />
                      Simulated Questions
                    </p>
                    {history.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleAsk(q)}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, width: "100%",
                          padding: "8px 0", background: "none", border: "none", cursor: "pointer",
                          borderBottom: i < history.length - 1 ? "1px solid rgba(30,30,46,0.4)" : "none",
                          textAlign: "left",
                        }}
                      >
                        <ArrowRight size={11} style={{ color: "#1A6CF6", flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "#8B8BA7" }}>{q}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "roadmap" && (
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white">Longitudinal Sprint Roadmap</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Milestones derived from admissions cutoff gating and AI obsolescence hedges.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950/60 px-2.5 py-1 rounded">
                    {telemetry.milestonesComplete} / {telemetry.milestonesTotal} Completed
                  </span>
                </div>

                <div className="space-y-3">
                  {roadmap.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleRoadmapItem(item.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        item.completed 
                          ? "bg-slate-950/40 border-slate-900 opacity-60" 
                          : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <button className="text-blue-400 shrink-0">
                          {item.completed ? <CheckSquare size={18} className="text-emerald-400" /> : <Square size={18} className="text-slate-500" />}
                        </button>
                        <div>
                          <p className={`text-sm font-semibold ${item.completed ? "line-through text-slate-500" : "text-slate-100"}`}>
                            {item.label}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                            Due {item.due}
                          </p>
                        </div>
                      </div>
                      
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        item.completed 
                          ? "bg-emerald-950/40 text-emerald-400" 
                          : item.status === "urgent" 
                          ? "bg-rose-950/60 text-rose-400 border border-rose-900/40" 
                          : "bg-blue-950/60 text-blue-400 border border-blue-900/40"
                      }`}>
                        {item.completed ? "Done" : item.status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                  <span>Click any milestone to toggle completion.</span>
                  <Link href="/portfolio-builder" className="text-blue-400 font-semibold hover:underline flex items-center gap-1">
                    Assemble Flagship Portfolio <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Recent Waves Feed & Trajectory Analytics */}
          <div style={{ position: "sticky", top: 108 }}>
            <RecentWavesFeed
              profileToken={token}
              onAddWaveToSprint={handleAddWaveToSprint}
            />

            {/* Longitudinal Trajectory Stats (Screen 11 Feature) */}
            <div className="glass-card p-4 mt-4">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8B8BA7" }}>
                  Trajectory Analytics
                </p>
                <span className="text-[10px] font-mono text-blue-400">90-Day Curve</span>
              </div>
              {[
                { label: "Target admittance (LSE)", value: "58%", projected: "81%", color: "#1A6CF6", note: "+34% margin over cohort" },
                { label: "AI Resilience evolution", value: "78/100", projected: "89 proj", color: "#10B981", note: "Top 8% Quant" },
                { label: "Execution velocity", value: "1.4x pace", projected: null, color: "#8B5CF6", note: "6 of 10 milestones clear" },
              ].map((stat) => (
                <div key={stat.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 11, color: "#8B8BA7" }}>{stat.label}</span>
                    <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 700, color: stat.color }}>{stat.value}</span>
                  </div>
                  {stat.projected && (
                    <p style={{ fontSize: 10, color: "#10B981", fontFamily: "var(--font-mono)" }}>→ {stat.projected} projected</p>
                  )}
                  <p style={{ fontSize: 9, color: "#4A4A6A", fontFamily: "var(--font-mono)" }}>{stat.note}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
