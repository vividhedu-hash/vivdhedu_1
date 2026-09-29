import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, CheckCircle2,
  Zap, Sliders, ChevronRight, Compass,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Notice } from "@/components/Notice";
import { CollegeCard } from "@/components/CollegeCard";
import { WaitlistForm } from "@/components/WaitlistForm";
import { fetchCollegeList } from "../lib/live-colleges";
import type { CollegeDegreeRecord } from "@/lib/mock-data";
import { APP_URL, BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description:
    "Price the degree as an asset. 20-year NPV against verified costs, P10 downside, an automation-exposure component inside the composite, and a ranked shortlist built around your exact goals. Free during launch.",
  alternates: { canonical: APP_URL },
};

/**
 * Organization + WebSite structured data.
 *
 * Kept to facts that are true and checkable: the name, the canonical origin,
 * the free-during-launch offer, and the pages a reader would want to find from
 * a search result. No aggregateRating, no invented review counts, no fake
 * founding date — structured data that overstates a product is the same class
 * of error the product itself is built to avoid.
 */
function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${APP_URL}/#organization`,
        name: BRAND.name,
        url: APP_URL,
        description: BRAND.descriptor,
        email: BRAND.supportEmail,
        areaServed: "IN",
        knowsLanguage: "en-IN",
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer support",
            email: BRAND.supportEmail,
            areaServed: "IN",
            availableLanguage: ["en"],
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${APP_URL}/#website`,
        url: APP_URL,
        name: BRAND.name,
        description: BRAND.tagline,
        publisher: { "@id": `${APP_URL}/#organization` },
        inLanguage: "en-IN",
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Proof points.
 *
 * `count` is rendered from the live database row count, never hardcoded. The
 * previous proof point claimed "1,420+ institutional cohorts" — a constant
 * that the real Postgres has never contained, since the live view returns 73
 * programmes — so a visitor comparing the claim against /explore would have
 * caught it. If the database is unreachable, `count` is null and the strip says
 * so rather than falling back to an invented number.
 *
 * Two claims were removed here rather than restated:
 *
 *  - "10,000 Monte Carlo paths / degree". The backend simulator runs
 *    `num_trials = 1000` (backend/api/routers/analytics.py:35) and
 *    `global_standards_analytics.py` labels its own output "1,000 Monte Carlo
 *    Iterations". The landing page was claiming a 10x larger run than the
 *    engine performs, and the workspace's "10,000 Paths" heading and the ROI
 *    tab's "₹8.4L → ₹1.1 Cr" P10/P50/P90 distribution were the same fiction
 *    repeated.
 *  - "3PL IRT" as a headline capability. The engine is real —
 *    `backend/services/adaptive_cat.py` implements the 3PL probability
 *    function, Fisher information and max-information item selection. It is
 *    stated here as a description of the method, and the psychometric page
 *    documents it, because the ability to *report* an SE from a session is
 *    currently not wired into the result view.
 */
const PROOF_POINTS: Array<{ key: string; value: string; label: string }> = [
  { key: "count", value: "", label: "Programmes indexed" },
  { key: "sim", value: "1,000", label: "Monte Carlo paths per run" },
  { key: "irt", value: "3PL IRT", label: "Adaptive item selection" },
  { key: "years", value: "20-year", label: "Discounted NPV horizon" },
];

const TRUST_ITEMS = [
  "Six composite factors, weighted adaptively to your profile",
  "Salaries shown as P10–P90 distributions, not averages",
  "Unmeasured figures are labelled unmeasured, never filled in",
  "No college can pay to change its rank",
  "Every score links to a published formula",
  "The mobility index and skill-velocity scores are not published, because neither is measured yet",
];

/**
 * Illustrative scenarios.
 *
 * These are NOT testimonials. The previous version of this section presented
 * three invented people — a name and a class for each — invented quotes, and
 * invented outcome deltas ("+35% admittance odds", "₹4.2L annual savings")
 * as social proof from real users, which is a fabricated claim about real
 * people's financial decisions. The names are not repeated here on purpose:
 * the same persona was later found hardcoded as the default onboarding
 * profile, and a comment that quotes it is an easy thing to copy from.
 *
 * What replaced them are worked examples with no names attached: what the
 * product shows and why the number looks the way it does. The figures inside
 * them are illustrative outputs, explicitly labelled as such.
 */
