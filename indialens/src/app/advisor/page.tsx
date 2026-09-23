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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* ── Citation Standard Bar */}
      <div className="bg-white border-b border-slate-200 py-2.5">
        <div className="container-lg">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-emerald-600 shrink-0">
              <Shield size={14} />
            </span>
            <span className="text-xs text-slate-600">
              <strong className="text-slate-900 font-semibold">Gemini 2.5 Flash + Google Search grounding.</strong>{" "}
              Every claim requires a live source. No invented ranks, packages, or cutoffs. Verified program IDs attached only when in the database.
            </span>
          </div>
        </div>
      </div>

      <div className="container-lg pt-10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
          {/* ── LEFT: Header + Studio */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold mb-3">
              <Shield className="w-3.5 h-3.5" />
              Live Search Grounding · Zero Sycophancy
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-950 tracking-tight mb-3">
              Ask with sources.
              <br />
              Map the path.
            </h1>
            <p className="text-base text-slate-600 mb-8 max-w-xl leading-relaxed">
              Same mechanism as Google AI Mode: Gemini searches live, then we verify and ground citations against official data.
            </p>

            <AIModeStudio initialToken={searchParams.token} />
          </div>

          {/* ── RIGHT: Sidebar */}
          <div className="sticky top-24 space-y-4">
            {/* What this IS NOT */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-amber-600" />
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-600">
                  Not This
                </p>
              </div>
              {NOT_THIS.map((item) => (
                <div key={item} className="flex items-start gap-2 mb-2.5">
                  <span className="text-rose-500 text-xs shrink-0 mt-0.5">✕</span>
                  <span className="text-xs text-slate-600 leading-relaxed">{item}</span>
                </div>
              ))}
            </div>

            {/* Profile connector */}
            <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-5 shadow-sm">
              <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-600 mb-1.5">
                For personalised answers
              </p>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Build your profile first. The AI advisor uses your exact budget, psychometric traits, and target programs to ground its answers.
              </p>
              <Link
                href="/onboard"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 hover:underline"
              >
                Build my OS profile
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* Example questions */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} className="text-slate-400" />
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Example Questions
                </p>
              </div>
              {EXAMPLE_QUESTIONS.map((q) => (
                <div
                  key={q}
                  className="py-2 border-b border-slate-100 last:border-0 text-xs text-slate-600 leading-snug cursor-pointer hover:text-slate-950 transition"
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
