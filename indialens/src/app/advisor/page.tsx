import { AIModeStudio } from "@/components/AIModeStudio";
import { Shield, CheckCircle, AlertTriangle, BookOpen, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "AI Mode — Gemini + Search Grounding",
  description:
    "Gemini 2.5 Flash with live Google Search grounding — cited answers to India education & career questions. No invented data.",
};

const EXAMPLE_QUESTIONS = [
  "What is the realistic salary trajectory for NIT Trichy ECE vs IIT Bombay CSE over 20 years?",
  "How does AI automation risk differ between CA-ICAI and CFA+MBA career paths?",
  "Is a ₹22L private engineering degree worth it when NIT seats are available at ₹6L?",
  "What is the actual placement rate at VIT Vellore CSE — after removing off-campus figures?",
  "How does LSE Economics 2027 compare to Ashoka University for Indian students on a ₹50L budget?",
];

const NOT_THIS = [
  "A chatbot that makes up placement statistics",
  "An AI that invents salary figures with no sources",
  "A college aggregator paid ₹2,500/lead to recommend private colleges",
  "A service that hides conflict-of-interest disclosures",
];

export default function AdvisorPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>

      {/* ── Citation Standard Bar */}
      <div style={{
        background: "rgba(13,148,136,0.04)",
        borderBottom: "1px solid rgba(13,148,136,0.15)",
        padding: "8px 0",
      }}>
        <div className="container-lg">
          <div className="flex items-center gap-3 flex-wrap" style={{ rowGap: 4 }}>
            <span style={{ color: "#0D9488", flexShrink: 0 }}>
              <Shield size={13} />
            </span>
            <span style={{ fontSize: 12, color: "#8B8BA7" }}>
              <strong style={{ color: "#F0F0F5" }}>Gemini 2.5 Flash + Google Search grounding.</strong>{" "}
              Every claim requires a live source. No invented ranks, packages, or cutoffs. Verified program IDs attached only when in the Supabase database.
            </span>
          </div>
        </div>
      </div>

      <div className="container-lg" style={{ paddingTop: 36, paddingBottom: 60 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 28, alignItems: "start" }}>

          {/* ── LEFT: Header + Studio */}
          <div>
            <p className="kicker-web mb-3">Live Search Grounding · Cited Sources</p>
            <h1 className="headline" style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", color: "#F0F0F5", marginBottom: 12 }}>
              Ask with sources.
              <br />
              Map the path.
            </h1>
            <p className="headline-sub" style={{ marginBottom: 28, maxWidth: 560 }}>
              Same mechanism as Google AI Mode: Gemini searches live, then we show the citations.
              No invented data. No sycophancy.
            </p>

            <AIModeStudio initialToken={searchParams.token} />
          </div>

          {/* ── RIGHT: Sidebar */}
          <div style={{ position: "sticky", top: 100 }}>

            {/* What this IS NOT */}
            <div className="glass-card p-5 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={13} style={{ color: "#D97706" }} />
                <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D97706" }}>
                  Not This
                </p>
              </div>
              {NOT_THIS.map((item) => (
                <div key={item} className="flex items-start gap-2 mb-2">
                  <span style={{ color: "#DC2626", fontSize: 12, flexShrink: 0, marginTop: 1 }}>✕</span>
                  <span style={{ fontSize: 12, color: "#8B8BA7", lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>

            {/* Profile connector */}
            <div className="card-accent mb-4">
              <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#1A6CF6", marginBottom: 6 }}>
                For personalised answers
              </p>
              <p style={{ fontSize: 12, color: "#8B8BA7", lineHeight: 1.5, marginBottom: 10 }}>
                Build your profile first. The AI advisor uses your exact budget, psychometric traits, and target programs to ground its answers.
              </p>
              <Link href="/onboard" style={{
                display: "flex", alignItems: "center", gap: 5,
                fontSize: 12, fontWeight: 700, color: "#60A5FA", textDecoration: "none",
              }}>
                Build my OS profile
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* Example questions */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={13} style={{ color: "#4A4A6A" }} />
                <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A4A6A" }}>
                  Example Questions
                </p>
              </div>
              {EXAMPLE_QUESTIONS.map((q) => (
                <div
                  key={q}
                  style={{
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(30,30,46,0.4)",
                    fontSize: 12, color: "#4A4A6A", lineHeight: 1.45, cursor: "default",
                  }}
                >
                  "{q.length > 65 ? q.slice(0, 63) + "…" : q}"
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
