# case_study_builder/page_15_telemetry.py
from styles import wrap_page

def get_page_15():
    content = """
<div class="kicker">Part VI &middot; Longitudinal Telemetry</div>
<h1 class="headline">Live Telemetry &amp; Trajectory Tracking</h1>
<div class="headline-sub">Real-time profile diagnostics, velocity meters, and benchmark admittance projections.</div>

<div class="lead-p">
  Traditional students operate in an informational black box: they study blindly for months without knowing whether their profile 
  is actually competitive. Student OS provides persistent, ambient feedback through <strong>&ldquo;Your Signal&rdquo;</strong> 
  and longitudinal trajectory telemetry, translating daily sprint completions into statistical admissions gains.
</div>

<div class="col-sidebar" style="margin-bottom: 2.5mm;">
  <!-- LEFT: CROP S11 TRAJECTORY -->
  <div>
    <div class="card-title-sm">Longitudinal Trajectory Analytics (Screen 11 Detail)</div>
    <div class="screen-frame" style="margin-bottom: 2mm;">
      <img src="extracted_assets/crop_s11_trajectory.png" class="screen-img" alt="Trajectory Analytics" />
      <div class="screen-caption">
        <strong>QUANTITATIVE PROJECTIONS:</strong> 90-day Resilience Evolution (62 &rarr; 78 &rarr; 89 proj), 
        Milestone Velocity at 1.4x pace, and Target Admittance Odds at 58% current vs. 81% projected (+34% margin over cohort).
      </div>
    </div>
    
    <div class="grid-2">
      <div class="card-subtle">
        <div style="font-family: var(--font-mono); font-size: 6pt; font-weight: 700; color: var(--accent); margin-bottom: 0.5mm;">
          EXECUTION VELOCITY
        </div>
        <div style="font-size: 6.8pt; color: var(--text-muted); line-height: 1.35;">
          Tracking sprint completions (6 of 10 milestones) reveals Alex is pacing at 1.4x standard speed. 
          Provides positive reinforcement while keeping pre-board exam dates hedged.
        </div>
      </div>
      <div class="card-subtle">
        <div style="font-family: var(--font-mono); font-size: 6pt; font-weight: 700; color: var(--green); margin-bottom: 0.5mm;">
          TARGET BENCHMARK
        </div>
        <div style="font-size: 6.8pt; color: var(--text-muted); line-height: 1.35;">
          Benchmarks against LSE/Warwick cohort baseline (24%). Alex's current signal yields 58% odds, 
          projected to rise to 81% once the standardized math gating milestone is cleared.
        </div>
      </div>
    </div>
  </div>
  
  <!-- RIGHT: CROP S10 YOUR SIGNAL -->
  <div>
    <div class="card-title-sm">&ldquo;Your Signal&rdquo; Ambient Telemetry</div>
    <div class="screen-frame" style="margin-bottom: 2mm;">
      <img src="extracted_assets/crop_s10_your_signal.png" class="screen-img" alt="Your Signal Telemetry" />
      <div class="screen-caption">
        <strong>RIGHT SIDEBAR:</strong> AI Resilience 78/100 (Top 8% in Quant Track). 
        Profile Strength: 74% (Academic 82%, Research 71%, Consistency 69%).
      </div>
    </div>
    
    <div class="card" style="border-left: 2.5px solid var(--rose); padding: 2mm 2.5mm;">
      <div style="font-family: var(--font-mono); font-size: 5.8pt; font-weight: 700; text-transform: uppercase; color: var(--rose); margin-bottom: 0.5mm;">
        Primary Gap Diagnostic
      </div>
      <div style="font-size: 6.5pt; color: var(--text-muted); line-height: 1.3;">
        <strong>Demonstrated research co-authorship:</strong> Solo preprint verified; adding an institutional co-author elevates Tier-1 Economics odds by ~2.4x.
      </div>
    </div>
  </div>
</div>

<div class="card-accent" style="margin-bottom: 0;">
  <div style="font-family: var(--font-mono); font-size: 6pt; font-weight: 700; text-transform: uppercase; color: var(--accent-dark); margin-bottom: 0.5mm;">
    Psychological Impact &middot; Replacing Anxiety With Continuous Calibration
  </div>
  <div style="font-size: 7.2pt; color: var(--text-main); line-height: 1.4;">
    By exposing the exact mathematical gap&mdash;co-authorship and standardized math&mdash;Student OS strips away the paralyzing fog of college admissions. 
    Alex does not wonder whether to start a random podcast or volunteer at a local animal shelter. Every hour of effort is channeled 
    into verifiable signal multipliers that move the needle on Tier-1 admissions.
  </div>
</div>
"""
    return wrap_page(content, 15, 20, "Live Telemetry &amp; Trajectory Tracking", "PART VI &middot; LONGITUDINAL TELEMETRY")
