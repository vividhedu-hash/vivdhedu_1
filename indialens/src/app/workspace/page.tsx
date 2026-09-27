"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Compass,
  Target,
  Sparkles,
  ExternalLink,
  Send,
  Sliders,
  FileText,
  Settings,
  HelpCircle,
  LayoutGrid,
  Shield,
  Headphones,
  CircleAlert,
  Plus,
  Check,
  TrendingUp,
} from "lucide-react";
import { WorkspaceTelemetrySidebar, type TelemetryProps } from "@/components/WorkspaceTelemetrySidebar";
import { AIDecisionCard, type AIDecisionResult } from "@/components/AIDecisionCard";
import { RecentWavesFeed } from "@/components/RecentWavesFeed";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/lib/auth-context";
import { NO_DATA, finiteOrNull } from "@/lib/mock-data";
import { BRAND } from "@/lib/brand";

/**
 * The workspace previously rendered a hardcoded persona.
 *
 * `DEFAULT_TELEMETRY` was a complete invented profile: resilience 78, "Top 8%
 * in Quantitative Track", strength 82/71/69, gap "Demonstrated research
 * co-authorship" at "~2.4x" admittance odds, a 12-day sprint to submit an SSRN
 * working paper, "1.4x pace" velocity, 6 of 10 milestones. `INITIAL_ROADMAP`
 * was six tasks about SSRN papers, an Ashoka fellowship and an LSE application
 * portal — UK universities, in a product for choosing Indian colleges.
 * `INITIAL_FLAGSHIP_SIMULATION` was a fixed SAT recommendation that ALSO
 * doubled as the HTTP-500 fallback, so a backend failure and a real answer
 * were byte-identical.
 *
 * Downstream of those constants, the Decisions Matrix moved seven sliders while
 * three output cards below it stayed pinned to ₹1.84 Cr / 2.4 Years / ₹8.2 LPA
 * — under copy claiming "our Monte Carlo engine recalculates your 20-year NPV
 * surface and debt stress envelope in real time". The Intelligence ROI tab
 * showed eight automation vectors with hardcoded decay slopes. The trajectory
 * "charts" were hand-drawn SVG paths, and "Telemetry Live: Sync <0.4s" was
 * static text next to a pulsing dot.
 *
 * None of that can be made honest by editing the numbers, because there is
 * nothing underneath to edit. So the page now does three things instead:
 *   1. asks who is asking (the signed-in user) rather than inventing a persona;
 *   2. fetches what genuinely exists — a report token's measured traits — and
 *      renders "—" for everything else, using the same idiom as /report;
 *   3. runs the decision engine for real, and shows a failure as a failure.
 */

interface RoadmapItem {
  id: string;
  label: string;
  due: string | null;
  category: string;
  status: "active" | "urgent" | "completed";
}

const SIMULATE_CHIPS = [
  "Compare programs",
  "Find an opportunity",
  "Improve my profile",
  "Build a project",
  "Peer comparison",
];

/**
 * Telemetry is nullable throughout. null = "not measured", and the sidebar
 * renders "—" for it. There is deliberately no default object: the previous
 * `DEFAULT_TELEMETRY` merge meant a signed-out visitor saw a stranger's
 * financial dashboard, which is the single most misleading thing this page
 * could show.
 */
const EMPTY_TELEMETRY: TelemetryProps = {
  aiResilienceScore: null,
  resilience_percentile: null,
  profileStrength: null,
  primaryGap: null,
  primaryGapOddsMultiplier: null,
  sprintDaysRemaining: null,
  sprintLabel: null,
  milestoneVelocity: null,
  milestonesComplete: 0,
  milestonesTotal: 0,
};

export default function WorkspacePage() {
  return (
    <AuthGate title="workspace">
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
            <span className="font-mono text-xs text-slate-500">Loading your workspace…</span>
          </div>
        }
      >
        <WorkspaceView />
      </Suspense>
    </AuthGate>
  );
}

