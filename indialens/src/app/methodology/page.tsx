export const dynamic = "force-static";

import React from "react";

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F5] pb-24">
      <div className="container-xl pt-16 pb-12">
        <p className="kicker-web text-blue-500">Epistemic Architecture</p>
        <h1 className="headline text-4xl font-bold mt-2">How we score. Why it matters.</h1>
      </div>

      <div className="container-xl flex flex-col lg:flex-row gap-12">
        {/* Sticky TOC Sidebar */}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 glass-card p-6">
            <h3 className="font-semibold text-gray-300 mb-4 uppercase tracking-wider text-xs">Contents</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#npv" className="hover:text-blue-400 transition">Student-Priced NPV</a></li>
              <li><a href="#irt" className="hover:text-blue-400 transition">3PL IRT Psychometric</a></li>
              <li><a href="#ai-risk" className="hover:text-blue-400 transition">8-Vector AI Risk</a></li>
              <li><a href="#monte-carlo" className="hover:text-blue-400 transition">Monte Carlo Stress Test</a></li>
              <li><a href="#fiduciary" className="hover:text-blue-400 transition">Fiduciary Constraints</a></li>
            </ul>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 space-y-16">
          
          {/* Section 1 */}
          <section id="npv" className="scroll-mt-24">
            <p className="kicker-web text-sm text-blue-500 font-semibold mb-2">Valuation Model</p>
            <h2 className="headline-sub text-2xl font-bold mb-4">Student-Priced NPV</h2>
            <p className="text-gray-300 leading-relaxed mb-6">
              We calculate the Net Present Value of a degree not by average graduate outcomes, but by the realistic 
              debt-service burden and expected earnings over time, adjusted for individual financial risk tolerance.
            </p>
            <div className="math-block bg-[#13131A] p-4 rounded-lg font-mono text-blue-300 mb-6 border border-[#1E1E2E] overflow-x-auto">
              NPV_i = sum_t [ (E[Y_i,t] - DebtService_i,t) / (1+r_i)^t ] - C_upfront
            </div>
            <div className="glass-card p-6">
              <ul className="list-disc pl-5 text-gray-400 space-y-2">
                <li><strong className="text-gray-200">E[Y_i,t]:</strong> Expected earnings in year t</li>
                <li><strong className="text-gray-200">DebtService_i,t:</strong> Mandatory loan repayments</li>
                <li><strong className="text-gray-200">r_i:</strong> Discount rate (cost of capital)</li>
                <li><strong className="text-gray-200">C_upfront:</strong> Initial capital expenditure</li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section id="irt" className="scroll-mt-24">
            <p className="kicker-web text-sm text-blue-500 font-semibold mb-2">Assessment</p>
            <h2 className="headline-sub text-2xl font-bold mb-4">3PL IRT Psychometric</h2>
            <p className="text-gray-300 leading-relaxed mb-6">
              To normalize student abilities across wildly different input populations, we utilize a 3-Parameter 
              Logistic Item Response Theory (IRT) model, factoring out guessing and item difficulty.
            </p>
            <div className="math-block bg-[#13131A] p-4 rounded-lg font-mono text-purple-300 mb-6 border border-[#1E1E2E] overflow-x-auto">
              P_i(theta) = c_i + (1-c_i)/(1+exp(-1.7*a_i*(theta-b_i)))
            </div>
            <table className="data-table w-full text-left glass-card border-collapse">
              <thead>
                <tr className="border-b border-[#1E1E2E]">
                  <th className="p-3 text-sm font-semibold text-gray-300">Parameter</th>
                  <th className="p-3 text-sm font-semibold text-gray-300">Definition</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-400">
                <tr className="border-b border-[#1E1E2E]">
                  <td className="p-3 font-mono">theta</td>
                  <td className="p-3">Latent ability trait of the individual</td>
                </tr>
                <tr className="border-b border-[#1E1E2E]">
                  <td className="p-3 font-mono">a_i</td>
                  <td className="p-3">Item discrimination parameter</td>
                </tr>
                <tr className="border-b border-[#1E1E2E]">
                  <td className="p-3 font-mono">b_i</td>
                  <td className="p-3">Item difficulty parameter</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono">c_i</td>
                  <td className="p-3">Pseudo-guessing parameter</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Section 3 */}
          <section id="ai-risk" className="scroll-mt-24">
            <p className="kicker-web text-sm text-blue-500 font-semibold mb-2">Automation Impact</p>
            <h2 className="headline-sub text-2xl font-bold mb-4">8-Vector AI Risk</h2>
            <p className="text-gray-300 leading-relaxed mb-6">
              Our proprietary risk assessment evaluates how susceptible a degree's target outcomes are to automation.
            </p>
            <div className="glass-card overflow-hidden">
              <table className="data-table w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1E1E2E] bg-[#13131A]">
                    <th className="p-3 text-sm font-semibold text-gray-300">Vector</th>
                    <th className="p-3 text-sm font-semibold text-gray-300">Decay Slope</th>
                    <th className="p-3 text-sm font-semibold text-gray-300">Resilience Class</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-400">
                  <tr className="border-b border-[#1E1E2E]">
                    <td className="p-3 font-medium text-gray-200">V1: Routine Cognitive</td>
                    <td className="p-3 text-red-400">-8.4% / yr</td>
                    <td className="p-3"><span className="badge-red px-2 py-1 rounded text-xs">Very High Risk</span></td>
                  </tr>
                  <tr className="border-b border-[#1E1E2E]">
                    <td className="p-3 font-medium text-gray-200">V2: Non-Routine Cognitive</td>
                    <td className="p-3 text-yellow-400">-3.2% / yr</td>
                    <td className="p-3"><span className="badge-yellow px-2 py-1 rounded text-xs">Medium Risk</span></td>
                  </tr>
                  <tr className="border-b border-[#1E1E2E]">
                    <td className="p-3 font-medium text-gray-200">V3: Routine Manual</td>
                    <td className="p-3 text-red-400">-5.1% / yr</td>
                    <td className="p-3"><span className="badge-red px-2 py-1 rounded text-xs">High Risk</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-gray-200">V8: Empathetic/Social</td>
                    <td className="p-3 text-green-400">+1.2% / yr</td>
                    <td className="p-3"><span className="badge-green px-2 py-1 rounded text-xs">Low Risk</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4 */}
          <section id="monte-carlo" className="scroll-mt-24">
            <p className="kicker-web text-sm text-blue-500 font-semibold mb-2">Stress Testing</p>
            <h2 className="headline-sub text-2xl font-bold mb-4">Monte Carlo Stress Test</h2>
            <p className="text-gray-300 leading-relaxed mb-6">
              We run 10,000 simulations per degree profile to estimate tail risk and probability of catastrophic default.
              Profiles where the Debt-to-Income (DTI) ratio exceeds 45% are flagged automatically.
            </p>
            <div className="math-block bg-[#13131A] p-4 rounded-lg font-mono text-green-300 mb-6 border border-[#1E1E2E] overflow-x-auto">
              Y_&#123;t+1&#125; = Y_t * exp((mu-0.5*sigma^2)*dt + sigma*sqrt(dt)*Z_t - J_t)
            </div>
            <div className="card-accent glass-card p-6 border-l-4 border-yellow-500">
              <h4 className="font-bold text-gray-200 mb-2">Catastrophic Flag (DTI &gt; 45%)</h4>
              <p className="text-sm text-gray-400">
                Any pathway indicating greater than 5% probability of DTI &gt; 45% in years 1-3 triggers an 
                automatic downgrade in composite scoring, emphasizing downside protection.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section id="fiduciary" className="scroll-mt-24">
            <p className="kicker-web text-sm text-blue-500 font-semibold mb-2">Trust & Integrity</p>
            <h2 className="headline-sub text-2xl font-bold mb-4">Fiduciary Constraints</h2>
            <p className="text-gray-300 leading-relaxed mb-6">
              We do not accept kickbacks, referral fees, or placement bounties from institutions. Data integrity 
              is verified cryptographically and badged using open standards.
            </p>
            <div className="glass-card p-6 grid sm:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-200 mb-2">Cryptographic Hash</h4>
                <p className="text-sm text-gray-400">
                  Every data snapshot is hashed to the blockchain to prevent retroactive manipulation of outcomes data.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-200 mb-2">OpenBadges v3</h4>
                <p className="text-sm text-gray-400">
                  Credentials and audit trail compatibility verified using the OpenBadges v3 standard.
                </p>
              </div>
            </div>
          </section>
          
        </div>
      </div>
    </div>
  );
}