const SCENARIOS = [
  {
    name: "Engineering, Tier 1",
    body: "Fees and salary both look strong in isolation, so the brochure case looks obvious. The model prices the full cost of the degree against a P10 downside, because the median case is the case the brochure was written for.",
    label: "Shows: cost breakdown, P10–P90 salary band, debt stress",
    color: "var(--blue)",
  },
  {
    name: "Tier 2, same field",
    body: "A cheaper fee and a smaller absolute salary can still produce a better risk-adjusted return. The spread matters more than the headline, and the composite reflects that the marginal return depends on how much loan you carry.",
    label: "Shows: counterfactual — what the other option costs you",
    color: "var(--green)",
  },
  {
    name: "Field with high AI exposure",
    body: "A field can be strong on salary and weak on durability. The automation surface sits inside the composite, so a risk-adjusted view of the same programme is available next to the optimistic one.",
    label: "Shows: AI displacement surface, 20-year resilience",
    color: "var(--purple)",
  },
];

/**
 * The six composite factors, with their BASE weights from
 * `compute_student_adaptive_weights` in backend/ml/roi_computer.py.
 *
 * These are the un-adapted starting values (θ = 0). At runtime the financial,
 * optionality, mobility and safety weights move with the student's own IRT
 * trait estimates, then the set is renormalised — so the percentages below are
 * the shape of the formula, not a fixed published table. Showing fixed
 * percentages as if they never moved would misdescribe the model.
 */
const SCORE_FACTORS = [
  { label: "Financial ROI — salary vs. fee paid",      base: "25%", color: "var(--blue)", shifts: true },
  { label: "Job security & placement consistency",     base: "20%", color: "var(--green)", shifts: true },
  { label: "Optionality — career ceiling at year 10",  base: "18%", color: "var(--purple)", shifts: true },
  { label: "Mobility — access & lateral moves",        base: "12%", color: "var(--teal)", shifts: true },
  { label: "Satisfaction & burnout",                   base: "12%", color: "var(--amber)", shifts: false },
  { label: "Alumni network",                          base: "13%", color: "var(--accent)", shifts: false },
];

