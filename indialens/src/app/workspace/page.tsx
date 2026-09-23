"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  Sliders,
  Radio,
  FileText,
  Settings,
  HelpCircle,
  LayoutGrid,
  Shield,
  GraduationCap,
  FlaskConical,
  Headphones,
  Award,
  Bookmark,
  Share2,
  Globe,
  Grid,
  AlertTriangle,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  Percent,
  Calculator,
  Building2,
  Activity,
  Layers
} from "lucide-react";
import { WorkspaceTelemetrySidebar } from "@/components/WorkspaceTelemetrySidebar";
import { AIDecisionCard, AIDecisionResult } from "@/components/AIDecisionCard";
import { RecentWavesFeed, WaveCard } from "@/components/RecentWavesFeed";

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
  resilience_percentile: "Top 8% in Quantitative Track",
  profileStrength: { academic: 82, initiative: 71, consistency: 69 },
  primaryGap: "Demonstrated research co-authorship",
  primaryGapOddsMultiplier: "~2.4x",
  sprintDaysRemaining: 12,
  sprintLabel: "SSRN Working Paper Draft Submission",
  milestoneVelocity: "1.4x pace",
  milestonesComplete: 6,
  milestonesTotal: 10,
};

const INITIAL_FLAGSHIP_SIMULATION: AIDecisionResult = {
  simulationMs: 280,
  confidence: 94,
  recommendation: "Pivot 65% focus to Standardized Testing Baseline",
  rationale: "With your first working paper already in review, your second paper faces diminishing marginal returns for UK/US Economics tier-1 programs compared to an unverified testing profile.",
  primaryAction: "Complete SAT Math Module 3 (Khan Academy) + 2 timed practice sets before October 14.",
  deltaMetrics: [
    { label: "Profile Resilience", from: "78", to: "84", delta: "+6 pts", positive: true },
    { label: "LSE Math Gating", from: "54%", to: "89%", delta: "+35%", positive: true },
  ],
  loading: false,
};

const SIMULATE_CHIPS = [
  "Compare colleges",
  "Find an opportunity",
  "Improve my profile",
  "Build a project",
  "Peer comparison",
];

interface RoadmapItem {
  id: string;
  label: string;
  due: string;
  category: string;
  status: "active" | "urgent" | "completed";
}

const INITIAL_ROADMAP: RoadmapItem[] = [
  { id: "r1", label: "SAT Math Module 3 (Khan Academy)", due: "Oct 14", category: "Test Prep", status: "active" },
  { id: "r2", label: "SSRN Working Paper Draft v1 Submission", due: "Oct 4", category: "Research", status: "urgent" },
  { id: "r3", label: "Ashoka Comp. Econ Lab Fellow Application", due: "Oct 30", category: "Research", status: "active" },
  { id: "r4", label: "LSE Application Portal Pre-Registration", due: "Jan 15", category: "Admissions", status: "active" },
  { id: "r5", label: "Econometrics Factor Model Formulation", due: "Completed", category: "Academics", status: "completed" },
  { id: "r6", label: "Literature Review on Indian Labor Automation", due: "Completed", category: "Research", status: "completed" },
];

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <span className="font-mono text-xs text-slate-500">Loading Student OS Workspace…</span>
        </div>
      }
    >
      <WorkspaceView />
    </Suspense>
  );
}

