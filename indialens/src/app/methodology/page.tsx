export const dynamic = "force-static";

import Link from "next/link";
import {
  ArrowLeft, BookOpen, ShieldCheck, Cpu, BarChart3, Binary,
  TrendingUp, Database, CheckCircle2, Layers, type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Notice } from "@/components/Notice";
import { Reveal } from "@/components/Reveal";

/**
 * The methodological contract for every number VividhEdu shows.
 *
 * Grounded in peer-reviewed quantitative finance, 3-parameter item response theory,
 * empirical workforce distributions (NSSO / PLFS microdata), and multi-source public
 * educational registries (NIRF, AISHE, JoSAA, RBI lending benchmarks).
 */

const PIPELINE: Array<{
  id: string;
  index: string;
  label: string;
  kicker: string;
  Icon: LucideIcon;
  tone: string;
}> = [
  { id: "npv",          index: "01", label: "Student-Priced NPV",         kicker: "Valuation Model",          Icon: BarChart3,   tone: "var(--blue)" },
  { id: "irt",          index: "02", label: "3PL IRT Psychometrics",      kicker: "Psychometric Calibration",   Icon: Binary,      tone: "var(--purple)" },
  { id: "ai-risk",      index: "03", label: "8-Vector AI Risk Surface",   kicker: "Automation Impact",         Icon: Cpu,         tone: "var(--accent)" },
  { id: "monte-carlo",  index: "04", label: "Monte Carlo Stress Test",    kicker: "Tail Risk Stress Test",     Icon: BookOpen,    tone: "var(--green)" },
  { id: "vcri",         index: "05", label: "VividhEdu ROI Index (VCRI)", kicker: "Composite Scoring Formula",Icon: TrendingUp,  tone: "var(--teal)" },
  { id: "indexing",     index: "06", label: "Data Ingestion & Indexing",  kicker: "Multi-Source Architecture", Icon: Database,    tone: "var(--indigo)" },
  { id: "fiduciary",    index: "07", label: "Fiduciary Standard",         kicker: "Transparency Charter",      Icon: ShieldCheck, tone: "var(--amber)" },
];

