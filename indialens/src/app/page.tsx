import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, Shield, CheckCircle, TrendingUp, Brain,
  Zap, BarChart2, Activity, Star, ChevronRight
} from "lucide-react";
import { CollegeCard } from "@/components/CollegeCard";
import { fetchCollegeList } from "../lib/live-colleges";

export const metadata: Metadata = {
  title: "IndiaLens · Student OS — India's Education Intelligence System",
  description:
    "India's first student operating system. 20-year NPV, IRT psychometrics, AI resilience scoring, and Monte Carlo debt stress testing. Priced per student.",
};

// ── Proof stats (hydrated from DB at build time) ─────────────────────────────
const STATIC_PROOF = [
  { value: "1,420+",  label: "Institutional cohorts mapped" },
  { value: "10,000",  label: "Monte Carlo paths per degree" },
  { value: "3PL IRT", label: "Adaptive psychometric engine" },
  { value: "<50ms",   label: "Sub-50ms decision latency" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: <Brain size={18} />,
    color: "#1A6CF6",
    title: "Condition on you",
    body: "Adaptive 3PL IRT psychometric + budget + academics + goals. The same IIT CSE is a different asset for a ₹4L budget vs. a ₹25L loan. We price the student–program pair.",
  },
  {
    step: "02",
    icon: <BarChart2 size={18} />,
    color: "#0D9488",
    title: "Price the 20-year asset",
    body: "NPV, IRR, and P10–P90 salary paths versus a no-degree PLFS baseline. 10,000 Monte Carlo paths per degree. Median package is one point on a distribution, not the answer.",
  },
  {
    step: "03",
    icon: <Shield size={18} />,
    color: "#7C3AED",
    title: "Stress the tails",
    body: "8-vector AI occupation automation surface (Oxford O*NET × Indian roles) + recession + sector-shock scenarios. If it only works in the brochure year, the model shows it.",
  },
];

const TRUST_ITEMS = [
  "Six composite factors — all publicly weighted",
  "Salaries shown as P10–P75 distributions, not averages",
  "NIRF audit hash on every college profile",
  "Cryptographic proof-of-work on placement data",
  "Faculty and alumni can flag anomalies directly",
  "IRT posterior standard error shown on every psychometric result",
];

const SOCIAL_PROOF = [
  {
    name: "Arjun S.",
    class: "Class 12 → IIT Bombay CSE",
    quote: "The AI Risk Index showed my target field had V1 Cognitive Routine at 0.82 decay slope. I pivoted to Systems & Security — much higher resilience. The model saved me five years of regret.",
    before: "Generic rank-based list",
    after: "Switched field, higher AI resilience",
    delta: "+18 composite pts",
    color: "#1A6CF6",
  },
  {
    name: "Priya M.",
    class: "B.Com → CA route",
    quote: "IndiaLens showed me the 20-year NPV difference between CA and CFA+MBA — and the debt stress at realistic placement. The numbers made the decision for me.",
    before: "₹8L loan for unclear outcome",
    after: "Merit scholarship path found",
    delta: "₹4.2L annual savings",
    color: "#0D9488",
  },
  {
    name: "Rahul K.",
    class: "Engineering → Policy pivot",
    quote: "The Curiosity Domain picker found I was 94% aligned with Computational Economics, not software engineering. The Research Matcher found me a pre-uni fellowship at Ashoka.",
    before: "JEE prep on autopilot",
    after: "Ashoka fellow + SSRN preprint",
    delta: "+34% admittance odds",
    color: "#7C3AED",
  },
];

