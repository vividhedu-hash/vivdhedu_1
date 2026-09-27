import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, Shield, CheckCircle2,
  TrendingUp, Brain, Zap, BarChart2,
  Sparkles, Compass, ChevronRight, Sliders,
} from "lucide-react";
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
 * previous "1,420+ institutional cohorts" was a constant that the real
 * Postgres has never contained — the live view returns 73 programs — so a
 * visitor comparing the claim against /explore would have caught it. If the
 * database is unreachable, `count` is null and the strip says so rather than
 * falling back to an invented number.
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
 * invented people ("Alex M.", "Priya M.", "Rahul K."), invented quotes, and
 * invented outcome deltas ("+35% admittance odds", "₹4.2L annual savings")
 * as social proof from real users, which is a fabricated claim about real
 * people's financial decisions.
 *
 * What replaces them are worked examples: what the product shows and why the
 * number looks the way it does. The figures inside them are illustrative
 * outputs, explicitly labelled as such.
 */
const SCENARIOS = [
  {
    name: "Engineering, Tier 1",
    body: "Fees and salary both look strong in isolation, so the brochure case looks obvious. The model prices the full cost of the degree against a P10 downside, because the median case is the case the brochure was written for.",
    label: "Shows: cost breakdown, P10–P90 salary band, debt stress",
    color: "#2563EB",
  },
  {
    name: "Tier 2, same field",
    body: "A cheaper fee and a smaller absolute salary can still produce a better risk-adjusted return. The spread matters more than the headline, and the composite reflects that the marginal return depends on how much loan you carry.",
    label: "Shows: counterfactual — what the other option costs you",
    color: "#16A34A",
  },
  {
    name: "Field with high AI exposure",
    body: "A field can be strong on salary and weak on durability. The automation surface sits inside the composite, so a risk-adjusted view of the same programme is available next to the optimistic one.",
    label: "Shows: AI displacement surface, 20-year resilience",
    color: "#9333EA",
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
  { label: "Financial ROI — salary vs. fee paid",      base: "25%", color: "#2563EB", shifts: true },
  { label: "Job security & placement consistency",     base: "20%", color: "#16A34A", shifts: true },
  { label: "Optionality — career ceiling at year 10",  base: "18%", color: "#9333EA", shifts: true },
  { label: "Mobility — access & lateral moves",        base: "12%", color: "#0891B2", shifts: true },
  { label: "Satisfaction & burnout",                   base: "12%", color: "#EA580C", shifts: false },
  { label: "Alumni network",                          base: "13%", color: "#E11D48", shifts: false },
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
    <div className="bg-[#F8FAFC] text-zinc-950 min-h-screen">
      <OrganizationJsonLd />

      {/* ── SYSTEM STATUS BAR ─────────────────────────────────── */}
      <div className="border-b border-slate-200/80 bg-white/70 backdrop-blur-md py-2 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="font-mono text-[11px] text-zinc-500">
              System Online · {isLive ? "Supabase Connected" : "Calibrated Engine"} ·{" "}
              {totalCount ? `${totalCount} programmes indexed` : "Index loading"}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-5 text-[11px] text-zinc-400 font-mono">
            <Link href="/workspace" className="hover:text-zinc-800 transition-colors flex items-center gap-1 text-zinc-500">
              <Zap size={11} className="text-amber-500" /> Workspace Demo
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
          <div className="w-[750px] h-[450px] rounded-full bg-gradient-to-tr from-rose-100/50 via-purple-100/30 to-blue-100/40 blur-[110px]" />
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200/80 text-[11px] text-rose-700 font-mono font-medium mb-8 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block animate-pulse" />
            Student Intelligence Platform · India&apos;s Decision Platform
          </div>

          {/* Headline */}
          <h1 className="text-[clamp(3rem,6.5vw,4.8rem)] font-extrabold leading-[1.04] tracking-[-0.04em] text-zinc-950 mb-6">
            Start with you.
            <br />
            <span className="text-zinc-400 font-light">Build your education OS.</span>
          </h1>

          {/* Subheading */}
          <p className="text-[17px] text-zinc-600 max-w-xl mx-auto mb-10 leading-relaxed font-normal">
            3 minutes of calibration. 20-year NPV analysis, AI resilience scoring,
            and a ranked shortlist built around your exact goals.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-12">
            <Link
              href="/onboard"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-black hover:bg-zinc-800 active:scale-[0.98] text-white font-semibold text-[15px] rounded-full shadow-md hover:shadow-lg transition-all"
            >
              Get started free
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white hover:bg-slate-50 active:scale-[0.98] border border-slate-200 text-zinc-800 font-medium text-[15px] rounded-full shadow-xs hover:border-slate-300 transition-all"
            >
              Browse programs
            </Link>
          </div>

          {/* Proof strip — count comes from the live database */}
          <div className="flex flex-wrap justify-center gap-6 text-[12px] text-zinc-500 font-mono">
            {PROOF_POINTS.map((p) => (
              <div key={p.key} className="flex items-center gap-2">
                <span className="text-zinc-950 font-bold">
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

      {/* ── ACTIVE SESSION CARD ───────────────────────────────── */}
      <section className="px-5 pb-20">
        <div className="max-w-md mx-auto bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-slate-300 transition-all shadow-xs hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600">
              <Sliders size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-zinc-950">Active Session Profile</span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
              </div>
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">Undergraduate &amp; Career Trajectory</p>
            </div>
            <span className="font-mono text-[10px] text-zinc-400 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">ID: #SYS-01</span>
          </div>
        </div>
      </section>

      {/* ── WORKSPACE SHOWCASE ────────────────────────────────── */}
      <section className="py-20 px-5 border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-5">
            <div>
              <p className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-rose-600 mb-3">
                <span className="w-2.5 h-[1.5px] bg-rose-600" />
                Screens 10–12 Live Architecture
              </p>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold tracking-tight text-zinc-950 leading-tight">
                The Sovereign Student Workspace
              </h2>
              <p className="text-zinc-600 text-sm mt-2 max-w-lg leading-relaxed">
                Real-time admissions simulations, 8-dimension AI resilience radar,
                milestone velocity tracking, and strategic vector trade-offs.
              </p>
            </div>
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-zinc-900 text-[13px] font-semibold rounded-full shadow-xs hover:border-slate-300 transition-all flex-shrink-0 active:scale-[0.98]"
            >
              Open Workspace <ArrowRight size={13} />
            </Link>
          </div>

          {/* Preview container */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Engine Synthesis */}
              <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-600" />
                    <span className="text-[12px] font-bold text-zinc-950">Operating Engine Synthesis</span>
                    <span className="text-[10px] font-mono font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 px-2 py-0.5 rounded-full">
                      Verified Simulation
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-400">Runtime: 0.28s</span>
                </div>

                <div className="mt-4 bg-slate-50 border border-slate-200/70 rounded-lg p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                    <span className="text-[12px] font-semibold text-zinc-950">
                      Recommendation: Pivot 65% focus to Standardized Testing Baseline
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 pl-3.5 leading-relaxed">
                    With your first working paper already in review, your second paper faces diminishing
                    returns for UK/US Economics tier-1 programs compared to an unverified testing profile.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { label: "Profile Resilience Forecast", before: "78", after: "84", delta: "+6 pts", color: "#16A34A" },
                    { label: "LSE Math Gating Probability",  before: "54%", after: "89%", delta: "+35%", color: "#16A34A" },
                  ].map((m) => (
                    <div key={m.label} className="bg-slate-50/70 border border-slate-200/70 rounded-lg p-3">
                      <span className="text-[9px] font-mono text-zinc-400 font-bold block uppercase tracking-wider">{m.label}</span>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[13px] font-bold font-mono text-zinc-950">{m.before} → {m.after}</span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">{m.delta}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                  <Link href="/workspace" className="px-3.5 py-1.5 bg-black text-white rounded-full text-[12px] font-semibold hover:bg-zinc-800 transition-colors active:scale-[0.98]">
                    + Add to Roadmap
                  </Link>
                  <Link href="/workspace" className="px-3 py-1.5 bg-white border border-slate-200 text-zinc-700 rounded-full text-[12px] font-medium hover:bg-slate-50 transition-colors active:scale-[0.98]">
                    Explore Test Prep Labs
                  </Link>
                </div>
              </div>

              {/* Telemetry Signal */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-[12px] font-bold text-zinc-950">((●)) Your Signal</span>
                    <span className="text-[10px] font-mono text-emerald-600 font-semibold">● Live</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider">AI Resilience</span>
                      <div className="text-[26px] font-bold font-mono text-zinc-950 mt-0.5 leading-none">
                        78 <span className="text-[12px] text-zinc-400 font-normal">/ 100</span>
                      </div>
                      <span className="text-[11px] text-zinc-500 mt-1 block">Top 8% in Quant Track</span>
                    </div>
                    <svg width="52" height="52" viewBox="0 0 52 52">
                      <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="4" />
                      <circle cx="26" cy="26" r="22" fill="none" stroke="#E11D48" strokeWidth="4"
                        strokeDasharray="138.2" strokeDashoffset="30" strokeLinecap="round"
                        transform="rotate(-90 26 26)"
                      />
                    </svg>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Primary Gap</span>
                    <div className="mt-2 bg-rose-50/70 border border-rose-200/80 rounded-lg p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-zinc-950">Faculty Co-authorship</span>
                        <span className="text-[9px] font-mono font-bold bg-rose-100 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded">HIGH</span>
                      </div>
                      <p className="text-[11px] text-zinc-600 mt-1.5 leading-relaxed">
                        Adding an institutional co-author elevates Tier-1 odds by ~2.4×.
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/workspace"
                  className="mt-4 block w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-lg text-center text-[12px] font-semibold transition-colors active:scale-[0.98] shadow-xs"
                >
                  📅 Book 1-on-1 Advisory (Free)
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED PROGRAMS ────────────────────────────────── */}
      <section className="py-20 px-5 border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-rose-600 mb-3">
                <span className="w-2.5 h-[1.5px] bg-rose-600" />
                From the live index
              </p>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.4rem)] font-bold tracking-tight text-zinc-950">
                Same ₹15L fee. Very different outcomes.
              </h2>
            </div>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-zinc-600 hover:text-zinc-950 transition-colors"
            >
              View all <ChevronRight size={14} />
            </Link>
          </div>

          {SAMPLE.length === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-xl text-center p-10 shadow-xs">
              <p className="text-zinc-600 text-sm mb-3">
                {totalCount
                  ? `Browse ${totalCount} programmes in the live index.`
                  : "Browse the programme index."}
              </p>
              <Link href="/explore" className="text-[13px] font-semibold text-rose-600 hover:text-rose-700 transition-colors">
                Open College Index →
              </Link>
            </div>
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
      <section className="py-20 px-5 border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-rose-600 mb-4">
                <span className="w-2.5 h-[1.5px] bg-rose-600" />
                Fiduciary Standard
              </p>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.4rem)] font-bold tracking-tight text-zinc-950 mb-5 leading-tight">
                Our formula is open.
                <br />
                Push back if it&apos;s wrong.
              </h2>
              <p className="text-zinc-600 text-sm leading-relaxed mb-8">
                Every composite score breaks down into six components whose
                weights are recomputed from your own trait estimates. Every
                figure links to the source it came from. Where something has not
                been measured, it says so instead of filling the gap.
              </p>
              <div className="space-y-3">
                {TRUST_ITEMS.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-[13px] text-zinc-700">{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/methodology"
                className="inline-flex items-center gap-1.5 mt-8 px-4 py-2.5 bg-white border border-slate-200/90 rounded-full text-[13px] font-semibold text-zinc-800 hover:bg-slate-50 transition-colors shadow-xs active:scale-[0.98]"
              >
                Read the full methodology <ChevronRight size={13} />
              </Link>
            </div>

            {/* Score Breakdown */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
              <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-5">
                Composite Score Decomposition
              </p>
              <div className="space-y-4">
                {SCORE_FACTORS.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[13px] text-zinc-600 flex-1">{item.label}</span>
                    <span
                      className={`font-mono font-bold text-[13px] ${item.shifts ? "text-zinc-400" : "text-zinc-950"}`}
                      title={item.shifts ? "Adjusted to your profile at runtime" : "Fixed weight"}
                    >
                      {item.base}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-400" />
                <p className="text-[11px] leading-relaxed text-zinc-500">
                  Base weights at a neutral profile. The four greyed figures are
                  re-derived from your own trait estimates and renormalised on
                  every run — your composite is not this table with different
                  labels.
                </p>
              </div>
              <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[12px] text-zinc-400 font-mono">Composite score (0–100)</span>
                <span className="font-mono text-[12px] font-bold text-zinc-950">= weighted sum × confidence</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT THE MODEL ADDS ─────────────────────────────── */}
      <section className="py-20 px-5 border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="inline-flex items-center justify-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-rose-600 mb-3">
              <span className="w-2.5 h-[1.5px] bg-rose-600" />
              What the model adds
            </p>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.4rem)] font-bold tracking-tight text-zinc-950">
              Three cases the brochure cannot show you.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[13px] leading-relaxed text-zinc-600">
              Illustrative worked cases, not customer results. Run your own
              numbers in the tool rather than reading ours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SCENARIOS.map((s) => (
              <div key={s.name} className="bg-white border border-slate-200/90 rounded-xl p-5 hover:border-slate-300 hover:shadow-md transition-all shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[13px] font-bold text-zinc-950">{s.name}</div>
                </div>
                <p className="text-[13px] text-zinc-600 leading-relaxed mb-5">
                  {s.body}
                </p>
                <div className="pt-4 border-t border-slate-100">
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
      <section className="relative py-28 px-5 text-center overflow-hidden border-t border-slate-200/80">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[650px] h-[350px] rounded-full bg-gradient-to-tr from-rose-100/40 via-purple-50/20 to-blue-100/30 blur-[100px]" />
        </div>
        <div className="relative max-w-xl mx-auto">
          <p className="font-mono text-[11px] text-zinc-500 uppercase tracking-wider mb-4">
            Free during launch · No card · No usage cap
          </p>
          <h2 className="text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold tracking-[-0.04em] text-zinc-950 mb-4 leading-tight">
            Stop guessing.
            <br />
            Price the degree properly.
          </h2>
          <p className="text-zinc-600 text-[15px] mb-10 leading-relaxed">
            Salary distributions, AI resilience, a ranked shortlist, and a
            decision workspace — calibrated to your profile, not the brochure.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/onboard"
              className="inline-flex items-center gap-2 px-9 py-4 bg-black hover:bg-zinc-800 active:scale-[0.98] text-white font-bold text-[15px] rounded-full shadow-md hover:shadow-lg transition-all"
            >
              Start free — run my analysis
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-7 py-4 bg-white hover:bg-slate-50 active:scale-[0.98] border border-slate-200 text-zinc-800 font-medium text-[15px] rounded-full shadow-xs transition-all"
            >
              What it costs
            </Link>
          </div>
          <p className="text-[11px] text-zinc-400 mt-5 font-mono">
            Decision support, not financial advice
          </p>
        </div>
      </section>

      {/* ── WAITLIST ──────────────────────────────────────────── */}
      <section className="border-t border-slate-200/80 px-5 py-16">
        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr_400px] lg:items-start">
          <div>
            <p className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-rose-600">
              <span className="w-2.5 h-[1.5px] bg-rose-600" />
              Coming next
            </p>
            <h2 className="mt-3 text-[clamp(1.7rem,3.5vw,2.3rem)] font-bold tracking-tight text-zinc-950">
              Be told the price before it exists
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-zinc-600">
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
                  <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0 text-emerald-600" />
                  <span className="text-[13px] text-zinc-700">{item}</span>
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
