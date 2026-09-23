# case_study_builder/page_16_psychometrics.py
from styles import wrap_page

def get_page_16():
    content = r"""
<div class="kicker">Part IV &middot; The Quantitative Core</div>
<h1 class="headline">Adaptive Psychometrics &amp; Admissions</h1>
<div class="headline-sub">3-Parameter Item Response Theory and Cutoff Delta portfolio calibration.</div>

<div class="lead-p">
  Conventional aptitude tests rely on flat, static questionnaires that can be easily gamed or produce generic MBTI categories. 
  Student OS deploys a rigorous psychometric engine grounded in psychometric Item Response Theory (IRT), dynamically converging on 
  a student's latent traits in under 15 adaptive questions.
</div>

<div class="grid-2" style="margin-bottom: 2.5mm;">
  <div class="math-block">
    <div class="math-title">
      <span>6.1 &middot; 3-Parameter Logistic (3PL) Model</span>
      <span>IRT ENGINE</span>
    </div>
    <div class="math-eq" style="font-size: 7.8pt;">
      $$P_i(\theta) = c_i + \frac{1 - c_i}{1 + \exp\left(-1.7 a_i (\theta - b_i)\right)}$$
    </div>
    <div class="math-legend">
      Where $\theta \in [-3.0, +3.0]$ is the student's latent ability vector; $a_i$ is item discrimination, 
      $b_i$ is difficulty, and $c_i$ is the pseudo-guessing floor. Evaluates mathematical rigor, epistemic stamina, and spatial reasoning.
    </div>
  </div>
  
  <div class="math-block">
    <div class="math-title">
      <span>6.2 &middot; Fisher Information &amp; EAP Updates</span>
      <span>BAYESIAN ESTIMATION</span>
    </div>
    <div class="math-eq" style="font-size: 7.8pt;">
      $$\hat{\theta}_{\text{EAP}} = \frac{\int \theta L(\theta | \mathbf{u}) \pi(\theta) d\theta}{\int L(\theta | \mathbf{u}) \pi(\theta) d\theta}$$
    </div>
    <div class="math-legend">
      Next item selection maximizes Fisher Information $I_i(\hat{\theta})$. 
      The system updates latent trait estimates dynamically until posterior standard error $\text{SE}(\hat{\theta}) < 0.28$, terminating the test with high precision.
    </div>
  </div>
</div>

<div class="card-title-sm">9.1 &middot; The Four-Tier Admissions Portfolio Architecture</div>
<p class="body-p" style="margin-bottom: 2mm;">
  Using the calibrated ability trait $\hat{\theta}$ alongside standardized test baselines (SAT/JEE/CUET), 
  the admissions engine evaluates the Cutoff Delta $Z$-score for every target university program:
  $$\Delta Z_{i, c, b} = \frac{\text{Score}_i - \mu_{\text{cutoff}, c, b}}{\sigma_{\text{cutoff}, c, b}} + \gamma_{\text{spike}} \cdot \text{SpikeScore}_i + \gamma_{\text{res}} \cdot \text{ResearchCoauthor}_i$$
</p>

<div class="grid-4" style="margin-bottom: 2.5mm;">
  <div class="card-subtle" style="border-top: 2.5px solid var(--purple);">
    <div style="font-family: var(--font-mono); font-size: 6.2pt; font-weight: 700; color: var(--purple);">TIER 1 &middot; DREAM</div>
    <div class="kpi-val" style="font-size: 11pt; margin: 1mm 0;">10% &ndash; 25%</div>
    <div style="font-size: 6.6pt; color: var(--text-muted); line-height: 1.32;">
      High-reach aspirational targets (Oxford, UC Berkeley). Maximizes ceiling upside; requires major research spike.
    </div>
  </div>
  
  <div class="card-subtle" style="border-top: 2.5px solid var(--accent);">
    <div style="font-family: var(--font-mono); font-size: 6.2pt; font-weight: 700; color: var(--accent);">TIER 2 &middot; REACH</div>
    <div class="kpi-val" style="font-size: 11pt; margin: 1mm 0;">25% &ndash; 55%</div>
    <div style="font-size: 6.6pt; color: var(--text-muted); line-height: 1.32;">
      Competitive target programs (LSE, Warwick). Reachable with focused test prep and co-authored working papers.
    </div>
  </div>
  
  <div class="card-subtle" style="border-top: 2.5px solid var(--green);">
    <div style="font-family: var(--font-mono); font-size: 6.2pt; font-weight: 700; color: var(--green);">TIER 3 &middot; TARGET</div>
    <div class="kpi-val" style="font-size: 11pt; margin: 1mm 0;">55% &ndash; 85%</div>
    <div style="font-size: 6.6pt; color: var(--text-muted); line-height: 1.32;">
      Statistical alignment with historical cohort medians (Ashoka Honors). Balanced financial return and high merit yield.
    </div>
  </div>
  
  <div class="card-subtle" style="border-top: 2.5px solid #64748B;">
    <div style="font-family: var(--font-mono); font-size: 6.2pt; font-weight: 700; color: #64748B);">TIER 4 &middot; SAFETY</div>
    <div class="kpi-val" style="font-size: 11pt; margin: 1mm 0;">&gt; 85%</div>
    <div style="font-size: 6.6pt; color: var(--text-muted); line-height: 1.32;">
      Guaranteed admittance floor. Zero probability of debt default, ensuring the family's downside is completely hedged.
    </div>
  </div>
</div>

<div class="card-accent" style="margin-bottom: 0;">
  <div style="font-family: var(--font-mono); font-size: 6.2pt; font-weight: 700; text-transform: uppercase; color: var(--accent-dark); margin-bottom: 1mm;">
    The Smart Budget Pruning Invariant
  </div>
  <div style="font-size: 7.4pt; color: var(--text-main); line-height: 1.42;">
    Traditional consultancies push students to apply to 20+ institutions at enormous application fee costs (&#8377;1.5 Lakh to &#8377;2.5 Lakh+). 
    Student OS uses linear integer programming to select an optimal 8-to-10 college portfolio that maximizes admission probability 
    subject to the family's total application and travel budget constraints.
  </div>
</div>
"""
    return wrap_page(content, 16, 32, "Adaptive Psychometrics &amp; Portfolio Math", "PART IV &middot; THE QUANTITATIVE CORE")
