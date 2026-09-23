import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, Shield, CheckCircle2,
  TrendingUp, Brain, Zap, BarChart2,
  Sparkles, Compass, ChevronRight, Sliders,
} from "lucide-react";
import { CollegeCard } from "@/components/CollegeCard";
import { fetchCollegeList } from "../lib/live-colleges";

export const metadata: Metadata = {
  title: "IndiaLens · Your Student OS — Education Intelligence Platform",
  description:
    "India's sovereign student operating system. 20-year NPV, IRT psychometrics, AI resilience scoring, and real-time admissions simulations.",
};

const PROOF_POINTS = [
  { value: "1,420+", label: "Institutional cohorts" },
  { value: "10,000", label: "Monte Carlo paths / degree" },
  { value: "3PL IRT", label: "Adaptive psychometric engine" },
  { value: "<50ms",  label: "Simulation latency" },
];

const TRUST_ITEMS = [
  "Six composite factors — all publicly weighted",
  "Salaries shown as P10–P75 distributions, not averages",
  "NIRF audit hash on every college profile",
  "Zero agency commissions or kickbacks",
  "Faculty and alumni can flag anomalies directly",
  "IRT posterior standard error shown on every result",
];

const SOCIAL_PROOF = [
  {
    name: "Alex M.",
    class: "Class 11–12 · Quantitative",
    quote: "The Decision Engine flagged my co-authorship gap and shifted my focus to SAT Math 720+ gating. Admittance probability jumped from 54% to 89%.",
    delta: "+35% admittance odds",
    badge: "Tier-1 Economics",
    color: "#E11D48",
  },
  {
    name: "Priya M.",
    class: "B.Com → CA / Quant route",
    quote: "IndiaLens calculated the 20-year NPV delta between CA and CFA+MBA, plus debt stress at realistic placement. The numbers made the decision for me.",
    delta: "₹4.2L annual savings",
    badge: "Finance & Advisory",
    color: "#16A34A",
  },
  {
    name: "Rahul K.",
    class: "Engineering → Policy pivot",
    quote: "The Curiosity Domain picker revealed a 94% match with Computational Economics. The Research Matcher placed me in Ashoka's pre-uni fellowship.",
    delta: "+18 pts AI resilience",
    badge: "Comp. Economics",
    color: "#9333EA",
  },
];

const SCORE_FACTORS = [
  { label: "Salary vs. fee paid (PPP-adjusted)",   weight: "35%", color: "#2563EB" },
  { label: "Job security & placement consistency",  weight: "20%", color: "#16A34A" },
  { label: "Career ceiling at year 10",             weight: "15%", color: "#D97706" },
  { label: "Location & remote flexibility",         weight: "15%", color: "#9333EA" },
  { label: "Reported satisfaction & burnout rates", weight: "10%", color: "#EA580C" },
  { label: "Alumni network & lateral opportunities",weight: "5%",  color: "#E11D48" },
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

      {/* ── SYSTEM STATUS BAR ─────────────────────────────────── */}
      <div className="border-b border-slate-200/80 bg-white/70 backdrop-blur-md py-2 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="font-mono text-[11px] text-zinc-500">
              System Online · {isLive ? "Supabase Connected" : "Calibrated Engine"} · {totalCount ? `${totalCount}` : "1,420+"} Cohorts Mapped
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-5 text-[11px] text-zinc-400 font-mono">
            <Link href="/workspace" className="hover:text-zinc-800 transition-colors flex items-center gap-1 text-zinc-500">
              <Zap size={11} className="text-amber-500" /> Workspace Demo
            </Link>
            <span>Privacy Sovereign</span>
            <span>No Kickbacks</span>
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
            Student Intelligence Platform · India&apos;s Sovereign Student OS
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

          {/* Social proof strip */}
          <div className="flex flex-wrap justify-center gap-6 text-[12px] text-zinc-500 font-mono">
            {PROOF_POINTS.map((p) => (
              <div key={p.value} className="flex items-center gap-2">
                <span className="text-zinc-950 font-bold">{p.value}</span>
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
              <p className="text-zinc-600 text-sm mb-3">Explore all 1,420+ institutional programs in our live database.</p>
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
                Every composite score breaks down into six components with public weights. Every placement
                statistic links to government audit filings. Zero dark patterns, zero agency commissions.
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
                    <span className="font-mono font-bold text-[13px] text-zinc-950">{item.weight}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[12px] text-zinc-400 font-mono">Composite score (0–100)</span>
                <span className="font-mono text-[12px] font-bold text-zinc-950">= weighted sum</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STUDENT OUTCOMES ─────────────────────────────────── */}
      <section className="py-20 px-5 border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="inline-flex items-center justify-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-rose-600 mb-3">
              <span className="w-2.5 h-[1.5px] bg-rose-600" />
              Student Outcomes
            </p>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.4rem)] font-bold tracking-tight text-zinc-950">
              Numbers changed the decision.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SOCIAL_PROOF.map((s) => (
              <div key={s.name} className="bg-white border border-slate-200/90 rounded-xl p-5 hover:border-slate-300 hover:shadow-md transition-all shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[13px] font-bold text-zinc-950">{s.name}</div>
                    <div className="text-[11px] text-zinc-500 font-mono">{s.class}</div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-zinc-700 border border-slate-200">
                    {s.badge}
                  </span>
                </div>
                <p className="text-[13px] text-zinc-600 italic leading-relaxed mb-5">
                  &quot;{s.quote}&quot;
                </p>
                <div className="pt-4 border-t border-slate-100">
                  <span
                    className="text-[13px] font-mono font-bold"
                    style={{ color: s.color }}
                  >
                    {s.delta}
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
            Free · No login required · Starts in 90 seconds
          </p>
          <h2 className="text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold tracking-[-0.04em] text-zinc-950 mb-4 leading-tight">
            Stop guessing.
            <br />
            Build your Student OS.
          </h2>
          <p className="text-zinc-600 text-[15px] mb-10 leading-relaxed">
            Salary projections, AI resilience score, ranked shortlist, and a decision workspace —
            calibrated to your exact profile.
          </p>
          <Link
            href="/onboard"
            className="inline-flex items-center gap-2 px-9 py-4 bg-black hover:bg-zinc-800 active:scale-[0.98] text-white font-bold text-[15px] rounded-full shadow-md hover:shadow-lg transition-all"
          >
            Start free — Build my OS
            <ArrowRight size={15} />
          </Link>
          <p className="text-[11px] text-zinc-400 mt-5 font-mono">
            Direct calibration · Complete sovereign privacy
          </p>
        </div>
      </section>

    </div>
  );
}