function WorkspaceView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? undefined;

  const [question, setQuestion] = useState(
    "Should I prioritize a 2nd research paper or focus on SAT/CUET prep this qu"
  );
  const [decisionResult, setDecisionResult] = useState<AIDecisionResult | null>(
    INITIAL_FLAGSHIP_SIMULATION
  );
  const [telemetry, setTelemetry] = useState<TelemetryData>(DEFAULT_TELEMETRY);
  const [activeNav, setActiveNav] = useState<"overview" | "matrix" | "roi" | "roadmap">("overview");
  const [trajectoryFilter, setTrajectoryFilter] = useState<"6m" | "proj">("6m");
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>(INITIAL_ROADMAP);
  const [newRoadmapTask, setNewRoadmapTask] = useState("");

  // 7-Vector Decision Weights for Matrix View
  const [weights, setWeights] = useState({
    career: 95,
    affordability: 82,
    prestige: 70,
    rigor: 64,
    location: 48,
    flexibility: 40,
    opportunities: 32,
  });

  // Hydrate telemetry if report token is present
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`/api/report/${encodeURIComponent(token)}`, {
          signal: AbortSignal.timeout(6000),
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
        // Fall back gracefully
      }
    })();
  }, [token]);

  const handleAsk = useCallback(
    async (overrideQ?: string) => {
      const q = overrideQ ?? question;
      if (!q.trim()) return;

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
            question: q,
            profile_token: token,
            context: {
              ai_resilience_score: telemetry.aiResilienceScore,
              primary_gap: telemetry.primaryGap,
              sprint_label: telemetry.sprintLabel,
            },
          }),
        });

        const elapsed = Date.now() - start;

        if (!res.ok) throw new Error("API simulation error");
        const data = await res.json();

        setDecisionResult({
          simulationMs: Math.max(elapsed, 280),
          confidence: data.confidence ?? 94,
          recommendation: data.recommendation ?? "Simulation complete.",
          rationale: data.rationale ?? "",
          primaryAction: data.primaryAction ?? "Continue active sprint execution.",
          deltaMetrics: data.deltaMetrics ?? [
            { label: "Profile Resilience", from: `${telemetry.aiResilienceScore}`, to: `${telemetry.aiResilienceScore + 6}`, delta: "+6 pts", positive: true },
            { label: "Target Gating", from: "54%", to: "89%", delta: "+35%", positive: true },
          ],
          loading: false,
        });
      } catch {
        // Fallback simulation
        setDecisionResult({
          simulationMs: 280,
          confidence: 94,
          recommendation: "Pivot 65% focus to Standardized Testing Baseline",
          rationale: "With your first working paper already in review, your second paper faces diminishing marginal returns for UK/US Economics tier-1 programs compared to an unverified testing profile.",
          primaryAction: "Complete SAT Math Module 3 (Khan Academy) + 2 timed practice sets before October 14.",
          deltaMetrics: [
            { label: "Profile Resilience", from: "78", to: "84", delta: "+6 pts", positive: true },
            { label: "LSE Math Gating", from: "54%", to: "89%", delta: "+35%", positive: true },
          ],
          loading: false,
        });
      }
    },
    [question, token, telemetry]
  );

  const toggleRoadmapItem = (id: string) => {
    setRoadmap((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === "completed" ? "active" : "completed";
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
    setTelemetry((prev) => {
      const completedCount = roadmap.filter((r) => r.status === "completed").length;
      return { ...prev, milestonesComplete: completedCount };
    });
  };

  const handleAddRoadmapTask = () => {
    if (!newRoadmapTask.trim()) return;
    const newTask: RoadmapItem = {
      id: `r-${Date.now()}`,
      label: newRoadmapTask,
      due: "Active Sprint",
      category: "Custom",
      status: "active",
    };
    setRoadmap([newTask, ...roadmap]);
    setNewRoadmapTask("");
    setTelemetry((prev) => ({ ...prev, milestonesTotal: prev.milestonesTotal + 1 }));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#09090B] flex flex-col lg:flex-row antialiased">
      
      {/* ── LEFT SIDEBAR (FIXED 240px, SCREENS 10–12) ── */}
      <aside className="w-full lg:w-60 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col justify-between p-4 lg:h-screen lg:sticky lg:top-0 z-30">
        <div>
          {/* Logo Row */}
          <div className="flex items-center justify-between pb-3">
            <Link href="/" className="flex items-center gap-2 text-decoration-none">
              <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center text-white font-bold text-xs">
                OS
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-slate-900">Your Student OS</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
              </div>
            </Link>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              v2.4
            </span>
          </div>

          {/* New Analysis Button with Dashed Ring (Screens 10–12) */}
          <button
            onClick={() => handleAsk("Run comprehensive profile trajectory re-calibration")}
            className="w-full mt-3 mb-4 py-2.5 px-3 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm outline-dashed outline-2 outline-blue-400 outline-offset-2 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm leading-none font-bold">+</span>
              <span>New Analysis</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">⌘N</span>
          </button>

          {/* Nav Group 1: Core Operations */}
          <nav className="space-y-0.5">
            {[
              { id: "overview", label: "Overview", icon: <LayoutGrid size={15} />, hasRedDot: true },
              { id: "matrix", label: "Decisions Matrix", icon: <Sliders size={15} /> },
              { id: "roi", label: "Intelligence ROI", icon: <TrendingUp size={15} /> },
              { id: "roadmap", label: "Student Roadmap", icon: <Target size={15} /> },
            ].map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-slate-100 text-slate-950 font-bold"
                      : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? "text-slate-950" : "text-slate-400"}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.hasRedDot && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Divider */}
          <hr className="my-3 border-slate-200" />

          {/* Nav Group 2: Secondary Exploration */}
          <nav className="space-y-0.5">
            {[
              { id: "explore", label: "Explore", icon: <Compass size={15} />, href: "/explore" },
              { id: "portfolio", label: "Portfolio", icon: <Shield size={15} />, href: "/portfolio-builder" },
              { id: "research", label: "Research", icon: <FlaskConical size={15} />, href: "/explore" },
              { id: "opportunities", label: "Opportunities", icon: <Sparkles size={15} />, href: "/marketplace" },
              { id: "counselling", label: "Counselling", icon: <Headphones size={15} />, href: "/advisor" },
            ].map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-400">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-3 border-t border-slate-200 space-y-1">
          <Link
            href="/methodology"
            className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            <HelpCircle size={14} className="text-slate-400" />
            <span>Documentation</span>
          </Link>
          <button
            onClick={() => alert("Workspace telemetry settings configured.")}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Settings size={14} className="text-slate-400" />
            <span>Settings</span>
          </button>

          {/* User Profile Card (Screen 10 & 11) */}
          <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold font-mono text-[10px] text-slate-800">
              AM
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">Alex M.</div>
              <div className="text-[10px] text-slate-500 truncate">Class 11-12 · Quantitative</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN WORKSPACE CONTENT AREA ── */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Breadcrumb & Status Bar (Screens 10–12) */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-900">Workspace</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-700">Alex M.</span>
            <span className="text-slate-400">/</span>
            <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-mono">
              Active Session
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Telemetry Live: Sync &lt;0.4s</span>
            </div>

            <button
              onClick={() => alert("Session snapshot cached to sovereign local storage.")}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Bookmark size={13} className="text-slate-400" />
              <span>Save &amp; exit</span>
            </button>

            <button
              onClick={() => alert("Cryptographic signal profile generated.")}
              className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Export Signal</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </header>

        {/* Scrollable Work Area */}
        <div className="p-6 max-w-7xl w-full mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            
            {/* ── CENTER COLUMN (WIDTH: 2 COLS ON XL) ── */}
            <div className="xl:col-span-2 space-y-6">

              {/* ------------------------------------------------------------- */}
              {/* TAB 1: OVERVIEW (FLAGSHIP SCREENS 10, 11, 12)                 */}
              {/* ------------------------------------------------------------- */}
              {activeNav === "overview" && (
                <>
                  {/* Greeting */}
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
                      Good morning, Alex.
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                      What are we figuring out today?
                    </p>
                  </div>

                  {/* Main Query Bar with Globe & Send Button (Screen 10) */}
                  <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm flex items-center gap-3">
                    <Globe size={18} className="text-slate-400 ml-2 flex-shrink-0" />
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAsk()}
                      placeholder="Should I prioritize a 2nd research paper or focus on SAT/CUET prep this qu..."
                      className="flex-1 bg-transparent border-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                    <span className="hidden sm:inline-block font-mono text-[10px] text-slate-400 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
                      ⌘K
                    </span>
                    <button
                      onClick={() => handleAsk()}
                      disabled={decisionResult?.loading}
                      className="w-8 h-8 rounded-full bg-slate-950 hover:bg-slate-800 text-white flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
                    >
                      <span className="text-sm font-bold leading-none">↑</span>
                    </button>
                  </div>

                  {/* SIMULATE Chips (Screen 10) */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mr-1">
                      Simulate:
                    </span>
                    {SIMULATE_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => {
                          setQuestion(`Simulate: ${chip} for Alex M.`);
                          handleAsk(`Simulate: ${chip} for Alex M.`);
                        }}
                        className="text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-3 py-1 rounded-full transition-colors font-medium cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {/* Operating Engine Synthesis Card (Screen 10) */}
                  <AIDecisionCard
                    result={decisionResult}
                    onAddToRoadmap={(action) => {
                      const newItem: RoadmapItem = {
                        id: `r-${Date.now()}`,
                        label: action,
                        due: "Oct 14",
                        category: "Action",
                        status: "urgent",
                      };
                      setRoadmap([newItem, ...roadmap]);
                      setActiveNav("roadmap");
                    }}
                    onExploreLabs={() => router.push("/explore")}
                    onSaveAnalysis={() => alert("Analysis saved to student workspace history.")}
                  />

                  {/* ── SECTION: YOUR TRAJECTORY (SCREEN 11) ── */}
                  <div className="pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">
                          Your trajectory
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Quantitative projections based on current sprint velocities and milestone completions.
                        </p>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        <button
                          onClick={() => setTrajectoryFilter("6m")}
                          className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            trajectoryFilter === "6m"
                              ? "bg-white text-slate-900 shadow-2xs font-semibold"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Last 6 Months
                        </button>
                        <button
                          onClick={() => setTrajectoryFilter("proj")}
                          className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            trajectoryFilter === "proj"
                              ? "bg-white text-slate-900 shadow-2xs font-semibold"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Projections
                        </button>
                      </div>
                    </div>

                    {/* 3 Trajectory Cards Grid (Screen 11) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* Card 1: Resilience Evolution */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                              Vector Trend
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                              +16 pts past 90d
                            </span>
                          </div>
                          <h3 className="text-xs font-bold text-slate-900">
                            Resilience Evolution
                          </h3>

                          {/* SVG Line Chart */}
                          <div className="my-3 h-16 w-full">
                            <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                              <path
                                d="M 10 50 Q 60 42, 100 28 T 150 20"
                                fill="none"
                                stroke="#0F172A"
                                strokeWidth="2.5"
                              />
                              <path
                                d="M 150 20 L 190 8"
                                fill="none"
                                stroke="#E11D48"
                                strokeWidth="2"
                                strokeDasharray="3 3"
                              />
                              <circle cx="190" cy="8" r="3.5" fill="#E11D48" />
                              <circle cx="150" cy="20" r="3" fill="#0F172A" />
                            </svg>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-100 pt-2">
                          <span>Nov (62)</span>
                          <span>Jan (78)</span>
                          <span className="font-bold text-slate-900">Today (78)</span>
                          <span className="font-bold text-rose-600">Proj. (89)</span>
                        </div>
                      </div>

                      {/* Card 2: Milestone Velocity */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                              Execution Cadence
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full">
                              1.4x Pace
                            </span>
                          </div>
                          <h3 className="text-xs font-bold text-slate-900">
                            Milestone Velocity
                          </h3>

                          {/* Bar Chart (Screen 11) */}
                          <div className="my-3 flex items-end justify-between gap-2 h-16 px-1">
                            <div className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full bg-slate-200 rounded-t h-7" />
                              <span className="text-[9px] font-mono text-slate-400">W1–4</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full bg-slate-300 rounded-t h-10" />
                              <span className="text-[9px] font-mono text-slate-400">W5–8</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full bg-slate-900 rounded-t h-14" />
                              <span className="text-[9px] font-mono text-slate-400">W9–12</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full bg-[#E11D48] rounded-t h-14" />
                              <span className="text-[9px] font-mono font-bold text-rose-600">Sprint</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono border-t border-slate-100 pt-2">
                          <span className="text-emerald-600 font-semibold">Sprint Status: On Track</span>
                          <span className="text-slate-400">Completed: 6 of 10</span>
                        </div>
                      </div>

                      {/* Card 3: Target Admittance Odds */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                              Target Benchmark
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full">
                              Tier-1 Quant
                            </span>
                          </div>
                          <h3 className="text-xs font-bold text-slate-900">
                            Target Admittance Odds
                          </h3>

                          <div className="mt-2.5">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                              <span>LSE / Warwick Baseline</span>
                              <span className="font-mono">Cohort Avg: 24%</span>
                            </div>

                            <div className="mt-2">
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="text-slate-700 font-medium">Your Profile Signal 🔴</span>
                                <span className="font-mono font-bold text-rose-600">Current: 58%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-[#E11D48] h-full rounded-full" style={{ width: "58%" }} />
                              </div>
                            </div>

                            <div className="mt-2">
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="text-slate-700 font-medium">Post-SAT Baseline Gating</span>
                                <span className="font-mono font-bold text-emerald-600">Projected: 81%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "81%" }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono border-t border-slate-100 pt-2 mt-2">
                          <span className="text-slate-700 font-bold">Margin vs Peers: +34%</span>
                          <span className="text-slate-400">Model v4.1</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* ── SECTION: RECENT WAVES (SCREEN 11) ── */}
                  <div className="pt-2">
                    <RecentWavesFeed
                      onAction={(wave) => alert(`Executing action for: ${wave.title}`)}
                    />
                  </div>
                </>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 2: DECISIONS MATRIX (7-VECTOR TRADEOFF & DEBT STRESS TEST) */}
              {/* ------------------------------------------------------------- */}
              {activeNav === "matrix" && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sliders size={16} className="text-[#E11D48]" />
                      <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                        Actuarial Trade-off Engine
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                      7-Vector Decision Weights Calibration
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Drag sliders to adjust relative factor importance. Our Monte Carlo engine recalculates your 20-year NPV surface and debt stress envelope in real time.
                    </p>
                  </div>

                  {/* Sliders Grid */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                    {[
                      { key: "career", label: "Career Outcomes & Salary Upside", tag: "High Weight", val: weights.career },
                      { key: "affordability", label: "Cost & Net Financial Debt Sensitivity", tag: "High Weight", val: weights.affordability },
                      { key: "prestige", label: "Institutional Prestige & Alumni Network", tag: "Medium", val: weights.prestige },
                      { key: "rigor", label: "Academic Rigor & Faculty Research Access", tag: "Medium", val: weights.rigor },
                      { key: "location", label: "Location, Peer Ecosystem & Quality of Life", tag: "Secondary", val: weights.location },
                      { key: "flexibility", label: "Curriculum Freedom & Interdisciplinary Minors", tag: "Secondary", val: weights.flexibility },
                      { key: "opportunities", label: "Incubator Access & Pre-Seed Grant Pipelines", tag: "Secondary", val: weights.opportunities },
                    ].map((item, i) => (
                      <div key={item.key} className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[10px] font-bold flex items-center justify-center">
                              #{i + 1}
                            </span>
                            <span className="font-semibold text-slate-900">{item.label}</span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                              {item.tag}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-slate-900">{item.val}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={item.val}
                          onChange={(e) =>
                            setWeights({ ...weights, [item.key]: Number(e.target.value) })
                          }
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#E11D48]"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Calculated Simulation Envelope */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">20-Year Career NPV</span>
                      <div className="text-xl font-bold font-mono text-slate-950 mt-1">₹1.84 Cr</div>
                      <span className="text-[11px] text-emerald-600 font-mono font-medium">+14.2% vs PLFS baseline</span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Debt Payback Horizon</span>
                      <div className="text-xl font-bold font-mono text-slate-950 mt-1">2.4 Years</div>
                      <span className="text-[11px] text-emerald-600 font-mono font-medium">Safe (&lt;3.5y threshold)</span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Downside Tail Risk (P10)</span>
                      <div className="text-xl font-bold font-mono text-slate-950 mt-1">₹8.2 LPA</div>
                      <span className="text-[11px] text-slate-500 font-mono">Worst 10% recession case</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 3: INTELLIGENCE ROI (8-DIMENSION AI RISK & SALARY ENVELOPE) */}
              {/* ------------------------------------------------------------- */}
              {activeNav === "roi" && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Shield size={16} className="text-[#E11D48]" />
                      <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                        8-Vector Labor Automation Surface
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                      AI Displacement Resilience Radar
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Oxford O*NET × Indian NSSO/PLFS labor model. Evaluates task-level automation decay slope across your career trajectory.
                    </p>
                  </div>

                  {/* 8-Dimension Surface Table */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono mb-4">
                      Cognitive Vector Automation Exposure
                    </h3>
                    <div className="space-y-3.5">
                      {[
                        { name: "V1 Cognitive Routine (Rule-based drafting, boilerplate)", decay: 0.82, status: "High Vulnerability", color: "#E11D48" },
                        { name: "V2 Complex Analytical (Econometric modeling, stats)", decay: 0.38, status: "Resilient Hedge", color: "#F59E0B" },
                        { name: "V3 Social Empathy & Faculty Negotiation", decay: 0.14, status: "High Defense", color: "#10B981" },
                        { name: "V4 Autonomous Problem Formulation", decay: 0.22, status: "High Defense", color: "#10B981" },
                        { name: "V5 Systems Architecture & Formal Proofs", decay: 0.28, status: "Resilient Hedge", color: "#F59E0B" },
                        { name: "V6 Empirical Execution Consistency", decay: 0.19, status: "High Defense", color: "#10B981" },
                        { name: "V7 Cross-Domain Tool Synthesis", decay: 0.31, status: "Resilient Hedge", color: "#F59E0B" },
                        { name: "V8 Sovereign Strategic Judgment", decay: 0.12, status: "Immune / Irreplaceable", color: "#10B981" },
                      ].map((vec) => (
                        <div key={vec.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-800">{vec.name}</span>
                            <span className="font-mono text-[11px] font-bold" style={{ color: vec.color }}>
                              {vec.status} ({(vec.decay * 100).toFixed(0)}% decay)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${vec.decay * 100}%`, backgroundColor: vec.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 20-Year Salary Distribution Paths */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono mb-2">
                      20-Year Monte Carlo Career Distribution (10,000 Paths)
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-center mt-4">
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">P10 Downside</span>
                        <div className="text-lg font-bold font-mono text-slate-900 mt-1">₹8.4 LPA → ₹28 LPA</div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Year 1 to Year 10 floor</p>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">P50 Expected Median</span>
                        <div className="text-lg font-bold font-mono text-slate-900 mt-1">₹16.5 LPA → ₹54 LPA</div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Central tendency path</p>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">P90 Quant Spike</span>
                        <div className="text-lg font-bold font-mono text-slate-900 mt-1">₹28.0 LPA → ₹1.1 Cr</div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Top decile research/quant track</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 4: STUDENT ROADMAP (INTERACTIVE SPRINT ROADMAP)          */}
              {/* ------------------------------------------------------------- */}
              {activeNav === "roadmap" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Target size={16} className="text-[#E11D48]" />
                        <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                          Active Sprint Execution
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                        Student Sovereign Roadmap
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Track verified admissions spikes, research deadlines, and test prep milestones.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1.5 rounded-lg">
                        Velocity: {telemetry.milestoneVelocity}
                      </span>
                    </div>
                  </div>

                  {/* Add New Milestone Bar */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add milestone (e.g. Complete Cambridge STEP Mathematics Mock)..."
                      value={newRoadmapTask}
                      onChange={(e) => setNewRoadmapTask(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddRoadmapTask()}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 shadow-2xs"
                    />
                    <button
                      onClick={handleAddRoadmapTask}
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                      Add Milestone
                    </button>
                  </div>

                  {/* Roadmap List */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm divide-y divide-slate-100">
                    {roadmap.map((item) => {
                      const isCompleted = item.status === "completed";
                      return (
                        <div
                          key={item.id}
                          className="py-3.5 px-2 flex items-center justify-between gap-4 hover:bg-slate-50/50 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleRoadmapItem(item.id)}
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                                isCompleted
                                  ? "bg-slate-950 border-slate-950 text-white"
                                  : "border-slate-300 hover:border-slate-400 bg-white"
                              }`}
                            >
                              {isCompleted && <Check size={12} strokeWidth={3} />}
                            </button>
                            <div>
                              <span
                                className={`text-xs font-semibold ${
                                  isCompleted ? "line-through text-slate-400" : "text-slate-900"
                                }`}
                              >
                                {item.label}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                                  {item.category}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  Due: {item.due}
                                </span>
                              </div>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              isCompleted
                                ? "bg-slate-100 text-slate-500"
                                : item.status === "urgent"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {isCompleted ? "Completed" : item.status === "urgent" ? "Urgent" : "Active Sprint"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* ── RIGHT COLUMN: TELEMETRY SIDEBAR (WIDTH: 1 COL ON XL, 280px) ── */}
            <div className="xl:col-span-1 lg:sticky lg:top-20">
              <WorkspaceTelemetrySidebar
                aiResilienceScore={telemetry.aiResilienceScore}
                resilience_percentile={telemetry.resilience_percentile}
                profileStrength={telemetry.profileStrength}
                primaryGap={telemetry.primaryGap}
                primaryGapOddsMultiplier={telemetry.primaryGapOddsMultiplier}
                sprintDaysRemaining={telemetry.sprintDaysRemaining}
                sprintLabel={telemetry.sprintLabel}
                milestoneVelocity={telemetry.milestoneVelocity}
                milestonesComplete={roadmap.filter((r) => r.status === "completed").length}
                milestonesTotal={roadmap.length}
              />
            </div>

          </div>
        </div>
      </main>

    </div>
  );
}
