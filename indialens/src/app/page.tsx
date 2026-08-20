import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart2,
  Brain,
  Shield,
  TrendingUp,
  Database,
  Cpu,
  ChevronRight,
  CheckCircle,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { CollegeCard } from "@/components/CollegeCard";
import { fetchCollegeList } from "../lib/live-colleges";

export const metadata: Metadata = {
  title: "IndiaLens — Does your degree actually pay off?",
  description:
    "Salary data, placement rates, and 20-year career projections for every major Indian college and degree. No opinion. Just numbers.",
};

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "We pull from 12 sources",
    desc: "NIRF, AmbitionBox, Naukri, Glassdoor India, PLFS, World Bank — scraped fresh every week. Reddit salary threads included.",
    icon: <Database size={20} />,
  },
  {
    step: "02",
    title: "We run the numbers",
    desc: "Six variables weighted against each other: salary, job security, career ceiling, flexibility, satisfaction, and alumni network.",
    icon: <Cpu size={20} />,
  },
  {
    step: "03",
    title: "You see everything",
    desc: "Every score shows its source. Every salary range shows where it came from. No hidden formula.",
    icon: <Brain size={20} />,
  },
];

export default async function LandingPage() {
  const featured = await fetchCollegeList({ per_page: 3, sort_by: "compositeScore" });
  const SAMPLE_COMPARISON = featured.data;
  const isLive = featured.source === "database";

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="hero-gradient" style={{ padding: "80px 0 64px" }}>
        <div className="container-lg">
          <div style={{ maxWidth: 720 }}>
            {/* Eyebrow */}
            <div
              className="flex items-center gap-2 mb-6 animate-fade-in"
              style={{ opacity: 0, animationFillMode: "forwards" }}
            >
              <span className={isLive ? "badge badge-blue" : "badge badge-yellow"}>
                <span className="pulse-dot" style={{ width: 5, height: 5 }} />
                {isLive ? "Live data" : "Seed data (local demo)"}
              </span>
              <span className="text-xs font-mono" style={{ color: "#4A4A6A" }}>
                {featured.total} programs indexed · updated weekly
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-display animate-slide-up stagger-1"
              style={{
                fontSize: "clamp(2.6rem, 5.5vw, 4.6rem)",
                fontWeight: 700,
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                color: "#F0F0F5",
                opacity: 0,
                animationFillMode: "forwards",
                marginBottom: 24,
              }}
            >
              Does your degree
              <br />
              <span className="gradient-text-blue">actually pay off?</span>
            </h1>

            <p
              className="animate-slide-up stagger-2"
              style={{
                fontSize: "clamp(1rem, 2vw, 1.15rem)",
                color: "#8B8BA7",
                lineHeight: 1.75,
                maxWidth: 540,
                opacity: 0,
                animationFillMode: "forwards",
                marginBottom: 36,
              }}
            >
              Salary data, placement rates, and 20-year career trajectories for every major
              Indian college and degree combination.{" "}
              <span style={{ color: "#F0F0F5" }}>No guesswork. No PR.</span>
            </p>

            {/* CTAs */}
            <div
              className="flex flex-wrap items-center gap-3 animate-slide-up stagger-3"
              style={{ opacity: 0, animationFillMode: "forwards" }}
            >
              <Link href="/analyze" className="btn-primary" style={{ fontSize: 15, padding: "13px 28px" }}>
                Check my degree&apos;s ROI
                <ArrowRight size={16} />
              </Link>
              <Link href="/explore" className="btn-secondary" style={{ fontSize: 15, padding: "12px 24px" }}>
                <BarChart2 size={14} />
                Browse all colleges
              </Link>
            </div>

            {/* Proof bar */}
            <div
              className="flex flex-wrap items-center gap-6 mt-10 pt-8 animate-fade-in stagger-4"
              style={{
                borderTop: "1px solid #1E1E2E",
                opacity: 0,
                animationFillMode: "forwards",
              }}
            >
              {[
                { value: "55", label: "Colleges" },
                { value: "73", label: "Programs" },
                { value: "12", label: "Data sources" },
                { value: "Free", label: "Forever" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div
                    className="font-display font-bold"
                    style={{ fontSize: 22, color: "#F0F0F5", letterSpacing: "-0.02em" }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 12, color: "#4A4A6A" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── REALITY CHECK BANNER ─────────────────────────────────────── */}
      <div
        style={{
          background: "rgba(245, 158, 11, 0.05)",
          borderTop: "1px solid rgba(245, 158, 11, 0.15)",
          borderBottom: "1px solid rgba(245, 158, 11, 0.15)",
          padding: "14px 0",
        }}
      >
        <div className="container-lg">
          <div className="flex items-center gap-3" style={{ flexWrap: "wrap", rowGap: 6 }}>
            <AlertTriangle size={14} style={{ color: "#F59E0B", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#8B8BA7" }}>
              <span style={{ color: "#F0F0F5", fontWeight: 600 }}>
                The placement brochure is not a salary guarantee.
              </span>{" "}
              Median first-year salary at a &quot;100% placement&quot; college can range from ₹2.4L to ₹18L
              depending on the stream and batch year. We show you the real distribution.
            </span>
          </div>
        </div>
      </div>

      {/* ── ROI TEASER ──────────────────────────────────────────────── */}
      <section style={{ padding: "64px 0" }}>
        <div className="container-lg">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "#4F6EF7", letterSpacing: "0.1em" }}
              >
                From the index
              </p>
              <h2
                className="font-display"
                style={{ fontSize: 28, fontWeight: 700, color: "#F0F0F5", letterSpacing: "-0.02em" }}
              >
                Same ₹15L fee. Very different outcomes.
              </h2>
            </div>
            <Link
              href="/explore"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: "#4F6EF7",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              See all colleges
              <ChevronRight size={14} />
            </Link>
          </div>

          {SAMPLE_COMPARISON.length === 0 ? (
            <p style={{ color: "#8B8BA7", fontSize: 14 }}>
              No programs loaded. Set FASTAPI_URL and ensure the backend database is seeded.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SAMPLE_COMPARISON.map((record, i) => (
                <div
                  key={record.id}
                  className="animate-slide-up"
                  style={{
                    opacity: 0,
                    animationDelay: `${i * 0.1}s`,
                    animationFillMode: "forwards",
                  }}
                >
                  <CollegeCard record={record} rank={i + 1} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── THREE PRODUCTS ────────────────────────────────────────────── */}
      <section
        style={{
          padding: "64px 0",
          background: "rgba(19,19,26,0.5)",
          borderTop: "1px solid #1E1E2E",
          borderBottom: "1px solid #1E1E2E",
        }}
      >
        <div className="container-lg">
          <div className="text-center mb-12">
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "#F7C94F", letterSpacing: "0.1em" }}
            >
              What IndiaLens does
            </p>
            <h2
              className="font-display"
              style={{ fontSize: 32, fontWeight: 700, color: "#F0F0F5", letterSpacing: "-0.02em" }}
            >
              Three tools. One decision.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <BarChart2 size={22} />,
                color: "#4F6EF7",
                title: "College Index",
                desc: "Every major Indian college ranked by actual post-placement salaries, not brochure numbers. Updated weekly. Filter by stream, city, and fee budget.",
                href: "/explore",
                cta: "Browse the index",
              },
              {
                icon: <Brain size={22} />,
                color: "#22C55E",
                title: "Your personal ROI",
                desc: "Enter your marks, budget, and what you want from life. Get a ranked list of programs with 20-year salary curves and honest risk scores — in 3 minutes.",
                href: "/analyze",
                cta: "Calculate my ROI",
              },
              {
                icon: <TrendingUp size={22} />,
                color: "#F7C94F",
                title: "AI Job Risk Tracker",
                desc: "Which careers are being automated fastest in India? District-level signals from 40,000+ weekly job postings and live Reddit salary threads.",
                href: "#",
                cta: "Coming soon",
                disabled: true,
              },
            ].map((product) => (
              <div key={product.title} className="glass-card p-6">
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: `${product.color}15`,
                    border: `1px solid ${product.color}25`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: product.color,
                    marginBottom: 16,
                  }}
                >
                  {product.icon}
                </div>
                <h3
                  className="font-display font-semibold mb-3"
                  style={{ fontSize: 18, color: "#F0F0F5", letterSpacing: "-0.01em" }}
                >
                  {product.title}
                </h3>
                <p style={{ fontSize: 14, color: "#8B8BA7", lineHeight: 1.7, marginBottom: 20 }}>
                  {product.desc}
                </p>
                {product.disabled ? (
                  <span className="badge badge-gold">{product.cta}</span>
                ) : (
                  <Link
                    href={product.href}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: product.color,
                      textDecoration: "none",
                    }}
                  >
                    {product.cta}
                    <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section style={{ padding: "80px 0" }}>
        <div className="container-lg">
          <div className="text-center mb-12">
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "#8B8BA7", letterSpacing: "0.1em" }}
            >
              Where the data comes from
            </p>
            <h2
              className="font-display"
              style={{ fontSize: 32, fontWeight: 700, color: "#F0F0F5", letterSpacing: "-0.02em" }}
            >
              How we build the picture
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div
                    className="hidden md:block absolute top-8 left-full w-full"
                    style={{
                      height: 1,
                      background: "linear-gradient(90deg, #4F6EF7, transparent)",
                      width: "calc(100% - 48px)",
                      marginLeft: 24,
                    }}
                  />
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "rgba(79,110,247,0.1)",
                      border: "1px solid rgba(79,110,247,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#4F6EF7",
                    }}
                  >
                    {step.icon}
                  </div>
                  <span className="font-mono font-bold" style={{ fontSize: 12, color: "#4A4A6A" }}>
                    {step.step}
                  </span>
                </div>
                <h3 className="font-display font-semibold mb-3" style={{ fontSize: 20, color: "#F0F0F5" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, color: "#8B8BA7", lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST / TRANSPARENCY BLOCK ────────────────────────────────── */}
      <section
        style={{
          padding: "64px 0",
          background: "rgba(79,110,247,0.04)",
          borderTop: "1px solid rgba(79,110,247,0.12)",
          borderBottom: "1px solid rgba(79,110,247,0.12)",
        }}
      >
        <div className="container-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield size={16} style={{ color: "#4F6EF7" }} />
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#4F6EF7", letterSpacing: "0.1em" }}
                >
                  How we stay honest
                </p>
              </div>
              <h2
                className="font-display font-bold mb-4"
                style={{ fontSize: 28, color: "#F0F0F5", letterSpacing: "-0.02em" }}
              >
                Our formula is open.
                <br />
                Push back if it&apos;s wrong.
              </h2>
              <p style={{ color: "#8B8BA7", fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
                Every score breaks down into six components with public weights.
                Salary predictions show a range — not a made-up single number.
                Every data point links back to where it came from.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  "Six factors, all publicly weighted",
                  "Salaries shown as p25–p75 ranges, not averages",
                  "Scrape timestamp on every college profile",
                  "Faculty and alumni can flag errors directly",
                  "Past model versions stay accessible",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle size={14} style={{ color: "#22C55E", marginTop: 3, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: "#8B8BA7" }}>{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/methodology"
                className="btn-secondary mt-6 inline-flex"
                style={{ fontSize: 13 }}
              >
                <ExternalLink size={13} />
                Read how we score
              </Link>
            </div>

            {/* Scoring breakdown */}
            <div className="glass-card p-6">
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: "#4A4A6A", letterSpacing: "0.08em" }}
              >
                What makes the score
              </p>
              {[
                { label: "Salary vs. fee paid (PPP-adjusted)", weight: "35%", color: "#4F6EF7" },
                { label: "Job security & placement consistency", weight: "20%", color: "#22C55E" },
                { label: "Career ceiling at year 10", weight: "15%", color: "#F7C94F" },
                { label: "Location & remote flexibility", weight: "15%", color: "#A78BFA" },
                { label: "Reported satisfaction & burnout rates", weight: "10%", color: "#F97316" },
                { label: "Alumni network & lateral opportunities", weight: "5%", color: "#EC4899" },
              ].map((component) => (
                <div key={component.label} className="flex items-center gap-3 mb-3">
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: component.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 13, color: "#8B8BA7", flex: 1 }}>{component.label}</span>
                  <span className="font-mono font-bold text-sm" style={{ color: component.color }}>
                    {component.weight}
                  </span>
                </div>
              ))}
              <div
                style={{
                  borderTop: "1px solid #1E1E2E",
                  paddingTop: 12,
                  marginTop: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 12, color: "#4A4A6A" }}>Final score — 0 to 100</span>
                <span className="font-mono font-bold" style={{ color: "#F0F0F5", fontSize: 16 }}>
                  = weighted sum
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 0", textAlign: "center" }}>
        <div className="container-lg" style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2
            className="font-display font-bold mb-4"
            style={{ fontSize: 36, color: "#F0F0F5", letterSpacing: "-0.03em" }}
          >
            Stop guessing.
            <br />
            <span className="gradient-text-blue">See the numbers.</span>
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "#8B8BA7",
              lineHeight: 1.7,
              marginBottom: 36,
            }}
          >
            3 minutes. Salary projections, risk flags, and a ranked shortlist of programs
            that actually fit your budget and goals.
          </p>
          <Link
            href="/analyze"
            className="btn-primary"
            style={{ fontSize: 16, padding: "14px 36px" }}
          >
            Get my free ROI report
            <ArrowRight size={16} />
          </Link>
          <p style={{ fontSize: 12, color: "#4A4A6A", marginTop: 16 }}>
            Free. No login. No spam.
          </p>
        </div>
      </section>
    </div>
  );
}
