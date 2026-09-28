import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, CheckCircle2,
  Zap, Sliders, ChevronRight, Compass,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { CollegeCard } from "@/components/CollegeCard";
import { WaitlistForm } from "@/components/WaitlistForm";
import { fetchCollegeList } from "../lib/live-colleges";
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
  let SAMPLE: any[] = [];
  let isLive = false;
  let totalCount: number | undefined;

  try {
    const featured = await fetchCollegeList({ per_page: 3, sort_by: "compositeScore" });
    SAMPLE       = featured.data;
    isLive       = featured.source === "database";
    totalCount   = featured.total;
  } catch {
    // Supabase unreachable at build time — fall back to empty display
  }

  return (
    <div className="bg-surface text-ink min-h-screen">
      <OrganizationJsonLd />

      {/* ── SYSTEM STATUS BAR ─────────────────────────────────── */}
      <div className="border-b border-line/10 bg-elevated/70 backdrop-blur-md py-2 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-sys-green inline-block animate-pulse" />
            <span className="font-mono text-[11px] text-ink-2">
              System Online · {isLive ? "Supabase Connected" : "Calibrated Engine"} ·{" "}
              {totalCount ? `${totalCount} programmes indexed` : "Index loading"}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-5 text-[11px] text-ink-3 font-mono">
            <Link href="/workspace" className="hover:text-ink transition-colors flex items-center gap-1 text-ink-2">
              <Zap size={11} className="text-sys-amber" /> Workspace
            </Link>
            <span>Free during launch</span>
            <span>No pay-to-rank</span>
          </div>
        </div>
      </div>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-24 px-5 text-center overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[750px] h-[450px] rounded-full bg-gradient-to-tr from-accent/10 via-accent/5 to-sys-blue/10 blur-[110px]" />
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-dim border border-accent/25 text-[11px] text-accent font-mono font-medium mb-8 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block animate-pulse" />
            Student Intelligence Platform · India&apos;s Decision Platform
          </div>

          {/* Headline */}
          <h1 className="text-[clamp(3rem,6.5vw,4.8rem)] font-extrabold leading-[1.04] tracking-[-0.04em] text-ink mb-6">
            Start with you.
            <br />
            <span className="text-ink-3 font-light">Build your education OS.</span>
          </h1>

          {/* Subheading */}
          <p className="text-[17px] text-ink-2 max-w-xl mx-auto mb-10 leading-relaxed font-normal">
            3 minutes of calibration. 20-year NPV analysis, AI resilience scoring,
            and a ranked shortlist built around your exact goals.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-12">
            <Link
              href="/onboard"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-ink hover:bg-ink active:scale-[0.98] text-elevated font-semibold text-[15px] rounded-full shadow-md hover:shadow-lg transition-all"
            >
              Get started free
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-elevated hover:bg-surface active:scale-[0.98] border border-line/10 text-ink font-medium text-[15px] rounded-full shadow-xs hover:border-line/20 transition-all"
            >
              Browse programs
            </Link>
          </div>

          {/* Proof strip — count comes from the live database */}
          <div className="flex flex-wrap justify-center gap-6 text-[12px] text-ink-2 font-mono">
            {PROOF_POINTS.map((p) => (
              <div key={p.key} className="flex items-center gap-2">
                <span className="text-ink font-bold">
                  {p.key === "count"
                    ? totalCount
                      ? String(totalCount)
                      : "—"
                    : p.value}
                </span>
                <span>{p.label}</span>
              </div>
            ))}
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
                    {totalCount
                      ? "Read from the live database at request time, not a figure typed into a marketing page."
                      : "The index is unreachable right now, so we are not quoting a number."}
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
                From the live index
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

          {SAMPLE.length === 0 ? (
            /* The preview strip is a sample of the index, not the index. When
               the preview fetch fails, the count is the honest thing to show —
               and it stays live rather than being replaced with a guess. */
            <EmptyState
              icon={Compass}
              title={totalCount ? `${totalCount} programmes in the live index` : "The programme index is unavailable"}
              hint={
                totalCount
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
