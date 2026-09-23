# case_study_builder/page_07_onboarding_1.py
from styles import wrap_page

def get_page_07():
    content = """
<div class="kicker">Part III &middot; The Calibration Funnel</div>
<h1 class="headline">Onboarding Architecture &middot; Phase I</h1>
<div class="headline-sub">From generic inquiry to calibrated curiosity: Steps 01 through 03 of the enrollment funnel.</div>

<div class="lead-p">
  Traditional educational onboarding is either an intimidating 40-minute psychological assessment or a high-friction form 
  designed to harvest lead-gen data. Student OS re-engineers onboarding as an elegant, progressive disclosure sequence 
  taking under 3 minutes, transforming student intent into deterministic machine parameters.
</div>

<div class="grid-2" style="margin-bottom: 2mm;">
  <!-- SCREEN 01 -->
  <div class="screen-frame">
    <div class="screen-bar">
      <div class="screen-dots">
        <span class="screen-dot dot-red"></span>
        <span class="screen-dot dot-yellow"></span>
        <span class="screen-dot dot-green"></span>
      </div>
      <span class="screen-url">studentos.ai/onboarding/start</span>
      <span class="screen-tag">Entry Gateway</span>
    </div>
    <img src="extracted_assets/ui_screen_01_raw.png" class="screen-img" alt="Onboarding Entry" />
    <div class="screen-caption">
      <strong>SCREEN 01 &middot; THE ZERO-PRESSURE GATEWAY:</strong> Establishes the core fiduciary contract. 
      Displays the active session profile trajectory (Undergraduate &amp; Career) and explicitly guarantees privacy, 
      unbiased guidance, and zero institutional lead generation.
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
      <span class="screen-url">studentos.ai/onboarding/stage</span>
      <span class="screen-tag">Step 1 of 6</span>
    </div>
    <img src="extracted_assets/ui_screen_02_raw.png" class="screen-img" alt="Step 1 Stage" />
    <div class="screen-caption">
      <strong>SCREEN 02 &middot; STAGE CALIBRATION:</strong> Immediately locks the student's operational timeline 
      (Class 9&ndash;10 foundation, Class 11&ndash;12 admissions &amp; exams, College undergrad, or Gap year). 
      Sets the baseline urgency matrix for entrance tests and portfolio deadlines.
    </div>
  </div>
</div>

<div class="grid-2" style="margin-bottom: 1.5mm;">
  <!-- SCREEN 03 -->
  <div class="screen-frame">
    <div class="screen-bar">
      <div class="screen-dots">
        <span class="screen-dot dot-red"></span>
        <span class="screen-dot dot-yellow"></span>
        <span class="screen-dot dot-green"></span>
      </div>
      <span class="screen-url">studentos.ai/onboarding/intent</span>
      <span class="screen-tag">Step 2 of 6</span>
    </div>
    <img src="extracted_assets/ui_screen_03_raw.png" class="screen-img" alt="Step 2 Intent" />
    <div class="screen-caption">
      <strong>SCREEN 03 &middot; WORKSPACE CALIBRATION:</strong> Student selects active priorities (College discovery, 
      profile building, research preprints, internships, software prototypes). Includes a high-empathy 
      &ldquo;I'm confused [Human First]&rdquo; fallback that triggers diagnostic discovery.
    </div>
  </div>
  
  <!-- SCREEN 04 -->
  <div class="screen-frame">
    <div class="screen-bar">
      <div class="screen-dots">
        <span class="screen-dot dot-red"></span>
        <span class="screen-dot dot-yellow"></span>
        <span class="screen-dot dot-green"></span>
      </div>
      <span class="screen-url">studentos.ai/onboarding/curiosity</span>
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
    return wrap_page(content, 7, 20, "Onboarding Architecture &middot; Steps 01 to 03", "PART III &middot; THE CALIBRATION FUNNEL")
