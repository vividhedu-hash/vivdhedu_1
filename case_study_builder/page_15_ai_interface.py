# case_study_builder/page_15_ai_interface.py
from styles import wrap_page

def get_page_15():
    content = """
<div class="kicker">Part V &middot; The Orchestration Layer</div>
<h1 class="headline">The Decision Workspace in Practice</h1>
<div class="headline-sub">Deconstructing Screen 10: Turning strategic dilemmas into probabilistic execution.</div>

<div class="lead-p">
  When Alex asks: <em>&ldquo;Should I prioritize a 2nd research paper or focus on SAT/CUET prep this quarter?&rdquo;</em>, 
  the system does not generate an essay. It initiates a 0.28-second verified simulation that computes marginal return, 
  evaluates institutional cutoff gating, and presents a definitive, actionable choice.
</div>

<!-- FULL HERO SCREEN 10 -->
<div class="screen-frame" style="margin-bottom: 2mm;">
  <div class="screen-bar">
    <div class="screen-dots">
      <span class="screen-dot dot-red"></span>
      <span class="screen-dot dot-yellow"></span>
      <span class="screen-dot dot-green"></span>
    </div>
    <span class="screen-url">studentos.ai/workspace/alex-m/overview</span>
    <span class="screen-tag">Live Telemetry &middot; Query Runtime: 0.28s</span>
  </div>
  <img src="extracted_assets/ui_screen_10_raw.png" class="screen-img" alt="Student OS Dashboard Top" />
  <div class="screen-caption">
    <strong>SCREEN 10 &middot; THE HYBRID WORKSPACE:</strong> Persistent navigation (left), Structured AI Decision Engine (center), 
    and Live Telemetry &ldquo;Your Signal&rdquo; (right). Integrates admissions gating with profile gaps in one unified viewport.
  </div>
</div>

<div class="grid-3" style="margin-bottom: 0;">
  <div class="card-subtle">
    <div class="card-title-sm">1. Diminishing Returns Logic</div>
    <p class="body-p" style="font-size: 6.8pt; line-height: 1.35; margin-bottom: 0;">
      <strong>Recommendation: Pivot 65% focus to Standardized Testing.</strong> Because Alex's first working paper is already under review, 
      a second paper yields diminishing returns compared to an unverified testing profile, which acts as a hard filter at UK/US tier-1 programs.
    </p>
  </div>
  
  <div class="card-subtle">
    <div class="card-title-sm">2. Concrete Probabilities</div>
    <p class="body-p" style="font-size: 6.8pt; line-height: 1.35; margin-bottom: 0;">
      <strong>LSE Math Gating: 54% &rarr; 89% (+35%).</strong> Rather than vague guidance, the system quantifies the impact: 
      clearing the SAT Math gating bar elevates LSE economics odds by 35 percentage points, boosting Profile Resilience from 78 to 84.
    </p>
  </div>
  
  <div class="card-subtle">
    <div class="card-title-sm">3. Direct Action Hooks &amp; Marketplace</div>
    <p class="body-p" style="font-size: 6.8pt; line-height: 1.35; margin-bottom: 0;">
      <strong>`[+ Add to Roadmap]` &amp; `[Explore Marketplace Courses]`.</strong> Directly routes to the <strong>Marketplace Page</strong> 
      (`studentos.ai/marketplace`) to bridge specific quantitative math skills via 3rd-party courses, earning affiliate rev-share, 
      while inserting sprints into Alex's calendar.
    </p>
  </div>
</div>
"""
    return wrap_page(content, 15, 26, "The Decision Interface in Operation", "PART V &middot; THE ORCHESTRATION LAYER")
