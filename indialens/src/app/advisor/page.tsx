import type { Metadata } from "next";
import Link from "next/link";
import { Shield, AlertTriangle, BookOpen, ArrowRight } from "lucide-react";
import { AIModeStudio } from "@/components/AIModeStudio";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "AI Mode — grounded search",
  description:
    "Ask an India higher-education question and get an answer grounded in live web sources, with every citation shown. Nothing is asserted that a source does not support.",
};

/**
 * Worked questions.
 *
 * These are questions a student would actually ask, not marketing copy, and
 * none of them is presented as having been answered — the page ships with the
 * engine unconnected, so any phrasing that implied a stored result would be a
 * claim about a capability that is not currently reachable. Each is a prompt
 * the user can run, not an excerpt from a run.
 */
const EXAMPLE_QUESTIONS = [
  "What is the realistic salary trajectory for NIT Trichy ECE vs IIT Bombay CSE over 20 years?",
  "How does AI automation risk differ between CA-ICAI and CFA + MBA career paths?",
  "Is a ₹22L private engineering degree worth it when NIT seats are available at ₹6L?",
  "What is the published placement rate at VIT Vellore CSE, after removing off-campus figures?",
  "How does LSE Economics 2027 compare to Ashoka University for Indian students on a ₹50L budget?",
];

/**
 * What this is not.
 *
 * The claims here are about the *product's design*, and each one is checkable
 * against the running code rather than being a promise. They belong on the page
 * because a citation-first surface that will not state its own limits is not
 * asking for trust, it is demanding it.
 */
const NOT_THIS = [
  "A chatbot that generates placement statistics",
  "An answer that states a fee, rank or salary no source supports",
  "A college aggregator paid per lead to recommend a private college",
  "A ranking that any institution can pay to move",
];

export default function AdvisorPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  return (
    <div className="page-shell">
      {/* ── Standard bar ────────────────────────────────────────── */}
      <div className="status-strip">
        <div className="container-xl flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Shield size={13} style={{ color: "var(--teal)" }} aria-hidden="true" />
          <span className="t-muted">
            <strong className="t-text">Every claim requires a live source.</strong>{" "}
            Where a source does not support a number, the answer says it is
            unverified rather than filling the gap.
          </span>
        </div>
      </div>

      <div className="container-xl page-header">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* ── Main ─────────────────────────────────────────────── */}
          <div className="min-w-0">
            <PageHeader
              kicker="AI Mode"
              eyebrow={
                <span className="badge badge-purple">
                  <Shield size={10} aria-hidden="true" />
                  Search-grounded · no uncited answers
                </span>
              }
              title={
                <>
                  Ask with sources.
                  <br />
                  Map the path.
                </>
              }
              lead="A question box wired to a search-grounded engine, and a set of gates that only pass on what a live source actually supports. Catalogue programme IDs are attached only when they exist in our index."
            />

            <div className="mt-9">
              <AIModeStudio initialToken={searchParams.token} />
            </div>
          </div>

          {/* ── Sidebar ──────────────────────────────────────────── */}
          <aside className="space-y-4 lg:sticky lg:top-[74px]">
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title flex items-center gap-2">
                  <AlertTriangle size={12} aria-hidden="true" />
                  Not this
                </span>
              </div>
              <div className="panel-pad-sm">
                <ul className="space-y-2">
                  {NOT_THIS.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-[11px]"
                        style={{ color: "var(--red)" }}
                      >
                        ✕
                      </span>
                      <span className="text-[12px] leading-relaxed t-muted">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">Personalised answers</span>
              </div>
              <div className="panel-pad-sm">
                <p className="text-[12px] leading-relaxed t-muted">
                  Build your profile first. The advisor grounds its answers in
                  your budget, psychometric traits and target programmes.
                </p>
                <Link
                  href="/onboard"
                  className="btn-secondary mt-3.5 inline-flex w-full items-center justify-center gap-2"
                >
                  Build my profile
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <span className="panel-title flex items-center gap-2">
                  <BookOpen size={12} aria-hidden="true" />
                  Try asking
                </span>
              </div>
              <div className="panel-pad-sm">
                <ul className="space-y-1.5">
                  {EXAMPLE_QUESTIONS.map((q) => (
                    <li
                      key={q}
                      className="border-b py-2 last:border-0"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      <span className="text-[12px] leading-snug t-muted">
                        &ldquo;{q.length > 72 ? q.slice(0, 70) + "…" : q}&rdquo;
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
