"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Calendar,
  ShieldAlert,
  CheckCircle,
  RefreshCw,
  Plus,
  Trash2,
  FileText,
  Lock,
  GitCommit,
  GraduationCap,
  Briefcase,
  Loader2,
  CircleAlert,
  Info,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { NO_DATA } from "@/lib/mock-data";
import { AuthGate } from "@/components/AuthGate";

/*
 * Scores and verdicts on this page come from backend/api/routers/portfolio.py:
 *
 *   POST /api/v2/portfolio/compute-spike  → Formula 11.1 (portfolio.py:49)
 *   POST /api/v2/portfolio/check-preprint → predatory-publisher check (portfolio.py:111)
 *
 * Both previously had a client-side twin. `calculateSpikeScore()` reimplemented
 * the engine's weighting in TypeScript and the journal scanner matched a
 * 7-name local array, so a student saw a verdict from code the backend never
 * saw. The two implementations have already drifted: the engine clamps the
 * score to a 35–99 band and returns its own tier labels, neither of which the
 * local copy reproduced.
 *
 * Deliberately NOT wired: GET /api/v2/portfolio/milestones. The body is a
 * literal dict inside the router (portfolio.py:121-156) with no computation
 * behind it, so a network round-trip would buy one failure mode and no data.
 * The grade framework below is therefore labelled as editorial guidance
 * rather than dressed up as engine output.
 *
 * Deliberately NOT re-enabled: POST /api/v2/portfolio/transform-xyz, which the
 * Next proxy 501s with a documented integrity reason (see
 * src/app/api/v2/[...path]/route.ts). The old client fallback re-invented that
 * output locally, which is the same fabrication, one hop away.
 */

interface Activity {
  title: string;
  role: string;
  months: number;
  rarity: number;
  validation: number;
  alignment: number;
}

/** The X-Y-Z endpoint's success shape. Absent fields render as "—" rather
 *  than being asserted; the proxy refuses this route with 501 by design, so
 *  this type describes a response we may never receive. */
interface XYZOutput {
  transformed_xyz?: string;
  metric_highlighted?: string;
  critique?: string;
}

/** `PortfolioSpikeEngine.compute_spike_score` (nextgen_engine.py:852). */
interface SpikeResult {
  spike_authenticity_score: number;
  tier: string;
  evaluated_activities_count?: number;
  spike_summary?: string;
  recommendation?: string;
}

type SpikeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: SpikeResult }
  | { status: "unavailable"; reason: string };

interface JournalResult {
  journal_name: string;
  is_flagged_predatory: boolean;
  source?: string;
  warning: string;
}

type JournalState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: JournalResult }
  | { status: "unavailable"; reason: string };

const TIER_TONE: Record<string, string> = {
  "Exceptional Angular Spike": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Solid Competitive Spike": "bg-blue-50 text-blue-700 border border-blue-200",
  "Developing Portfolio": "bg-amber-50 text-amber-700 border border-amber-200",
  "Generic Portfolio": "bg-amber-50 text-amber-700 border border-amber-200",
};

