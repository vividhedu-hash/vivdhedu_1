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
    color: "#30D158",
  },
  {
    name: "Rahul K.",
    class: "Engineering → Policy pivot",
    quote: "The Curiosity Domain picker revealed a 94% match with Computational Economics. The Research Matcher placed me in Ashoka's pre-uni fellowship.",
    delta: "+18 pts AI resilience",
    badge: "Comp. Economics",
    color: "#BF5AF2",
  },
];

const SCORE_FACTORS = [
  { label: "Salary vs. fee paid (PPP-adjusted)",   weight: "35%", color: "#0A84FF"  },
  { label: "Job security & placement consistency",  weight: "20%", color: "#30D158"  },
  { label: "Career ceiling at year 10",             weight: "15%", color: "#FF9F0A"  },
  { label: "Location & remote flexibility",         weight: "15%", color: "#BF5AF2"  },
  { label: "Reported satisfaction & burnout rates", weight: "10%", color: "#FF9F0A"  },
  { label: "Alumni network & lateral opportunities",weight: "5%",  color: "#E11D48"  },
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
    <div className="bg-black text-[#F5F5F7] min-h-screen">

      {/* ── SYSTEM STATUS BAR ─────────────────────────────────── */}
      <div className="border-b border-white/[0.06] bg-black/90 backdrop-blur-sm py-2 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] inline-block animate-pulse" />
            <span className="font-mono text-[11px] text-[#86868B]">
              System Online · {isLive ? "Supabase Connected" : "Calibrated Engine"} · {totalCount ? `${totalCount}` : "1,420+"} Cohorts Mapped
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-5 text-[11px] text-[#48484A] font-mono">
            <Link href="/workspace" className="hover:text-[#86868B] transition-colors flex items-center gap-1">
              <Zap size={11} className="text-[#FF9F0A]" /> Workspace Demo
            </Link>
            <span>Privacy Sovereign</span>
            <span>No Kickbacks</span>
          </div>
        </div>
      </div>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-28 px-5 text-center overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-[#E11D48]/[0.07] blur-[100px]" />
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-[11px] text-[#86868B] font-mono font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] inline-block" />
            Student Intelligence Platform · India&apos;s Sovereign Student OS
          </div>

          {/* Headline */}
          <h1 className="text-[clamp(3rem,6vw,4.8rem)] font-extrabold leading-[1.03] tracking-[-0.04em] text-[#F5F5F7] mb-6">
            Start with you.
            <br />
            <span className="text-[#86868B] font-light">Build your education OS.</span>
          </h1>

          {/* Subheading */}
          <p className="text-[17px] text-[#86868B] max-w-xl mx-auto mb-10 leading-relaxed font-light">
            3 minutes of calibration. 20-year NPV analysis, AI resilience scoring,
            and a ranked shortlist built around your exact goals.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link
              href="/onboard"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#F5F5F7] hover:bg-white text-black font-semibold text-[15px] rounded-full shadow-sm transition-all"
            >
              Get started free
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-[#F5F5F7] font-medium text-[15px] rounded-full transition-all"
            >
              Browse programs
            </Link>
          </div>

          {/* Social proof strip */}
          <div className="flex flex-wrap justify-center gap-6 text-[12px] text-[#48484A] font-mono">
            {PROOF_POINTS.map((p) => (
              <div key={p.value} className="flex items-center gap-2">
                <span className="text-[#F5F5F7] font-bold">{p.value}</span>
                <span>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACTIVE SESSION CARD ───────────────────────────────── */}
      <section className="px-5 pb-20">
        <div className="max-w-md mx-auto bg-[#0A0A0A] rounded-2xl p-5 border border-white/[0.08] hover:border-white/[0.14] transition-all shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E11D48]/10 border border-[#E11D48]/20 flex items-center justify-center text-[#E11D48]">
              <Sliders size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-[#F5F5F7]">Active Session Profile</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
              </div>
              <p className="text-[11px] text-[#86868B] font-mono mt-0.5">Undergraduate & Career Trajectory</p>
            </div>
            <span className="font-mono text-[10px] text-[#48484A]">ID: #SYS-01</span>
          </div>
        </div>
      </section>

      {/* ── WORKSPACE SHOWCASE ────────────────────────────────── */}
      <section className="py-20 px-5 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-5">
            <div>
              <p className="kicker-web mb-3">Screens 10–12 Live Architecture</p>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold tracking-tight text-[#F5F5F7] leading-tight">
                The Sovereign Student Workspace
              </h2>
              <p className="text-[#86868B] text-sm mt-2 max-w-lg leading-relaxed">
                Real-time admissions simulations, 8-dimension AI resilience radar,
                milestone velocity tracking, and strategic vector trade-offs.
              </p>
            </div>
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-[#F5F5F7] text-[13px] font-medium rounded-full transition-all flex-shrink-0"
            >
              Open Workspace <ArrowRight size={13} />
            </Link>
          </div>

          {/* Preview container */}
          <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-2xl p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Engine Synthesis */}
              <div className="lg:col-span-2 bg-[#141414] border border-white/[0.07] rounded-xl p-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-[#BF5AF2]" />
                    <span className="text-[12px] font-bold text-[#F5F5F7]">Operating Engine Synthesis</span>
                    <span className="text-[10px] font-mono font-semibold bg-[#BF5AF2]/10 text-[#BF5AF2] border border-[#BF5AF2]/20 px-2 py-0.5 rounded-full">
                      Verified Simulation
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#48484A]">Runtime: 0.28s</span>
                </div>

                <div className="mt-4 bg-black/40 border border-white/[0.06] rounded-lg p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
                    <span className="text-[12px] font-semibold text-[#F5F5F7]">
                      Recommendation: Pivot 65% focus to Standardized Testing Baseline
                    </span>
                  </div>
                  <p className="text-[11px] text-[#86868B] pl-3.5 leading-relaxed">
                    With your first working paper already in review, your second paper faces diminishing
                    returns for UK/US Economics tier-1 programs compared to an unverified testing profile.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { label: "Profile Resilience Forecast", before: "78", after: "84", delta: "+6 pts", color: "#30D158" },
                    { label: "LSE Math Gating Probability",  before: "54%", after: "89%", delta: "+35%", color: "#30D158" },
                  ].map((m) => (
                    <div key={m.label} className="bg-black/40 border border-white/[0.06] rounded-lg p-3">
                      <span className="text-[9px] font-mono text-[#48484A] font-bold block uppercase tracking-wider">{m.label}</span>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[13px] font-bold font-mono text-[#F5F5F7]">{m.before} → {m.after}</span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: `${m.color}18`, color: m.color, border: `1px solid ${m.color}30` }}>{m.delta}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.06]">
                  <Link href="/workspace" className="px-3.5 py-1.5 bg-[#F5F5F7] text-black rounded-full text-[12px] font-semibold hover:bg-white transition-colors">
                    + Add to Roadmap
                  </Link>
                  <Link href="/workspace" className="px-3 py-1.5 bg-white/[0.06] border border-white/[0.1] text-[#86868B] rounded-full text-[12px] font-medium hover:bg-white/[0.1] transition-colors">
                    Explore Test Prep Labs
                  </Link>
                </div>
              </div>

              {/* Telemetry Signal */}
              <div className="bg-[#141414] border border-white/[0.07] rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <span className="text-[12px] font-bold text-[#F5F5F7]">((●)) Your Signal</span>
                    <span className="text-[10px] font-mono text-[#30D158] font-medium">● Live</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-[#48484A] uppercase tracking-wider">AI Resilience</span>
                      <div className="text-[26px] font-bold font-mono text-[#F5F5F7] mt-0.5 leading-none">
                        78 <span className="text-[12px] text-[#48484A] font-normal">/ 100</span>
                      </div>
                      <span className="text-[11px] text-[#86868B] mt-1 block">Top 8% in Quant Track</span>
                    </div>
                    <svg width="52" height="52" viewBox="0 0 52 52">
                      <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                      <circle cx="26" cy="26" r="22" fill="none" stroke="#E11D48" strokeWidth="4"
                        strokeDasharray="138.2" strokeDashoffset="30" strokeLinecap="round"
                        transform="rotate(-90 26 26)"
                      />
                    </svg>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06]">
                    <span className="text-[9px] font-mono font-bold text-[#48484A] uppercase tracking-wider">Primary Gap</span>
                    <div className="mt-2 bg-[#E11D48]/[0.08] border border-[#E11D48]/20 rounded-lg p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-[#F5F5F7]">Faculty Co-authorship</span>
                        <span className="text-[9px] font-mono font-bold bg-[#E11D48]/20 text-[#E11D48] px-1.5 py-0.5 rounded">HIGH</span>
                      </div>
                      <p className="text-[11px] text-[#86868B] mt-1.5 leading-relaxed">
                        Adding an institutional co-author elevates Tier-1 odds by ~2.4×.
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/workspace"
                  className="mt-4 block w-full py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-[#F5F5F7] rounded-lg text-center text-[12px] font-semibold transition-colors"
                >
                  📅 Book 1-on-1 Advisory (Free)
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED PROGRAMS ────────────────────────────────── */}
      <section className="py-20 px-5 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="kicker-web mb-3">From the live index</p>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.4rem)] font-bold tracking-tight text-[#F5F5F7]">
                Same ₹15L fee. Very different outcomes.
              </h2>
            </div>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-[#86868B] hover:text-[#F5F5F7] transition-colors"
            >
              View all <ChevronRight size={14} />
            </Link>
          </div>

          {SAMPLE.length === 0 ? (
            <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl text-center p-10">
              <p className="text-[#86868B] text-sm mb-3">Explore all 1,420+ institutional programs in our live database.</p>
              <Link href="/explore" className="text-[13px] font-semibold text-[#E11D48] hover:text-[#F43F5E] transition-colors">
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
      <section className="py-20 px-5 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="kicker-web mb-4">Fiduciary Standard</p>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.4rem)] font-bold tracking-tight text-[#F5F5F7] mb-5 leading-tight">
                Our formula is open.
                <br />
                Push back if it&apos;s wrong.
              </h2>
              <p className="text-[#86868B] text-sm leading-relaxed mb-8">
                Every composite score breaks down into six components with public weights. Every placement
                statistic links to government audit filings. Zero dark patterns, zero agency commissions.
              </p>
              <div className="space-y-3">
                {TRUST_ITEMS.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-[#30D158] flex-shrink-0 mt-0.5" />
                    <span className="text-[13px] text-[#86868B]">{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/methodology"
                className="inline-flex items-center gap-1.5 mt-8 px-4 py-2.5 border border-white/[0.1] rounded-full text-[13px] font-medium text-[#F5F5F7] hover:bg-white/[0.06] transition-colors"
              >
                Read the full methodology <ChevronRight size={13} />
              </Link>
            </div>

            {/* Score Breakdown */}
            <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-2xl p-6">
              <p className="text-[10px] font-mono font-bold text-[#48484A] uppercase tracking-wider mb-5">
                Composite Score Decomposition
              </p>
              <div className="space-y-4">
                {SCORE_FACTORS.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[13px] text-[#86868B] flex-1">{item.label}</span>
                    <span className="font-mono font-bold text-[13px] text-[#F5F5F7]">{item.weight}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[12px] text-[#48484A] font-mono">Composite score (0–100)</span>
                <span className="font-mono text-[12px] font-bold text-[#F5F5F7]">= weighted sum</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STUDENT OUTCOMES ─────────────────────────────────── */}
      <section className="py-20 px-5 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="kicker-web justify-center mb-3">Student Outcomes</p>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.4rem)] font-bold tracking-tight text-[#F5F5F7]">
              Numbers changed the decision.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SOCIAL_PROOF.map((s) => (
              <div key={s.name} className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-5 hover:border-white/[0.14] transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[13px] font-bold text-[#F5F5F7]">{s.name}</div>
                    <div className="text-[11px] text-[#86868B] font-mono">{s.class}</div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-white/[0.05] text-[#86868B] border border-white/[0.08]">
                    {s.badge}
                  </span>
                </div>
                <p className="text-[13px] text-[#86868B] italic leading-relaxed mb-5">
                  &quot;{s.quote}&quot;
                </p>
                <div className="pt-4 border-t border-white/[0.06]">
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
      <section className="relative py-28 px-5 text-center overflow-hidden border-t border-white/[0.06]">
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[#E11D48]/[0.06] blur-[80px]" />
        </div>
        <div className="relative max-w-xl mx-auto">
          <p className="font-mono text-[11px] text-[#48484A] uppercase tracking-wider mb-4">
            Free · No login required · Starts in 90 seconds
          </p>
          <h2 className="text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold tracking-[-0.04em] text-[#F5F5F7] mb-4 leading-tight">
            Stop guessing.
            <br />
            Build your Student OS.
          </h2>
          <p className="text-[#86868B] text-[15px] mb-10 leading-relaxed">
            Salary projections, AI resilience score, ranked shortlist, and a decision workspace —
            calibrated to your exact profile.
          </p>
          <Link
            href="/onboard"
            className="inline-flex items-center gap-2 px-9 py-4 bg-[#F5F5F7] hover:bg-white text-black font-bold text-[15px] rounded-full shadow-sm transition-all"
          >
            Start free — Build my OS
            <ArrowRight size={15} />
          </Link>
          <p className="text-[11px] text-[#48484A] mt-5 font-mono">
            Direct calibration · Complete sovereign privacy
          </p>
        </div>
      </section>

    </div>
  );
}
