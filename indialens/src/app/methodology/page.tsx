export const dynamic = "force-static";

import Link from "next/link";
import {
  ArrowLeft, BookOpen, ShieldCheck, Cpu, BarChart3, Binary, type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Notice } from "@/components/Notice";
import { Reveal } from "@/components/Reveal";

/**
 * The methodological contract for every number the product shows.
 *
 * Restyled onto the token system. Two things were load-bearing in the rewrite
 * and are worth naming, because both were wrong before:
 *
 * 1. The formulas used to sit on hardcoded `bg-slate-900` blocks. A fixed near
 *    black panel cannot exist in a dark theme — it reads as a hole punched
 *    through the page. They are `notice` callouts now, which are token-driven.
 * 2. The decay slopes in the automation table are figures, so they take
 *    `.num` and hold their column. They are the only quantitative claim on this
 *    page, and each one is a vector the table names rather than an average the
 *    page invented.
 */

/** The pipeline sidebar and the section headers read from one list, so the
 *  order and the icon colours cannot drift apart. */
const PIPELINE: Array<{
  id: string;
  index: string;
  label: string;
  kicker: string;
  Icon: LucideIcon;
  tone: string;
}> = [
  { id: "npv",          index: "01", label: "Student-Priced NPV",       kicker: "Valuation Model",        Icon: BarChart3,   tone: "var(--blue)" },
  { id: "irt",          index: "02", label: "3PL IRT Psychometrics",    kicker: "Psychometric Calibration", Icon: Binary,      tone: "var(--purple)" },
  { id: "ai-risk",      index: "03", label: "8-Vector AI Risk Surface", kicker: "Automation Impact",       Icon: Cpu,         tone: "var(--accent)" },
  { id: "monte-carlo",  index: "04", label: "Monte Carlo Stress Test",  kicker: "Tail Risk Stress Test",   Icon: BookOpen,    tone: "var(--green)" },
  { id: "fiduciary",    index: "05", label: "Fiduciary Constraints",   kicker: "Transparency Charter",    Icon: ShieldCheck, tone: "var(--amber)" },
];

