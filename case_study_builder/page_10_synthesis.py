# case_study_builder/page_10_synthesis.py
from styles import wrap_page

def get_page_10():
    content = """
<div class="kicker">Part III &middot; The Calibration Funnel</div>
<h1 class="headline">Synthesis &amp; Baseline Diagnostic</h1>
<div class="headline-sub">Screen 08 &amp; 09: Resolving onboarding inputs into an initial actuarial caliber baseline.</div>

<div class="lead-p">
  Upon completing Step 06, the onboarding flow triggers the central synthesis orchestrator. 
  Instead of dumping the student onto a blank homepage, Student OS executes a transparent multi-model reasoning cycle, 
  synthesizing the 8 context vectors into an initial diagnostic score (87/100) and actionable trajectory baseline.
</div>

<div class="grid-2" style="margin-bottom: 2.5mm;">
  <!-- SCREEN 08 (Transition) -->
  <div class="screen-frame">
    <div class="screen-bar">
      <div class="screen-dots">
        <span class="screen-dot dot-red"></span>
        <span class="screen-dot dot-yellow"></span>
        <span class="screen-dot dot-green"></span>
      </div>
      <span class="screen-url">studentos.ai/synthesizing</span>
      <span class="screen-tag">Processing</span>
    </div>
    <img src="extracted_assets/ui_screen_08_raw.png" class="screen-img" alt="Screen 08 Synthesis" />
    <div class="screen-caption">
      <strong>SCREEN 08 &middot; SYNTHESIS ORCHESTRATION:</strong> Transparent live state showing the multi-agent reasoning chain. 
      Displays real-time pipeline status: <em>&ldquo;Analyzing 1,420 institutional cohorts... calibrating decision weights... building your sovereign signal.&rdquo;</em>
    </div>
  </div>

  <!-- SCREEN 09 (Diagnostic Baseline) -->
  <div class="screen-frame">
    <div class="screen-bar">
      <div class="screen-dots">
        <span class="screen-dot dot-red"></span>
        <span class="screen-dot dot-yellow"></span>
        <span class="screen-dot dot-green"></span>
      </div>
      <span class="screen-url">studentos.ai/baseline</span>
      <span class="screen-tag">Diagnostic</span>
    </div>
    <img src="extracted_assets/ui_screen_09_raw.png" class="screen-img" alt="Screen 09 Baseline Diagnostic" />
    <div class="screen-caption">
      <strong>SCREEN 09 &middot; BASELINE SCORE (87/100):</strong> The synthesized diagnostic card. Unveils initial AI Resilience Score (87/100), 
      flags Alex's primary competitive gap (<em>&ldquo;Lacks institutional co-authorship&rdquo;</em>), and recommends the immediate 90-day intervention.
    </div>
  </div>
</div>

<div class="grid-2" style="margin: 0;">
  <div class="card" style="border-left: 2.5px solid var(--green);">
    <div class="card-title-sm" style="color: var(--green);">The Diagnostic-to-Action Pipeline</div>
    <p class="body-p" style="font-size: 7.2pt; line-height: 1.4; margin-bottom: 0;">
      Screen 09 establishes the foundational benchmark against which all future progress is measured. 
      The score of <strong>87/100</strong> indicates exceptional foundational capability, but warns that without a 
      peer-reviewed research spike or corporate micro-internship, Alex faces fierce competition from 50,000+ applicants 
      with identical test scores.
    </p>
  </div>

  <div class="card-accent">
    <div class="card-title-sm">Bridge to Ecosystem Solutions</div>
    <p class="body-p" style="font-size: 7.2pt; line-height: 1.4; margin-bottom: 1mm; color: var(--text-main);">
      From this diagnostic baseline, Student OS routes the student directly to the <strong>Course Marketplace</strong> 
      (<code>studentos.ai/marketplace</code>) to bridge specific skill gaps through curated courses, and activates India's first 
      <strong>Flagship One-Stop Portfolio Building Program</strong> (research, internships, mentorships, and certs at nominal cost).
    </p>
    <div style="font-family: var(--font-mono); font-size: 6.0pt; color: var(--accent-dark); border-top: 0.5pt solid #BFDBFE; padding-top: 1mm;">
      GATEWAY: COMPLIMENTARY 1-ON-1 FAMILY STRATEGY SESSION UNLOCKED
    </div>
  </div>
</div>
"""
    return wrap_page(content, 10, 32, "The Synthesis Engine &amp; Baseline Diagnostic", "PART III &middot; THE CALIBRATION FUNNEL")
