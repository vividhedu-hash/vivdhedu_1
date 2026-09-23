# case_study_builder/page_08_onboarding_2.py
from styles import wrap_page

def get_page_08():
    content = r"""
<div class="kicker">Part III &middot; The Calibration Funnel</div>
<h1 class="headline">Real-World Reality Calibration</h1>
<div class="headline-sub">Integrating household financial constraints, decision trade-offs, and admissions targets.</div>

<div class="lead-p">
  The fatal flaw of conventional career counseling is unconstrained fantasy: advising students to apply to Ivy League or Russell Group 
  programs without verifying whether the family can finance the degree or whether the student's visa pathway is viable. 
  Steps 04 through 06 introduce a deterministic feasibility engine that grounds ambition in mathematical reality.
</div>

<div class="grid-3" style="margin-bottom: 2.5mm;">
  <!-- SCREEN 05 -->
  <div class="screen-frame">
    <div class="screen-bar">
      <div class="screen-dots">
        <span class="screen-dot dot-red"></span>
        <span class="screen-dot dot-yellow"></span>
        <span class="screen-dot dot-green"></span>
      </div>
      <span class="screen-url">studentos.ai/onboarding/weights</span>
      <span class="screen-tag">Step 4 of 6</span>
    </div>
    <img src="extracted_assets/ui_screen_05_raw.png" class="screen-img" alt="Step 4 Decision Weights" />
    <div class="screen-caption">
      <strong>SCREEN 05 &middot; DECISION WEIGHTS:</strong> Dynamic importance sliders. 
      Alex weights <em>Career Outcomes</em> at 95%, <em>Cost &amp; Affordability</em> at 82%, and <em>Prestige</em> at 70%, 
      configuring the objective function for college portfolio ranking.
    </div>
  </div>
  
  <!-- SCREEN 06 -->
  <div class="screen-frame">
    <div class="screen-bar">
      <div class="screen-dots">
        <span class="screen-dot dot-red"></span>
        <span class="screen-dot dot-yellow"></span>
        <span class="screen-dot dot-green"></span>
      </div>
      <span class="screen-url">studentos.ai/onboarding/reality</span>
      <span class="screen-tag">Step 5 of 6</span>
    </div>
    <img src="extracted_assets/ui_screen_06_raw.png" class="screen-img" alt="Step 5 Reality Calibration" />
    <div class="screen-caption">
      <strong>SCREEN 06 &middot; REALITY CALIBRATION:</strong> Evaluates annual budget ($35k&ndash;$65k) and mobility (UK/Europe). 
      Instantly computes live feasibility metrics: <strong>84.2% cohort reachability</strong> and high visa pathway viability (Tier 2/PSW).
    </div>
  </div>
  
  <!-- SCREEN 07 -->
  <div class="screen-frame">
    <div class="screen-bar">
      <div class="screen-dots">
        <span class="screen-dot dot-red"></span>
        <span class="screen-dot dot-yellow"></span>
        <span class="screen-dot dot-green"></span>
      </div>
      <span class="screen-url">studentos.ai/onboarding/setup</span>
      <span class="screen-tag">Step 6 of 6</span>
    </div>
    <img src="extracted_assets/ui_screen_07_raw.png" class="screen-img" alt="Step 6 Workspace Setup" />
    <div class="screen-caption">
      <strong>SCREEN 07 &middot; NORTH STAR TARGETS:</strong> Synthesizes target field (Quantitative Economics), 
      target institutions (LSE, Warwick, Ashoka, UC Berkeley, Oxford), and immediate 6-month execution focus (SSRN preprint + SAT 1500+).
    </div>
  </div>
</div>

<div class="col-sidebar" style="margin-bottom: 0;">
  <div class="card-subtle">
    <div class="card-title-sm">Deterministic Feasibility Model &middot; Mathematical Formulation</div>
    <p class="body-p" style="font-size: 7.2pt; line-height: 1.45; margin-bottom: 1.5mm;">
      The reality calibration module runs a sensitivity check across institutional tuition bands and exchange rates:
    </p>
    <div class="math-block" style="padding: 2mm 3mm; margin: 1mm 0 1.5mm 0; font-size: 6.2pt;">
      <div class="math-eq" style="font-size: 7.2pt;">
        $$\text{Reachability}(\text{Cohort}) = P\left(\sum_{t=1}^4 \text{Cost}_t \le B_{\text{max}} + \mathbb{E}[\text{MeritAid}] \;\middle|\; \text{Z-Score} \ge Z_{\text{cutoff}}\right)$$
      </div>
      <div class="math-legend">
        Where $B_{\text{max}} = \$65,000/\text{yr}$, hedged against 5-year rolling currency delta. 
        Unlocks 18 Russell Group &amp; European English-taught cohorts under verified solvency constraints.
      </div>
    </div>
  </div>
  
  <div class="card" style="border-left: 2.5px solid var(--accent);">
    <div class="card-title-sm">The Empathy-to-Data Transition</div>
    <p class="body-p" style="font-size: 7pt; line-height: 1.4; margin-bottom: 0;">
      Notice that throughout Steps 01&ndash;06, Student OS does not judge or disqualify the student. Instead, it translates 
      anxious ambiguity into clear, quantitative feasibility vectors. The student experiences immediate agency: 
      they see exactly which parameters unlock their target universities.
    </p>
  </div>
</div>
"""
    return wrap_page(content, 8, 20, "Real-World Reality Calibration &middot; Steps 04 to 06", "PART III &middot; THE CALIBRATION FUNNEL")
