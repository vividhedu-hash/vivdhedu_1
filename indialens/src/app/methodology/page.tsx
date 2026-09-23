export const dynamic = "force-static";

import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, ShieldCheck, Cpu, BarChart3, Binary } from "lucide-react";

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#09090B] pb-24">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-rose-50 text-rose-700 border border-rose-200 rounded-full">
              Epistemic Framework v2.4
            </span>
            <span className="text-xs text-slate-400">Zero-Sycophancy Fiduciary Standard</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight font-serif">
            How We Score. Why It Matters.
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
            The complete mathematical and epistemic architecture powering IndiaLens. Every metric is computed through peer-reviewed economic frameworks, item response theory, and empirical workforce microdata.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 flex flex-col lg:flex-row gap-10">
        {/* Sticky TOC Sidebar */}
        <div className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-24 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
              Epistemic Pipeline
            </h3>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <a href="#npv" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>Student-Priced NPV</span>
                </a>
              </li>
              <li>
                <a href="#irt" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition">
                  <Binary className="w-4 h-4 text-purple-600" />
                  <span>3PL IRT Psychometrics</span>
                </a>
              </li>
              <li>
                <a href="#ai-risk" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition">
                  <Cpu className="w-4 h-4 text-rose-600" />
                  <span>8-Vector AI Risk Surface</span>
                </a>
              </li>
              <li>
                <a href="#monte-carlo" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Monte Carlo Stress Test</span>
                </a>
              </li>
              <li>
                <a href="#fiduciary" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Fiduciary Constraints</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 space-y-12">
          
          {/* Section 1: NPV */}
          <section id="npv" className="scroll-mt-24 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Valuation Model
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-950 mb-3 font-serif">1. Student-Priced Net Present Value (NPV)</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              We calculate the Net Present Value of a degree not by average brochure outcomes, but by the realistic debt-service burden and expected lifecycle earnings over 20 years, adjusted for individual cost of capital.
            </p>
            
            <div className="bg-slate-900 text-blue-300 p-5 rounded-xl font-mono text-sm mb-6 border border-slate-800 shadow-inner overflow-x-auto">
              NPV_i = \sum_{`{t=1}`}^{`{20}`} \frac{`{E[Y_{i,t}] - DebtService_{i,t}}`}{`{(1 + r_i)^t}`} - C_{`{upfront}`}
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5">
              <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-3">Model Parameters</h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <strong className="font-mono text-slate-900">E[Y_i,t]:</strong> Expected real earnings in year t adjusted for cohort probability distribution.
                </li>
                <li className="flex items-start gap-2">
                  <strong className="font-mono text-slate-900">DebtService_i,t:</strong> Mandatory loan repayments under current RBI rate benchmarks.
                </li>
                <li className="flex items-start gap-2">
                  <strong className="font-mono text-slate-900">r_i:</strong> Household discount rate (cost of capital, 6.5% - 9.2%).
                </li>
                <li className="flex items-start gap-2">
                  <strong className="font-mono text-slate-900">C_upfront:</strong> Direct capital expenditure (tuition, hostel, equipment, exam fees).
                </li>
              </ul>
            </div>
          </section>

          {/* Section 2: IRT */}
          <section id="irt" className="scroll-mt-24 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                Psychometric Calibration
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-950 mb-3 font-serif">2. 3-Parameter Logistic Item Response Theory (3PL IRT)</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              To normalize student aptitude across wildly heterogeneous input cohorts, we deploy a 3-Parameter Logistic IRT engine with active Fisher Information routing to assess latent traits (\(\theta\)) without sycophancy.
            </p>

            <div className="bg-slate-900 text-purple-300 p-5 rounded-xl font-mono text-sm mb-6 border border-slate-800 shadow-inner overflow-x-auto">
              P_i(\theta) = c_i + \frac{`{1 - c_i}`}{`{1 + \exp(-1.7 \cdot a_i \cdot (\theta - b_i))}`}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-3.5 font-semibold text-slate-900">Parameter</th>
                    <th className="p-3.5 font-semibold text-slate-900">Psychometric Definition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr>
                    <td className="p-3.5 font-mono font-bold text-purple-700">\(\theta\) (Theta)</td>
                    <td className="p-3.5">Latent trait ability of candidate across 4 non-academic vectors.</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-mono font-bold text-purple-700">a_i</td>
                    <td className="p-3.5">Item discrimination index (slope of characteristic curve).</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-mono font-bold text-purple-700">b_i</td>
                    <td className="p-3.5">Item difficulty threshold (-2.0 to +2.5 standard deviations).</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-mono font-bold text-purple-700">c_i</td>
                    <td className="p-3.5">Pseudo-guessing / response bias lower asymptote parameter.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3: AI Risk */}
          <section id="ai-risk" className="scroll-mt-24 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                Automation Impact
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-950 mb-3 font-serif">3. 8-Vector AI Displacement & Decay Surface</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              Our AI automation matrix merges Oxford O*NET occupational taxonomies with Indian NSSO & PLFS microdata to determine the 10-year skill erosion half-life of curriculum outputs.
            </p>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-3.5 font-semibold text-slate-900">Automation Vector</th>
                    <th className="p-3.5 font-semibold text-slate-900">Decay Slope (p.a.)</th>
                    <th className="p-3.5 font-semibold text-slate-900">Defensive Posture</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr>
                    <td className="p-3.5 font-medium text-slate-900">V1: Routine Cognitive (Syntax / CRUD)</td>
                    <td className="p-3.5 font-mono text-rose-600 font-bold">-8.4% / yr</td>
                    <td className="p-3.5"><span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">High Risk</span></td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-medium text-slate-900">V2: Non-Routine Analytical</td>
                    <td className="p-3.5 font-mono text-amber-600 font-bold">-3.2% / yr</td>
                    <td className="p-3.5"><span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Moderate</span></td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-medium text-slate-900">V3: Algorithmic Systems Architecture</td>
                    <td className="p-3.5 font-mono text-emerald-600 font-bold">+4.1% / yr</td>
                    <td className="p-3.5"><span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Compounder</span></td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-medium text-slate-900">V8: High-Stakes Institutional Empathy</td>
                    <td className="p-3.5 font-mono text-emerald-600 font-bold">+2.8% / yr</td>
                    <td className="p-3.5"><span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Protected</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: Monte Carlo */}
          <section id="monte-carlo" className="scroll-mt-24 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Tail Risk Stress Test
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-950 mb-3 font-serif">4. 10,000-Path Monte Carlo Simulation</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              We execute 10,000 stochastic paths for every degree track modeling macroeconomic downturns, hiring freezes, and AI shocks. Profiles where Debt-to-Income (DTI) exceeds 45% trigger an immediate downgrade.
            </p>

            <div className="bg-slate-900 text-emerald-300 p-5 rounded-xl font-mono text-sm mb-6 border border-slate-800 shadow-inner overflow-x-auto">
              Y_{`{t+1}`} = Y_t \cdot \exp\left( (\mu - 0.5\sigma^2)dt + \sigma\sqrt{`{dt}`}Z_t - J_t \right)
            </div>

            <div className="p-5 rounded-xl bg-amber-50/60 border border-amber-200">
              <h4 className="font-bold text-amber-900 mb-1 flex items-center gap-2 text-sm">
                Catastrophic Risk Warning Trigger (DTI &gt; 45%)
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                If the 5th percentile outcome forces a student into a Debt-to-Income ratio higher than 45% during years 1–3 post-graduation, the program is flagged with a red fiduciary warning regardless of NIRF rankings.
              </p>
            </div>
          </section>

          {/* Section 5: Fiduciary Constraints */}
          <section id="fiduciary" className="scroll-mt-24 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                Transparency Charter
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-950 mb-3 font-serif">5. Fiduciary Constraints & Audit Proofs</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              IndiaLens operates under a zero-conflict covenant. We do not accept lead-generation bounties, sponsored placement fees, or promotional agency retainers from any higher-education institution.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-950 mb-1 text-sm">Cryptographic Data Audit</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every college NIRF/NAAC/placement snapshot is SHA-256 hashed to an immutable log to eliminate retrofitted outcomes.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-950 mb-1 text-sm">Open Credentials Standard</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Exportable audit certificates and skill badges adhere to the W3C Verifiable Credentials and OpenBadges v3 specifications.
                </p>
              </div>
            </div>
          </section>
          
        </div>
      </div>
    </div>
  );
}
