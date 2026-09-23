# case_study_builder/page_09_onboarding_2.py
from styles import wrap_page

def get_page_09():
    content = """
<div class="kicker">Part III &middot; The Calibration Funnel</div>
<h1 class="headline">Calibration Architecture: Steps 04 to 06</h1>
<div class="headline-sub">Anchoring student aspirations in empirical economic realities, family budgets, and labor data.</div>

<div class="lead-p">
  The core failure of educational guidance in developing markets is <em>uncalibrated optimism</em>&mdash;encouraging students to chase degrees 
  their families cannot afford or pursue careers facing structural automation collapse. Steps 04 through 06 introduce 
  <strong>actuarial constraints directly into the user experience</strong>.
</div>

<div class="grid-3" style="margin-bottom: 2.5mm;">
  <!-- SCREEN 05 (Weights) -->
  <div class="screen-frame">
    <div class="screen-bar">
      <div class="screen-dots">
        <span class="screen-dot dot-red"></span>
        <span class="screen-dot dot-yellow"></span>
        <span class="screen-dot dot-green"></span>
      </div>
      <span class="screen-url">studentos.ai/priorities</span>
      <span class="screen-tag">Step 4 of 6</span>
    </div>
    <img src="extracted_assets/ui_screen_05_raw.png" class="screen-img" alt="Step 4 Decision Weights" />
    <div class="screen-caption">
      <strong>SCREEN 05 &middot; DECISION WEIGHTS:</strong> Interactive sliders capturing student utility: 
      <em>Career Outcomes (95%)</em>, <em>Affordability (82%)</em>, and <em>Prestige (70%)</em>. 
      Parametrizes the objective function for college ranking algorithms.
    </div>
  </div>

  <!-- SCREEN 06 (Budget) -->
  <div class="screen-frame">
    <div class="screen-bar">
      <div class="screen-dots">
        <span class="screen-dot dot-red"></span>
        <span class="screen-dot dot-yellow"></span>
        <span class="screen-dot dot-green"></span>
      </div>
      <span class="screen-url">studentos.ai/budget</span>
      <span class="screen-tag">Step 5 of 6</span>
    </div>
    <img src="extracted_assets/ui_screen_06_raw.png" class="screen-img" alt="Step 5 Reality Budget" />
    <div class="screen-caption">
      <strong>SCREEN 06 &middot; REALITY BUDGET:</strong> Explicitly calibrates annual tuition and living tolerance: 
      <em>$35,000&ndash;$65,000/yr</em>, with parental funding and scholarship necessity toggled. 
      Instantly filters out tuition-distress institutions.
    </div>
  </div>

  <!-- SCREEN 07 (Geo Mobility) -->
  <div class="screen-frame">
    <div class="screen-bar">
      <div class="screen-dots">
        <span class="screen-dot dot-red"></span>
        <span class="screen-dot dot-yellow"></span>
        <span class="screen-dot dot-green"></span>
      </div>
      <span class="screen-url">studentos.ai/mobility</span>
      <span class="screen-tag">Step 6 of 6</span>
    </div>
    <img src="extracted_assets/ui_screen_07_raw.png" class="screen-img" alt="Step 6 Geography" />
    <div class="screen-caption">
      <strong>SCREEN 07 &middot; GEOGRAPHIC MOBILITY:</strong> Multi-region selection (UK &amp; Europe) paired with post-study work visa (PSW) viability analysis. 
      Weights foreign exchange currency risks and geopolitical visa restrictions.
    </div>
  </div>
</div>

<div class="grid-2" style="margin: 0;">
  <div class="card" style="border-left: 2.5px solid var(--purple);">
    <div class="card-title-sm" style="color: var(--purple);">Mathematical Formulation of Student Utility</div>
    <div style="font-size: 7.2pt; color: var(--text-muted); line-height: 1.38;">
      The sliders in Screen 05 generate the weight vector $\mathbf{w} = [w_{\text{outcomes}}, w_{\text{cost}}, w_{\text{prestige}}]$, 
      which directly scales the college utility matrix: $U(c) = \mathbf{w}^T \cdot \mathbf{x}_c$. 
      Combined with Screen 06's hard budget ceiling ($C(c) \le B_{\text{max}}$), the system mathematically eliminates debt-trap institutions.
    </div>
  </div>
  
  <div class="card" style="border-left: 2.5px solid var(--accent);">
    <div class="card-title-sm">The Empathy-to-Data Transition</div>
    <p class="body-p" style="font-size: 7.2pt; line-height: 1.4; margin-bottom: 0;">
      Notice that throughout Steps 01&ndash;06, Student OS does not judge or disqualify the student. Instead, it translates 
      anxious ambiguity into clear, quantitative feasibility vectors. The student experiences immediate agency: 
      they see exactly which parameters unlock their target universities.
    </p>
  </div>
</div>
"""
    return wrap_page(content, 9, 32, "Real-World Reality Calibration &middot; Steps 04 to 06", "PART III &middot; THE CALIBRATION FUNNEL")
