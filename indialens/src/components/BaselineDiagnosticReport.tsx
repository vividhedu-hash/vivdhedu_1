"use client";

import React from "react";
import {
  Compass,
  Shield,
  Sliders,
  Target,
  ArrowRight,
  Edit3,
  Bookmark,
  HelpCircle,
  Check,
  AlertTriangle
} from "lucide-react";

interface BaselineDiagnosticProps {
  token: string;
  wizardData: Record<string, any>;
  onEnterWorkspace: () => void;
  /** Result of persisting the student's own name and report link. */
  saveNotice?: string | null;
}

const STAGE_LABELS: Record<string, string> = {
  class_9_10: "Class 9–10",
  class_11_12: "Class 11–12",
  college: "College",
  gap_other: "Gap year / Other",
};

const BUDGET_LABELS: Record<string, string> = {
  lt_15k: "< $15k / yr",
  "15k_35k": "$15k–$35k / yr",
  "35k_65k": "$35k–$65k / yr",
  gt_65k: "$65k+ / yr",
};

const GEOGRAPHY_LABELS: Record<string, string> = {
  domestic: "Domestic Only",
  us_canada: "US / Canada",
  uk_europe: "UK & Europe",
  singapore: "Singapore / Global Hubs",
};

const FOCUS_LABELS: Record<string, string> = {
  research_preprint: "Publish a research preprint",
  standardized_testing: "Boost standardized testing",
  mentorship: "Secure a mentorship",
};

/**
 * Human labels for the discipline ids, which are stored as machine keys.
 * Anything unrecognised is shown as the raw key rather than dropped, so the
 * summary never quietly omits something the student selected.
 */
const DISCIPLINE_LABELS: Record<string, string> = {
  behavioral_econ: "Behavioral Economics",
  venture_finance: "Venture Finance",
  quant_trading: "Quantitative Trading",
  applied_econometrics: "Applied Econometrics",
  ml_ai: "Machine Learning / AI",
  distributed_systems: "Distributed Systems",
  hci: "Human-Computer Interaction",
  cybersecurity: "Cybersecurity",
  comp_bio: "Computational Biology",
  neuroscience: "Neuroscience",
  astrophysics: "Astrophysics",
  genomics: "Genomics",
  public_policy: "Public Policy & Law",
  cog_psych: "Cognitive Psychology",
  industrial_design: "Industrial Design",
  philosophy_mind: "Philosophy of Mind",
};

const GOAL_LABELS: Record<string, string> = {
  college_discovery: "Find the right college",
  career_choice: "Choose a career",
  profile_building: "Build my profile",
  internships: "Find internships",
  research: "Explore research",
  projects: "Start a project",
  confused: "Not sure yet",
};

const WEIGHT_LABELS: Record<string, string> = {
  career_outcomes: "Career outcomes",
  cost_affordability: "Cost & Affordability",
  prestige: "Prestige & Alumni",
  academic_rigor: "Learning & Rigor",
  location: "Location & Environment",
  flexibility: "Flexibility & Minor Options",
  opportunities: "Curated Opportunities",
};

const listOr = (items: unknown, labels: Record<string, string>, empty: string): string[] => {
  if (!Array.isArray(items) || items.length === 0) return [empty];
  return items.map((v) => labels[String(v)] ?? String(v));
};

