import os

OUT_DIR = "/Users/indian/Downloads/Adaptive signal project/India Lens"
FILE_NAME = "PROJECT_PRD.html"

C = {
    "black":      "#1A1A1A",
    "dark":       "#002F6C",
    "blue":       "#0077C8",
    "light_blue": "#E8F2FB",
    "accent":     "#1F8ECD",
    "gray_dark":  "#4A4A4A",
    "gray_mid":   "#767676",
    "gray_light": "#F5F5F5",
    "gray_border":"#D0D0D0",
    "white":      "#FFFFFF",
    "red":        "#C41E3A",
    "green":      "#1D6F42",
}

def build_html():
    css = f"""
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    :root {{
      --black: {C['black']}; --dark: {C['dark']}; --blue: {C['blue']};
      --light_blue: {C['light_blue']}; --accent: {C['accent']};
      --gray_dark: {C['gray_dark']}; --gray_mid: {C['gray_mid']};
      --gray_light: {C['gray_light']}; --gray_border: {C['gray_border']};
      --white: {C['white']}; --red: {C['red']}; --green: {C['green']};
    }}
    body {{ font-family:'Inter',sans-serif; color:var(--black); background:#FFFFFF; font-size:10.5pt; line-height:1.7; }}
    .page {{ max-width:900px; margin:0 auto; background:#FFFFFF; }}

    /* ── COVER ── */
    .cover {{
      background: #FFFFFF;
      padding:72px 64px 56px; position:relative; overflow:hidden;
    }}
    .cover::before {{
      content:''; position:absolute; top:0; left:0; width:100%; height:12px; background:var(--dark);
    }}
    .cover h1 {{ font-size:26pt; font-weight:700; color:var(--black); margin-bottom:12px; }}
    .cover-sub {{ font-size:14pt; color:var(--gray_mid); margin-bottom:24px; }}
    .cover-divider {{ border-top:2px solid var(--blue); width:80px; margin-bottom:24px; }}
    .cover-meta {{ display:flex; flex-direction:column; gap:8px; font-family:'JetBrains Mono', monospace; font-size:9pt; color:var(--gray_dark); }}
    .cover-meta-item {{ display:flex; gap:12px; }}
    .cover-meta-label {{ font-weight:600; width:120px; }}
    
    /* ── LAYOUT ── */
    .body-wrap {{ padding:56px 72px; }}

    /* ── TOC ── */
    .toc {{ background:var(--white); border:1px solid var(--gray_border); padding:28px 32px; margin:36px 0; }}
    .toc-title {{ font-size:12pt; font-weight:700; color:var(--dark); margin-bottom:18px; text-transform:uppercase; letter-spacing:.07em; }}
    .toc-list {{ list-style:none; }}
    .toc-list li {{ padding:3px 0; display:flex; justify-content:space-between; }}
    .toc-list a {{ color:var(--black); text-decoration:none; font-size:9.5pt; display:flex; width:100%; }}
    .toc-list a span.sec-num {{ color:var(--blue); font-weight:700; margin-right:8px; }}
    .toc-list a:hover {{ text-decoration:underline; }}
    .toc-part {{ font-weight:700; color:var(--black); margin-top:10px; font-size:9pt; letter-spacing:.06em; text-transform:uppercase; }}

    /* ── SECTION HEADINGS ── */
    .section-part {{ margin:52px 0 0; padding-top:24px; border-top:1px solid var(--gray_border); }}
    .part-label {{
      font-family:'Inter', sans-serif; font-size:7.5pt; font-weight:700;
      letter-spacing:0.18em; text-transform:uppercase; color:var(--blue);
      margin-bottom:6px; display:block;
    }}
    h2.sec-title {{
      font-size:16pt; font-weight:700; color:var(--dark);
      border-left:3px solid var(--blue); padding-left:14px; margin-bottom:20px;
    }}
    h3.sub-title {{
      font-size:11pt; font-weight:600; color:var(--black);
      border-bottom:1px solid var(--gray_border); padding-bottom:4px;
      margin:24px 0 10px;
    }}
    h4.sub-sub {{ font-size:10.5pt; font-weight:600; color:var(--black); margin:20px 0 8px; }}

    /* ── BODY TEXT ── */
    p {{ margin-bottom:13px; text-align:justify; }}
    ul, ol {{ margin:10px 0 14px 26px; }}
    li {{ margin-bottom:5px; }}
    strong {{ font-weight:600; color:var(--black); }}
    em {{ font-style:italic; }}
    code {{ font-family:'JetBrains Mono',monospace; background:var(--gray_light); padding:1px 5px; border-radius:2px; font-size:9pt; }}

    /* ── MATH ── */
    .math-block {{
      background:var(--gray_light); border:none; border-left:3px solid var(--blue);
      border-radius:0; padding:16px 20px; margin:20px 0;
      font-family:'JetBrains Mono',monospace; font-size:9.5pt; line-height:1.7;
    }}
    .math-title {{ font-family:'Inter',sans-serif; font-weight:600; font-size:7.5pt; color:var(--gray_mid); margin-bottom:8px; text-transform:uppercase; letter-spacing:.1em; }}

    /* ── TABLES ── */
    .tbl-wrap {{ overflow-x:auto; margin:24px 0; }}
    .tbl-caption {{ font-size:8pt; font-weight:600; color:var(--gray_mid); margin-bottom:8px; text-transform:uppercase; letter-spacing:.08em; }}
    table {{ width:100%; border-collapse:collapse; font-size:9.5pt; border:1px solid var(--gray_border); }}
    thead tr {{ background:var(--dark); color:var(--white); }}
    thead th {{ padding:10px 12px; text-align:left; font-weight:600; font-size:9pt; letter-spacing:.04em; }}
    tbody tr {{ border-bottom:1px solid var(--gray_border); }}
    tbody tr:nth-child(even) {{ background:var(--gray_light); }}
    tbody tr:nth-child(odd) {{ background:var(--white); }}
    tbody td {{ padding:9px 12px; vertical-align:top; border-left:1px solid var(--gray_border); border-right:1px solid var(--gray_border); }}
    td.center {{ text-align:center; }}

    /* ── CALLOUT BOXES ── */
    .callout {{
      border:1px solid var(--gray_border); border-left:4px solid var(--gray_mid);
      padding:16px 20px; margin:20px 0; background:#FAFAFA; border-radius:0;
    }}
    .callout-info    {{ border-left-color:var(--blue); background:#F5F9FD; }}
    .callout-warning {{ border-left-color:#C8740A; background:#FDF8F0; }}
    .callout-key     {{ border-left-color:var(--green); background:#F7FBF8; }}
    .callout-risk    {{ border-left-color:var(--red); background:#FDF5F6; }}
    .callout-title   {{ font-size:8.5pt; font-weight:700; margin-bottom:6px; text-transform:uppercase; letter-spacing:.1em; color:var(--black); }}

    /* ── FOOTER ── */
    .footer {{
      display:flex; justify-content:space-between; align-items:center;
      background:var(--white); color:var(--gray_mid); font-size:8pt;
      padding:16px 64px; border-top:1px solid var(--gray_border);
      margin-top:40px;
    }}
    .footer-bar {{ height:4px; background:var(--dark); width:100%; }}
    .footer-wrapper {{ width:100%; }}

    @media print {{ body {{ background:#fff; }} .page {{ box-shadow:none; }} }}
    """

    cover = r"""
    <div class="page">
      <div class="cover">
        <h1>The Project: Product Requirements Document</h1>
        <div class="cover-sub">Quantitative Education & Career Intelligence OS</div>
        <div class="cover-divider"></div>
        <div class="cover-meta">
            <div class="cover-meta-item"><span class="cover-meta-label">Date:</span><span class="cover-meta-value">September 2026</span></div>
            <div class="cover-meta-item"><span class="cover-meta-label">Version:</span><span class="cover-meta-value">v1.0.0</span></div>
            <div class="cover-meta-item"><span class="cover-meta-label">Classification:</span><span class="cover-meta-value">Confidential / Internal Use Only</span></div>
        </div>
      </div>
      <div class="body-wrap">
    """

    sec1 = r"""
<div class="section-part" id="s1">
  <div class="part-label">Section 1</div>
  <h2 class="sec-title">Executive Product Brief</h2>
  <p><strong>The Project</strong> represents a paradigm shift in educational technology. We are building India's first quantitative Education & Career Intelligence OS. Traditionally, educational decisions have been driven by prestige, societal pressure, and non-quantitative ranking systems. We treat degrees fundamentally as multi-decade financial assets rather than prestige purchases.</p>
  <div class="callout callout-key">
    <div class="callout-title">Core Mantra</div>
    <p>Rankings measure institutions; <strong>The Project measures the student.</strong></p>
  </div>
  <h3 class="sub-title">1.1 Target Audience</h3>
  <ul>
    <li>Indian students aged 16-22 facing pivotal educational and career choices.</li>
    <li>Parents seeking rigorous ROI validation before committing life savings or taking massive educational loans.</li>
    <li>School counselors requiring objective, data-backed tools to guide their students.</li>
    <li>EdTech B2B partners seeking actuaries and intelligence APIs for their own platforms.</li>
  </ul>
  <h3 class="sub-title">1.2 The Fundamental Market Failure</h3>
  <p>The current ecosystem operates on misaligned incentives and flawed metrics. Government and private rankings (like NIRF) rank universities based on campus size, faculty volume, and infrastructure, not student outcomes. Aggregators exist solely to sell student data as leads to universities. Agents earn commissions by pushing students into high-margin, low-ROI programs abroad. No platform provides unbiased, actuarial truth mapping the true financial, psychological, and temporal costs against a student's unique profile. The Project solves this by building a definitive intelligence layer.</p>
</div>
"""

    sec2 = r"""
<div class="section-part" id="s2">
  <div class="part-label">Section 2</div>
  <h2 class="sec-title">Competitive Analysis</h2>
  <p>The landscape is dominated by lead-generation models. The Project's quantitative, personalized, and AI-resilient framework structurally distances it from all existing players.</p>
  
  <div class="tbl-wrap">
    <div class="tbl-caption">Table 2.1 — Competitive Landscape</div>
    <table>
      <thead>
        <tr>
          <th>Competitor</th>
          <th>Business Model</th>
          <th>Unit of Analysis</th>
          <th>Outcome Metric</th>
          <th>Personalization</th>
          <th>AI Disruption Modeling</th>
          <th>Debt/ROI Modeling</th>
          <th>Global Coverage</th>
          <th>Course Marketplace</th>
          <th>Data Freshness</th>
          <th>Pricing Model</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>The Project</strong></td>
          <td>Intelligence OS / Affiliate</td>
          <td>The Student</td>
          <td>Actuarial ROI & Net Present Value</td>
          <td>Deep (IRT CAT Psychometrics)</td>
          <td>Yes (Flagship AI Risk Index)</td>
          <td>Yes (Monte Carlo Default Prob)</td>
          <td>Comprehensive</td>
          <td>Yes (Affiliate API)</td>
          <td>Real-time (Airflow DAGs)</td>
          <td>Freemium / One-time / B2B</td>
        </tr>
        <tr>
          <td><strong>Shiksha.com</strong></td>
          <td>Lead Gen (B2B)</td>
          <td>The Institution</td>
          <td>Acceptance Rate</td>
          <td>None</td>
          <td>No</td>
          <td>No</td>
          <td>India + Partial Global</td>
          <td>No</td>
          <td>Static/Annual</td>
          <td>Free to User</td>
        </tr>
        <tr>
          <td><strong>CollegeDunia</strong></td>
          <td>Affiliate / Ads</td>
          <td>The Institution</td>
          <td>User Reviews</td>
          <td>Low</td>
          <td>No</td>
          <td>No</td>
          <td>India</td>
          <td>No</td>
          <td>User-driven</td>
          <td>Free to User</td>
        </tr>
        <tr>
          <td><strong>Careers360</strong></td>
          <td>Content + Ads</td>
          <td>The Exam</td>
          <td>College Predictor</td>
          <td>Basic Rules</td>
          <td>No</td>
          <td>No</td>
          <td>India</td>
          <td>No</td>
          <td>Annual/Static</td>
          <td>Free / Ads</td>
        </tr>
        <tr>
          <td><strong>Niche.com</strong></td>
          <td>Ads / Lead Gen</td>
          <td>The Institution</td>
          <td>Vibe / Reviews</td>
          <td>Low</td>
          <td>No</td>
          <td>No</td>
          <td>US Only</td>
          <td>No</td>
          <td>Annual</td>
          <td>Free to User</td>
        </tr>
        <tr>
          <td><strong>College Scorecard</strong></td>
          <td>Government Utility</td>
          <td>The Institution</td>
          <td>Debt-to-Earnings Ratio</td>
          <td>None</td>
          <td>No</td>
          <td>Basic Historical</td>
          <td>US Only</td>
          <td>No</td>
          <td>Lagging (2-3 years)</td>
          <td>Public Good</td>
        </tr>
        <tr>
          <td><strong>Peterson's/Unigo</strong></td>
          <td>Subscriptions</td>
          <td>The Scholarship</td>
          <td>Match Probability</td>
          <td>Basic</td>
          <td>No</td>
          <td>No</td>
          <td>US Only</td>
          <td>No</td>
          <td>Annual</td>
          <td>Subscription</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
"""

    sec3 = r"""
<div class="section-part" id="s3">
  <div class="part-label">Section 3</div>
  <h2 class="sec-title">Course Marketplace & Affiliate Engine</h2>
  <p>The Project acts as an intelligent router for educational upskilling, matching students with courses based on actuarial gaps rather than ad spend.</p>

  <h3 class="sub-title">3.1 Personalized Recommendations</h3>
  <p>Recommendations are generated dynamically using four vectors:</p>
  <ul>
    <li><strong>Psychometric Trait Vector:</strong> Extracted from the 2PL IRT CAT Engine.</li>
    <li><strong>Target Career Path:</strong> Defined by the student's stated goal or AI-inferred trajectory.</li>
    <li><strong>AI Disruption Score:</strong> Exposure of the chosen field to automation.</li>
    <li><strong>Skill Gap Vector:</strong> Delta between student's current profile and industry requirements.</li>
  </ul>

  <h3 class="sub-title">3.2 Course Categories & Providers</h3>
  <ul>
    <li><strong>Upskilling:</strong> Coursera, Udemy, LinkedIn Learning.</li>
    <li><strong>Exam Prep:</strong> Unacademy, Physics Wallah, Allen.</li>
    <li><strong>Certification:</strong> AWS, Google Cloud, CFA Institute.</li>
    <li><strong>Language:</strong> Duolingo, Babbel.</li>
  </ul>

  <h3 class="sub-title">3.3 Affiliate Integration & Economics</h3>
  <p>Integrates via deeplink APIs with a standard 30-day cookie attribution window. Commission rates range from 15% to 45% per conversion. On the seller/advertiser side, providers can bid for premium placement, BUT a hard threshold applies: a minimum 75% match score is required for any sponsored placement to be displayed.</p>

  <div class="math-block">
    <div class="math-title">Course Match Score — Upskilling relevance and risk mitigation</div>
    $$
    \mathcal{M}(s, c) = 0.35\cdot\Delta_{\text{skill}}(s,c) + 0.25\cdot\text{Align}_{\text{career}}(s,c) + 0.25\cdot\rho_{\text{AI}}(c) + 0.15\cdot B_f(s,c)
    $$
    $$
    \Delta_{\text{skill}}(s,c) = 1 - \frac{|\mathbf{k}_s \cap \mathbf{k}_c|}{|\mathbf{k}_c|} \quad \text{(normalised skill gap fill)}
    $$
    <div class="math-context">A course is shown only if \(\mathcal{M}(s,c) \geq 0.75\). The skill gap fill term \(\Delta_{\text{skill}}\) measures what fraction of required course skills the student does NOT already possess — courses that teach nothing new score low here. The AI resilience term \(\rho_{\text{AI}}(c)\) prioritises courses that build competencies specifically in the student's highest-risk task clusters, making the marketplace a proactive hedge against automation rather than a generic upselling engine.</div>
  </div>

  <h3 class="sub-title">3.4 UI & Revenue Analytics</h3>
  <p>Course cards display the provider logo, price, duration, the calculated Match Score badge, projected salary impact, and a seamless affiliate redirect button. The platform tracks CTR, conversion rate, and revenue per student segment via deeply integrated analytics.</p>
</div>
"""

    sec4 = r"""
<div class="section-part" id="s4">
  <div class="part-label">Section 4</div>
  <h2 class="sec-title">Student Asset Pricing Engine</h2>
  <p>Degrees are priced as assets using rigorous financial engineering. All outputs govern the student's dashboard.</p>

  <h3 class="sub-title">4.1 Net Present Value (NPV)</h3>
  <div class="math-block">
    <div class="math-title">NPV Formula — Core Asset Pricing Engine</div>
    $$
    \text{NPV}(s,p) = \sum_{t=1}^{T} \frac{\hat{S}(s,p,t)\cdot(1-\tau(y_t,\kappa))\cdot P_{\text{visa}}(t,d)\cdot\text{FX}(t,\text{curr})\cdot(1-P_{\text{rec}}(t))\cdot(1-\delta_{\text{AI}}(p,t))}{(1+r(t))^{t}} - C(p,s)\cdot(1+\pi)^{d} - \text{OC}_{\text{PLFS}}(e,\sigma)\cdot d
    $$
    <ul>
      <li>\(\hat{S}(s,p,t)\) = XGBoost+BiLSTM ensemble salary for student \(s\) in program \(p\) at year \(t\)</li>
      <li>\(\tau(y_t,\kappa)\) = marginal tax rate as function of taxable income \(y_t\) and country \(\kappa\) (India: 30% slab; US: 10–37% progressive; Germany: 0–45%)</li>
      <li>\(P_{\text{visa}}(t,d) = \prod_{k=1}^{t}(1-q_k(d))\) = time-varying visa retention (cumulative survival product)</li>
      <li>\(\text{FX}(t) = \text{FX}_0 \cdot e^{(\mu_{\text{FX}} - \frac{1}{2}\sigma_{\text{FX}}^2)t + \sigma_{\text{FX}}W_t}\) = stochastic exchange rate (geometric Brownian motion)</li>
      <li>\(P_{\text{rec}}(t)\) = recession arrival probability (Poisson, \(\lambda=0.08\)/yr), shock = 15% salary cut</li>
      <li>\(\delta_{\text{AI}}(p,t) = D_0(p)\cdot(1-H(p))\cdot(1-e^{-\lambda_{\text{AI}}\cdot t})\) = cumulative AI displacement fraction</li>
      <li>\(r(t) = r_{\text{RBI}}(t) + \beta_{\text{risk}}\cdot\sigma_{\text{mkt}}(t)\) = time-varying real discount rate</li>
      <li>\(C(p,s)\cdot(1+\pi)^d\) = tuition inflated at rate \(\pi = 6.2\%\) (private) or \(3.1\%\) (govt)</li>
      <li>\(\text{OC}_{\text{PLFS}}(e,\sigma)\) = MoSPI PLFS state \(\sigma\) and education-level \(e\) specific opportunity cost</li>
    </ul>
    <div class="math-context">The NPV formula is the platform's core asset-pricing engine. It discounts every rupee of future earnings by four simultaneous risk factors: legal visa retention probability, stochastic INR exchange-rate drift, macroeconomic recession shocks, and compounding AI task displacement. Unlike a simple salary-divided-by-fees ratio, this model treats a degree as a probabilistic 20-year cash flow stream — penalising both the mean and the tail simultaneously.</div>
  </div>

  <h3 class="sub-title">4.2 Internal Rate of Return (IRR)</h3>
  <div class="math-block">
    <div class="math-title">IRR — Internal Rate of Return</div>
    $$
    \text{IRR} = r^* \quad \text{such that} \quad \text{NPV}(r^*) = 0
    $$
    $$
    r^*_{n+1} = r^*_n - \frac{\text{NPV}(r^*_n)}{\text{NPV}'(r^*_n)} \quad \text{(Newton-Raphson iteration)}
    $$
    <div class="math-context">The Internal Rate of Return is the discount rate at which the degree's net present value equals zero — the break-even cost of capital. Solved numerically via Newton-Raphson iteration. A program with IRR > the student's loan interest rate represents a positive arbitrage; one with IRR below represents a guaranteed long-run wealth destruction.</div>
  </div>

  <h3 class="sub-title">4.3 Composite ROI Score</h3>
  <div class="math-block">
    <div class="math-title">Composite ROI Score — Psychometrically Weighted Metric</div>
    $$
    \Omega(s,p) = \frac{\sum_{k=1}^{6} w_k(s)\cdot f_k(s,p)\cdot \text{CF}_k}{\sum_{k=1}^{6} w_k(s)} \times 100
    $$
    $$
    w_{\text{fin}}(s) = 0.25 + 0.08\cdot\theta_{\text{value}}(s), \quad w_{\text{opt}}(s) = 0.18 + 0.05\cdot\theta_{\text{auto}}(s)
    $$
    $$
    f_2(s,p) = \frac{P_{90}^{Y10}(p)}{P_{50}^{Y10}(p)}\cdot\ln\!\left(1 + N_{\text{paths}}(p)\right)
    $$
    $$
    f_3(s,p) = \alpha_{\text{visa}}\cdot V(p) + \alpha_{\text{remote}}\cdot R(p) + \alpha_{\text{geo}}\cdot\left(1 - G_{\text{city}}(p)\right)
    $$
    $$
    f_4(s,p) = 1 - \sum_{i=1}^{8} w_i^{\text{risk}}\cdot V_i(p)
    $$
    $$
    f_6(s,p) = \rho_{\text{alumni}}(p)\cdot T_m(p)\cdot e^{-0.1\cdot\Delta t_{\text{peak}}(p)}
    $$
    <div class="math-context">The weights \(w_k(s)\) are not fixed — they shift with the student's IRT trait vector. A student with high \(\theta_{\text{value}}\) (economic maximiser) receives heavier weight on financial ROI; high \(\theta_{\text{risk}}\) (risk-tolerant) receives lower penalty for the safety dimension. The confidence factor \(\text{CF}_k\) discounts any dimension where underlying data is stale or has low sample size, preventing false precision in the final score.</div>
  </div>

  <h3 class="sub-title">4.4 Loan EMI &amp; Default Probability</h3>
  <div class="math-block">
    <div class="math-title">Monte Carlo EMI Default — 10,000 Path Stress Test</div>
    $$
    \text{EMI}(t) = \frac{P_{\text{loan}}\cdot r_m\cdot(1+r_m)^n}{(1+r_m)^n - 1} \cdot (1 + \xi_{\text{MCLR}}(t))
    $$
    $$
    \xi_{\text{MCLR}}(t) = \xi_{\text{MCLR}}(t-1)\cdot e^{-\kappa\Delta t} + \sigma_{\text{MCLR}}\sqrt{\frac{1-e^{-2\kappa\Delta t}}{2\kappa}}\cdot\epsilon_t \quad (\text{Ornstein-Uhlenbeck})
    $$
    $$
    \hat{S}_i(t) = \hat{S}(t)\cdot(1+\varepsilon_{\text{vol}})\cdot(1-\delta_{\text{AI}}(t))\cdot\mathbf{1}_{\text{rec}}(t)
    $$
    $$
    \mathcal{D}_i = \mathbf{1}\left[\exists\, t \in [1, n]: \text{EMI}(t) > \omega\cdot\frac{\hat{S}_i(t)}{12}\cdot(1-\tau_{\text{eff}})(1-r_{\text{PF}})\right]
    $$
    $$
    \Pr[\text{Default}] = \frac{1}{N}\sum_{i=1}^{N}\mathcal{D}_i \times 100\%, \quad N = 10{,}000
    $$
    $$
    T^{50}_{\text{BEP}} = \text{median}\left\{\min\left\{t: \sum_{k=1}^{t}\left(\frac{\hat{S}_i(k)}{12}\cdot s_r - \text{EMI}(k)\right) \geq C(p,s)\right\}\right\}
    $$
    <div class="math-context">The 10,000-path Monte Carlo stress test exists because the median salary is a dangerously optimistic figure for loan planning. Each path injects three independent shocks: stochastic salary variance (\(\varepsilon_{\text{vol}} \sim \mathcal{N}(0,\sigma_f^2)\)), Poisson recession arrivals (\(\lambda=0.08\)), and AI displacement decay. The floating-rate MCLR component uses an Ornstein-Uhlenbeck process to model mean-reverting bank lending rate drift — because Indian education loans are predominantly floating-rate. Default is flagged when EMI exceeds 38% of net take-home in any simulation year.</div>
  </div>
</div>
"""

    sec5 = r"""
<div class="section-part" id="s5">
  <div class="part-label">Section 5</div>
  <h2 class="sec-title">Flagship AI Risk Index</h2>
  <p>A rigorous modeling of automation and market saturation risks applied to future earnings.</p>

  <h3 class="sub-title">5.1 Task Automation Decay</h3>
  <div class="math-block">
    <div class="math-title">Task Automation Decay — Logistic S-Curve Diffusion</div>
    $$
    \delta_{\text{AI}}(p,t) = D_0(p)\cdot\left(1-H(p)\right)\cdot\left(1-e^{-\lambda_{\text{AI}}\cdot t}\right)\cdot M(p,t)
    $$
    $$
    M(p,t) = \frac{1}{1+e^{-k(t-t_0(p))}} \quad \text{(sector-specific logistic adoption curve)}
    $$
    <div class="math-context">The displacement fraction \(\delta_{\text{AI}}\) follows an S-curve, not a linear decay, because technology adoption in Indian labour markets follows logistic diffusion: slow initially (resistance, infrastructure gaps), rapid at mid-adoption (vendor scaling), plateauing at saturation. The market adoption multiplier \(M(p,t)\) is calibrated per sector using GenAI penetration data from Naukri job posting NLP analysis.</div>
  </div>

  <h3 class="sub-title">5.2 Eight-Vector Risk Surface</h3>
  <div class="math-block">
    <div class="math-title">Composite Risk Score — Ridge Regression on Salary Stability</div>
    $$
    \mathcal{R}(p) = \sum_{i=1}^{8} w_i^{\mathcal{R}}\cdot V_i(p), \quad \text{where } \mathbf{w}^{\mathcal{R}} = \arg\min_{\mathbf{w}} \left\|\mathbf{V}\mathbf{w} - \mathbf{y}_{\text{stability}}\right\|_2^2 + \lambda\left\|\mathbf{w}\right\|_2^2
    $$
    <div class="math-context">The eight risk vector weights are not manually assigned — they are learned via ridge regression on five-year salary stability outcomes across the training cohort. This means the weights reflect which risk vectors actually predicted real-world salary instability, not editorial judgment.</div>
  </div>
  <p>The 8 vectors are:</p>
  <ol>
    <li><strong>AI Automation Prob:</strong> Oxford O*NET SOC→NCO crosswalk.</li>
    <li><strong>Salary Volatility:</strong> σ/μ of AmbitionBox 5yr salary time-series.</li>
    <li><strong>Industry Cyclicality:</strong> RBI KLEMS 10yr sector output variance.</li>
    <li><strong>Credential Inflation:</strong> Δ(Graduate_supply) / Δ(Job_openings) from NIRF+Naukri.</li>
    <li><strong>Geographic Concentration:</strong> Gini coefficient across top-12 cities (Naukri data).</li>
    <li><strong>Regulatory Risk:</strong> Public sector pay-band exposure sensitivity.</li>
    <li><strong>Physical Health Risk:</strong> Indian Labour Bureau occupational hazard index.</li>
    <li><strong>Work-Life Quality:</strong> AmbitionBox WLB ratings, Cronbach α ≥ 0.74.</li>
  </ol>

  <h3 class="sub-title">5.3 Job Security Score (JSS)</h3>
  <div class="math-block">
    <div class="math-title">Job Security Score — Logistic Transform of Resilience Tensor</div>
    $$
    \text{JSS}(s,p) = \sigma\!\left(A\cdot\Theta_{\text{res}}(p) + B\cdot\theta_{\text{ai}}(s) + C\cdot T_f(p) - D\cdot\delta_{\text{AI}}(p,0)\right)\times 100
    $$
    $$
    \sigma(x) = \frac{1}{1+e^{-x}}, \quad \text{JSS} \in [35, 99]
    $$
    $$
    \Theta_{\text{res}}(p) = w_{\phi}\cdot\phi_{\text{phys}} + w_{\gamma}\cdot\gamma_{\text{cog}} + w_{\eta}\cdot\eta_{\text{soc}} + w_{\rho}\cdot\rho_{\text{reg}}
    $$
    $$
    \hat{L}_{5y}(p,s) = \max\!\left(1.0,\;\min\!\left(35.0,\;(100-\text{JSS})\cdot0.35\cdot(1+\sigma_f\cdot0.5)\right)\right)
    $$
    $$
    \hat{L}_{10y}(p,s) = \max\!\left(2.5,\;\min\!\left(50.0,\;(100-\text{JSS})\cdot0.60\cdot(1+M(p,10))\right)\right)
    $$
    <div class="math-context">JSS is a logistic function — not a lookup table. The logistic transform maps an unbounded linear combination onto (0,1), then scales to (35,99) to prevent the degenerate extremes of 0 (complete displacement) and 100 (impossible permanence). The resilience tensor \(\Theta_{\text{res}}\) separates four independently measurable human capability dimensions: physical task complexity (non-automatable manual dexterity), cognitive novelty (non-routine problem solving), social empathy (uncodifiable relational intelligence), and regulatory moat (legal protection from technological substitution).</div>
  </div>

  <h3 class="sub-title">5.4 Zero-Hardcoding Mandate</h3>
  <div class="callout callout-warning">
    <div class="callout-title">Engineering Constraint</div>
    <p>Zero-hardcoding for career data. All vectors are updated weekly via Airflow DAGs. The pipeline utilizes zero-shot NLP for arbitrary career string resolution. Models follow Champion/Challenger promotion: promote only if <code>MAPE_new &lt; MAPE_champion</code> AND <code>R²_new &gt; R²_champion</code>.</p>
  </div>
</div>
"""

    sec6 = r"""
<div class="section-part" id="s6">
  <div class="part-label">Section 6</div>
  <h2 class="sec-title">3PL IRT CAT Engine</h2>
  <p>The Psychometric assessment is powered by a Three-Parameter Logistic (3PL) Item Response Theory (IRT) Computerized Adaptive Testing (CAT) framework.</p>

  <h3 class="sub-title">6.1 Mathematical Formulation</h3>
  <div class="math-block">
    <div class="math-title">3PL IRT CAT — Psychometric Adaptive Testing</div>
    $$
    P(x_{ij}=1\mid\boldsymbol{\theta}_j,a_i,b_i,c_i) = c_i + \frac{1-c_i}{1+e^{-a_i(\boldsymbol{\theta}_j - b_i)}}
    $$
    $$
    \mathbf{I}(\boldsymbol{\theta}) = \sum_{i}\frac{a_i^2\cdot P_i(\boldsymbol{\theta})\cdot Q_i(\boldsymbol{\theta})}{(P_i(\boldsymbol{\theta})-c_i)^2}
    $$
    $$
    \hat{\boldsymbol{\theta}}_{\text{EAP}} = \frac{\int \boldsymbol{\theta}\cdot L(\mathbf{X}_{1:t}\mid\boldsymbol{\theta})\cdot\pi(\boldsymbol{\theta})\,d\boldsymbol{\theta}}{\int L(\mathbf{X}_{1:t}\mid\boldsymbol{\theta})\cdot\pi(\boldsymbol{\theta})\,d\boldsymbol{\theta}} \quad \approx \text{Gauss-Hermite quadrature (41 nodes)}
    $$
    $$
    \text{Stop when: } \text{SE}(\hat{\boldsymbol{\theta}}) = \frac{1}{\sqrt{\sum_i I_i(\hat{\boldsymbol{\theta}})}} < 0.35 \quad \text{or} \quad n_{\text{items}} \geq 8
    $$
    <div class="math-context">The 3-parameter logistic model adds a guessing parameter \(c_i\) that prevents high-ability students from being penalised for careless errors on easy items. The EAP estimator integrates the full posterior distribution (not just the mode), producing calibrated uncertainty estimates rather than point estimates. Gauss-Hermite quadrature with 41 nodes ensures the numerical integral is accurate to machine precision for the smooth Gaussian prior \(\pi(\theta)\).</div>
  </div>

  <h3 class="sub-title">6.2 Engine Mechanics</h3>
  <p>The engine assesses 4 latent traits simultaneously, all constrained within the range <code>[-3.0, +3.0]</code>:</p>
  <ul>
    <li><strong>θ_risk:</strong> Risk tolerance.</li>
    <li><strong>θ_value:</strong> Value optimization / cost sensitivity.</li>
    <li><strong>θ_autonomy:</strong> Desire for self-directed work environments.</li>
    <li><strong>θ_ai:</strong> AI adaptability and technological resilience.</li>
  </ul>
  <div class="math-block">
    Fit_score = Σ_d (w_d * θ_d * Program_archetype_d)
  </div>
</div>
"""

    sec7 = r"""
<div class="section-part" id="s7">
  <div class="part-label">Section 7</div>
  <h2 class="sec-title">ML Model Specifications</h2>

  <h3 class="sub-title">7.1 XGBoost Salary Predictor</h3>
  <ul>
    <li><strong>Features:</strong> degree_field, tier, college_type, nirf_rank, naac_grade, established_year, duration_years, placement_rate_pct, ai_automation_prob, salary_volatility, total_cost_of_degree, industry_cyclicality, geographic_concentration.</li>
    <li><strong>Output:</strong> Percentiles [p10, p25, p50, p75, p90] at time intervals [Y1, Y2, Y3, Y5, Y7, Y10, Y15, Y20].</li>
    <li><strong>Loss Function:</strong> Pinball/Quantile regression loss per percentile.</li>
    <li><strong>Hyperparameters:</strong> max_depth=6, learning_rate=0.05, n_estimators=400, min_child_weight=5, subsample=0.8, colsample_bytree=0.8, reg_lambda=1.5.</li>
    <li><strong>Validation:</strong> 80/20 temporal split. Targets: MAPE &lt; 12% for Y1, &lt; 18% for Y5.</li>
  </ul>

  <h3 class="sub-title">7.2 Bi-LSTM Trajectory Model</h3>
  <ul>
    <li><strong>Architecture:</strong> 2-layer BiLSTM, hidden_size=128, dropout=0.25.</li>
    <li><strong>Input:</strong> Sequence of [economic_indicators_t, placement_data_t, job_postings_t] over a 5-year trailing window.</li>
    <li><strong>Output:</strong> 20-year monthly salary percentile distribution.</li>
    <li><strong>Fallback Mechanism:</strong> <code>salary_t = salary_Y1 * (1+CAGR)^(t-1)</code>.</li>
  </ul>

  <h3 class="sub-title">7.3 Markov Career Transition Matrix</h3>
  <ul>
    <li><strong>States:</strong> [Entry, Mid-Senior, Senior, Leadership, Founder/Exit, Attrition].</li>
    <li><strong>Transition matrix P[i,j]:</strong> Derived from alumni tracking and AmbitionBox seniority metadata.</li>
    <li><strong>Evolution:</strong> <code>π(t) = π(0) * P^t</code>.</li>
  </ul>

  <h3 class="sub-title">7.4 Retraining Pipeline</h3>
  <div class="callout callout-info">
    <div class="callout-title">MLOps Lifecycle</div>
    <p><strong>Trigger:</strong> Weekly Airflow cron OR anomaly_flagged &gt; 10% in a batch.</p>
    <p><strong>Steps:</strong> Pull DB → FeatureEngine → XGBoost retrain → LSTM retrain → Evaluate held-out 20% → Promote if metrics improve → Recompute roi_scores + salary_trajectories → Invalidate cache → Notify admin.</p>
  </div>
</div>
"""

    sec8 = r"""
<div class="section-part" id="s8">
  <div class="part-label">Section 8</div>
  <h2 class="sec-title">The Student Intelligence Layer: A Hybrid ML-LLM Architecture</h2>
  <p>The Student Intelligence Layer is the platform's most distinctive engineering achievement. Unlike generic AI chatbots that treat every user as a blank slate, this architecture functions as a continuously learning personal cognitive model — a student-conditioned mini-LLM whose reasoning is grounded in the platform's full quantitative ML pipeline. It combines the precision of the XGBoost/BiLSTM econometric models with the generative reasoning capability of Google Gemini 3.7 Flash, creating a system that reasons like an actuary and communicates like an expert advisor.</p>

  <h3 class="sub-title">8.1 The Two-Layer Intelligence Architecture</h3>
  <h4>Layer 1 — The Quantitative Foundation (ML Pipeline as Structured Memory):</h4>
  <ul>
    <li>The XGBoost salary predictor provides structured salary distributions [P10, P25, P50, P75, P90] at each career horizon. These are NOT sent to Gemini as raw numbers — they are converted into semantic embeddings that describe the full distributional shape, volatility, and confidence interval.</li>
    <li>The Markov chain career transition model provides transition probability matrices π(t) = π(0)·P^t. These inform Gemini about the probabilistic career graph — what fraction of graduates are in leadership vs. attrition at Year 10, and which transitions are blocked by degree/tier combinations.</li>
    <li>The IRT trait vector [θ_risk, θ_value, θ_autonomy, θ_ai] is embedded as a persistent student persona descriptor in the system prompt, making Gemini's entire reasoning conditioned on this student's cardinal preferences.</li>
    <li>The Monte Carlo simulation output (P10/P50/P90 net worth curves, breakeven timeline, default probability) is injected as structured context, giving Gemini access to the full stochastic outcome space — not just point estimates.</li>
  </ul>
  
  <h4>Layer 2 — The Generative Reasoning Engine (Gemini 3.7 Flash):</h4>
  <ul>
    <li>Operates on top of the ML pipeline outputs as structured context</li>
    <li>1M+ token context window maintains full longitudinal memory: every past query, every rejected option, every updated exam score, every budget revision</li>
    <li>Google Search grounding (require_grounding=True) ensures all factual claims about specific college cutoffs, fee structures, or placement statistics are verified against live web sources with citations</li>
    <li>The system prompt enforces strict fiduciary persona: mathematically rigorous, never sycophantic, challenges user assumptions with quantitative counterarguments</li>
  </ul>

  <h3 class="sub-title">8.2 The Context Injection Protocol (How ML Talks to LLM)</h3>
  <p>At each conversation turn, the following structured context packet is injected:</p>
  <div class="math-block">
CONTEXT_PACKET = {<br>
  student_id: token_uuid,<br>
  irt_traits: {θ_risk, θ_value, θ_autonomy, θ_ai},<br>
  financial_constraints: {budget_inr, loan_max, max_emi, loan_tenure},<br>
  academic_reality: {jee_percentile, board_marks, category, home_state},<br>
  top_programs: [<br>
    {program_id, college, degree, roi_score, npv_inr, p10_salary_y1,<br>
     p50_salary_y5, p90_salary_y10, default_probability_pct,<br>
     jss_score, ai_risk_label, breakeven_months}<br>
  ],<br>
  monte_carlo_summary: {p10_networth_y10, p50_networth_y10, p90_networth_y10, median_breakeven_months},<br>
  career_path_dag: {nodes: [...], edges: [...]},<br>
  conversation_history: [...last_20_turns],<br>
  rejected_options: [...programs or paths student declined],<br>
  live_market_data: {top_hiring_companies_this_month, avg_salary_change_ytd, new_regulation_flags}<br>
}
  </div>
  <p>This packet is the bridge between the ML pipeline and Gemini. It means Gemini never hallucinates salary numbers — it reads them from the quantitative layer. It means Gemini knows the student's risk tolerance before they say a word. It means Gemini can reference a program the student rejected 6 weeks ago and explain why their new request contradicts that earlier stated preference.</p>

  <h3 class="sub-title">8.3 The Anti-Yes-Man Enforcement Layer</h3>
  <p>The system prompt includes hard behavioral constraints enforced at generation time:</p>
  <div class="math-block">
SYSTEM_PROMPT_CONSTRAINTS = [<br>
  "You are a fiduciary strategic calculator. Your primary obligation is to the student's 20-year net worth, not their immediate emotional comfort.",<br>
  "NEVER validate a financial decision without citing the quantitative model output. If the P10 scenario results in debt distress, you MUST state it explicitly.",<br>
  "If the student's stated goal contradicts their IRT risk profile, flag the contradiction explicitly with the specific θ value.",<br>
  "NEVER invent salary figures. All salary claims must reference the ML model output in CONTEXT_PACKET or a live-grounded web source.",<br>
  "When a student asks about a program, lead with the downside (P10 scenario and default probability) before discussing upside.",<br>
  "Challenge prestige bias: if a student prefers a higher-cost option with lower NPV, quantify the exact opportunity cost in INR."<br>
]
  </div>

  <h3 class="sub-title">8.4 The Living Path Graph (DAG as Student Memory)</h3>
  <p>Stored in PostgreSQL as JSONB (personal_intelligence.path_graph). The DAG has:</p>
  <ul>
    <li><strong>Academic nodes:</strong> current standing, exam targets, score gaps</li>
    <li><strong>Decision nodes:</strong> program choices under evaluation</li>
    <li><strong>Skill nodes:</strong> competencies to develop for target roles</li>
    <li><strong>Gate nodes:</strong> qualifying conditions (e.g., 'requires JEE rank &lt; 5000')</li>
    <li><strong>Outcome nodes:</strong> projected roles at Y1, Y5, Y10</li>
  </ul>
  <p>The Markov transition model populates edge weights between role nodes. The IRT engine populates the persona vector at the root. The XGBoost model populates salary distributions at outcome nodes. Gemini reads this entire DAG at each turn — making it genuinely stateful and longitudinally coherent across months of student interaction.</p>

  <h3 class="sub-title">8.5 Continuous Intelligence Improvement (The Mini-LLM Loop)</h3>
  <p>The intelligence layer improves over time through three feedback mechanisms:</p>
  <ol>
    <li><strong>Student Validation Signals:</strong> When a student confirms a plan (e.g., applies to a recommended program), this positive signal updates the feature weights in the recommendation module via online learning (gradient step on the ranking loss).</li>
    <li><strong>Outcome Anchoring:</strong> When scraper data reveals new placement statistics for a program the student chose, the DAG outcome nodes are updated and Gemini is informed in the next session.</li>
    <li><strong>Market Signal Integration:</strong> Weekly Airflow scraping triggers a re-evaluation of all active student DAGs where live market data (new job postings, layoff announcements, RBI rate changes) materially changes the NPV calculation by more than 5%.</li>
  </ol>
</div>
"""

    sec9 = r"""
<div class="section-part" id="s9">
  <div class="part-label">Section 9</div>
  <h2 class="sec-title">Caliber-Calibrated Admissions Engine</h2>
  <p>Filters colleges systematically using standard normal distributions mapping student expectations to historical closing ranks.</p>

  <h3 class="sub-title">9.1 Cutoff Delta Formula</h3>
  <div class="math-block">
    Z = (Historical_Closing_Rank - Student_Expected_Rank) / σ_exam_variability
  </div>
  <ul>
    <li><strong>Z &gt; +1.5:</strong> Safety (Probability &gt; 93%)</li>
    <li><strong>-0.5 ≤ Z ≤ +1.5:</strong> Target (50-90%)</li>
    <li><strong>-1.5 ≤ Z &lt; -0.5:</strong> Reach (10-50%)</li>
    <li><strong>Z &lt; -1.5:</strong> Pruned (Never shown)</li>
  </ul>

  <h3 class="sub-title">9.2 Portfolio Tiers & Constraints</h3>
  <p>The engine yields 4 specific tiers:</p>
  <ol>
    <li><strong>Reach</strong> (15-25% of recommended portfolio)</li>
    <li><strong>Target</strong> (60-75%)</li>
    <li><strong>Safety</strong> (90-98%)</li>
    <li><strong>Hidden Gem:</strong> Automatically flagged if ROI &gt; 85 and Total Fees &lt; ₹6 Lakhs.</li>
  </ol>
  
  <p><strong>Constraints applied at runtime:</strong></p>
  <ul>
    <li>State quota modeling.</li>
    <li>Category reservations (SC/ST/OBC/EWS).</li>
    <li>Branch vs College prestige trade-off (conditioned dynamically on <code>θ_ai</code>).</li>
    <li><strong>Financial pruning:</strong> If <code>Total_cost &gt; student_budget * 1.3</code>, the option is strictly pruned from the portfolio.</li>
  </ul>
</div>
"""

    sec10 = r"""
<div class="section-part" id="s10">
  <div class="part-label">Section 10</div>
  <h2 class="sec-title">Global Degree ROI Engine</h2>
  <p>Applies the core NPV formula globally, adjusting for immigration physics and localized costs of living.</p>

  <h3 class="sub-title">10.1 Immigration Visa Probabilities</h3>
  <p>For US H-1B, probabilities are cumulative based on lotteries:</p>
  <div class="math-block">
    <div class="math-title">Global NPV with H-1B — Lottery Probability and Tax Drag</div>
    $$
    P_{\text{H-1B}}^{(n)} = 1-(1-p_{\text{lottery}})^n, \quad p_{\text{lottery}}\approx0.25
    $$
    $$
    n=3\text{ (STEM OPT)}:\quad P_{\text{H-1B}}^{(3)} = 1-0.75^3 = 57.8\%
    $$
    $$
    \text{Net}_{\text{savings}}(c,t) = \hat{S}(p,c,t)\cdot(1-\tau_{\text{total}}(c)) - 12\cdot r_{\text{rent}}(c) - 12\cdot r_{\text{living}}(c)
    $$
    $$
    \tau_{\text{total}}(c) = \tau_{\text{fed}}(y) + \tau_{\text{state}}(c,y) + \tau_{\text{FICA}}
    $$
    <div class="math-context">The H-1B lottery probability is modeled as independent Bernoulli trials — each attempt has approximately 25% probability under the regular cap. STEM OPT allows three attempts (3-year extension), yielding 57.8% cumulative probability. City-level tax drag \(\tau_{\text{total}}\) is computed from the federal progressive schedule, state-specific rate, and FICA contribution — producing materially different net savings between San Francisco (\(\tau_{\text{total}} \approx 40\%\)) and Austin TX (\(\tau_{\text{total}} \approx 23\%\)) for the same gross salary.</div>
  </div>
  <p>STEM designated degrees allow 3 attempts (n=3) yielding ~57.8%. Non-STEM allows 1 attempt (n=1) yielding ~25%.</p>
  <h3 class="sub-title">10.2 Cost of Living & Tax Drag</h3>
  <ul>
    <li><strong>SF (Bay Area):</strong> τ ≈ 40%, rent $3200/mo.</li>
    <li><strong>Austin, TX:</strong> τ ≈ 23%, rent $1350/mo.</li>
    <li><strong>Munich, Germany:</strong> τ ≈ 32%, rent €1400/mo.</li>
  </ul>

  <h3 class="sub-title">10.3 Assistantship Probability Model</h3>
  <div class="math-block">
    P_GRA = f(ranking, department_size, research_background, GPA)
  </div>
  <p>Successful funding models apply a 100% tuition waiver + $1800-$2800/month stipend to the NPV baseline.</p>

  <h3 class="sub-title">10.4 Global Tiers Matrix</h3>
  <ul>
    <li><strong>Value Kings:</strong> Highly ranked US Public Universities with strong STEM pipelines.</li>
    <li><strong>Zero-Tuition Arbitrage:</strong> German, Nordic, and select EU public institutions.</li>
    <li><strong>Convex Elite:</strong> Ivy League, CMU, Stanford, MIT (extremely high upfront cost, unbounded P90 upside).</li>
    <li><strong>Danger Zone:</strong> Expensive diploma mills with low H-1B conversion rates.</li>
  </ul>
</div>
"""

    sec11 = r"""
<div class="section-part" id="s11">
  <div class="part-label">Section 11</div>
  <h2 class="sec-title">Global Portfolio Builder</h2>
  <p>For students aiming at the Convex Elite and global top-100, standard metrics fail. This module engineers competitive edge profiles.</p>

  <h3 class="sub-title">11.1 The Spike Score</h3>
  <div class="math-block">
    <div class="math-title">Spike Authenticity Score — Portfolio Differentiation Metric</div>
    $$
    \mathcal{A}_{\text{spike}}(s) = \sum_{a \in \mathcal{A}_s} \frac{1}{N_a}\cdot E_a\cdot D_a\cdot\cos\!\left(\mathbf{v}_a,\,\mathbf{u}_{\text{major}}\right)
    $$
    $$
    D_a = m_a \cdot \mu_a, \quad E_a = \text{rank}(\text{award}_a) \cdot \text{prestige}(\text{body}_a)
    $$
    <div class="math-context">Each activity \(a\) in the student's portfolio is scored on four independent axes: rarity (\(1/N_a\) = inverse of how many Indian applicants share this activity type), external validation (award rank × institutional prestige of the awarding body), depth (months invested × measurable impact metric), and major alignment (cosine similarity between the activity's skill vector and the target major's prerequisite vector). The aggregate spike score determines whether a student has a genuinely differentiated profile or a generic one.</div>
  </div>
  <ul>
    <li><strong>Distinctiveness:</strong> <code>1 / N</code> (where N = Indian students applying with the exact same extracurricular activity).</li>
    <li><strong>External Validation:</strong> <code>award_rank * awarding_institution_prestige</code>.</li>
    <li><strong>Depth:</strong> <code>months_invested * measurable_impact_metric</code>.</li>
    <li><strong>Major Alignment:</strong> <code>cosine_similarity(activity_vector, major_prerequisite_vector)</code>.</li>
  </ul>

  <h3 class="sub-title">11.2 Narrative Structuring</h3>
  <p>Enforces the X-Y-Z Formula for resume building: <em>"Accomplished [X] as measured by [Y] by doing [Z]"</em>.</p>
  <p><strong>Target Objective:</strong> Portfolio must contain at least 3 activities scoring ≥ 8 on impact + distinctiveness combined.</p>

  <h3 class="sub-title">11.3 The 4-Year Framework</h3>
  <ul>
    <li><strong>Grade 9:</strong> Exploration phase.</li>
    <li><strong>Grade 10:</strong> Hypothesis generation + Competition entry.</li>
    <li><strong>Grade 11:</strong> Peak achievement + External Validation.</li>
    <li><strong>Grade 12:</strong> Synthesis + Application drafting.</li>
  </ul>
  <div class="callout callout-risk">
    <div class="callout-title">Fraud Detection</div>
    <p>Automated predatory journal detection: Cross-checks published papers against Beall's list and known pay-to-publish entities, instantly zeroing the external validation score.</p>
  </div>
</div>
"""

    sec12 = r"""
<div class="section-part" id="s12">
  <div class="part-label">Section 12</div>
  <h2 class="sec-title">API Integrations</h2>
  <p>The entire intelligence platform is fueled by real-time and batch API pipelines. Hardcoding data is strictly prohibited.</p>

  <div class="tbl-wrap">
    <div class="tbl-caption">Table 12.1 — External Data Connectors</div>
    <table>
      <thead>
        <tr>
          <th>Source / API</th>
          <th>Frequency</th>
          <th>Data Extracted</th>
          <th>Confidence</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><strong>NIRF</strong></td><td>Annual / Weekly</td><td>placement_rate, median_salary, student_faculty_ratio via Crawl4AI PDF scrape</td><td><span class="good">High</span></td></tr>
        <tr><td><strong>AmbitionBox</strong></td><td>Weekly scrape</td><td>Salary by exp band (1/3/5/7/10yr+), WLB ratings</td><td><span class="mid-val">Medium</span></td></tr>
        <tr><td><strong>Naukri.com</strong></td><td>Weekly Playwright</td><td>job_title, company, city, salary_min/max, skills_required, experience</td><td><span class="mid-val">Medium</span></td></tr>
        <tr><td><strong>Indeed India</strong></td><td>Weekly scrape</td><td>Cross-validation for Naukri dataset</td><td><span class="mid-val">Medium</span></td></tr>
        <tr><td><strong>MoSPI PLFS</strong></td><td>Quarterly download</td><td>employment_rates, earnings_by_qualification (mospi.gov.in)</td><td><span class="good">High</span></td></tr>
        <tr><td><strong>RBI API</strong></td><td>Monthly</td><td>repo_rate, CPI, GDP_growth, KLEMS_sector</td><td><span class="good">High</span></td></tr>
        <tr><td><strong>World Bank ICP</strong></td><td>Quarterly</td><td>PPP_factor (~23.1 INR/USD) via databank.worldbank.org</td><td><span class="good">High</span></td></tr>
        <tr><td><strong>Reddit PRAW</strong></td><td>Weekly</td><td>r/india, r/CAstudents. BERT NER salary extraction.</td><td><span class="bad">Low</span></td></tr>
        <tr><td><strong>Internshala</strong></td><td>Weekly scrape</td><td>Internship stipends, skills demanded</td><td><span class="mid-val">Medium</span></td></tr>
        <tr><td><strong>PayScale India</strong></td><td>Monthly</td><td>Compensation by role/experience</td><td><span class="mid-val">Medium</span></td></tr>
        <tr><td><strong>BLS OES (US)</strong></td><td>Annual</td><td>US median wages by SOC code</td><td><span class="good">High</span></td></tr>
        <tr><td><strong>Levels.fyi</strong></td><td>Weekly</td><td>Total Compensation (TC) by company/level for global tech</td><td><span class="good">High</span></td></tr>
        <tr><td><strong>Glassdoor</strong></td><td>Weekly</td><td>Salary reports, interview data</td><td><span class="mid-val">Medium</span></td></tr>
        <tr><td><strong>Google Gemini API</strong></td><td>Real-time</td><td>gemini-flash-experimental; personalized intelligence, grounded Q&A</td><td><span class="good">High</span></td></tr>
        <tr><td><strong>Tavily Search API</strong></td><td>Real-time</td><td>Real-time fallback for grounding</td><td><span class="good">High</span></td></tr>
        <tr><td><strong>Jina Reader API</strong></td><td>On-demand</td><td>URL→markdown conversion (r.jina.ai)</td><td><span class="good">High</span></td></tr>
        <tr><td><strong>Crawl4AI</strong></td><td>Async web crawler</td><td>PDF extraction and deep scraping</td><td><span class="mid-val">Medium</span></td></tr>
        <tr><td><strong>Affiliate APIs</strong></td><td>Continuous</td><td>Coursera, Udemy, Unacademy, LinkedIn, Amazon, Physics Wallah, Allen</td><td><span class="good">High</span></td></tr>
      </tbody>
    </table>
  </div>
</div>
"""

    sec13 = r"""
<div class="section-part" id="s13">
  <div class="part-label">Section 13</div>
  <h2 class="sec-title">Database Schema (PostgreSQL)</h2>
  <p>A normalized, high-performance schema designed for rapid analytics and machine learning pipeline integration.</p>

  <h3 class="sub-title">13.1 Core Entity Tables</h3>
  <ul>
    <li><code>college</code>: id, name, location, tier, ownership, established_year, naac_grade, created_at, updated_at</li>
    <li><code>degrees</code>: id, name, field, level, created_at</li>
    <li><code>programs</code>: id, college_id, degree_id, duration_years, total_cost, capacity, created_at, updated_at</li>
  </ul>

  <h3 class="sub-title">13.2 Analytics & ML Tables</h3>
  <ul>
    <li><code>data_points</code>: id, program_id, source_api, raw_json, extracted_at</li>
    <li><code>roi_scores</code>: id, program_id, composite_roi, financial_roi_norm, optionality, risk_score, mobility, last_calculated</li>
    <li><code>salary_trajectories</code>: id, program_id, p10_array, p25_array, p50_array, p75_array, p90_array, created_at</li>
    <li><code>risk_indicators</code>: id, program_id, automation_prob, volatility, cyclicality, inflation, concentration, created_at</li>
    <li><code>placement_data</code>: id, program_id, year, placement_pct, median_salary, source, verified</li>
    <li><code>cost_data</code>: id, program_id, tuition, hostel, exam_prep, opportunity_cost, calculated_at</li>
  </ul>

  <h3 class="sub-title">13.3 User & Operational Tables</h3>
  <ul>
    <li><code>student_reports</code>: id, user_id, target_programs_jsonb, generated_at, pdf_url</li>
    <li><code>personal_intelligence</code>: id, user_id, path_graph (JSONB), context_stack (JSONB), last_interaction</li>
    <li><code>portfolio_profiles</code>: id, user_id, spike_score, activities_jsonb, validated_at</li>
  </ul>

  <h3 class="sub-title">13.4 Pipeline State Tables</h3>
  <ul>
    <li><code>scrape_runs</code>: id, target_api, status, records_fetched, started_at, completed_at</li>
    <li><code>anomalies</code>: id, table_name, record_id, flag_reason, resolved, created_at</li>
    <li><code>model_versions</code>: id, model_name, mape, r2_score, is_champion, deployed_at</li>
  </ul>

  <h3 class="sub-title">13.5 Extracted Third-Party Data Tables</h3>
  <ul>
    <li><code>job_postings</code>: id, source, title, min_salary, max_salary, experience, skills_jsonb, scraped_at</li>
    <li><code>reddit_extractions</code>: id, subreddit, post_id, extracted_salary, confidence, processed_at</li>
    <li><code>macro_indicators</code>: id, indicator_type, value, date, source</li>
    <li><code>course_marketplace</code>: id, provider, course_name, price, affiliate_url, skill_tags_jsonb</li>
    <li><code>course_impressions</code>: id, user_id, course_id, match_score, clicked, converted, created_at</li>
    <li><code>global_programs</code>: id, college_name, country, tuition_usd, h1b_conversion_rate, created_at</li>
  </ul>
</div>
"""

    sec14 = r"""
<div class="section-part" id="s14">
  <div class="part-label">Section 14</div>
  <h2 class="sec-title">Website Page Specifications</h2>

  <div class="tbl-wrap">
    <div class="tbl-caption">Table 14.1 — Frontend Architecture</div>
    <table>
      <thead>
        <tr>
          <th>Route</th>
          <th>Data Shown & Interactions</th>
          <th>Backend Endpoints</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>/</code></td>
          <td>Hero banner, value proposition, top 3 global ROI institutions, search bar.</td>
          <td><code>GET /api/v1/featured</code>, <code>GET /api/v1/search/autocomplete</code></td>
        </tr>
        <tr>
          <td><code>/analyze</code></td>
          <td>IRT Psychometric questionnaire interface. Trait sliders and scenario questions.</td>
          <td><code>POST /api/v1/irt/next-item</code>, <code>POST /api/v1/irt/submit</code></td>
        </tr>
        <tr>
          <td><code>/report/:token</code></td>
          <td>Personalized ROI dashboard. NPV charts, 20-year salary curve, Job Security Score.</td>
          <td><code>GET /api/v1/report/{token}</code>, <code>GET /api/v1/charts/trajectory</code></td>
        </tr>
        <tr>
          <td><code>/explore</code></td>
          <td>Faceted search (cost, ROI, location, AI risk) for all programs.</td>
          <td><code>POST /api/v1/explore/filter</code></td>
        </tr>
        <tr>
          <td><code>/college/:id</code></td>
          <td>Detailed breakdown of a specific institution, placement trends, hidden costs.</td>
          <td><code>GET /api/v1/college/{id}</code></td>
        </tr>
        <tr>
          <td><code>/compare</code></td>
          <td>Side-by-side table of up to 4 programs. Diff highlighting for ROI and costs.</td>
          <td><code>POST /api/v1/compare</code></td>
        </tr>
        <tr>
          <td><code>/advisor</code></td>
          <td>Copilot Chat interface. Gemini-driven multi-turn dialogue with chart injections.</td>
          <td><code>POST /api/v1/chat/message</code>, <code>GET /api/v1/chat/history</code></td>
        </tr>
        <tr>
          <td><code>/methodology</code></td>
          <td>Static deep dive into mathematical models, ML architecture, and data sources.</td>
          <td>None (Static/SSG)</td>
        </tr>
        <tr>
          <td><code>/global</code></td>
          <td>Global ROI engine interface. Visa probabilities, PPP conversions, map UI.</td>
          <td><code>GET /api/v1/global/metrics</code></td>
        </tr>
        <tr>
          <td><code>/portfolio-builder</code></td>
          <td>Extracurricular tracking. Spike score real-time calculator, narrative generator.</td>
          <td><code>POST /api/v1/portfolio/calculate-spike</code>, <code>POST /api/v1/portfolio/save</code></td>
        </tr>
        <tr>
          <td><code>/marketplace</code></td>
          <td>Affiliate course recommendations sorted by Match Score.</td>
          <td><code>POST /api/v1/marketplace/recommend</code></td>
        </tr>
        <tr>
          <td><code>/admin</code></td>
          <td>Internal dashboard. Airflow DAG status, model metrics, anomaly queues.</td>
          <td><code>GET /api/admin/system-health</code>, <code>POST /api/admin/retrain</code></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
"""

    sec15 = r"""
<div class="section-part" id="s15">
  <div class="part-label">Section 15</div>
  <h2 class="sec-title">Monetization Strategy</h2>
  <p>The business model leverages freemium SaaS dynamics mixed with high-margin B2B API licensing and performance affiliate marketing.</p>

  <h3 class="sub-title">15.1 Free Tier</h3>
  <ul>
    <li>Program exploration and filtering.</li>
    <li>Top-3 career overview based on simple metrics.</li>
    <li>5 AI Advisor copilot messages per month.</li>
    <li>Marketplace browsing (yields affiliate revenue even from free users).</li>
  </ul>

  <h3 class="sub-title">15.2 Premium Tier</h3>
  <p><strong>Pricing:</strong> ₹499 one-time generation fee OR ₹199/month subscription.</p>
  <ul>
    <li>Full 20-year salary trajectory curves.</li>
    <li>Advanced Loan Stress Test and Monte Carlo default simulation.</li>
    <li>Unlimited AI Copilot interactions.</li>
    <li>Access to the Global ROI engine (Visa probabilities + local taxes).</li>
    <li>Portfolio Builder tool access.</li>
    <li>Downloadable, watermark-free PDF comprehensive report.</li>
  </ul>

  <h3 class="sub-title">15.3 Affiliate Integration (B2B2C)</h3>
  <p>As described in Section 3, 15-45% commission is generated on upskilling, certification, and language courses. Premium placement fees are charged to providers achieving &gt;75% Match Score.</p>

  <h3 class="sub-title">15.4 Enterprise & B2B Licensing</h3>
  <ul>
    <li><strong>Coaching Institute White-Label:</strong> Premium feature access bundled into offline coaching institute fees.</li>
    <li><strong>Education NBFC Actuarial API:</strong> Banks and non-banking financial companies query our API to risk-score student loan applications based on our JSS and Default Probability models, charged per API call.</li>
  </ul>
</div>
"""

    footer = r"""
      </div>
      <div class="footer-wrapper">
        <div class="footer">
            <span>Confidential & Proprietary</span>
            <span>Page X</span>
        </div>
        <div class="footer-bar"></div>
      </div>
    </div>
    """

    html_content = (
        "<!DOCTYPE html>\n<html lang='en'>\n<head>\n"
        "<meta charset='utf-8'>\n"
        "<title>The Project PRD</title>\n"
        """<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">\n"""
        """<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>\n"""
        """<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"\n"""
        """  onload="renderMathInElement(document.body, {\n"""
        """    delimiters: [\n"""
        """      {left: '$$', right: '$$', display: true},\n"""
        """      {left: '\\(', right: '\\)', display: false}\n"""
        """    ],\n"""
        """    throwOnError: false\n"""
        """  });"></script>\n"""
        f"<style>{css}</style>\n"
        "</head>\n<body>\n"
        + cover
        + sec1 + sec2 + sec3 + sec4 + sec5 + sec6 + sec7 + sec8
        + sec9 + sec10 + sec11 + sec12 + sec13 + sec14 + sec15
        + footer
        + "</body>\n</html>"
    )

    return html_content

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    out_path = os.path.join(OUT_DIR, FILE_NAME)
    html_content = build_html()
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Successfully generated PRD at {out_path}")

if __name__ == "__main__":
    main()