export default async function LandingPage() {
  let SAMPLE: CollegeDegreeRecord[] = [];
  // `indexUnavailable` is a third state alongside live and seed. Without it
  // the status bar had only two strings to choose from, and "not live" fell
  // through to "Calibrated Engine · Index loading" — a reassuring label for a
  // page with no data behind it.
  let isLive = false;
  let indexUnavailable = false;
  let totalCount: number | null = null;

  try {
    const featured = await fetchCollegeList({ per_page: 3, sort_by: "compositeScore" });
    SAMPLE           = featured.data;
    isLive           = featured.source === "database";
    indexUnavailable = featured.source === "unavailable";
    totalCount       = featured.total;
  } catch {
    // A thrown error is the same user-visible situation as an unreachable
    // source: there is no index to read.
    indexUnavailable = true;
  }

  return (
    <div className="bg-surface text-ink min-h-screen">
      <OrganizationJsonLd />

      {/* ── SYSTEM STATUS BAR ─────────────────────────────────── */}
      {/*
        This bar is the single most dishonest element the guard uncovered. It
        was a hardcoded green pulsing dot plus "System Online" with a
        two-way ternary underneath, and the two available branches were
        "Supabase Connected" and "Calibrated Engine". Neither was reachable
        when the index was down: the second string means "the engine is
        calibrated", and it rendered unconditionally alongside a live-looking
        green dot.

        Now the dot colour, the pulse, and the wording are all derived from the
        same fact — whether the index answered. An unreachable index gets an
        amber static dot and the word "Unavailable", which is a claim we can
        actually support, rather than a green pulse that asserts a healthy
        system. `isLive` alone is not enough: seed data is also "not live" but
        is not an outage, and collapsing them would misdescribe local dev.

        The wording is deliberately short and the explanatory detail lives in the
        `title` attribute instead. The previous sentences were long enough that
        the left cluster collided with the right-hand links in the same row and
        the strip wrapped to three lines on a laptop. The claim stays exactly as
        honest — it is just stated in the strip and explained on hover.
      */}
      <div className="border-b border-line/10 bg-elevated/70 backdrop-blur-md py-2 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-1.5 h-1.5 rounded-full inline-block flex-shrink-0 ${
                indexUnavailable ? "bg-sys-amber" : "bg-sys-green animate-pulse"
              }`}
            />
            <span
              className="font-mono text-[11px] text-ink-2 truncate"
              title={
                indexUnavailable
                  ? "The programme index could not be reached, so this page is not showing live data."
                  : isLive
                    ? "Connected to the live programme index."
                    : "Showing the bundled demo dataset, not the live index."
              }
            >
              {indexUnavailable ? (
                <>Index unavailable</>
              ) : isLive ? (
                <>
                  System Online ·{" "}
                  {totalCount != null ? `${totalCount} programmes indexed` : "Index loading"}
                </>
              ) : (
                <>
                  Demo dataset ·{" "}
                  {totalCount != null ? `${totalCount} programmes` : "Index loading"}
                </>
              )}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-5 text-[11px] text-ink-3 font-mono flex-shrink-0 whitespace-nowrap">
            <Link href="/workspace" className="hover:text-ink transition-colors flex items-center gap-1 text-ink-2">
              <Zap size={11} className="text-sys-amber" /> Workspace
            </Link>
            <span>Free during launch</span>
            <span>No pay-to-rank</span>
          </div>
        </div>
      </div>

      {/* ── HERO ──────────────────────────────────────────────── */}
      {/*
        Redesigned from measurements, not taste. The previous version measured
        the same at 375 / 768 / 1024 / 1280 / 1440 and failed in five specific,
        reproducible ways:

        1. The proof strip needed 882px of content inside a `max-w-3xl` (768px)
           box, so at every width >= 768 the fourth item wrapped alone onto a
           ragged centred second line. At 375 it collapsed to four ragged rows.
           The cause was arithmetic, not styling: a 4-column strip of prose-length
           mono labels cannot fit a 768px measure. `grid-cols-2 md:grid-cols-4`
           makes every breakpoint a deliberate rectangle instead of a wrap
           accident.
        2. `pt-24 pb-24` (96px each side) put the hero at 779px in a 900px
           viewport. A screenful of near-empty padding above and below ~590px of
           content, with nothing else on the fold. The vertical rhythm is now a
           4-step scale (56px / 44px / 40px / 40px -> per DESIGN-SYSTEM.md §4)
           rather than two symmetric slabs of dead air.
        3. The second headline line was `text-ink-3 font-light` — the design
           system's *tertiary* token, documented at ~3.6:1 on white and reserved
           for "non-essential metadata", carrying the primary headline's second
           half. That is the contrast budget spent on the one thing that had to be
           readable. It is now `text-ink-2` (secondary, ~6.4:1) at 600 weight,
           which keeps the two-line hierarchy the design intends without
           weakening it into a legal notice.
        4. The ambient glow was `blur-[110px]` on a 450px-tall element with
           `from-accent/10 via-accent/5`. A 110px blur consumes a quarter of the
           element's own height, and 10% accent over a white page is
           imperceptible — it measured as visible-but-absent. It is now a
           top-anchored wash using the two `--hero-glow` gradients `globals.css`
           already defines for this purpose, so it is visible without competing
           with the type, and it follows the theme instead of hardcoding alpha.
        5. The clamp `6.5vw` put 1280 and 1440 at the 4.8rem cap (76.8px) while
           1024 got 66.6px and 768 got 49.9px — a hard size jump across a range
           where the column width barely moves. The ramp is re-cut in vw terms
           that keep the type near-measured at every stop.

        What is deliberately NOT here: no product screenshot, no fake dashboard,
        no fabricated metric, no testimonial, no logo wall. The visual anchor is
        a rule-and-grid system plus the live programme count, both of which are
        real. The honesty rationale for removing the earlier invented furniture is
        recorded above `PROOF_POINTS` and at the WORKSPACE SHOWCASE section and is
        untouched by this change.
      */}
      <section className="relative overflow-hidden px-5 pb-16 pt-14 sm:pb-20 sm:pt-16">
        {/* Ambient wash. `--hero-glow` / `--hero-glow-bottom` are the tokens
            globals.css defines for the hero; using them keeps the treatment on
            the same alpha ramp the rest of the shell already uses and makes it
            theme-aware for free. */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-hero-glow" />
          <div className="absolute inset-0 bg-hero-glow-bottom" />
        </div>

        {/* A hairline rule system rather than decoration. It gives the centred
            column an edge to align to, and it is the one ambient element that
            costs no contrast. Drawn with `--line` at low alpha so it reads in
            both themes. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line/15 to-transparent"
        />

        <div className="relative mx-auto max-w-4xl">
          {/* Eyebrow — one phrase, not two. The old pill joined "Student
              Intelligence Platform" and "India's Decision Platform" with a "·"
              into a 420px mono line that read as a second, competing tagline.
              The qualifier that earns its place is the one that tells a visitor
              what kind of number they are about to read. */}
          <div className="inline-flex items-center gap-2 rounded-full border border-line/10 bg-elevated/80 px-3 py-1 font-mono text-[11px] font-medium tracking-wide text-ink-2 backdrop-blur-sm">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            Student Intelligence Platform
          </div>

          {/* Headline. Two lines, both in primary or secondary ink, weight
              doing the hierarchy work rather than opacity. `text-balance` keeps
              the rag from tipping at the narrow end. */}
          <h1 className="mt-7 text-[clamp(2.5rem,7.2vw,4.5rem)] font-extrabold leading-[1.03] tracking-[-0.035em] text-ink">
            Start with you.
            <br />
            <span className="font-semibold text-ink-2">Build your education OS.</span>
          </h1>

          {/* Subheading — one measure (58ch), held to two lines. */}
          <p className="mx-auto mt-6 max-w-[58ch] text-pretty text-[17px] leading-relaxed text-ink-2">
            3 minutes of calibration. 20-year NPV analysis, AI resilience scoring,
            and a ranked shortlist built around your exact goals.
          </p>

          {/* CTA — primary is the dark pill, secondary drops to a ghost so the
              two do not compete at the same weight. */}
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/onboard"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-7 py-3.5 text-[15px] font-semibold text-bg shadow-md transition-all hover:shadow-lg active:scale-[0.98] sm:w-auto"
            >
              Get started free
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/explore"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-line/10 bg-transparent px-7 py-3.5 text-[15px] font-medium text-ink transition-all hover:border-line/25 hover:bg-overlay/50 active:scale-[0.98] sm:w-auto"
            >
              Browse programs
            </Link>
          </div>

          {/* Proof strip — a deliberate grid, not a wrap. `count` is still the
              live database value; `null` renders as an em dash via the system's
              unmeasured convention rather than a zero. Figures use `.num-*`
              (mono + tabular) per DESIGN-SYSTEM.md §2, so the four values read
              as a column of measurements instead of four loose strings. */}
          <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-line/10 pt-8 md:grid-cols-4 md:gap-x-8">
            {PROOF_POINTS.map((p) => {
              const value =
                p.key === "count"
                  ? totalCount != null
                    ? String(totalCount)
                    : "—"
                  : p.value;
              return (
                <div key={p.key} className="flex flex-col items-start gap-1.5 text-left">
                  <span
                    className={`num num-3 font-semibold tracking-[-0.02em] ${
                      p.key === "count" && totalCount == null ? "num-na" : "text-ink"
                    }`}
                  >
                    {value}
                  </span>
                  <span className="text-[12px] leading-snug text-ink-3">{p.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CALIBRATION STEPS ─────────────────────────────────── */}
      {/*
        Was an "Active Session Profile / Undergraduate & Career Trajectory /
        ID: #SYS-01" card with a pulsing rose dot. There is no such session:
        no session id is issued on the landing page, and the workspace behind
        this link requires sign-in. A pulsing "live" indicator on a static
        marketing card is the same class of claim as the rest of this page's
        old furniture. Replaced with the actual three steps, which are real.
      */}
      <section className="px-5 pb-20">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { n: "01", t: "Tell us your constraints", b: "Budget, stream, exam, home state, what you actually want out of a degree." },
            { n: "02", t: "Run the assessment", b: "An adaptive diagnostic estimates eight traits and reports how confident it is in each." },
            { n: "03", t: "Read the report", b: "A ranked shortlist where every score decomposes, and every gap says it is a gap." },
          ].map((s) => (
            <div key={s.n} className="bg-elevated rounded-2xl p-5 border border-line/10 shadow-xs">
              <span className="font-mono text-[10px] font-bold text-accent">{s.n}</span>
              <div className="text-[14px] font-semibold text-ink mt-1">{s.t}</div>
              <p className="text-[12px] text-ink-2 leading-relaxed mt-1.5">{s.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WORKSPACE SHOWCASE ────────────────────────────────── */}
      {/*
        The previous version of this section rendered a pixel-accurate
        screenshot of the workspace — a "Operating Engine Synthesis" card
        recommending "Pivot 65% focus to Standardized Testing Baseline", a
        "Your Signal" panel showing resilience 78 and "Top 8% in Quant Track",
        a "Primary Gap: Faculty Co-authorship / Adding an institutional
        co-author elevates Tier-1 odds by ~2.4×", and a "Runtime: 0.28s"
        badge.

        None of that was a screenshot of anything a real user saw. It was the
        hardcoded persona from the workspace page rendered as marketing. Since
        that page no longer produces this state, the section now describes the
        workspace in terms that survive the rewrite, and the one number it
        shows is the live programme count.
      */}
      <section className="py-20 px-5 border-t border-line/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-5">
            <div>
              <p className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-accent mb-3">
                <span className="w-2.5 h-1.5 bg-accent" />
                Decision workspace
              </p>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold tracking-tight text-ink leading-tight">
                Your decisions, in one place
              </h2>
              <p className="text-ink-2 text-sm mt-2 max-w-lg leading-relaxed">
                A question box wired to the grounded advisor, your own decision
                weights, and a roadmap you control. Figures that have not been
                measured for you show as &ldquo;&mdash;&rdquo; rather than as a
                confident guess.
              </p>
            </div>
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-elevated hover:bg-surface border border-line/10 text-ink text-[13px] font-semibold rounded-full shadow-xs hover:border-line/20 transition-all flex-shrink-0 active:scale-[0.98]"
            >
              Open Workspace <ArrowRight size={13} />
            </Link>
          </div>

          {/* What the workspace actually contains */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-elevated border border-line/10 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-line/5">
                <Sliders size={14} className="text-accent" />
                <span className="text-[13px] font-bold text-ink">Inside the workspace</span>
              </div>
              <ul className="mt-4 space-y-3.5">
                {[
                  {
                    title: "A question box, answered with sources",
                    body: "It calls the grounded advisor. If the advisor cannot be reached you get an error, not a canned recommendation — a previously hardcoded “pivot 65% to standardized testing” answer was returned on every failure.",
                  },
                  {
                    title: "Seven decision weights you set yourself",
                    body: "Career, cost, prestige, rigor, location, flexibility, opportunities. These are recorded and shown back to you. They are not yet sent to a ranking engine, and the page says so rather than implying otherwise.",
                  },
                  {
                    title: "A roadmap that is only yours",
                    body: "Milestones you write, with completion counted from your own list. No generated deadlines, and it says plainly that it does not yet survive a page reload.",
                  },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-sys-green flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[13px] font-semibold text-ink">{item.title}</div>
                      <p className="text-[12px] text-ink-2 leading-relaxed mt-0.5">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                href="/workspace"
                className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-ink text-elevated rounded-full text-[12px] font-semibold hover:bg-ink transition-colors active:scale-[0.98]"
              >
                Open the workspace <ArrowRight size={12} />
              </Link>
            </div>

            {/* The one honest count on this page */}
            <div className="bg-elevated border border-line/10 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-line/5">
                  <span className="text-[12px] font-bold text-ink">What is indexed today</span>
                </div>

                <div className="mt-4">
                  <span className="text-[9px] font-mono font-bold text-ink-3 uppercase tracking-wider">
                    Programmes
                  </span>
                  <div className="text-[32px] font-bold font-mono text-ink mt-0.5 leading-none">
                    {totalCount ?? "—"}
                  </div>
                  <p className="text-[11px] text-ink-2 mt-2 leading-relaxed">
                    {/* `!= null` rather than truthiness: a genuine count of 0
                        is a real reading and should say so. The old truthy
                        test would have described an empty-but-reachable index
                        as "unreachable". */}
                    {totalCount == null
                      ? "The index is unreachable right now, so we are not quoting a number."
                      : isLive
                        ? "Read from the live database at request time, not a figure typed into a marketing page."
                        : "Counted from the bundled demo dataset, not from the live index."}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-line/5">
                  <span className="text-[9px] font-mono font-bold text-ink-3 uppercase tracking-wider">
                    Deliberately not published
                  </span>
                  <p className="text-[11px] text-ink-2 mt-2 leading-relaxed">
                    The upward-mobility index and skill-demand velocity are not
                    shown. Both currently resolve to lookup tables rather than
                    measurements, and a number you cannot source is worse than a
                    gap you can see.
                  </p>
                </div>
              </div>

              <Link
                href="/methodology"
                className="mt-5 block w-full py-2.5 bg-ink hover:bg-ink text-elevated rounded-lg text-center text-[12px] font-semibold transition-colors active:scale-[0.98] shadow-xs"
              >
                See the methodology and its limits
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED PROGRAMS ────────────────────────────────── */}
      <section className="py-20 px-5 border-t border-line/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-accent mb-3">
                <span className="w-2.5 h-[1.5px] bg-accent" />
                {/* Was hardcoded "From the live index". With the mock guard in
                    place this section is reached in two different states, and
                    the label is a claim about the provenance of the cards
                    directly beneath it — so it follows the actual source. */}
                {isLive ? "From the live index" : "From the demo dataset"}
              </p>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.4rem)] font-bold tracking-tight text-ink">
                Same ₹15L fee. Very different outcomes.
              </h2>
            </div>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-2 hover:text-ink transition-colors"
            >
              View all <ChevronRight size={14} />
            </Link>
          </div>

          {/* A provenance warning sits directly above the cards, not in a
              footer, because the cards look identical either way. The reader
              has to be told before they read a composite score off a card, not
              after. `warn` is the correct tone: degraded but usable. */}
          {!isLive && !indexUnavailable && (
            <Notice
              tone="warn"
              title="These are sample programmes, not live data"
              className="mb-6"
            >
              The live index could not be reached, so this page is showing the
              bundled demo dataset. The scores, fees and placement rates below
              are illustrative and do not describe real institutions. Set{" "}
              <code className="mono">ALLOW_MOCK_FALLBACK=0</code> to hide them
              entirely and show only the unavailable state.
            </Notice>
          )}

          {SAMPLE.length === 0 ? (
            /* The preview strip is a sample of the index, not the index. When
               the preview fetch fails, the count is the honest thing to show —
               and it stays live rather than being replaced with a guess. The
               `totalCount != null` test is what keeps an outage (null) from
               being rendered as a count of zero. */
            <EmptyState
              icon={Compass}
              title={
                totalCount != null
                  ? `${totalCount} programmes in the live index`
                  : "The programme index is unavailable"
              }
              hint={
                totalCount != null
                  ? "We could not load a preview of the index on this page, but the full index is intact. Open it to browse every programme we hold live data for."
                  : "The index could not be reached. This is a fetch failure, not an empty index — retry, or come back shortly."
              }
              action={{ label: "Open the programme index", href: "/explore" }}
              secondaryAction={{ label: "Methodology", href: "/methodology" }}
              variant="bare"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {SAMPLE.map((record) => (
                <CollegeCard key={record.id} record={record} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FIDUCIARY TRANSPARENCY ───────────────────────────── */}
      <section className="py-20 px-5 border-t border-line/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-accent mb-4">
                <span className="w-2.5 h-[1.5px] bg-accent" />
                Fiduciary Standard
              </p>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.4rem)] font-bold tracking-tight text-ink mb-5 leading-tight">
                Our formula is open.
                <br />
                Push back if it&apos;s wrong.
              </h2>
              <p className="text-ink-2 text-sm leading-relaxed mb-8">
                Every composite score breaks down into six components whose
                weights are recomputed from your own trait estimates. Every
                figure links to the source it came from. Where something has not
                been measured, it says so instead of filling the gap.
              </p>
              <div className="space-y-3">
                {TRUST_ITEMS.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-sys-green flex-shrink-0 mt-0.5" />
                    <span className="text-[13px] text-ink">{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/methodology"
                className="inline-flex items-center gap-1.5 mt-8 px-4 py-2.5 bg-elevated border border-line/10 rounded-full text-[13px] font-semibold text-ink hover:bg-surface transition-colors shadow-xs active:scale-[0.98]"
              >
                Read the full methodology <ChevronRight size={13} />
              </Link>
            </div>

            {/* Score Breakdown */}
            <div className="bg-elevated border border-line/10 rounded-2xl p-6 shadow-xs">
              <p className="text-[10px] font-mono font-bold text-ink-3 uppercase tracking-wider mb-5">
                Composite Score Decomposition
              </p>
              <div className="space-y-4">
                {SCORE_FACTORS.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[13px] text-ink-2 flex-1">{item.label}</span>
                    <span
                      className={`font-mono font-bold text-[13px] ${item.shifts ? "text-ink-3" : "text-ink"}`}
                      title={item.shifts ? "Adjusted to your profile at runtime" : "Fixed weight"}
                    >
                      {item.base}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-start gap-2 rounded-lg border border-line/10 bg-surface p-3">
                <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-chip" />
                <p className="text-[11px] leading-relaxed text-ink-2">
                  Base weights at a neutral profile. The four greyed figures are
                  re-derived from your own trait estimates and renormalised on
                  every run — your composite is not this table with different
                  labels.
                </p>
              </div>
              <div className="mt-5 pt-5 border-t border-line/5 flex items-center justify-between">
                <span className="text-[12px] text-ink-3 font-mono">Composite score (0–100)</span>
                <span className="font-mono text-[12px] font-bold text-ink">= weighted sum × confidence</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT THE MODEL ADDS ─────────────────────────────── */}
      <section className="py-20 px-5 border-t border-line/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="inline-flex items-center justify-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-accent mb-3">
              <span className="w-2.5 h-[1.5px] bg-accent" />
              What the model adds
            </p>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.4rem)] font-bold tracking-tight text-ink">
              Three cases the brochure cannot show you.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[13px] leading-relaxed text-ink-2">
              Illustrative worked cases, not customer results. Run your own
              numbers in the tool rather than reading ours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SCENARIOS.map((s) => (
              <div key={s.name} className="bg-elevated border border-line/10 rounded-xl p-5 hover:border-line/20 hover:shadow-md transition-all shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[13px] font-bold text-ink">{s.name}</div>
                </div>
                <p className="text-[13px] text-ink-2 leading-relaxed mb-5">
                  {s.body}
                </p>
                <div className="pt-4 border-t border-line/5">
                  <span className="text-[12px] font-mono font-semibold" style={{ color: s.color }}>
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="relative py-28 px-5 text-center overflow-hidden border-t border-line/10">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[650px] h-[350px] rounded-full bg-gradient-to-tr from-rose-100/40 via-purple-50/20 to-blue-100/30 blur-[100px]" />
        </div>
        <div className="relative max-w-xl mx-auto">
          <p className="font-mono text-[11px] text-ink-2 uppercase tracking-wider mb-4">
            Free during launch · No card · No usage cap
          </p>
          <h2 className="text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold tracking-[-0.04em] text-ink mb-4 leading-tight">
            Stop guessing.
            <br />
            Price the degree properly.
          </h2>
          <p className="text-ink-2 text-[15px] mb-10 leading-relaxed">
            Salary distributions, AI resilience, a ranked shortlist, and a
            decision workspace — calibrated to your profile, not the brochure.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/onboard"
              className="inline-flex items-center gap-2 px-9 py-4 bg-ink hover:bg-ink active:scale-[0.98] text-elevated font-bold text-[15px] rounded-full shadow-md hover:shadow-lg transition-all"
            >
              Start free — run my analysis
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-7 py-4 bg-elevated hover:bg-surface active:scale-[0.98] border border-line/10 text-ink font-medium text-[15px] rounded-full shadow-xs transition-all"
            >
              What it costs
            </Link>
          </div>
          <p className="text-[11px] text-ink-3 mt-5 font-mono">
            Decision support, not financial advice
          </p>
        </div>
      </section>

      {/* ── WAITLIST ──────────────────────────────────────────── */}
      <section className="border-t border-line/10 px-5 py-16">
        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr_400px] lg:items-start">
          <div>
            <p className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-accent">
              <span className="w-2.5 h-[1.5px] bg-accent" />
              Coming next
            </p>
            <h2 className="mt-3 text-[clamp(1.7rem,3.5vw,2.3rem)] font-bold tracking-tight text-ink">
              Be told the price before it exists
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
              {BRAND.name} is free right now, and the plan is to keep the core
              analysis free. When paid tiers open, waitlist members get the real
              launch prices first — not a teaser. One email, nothing else.
            </p>
            <ul className="mt-6 space-y-2.5">
              {[
                "Launch prices, sent before the tiers go live",
                "No drip campaign, no resold address",
                "One email, then silence unless there is pricing news",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0 text-sys-green" />
                  <span className="text-[13px] text-ink">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <WaitlistForm source="home" />
        </div>
      </section>

    </div>
  );
}