export const BaselineDiagnosticReport: React.FC<BaselineDiagnosticProps> = ({
  token,
  wizardData,
  onEnterWorkspace,
  saveNotice,
}) => {
  const name = typeof wizardData?.fullName === "string" ? wizardData.fullName.trim() : "";
  const stages = listOr([wizardData?.stage], STAGE_LABELS, "Not set");
  const disciplines = listOr(wizardData?.disciplines, DISCIPLINE_LABELS, "None selected");
  const goals = listOr(wizardData?.goals, GOAL_LABELS, "None selected");
  const geography = listOr(wizardData?.geography, GEOGRAPHY_LABELS, "Not set");
  const institutions =
    Array.isArray(wizardData?.dreamInstitutions) && wizardData.dreamInstitutions.length > 0
      ? (wizardData.dreamInstitutions as string[])
      : ["Not set"];

  const weights: [string, number][] = Object.entries(
    (wizardData?.weights ?? {}) as Record<string, number>,
  )
    .filter(([, v]) => typeof v === "number" && Number.isFinite(v))
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-zinc-950 font-sans">
      {/* Top Bar matching Screen 09 */}
      <header className="px-6 py-3.5 flex items-center justify-between border-b border-slate-200/80 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center text-white font-bold text-[10px]">
            OS
          </div>
          <span className="font-bold text-sm text-zinc-900 tracking-tight">VividhEdu</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-zinc-600 font-semibold">
            Stage 09 / 10
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1 text-zinc-500 cursor-pointer hover:text-zinc-800">
            <HelpCircle size={13} />
            <span>Support</span>
          </div>
          <span className="text-zinc-300">|</span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-zinc-600 font-medium">
            <Check size={12} className="text-emerald-600" />
            <span>Report ready</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200/60 text-rose-700 text-[10px] font-bold font-mono tracking-wider uppercase mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            <span>REPORT READY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight mb-1.5">
            {name ? `Here’s what we recorded, ${name.split(/\s+/)[0]}.` : "Here’s what we recorded."}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-2xl leading-relaxed">
            This is a summary of the answers you gave. Everything below is what you told us — we
            have not filled in anything you did not say.
          </p>
        </div>

        {saveNotice && (
          <div
            role="status"
            className="mb-4 flex items-start gap-2.5 px-3.5 py-3 rounded-xl border border-amber-300 bg-amber-50 text-[12px] text-amber-900"
          >
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <p className="leading-relaxed">{saveNotice}</p>
          </div>
        )}

        {/*
          WHAT REPLACED WHAT, and why it matters more than it looks.

          This screen previously rendered a complete, invented student as a
          "synthesis" result, and it ignored `wizardData` entirely — the
          component received the answers and never read them. So whatever a
          student typed, they were shown:

            "Class 11–12 trajectory"                     (hardcoded badge)
            "Economics, Quantitative Analysis & Computing"(hardcoded heading)
            Applied Econometrics / Stochastic Modeling /
              Algorithm Design                            (hardcoded tags)
            "Benchmark: Upper Decile"                    (hardcoded)
            Initial AI Resilience Score  87/100           (hardcoded)
            "Strong quantitative problem solving"        (hardcoded assessment)
            Decision weights 95% / 82% / 70%              (hardcoded — the
                                                            persona's weights,
                                                            not the student's)
            "College discovery + Research portfolio"     (hardcoded)
            "Need-aware" / "UK / Europe & Hubs" /
              "Top 5% Baseline"                          (hardcoded)
            "1 free strategic counselling session … Claim Spot"
                                                          (an entitlement that
                                                            does not exist)

          The AI Resilience Score is the sharpest case: it is the single most
          quoted number in the product, it was a literal in JSX, and it was
          displayed identically to a student who had scored nothing because the
          psychometric test was never run here. Presenting an unmeasured score
          as a measurement is the same failure as the fabricated placement rate
          fixed in fd861db.

          So each card now renders the student's own answer, and where a number
          would be a measurement we do not have one, the card says so instead of
          printing a plausible figure.
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Card 1: ACADEMIC HORIZON — the student's own stage and disciplines */}
          <div className="p-5 rounded-xl border border-slate-200 bg-white relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Compass size={14} className="text-zinc-400" />
                <span className="text-[10px] font-mono uppercase font-bold text-zinc-400">
                  ACADEMIC HORIZON
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                {stages[0]}
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 block mb-1">Interests you picked</span>
            <h3 className="font-bold text-base text-zinc-900 mb-3 break-words">
              {wizardData?.targetField?.trim() || "No target field given"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {disciplines.map((d) => (
                <span
                  key={d}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-50 text-zinc-700 border border-slate-200"
                >
                  • {d}
                </span>
              ))}
            </div>
          </div>

          {/*
            Card 2 used to be the AI Resilience Score. It is kept as a card —
            it is a real product concept — but it reports the one thing we can
            actually say: that no measurement exists yet, and where to get one.
          */}
          <div className="p-5 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-rose-500" />
                <span className="text-[10px] font-mono uppercase font-bold text-zinc-400">
                  AI RESILIENCE
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">Not measured</span>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs text-zinc-500">Trait-based score</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-zinc-300 font-mono">—</span>
                <span className="text-xs text-zinc-300 font-mono">/100</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-slate-200 rounded-full" />
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-zinc-600 leading-relaxed">
              This number comes from the 40-item psychometric assessment, not from onboarding.
              <a
                href="/psychometric"
                className="underline underline-offset-2 ml-1 font-medium text-rose-700 hover:text-rose-800"
              >
                Take the assessment
              </a>{" "}
              and it will be measured.
            </div>
          </div>

          {/* Card 3: the student's own decision weights, ranked */}
          <div className="p-5 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <Sliders size={14} className="text-zinc-400" />
              <span className="text-[10px] font-mono uppercase font-bold text-zinc-400">
                YOUR DECISION WEIGHTS
              </span>
            </div>
            <h4 className="text-xs font-bold text-zinc-900 mb-3">
              {weights.length ? "Ranked as you set them" : "Not set"}
            </h4>
            {weights.length ? (
              <div className="space-y-3 text-xs">
                {weights.slice(0, 3).map(([key, value], i) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-black text-white text-[10px] font-mono font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-zinc-700">{WEIGHT_LABELS[key] ?? key}</span>
                      </div>
                      <span className="font-mono font-bold text-zinc-900">{value}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-zinc-800"
                        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                      />
                    </div>
                  </div>
                ))}
                {weights.length > 3 && (
                  <p className="text-[11px] text-zinc-400 pt-1">
                    + {weights.length - 3} more you set
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-zinc-400">No weights were set during onboarding.</p>
            )}
          </div>

          {/* Card 4: the student's own goals and constraints */}
          <div className="p-5 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target size={14} className="text-zinc-400" />
                <span className="text-[10px] font-mono uppercase font-bold text-zinc-400">
                  EXECUTION SCOPE
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 block mb-1">You came here to</span>
              <h4 className="font-bold text-sm text-zinc-900 mb-3">{goals.join(" · ")}</h4>
            </div>

            <div>
              <span className="text-[11px] text-zinc-400 block mb-1.5">Parameters you set</span>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-zinc-400 block">Budget</span>
                  <span className="font-bold text-[11px] text-zinc-900 block leading-tight mt-0.5">
                    {BUDGET_LABELS[String(wizardData?.budgetBand)] ?? "Not set"}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-zinc-400 block">Regions</span>
                  <span className="font-bold text-[11px] text-zinc-900 block leading-tight mt-0.5">
                    {geography.join(", ")}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-zinc-400 block">Next focus</span>
                  <span className="font-bold text-[11px] text-zinc-900 block leading-tight mt-0.5">
                    {FOCUS_LABELS[String(wizardData?.immediateFocus)] ?? "Not set"}
                  </span>
                </div>
              </div>
              {institutions[0] !== "Not set" && (
                <p className="text-[11px] text-zinc-400 mt-2.5">
                  Institutions you named: {institutions.join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/*
          The "Complimentary Advisory Session / Claim Spot" card promised a
          free human strategy session and called a button that only fired
          `alert("Advisory consultation booked. Your sovereign profile has been
          linked.")` — a confirmation for a booking that was not made, with
          nothing scheduled, nobody notified, and no record. It is gone rather
          than reworded: there is no counselling service behind it to point at.
        */}
      </main>

      {/* Bottom Actions matching Screen 09 */}
      <footer className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between">
        <button
          onClick={() => window.location.href = "/onboard"}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-zinc-700 hover:bg-slate-50 transition dashed-ring cursor-pointer"
        >
          <Edit3 size={13} />
          <span>Edit my inputs</span>
        </button>

        <button
          onClick={onEnterWorkspace}
          className="flex items-center gap-2.5 px-6 py-2 rounded-lg bg-black text-white text-xs font-semibold hover:bg-zinc-800 transition dashed-ring cursor-pointer"
        >
          <span>See my report</span>
          <ArrowRight size={14} className="text-rose-500" />
        </button>
      </footer>
    </div>
  );
};