export default function PortfolioBuilderPage() {
  const [targetMajor, setTargetMajor] = useState("Computer Science & Systems");
  const [activities, setActivities] = useState<Activity[]>([
    {
      title: "Edge Computer Vision Turbidity Monitor for Rural Wells",
      role: "Lead Hardware & ML Researcher",
      months: 18,
      rarity: 0.92,
      validation: 0.88,
      alignment: 0.95,
    },
    {
      title: "State Science Congress Gold Medalist",
      role: "Individual Investigator",
      months: 12,
      rarity: 0.85,
      validation: 0.90,
      alignment: 0.90,
    }
  ]);

  // Form states for adding activities
  const [newTitle, setNewTitle] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newMonths, setNewMonths] = useState(12);

  // X-Y-Z Transformer state
  const [rawDraft, setRawDraft] = useState("");
  const [transformedOutput, setTransformedOutput] = useState<XYZOutput | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformNotice, setTransformNotice] = useState<string | null>(null);

  // Predatory Journal Scanner state
  const [journalQuery, setJournalQuery] = useState("");
  const [journal, setJournal] = useState<JournalState>({ status: "idle" });

  // Selected Grade Milestone tab
  const [selectedGrade, setSelectedGrade] = useState<number>(11);

  // Engine-computed spike score
  const [spike, setSpike] = useState<SpikeState>({ status: "idle" });
  const spikeRequest = useRef(0);

  /**
   * Score the current activity list with the backend engine.
   *
   * `rarity_factor`, `external_validation` and `major_alignment` are sent from
   * the form because the request model requires them; they are self-assessed
   * inputs, not measurements the engine can look up. The engine weights them,
   * it does not verify them — which the copy under the score says out loud.
   */
  const runSpike = useCallback(async (list: Activity[], major: string) => {
    const requestId = ++spikeRequest.current;
    setSpike({ status: "loading" });

    try {
      const res = await fetch("/api/v2/portfolio/compute-spike", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_major: major || "Computer Science",
          activities: list.map((a) => ({
            title: a.title,
            description: "",
            role: a.role,
            months_invested: a.months,
            rarity_factor: a.rarity,
            external_validation: a.validation,
            major_alignment: a.alignment,
          })),
        }),
      });
      const body = (await res.json().catch(() => null)) as
        | (Partial<SpikeResult> & { reason?: string; error?: string })
        | null;

      if (requestId !== spikeRequest.current) return; // a newer request superseded this one

      if (!res.ok || !body || typeof body.spike_authenticity_score !== "number") {
        setSpike({
          status: "unavailable",
          reason:
            (typeof body?.reason === "string" && body.reason) ||
            "The Spike Authenticity engine did not return a score. No score is computed locally in its place.",
        });
        return;
      }
      setSpike({ status: "ready", data: body as SpikeResult });
    } catch {
      if (requestId !== spikeRequest.current) return;
      setSpike({
        status: "unavailable",
        reason: "The Spike Authenticity engine could not be reached.",
      });
    }
  }, []);

  // Re-score on mount and whenever the portfolio changes, debounced so typing
  // in the major field does not fire a request per keystroke.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      void runSpike(activities, targetMajor);
    }, 500);
    return () => window.clearTimeout(handle);
  }, [activities, targetMajor, runSpike]);

  const handleAddActivity = () => {
    if (!newTitle.trim()) return;
    setActivities([
      ...activities,
      {
        title: newTitle,
        role: newRole || "Lead Contributor",
        months: Number(newMonths) || 6,
        rarity: 0.78,
        validation: 0.80,
        alignment: 0.85,
      }
    ]);
    setNewTitle("");
    setNewRole("");
  };

  const handleRemoveActivity = (idx: number) => {
    setActivities(activities.filter((_, i) => i !== idx));
  };

  const handleTransformXYZ = async () => {
    if (!rawDraft.trim()) return;
    setIsTransforming(true);
    setTransformedOutput(null);
    setTransformNotice(null);
    try {
      const res = await fetch("/api/v2/portfolio/transform-xyz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_bullet: rawDraft,
          context_role: "High School Student Researcher",
          target_major: targetMajor
        })
      });
      const body = (await res.json().catch(() => null)) as
        | { transformed_xyz?: string; metric_highlighted?: string; critique?: string; reason?: string }
        | null;

      if (res.ok && body && typeof body.transformed_xyz === "string") {
        setTransformedOutput(body);
        return;
      }
      // The proxy refuses this endpoint (501) because the previous version
      // invented the metrics it printed. Relay the refusal verbatim. Writing a
      // plausible X-Y-Z sentence here would put the same unsourced numbers
      // into a portfolio the student may submit.
      setTransformNotice(
        (typeof body?.reason === "string" && body.reason) ||
          "X-Y-Z rewriting is unavailable. It previously generated metrics with no source, which would put fabricated claims in your portfolio.",
      );
    } catch {
      setTransformNotice(
        "X-Y-Z rewriting is unavailable. It previously generated metrics with no source, which would put fabricated claims in your portfolio.",
      );
    } finally {
      setIsTransforming(false);
    }
  };

  const handleCheckJournal = async () => {
    const name = journalQuery.trim();
    if (!name) return;
    setJournal({ status: "loading" });
    try {
      const res = await fetch("/api/v2/portfolio/check-preprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journal_name: name }),
      });
      const body = (await res.json().catch(() => null)) as
        | (Partial<JournalResult> & { reason?: string; error?: string })
        | null;

      if (!res.ok || !body || typeof body.is_flagged_predatory !== "boolean") {
        setJournal({
          status: "unavailable",
          reason:
            (typeof body?.reason === "string" && body.reason) ||
            "The publisher check could not be completed, so no verdict is shown.",
        });
        return;
      }
      setJournal({ status: "ready", data: body as JournalResult });
    } catch {
      setJournal({ status: "unavailable", reason: "The publisher check could not be reached." });
    }
  };

  return (
    <AuthGate title="portfolio builder">
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="border-b border-slate-200 pb-8 mb-10">
          <div className="flex items-center gap-2 text-rose-600 text-xs uppercase tracking-widest font-mono font-semibold mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Admissions Spike Studio · Section 11 Specification</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
            Global Portfolio Builder &amp; Angular Spike Studio
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-3xl leading-relaxed">
            Elite international universities reject 90%+ of generic &quot;well-rounded&quot; applicants.
            This studio scores the depth of your angular spike, and checks a prospective publisher
            against a known predatory-publisher deny-list.
          </p>
        </div>

        {/* Top Split: Engine Spike Meter & Activity Inventory */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Spike Authenticity Score — POST /api/v2/portfolio/compute-spike */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono text-slate-500 uppercase">Spike Authenticity</span>
                <span className="text-xs font-mono text-rose-600 font-semibold">Formula 11.1</span>
              </div>

              {spike.status === "loading" || spike.status === "idle" ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-mono">Scoring with engine…</span>
                </div>
              ) : spike.status === "unavailable" ? (
                <div>
                  <div className="text-4xl font-black text-slate-300">{/* no number is invented */"—"}</div>
                  <div className="text-sm font-semibold text-slate-400">/ 100</div>
                  <div className="mt-3 flex items-start gap-2 text-[11px] text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3 leading-relaxed">
                    <CircleAlert className="w-3.5 h-3.5 mt-px shrink-0" />
                    <span>
                      <strong className="block mb-0.5">No score available</strong>
                      {spike.reason}
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-3">
                    <div className="text-5xl font-black text-slate-950">{spike.data.spike_authenticity_score}</div>
                    <div className="text-sm font-semibold text-slate-400">/ 100</div>
                  </div>
                  <div className="mt-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        TIER_TONE[spike.data.tier] ??
                        "bg-slate-50 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {spike.data.tier}
                    </span>
                  </div>
                  {spike.data.spike_summary && (
                    <p className="text-xs text-slate-600 mt-3 leading-relaxed">{spike.data.spike_summary}</p>
                  )}
                  {spike.data.recommendation && (
                    <p className="text-xs text-slate-600 mt-3 leading-relaxed">{spike.data.recommendation}</p>
                  )}
                  <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
                    Engine output for{" "}
                    {spike.data.evaluated_activities_count ?? activities.length} activit
                    {(spike.data.evaluated_activities_count ?? activities.length) === 1 ? "y" : "ies"}. The engine
                    weights the rarity, external-validation and alignment figures you entered — it does
                    not verify them, so the score is a weighted restatement of your own assessment, not
                    an external measurement.
                  </p>
                </>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <label htmlFor="target-major" className="block text-xs font-mono text-slate-500 uppercase mb-1">
                Target Major:
              </label>
              <input
                id="target-major"
                type="text"
                value={targetMajor}
                onChange={(e) => setTargetMajor(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* Activity Inventory Manager */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-950 mb-4 flex items-center justify-between">
              <span>Activity Portfolio ({activities.length} Recorded)</span>
              <span className="text-xs font-mono text-slate-500">All entries are scored</span>
            </h3>

            {activities.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No activities recorded"
                hint="The engine returns its floor score for an empty portfolio rather than a real assessment — so this reads as 'not measured' until you add something worth measuring."
                variant="inline"
              />
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {activities.map((act, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{act.title}</div>
                      <div className="text-[11px] text-slate-500">{act.role} · {act.months} Months Invested</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] font-mono text-rose-600 font-semibold">Rarity: {Math.round(act.rarity * 100)}%</span>
                      <button
                        onClick={() => handleRemoveActivity(idx)}
                        aria-label={`Remove ${act.title}`}
                        className="text-slate-400 hover:text-rose-600 p-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add activity form */}
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Activity / Project Title"
                aria-label="Activity title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddActivity(); }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 sm:col-span-2"
              />
              <input
                type="text"
                placeholder="Your role (optional)"
                aria-label="Your role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddActivity(); }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
              <div className="flex gap-2 sm:col-span-3">
                <input
                  type="number"
                  placeholder="Months"
                  aria-label="Months invested"
                  min={1}
                  value={newMonths}
                  onChange={(e) => setNewMonths(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 w-24 focus:outline-none focus:border-slate-900"
                />
                <button
                  onClick={handleAddActivity}
                  disabled={!newTitle.trim()}
                  className="flex-1 sm:flex-none sm:px-6 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-semibold py-2 flex items-center justify-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action-Impact X-Y-Z Transformer Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-10">
          <div className="flex items-center gap-2 text-rose-600 text-xs font-mono uppercase tracking-wider mb-2">
            <FileText className="w-4 h-4" />
            <span>Google &amp; Common App X-Y-Z Optimization Engine</span>
          </div>
          <h2 className="text-xl font-bold text-slate-950 mb-2">Action-Impact X-Y-Z Transformer</h2>
          <p className="text-xs text-slate-500 mb-4">
            Restructures a bullet into <em>&quot;Accomplished [X] as measured by [Y] by doing [Z]&quot;</em>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="raw-bullet" className="block text-xs font-mono text-slate-500 uppercase mb-1">
                Your Draft Bullet:
              </label>
              <textarea
                id="raw-bullet"
                rows={4}
                value={rawDraft}
                onChange={(e) => setRawDraft(e.target.value)}
                placeholder="e.g. Built a machine learning model on Raspberry Pi to test water quality in local village wells..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
              <button
                onClick={handleTransformXYZ}
                disabled={isTransforming || !rawDraft.trim()}
                className="mt-3 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-200 text-white rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {isTransforming ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Transform to X-Y-Z Format</span>
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-slate-500 uppercase font-semibold">Optimized Result:</span>
                {transformedOutput ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-emerald-950 font-medium leading-relaxed bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                      &quot;{transformedOutput.transformed_xyz ?? NO_DATA}&quot;
                    </p>
                    <div className="text-[11px] text-slate-600">
                      <strong>Metric Highlighted:</strong> {transformedOutput.metric_highlighted ?? NO_DATA}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      <strong>Admissions Critique:</strong> {transformedOutput.critique ?? NO_DATA}
                    </div>
                  </div>
                ) : transformNotice ? (
                  <div className="mt-3 flex items-start gap-2 text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3 leading-relaxed">
                    <Lock className="w-3.5 h-3.5 mt-px shrink-0" />
                    <span>
                      <strong className="block mb-0.5">Unavailable — deliberately</strong>
                      {transformNotice}
                    </span>
                  </div>
                ) : (
                  <div className="mt-6 text-xs text-slate-400">
                    Input a draft bullet and click transform. If the engine declines, it says so
                    rather than writing a number you did not measure.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Split: Milestone Framework & Publisher Scanner */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Grade framework — intentionally in-page, see header comment. */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-950 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-600" />
              <span>4-Year High School Spike Timeline (Grades 9–12)</span>
            </h3>

            <div className="flex gap-2 mb-4">
              {[9, 10, 11, 12].map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
                    selectedGrade === g ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Grade {g}
                </button>
              ))}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2.5">
              {selectedGrade === 9 && (
                <>
                  <div className="font-bold text-rose-600">Grade 9: Broad Intellectual Exploration</div>
                  <div className="text-slate-700">• 3 Diverse exploratory projects (Robotics, Algorithms, Economics)</div>
                  <div className="text-slate-700">• Foundational competitive coding &amp; open-source contributions</div>
                  <div className="text-slate-700">• Maintain top-5% class rank baseline</div>
                </>
              )}
              {selectedGrade === 10 && (
                <>
                  <div className="font-bold text-rose-600">Grade 10: Spike Hypothesis &amp; Regional Contests</div>
                  <div className="text-slate-700">• Isolate singular spike focus area</div>
                  <div className="text-slate-700">• National Olympiad entry (INMO / INPhO / INOI / IRIS)</div>
                  <div className="text-slate-700">• Launch first community technical artifact</div>
                </>
              )}
              {selectedGrade === 11 && (
                <>
                  <div className="font-bold text-rose-600">Grade 11: Primary Research Artifact &amp; External Validation</div>
                  <div className="text-slate-700">• Author primary research preprint (arXiv / SSRN)</div>
                  <div className="text-slate-700">• Secure national/international award validation</div>
                  <div className="text-slate-700">• Standardized testing (Target: SAT 1540+ / ACT 35+)</div>
                </>
              )}
              {selectedGrade === 12 && (
                <>
                  <div className="font-bold text-rose-600">Grade 12: Common App Synthesis &amp; Early Action</div>
                  <div className="text-slate-700">• Socratic Personal Statement authoring</div>
                  <div className="text-slate-700">• Structure 10 Common App activities in strict X-Y-Z prose</div>
                  <div className="text-slate-700">• Early Decision (ED) portfolio optimization</div>
                </>
              )}
            </div>

            <p className="text-[11px] text-slate-500 mt-4 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 mt-px shrink-0 text-slate-400" />
              <span>
                Editorial guidance, kept on the page rather than fetched. The
                <code className="font-mono"> /portfolio/milestones</code> endpoint exists but its body
                is a literal dict inside the router, so calling it would add a network round-trip and a
                new way for this card to fail without adding any data.
              </span>
            </p>
          </div>

          {/* Predatory Publisher Scanner — POST /api/v2/portfolio/check-preprint */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-950 mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Predatory Publisher Scanner</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Check a prospective journal or publisher against a deny-list of known pay-to-publish
              names before you submit.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Journal / Publisher Name..."
                aria-label="Journal or publisher name"
                value={journalQuery}
                onChange={(e) => setJournalQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void handleCheckJournal(); }}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
              <button
                onClick={() => void handleCheckJournal()}
                disabled={journal.status === "loading" || !journalQuery.trim()}
                className="bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl px-4 py-2 text-xs font-semibold transition flex items-center gap-1.5"
              >
                {journal.status === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Scan</span>
              </button>
            </div>

            {journal.status === "loading" && (
              <p className="mt-4 text-xs text-slate-400 font-mono flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking deny-list…
              </p>
            )}

            {journal.status === "ready" && (
              <>
                <div className={`mt-4 p-3 rounded-xl border text-xs ${
                  journal.data.is_flagged_predatory
                    ? "bg-rose-50 border-rose-200 text-rose-800"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
                }`}>
                  <div className="font-bold">{journal.data.journal_name}</div>
                  <div className="mt-1 text-[11px]">{journal.data.warning}</div>
                </div>
                {/* A deny-list miss is not a clean bill of health. The engine
                    matches against ten substrings; it does not reach Beall's
                    list or an ISSN registry, despite the `source` label it
                    returns. Saying "not flagged" is the only honest claim. */}
                <p className="text-[11px] text-slate-500 mt-3 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 mt-px shrink-0 text-slate-400" />
                  <span>
                    &ldquo;Not flagged&rdquo; means the name did not match this short deny-list. It is not
                    independent confirmation that the journal is legitimate — verify the ISSN and
                    publisher before submitting.
                  </span>
                </p>
              </>
            )}

            {journal.status === "unavailable" && (
              <div className="mt-4 flex items-start gap-2 text-[11px] text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3 leading-relaxed">
                <CircleAlert className="w-3.5 h-3.5 mt-px shrink-0" />
                <span>
                  <strong className="block mb-0.5">No verdict</strong>
                  {journal.reason}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Flagship Opportunity Architecture: 3 Pillars from Master PRD Section 11 & 12 */}
        <div className="mt-12 pt-10 border-t border-slate-200">
          <div className="flex items-center gap-2 text-rose-600 text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            <span>Opportunity Architecture · Flagship Program</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-950 mb-2">
            Research, Practical Experience &amp; Structured Evidence
          </h2>
          <p className="text-sm text-slate-600 max-w-3xl mb-8 leading-relaxed">
            A claim on a resume is only as good as the artefact behind it. VividhEdu helps you
            document real research and practical work, then export it in a form a reviewer can
            actually verify instead of taking on faith.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1: Research */}
            <div className="bg-white border border-slate-200 border-t-2 border-t-rose-500 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-rose-600 mb-2">
                  <GraduationCap className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase">1. 1:1 PhD Research Fellowship</span>
                </div>
                <h3 className="text-sm font-bold text-slate-950 mb-2">Working Paper + Registered DOI</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Develop empirical econometric models or ML pipelines and publish on verified
                  preprint servers, with faculty co-authorship.
                </p>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-700 font-mono space-y-1">
                  <div>• Faculty Co-Authorship Protocol</div>
                  <div>• Registered Crossref DOI</div>
                </div>
              </div>
            </div>

            {/* Pillar 2: Micro-Internships */}
            <div className="bg-white border border-slate-200 border-t-2 border-t-purple-500 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase">2. Corporate Micro-Internships</span>
                </div>
                <h3 className="text-sm font-bold text-slate-950 mb-2">4–8 Week Vetted High-Growth Sprints</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Curated technical and policy sprints at algorithmic trading desks, AI startups, and think tanks. Ship production code instead of hypothetical essays.
                </p>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-700 font-mono space-y-1">
                  <div>• Applied LLM Fine-Tuning</div>
                  <div>• Quantitative Factor Backtesting</div>
                  <div>• Bi-Weekly Senior Practitioner Hours</div>
                </div>
              </div>
            </div>

            {/* Pillar 3: Verifiable artifacts */}
            <div className="bg-white border border-slate-200 border-t-2 border-t-emerald-500 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <GitCommit className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase">3. Structured Verification</span>
                </div>
                <h3 className="text-sm font-bold text-slate-950 mb-2">Structured, Verifiable Artifacts</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Your portfolio exports as structured, readable documents that a reviewer or an
                  admissions system can parse directly — so a claim is easy to check against the
                  underlying artefact rather than taken on trust.
                </p>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-700 font-mono space-y-1">
                  <div>• Exportable written record</div>
                  <div>• Machine-readable formatting</div>
                  <div>• ATS-parsable structure</div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Private until you share
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    </AuthGate>
  );
}
