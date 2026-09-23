# case_study_builder/page_05_lifecycle.py
from styles import wrap_page

def get_page_05():
    content = """
<div class="kicker">Part II &middot; Conceptual Architecture</div>
<h1 class="headline">The Unified Student Lifecycle</h1>
<div class="headline-sub">Operationalizing the 9-stage continuous state machine from Grade 9 to placement.</div>

<div class="lead-p">
  Traditional education platforms treat student guidance as an episodic, transactional event&mdash;a static quiz, an annual counseling session, 
  or an application form. In reality, intellectual maturation and college readiness constitute a continuous dynamical system. 
  Student OS structures this evolution into an immutable 9-stage operational loop.
</div>

<!-- SLEEK 9-STAGE PIPELINE -->
<div style="display: flex; align-items: center; justify-content: space-between; background: #F8FAFC; border: 0.75pt solid var(--border); border-radius: 3px; padding: 2.2mm 2.8mm; margin-bottom: 3.5mm; white-space: nowrap;">
  <div style="display: flex; align-items: center; gap: 3.5px;">
    <span style="font-family: var(--font-mono); font-size: 5.6pt; font-weight: 700; background: var(--accent); color: #FFF; border-radius: 2px; padding: 1px 3.5px;">01</span>
    <span style="font-family: var(--font-mono); font-size: 5.8pt; font-weight: 700; text-transform: uppercase; color: var(--text-main);">Understand</span>
  </div>
  <span style="color: #94A3B8; font-size: 6pt;">&rarr;</span>
  <div style="display: flex; align-items: center; gap: 3.5px;">
    <span style="font-family: var(--font-mono); font-size: 5.6pt; font-weight: 700; background: var(--accent); color: #FFF; border-radius: 2px; padding: 1px 3.5px;">02</span>
    <span style="font-family: var(--font-mono); font-size: 5.8pt; font-weight: 700; text-transform: uppercase; color: var(--text-main);">Assess</span>
  </div>
  <span style="color: #94A3B8; font-size: 6pt;">&rarr;</span>
  <div style="display: flex; align-items: center; gap: 3.5px;">
    <span style="font-family: var(--font-mono); font-size: 5.6pt; font-weight: 700; background: var(--accent); color: #FFF; border-radius: 2px; padding: 1px 3.5px;">03</span>
    <span style="font-family: var(--font-mono); font-size: 5.8pt; font-weight: 700; text-transform: uppercase; color: var(--text-main);">Decide</span>
  </div>
  <span style="color: #94A3B8; font-size: 6pt;">&rarr;</span>
  <div style="display: flex; align-items: center; gap: 3.5px;">
    <span style="font-family: var(--font-mono); font-size: 5.6pt; font-weight: 700; background: var(--accent); color: #FFF; border-radius: 2px; padding: 1px 3.5px;">04</span>
    <span style="font-family: var(--font-mono); font-size: 5.8pt; font-weight: 700; text-transform: uppercase; color: var(--text-main);">Plan</span>
  </div>
  <span style="color: #94A3B8; font-size: 6pt;">&rarr;</span>
  <div style="display: flex; align-items: center; gap: 3.5px;">
    <span style="font-family: var(--font-mono); font-size: 5.6pt; font-weight: 700; background: var(--accent); color: #FFF; border-radius: 2px; padding: 1px 3.5px;">05</span>
    <span style="font-family: var(--font-mono); font-size: 5.8pt; font-weight: 700; text-transform: uppercase; color: var(--text-main);">Build</span>
  </div>
  <span style="color: #94A3B8; font-size: 6pt;">&rarr;</span>
  <div style="display: flex; align-items: center; gap: 3.5px;">
    <span style="font-family: var(--font-mono); font-size: 5.6pt; font-weight: 700; background: var(--accent); color: #FFF; border-radius: 2px; padding: 1px 3.5px;">06</span>
    <span style="font-family: var(--font-mono); font-size: 5.8pt; font-weight: 700; text-transform: uppercase; color: var(--text-main);">Discover</span>
  </div>
  <span style="color: #94A3B8; font-size: 6pt;">&rarr;</span>
  <div style="display: flex; align-items: center; gap: 3.5px;">
    <span style="font-family: var(--font-mono); font-size: 5.6pt; font-weight: 700; background: var(--accent); color: #FFF; border-radius: 2px; padding: 1px 3.5px;">07</span>
    <span style="font-family: var(--font-mono); font-size: 5.8pt; font-weight: 700; text-transform: uppercase; color: var(--text-main);">Execute</span>
  </div>
  <span style="color: #94A3B8; font-size: 6pt;">&rarr;</span>
  <div style="display: flex; align-items: center; gap: 3.5px;">
    <span style="font-family: var(--font-mono); font-size: 5.6pt; font-weight: 700; background: var(--accent); color: #FFF; border-radius: 2px; padding: 1px 3.5px;">08</span>
    <span style="font-family: var(--font-mono); font-size: 5.8pt; font-weight: 700; text-transform: uppercase; color: var(--text-main);">Track</span>
  </div>
  <span style="color: #94A3B8; font-size: 6pt;">&rarr;</span>
  <div style="display: flex; align-items: center; gap: 3.5px;">
    <span style="font-family: var(--font-mono); font-size: 5.6pt; font-weight: 700; background: var(--accent); color: #FFF; border-radius: 2px; padding: 1px 3.5px;">09</span>
    <span style="font-family: var(--font-mono); font-size: 5.8pt; font-weight: 700; text-transform: uppercase; color: var(--text-main);">Adapt</span>
  </div>
</div>

<div class="grid-3" style="margin-bottom: 3mm;">
  <div class="card-subtle">
    <div style="font-family: var(--font-mono); font-size: 6pt; font-weight: 700; color: var(--accent); margin-bottom: 1mm;">
      STAGE 01&ndash;03 &middot; FOUNDATION
    </div>
    <p class="body-p" style="margin-bottom: 1.5mm;">
      <strong>1. Understand:</strong> Rapid 6-step onboarding calibrates stage, curiosity clusters, household financial reality, and decision weights.
    </p>
    <p class="body-p" style="margin-bottom: 1.5mm;">
      <strong>2. Assess:</strong> Adaptive psychometrics (3PL IRT CAT) and transcript benchmarking generate an Initial AI Resilience Score (e.g., 87/100).
    </p>
    <p class="body-p" style="margin-bottom: 0;">
      <strong>3. Decide:</strong> The Student Asset Pricing Engine simulates 20-year net cash return across 4,200 programs to establish the 4-tier college portfolio.
    </p>
  </div>
  
  <div class="card-subtle">
    <div style="font-family: var(--font-mono); font-size: 6pt; font-weight: 700; color: var(--accent); margin-bottom: 1mm;">
      STAGE 04&ndash;06 &middot; SCAFFOLDING
    </div>
    <p class="body-p" style="margin-bottom: 1.5mm;">
      <strong>4. Plan:</strong> The platform builds a deterministic multi-year roadmap balanced around school exams (CBSE/IB mid-terms and boards).
    </p>
    <p class="body-p" style="margin-bottom: 1.5mm;">
      <strong>5. Build:</strong> Guided project engines and research mentors scaffold authentic passion projects and peer-reviewed working papers.
    </p>
    <p class="body-p" style="margin-bottom: 0;">
      <strong>6. Discover:</strong> Real-time feeds (Recent Waves) continuously surface high-signal competitions, scholarships, and verified lab openings.
    </p>
  </div>
  
  <div class="card-subtle">
    <div style="font-family: var(--font-mono); font-size: 6pt; font-weight: 700; color: var(--accent); margin-bottom: 1mm;">
      STAGE 07&ndash;09 &middot; EXECUTION LOOP
    </div>
    <p class="body-p" style="margin-bottom: 1.5mm;">
      <strong>7. Execute:</strong> Sprint cadences track weekly milestones (e.g. 1.4x velocity), drafting cold emails, and submitting working papers.
    </p>
    <p class="body-p" style="margin-bottom: 1.5mm;">
      <strong>8. Track:</strong> &ldquo;Your Signal&rdquo; telemetry provides live feedback on profile strength, admissions odds (+34% margin), and primary gaps.
    </p>
    <p class="body-p" style="margin-bottom: 0;">
      <strong>9. Adapt:</strong> Macro shifts (e.g., LSE higher-math policy updates) automatically trigger roadmap recalibrations and reprioritizations.
    </p>
  </div>
</div>

<div class="card-accent" style="margin-bottom: 0;">
  <div class="card-title" style="color: var(--accent-dark); margin-bottom: 1mm;">
    <span>The Closed-Loop Feedback Principle</span>
    <span class="epistemic-tag tag-response">Architectural Invariant</span>
  </div>
  <div style="font-size: 7.2pt; color: var(--text-main); line-height: 1.45;">
    Every verified action completed by the student (e.g., publishing an SSRN working paper, scoring 1520 on the SAT) immediately 
    feeds back into their central latent profile vector. This update automatically adjusts downstream admissions probabilities, 
    unlocks new scholarship tiers, reweights labor resilience forecasts, and modifies the student's next 30-day priorities. 
    The student is never locked into a dead-end plan.
  </div>
</div>
"""
    return wrap_page(content, 5, 20, "The 9-Stage Continuous Student Lifecycle", "PART II &middot; CONCEPTUAL ARCHITECTURE")
