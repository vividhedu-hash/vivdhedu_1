# case_study_builder/page_10_actuarial_math.py
from styles import wrap_page

def get_page_10():
    content = """
<div class="kicker">Part IV &middot; The Quantitative Core</div>
<h1 class="headline">Student-Conditioned Asset Pricing</h1>
<div class="headline-sub">The mathematical and actuarial formulations replacing marketing brochures with discounted cash flows.</div>

<div class="lead-p">
  Traditional educational portals present college ROI as an elementary ratio of average placement CTC divided by sticker tuition. 
  This calculation commits three catastrophic econometric errors: it ignores time-value discounting, conflates non-cash stock vesting with liquid base salary, 
  and falsely assumes that every student earns the average. Student OS models degrees as long-duration stochastic financial assets.
</div>

<div class="math-block" style="margin-bottom: 2.5mm;">
  <div class="math-title">
    <span>4.1 &middot; Master Net Present Value (NPV) Formulation</span>
    <span>ACTUARIAL FORMULATION</span>
  </div>
  <div class="math-eq">
    $$\\text{NPV}_i = \\sum_{t=1}^{T} \\frac{\\mathbb{E}[Y_{i,t}] - \\text{DebtService}_{i,t}}{(1 + r_i)^t} - C_{\\text{upfront}, i}$$
  </div>
  <div class="math-legend">
    Where $\\mathbb{E}[Y_{i,t}] = \\hat{Y}_{\\text{base}, c, b, t} \\cdot (1 + \\beta_1 \\Delta \\theta_i) \\cdot (1 - \\text{AIRisk}_b(t))$ represents the student's 
    stochastic annual earnings conditioned on their latent ability delta $\\Delta \\theta_i = \\theta_i - \\bar{\\theta}_c$ relative to college cohort mean, 
    discounted by household opportunity cost $r_i$ and annual debt service.
  </div>
</div>

<div class="grid-2" style="margin-bottom: 2.5mm;">
  <div class="card">
    <div class="card-title-sm">4.2 &middot; Student-Conditioned Composite ROI Index</div>
    <p class="body-p" style="font-size: 7.2pt; line-height: 1.45; margin-bottom: 1.5mm;">
      To synthesize multi-dimensional variables into an intuitive fiduciary rating, the system evaluates:
    </p>
    <div class="math-block" style="padding: 2mm; margin: 1mm 0; font-size: 5.8pt; background: #07101E;">
      $$\\text{ROI}_{\\text{comp}} = w_1 \\cdot \\frac{\\text{NPV}_{20}}{\\text{Cost}_{\\text{total}}} + w_2 \\cdot \\text{IRR} + w_3 \\cdot (1 - P_{\\text{default}}) + w_4 \\cdot \\text{JSS}$$
    </div>
    <p class="body-p" style="font-size: 6.8pt; color: var(--text-muted); margin-bottom: 0;">
      Weights $w_1 \\dots w_4$ are initialized by the student's Screen 05 Decision Weights, ensuring 
      recommendations directly reflect personal risk tolerance and liquidity needs.
    </p>
  </div>
  
  <div class="card">
    <div class="card-title-sm">4.3 &middot; 10,000-Path Monte Carlo Debt Stress Test</div>
    <p class="body-p" style="font-size: 7.2pt; line-height: 1.45; margin-bottom: 1.5mm;">
      The platform projects 10,000 parallel lifetime realizations simulating macro recessions, interest rate hikes, and hiring freezes:
    </p>
    <div class="math-block" style="padding: 2mm; margin: 1mm 0; font-size: 5.8pt; background: #07101E;">
      $$Y_{i,t+1} = Y_{i,t} \\cdot \\exp\\left( (\\mu_b - 0.5 \\sigma_b^2)\\Delta t + \\sigma_b \\sqrt{\\Delta t} Z_t - J_t \\right)$$
    </div>
    <p class="body-p" style="font-size: 6.8pt; color: var(--text-muted); margin-bottom: 0;">
      Where $J_t \\sim \\text{Bernoulli}(p_{\\text{layoff}}) \\cdot \\text{Uniform}(0.3, 0.7)$ models structural career shocks. 
      Flags insolvency whenever Debt-to-Income (DTI) exceeds 45% for over 6 consecutive months.
    </p>
  </div>
</div>

<div class="card-dark" style="margin-bottom: 0;">
  <div style="font-family: var(--font-mono); font-size: 6.2pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #60A5FA; margin-bottom: 1mm;">
    Actuarial Impact &middot; Eliminating The Parent's Nightmare
  </div>
  <div style="font-size: 7.4pt; color: #E2E8F0; line-height: 1.45;">
    When a family considers a &pound;60,000 loan for an overseas master's program, legacy counselors show only best-case salaries. 
    Student OS provides an actuarial risk sheet: <em>&ldquo;Under expected economic conditions, loan repayment takes 3.8 years. 
    However, under a P10 recession scenario with tightening visa caps, your DTI reaches 58%, yielding an 18.4% probability of debt distress. 
    Mitigation: Target institutions with 85%+ co-op placement or hedge with domestic honors alternatives.&rdquo;</em>
  </div>
</div>
"""
    return wrap_page(content, 10, 20, "Student Asset Pricing &amp; Actuarial Models", "PART IV &middot; THE QUANTITATIVE CORE")