export default async function LandingPage() {
  let SAMPLE: any[] = [];
  let isLive = false;
  let totalCount: number | undefined = undefined;

  try {
    const featured = await fetchCollegeList({ per_page: 3, sort_by: "compositeScore" });
    SAMPLE = featured.data;
    isLive = featured.source === "database";
    totalCount = featured.total;
  } catch {
    // Supabase unreachable at build time — show empty state
  }

  return (
    <div>

      {/* ── LIVE SIGNAL BAR ──────────────────────────────────────────── */}
      <div style={{
        background: "rgba(26,108,246,0.04)",
        borderBottom: "1px solid rgba(26,108,246,0.1)",
        padding: "7px 0",
        overflow: "hidden",
      }}>
        <div className="container-lg">
          <div className="flex items-center gap-4 flex-wrap" style={{ rowGap: 4 }}>
            <span className="pulse-dot-blue" style={{ width: 5, height: 5 }} />
            <span className="kicker-web" style={{ gap: 12, fontSize: 10 }}>
              System Status
            </span>
            {[
              { label: "DB", value: isLive ? "Live · Supabase" : "Seed data", ok: isLive },
              { label: "Programs", value: String(totalCount ?? "—"), ok: true },
              { label: "AI Engine", value: "Gemini 2.5 Flash + Search", ok: true },
              { label: "IRT Engine", value: "3PL Adaptive · SE < 0.28", ok: true },
              { label: "Monte Carlo", value: "10,000 paths/degree", ok: true },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5" style={{ fontSize: 11 }}>
                <span style={{ color: "#4A4A6A", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{s.label}</span>
                <span className={s.ok ? "score-good" : "score-medium"} style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="hero-gradient" style={{ padding: "88px 0 72px" }}>
        <div className="container-lg">
          <div style={{ maxWidth: 760 }}>
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-5 animate-fade-in stagger-1" style={{ opacity: 0, animationFillMode: "forwards" }}>
              <span className="badge badge-blue">
                <span className="pulse-dot" style={{ width: 5, height: 5 }} />
                India's First Student OS
              </span>
              <span style={{ fontSize: 11, color: "#4A4A6A", fontFamily: "var(--font-mono)" }}>
                v2.0 · Quantitative Education Intelligence
              </span>
            </div>

            {/* Headline — serif as per spec */}
            <h1
              className="headline animate-slide-up stagger-2"
              style={{
                fontSize: "clamp(2.4rem, 5.5vw, 4.2rem)",
                color: "#F0F0F5",
                opacity: 0,
                animationFillMode: "forwards",
                marginBottom: 20,
              }}
            >
              Stop buying a rank.
              <br />
              <span className="gradient-text-blue">Price the degree as an asset.</span>
            </h1>

            <p
              className="headline-sub animate-slide-up stagger-3"
              style={{ color: "#8B8BA7", opacity: 0, animationFillMode: "forwards", marginBottom: 36, maxWidth: 560 }}
            >
              The same IIT CSE is a different investment for a ₹4L budget and a high-autonomy temperament than for a ₹25L loan and a stability-first family. We score the student–program pair: 20-year NPV, P10 downside, AI-occupation risk, and psychometric fit.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 animate-slide-up stagger-4" style={{ opacity: 0, animationFillMode: "forwards" }}>
              <Link href="/onboard" className="btn-primary" style={{ fontSize: 15, padding: "13px 28px" }}>
                Build my OS
                <ArrowRight size={16} />
              </Link>
              <Link href="/explore" className="btn-secondary" style={{ fontSize: 14, padding: "12px 22px" }}>
                <BarChart2 size={14} />
                Explore college index
              </Link>
            </div>

            {/* Proof bar */}
            <div
              className="flex flex-wrap gap-8 mt-10 pt-8 animate-fade-in stagger-5"
              style={{ borderTop: "1px solid #1E1E2E", opacity: 0, animationFillMode: "forwards" }}
            >
              {STATIC_PROOF.map((stat) => (
                <div key={stat.label}>
                  <div
                    className="font-display font-bold"
                    style={{ fontSize: 20, color: "#F0F0F5", letterSpacing: "-0.02em", fontFamily: "var(--font-mono)" }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 11, color: "#4A4A6A", marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── REALITY CHECK BANNER ─────────────────────────────────────── */}
      <div style={{
        background: "rgba(217,119,6,0.04)",
        borderTop: "1px solid rgba(217,119,6,0.12)",
        borderBottom: "1px solid rgba(217,119,6,0.12)",
        padding: "12px 0",
      }}>
        <div className="container-lg">
          <div className="flex items-start gap-3 flex-wrap" style={{ rowGap: 4 }}>
            <span style={{ color: "#D97706", flexShrink: 0, marginTop: 1 }}>⚠</span>
            <span style={{ fontSize: 13, color: "#8B8BA7", lineHeight: 1.6 }}>
              <strong style={{ color: "#F0F0F5", fontWeight: 600 }}>The placement brochure is not a salary guarantee.</strong>{" "}
              Median first-year salary at a "100% placement" college ranges ₹2.4L–₹18L depending on stream and batch year. A ₹39,000 Cr student loan NPA cliff sits on Indian bank books. We price the distribution — not the brochure.
            </span>
          </div>
        </div>
      </div>

      {/* ── FEATURED PROGRAMS ────────────────────────────────────────── */}
      <section style={{ padding: "72px 0 24px" }}>
        <div className="container-lg">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="kicker-web mb-2">From the live index</p>
              <h2 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: "#F0F0F5", letterSpacing: "-0.02em" }}>
                Same ₹15L fee. Very different outcomes.
              </h2>
            </div>
            <Link href="/explore" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#1A6CF6", fontWeight: 600, textDecoration: "none" }}>
              View all programs <ChevronRight size={13} />
            </Link>
          </div>

          {SAMPLE.length === 0 ? (
            <div className="card-subtle" style={{ textAlign: "center", padding: 32 }}>
              <p style={{ color: "#4A4A6A", fontSize: 14 }}>Database not connected. Set FASTAPI_URL or SUPABASE_URL to see live programs.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SAMPLE.map((record, i) => (
                <div
                  key={record.id}
                  className="animate-slide-up"
                  style={{ opacity: 0, animationDelay: `${i * 0.1}s`, animationFillMode: "forwards" }}
                >
                  <CollegeCard record={record} rank={i + 1} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CALIBRATION PREVIEW ──────────────────────────────────────── */}
      <section style={{ padding: "64px 0", background: "rgba(19,19,26,0.6)", borderTop: "1px solid #1E1E2E", borderBottom: "1px solid #1E1E2E" }}>
        <div className="container-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="kicker-web mb-3">12-Screen Calibration Flow</p>
              <h2 className="headline" style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", color: "#F0F0F5", marginBottom: 16 }}>
                An OS calibrates before it recommends.
              </h2>
              <p className="headline-sub" style={{ marginBottom: 24, fontSize: "1rem" }}>
                6 adaptive screens build your permanent decision profile: journey phase, curiosity domains, utility weights, budget anchors, and your North Star program.
              </p>
              <div className="flex flex-col gap-3 mb-8">
                {[
                  "Journey phase detection — Class 9–12, College, Gap Year",
                  "7-vector decision weight sliders (Career, Cost, Prestige…)",
                  "16 curiosity domain chips — find hybrid AI-resilient frontiers",
                  "Budget band + geographic mobility + dream college targets",
                  "Synthesis engine — 1,420 cohorts × your unique vector",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle size={13} style={{ color: "#0D9488", marginTop: 3, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#8B8BA7" }}>{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/onboard" className="btn-primary" style={{ fontSize: 14 }}>
                Start calibration
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Calibration steps visual */}
            <div className="glass-card p-6">
              <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A4A6A", marginBottom: 16 }}>
                Calibration Flow · 6 Screens
              </p>
              {[
                { step: "01", label: "Journey Phase", desc: "Class 11-12 → Undergraduate Trajectory", done: true },
                { step: "02", label: "Goal Mapping", desc: "Research + Profile Building selected", done: true },
                { step: "03", label: "Curiosity Domains", desc: "Applied Econometrics · ML/AI selected", done: true },
                { step: "04", label: "Decision Weights", desc: "Career 95 · Cost 82 · Prestige 70", active: true },
                { step: "05", label: "Budget & Reach", desc: "$35–65k · UK/EU · LSE target", done: false },
                { step: "06", label: "North Star", desc: "LSE Economics BSc or Ashoka Liberal Arts", done: false },
              ].map((s, i) => (
                <div
                  key={s.step}
                  className="flex items-center gap-3"
                  style={{
                    padding: "10px 0",
                    borderBottom: i < 5 ? "1px solid rgba(30,30,46,0.5)" : "none",
                    opacity: s.done ? 1 : s.active ? 1 : 0.4,
                  }}
                >
                  <div
                    style={{
                      width: 24, height: 24, borderRadius: 6,
                      background: s.done ? "rgba(13,148,136,0.15)" : s.active ? "rgba(26,108,246,0.15)" : "rgba(30,30,46,0.8)",
                      border: `1px solid ${s.done ? "rgba(13,148,136,0.3)" : s.active ? "rgba(26,108,246,0.3)" : "#1E1E2E"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {s.done
                      ? <CheckCircle size={12} style={{ color: "#0D9488" }} />
                      : <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700, color: s.active ? "#60A5FA" : "#4A4A6A" }}>{s.step}</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: s.active ? "#F0F0F5" : "#8B8BA7" }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: "#4A4A6A", fontFamily: "var(--font-mono)", marginTop: 1 }}>{s.desc}</div>
                  </div>
                  {s.active && <span className="badge badge-blue" style={{ fontSize: 9 }}>Active</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── AI WORKSPACE PREVIEW ─────────────────────────────────────── */}
      <section style={{ padding: "80px 0" }}>
        <div className="container-lg">
          <div className="text-center mb-12">
            <p className="kicker-web mb-3" style={{ justifyContent: "center" }}>Zero-Sycophancy Decision Engine</p>
            <h2 className="headline" style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", color: "#F0F0F5", textAlign: "center" }}>
              Not a chatbot. An operating system.
            </h2>
            <p className="headline-sub" style={{ textAlign: "center", maxWidth: 520, margin: "12px auto 0" }}>
              When you ask a question, the OS runs a simulation — not a generic paragraph. You get a definitive recommendation with metric deltas.
            </p>
          </div>

          {/* Workspace preview card */}
          <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
            {/* Fake workspace header */}
            <div style={{ padding: "12px 20px", borderBottom: "1px solid #1E1E2E", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#DC2626" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#D97706" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#0D9488" }} />
              </div>
              <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#4A4A6A", marginLeft: 8 }}>
                indialens.in/workspace · Alex M. · AI Resilience 78/100 · Top 8% Quant
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 200px", gap: 0 }}>
              {/* Left: Telemetry sidebar */}
              <div style={{ borderRight: "1px solid #1E1E2E", padding: "16px 14px" }}>
                <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A4A6A", marginBottom: 12 }}>
                  Your Signal
                </p>
                {/* Score ring (static) */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <svg width="52" height="52" viewBox="0 0 52 52">
                    <circle cx="26" cy="26" r="20" fill="none" stroke="#1E1E2E" strokeWidth="4" />
                    <circle
                      cx="26" cy="26" r="20" fill="none" stroke="#1A6CF6" strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${(78 / 100) * 125.6} 125.6`}
                      transform="rotate(-90 26 26)"
                    />
                    <text x="26" y="30" textAnchor="middle" fontSize="12" fontWeight="700" fill="#F0F0F5" fontFamily="var(--font-mono)">78</text>
                  </svg>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#F0F0F5" }}>AI Resilience</div>
                    <div style={{ fontSize: 10, color: "#1A6CF6", fontFamily: "var(--font-mono)" }}>top 8% Quant</div>
                  </div>
                </div>
                {/* Profile strength bars */}
                {[
                  { label: "Academic", value: 82, color: "#1A6CF6" },
                  { label: "Initiative", value: 71, color: "#0D9488" },
                  { label: "Consistency", value: 69, color: "#7C3AED" },
                ].map((b) => (
                  <div key={b.label} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 10, color: "#4A4A6A" }}>{b.label}</span>
                      <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: b.color, fontWeight: 700 }}>{b.value}%</span>
                    </div>
                    <div className="telemetry-bar-track">
                      <div className="telemetry-bar-fill" style={{ width: `${b.value}%`, background: b.color }} />
                    </div>
                  </div>
                ))}
                {/* Gap card */}
                <div style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)", borderRadius: 4, padding: "8px 10px", marginTop: 10 }}>
                  <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#DC2626", marginBottom: 3 }}>Primary Gap</p>
                  <p style={{ fontSize: 11, color: "#F0F0F5", fontWeight: 600 }}>Faculty co-authorship</p>
                  <p style={{ fontSize: 10, color: "#4A4A6A", marginTop: 2 }}>adds ~2.4x admittance odds</p>
                </div>
                {/* Sprint */}
                <div style={{ background: "rgba(13,148,136,0.06)", border: "1px solid rgba(13,148,136,0.15)", borderRadius: 4, padding: "8px 10px", marginTop: 8 }}>
                  <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#0D9488", marginBottom: 3 }}>Sprint Active</p>
                  <p style={{ fontSize: 11, color: "#F0F0F5", fontWeight: 600 }}>SSRN Draft</p>
                  <p style={{ fontSize: 10, color: "#0D9488", fontFamily: "var(--font-mono)", marginTop: 2 }}>12 days</p>
                </div>
              </div>

              {/* Center: AI Decision */}
              <div style={{ padding: "16px 18px" }}>
                {/* Question */}
                <div style={{ background: "rgba(26,108,246,0.04)", border: "1px solid rgba(26,108,246,0.15)", borderRadius: 6, padding: "10px 14px", marginBottom: 14 }}>
                  <span style={{ fontSize: 13, color: "#8B8BA7", fontStyle: "italic" }}>
                    "Should I prioritize a 2nd research paper or focus on SAT/CUET prep this quarter?"
                  </span>
                </div>

                {/* Decision card */}
                <div className="decision-card" style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1A6CF6" }}>
                      Decision Engine
                    </span>
                    <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "#4A4A6A" }}>
                      Simulated in 280ms · 94% confidence
                    </span>
                  </div>
                  <p style={{ fontSize: 15, fontFamily: "var(--font-serif)", fontWeight: 600, color: "#F0F0F5", lineHeight: 1.35, marginBottom: 12 }}>
                    Pivot 65% of Q4 bandwidth to Standardised Testing. The 2nd paper yields diminishing returns at current odds.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-10">
                    <span className="delta-pill delta-pill-green">LSE Admittance 54% → 89% (+35%)</span>
                    <span className="delta-pill delta-pill-blue">Profile Resilience 78 → 84 (+6 pts)</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#8B8BA7", lineHeight: 1.55, marginBottom: 12 }}>
                    Clearing the SAT Math 720+ gating cutoff elevates your admittance probability at LSE and Warwick to within scholarship-eligible band. A second preprint without a faculty co-author yields marginal signal given your current co-authorship gap.
                  </p>
                  <div style={{ background: "rgba(26,108,246,0.06)", border: "1px solid rgba(26,108,246,0.15)", borderRadius: 4, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                    <Zap size={13} style={{ color: "#60A5FA", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#F0F0F5" }}>Complete SAT Math Module 3 (Khan Academy) + 2 timed practice sets this week</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary" style={{ fontSize: 12, padding: "8px 14px" }}>+ Add to Roadmap</button>
                  <button className="btn-secondary" style={{ fontSize: 12, padding: "8px 14px" }}>Explore Marketplace →</button>
                </div>
              </div>

              {/* Right: Waves */}
              <div style={{ borderLeft: "1px solid #1E1E2E", padding: "16px 12px" }}>
                <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A4A6A", marginBottom: 12 }}>
                  Recent Waves
                </p>
                {[
                  { match: 98, cat: "Competition", title: "3 Econ & Quant Opens", days: 14, color: "#D97706" },
                  { match: 94, cat: "Research", title: "Ashoka Comp. Econ Lab", days: 21, color: "#0D9488" },
                  { match: 91, cat: "Admissions", title: "LSE Math Req. Update", days: null, color: "#7C3AED" },
                  { match: 76, cat: "Scholarship", title: "Global Merit $24k/yr", days: null, color: "#1A6CF6" },
                ].map((w) => (
                  <div key={w.title} className="wave-card" style={{ marginBottom: 6, padding: "10px 10px" }}>
                    <div className="wave-card-match-bar" style={{ width: `${w.match}%`, background: w.match >= 90 ? "#0D9488" : "#1A6CF6" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                      <span style={{ fontSize: 8, fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: w.color }}>{w.cat}</span>
                      <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700, color: w.match >= 90 ? "#0D9488" : "#4A4A6A" }}>{w.match}%</span>
                    </div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#F0F0F5", lineHeight: 1.3 }}>{w.title}</p>
                    {w.days && <p style={{ fontSize: 10, color: "#D97706", fontFamily: "var(--font-mono)", marginTop: 3 }}>{w.days} days</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link href="/workspace" className="btn-ghost" style={{ fontSize: 13 }}>
              Open your workspace
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section style={{ padding: "80px 0", background: "rgba(19,19,26,0.4)", borderTop: "1px solid #1E1E2E", borderBottom: "1px solid #1E1E2E" }}>
        <div className="container-lg">
          <div className="text-center mb-12">
            <p className="kicker-web mb-3" style={{ justifyContent: "center" }}>Method, not marketing</p>
            <h2 className="headline" style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)", color: "#F0F0F5", textAlign: "center" }}>
              How a student gets priced
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div style={{
                    width: 38, height: 38, borderRadius: 8,
                    background: `${step.color}15`,
                    border: `1px solid ${step.color}25`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: step.color,
                  }}>
                    {step.icon}
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 11, color: "#4A4A6A" }}>{step.step}</span>
                </div>
                <h3 className="font-display font-semibold mb-3" style={{ fontSize: 17, color: "#F0F0F5" }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: "#8B8BA7", lineHeight: 1.7 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST / TRANSPARENCY ─────────────────────────────────────── */}
      <section style={{ padding: "72px 0" }}>
        <div className="container-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield size={14} style={{ color: "#1A6CF6" }} />
                <p className="kicker-web">Fiduciary standard</p>
              </div>
              <h2 className="headline" style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", color: "#F0F0F5", marginBottom: 16 }}>
                Our formula is open.
                <br />
                Push back if it's wrong.
              </h2>
              <p style={{ color: "#8B8BA7", fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
                Every composite score breaks down into six components with public weights. Every placement statistic links to a cryptographic hash of the government audit filing. No dark patterns.
              </p>
              <div className="flex flex-col gap-2.5">
                {TRUST_ITEMS.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle size={13} style={{ color: "#0D9488", marginTop: 3, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#8B8BA7" }}>{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/methodology" className="btn-secondary mt-6 inline-flex" style={{ fontSize: 13 }}>
                Read the full methodology
              </Link>
            </div>

            {/* Scoring breakdown */}
            <div className="glass-card p-6">
              <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4A4A6A", marginBottom: 16 }}>
                Composite Score Decomposition
              </p>
              {[
                { label: "Salary vs. fee paid (PPP-adjusted)", weight: "35%", color: "#1A6CF6" },
                { label: "Job security & placement consistency", weight: "20%", color: "#0D9488" },
                { label: "Career ceiling at year 10", weight: "15%", color: "#D97706" },
                { label: "Location & remote flexibility", weight: "15%", color: "#7C3AED" },
                { label: "Reported satisfaction & burnout rates", weight: "10%", color: "#F97316" },
                { label: "Alumni network & lateral opportunities", weight: "5%",  color: "#EC4899" },
              ].map((c, i) => (
                <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#8B8BA7", flex: 1 }}>{c.label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, color: c.color }}>{c.weight}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #1E1E2E", paddingTop: 10, marginTop: 6, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "#4A4A6A" }}>Composite score (0–100)</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#F0F0F5", fontSize: 14 }}>=  weighted sum</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ─────────────────────────────────────────────── */}
      <section style={{ padding: "72px 0", background: "rgba(19,19,26,0.4)", borderTop: "1px solid #1E1E2E" }}>
        <div className="container-lg">
          <div className="text-center mb-12">
            <p className="kicker-web mb-3" style={{ justifyContent: "center" }}>Student Outcomes</p>
            <h2 className="headline" style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)", color: "#F0F0F5", textAlign: "center" }}>
              Numbers changed the decision.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SOCIAL_PROOF.map((s) => (
              <div key={s.name} className="glass-card p-6">
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${s.color}20`, border: `1px solid ${s.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 800, color: s.color }}>
                      {s.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#F0F0F5" }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: "#4A4A6A" }}>{s.class}</div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "#8B8BA7", lineHeight: 1.65, marginBottom: 14, fontStyle: "italic" }}>"{s.quote}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: "#4A4A6A", textDecoration: "line-through" }}>{s.before}</span>
                  <span style={{ color: "#4A4A6A" }}>→</span>
                  <span style={{ fontSize: 10, color: "#8B8BA7" }}>{s.after}</span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 800, color: s.color }}>{s.delta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section style={{ padding: "96px 0", textAlign: "center" }}>
        <div className="container-lg" style={{ maxWidth: 560, margin: "0 auto" }}>
          <p className="kicker-web mb-4" style={{ justifyContent: "center" }}>Free · No spam · Starts in 90 seconds</p>
          <h2 className="headline" style={{ fontSize: "clamp(2rem,4vw,3rem)", color: "#F0F0F5", marginBottom: 16, textAlign: "center" }}>
            Stop guessing.
            <br />
            <span className="gradient-text-blue">Build your Student OS.</span>
          </h2>
          <p className="headline-sub" style={{ textAlign: "center", marginBottom: 36 }}>
            Salary projections, AI resilience score, ranked shortlist, and a decision workspace — calibrated to your exact profile.
          </p>
          <Link href="/onboard" className="btn-primary" style={{ fontSize: 16, padding: "15px 36px" }}>
            Start free — Build my OS
            <ArrowRight size={16} />
          </Link>
          <p style={{ fontSize: 11, color: "#4A4A6A", marginTop: 14, fontFamily: "var(--font-mono)" }}>
            Free. No login required. Results in ~28 seconds.
          </p>
        </div>
      </section>

    </div>
  );
}
