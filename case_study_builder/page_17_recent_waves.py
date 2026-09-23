# case_study_builder/page_17_recent_waves.py
from styles import wrap_page

def get_page_17():
    content = """
<div class="kicker">Part VI &middot; Longitudinal Telemetry</div>
<h1 class="headline">Recent Waves &middot; Profile-Triggered Intelligence</h1>
<div class="headline-sub">Real-time macro developments autonomously filtered through the student's active vectors.</div>

<div class="lead-p">
  The internet bombards students with irrelevant education news&mdash;hundreds of scholarship announcements, generic webinar invites, 
  and random essay contests. <strong>Recent Waves</strong> filters global academic and admissions telemetry through Alex's exact profile vector, 
  surfacing only items with direct mathematical relevance to their targets and constraints.
</div>

<!-- CLEAN CROP RECENT WAVES SCREEN 11 -->
<div class="screen-frame" style="margin-bottom: 2.5mm;">
  <div class="screen-bar">
    <div class="screen-dots">
      <span class="screen-dot dot-red"></span>
      <span class="screen-dot dot-yellow"></span>
      <span class="screen-dot dot-green"></span>
    </div>
    <span class="screen-url">studentos.ai/workspace/alex-m/recent-waves</span>
    <span class="screen-tag">Live Vector Stream &middot; 4 Active Signals</span>
  </div>
  <img src="extracted_assets/crop_s11_recent_waves_clean.png" class="screen-img" alt="Recent Waves Feed Clean" />
  <div class="screen-caption">
    <strong>SCREEN 11 &middot; RECENT WAVES FEED:</strong> Real-time developments mapped to Alex's profile vectors &amp; roadmap. 
    Category filter pills (Research, Competitions, Admissions, Scholarships, Skills).
  </div>
</div>

<div class="grid-2" style="margin-bottom: 2mm;">
  <div class="card-subtle">
    <div class="card-title">
      <span style="font-family: var(--font-mono); font-size: 6.2pt; color: var(--accent);">SIGNAL 01 &middot; COMPETITIONS</span>
      <span class="status-pill status-solved">98% Match</span>
    </div>
    <p class="body-p" style="font-size: 6.8pt; line-height: 1.35; margin-bottom: 1mm;">
      <strong>3 Economics &amp; Quant Research Competitions Opened:</strong> SSRN/ISEF-affiliated paper competitions accepting pre-university submissions in microeconomic modeling. 
      Deadline in 14 days. Offers verified external spike validation.
    </p>
  </div>
  
  <div class="card-subtle">
    <div class="card-title">
      <span style="font-family: var(--font-mono); font-size: 6.2pt; color: var(--rose);">SIGNAL 02 &middot; ADMISSIONS POLICY SHIFT</span>
      <span class="status-pill status-broken">High Relevance</span>
    </div>
    <p class="body-p" style="font-size: 6.8pt; line-height: 1.35; margin-bottom: 1mm;">
      <strong>LSE &amp; Warwick Update International Math Prerequisites:</strong> Stricter weight placed on standardized higher math. 
      Impact: Shifts SAT/CUET priority immediately into the current sprint, verifying the AI workspace's pivot recommendation.
    </p>
  </div>
</div>

<div class="grid-2" style="margin-bottom: 0;">
  <div class="card-subtle">
    <div class="card-title">
      <span style="font-family: var(--font-mono); font-size: 6.2pt; color: var(--purple);">SIGNAL 03 &middot; RESEARCH LAB MATCH</span>
      <span class="status-pill status-fragmented">Faculty Co-Author</span>
    </div>
    <p class="body-p" style="font-size: 6.8pt; line-height: 1.35; margin-bottom: 1mm;">
      <strong>Ashoka Computational Economics Mentorship Lab:</strong> Accepting 3 pre-university fellows for research on Indian labor dynamics. 
      <strong>Directly addresses Alex's primary identified gap</strong> (institutional co-authorship), unlocking the 2.4x Tier-1 odds multiplier.
    </p>
  </div>
  
  <div class="card-subtle">
    <div class="card-title">
      <span style="font-family: var(--font-mono); font-size: 6.2pt; color: var(--green);">SIGNAL 04 &middot; MERIT SCHOLARSHIP</span>
      <span class="status-pill status-solved">$24k / yr Fellowship</span>
    </div>
    <p class="body-p" style="font-size: 6.8pt; line-height: 1.35; margin-bottom: 1mm;">
      <strong>Need-Aware Global Merit Fellowship:</strong> Non-binding early award candidate criteria align perfectly with 
      Alex's Screen 06 financial parameters ($35k&ndash;$65k budget constraint), ensuring financial solvency without heavy debt.
    </p>
  </div>
</div>
"""
    return wrap_page(content, 17, 26, "Recent Waves &middot; Dynamic Profile Telemetry", "PART VI &middot; LONGITUDINAL TELEMETRY")
