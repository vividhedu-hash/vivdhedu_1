"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Calendar,
  ShieldAlert,
  CheckCircle,
  Plus,
  Trash2,
  FileText,
  Lock,
  GitCommit,
  GraduationCap,
  Briefcase,
  Info,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { NO_DATA } from "@/lib/mock-data";
import { AuthGate } from "@/components/AuthGate";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { Notice, UnmeasuredNote } from "@/components/Notice";
import { Metric } from "@/components/Metric";
import { Skeleton, SkeletonStatus } from "@/components/Skeleton";
import { RevealGroup } from "@/components/Reveal";

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

/**
 * Engine tier label → badge class, as a CLASS rather than a colour string.
 *
 * The previous map carried hardcoded light-palette backgrounds
 * (`bg-emerald-50 text-emerald-700`), which do not exist in the dark theme — a
 * dark-mode visitor got near-white on near-white. The badge tokens
 * (`--green-dim` / `--green`) are the same meaning in both.
 *
 * The engine's own tier vocabulary is four values, and it is the engine that
 * chooses them. Unrecognised labels fall back to a neutral badge rather than a
 * guessed colour, so a new backend tier does not get mis-stated.
 */
const TIER_BADGE: Record<string, string> = {
  "Exceptional Angular Spike": "badge-green",
  "Solid Competitive Spike": "badge-blue",
  "Developing Portfolio": "badge-amber",
  "Generic Portfolio": "badge-amber",
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

  const spikeLoading = spike.status === "loading" || spike.status === "idle";
  const evaluatedCount =
    spike.status === "ready"
      ? (spike.data.evaluated_activities_count ?? activities.length)
      : null;

  return (
    <AuthGate title="portfolio builder">
      <div className="page-shell">
        <div className="container-xl page-header">
          <PageHeader
            kicker="Admissions Spike Studio · Section 11"
            eyebrow={
              <span className="badge badge-rose">
                <Sparkles size={10} aria-hidden="true" />
                Engine-scored · Formula 11.1
              </span>
            }
            title="Global Portfolio Builder & Angular Spike Studio"
            lead="Scores the depth of an angular spike against the backend engine, and checks a prospective publisher against a known predatory-publisher deny-list. Where the engine will not return a score, this page shows the gap rather than estimating one."
          />
        </div>

        <div className="container-xl pb-16">
          {/* ── Top split: engine score + activity inventory ────────── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Spike Authenticity Score — POST /api/v2/portfolio/compute-spike */}
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">Spike Authenticity</span>
                <span className="num text-[11px] t-accent">Formula 11.1</span>
              </div>

              <div className="panel-pad">
                {spikeLoading ? (
                  <>
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="mt-3 h-3 w-28" />
                    <SkeletonStatus label="Scoring with the engine" />
                  </>
                ) : spike.status === "unavailable" ? (
                  <>
                    {/* Unmeasured, not zero. A 0 here would assert "the
                        portfolio is the worst possible one", which is a
                        different claim from "the engine did not answer". */}
                    <Metric
                      label="Spike authenticity"
                      value={null}
                      size="lg"
                    />
                    <div className="mt-4">
                      <Notice tone="error" title="No score available">
                        {spike.reason}
                      </Notice>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap items-baseline gap-2.5">
                      <span className="metric-xl t-text">
                        {spike.data.spike_authenticity_score}
                      </span>
                      <span className="num text-[13px] t-faint">/ 100</span>
                    </div>

                    <div className="mt-3">
                      <span className={`badge ${TIER_BADGE[spike.data.tier] ?? ""}`}>
                        {spike.data.tier}
                      </span>
                    </div>

                    <dl className="mt-5 grid grid-cols-2 gap-4">
                      <Metric
                        label="Activities scored"
                        value={evaluatedCount}
                        format={(v) => String(v)}
                        caption="Engine-reported"
                      />
                      <Metric
                        label="In portfolio"
                        value={activities.length}
                        format={(v) => String(v)}
                        caption="Submitted this session"
                      />
                    </dl>

                    {spike.data.spike_summary && (
                      <p className="body-p mt-4">{spike.data.spike_summary}</p>
                    )}
                    {spike.data.recommendation && (
                      <p className="body-p mt-2.5">{spike.data.recommendation}</p>
                    )}

                    <Notice tone="info" className="mt-4" title="What this score is">
                      Engine output for{" "}
                      {evaluatedCount ?? activities.length} activit
                      {(evaluatedCount ?? activities.length) === 1 ? "y" : "ies"}. The engine
                      weights the rarity, external-validation and alignment figures you
                      entered — it does not verify them, so the score is a weighted
                      restatement of your own assessment, not an external measurement.
                    </Notice>
                  </>
                )}

                <div className="mt-6 border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
                  <label htmlFor="target-major" className="form-label">
                    Target major
                  </label>
                  <input
                    id="target-major"
                    type="text"
                    value={targetMajor}
                    onChange={(e) => setTargetMajor(e.target.value)}
                    className="form-input text-[13px]"
                  />
                </div>
              </div>
            </div>

            {/* Activity Inventory Manager */}
            <div className="panel lg:col-span-2">
              <div className="panel-head">
                <span className="panel-title">
                  Activity portfolio · {activities.length} recorded
                </span>
                <span className="num text-[11px] t-faint">All entries are scored</span>
              </div>

              <div className="panel-pad">
                {activities.length === 0 ? (
                  <EmptyState
                    icon={Briefcase}
                    title="No activities recorded"
                    hint="The engine returns its floor score for an empty portfolio rather than a real assessment — so this reads as 'not measured' until you add something worth measuring."
                    variant="bare"
                  />
                ) : (
                  <div className="max-h-56 space-y-2.5 overflow-y-auto pr-1">
                    {activities.map((act, idx) => (
                      <div
                        key={idx}
                        className="t-chip flex items-center justify-between gap-3 rounded-lg border p-3"
                        style={{ borderColor: "var(--border-subtle)" }}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold t-text">
                            {act.title}
                          </div>
                          <div className="mt-0.5 text-[11px] t-muted">
                            {act.role} ·{" "}
                            <span className="num">{act.months}</span>{" "}
                            <span className="t-faint">months invested</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="num text-[11px] font-semibold t-accent">
                            Rarity{" "}
                            <span className="num-1">{Math.round(act.rarity * 100)}%</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveActivity(idx)}
                            aria-label={`Remove ${act.title}`}
                            className="btn-ghost p-1"
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add activity form */}
                <div
                  className="mt-4 grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-3"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <input
                    type="text"
                    placeholder="Activity / Project Title"
                    aria-label="Activity title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddActivity(); }}
                    className="form-input text-[13px] sm:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="Your role (optional)"
                    aria-label="Your role"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddActivity(); }}
                    className="form-input text-[13px]"
                  />
                  <div className="flex gap-2 sm:col-span-3">
                    <div className="w-24 flex-shrink-0">
                      <label htmlFor="new-months" className="sr-only">
                        Months invested
                      </label>
                      <input
                        id="new-months"
                        type="number"
                        placeholder="Months"
                        aria-label="Months invested"
                        min={1}
                        value={newMonths}
                        onChange={(e) => setNewMonths(Number(e.target.value))}
                        className="form-input text-[13px]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddActivity}
                      disabled={!newTitle.trim()}
                      className="btn-primary flex-1 sm:flex-none"
                    >
                      <Plus size={14} aria-hidden="true" />
                      <span>Add activity</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── X-Y-Z Transformer ──────────────────────────────────── */}
          <div className="panel mt-6">
            <div className="panel-head">
              <span className="panel-title flex items-center gap-2">
                <FileText size={12} aria-hidden="true" />
                Google &amp; Common App X-Y-Z optimization engine
              </span>
            </div>
            <div className="panel-pad">
              <h2 className="text-[15px] font-semibold t-text">Action-Impact X-Y-Z Transformer</h2>
              <p className="body-p mt-1.5">
                Restructures a bullet into{" "}
                <em className="t-text">&quot;Accomplished [X] as measured by [Y] by doing [Z]&quot;</em>.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="raw-bullet" className="form-label">
                    Your draft bullet
                  </label>
                  <textarea
                    id="raw-bullet"
                    rows={4}
                    value={rawDraft}
                    onChange={(e) => setRawDraft(e.target.value)}
                    placeholder="e.g. Built a machine learning model on Raspberry Pi to test water quality in local village wells..."
                    className="form-input text-[13px]"
                  />
                  <button
                    type="button"
                    onClick={handleTransformXYZ}
                    disabled={isTransforming || !rawDraft.trim()}
                    className="btn-primary mt-3"
                  >
                    {isTransforming ? (
                      <span className="spinner" aria-hidden="true" />
                    ) : (
                      <Sparkles size={14} aria-hidden="true" />
                    )}
                    <span>Transform to X-Y-Z format</span>
                  </button>
                </div>

                <div
                  className="t-chip flex flex-col justify-between rounded-lg border p-4"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <div>
                    <span className="metric-label">Optimized result</span>
                    {transformedOutput ? (
                      <div className="mt-2.5 space-y-2.5">
                        <p className="notice-ok notice text-[12px] leading-relaxed t-text">
                          &quot;{transformedOutput.transformed_xyz ?? NO_DATA}&quot;
                        </p>
                        <div className="metric-cell">
                          <span className="metric-label">Metric highlighted</span>
                          <span className="body-p">
                            {transformedOutput.metric_highlighted ?? NO_DATA}
                          </span>
                        </div>
                        <div className="metric-cell">
                          <span className="metric-label">Admissions critique</span>
                          <span className="body-p">
                            {transformedOutput.critique ?? NO_DATA}
                          </span>
                        </div>
                      </div>
                    ) : transformNotice ? (
                      <div className="mt-3">
                        <Notice tone="warn" title="Unavailable — deliberately" icon={Lock}>
                          {transformNotice}
                        </Notice>
                      </div>
                    ) : (
                      <EmptyState
                        variant="bare"
                        title="No rewrite yet"
                        hint="Input a draft bullet and transform it. If the engine declines, it says so rather than writing a metric you did not measure."
                        action={{ label: "Analyse a degree instead", href: "/analyze" }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Milestone framework + publisher scanner ─────────────── */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Grade framework — intentionally in-page, see header comment. */}
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title flex items-center gap-2">
                  <Calendar size={12} aria-hidden="true" />
                  4-year timeline · grades 9&ndash;12
                </span>
              </div>
              <div className="panel-pad">
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Select a grade year"
                >
                  {[9, 10, 11, 12].map((g) => (
                    <button
                      key={g}
                      type="button"
                      aria-pressed={selectedGrade === g}
                      onClick={() => setSelectedGrade(g)}
                      className={`goal-chip ${
                        selectedGrade === g ? "selected" : ""
                      }`}
                    >
                      Grade <span className="num">{g}</span>
                    </button>
                  ))}
                </div>

                <div
                  className="t-chip mt-4 space-y-2.5 rounded-lg border p-4 text-[12px] leading-relaxed"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  {selectedGrade === 9 && (
                    <>
                      <div className="kicker-accent">Broad intellectual exploration</div>
                      <div className="t-muted">3 diverse exploratory projects (Robotics, Algorithms, Economics)</div>
                      <div className="t-muted">Foundational competitive coding &amp; open-source contributions</div>
                      <div className="t-muted">Maintain a top-5% class rank baseline</div>
                    </>
                  )}
                  {selectedGrade === 10 && (
                    <>
                      <div className="kicker-accent">Spike hypothesis &amp; regional contests</div>
                      <div className="t-muted">Isolate a singular spike focus area</div>
                      <div className="t-muted">National Olympiad entry (INMO / INPhO / INOI / IRIS)</div>
                      <div className="t-muted">Launch first community technical artifact</div>
                    </>
                  )}
                  {selectedGrade === 11 && (
                    <>
                      <div className="kicker-accent">Primary research artifact &amp; external validation</div>
                      <div className="t-muted">Author primary research preprint (arXiv / SSRN)</div>
                      <div className="t-muted">Secure national/international award validation</div>
                      <div className="t-muted">
                        Standardized testing (target: SAT 1540+ / ACT 35+)
                      </div>
                    </>
                  )}
                  {selectedGrade === 12 && (
                    <>
                      <div className="kicker-accent">Common App synthesis &amp; early action</div>
                      <div className="t-muted">Socratic personal statement authoring</div>
                      <div className="t-muted">Structure 10 Common App activities in strict X-Y-Z prose</div>
                      <div className="t-muted">Early Decision (ED) portfolio optimization</div>
                    </>
                  )}
                </div>

                <Notice tone="info" className="mt-4" icon={Info}>
                  Editorial guidance, kept on the page rather than fetched. The{" "}
                  <code className="mono text-[11px]">/portfolio/milestones</code> endpoint exists
                  but its body is a literal dict inside the router, so calling it would add a
                  network round-trip and a new way for this panel to fail without adding any data.
                </Notice>
              </div>
            </div>

            {/* Predatory Publisher Scanner — POST /api/v2/portfolio/check-preprint */}
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title flex items-center gap-2">
                  <ShieldAlert size={12} aria-hidden="true" />
                  Predatory publisher scanner
                </span>
              </div>
              <div className="panel-pad">
                <p className="body-p">
                  Check a prospective journal or publisher against a deny-list of known
                  pay-to-publish names before you submit.
                </p>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <div className="min-w-0 flex-1">
                    <label htmlFor="journal-name" className="sr-only">
                      Journal or publisher name
                    </label>
                    <input
                      id="journal-name"
                      type="text"
                      placeholder="Enter journal / publisher name…"
                      aria-label="Journal or publisher name"
                      value={journalQuery}
                      onChange={(e) => setJournalQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") void handleCheckJournal(); }}
                      className="form-input text-[13px]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCheckJournal()}
                    disabled={journal.status === "loading" || !journalQuery.trim()}
                    className="btn-primary flex-shrink-0"
                  >
                    {journal.status === "loading" && (
                      <span className="spinner" aria-hidden="true" />
                    )}
                    <span>Scan</span>
                  </button>
                </div>

                {journal.status === "idle" && (
                  <EmptyState
                    variant="bare"
                    title="Nothing scanned yet"
                    hint="Enter a journal or publisher name and the engine will match it against its deny-list. Until then no verdict exists, and none is guessed."
                  />
                )}

                {journal.status === "loading" && (
                  <div className="mt-4 space-y-2" role="status" aria-live="polite">
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-3/4" />
                    <span className="sr-only">Checking the deny-list…</span>
                  </div>
                )}

                {journal.status === "ready" && (
                  <>
                    <div className="mt-4">
                      <Notice
                        tone={journal.data.is_flagged_predatory ? "error" : "ok"}
                        title={journal.data.journal_name}
                      >
                        {journal.data.warning}
                      </Notice>
                    </div>
                    {/* A deny-list miss is not a clean bill of health. The engine
                        matches against ten substrings; it does not reach Beall's
                        list or an ISSN registry, despite the `source` label it
                        returns. Saying "not flagged" is the only honest claim. */}
                    <Notice tone="info" className="mt-3" icon={Info}>
                      &ldquo;Not flagged&rdquo; means the name did not match this short
                      deny-list. It is not independent confirmation that the journal is
                      legitimate — verify the ISSN and publisher before submitting.
                    </Notice>
                  </>
                )}

                {journal.status === "unavailable" && (
                  <UnmeasuredNote
                    className="mt-4"
                    what="Publisher verdict"
                  >
                    {journal.reason} No verdict is computed locally in its place, because a
                    local deny-list match is not the same check the engine performs.
                  </UnmeasuredNote>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Opportunity architecture ─────────────────────────────── */}
        <div className="page-band">
          <div className="container-xl page-section-tight">
            <SectionHeader
              kicker="Opportunity architecture · flagship program"
              title="Research, practical experience & structured evidence"
              lead="A claim on a resume is only as good as the artefact behind it. VividhEdu helps you document real research and practical work, then export it in a form a reviewer can actually verify instead of taking on faith."
            />

            <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Pillar 1: Research */}
              <div className="panel">
                <div
                  className="h-1 w-full"
                  style={{ background: "var(--accent)" }}
                  aria-hidden="true"
                />
                <div className="panel-pad">
                  <span className="metric-label flex items-center gap-2">
                    <GraduationCap size={13} aria-hidden="true" />
                    1. 1:1 PhD research fellowship
                  </span>
                  <h3 className="mt-2.5 text-[14px] font-semibold t-text">
                    Working paper + registered DOI
                  </h3>
                  <p className="body-p mt-2">
                    Develop empirical econometric models or ML pipelines and publish on verified
                    preprint servers, with faculty co-authorship.
                  </p>
                  <ul className="mt-4 space-y-1.5">
                    {["Faculty co-authorship protocol", "Registered Crossref DOI"].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="num text-[11px] t-faint" aria-hidden="true">▪</span>
                        <span className="mono text-[11px] t-muted">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pillar 2: Micro-Internships */}
              <div className="panel">
                <div
                  className="h-1 w-full"
                  style={{ background: "var(--purple)" }}
                  aria-hidden="true"
                />
                <div className="panel-pad">
                  <span className="metric-label flex items-center gap-2">
                    <Briefcase size={13} aria-hidden="true" />
                    2. Corporate micro-internships
                  </span>
                  <h3 className="mt-2.5 text-[14px] font-semibold t-text">
                    4&ndash;8 week vetted high-growth sprints
                  </h3>
                  <p className="body-p mt-2">
                    Curated technical and policy sprints at algorithmic trading desks, AI startups
                    and think tanks. Ship production code instead of hypothetical essays.
                  </p>
                  <ul className="mt-4 space-y-1.5">
                    {[
                      "Applied LLM fine-tuning",
                      "Quantitative factor backtesting",
                      "Bi-weekly senior practitioner hours",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="num text-[11px] t-faint" aria-hidden="true">▪</span>
                        <span className="mono text-[11px] t-muted">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pillar 3: Verifiable artifacts */}
              <div className="panel">
                <div
                  className="h-1 w-full"
                  style={{ background: "var(--green)" }}
                  aria-hidden="true"
                />
                <div className="panel-pad">
                  <span className="metric-label flex items-center gap-2">
                    <GitCommit size={13} aria-hidden="true" />
                    3. Structured verification
                  </span>
                  <h3 className="mt-2.5 text-[14px] font-semibold t-text">
                    Structured, verifiable artifacts
                  </h3>
                  <p className="body-p mt-2">
                    Your portfolio exports as structured, readable documents that a reviewer or
                    an admissions system can parse directly — so a claim is easy to check
                    against the underlying artefact rather than taken on trust.
                  </p>
                  <ul className="mt-4 space-y-1.5">
                    {[
                      "Exportable written record",
                      "Machine-readable formatting",
                      "ATS-parsable structure",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="num text-[11px] t-faint" aria-hidden="true">▪</span>
                        <span className="mono text-[11px] t-muted">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  className="flex items-center gap-1.5 border-t px-[22px] py-3"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <CheckCircle size={13} style={{ color: "var(--green)" }} aria-hidden="true" />
                  <span className="num text-[11px] t-muted">Private until you share</span>
                </div>
              </div>
            </RevealGroup>

            <Notice tone="accent" className="mt-8" title="What this page does not do">
              No figure on this page is computed in the browser. The spike score, the tier label
              and the publisher verdict all come from the engine or are shown as unmeasured —
              there is no local fallback that could produce a number the backend never issued.
            </Notice>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
