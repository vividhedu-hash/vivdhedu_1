# case_study_builder/page_09_synthesis.py
from styles import wrap_page

def get_page_09():
    content = """
<div class="kicker">Part III &middot; The Calibration Funnel</div>
<h1 class="headline">The Synthesis Engine &amp; Baseline Diagnostic</h1>
<div class="headline-sub">Transforming discrete input vectors into a sovereign student intelligence profile.</div>

<div class="lead-p">
  Upon completing the calibration funnel, Student OS initiates a multi-cohort synthesis protocol. 
  Rather than presenting an instant, pre-baked response, the system executes a real-time verification run 
  across 4,200 historical program outcomes, generating the student's initial quantitative baseline.
</div>

<div class="grid-2" style="margin-bottom: 2.5mm;">
  <!-- SCREEN 08 -->
  <div class="screen-frame">
    <div class="screen-bar">
      <div class="screen-dots">
        <span class="screen-dot dot-red"></span>
        <span class="screen-dot dot-yellow"></span>
        <span class="screen-dot dot-green"></span>
      </div>
      <span class="screen-url">studentos.ai/synthesis/processing</span>
      <span class="screen-tag">Synthesis Protocol</span>
    </div>
    <img src="extracted_assets/ui_screen_08_raw.png" class="screen-img" alt="Synthesis Processing" />
    <div class="screen-caption">
      <strong>SCREEN 08 &middot; DETERMINISTIC SYNTHESIS ENGINE:</strong> Synthesizes academic profile, priority weights, 
      and tier-1 admissions benchmarks. Benchmarks against 4,200 program outcomes across 18 cohorts with zero hallucination thresholds.
    </div>
  </div>
  
  <!-- SCREEN 09 -->
  <div class="screen-frame">
    <div class="screen-bar">
      <div class="screen-dots">
        <span class="screen-dot dot-red"></span>
        <span class="screen-dot dot-yellow"></span>
        <span class="screen-dot dot-green"></span>
      </div>
      <span class="screen-url">studentos.ai/synthesis/overview</span>
      <span class="screen-tag">Baseline Diagnostic</span>
    </div>
    <img src="extracted_assets/ui_screen_09_raw.png" class="screen-img" alt="Synthesis Overview" />
    <div class="screen-caption">
      <strong>SCREEN 09 &middot; PROFILE SYNTHESIS REPORT:</strong> Establishes Alex's diagnostic score: 
      <strong>Initial AI Resilience 87/100 (Upper Decile)</strong>. Confirms primary academic horizon, constraints, 
      and execution scope before unlocking the workspace.
    </div>
  </div>
</div>

<div class="col-sidebar" style="margin-bottom: 0;">
  <div>
    <div class="card-title-sm">Deconstruction of the Initial Diagnostic Profile</div>
    <p class="body-p" style="font-size: 7.2pt; line-height: 1.45; margin-bottom: 1.5mm;">
      Screen 09 produces the foundational record that will govern Alex's downstream recommendations:
    </p>
    <div class="card-subtle" style="padding: 2mm 3mm; margin-bottom: 0;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2mm; font-size: 6.8pt;">
        <div>
          <strong style="color: var(--text-main);">Academic Horizon:</strong> Economics, Quantitative Analysis &amp; Computing.
        </div>
        <div>
          <strong style="color: var(--text-main);">Calculated Diagnostic:</strong> 87/100 Initial AI Resilience (Benchmark: Upper Decile).
        </div>
        <div>
          <strong style="color: var(--text-main);">Execution Scope:</strong> College discovery + Research portfolio development.
        </div>
        <div>
          <strong style="color: var(--text-main);">Calculated Constraints:</strong> Need-aware scholarship, UK / Europe &amp; Hubs.
        </div>
      </div>
    </div>
  </div>
  
  <div class="card-accent" style="display: flex; flex-direction: column; justify-content: center;">
    <div style="font-family: var(--font-mono); font-size: 6pt; font-weight: 700; text-transform: uppercase; color: var(--accent-dark); margin-bottom: 1mm;">
      The Human-in-the-Loop Gateway
    </div>
    <p class="body-p" style="font-size: 6.8pt; color: var(--text-main); line-height: 1.35; margin-bottom: 0;">
      Notice the inclusion of a <em>Complimentary Advisory Session</em> in Screen 09. Student OS combines quantitative algorithmic 
      modeling with trusted human advisory, ensuring parents and students can validate their roadmap with a senior strategist.
    </p>
  </div>
</div>
"""
    return wrap_page(content, 9, 20, "The Synthesis Engine &amp; Baseline Diagnostic", "PART III &middot; THE CALIBRATION FUNNEL")