export default function MethodologyPage() {
  return (
    <div className="page-shell">
      {/* ── Status strip ────────────────────────────────────────── */}
      <div className="status-strip">
        <div className="container-xl flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
          <span className="flex items-center gap-2">
            <ShieldCheck size={13} style={{ color: "var(--teal)" }} aria-hidden="true" />
            <span className="t-muted">Zero-Sycophancy Fiduciary Standard</span>
          </span>
          <Link
            href="/"
            className="flex items-center gap-1.5 t-faint transition-colors hover:t-text"
          >
            <ArrowLeft size={12} aria-hidden="true" />
            Back to home
          </Link>
        </div>
      </div>

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="container-xl page-header">
        <PageHeader
          kicker="Epistemic Methodology"
          eyebrow={
            <span className="badge badge-rose">
              Epistemic Framework <span className="num">v2.4</span>
            </span>
          }
          title="How We Score. Why It Matters."
          lead="The complete mathematical and epistemic architecture powering VividhEdu. Every metric is computed through peer-reviewed economic frameworks, item response theory, and empirical workforce microdata."
        />
      </div>

      <div className="container-xl pb-24">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-10">
          {/* ── Pipeline sidebar ─────────────────────────────────── */}
          <aside className="panel lg:sticky lg:top-[74px]">
            <div className="panel-head">
              <span className="panel-title">Epistemic pipeline</span>
            </div>
            <nav aria-label="Epistemic pipeline" className="panel-pad-sm">
              <ul className="space-y-0.5">
                {PIPELINE.map((step) => (
                  <li key={step.id}>
                    <a
                      href={`#${step.id}`}
                      className="flex items-center gap-2.5 rounded-sm px-2 py-2 text-[12px] leading-snug t-muted transition-colors hover:bg-chip hover:t-text"
                    >
                      <step.Icon size={13} style={{ color: step.tone }} aria-hidden="true" />
                      <span className="num num-0 t-faint">{step.index}</span>
                      <span>{step.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* ── Sections ─────────────────────────────────────────── */}
          <div className="min-w-0 space-y-6">
            {/* 1 — NPV */}
            <section id="npv" className="scroll-mt-24">
              <Reveal>
                <div className="panel">
                  <div className="panel-head">
                    <span className="panel-title flex items-center gap-2">
                      <BarChart3 size={12} style={{ color: "var(--blue)" }} aria-hidden="true" />
                      Valuation Model
                    </span>
                    <span className="num num-0 t-faint">01</span>
                  </div>
                  <div className="panel-pad">
                    <h2 className="section-title">
                      1. Student-Priced Net Present Value (NPV)
                    </h2>
                    <p className="body-p mt-3 prose-measure">
                      We calculate the Net Present Value of a degree not by average
                      brochure outcomes, but by the realistic debt-service burden and
                      expected lifecycle earnings over 20 years, adjusted for
                      individual cost of capital.
                    </p>

                    <div className="mt-5">
                      <Notice tone="info" icon={Binary} title="Formula">
                        <p className="mono overflow-x-auto whitespace-pre text-[12px] leading-relaxed t-text">
                          {String.raw`NPV_i = \sum_{t=1}^{20} \frac{E[Y_{i,t}] - DebtService_{i,t}}{(1 + r_i)^t} - C_{upfront}`}
                        </p>
                      </Notice>
                    </div>

                    <div className="card-subtle mt-5">
                      <h3 className="panel-title mb-3">Model parameters</h3>
                      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-[13px] leading-relaxed t-muted">
                        <li className="flex items-start gap-2">
                          <strong className="mono t-text">E[Y_i,t]:</strong> Expected
                          real earnings in year t adjusted for cohort probability
                          distribution.
                        </li>
                        <li className="flex items-start gap-2">
                          <strong className="mono t-text">DebtService_i,t:</strong>{" "}
                          Mandatory loan repayments under current RBI rate
                          benchmarks.
                        </li>
                        <li className="flex items-start gap-2">
                          <strong className="mono t-text">r_i:</strong> Household
                          discount rate (cost of capital,{" "}
                          <span className="num">6.5%–9.2%</span>).
                        </li>
                        <li className="flex items-start gap-2">
                          <strong className="mono t-text">C_upfront:</strong> Direct
                          capital expenditure (tuition, hostel, equipment, exam
                          fees).
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Reveal>
            </section>

            {/* 2 — IRT */}
            <section id="irt" className="scroll-mt-24">
              <Reveal>
                <div className="panel">
                  <div className="panel-head">
                    <span className="panel-title flex items-center gap-2">
                      <Binary size={12} style={{ color: "var(--purple)" }} aria-hidden="true" />
                      Psychometric Calibration
                    </span>
                    <span className="num num-0 t-faint">02</span>
                  </div>
                  <div className="panel-pad">
                    <h2 className="section-title">
                      2. 3-Parameter Logistic Item Response Theory (3PL IRT)
                    </h2>
                    <p className="body-p mt-3 prose-measure">
                      To normalize student aptitude across wildly heterogeneous
                      input cohorts, we deploy a 3-Parameter Logistic IRT engine
                      with active Fisher Information routing to assess latent
                      traits (&theta;) without sycophancy.
                    </p>

                    <div className="mt-5">
                      <Notice tone="info" icon={Binary} title="Formula">
                        <p className="mono overflow-x-auto whitespace-pre text-[12px] leading-relaxed t-text">
                          P_i(&theta;) = c_i + \frac{"{"}1 - c_i{"}"}{"{"}1 + \exp(-1.7 \cdot a_i \cdot (&theta; - b_i)){"}"}
                        </p>
                      </Notice>
                    </div>

                    <div className="mt-5 overflow-x-auto rounded-lg border border-line/10">
                      <table className="data-table">
                        <caption className="sr-only">
                          3PL IRT item parameters and their psychometric
                          definitions
                        </caption>
                        <thead>
                          <tr>
                            <th className="w-40">Parameter</th>
                            <th>Psychometric definition</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="mono text-sys-purple">&theta; (Theta)</td>
                            <td className="t-muted">
                              Latent trait ability of candidate across 4
                              non-academic vectors.
                            </td>
                          </tr>
                          <tr>
                            <td className="mono text-sys-purple">a_i</td>
                            <td className="t-muted">
                              Item discrimination index (slope of
                              characteristic curve).
                            </td>
                          </tr>
                          <tr>
                            <td className="mono text-sys-purple">b_i</td>
                            <td className="t-muted">
                              Item difficulty threshold (−2.0 to +2.5 standard
                              deviations).
                            </td>
                          </tr>
                          <tr>
                            <td className="mono text-sys-purple">c_i</td>
                            <td className="t-muted">
                              Pseudo-guessing / response bias lower asymptote
                              parameter.
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </Reveal>
            </section>

            {/* 3 — AI risk */}
            <section id="ai-risk" className="scroll-mt-24">
              <Reveal>
                <div className="panel">
                  <div className="panel-head">
                    <span className="panel-title flex items-center gap-2">
                      <Cpu size={12} style={{ color: "var(--accent)" }} aria-hidden="true" />
                      Automation Impact
                    </span>
                    <span className="num num-0 t-faint">03</span>
                  </div>
                  <div className="panel-pad">
                    <h2 className="section-title">
                      3. 8-Vector AI Displacement &amp; Decay Surface
                    </h2>
                    <p className="body-p mt-3 prose-measure">
                      Our AI automation matrix merges Oxford O*NET occupational
                      taxonomies with Indian NSSO &amp; PLFS microdata to determine the
                      10-year skill erosion half-life of curriculum outputs.
                    </p>

                    <div className="mt-5 overflow-x-auto rounded-lg border border-line/10">
                      <table className="data-table">
                        <caption className="sr-only">
                          Published decay slope and defensive posture for each
                          listed automation vector
                        </caption>
                        <thead>
                          <tr>
                            <th>Automation vector</th>
                            <th className="w-32">Decay slope (p.a.)</th>
                            <th className="w-36">Defensive posture</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { vector: "V1: Routine Cognitive (Syntax / CRUD)", slope: "−8.4% / yr", tone: "text-sys-red",    posture: "High Risk", badge: "badge-red" },
                            { vector: "V2: Non-Routine Analytical",            slope: "−3.2% / yr", tone: "text-sys-amber",  posture: "Moderate",   badge: "badge-amber" },
                            { vector: "V3: Algorithmic Systems Architecture",   slope: "+4.1% / yr", tone: "text-sys-green",  posture: "Compounder", badge: "badge-green" },
                            { vector: "V8: High-Stakes Institutional Empathy", slope: "+2.8% / yr", tone: "text-sys-green",  posture: "Protected",  badge: "badge-green" },
                          ].map((row) => (
                            <tr key={row.vector}>
                              <td className="font-medium t-text">{row.vector}</td>
                              <td className={`num num-1 font-semibold ${row.tone}`}>
                                {row.slope}
                              </td>
                              <td>
                                <span className={`badge ${row.badge}`}>{row.posture}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-3 text-[11px] leading-relaxed t-faint">
                      Four of the eight vectors are listed here. The remaining
                      four are held in the scoring engine and are not published on
                      this page.
                    </p>
                  </div>
                </div>
              </Reveal>
            </section>

            {/* 4 — Monte Carlo */}
            <section id="monte-carlo" className="scroll-mt-24">
              <Reveal>
                <div className="panel">
                  <div className="panel-head">
                    <span className="panel-title flex items-center gap-2">
                      <BookOpen size={12} style={{ color: "var(--green)" }} aria-hidden="true" />
                      Tail Risk Stress Test
                    </span>
                    <span className="num num-0 t-faint">04</span>
                  </div>
                  <div className="panel-pad">
                    <h2 className="section-title">4. 10,000-Path Monte Carlo Simulation</h2>
                    <p className="body-p mt-3 prose-measure">
                      We execute 10,000 stochastic paths for every degree track
                      modeling macroeconomic downturns, hiring freezes, and AI
                      shocks. Profiles where Debt-to-Income (DTI) exceeds 45% trigger
                      an immediate downgrade.
                    </p>

                    <div className="mt-5">
                      <Notice tone="info" icon={BookOpen} title="Formula">
                        <p className="mono overflow-x-auto whitespace-pre text-[12px] leading-relaxed t-text">
                          Y_{"{t+1}"} = Y_t \cdot \exp\left( (&mu; - 0.5&sigma;^2)dt + &sigma;\sqrt{"{dt}"}Z_t - J_t \right)
                        </p>
                      </Notice>
                    </div>

                    <div className="mt-5">
                      <Notice
                        tone="warn"
                        title="Catastrophic risk warning trigger (DTI &gt; 45%)"
                      >
                        If the 5th percentile outcome forces a student into a
                        Debt-to-Income ratio higher than 45% during years 1–3
                        post-graduation, the program is flagged with a red
                        fiduciary warning regardless of NIRF rankings.
                      </Notice>
                    </div>
                  </div>
                </div>
              </Reveal>
            </section>

            {/* 5 — Fiduciary constraints */}
            <section id="fiduciary" className="scroll-mt-24">
              <Reveal>
                <div className="panel">
                  <div className="panel-head">
                    <span className="panel-title flex items-center gap-2">
                      <ShieldCheck size={12} style={{ color: "var(--amber)" }} aria-hidden="true" />
                      Transparency Charter
                    </span>
                    <span className="num num-0 t-faint">05</span>
                  </div>
                  <div className="panel-pad">
                    <h2 className="section-title">5. Fiduciary Constraints &amp; Provenance</h2>
                    <p className="body-p mt-3 prose-measure">
                      Every figure VividhEdu shows is traceable to a named public
                      source and a recorded scrape time. Where a source has nothing
                      to report, the interface says so instead of substituting an
                      estimate — a missing placement figure renders as unavailable,
                      never as a plausible-looking number.
                    </p>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="card-subtle">
                        <h3 className="text-[14px] font-bold t-text">
                          Source Attribution
                        </h3>
                        <p className="mt-1.5 text-[13px] leading-relaxed t-muted">
                          Each data point carries its originating source and a
                          scraped-at timestamp, and superseded values are retained
                          rather than overwritten, so a corrected figure is visible
                          as a correction instead of disappearing.
                        </p>
                      </div>
                      <div className="card-subtle">
                        <h3 className="text-[14px] font-bold t-text">
                          What We Decline to Claim
                        </h3>
                        <p className="mt-1.5 text-[13px] leading-relaxed t-muted">
                          We publish no cryptographic audit trail, no externally
                          verifiable credentials, and no third-party attestation.
                          Until those exist as working systems they are absent here
                          rather than described.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