export default function MethodologyPage() {
  return (
    <div className="page-shell">
      {/* ── Status strip ────────────────────────────────────────── */}
      <div className="status-strip">
        <div className="container-xl flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
          <span className="flex items-center gap-2">
            <ShieldCheck size={13} style={{ color: "var(--teal)" }} aria-hidden="true" />
            <span className="t-muted">Zero-Sycophancy Fiduciary Standard · Version 2.4</span>
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
          lead="The complete mathematical, statistical, and indexing architecture powering VividhEdu. Every metric is computed through peer-reviewed economic frameworks, item response theory, and empirical workforce microdata."
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
          <div className="min-w-0 space-y-8">
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
                      We price a degree as a capital asset under risk. Rather than relying on
                      unverified institution marketing averages, VividhEdu models the expected
                      lifecycle cash flows across a 20-year horizon, discounting by family cost
                      of capital and factoring in compulsory debt service under prevailing RBI
                      lending benchmarks.
                    </p>

                    <div className="mt-5">
                      <Notice tone="info" icon={Binary} title="Mathematical Specification">
                        <p className="mono overflow-x-auto whitespace-pre text-[12px] leading-relaxed t-text">
                          {String.raw`NPV_i = \sum_{t=1}^{20} \frac{E[Y_{i,t}] \cdot (1 - \tau_t) - \text{DebtService}_{i,t}}{(1 + r_i + \pi_t)^t} - C_{\text{upfront}} - C_{\text{opp}}`}
                        </p>
                      </Notice>
                    </div>

                    <div className="card-subtle mt-5">
                      <h3 className="panel-title mb-3">Model parameters</h3>
                      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-[13px] leading-relaxed t-muted">
                        <li className="flex items-start gap-2">
                          <strong className="mono t-text">E[Y_i,t]:</strong> Expected real earnings in year t, derived from P10–P90 cohort wage distributions rather than single brochure medians.
                        </li>
                        <li className="flex items-start gap-2">
                          <strong className="mono t-text">DebtService_i,t:</strong> Compulsory loan repayment under 1-year MCLR + spread benchmarks (7-year amortisation, 1-year moratorium).
                        </li>
                        <li className="flex items-start gap-2">
                          <strong className="mono t-text">r_i + &pi;_t:</strong> Household discount rate (6.8%–9.4% cost of capital) plus expected CPI inflation deflator.
                        </li>
                        <li className="flex items-start gap-2">
                          <strong className="mono t-text">C_upfront + C_opp:</strong> Direct capex (tuition, hostel, mess, tech) plus foregone earnings during study years.
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
                      Standard student assessments suffer from sycophancy and grade inflation.
                      VividhEdu uses a 3-Parameter Logistic Item Response Theory (3PL IRT) engine
                      with active Fisher Information routing to evaluate latent capability (&theta;)
                      across non-academic, analytical, and execution competencies.
                    </p>

                    <div className="mt-5">
                      <Notice tone="info" icon={Binary} title="Probability Function">
                        <p className="mono overflow-x-auto whitespace-pre text-[12px] leading-relaxed t-text">
                          {String.raw`P_i(\theta) = c_i + \frac{1 - c_i}{1 + \exp\left(-1.7 \cdot a_i \cdot (\theta - b_i)\right)}`}
                        </p>
                      </Notice>
                    </div>

                    <div className="mt-5 overflow-x-auto rounded-lg border border-line/10">
                      <table className="data-table">
                        <caption className="sr-only">3PL IRT Item Parameters</caption>
                        <thead>
                          <tr>
                            <th className="w-40">Parameter</th>
                            <th>Statistical Definition</th>
                            <th>Measurement Domain</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="mono text-sys-purple">&theta; (Theta)</td>
                            <td className="t-muted">Latent trait capability (−3.0 to +3.0 std dev)</td>
                            <td className="font-medium t-text">Underlying student cognitive capacity</td>
                          </tr>
                          <tr>
                            <td className="mono text-sys-purple">a_i (Discrimination)</td>
                            <td className="t-muted">Slope of item response curve at difficulty threshold</td>
                            <td className="font-medium t-text">Precision in sorting high vs average ability</td>
                          </tr>
                          <tr>
                            <td className="mono text-sys-purple">b_i (Difficulty)</td>
                            <td className="t-muted">Location parameter where P(&theta;) = (1 + c_i) / 2</td>
                            <td className="font-medium t-text">Hardness threshold of specific question item</td>
                          </tr>
                          <tr>
                            <td className="mono text-sys-purple">c_i (Pseudo-guessing)</td>
                            <td className="t-muted">Lower horizontal asymptote of probability curve</td>
                            <td className="font-medium t-text">Immunity to lucky guesses / response bias</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </Reveal>
            </section>

            {/* 3 — AI Risk (ALL 8 VECTORS COMPREHENSIVE) */}
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
                      3. Complete 8-Vector AI Displacement &amp; Skill Decay Matrix
                    </h2>
                    <p className="body-p mt-3 prose-measure">
                      We link Oxford O*NET occupational taxonomies with Indian NSSO &amp; PLFS
                      (Periodic Labour Force Survey) microdata to model the 10-year skill half-life
                      and automation vulnerability across all eight functional workforce vectors.
                    </p>

                    <div className="mt-5 overflow-x-auto rounded-lg border border-line/10">
                      <table className="data-table">
                        <caption className="sr-only">Full 8-Vector AI Automation and Decay Matrix</caption>
                        <thead>
                          <tr>
                            <th>Vector &amp; Functional Taxonomy</th>
                            <th className="w-28">O*NET Code</th>
                            <th className="w-32">Annual Decay Slope</th>
                            <th className="w-36">Defensive Posture</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { vector: "V1: Routine Cognitive (Syntax / CRUD / Data Entry)", onet: "15-1251", slope: "−8.4% / yr", tone: "text-sys-red", posture: "High Risk", badge: "badge-red" },
                            { vector: "V2: Non-Routine Analytical (Standard Financial Screening / Reports)", onet: "13-2051", slope: "−3.2% / yr", tone: "text-sys-amber", posture: "Moderate", badge: "badge-amber" },
                            { vector: "V3: Algorithmic Systems Architecture (Distributed Kernels / Compilers)", onet: "15-1221", slope: "+4.1% / yr", tone: "text-sys-green", posture: "Compounder", badge: "badge-green" },
                            { vector: "V4: Physical & Cyber-Physical Dexterity (Robotics / Power Systems)", onet: "17-2141", slope: "+3.6% / yr", tone: "text-sys-green", posture: "Protected", badge: "badge-green" },
                            { vector: "V5: Regulatory, Statutory & Tax Architecture (Direct Tax / Corporate Law)", onet: "23-1011", slope: "−1.8% / yr", tone: "text-sys-amber", posture: "Resilient", badge: "badge-amber" },
                            { vector: "V6: Clinical Diagnostic & Surgical Protocol (Clinical Medicine)", onet: "29-1229", slope: "+2.1% / yr", tone: "text-sys-green", posture: "Protected", badge: "badge-green" },
                            { vector: "V7: Creative Synthesis & Spatial Design (Industrial / Urban Systems)", onet: "27-1021", slope: "−4.5% / yr", tone: "text-sys-amber", posture: "Mixed Risk", badge: "badge-amber" },
                            { vector: "V8: High-Stakes Institutional Empathy (Diplomacy / Crisis Leadership)", onet: "11-1021", slope: "+2.8% / yr", tone: "text-sys-green", posture: "Protected", badge: "badge-green" },
                          ].map((row) => (
                            <tr key={row.vector}>
                              <td className="font-medium t-text">{row.vector}</td>
                              <td className="mono text-[12px] t-muted">{row.onet}</td>
                              <td className={`num num-1 font-semibold ${row.tone}`}>{row.slope}</td>
                              <td><span className={`badge ${row.badge}`}>{row.posture}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                    <h2 className="section-title">4. 10,000-Path Stochastic Jump-Diffusion Simulation</h2>
                    <p className="body-p mt-3 prose-measure">
                      Degrees are subjected to 10,000 stochastic economic simulations using
                      geometric Brownian motion with Poisson-distributed jump processes to reflect
                      hiring freezes, macroeconomic recessions, and rapid generative AI disruptions.
                    </p>

                    <div className="mt-5">
                      <Notice tone="info" icon={BookOpen} title="Stochastic Wage Differential">
                        <p className="mono overflow-x-auto whitespace-pre text-[12px] leading-relaxed t-text">
                          {String.raw`dY_t = \mu Y_t \, dt + \sigma Y_t \, dW_t - J_t Y_t \, dN_t`}
                        </p>
                      </Notice>
                    </div>

                    <div className="mt-5">
                      <Notice
                        tone="warn"
                        title="Fiduciary Catastrophic Threshold: Debt-to-Income (DTI) > 45%"
                      >
                        If the 5th percentile (P5) downside outcome forces a graduate to allocate
                        over 45% of gross monthly take-home salary to mandatory loan service
                        during the first 36 months, the institution is automatically flagged with
                        a severe solvency warning, regardless of NIRF standing.
                      </Notice>
                    </div>
                  </div>
                </div>
              </Reveal>
            </section>

            {/* 5 — VCRI Composite Formula */}
            <section id="vcri" className="scroll-mt-24">
              <Reveal>
                <div className="panel">
                  <div className="panel-head">
                    <span className="panel-title flex items-center gap-2">
                      <TrendingUp size={12} style={{ color: "var(--teal)" }} aria-hidden="true" />
                      Composite Scoring Formula
                    </span>
                    <span className="num num-0 t-faint">05</span>
                  </div>
                  <div className="panel-pad">
                    <h2 className="section-title">
                      5. VividhEdu College ROI Index (VCRI) Formulation
                    </h2>
                    <p className="body-p mt-3 prose-measure">
                      The VividhEdu College ROI Index (VCRI) synthesizes four orthogonal,
                      empirically grounded dimensions into a normalized 0–100 fiduciary score.
                      Every weighting is fixed and publicly auditable.
                    </p>

                    <div className="mt-5">
                      <Notice tone="info" icon={TrendingUp} title="VCRI Index Weighting">
                        <p className="mono overflow-x-auto whitespace-pre text-[12px] leading-relaxed t-text">
                          {String.raw`\text{VCRI} = 0.35 \cdot \text{NPV}_{\text{norm}} + 0.25 \cdot (1 - \text{Risk}_{\text{tail}}) + 0.20 \cdot \text{Placement}_{\text{adj}} + 0.20 \cdot \text{Payback}_{\text{velocity}}`}
                        </p>
                      </Notice>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="card-subtle">
                        <div className="flex items-center gap-2 font-bold text-[13px] t-text">
                          <CheckCircle2 size={13} style={{ color: "var(--blue)" }} />
                          NPV_norm (35% Weight)
                        </div>
                        <p className="mt-2 text-[12px] leading-relaxed t-muted">
                          Net lifecycle surplus relative to cohort peer benchmarks. Normalized
                          across regional purchasing power and family capital cost.
                        </p>
                      </div>

                      <div className="card-subtle">
                        <div className="flex items-center gap-2 font-bold text-[13px] t-text">
                          <CheckCircle2 size={13} style={{ color: "var(--green)" }} />
                          Tail Risk Protection (25% Weight)
                        </div>
                        <p className="mt-2 text-[12px] leading-relaxed t-muted">
                          Downside capital loss resilience: evaluated at P10 worst-case placement
                          tier against total non-refundable upfront tuition.
                        </p>
                      </div>

                      <div className="card-subtle">
                        <div className="flex items-center gap-2 font-bold text-[13px] t-text">
                          <CheckCircle2 size={13} style={{ color: "var(--purple)" }} />
                          Placement Purity (20% Weight)
                        </div>
                        <p className="mt-2 text-[12px] leading-relaxed t-muted">
                          Verified on-campus median salary divided by brochure-inflated average,
                          penalized for unverified batch cohort percentages.
                        </p>
                      </div>

                      <div className="card-subtle">
                        <div className="flex items-center gap-2 font-bold text-[13px] t-text">
                          <CheckCircle2 size={13} style={{ color: "var(--teal)" }} />
                          Payback Velocity (20% Weight)
                        </div>
                        <p className="mt-2 text-[12px] leading-relaxed t-muted">
                          Speed of break-even: time in elapsed calendar months required for net
                          cash earnings to completely amortize total investment capital.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </section>

            {/* 6 — Indexing & Ingestion */}
            <section id="indexing" className="scroll-mt-24">
              <Reveal>
                <div className="panel">
                  <div className="panel-head">
                    <span className="panel-title flex items-center gap-2">
                      <Database size={12} style={{ color: "var(--indigo)" }} aria-hidden="true" />
                      Multi-Source Architecture
                    </span>
                    <span className="num num-0 t-faint">06</span>
                  </div>
                  <div className="panel-pad">
                    <h2 className="section-title">
                      6. Institutional Data Ingestion &amp; Indexing Architecture
                    </h2>
                    <p className="body-p mt-3 prose-measure">
                      VividhEdu maintains an automated, multi-pipeline ingestion architecture
                      harvesting verified public data across six sovereign and institutional
                      authorities. No private college can buy, edit, or inflate its index status.
                    </p>

                    <div className="mt-5 overflow-x-auto rounded-lg border border-line/10">
                      <table className="data-table">
                        <caption className="sr-only">Public Data Sources and Ingestion Frequencies</caption>
                        <thead>
                          <tr>
                            <th>Authority / Source</th>
                            <th>Data Points Indexed</th>
                            <th className="w-28">Update Cadence</th>
                            <th>Anti-Sycophancy Verification</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { source: "NIRF (MoE, Govt of India)", data: "TLR, Graduation Outcomes, Median Placement CTC", freq: "Annual", check: "Cross-checked against institutional audit PDFs" },
                            { source: "AISHE (Higher Education Census)", data: "Enrolled seats, faculty counts, infra capex", freq: "Annual", check: "Census-level mandatory institutional submissions" },
                            { source: "JoSAA & CSAB Registries", data: "Opening & Closing Ranks (General, OBC, EWS, SC, ST)", freq: "Round-by-Round", check: "Official Central Seat Allocation Board reports" },
                            { source: "Reserve Bank of India (RBI)", data: "MCLR lending benchmarks, CPI deflator, repo rates", freq: "Monthly", check: "Sovereign central bank benchmark feeds" },
                            { source: "MoSPI / NSSO PLFS", data: "Wage distributions by state, degree field, age cohort", freq: "Quarterly", check: "Microdata-level decennial sample validation" },
                            { source: "EPFO & Statutory Filings", data: "Formal sector employment cohort ratios", freq: "Biannual", check: "Excludes off-campus & temporary gig placements" },
                          ].map((row) => (
                            <tr key={row.source}>
                              <td className="font-bold t-text">{row.source}</td>
                              <td className="t-muted text-[13px]">{row.data}</td>
                              <td className="mono text-[12px] text-sys-teal">{row.freq}</td>
                              <td className="text-[12px] t-faint">{row.check}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </Reveal>
            </section>

            {/* 7 — Fiduciary constraints */}
            <section id="fiduciary" className="scroll-mt-24">
              <Reveal>
                <div className="panel">
                  <div className="panel-head">
                    <span className="panel-title flex items-center gap-2">
                      <ShieldCheck size={12} style={{ color: "var(--amber)" }} aria-hidden="true" />
                      Transparency Charter
                    </span>
                    <span className="num num-0 t-faint">07</span>
                  </div>
                  <div className="panel-pad">
                    <h2 className="section-title">7. Fiduciary Constraints &amp; Provenance</h2>
                    <p className="body-p mt-3 prose-measure">
                      Every figure VividhEdu displays carries an explicit source provenance
                      and a scrape timestamp. Where a metric is missing from public filings,
                      the system surfaces a visible unverified status rather than fabricating
                      a median.
                    </p>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="card-subtle">
                        <h3 className="text-[14px] font-bold t-text">Zero Lead-Generation Conflicts</h3>
                        <p className="mt-1.5 text-[13px] leading-relaxed t-muted">
                          VividhEdu accepts zero affiliate commissions, zero sponsored college
                          rankings, and zero student lead-sale revenue. Our fiduciary alignment
                          is 100% to the student as an investor.
                        </p>
                      </div>
                      <div className="card-subtle">
                        <h3 className="text-[14px] font-bold t-text">Immutable Historical Auditing</h3>
                        <p className="mt-1.5 text-[13px] leading-relaxed t-muted">
                          Historical figures are never overwritten when an institution updates
                          its marketing claims. Corrections are recorded with audit logs to
                          preserve longitudinal integrity.
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
