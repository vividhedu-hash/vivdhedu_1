# case_study_builder/page_08_onboarding_1.py
from styles import wrap_page

def get_page_08():
    content = """
<div class="kicker">Part III &middot; The Calibration Funnel</div>
<h1 class="headline">Calibration Architecture: Steps 01 to 03</h1>
<div class="headline-sub">Transforming user onboarding into a high-signal latent potential discovery engine.</div>

<div class="lead-p">
  Traditional onboarding flows are designed for superficial lead capture&mdash;extracting email addresses and phone numbers to sell to third-party telemarketers. 
  In contrast, <strong>Student OS utilizes onboarding as a structured Bayesian calibration sequence</strong>, extracting latent student preferences, 
  academic standing, and curiosity vectors while establishing an uncompromised fiduciary contract.
</div>

<div class="grid-3" style="margin-bottom: 2.5mm;">
  <!-- SCREEN 01 -->
  <div class="screen-frame">
    <div class="screen-bar">
      <div class="screen-dots">
        <span class="screen-dot dot-red"></span>
        <span class="screen-dot dot-yellow"></span>
        <span class="screen-dot dot-green"></span>
      </div>
      <span class="screen-url">studentos.ai/welcome</span>
      <span class="screen-tag">Step 1 of 6</span>
    </div>
    <img src="extracted_assets/ui_screen_01_raw.png" class="screen-img" alt="Step 1 Identity" />
    <div class="screen-caption">
      <strong>SCREEN 01 &middot; IDENTITY &amp; STAGE:</strong> Clean, distraction-free input capturing student name, high-school graduation target, 
      and school ecosystem. Establishes the temporal baseline for all subsequent longitudinal tracking.
    </div>
  </div>

  <!-- SCREEN 02 -->
  <div class="screen-frame">
    <div class="screen-bar">
      <div class="screen-dots">
        <span class="screen-dot dot-red"></span>
        <span class="screen-dot dot-yellow"></span>
        <span class="screen-dot dot-green"></span>
      </div>
      <span class="screen-url">studentos.ai/journey</span>
      <span class="screen-tag">Step 2 of 6</span>
    </div>
    <img src="extracted_assets/ui_screen_02_raw.png" class="screen-img" alt="Step 2 Journey Phase" />
    <div class="screen-caption">
      <strong>SCREEN 02 &middot; JOURNEY PHASE:</strong> Dissects the cohort into distinct execution states: <em>Early Explorer</em> (Class 9&ndash;10), 
      <em>Undergraduate Trajectory</em> (Class 11&ndash;12), or <em>University Pivot</em>. Instantly alters the active UI state machine.
    </div>
  </div>

  <!-- SCREEN 04 (Curiosity) -->
  <div class="screen-frame">
    <div class="screen-bar">
      <div class="screen-dots">
        <span class="screen-dot dot-red"></span>
        <span class="screen-dot dot-yellow"></span>
        <span class="screen-dot dot-green"></span>
      </div>
      <span class="screen-url">studentos.ai/curiosity</span>
      <span class="screen-tag">Step 3 of 6</span>
    </div>
    <img src="extracted_assets/ui_screen_04_raw.png" class="screen-img" alt="Step 3 Curiosity" />
    <div class="screen-caption">
      <strong>SCREEN 04 &middot; DISCIPLINARY CLUSTERING:</strong> Replaces rigid majors with cross-disciplinary curiosity pinning. 
      Alex pins <em>Applied Econometrics</em> (Domain 01) and <em>Machine Learning / AI</em> (Domain 02), 
      directly configuring the research lab matching algorithms.
    </div>
  </div>
</div>

<div class="editorial-note" style="margin: 0;">
  <strong>UX Observation:</strong> Rather than forcing a high-school student to declare an inflexible career title (&ldquo;Investment Banker&rdquo;), 
  the interface captures orthogonal vectors of interest. This allows the underlying quantitative engine to explore hybrid high-demand frontiers 
  (e.g., Computational Economics and Algorithmic Policy Design) that offer superior AI labor resilience.
</div>
"""
    return wrap_page(content, 8, 32, "Onboarding Architecture &middot; Steps 01 to 03", "PART III &middot; THE CALIBRATION FUNNEL")
