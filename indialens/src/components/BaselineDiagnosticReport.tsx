"use client";

import React from "react";
import {
  Compass,
  Shield,
  Sliders,
  Target,
  ArrowRight,
      Edit3,
  Check,
} from "lucide-react";
import { Notice, UnmeasuredNote } from "./Notice";
import { Metric, MetricRow } from "./Metric";
import { NO_DATA } from "../lib/mock-data";

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

/**
 * The onboarding summary — a read-back of the student's own answers.
 *
 * ## What this screen is, structurally
 *
 * Four `.panel` blocks on a `.page-shell` canvas, one page header, one action
 * bar. It was a `min-h-screen bg-[#F8FAFC]` wrapper with a black logo square,
 * a fake "Stage 09 / 10" progress chip, and a hand-rolled header and footer
 * that both duplicated chrome the app shell already provides. The chrome is
 * gone: this is a full-bleed step, and the app shell owns the navbar.
 *
 * ## Why the cards are panels, not cards
 *
 * Nothing in here is clickable. They were `.card`-shaped, which lifts on hover,
 * so a static read-back behaved like four links. `.panel` is flat with a
 * hairline, which is what a data surface is.
 *
 * The big honesty note in the original file is preserved below because it is
 * the reason several of these blocks say "not set" rather than showing
 * something: this screen once rendered an entirely invented student.
 */
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

  const targetField =
    typeof wizardData?.targetField === "string" ? wizardData.targetField.trim() : "";
  const stageIsSet = stages[0] !== "Not set";
  const budget = BUDGET_LABELS[String(wizardData?.budgetBand)];
  const focus = FOCUS_LABELS[String(wizardData?.immediateFocus)];

  return (
    <div className="page-shell flex min-h-screen flex-col justify-between">
      <main className="container-xl page-header flex-1">
        {/* One page header, the same composition every route uses. The old
            bespoke block used `text-zinc-950` at three different sizes. */}
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-2.5">
            <span className="badge badge-teal">
              <Check size={10} aria-hidden="true" />
              Report ready
            </span>
          </div>
          <h1 className="page-title">
            {name ? `Here’s what we recorded, ${name.split(/\s+/)[0]}.` : "Here’s what we recorded."}
          </h1>
          <p className="section-lead mt-4">
            This is a summary of the answers you gave. Everything below is what
            you told us — we have not filled in anything you did not say.
          </p>
        </div>

        {saveNotice && (
          <Notice tone="warn" className="mt-6">
            {saveNotice}
          </Notice>
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
        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          {/* Academic horizon — the student's own stage and disciplines. */}
          <section className="panel min-w-0">
            <div className="panel-head">
              <span className="panel-title flex items-center gap-2">
                <Compass size={12} aria-hidden="true" />
                Academic horizon
              </span>
              <span className={`badge ${stageIsSet ? "badge-rose" : "badge-amber"}`}>
                {stageIsSet ? stages[0] : "Not set"}
              </span>
            </div>
            <div className="panel-pad">
              <span className="metric-label">Interests you picked</span>
              <h2 className="mt-1.5 text-[16px] font-bold leading-snug t-text">
                {targetField || "No target field given"}
              </h2>
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {disciplines.map((d) => (
                  <span
                    key={d}
                    className="t-chip rounded-md border px-2 py-1 text-[11px] font-medium t-muted"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/*
            Card 2 used to be the AI Resilience Score. It is kept as a panel —
            it is a real product concept — but it reports the one thing we can
            actually say: that no measurement exists yet, and where to get one.
          */}
          <section className="panel min-w-0">
            <div className="panel-head">
              <span className="panel-title flex items-center gap-2">
                <Shield size={12} style={{ color: "var(--accent)" }} aria-hidden="true" />
                AI resilience
              </span>
              <span className="num text-[10px] num-na">Not measured</span>
            </div>
            <div className="panel-pad">
              <MetricRow label="Trait-based score" hint="From the psychometric assessment, out of 100">
                <span className="num metric num-na">{NO_DATA}</span>
                <span className="num text-[11px] num-na">/100</span>
              </MetricRow>

              <div className="mt-3.5">
                <Notice tone="info">
                  This figure comes from the psychometric assessment, not from
                  onboarding, so it is not measured at this point.{" "}
                  <a
                    href="/psychometric"
                    className="t-accent font-medium underline underline-offset-2"
                  >
                    Take the assessment
                  </a>{" "}
                  and it will be measured.
                </Notice>
              </div>
            </div>
          </section>

          {/* The student's own decision weights, ranked. */}
          <section className="panel min-w-0">
            <div className="panel-head">
              <span className="panel-title flex items-center gap-2">
                <Sliders size={12} aria-hidden="true" />
                Your decision weights
              </span>
            </div>
            <div className="panel-pad">
              <h3 className="text-[13px] font-bold t-text">
                {weights.length ? "Ranked as you set them" : "Not set"}
              </h3>

              {weights.length ? (
                <div className="mt-3.5 space-y-3.5">
                  {weights.slice(0, 3).map(([key, value], i) => {
                    const pct = Math.max(0, Math.min(100, value));
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              aria-hidden="true"
                              className="num flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-bg"
                            >
                              {i + 1}
                            </span>
                            <span className="truncate text-[12px] t-muted">
                              {WEIGHT_LABELS[key] ?? key}
                            </span>
                          </span>
                          <span className="num flex-shrink-0 text-[12px] font-semibold t-text">
                            {value}%
                          </span>
                        </div>
                        {/* `.ci-track` / `.ci-fill`, the shared confidence-band
                            geometry. Here the unfilled remainder is the share
                            of the ceiling the weight did not claim, which is
                            the honest reading for a 0–100 slider. */}
                        <div className="ci-track mt-1.5">
                          <div
                            className="ci-fill"
                            style={{ width: `${pct}%`, background: "var(--text-primary)" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {weights.length > 3 && (
                    <p className="num text-[11px] t-faint">
                      +{weights.length - 3} more you set
                    </p>
                  )}
                </div>
              ) : (
                <p className="body-p mt-3.5">
                  No weights were set during onboarding.
                </p>
              )}
            </div>
          </section>

          {/* The student's own goals and constraints. */}
          <section className="panel flex min-w-0 flex-col">
            <div className="panel-head">
              <span className="panel-title flex items-center gap-2">
                <Target size={12} aria-hidden="true" />
                Execution scope
              </span>
            </div>
            <div className="panel-pad flex flex-1 flex-col">
              <span className="metric-label">You came here to</span>
              <h3 className="mt-1.5 text-[14px] font-bold leading-snug t-text">
                {goals.join(" · ")}
              </h3>

              <div className="mt-4 grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-3">
                {/* Each parameter is a `Metric` so an unset one renders as the
                    unmeasured dash rather than as a plausible-looking string. */}
                <Metric
                  label="Budget"
                  value={budget ? 1 : null}
                  format={() => budget}
                  className="t-chip rounded-lg border p-2.5"
                />
                <Metric
                  label="Regions"
                  value={geography[0] !== "Not set" ? 1 : null}
                  format={() => geography.join(", ")}
                  className="t-chip rounded-lg border p-2.5"
                />
                <Metric
                  label="Next focus"
                  value={focus ? 1 : null}
                  format={() => focus}
                  className="t-chip rounded-lg border p-2.5"
                />
              </div>

              <div className="mt-auto">
                {institutions[0] !== "Not set" ? (
                  <p className="body-p mt-3.5">
                    <span className="t-text">Institutions you named: </span>
                    {institutions.join(", ")}
                  </p>
                ) : (
                  <div className="mt-3.5">
                    <UnmeasuredNote what="Dream institutions">
                      No institution was named during onboarding. That is
                      perfectly normal at this stage — it is not a gap in your
                      profile, it is simply the one thing you have not decided
                      yet.
                    </UnmeasuredNote>
                  </div>
                )}
              </div>
            </div>
          </section>
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

      {/* Action bar */}
      <footer
        className="t-surface sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3.5"
        style={{ borderColor: "var(--divider)" }}
      >
        <button
          type="button"
          onClick={() => { window.location.href = "/onboard"; }}
          className="btn-secondary"
        >
          <Edit3 size={13} aria-hidden="true" />
          <span>Edit my inputs</span>
        </button>

        <button
          type="button"
          onClick={onEnterWorkspace}
          className="btn-primary"
        >
          <span>See my report</span>
          <ArrowRight size={14} style={{ color: "var(--accent)" }} aria-hidden="true" />
        </button>
      </footer>
    </div>
  );
};