function WorkspaceView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? undefined;
  const { user, logout } = useAuth();

  const inputRef = useRef<HTMLInputElement>(null);

  const [question, setQuestion] = useState("");
  const [decisionResult, setDecisionResult] = useState<AIDecisionResult | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryProps>(EMPTY_TELEMETRY);
  const [activeNav, setActiveNav] = useState<"overview" | "matrix" | "roi" | "roadmap">("overview");
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [newRoadmapTask, setNewRoadmapTask] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const completedMilestones = roadmap.filter((r) => r.status === "completed").length;

  // 7-vector decision weights. These are the student's own stated
  // priorities, so they are kept in component state and are not pretended
  // to feed any model.
  const [weights, setWeights] = useState({
    career: 95,
    affordability: 82,
    prestige: 70,
    rigor: 64,
    location: 48,
    flexibility: 40,
    opportunities: 32,
  });

  /**
   * Hydrate from a saved report token, if one was supplied.
   *
   * Everything read here is optional and coerced with `finiteOrNull`: a
   * report that lacks a trait vector must leave the panel empty, not
   * substitute a midpoint. The previous version read `?.ai_adapt ?? 0.78` and
   * multiplied by 100, which printed 78 for any report that did not carry the
   * field — the same number as the hardcoded default, arrived at by a
   * different route, and equally unfounded.
   */
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/report/${encodeURIComponent(token)}`, {
          signal: AbortSignal.timeout(6000),
        });
        if (!res.ok || cancelled) return;
        const payload = await res.json();
        const data = payload?.student_input ?? payload?.results?.profile_parsed ?? payload;
        const traits = data?.psychometric_traits;
        if (!traits || cancelled) return;

        const aiAdapt = finiteOrNull(traits.ai_adapt);
        const diligence = finiteOrNull(traits.diligence);
        const autonomy = finiteOrNull(traits.autonomy);
        const security = finiteOrNull(traits.security);
        if (aiAdapt == null && diligence == null && autonomy == null && security == null) return;

        setTelemetry((prev) => ({
          ...prev,
          aiResilienceScore: aiAdapt == null ? null : Math.round(aiAdapt * 100),
          profileStrength:
            diligence == null && autonomy == null && security == null
              ? null
              : { academic: diligence, initiative: autonomy, consistency: security },
        }));
      } catch {
        // No report, or the report service is down. The panel stays empty,
        // which is the correct rendering of "we could not measure this".
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleAsk = useCallback(
    async (overrideQ?: string) => {
      const q = (overrideQ ?? question).trim();
      if (!q) return;

      setNotice(null);
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
              // Only measured values are forwarded. The advisor prompt
              // previously received `ai_resilience_score: 78` because the page
              // always had a number to send; it now receives null and the
              // prompt says "unknown", which is what it should have said.
              ai_resilience_score: telemetry.aiResilienceScore,
              primary_gap: telemetry.primaryGap,
              sprint_label: telemetry.sprintLabel,
            },
          }),
        });

        const elapsed = Date.now() - start;

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body?.reason ?? body?.error ?? `The advisor returned HTTP ${res.status}.`,
          );
        }
        const data = await res.json();

        setDecisionResult({
          simulationMs: elapsed,
          confidence: finiteOrNull(data.confidence) ?? 0,
          recommendation: typeof data.recommendation === "string" ? data.recommendation : "",
          rationale: typeof data.rationale === "string" ? data.rationale : "",
          primaryAction: typeof data.primaryAction === "string" ? data.primaryAction : "",
          // `?? [...]` with a hardcoded "+6 pts / 54% → 89%" pair used to sit
          // here. An empty list is the honest answer when the engine returned
          // no metrics; the card renders no boxes in that case.
          deltaMetrics: Array.isArray(data.deltaMetrics) ? data.deltaMetrics : [],
          loading: false,
          verified: data._source === "advisor",
        });
      } catch (err) {
        // A failed call is shown as a failed call. The previous catch block
        // returned a fixed "Pivot 65% to Standardized Testing" recommendation
        // with a 94% confidence score — indistinguishable from a live answer.
        setDecisionResult({
          simulationMs: elapsedFallback(start),
          confidence: 0,
          recommendation: "",
          rationale: "",
          primaryAction: "",
          deltaMetrics: [],
          loading: false,
          error:
            err instanceof Error
              ? err.message
              : "The advisor could not be reached, so no recommendation is available.",
        });
      }
    },
    [question, token, telemetry.aiResilienceScore, telemetry.primaryGap, telemetry.sprintLabel]
  );

  const toggleRoadmapItem = (id: string) => {
    setRoadmap((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "completed" ? "active" : "completed" }
          : item,
      ),
    );
  };

  const handleAddRoadmapTask = () => {
    const label = newRoadmapTask.trim();
    if (!label) return;
    setRoadmap((prev) => [
      { id: `r-${Date.now()}`, label, due: null, category: "Custom", status: "active" },
      ...prev,
    ]);
    setNewRoadmapTask("");
  };

  // ⌘N / ⌘K now do what the hints claimed. Previously the keycaps were
  // decorative: no handler was registered, so the UI advertised shortcuts
  // that did nothing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "n" || e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const displayName = user?.full_name?.trim() || user?.email?.split("@")[0] || "there";
  const initials = (
    displayName === "there" ? "?" : displayName
  )
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#09090B] flex flex-col lg:flex-row antialiased">
      {/* ── LEFT SIDEBAR ── */}
      <aside className="w-full lg:w-60 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col justify-between p-4 lg:h-screen lg:sticky lg:top-0 z-30">
        <div>
          <div className="flex items-center justify-between pb-3">
            <Link href="/" className="flex items-center gap-2 text-decoration-none">
              <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center text-white font-bold text-xs">
                OS
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-slate-900">{BRAND.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
              </div>
            </Link>
          </div>

          <button
            onClick={() => {
              setActiveNav("overview");
              inputRef.current?.focus();
            }}
            className="w-full mt-3 mb-4 py-2.5 px-3 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm leading-none font-bold">+</span>
              <span>New Analysis</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
              ⌘N
            </span>
          </button>

          <nav className="space-y-0.5">
            {[
              { id: "overview", label: "Overview", icon: <LayoutGrid size={15} /> },
              { id: "matrix", label: "Decision Weights", icon: <Sliders size={15} /> },
              { id: "roi", label: "What we model", icon: <TrendingUp size={15} /> },
              { id: "roadmap", label: "Your Roadmap", icon: <Target size={15} /> },
            ].map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id as typeof activeNav)}
                  aria-current={isActive ? "page" : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-slate-100 text-slate-950 font-bold"
                      : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                  }`}
                >
                  <span className={isActive ? "text-slate-950" : "text-slate-400"}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <hr className="my-3 border-slate-200" />

          <nav className="space-y-0.5">
            {[
              { label: "Explore", icon: <Compass size={15} />, href: "/explore" },
              { label: "Portfolio", icon: <Shield size={15} />, href: "/portfolio-builder" },
              { label: "Opportunities", icon: <Sparkles size={15} />, href: "/marketplace" },
              { label: "Counselling", icon: <Headphones size={15} />, href: "/advisor" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition-colors"
              >
                <span className="text-slate-400">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="pt-3 border-t border-slate-200 space-y-1">
          <Link
            href="/methodology"
            className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            <HelpCircle size={14} className="text-slate-400" />
            <span>Documentation</span>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Settings size={14} className="text-slate-400" />
            <span>Sign out</span>
          </button>

          {/* Real identity, from the session. Was a hardcoded "AM / Alex M. /
              Class 11-12 · Quantitative" card shown to every visitor. */}
          <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold font-mono text-[10px] text-slate-800">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">{displayName}</div>
              <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-900">Workspace</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-700">{displayName}</span>
          </div>

          <div className="flex items-center gap-4">
            {token ? (
              <Link
                href={`/report/${token}`}
                className="text-xs font-mono text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1.5"
              >
                <FileText size={12} />
                View source report
              </Link>
            ) : (
              <span className="hidden sm:inline font-mono text-[11px] text-slate-400">
                No report linked
              </span>
            )}
            <button
              onClick={() => {
                setNotice(
                  "Nothing was saved. This workspace has no database table behind it yet — your roadmap lives in this tab only and will be gone on reload.",
                );
              }}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors cursor-pointer"
            >
              Save &amp; exit
            </button>
          </div>
        </header>

        <div className="p-6 max-w-7xl w-full mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            <div className="xl:col-span-2 space-y-6">
              {/* ── OVERVIEW ── */}
              {activeNav === "overview" && (
                <>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
                      Hello, {displayName}.
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Ask a question, or work through your weights and roadmap below.
                    </p>
                  </div>

                  {notice && (
                    <div
                      role="status"
                      className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 leading-relaxed"
                    >
                      <CircleAlert size={14} className="mt-0.5 flex-shrink-0" />
                      <span>{notice}</span>
                    </div>
                  )}

                  <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm flex items-center gap-3">
                    <input
                      ref={inputRef}
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAsk()}
                      placeholder="e.g. Is a ₹22L private engineering degree worth it when NIT seats are available at ₹6L?"
                      aria-label="Ask a decision question"
                      className="flex-1 bg-transparent border-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                    <span className="hidden sm:inline-block font-mono text-[10px] text-slate-400 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
                      ⌘K
                    </span>
                    <button
                      onClick={() => handleAsk()}
                      disabled={decisionResult?.loading}
                      aria-label="Send question"
                      className="w-8 h-8 rounded-full bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
                    >
                      <Send size={13} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mr-1">
                      Try:
                    </span>
                    {SIMULATE_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => {
                          setQuestion(chip);
                          handleAsk(chip);
                        }}
                        className="text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-3 py-1 rounded-full transition-colors font-medium cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  <AIDecisionCard
                    result={decisionResult}
                    onAddToRoadmap={(action) => {
                      setRoadmap((prev) => [
                        {
                          id: `r-${Date.now()}`,
                          label: action,
                          // The old code stamped every advisor action with
                          // "Oct 14" — a date belonging to the deleted
                          // persona's SAT sprint.
                          due: null,
                          category: "Advisor action",
                          status: "active",
                        },
                        ...prev,
                      ]);
                      setActiveNav("roadmap");
                    }}
                    onExploreLabs={() => router.push("/explore")}
                    onSaveAnalysis={() =>
                      setNotice(
                        "Nothing was saved — this workspace has no persistence yet. The report page is the only artefact that survives a reload.",
                      )
                    }
                    onAskFollowUp={() => inputRef.current?.focus()}
                  />

                  <div className="pt-2">
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      Your profile, as far as we have measured it
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {token
                        ? "Sourced from the report linked to this workspace."
                        : "No report is linked to this workspace, so nothing here is measured yet."}
                    </p>
                    <TrajectoryCards
                      telemetry={telemetry}
                      milestonesComplete={completedMilestones}
                      milestonesTotal={roadmap.length}
                    />
                  </div>

                  <div className="pt-2">
                    <RecentWavesFeed />
                  </div>
                </>
              )}

              {/* ── DECISION WEIGHTS ── */}
              {activeNav === "matrix" && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sliders size={16} className="text-[#E11D48]" />
                      <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                        7-Vector Weighting
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                      What matters most to you
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                      Set how much each factor should count when programs are ranked
                      for you. These weights are stored in this tab only — they are not
                      yet sent to a ranking engine, so no NPV or payback figure below is
                      calculated from them.
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                    {[
                      { key: "career", label: "Career Outcomes & Salary Upside", tag: "High Weight" },
                      { key: "affordability", label: "Cost & Net Financial Debt Sensitivity", tag: "High Weight" },
                      { key: "prestige", label: "Institutional Prestige & Alumni Network", tag: "Medium" },
                      { key: "rigor", label: "Academic Rigor & Faculty Research Access", tag: "Medium" },
                      { key: "location", label: "Location, Peer Ecosystem & Quality of Life", tag: "Secondary" },
                      { key: "flexibility", label: "Curriculum Freedom & Interdisciplinary Minors", tag: "Secondary" },
                      { key: "opportunities", label: "Incubator Access & Pre-Seed Grant Pipelines", tag: "Secondary" },
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
                          <span className="font-mono font-bold text-slate-900">
                            {weights[item.key as keyof typeof weights]}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          aria-label={item.label}
                          value={weights[item.key as keyof typeof weights]}
                          onChange={(e) =>
                            setWeights({ ...weights, [item.key]: Number(e.target.value) })
                          }
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#E11D48]"
                        />
                      </div>
                    ))}
                  </div>

                  {/*
                    The three cards that stood here were pinned to
                    ₹1.84 Cr / 2.4 Years / ₹8.2 LPA and did not move when the
                    sliders moved, under copy promising a Monte Carlo
                    recalculation "in real time". They are replaced with the
                    statement of what is actually true: the weights are recorded,
                    and nothing consumes them yet.
                  */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: "20-Year Career NPV", note: "Needs a program and a verified salary" },
                      { label: "Debt Payback Horizon", note: "Needs a verified total cost of degree" },
                      { label: "Downside Tail Risk (P10)", note: "Needs the same two inputs" },
                    ].map((c) => (
                      <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                          {c.label}
                        </span>
                        <div className="text-xl font-bold font-mono text-slate-300 mt-1">{NO_DATA}</div>
                        <span className="text-[11px] text-slate-500 font-mono">{c.note}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    A ranking that honours these weights needs a program to rank.{" "}
                    <Link href="/explore" className="text-rose-600 font-semibold hover:underline">
                      Open the program index
                    </Link>{" "}
                    and the composite breakdown for each program is shown in full, with
                    unmeasured components marked as unmeasured.
                  </p>
                </div>
              )}

              {/* ── WHAT WE MODEL ── */}
              {activeNav === "roi" && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Shield size={16} className="text-[#E11D48]" />
                      <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                        Coverage
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                      What is measured, and what is not
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                      This tab used to show eight "AI Displacement" vectors with hardcoded
                      decay slopes (0.82, 0.38, 0.14, …) and a "20-Year Monte Carlo Career
                      Distribution" of ₹8.4L → ₹1.1 Cr across 10,000 paths. None of those
                      numbers came from a simulation. Here is the honest inventory instead.
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono mb-4">
                      Automation exposure
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      The composite for each program carries an automation-exposure
                      component derived from published occupational taxonomies
                      crosswalked to Indian roles. It is a per-program figure, shown on
                      the program page and inside the composite — not a per-student
                      eight-vector radar, which is what this panel used to fake.
                    </p>
                    <Link
                      href="/methodology"
                      className="inline-flex items-center gap-1 mt-4 text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      How the composite is built <ExternalLink size={12} />
                    </Link>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono mb-3">
                      Not currently modelled
                    </h3>
                    <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
                      {[
                        "Upward mobility index — the backend returns tier-keyed constants, not a measured mobility statistic. We do not publish it.",
                        "Skill demand velocity — a three-entry lookup table in the analytics service, not a Lightcast feed. Not published.",
                        "Per-student AI displacement vectors — no engine produces them.",
                        "Monte Carlo salary distributions over 20 years — the simulator exists but is only meaningful once a program has a verified starting salary and total cost. It is not run on invented inputs.",
                      ].map((line) => (
                        <li key={line} className="flex items-start gap-2">
                          <span className="font-mono text-slate-300">—</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
                      Publishing a number you cannot defend is worse than publishing a
                      gap. When these become real measurements they will appear here,
                      with their source and vintage.
                    </p>
                  </div>
                </div>
              )}

              {/* ── ROADMAP ── */}
              {activeNav === "roadmap" && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Target size={16} className="text-[#E11D48]" />
                      <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                        Your list
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                      Student Roadmap
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                      A checklist you control. Milestones you add are yours to write;
                      nothing is generated for you, and nothing here survives a page
                      reload until workspace storage exists.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a milestone, e.g. Register for CUET before the deadline"
                      value={newRoadmapTask}
                      onChange={(e) => setNewRoadmapTask(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddRoadmapTask()}
                      aria-label="New milestone"
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 shadow-2xs"
                    />
                    <button
                      onClick={handleAddRoadmapTask}
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                      Add
                    </button>
                  </div>

                  {roadmap.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
                      <p className="text-sm text-slate-600">
                        Nothing on your roadmap yet.
                      </p>
                      <p className="text-xs text-slate-500 mt-1.5">
                        Add your own milestones above. We will not invent deadlines for
                        you.
                      </p>
                    </div>
                  ) : (
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
                                aria-label={isCompleted ? `Reopen ${item.label}` : `Complete ${item.label}`}
                                aria-pressed={isCompleted}
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
                                    {item.due ? `Due: ${item.due}` : "No deadline set"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                isCompleted
                                  ? "bg-slate-100 text-slate-500"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {isCompleted ? "Completed" : "Active"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="xl:col-span-1 lg:sticky lg:top-20">
              <WorkspaceTelemetrySidebar
                {...telemetry}
                milestonesComplete={completedMilestones}
                milestonesTotal={roadmap.length}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Replaces three hand-drawn SVG trajectory cards.
 *
 * Card 1 plotted a fixed path "Nov (62) → Jan (78) → Today (78) → Proj. (89)"
 * with a hand-drawn SVG curve and a "+16 pts past 90d" badge — a time series
 * for a student who had never existed. Card 2 drew four bar heights and
 * claimed "1.4x Pace" and "Sprint Status: On Track". Card 3 showed "LSE /
 * Warwick Baseline, Cohort Avg 24%, Your Profile Signal 58%, Post-SAT
 * Projected 81%, Margin vs Peers +34%, Model v4.1" — an admissions prediction
 * for UK universities, never computed, in an Indian college-choosing product.
 *
 * What is left is the one figure that is real when it exists: the measured
 * AI-adaptation trait, and the roadmap completion the student themselves
 * controls. Everything else states that it is not available.
 */
function TrajectoryCards({
  telemetry,
  milestonesComplete,
  milestonesTotal,
}: {
  telemetry: TelemetryProps;
  milestonesComplete: number;
  milestonesTotal: number;
}) {
  const { aiResilienceScore } = telemetry;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            AI Resilience
          </span>
          <h3 className="text-xs font-bold text-slate-900 mt-1">Measured trait</h3>
          <div className="my-3 h-16 flex items-center">
            <span className="text-4xl font-bold font-mono text-slate-950">
              {aiResilienceScore ?? NO_DATA}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-100 pt-2">
          <span>From your assessment</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
          A single measurement, not a trend. We do not chart a trajectory until there
          is a history of measurements to chart.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Profile Strength
          </span>
          <h3 className="text-xs font-bold text-slate-900 mt-1">Your checklist</h3>
          <div className="my-3 h-16 flex items-baseline gap-1">
            <span className="text-4xl font-bold font-mono text-slate-950">
              {milestonesTotal > 0 ? milestonesComplete : NO_DATA}
            </span>
            {milestonesTotal > 0 && (
              <span className="text-sm font-mono text-slate-400">/ {milestonesTotal}</span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-100 pt-2">
          <span>Milestones you completed</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
          Counted from your own list. There is no velocity metric, because velocity
          needs a dated history of completed work that we do not have.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Admittance odds
          </span>
          <h3 className="text-xs font-bold text-slate-900 mt-1">Not modelled here</h3>
          <div className="my-3 h-16 flex items-center">
            <span className="text-4xl font-bold font-mono text-slate-300">{NO_DATA}</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-100 pt-2">
          <span>Needs rank, exam, category, home state</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
          This card previously showed a 58% chance of LSE admission, rising to 81%
          "after SAT", with a "Model v4.1" tag. No admissions engine ran. An odds
          figure without your rank and category is a guess with a percentage sign.
        </p>
      </div>
    </div>
  );
}

function elapsedFallback(start: number): number {
  return Math.max(0, Date.now() - start);
}
