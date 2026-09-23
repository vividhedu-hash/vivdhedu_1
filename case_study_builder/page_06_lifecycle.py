# case_study_builder/page_06_lifecycle.py
from styles import wrap_page

def get_page_06():
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
    <span style="font-family: var(--font-mono); font-size: 6.0pt; font-weight: 700; background: var(--accent); color: #FFF; border-radius: 2px; padding: 1px 4px;">01</span>
    <span style="font-family: var(--font-mono); font-size: 6.2pt; font-weight: 700; text-transform: uppercase; color: var(--text-main);">Understand</span>
  </div>
  <span style="color: #94A3B8; font-size: 6.5pt;">&rarr;</span>
  <div style="display: flex; align-items: center; gap: 3.5px;">
    <span style="font-family: var(--font-mono); font-size: 6.0pt; font-weight: 700; background: var(--accent); color: #FFF; border-radius: 2px; padding: 1px 4px;">02</span>
    <span style="font-family: var(--font-mono); font-size: 6.2pt; font-weight: 700; text-transform: uppercase; color: var(--text-main);">Assess</span>
  </div>
  <span style="color: #94A3B8; font-size: 6.5pt;">&rarr;</span>
  <div style="display: flex; align-items: center; gap: 3.5px;">
    <span style="font-family: var(--font-mono); font-size: 6.0pt; font-weight: 700; background: var(--accent); color: #FFF; border-radius: 2px; padding: 1px 4px;">03</span>
    <span style="font-family: var(--font-mono); font-size: 6.2pt; font-weight: 700; text-transform: uppercase; color: var(--text-main);">Decide</span>
  </div>
  <span style="color: #94A3B8; font-size: 6.5pt;">&rarr;</span>
  <div style="display: flex; align-items: center; gap: 3.5px;">
    <span style="font-family: var(--font-mono); font-size: 6.0pt; font-weight: 700; background: var(--accent); color: #FFF; border-radius: 2px; padding: 1px 4px;">04</span>
    <span style="font-family: var(--font-mono); font-size: 6.2pt; font-weight: 700; text-transform: uppercase; color: var(--text-main);">Plan</span>
  </div>
  <span style="color: #94A3B8; font-size: 6.5pt;">&rarr;</span>
  <div style="display: flex; align-items: center; gap: 3.5px;">
    <span style="font-family: var(--font-mono); font-size: 6.0pt; font-weight: 700; background: var(--accent); color: #FFF; border-radius: 2px; padding: 1px 4px;">05</span>
    <span style="font-family: var(--font-mono); font-size: 6.2pt; font-weight: 700; text-transform: uppercase; color: var(--text-main);">Build</span>
  </div>
  <span style="color: #94A3B8; font-size: 6.5pt;">&rarr;</span>
  <div style="display: flex; align-items: center; gap: 3.5px;">
    <span style="font-family: var(--font-mono); font-size: 6.0pt; font-weight: 700; background: var(--accent); color: #FFF; border-radius: 2px; padding: 1px 4px;">06</span>
    <span style="font-family: var(--font-mono); font-size: 6.2pt; font-weight: 700; text-transform: uppercase; color: var(--text-main);">Discover</span>
  </div>
  <span style="color: #94A3B8; font-size: 6.5pt;">&rarr;</span>
  <div style="display: flex; align-items: center; gap: 3.5px;">
    <span style="font-family: var(--font-mono); font-size: 6.0pt; font-weight: 700; background: var(--accent); color: #FFF; border-radius: 2px; padding: 1px 4px;">07</span>
    <span style="font-family: var(--font-mono); font-size: 6.2pt; font-weight: 700; text-transform: uppercase; color: var(--text-main);">Execute</span>
  </div>
  <span style="color: #94A3B8; font-size: 6.5pt;">&rarr;</span>
  <div style="display: flex; align-items: center; gap: 3.5px;">
    <span style="font-family: var(--font-mono); font-size: 6.0pt; font-weight: 700; background: var(--accent); color: #FFF; border-radius: 2px; padding: 1px 4px;">08</span>
    <span style="font-family: var(--font-mono); font-size: 6.2pt; font-weight: 700; text-transform: uppercase; color: var(--text-main);">Track</span>
  </div>
  <span style="color: #94A3B8; font-size: 6.5pt;">&rarr;</span>
  <div style="display: flex; align-items: center; gap: 3.5px;">
    <span style="font-family: var(--font-mono); font-size: 6.0pt; font-weight: 700; background: var(--accent); color: #FFF; border-radius: 2px; padding: 1px 4px;">09</span>
    <span style="font-family: var(--font-mono); font-size: 6.2pt; font-weight: 700; text-transform: uppercase; color: var(--text-main);">Adapt</span>
  </div>
</div>

<div class="grid-3" style="margin-bottom: 3.5mm;">
  <div class="card-subtle">
    <div style="font-family: var(--font-mono); font-size: 6.5pt; font-weight: 700; color: var(--accent); margin-bottom: 1mm;">
      STAGE 01&ndash;03 &middot; FOUNDATION
    </div>
    <p class="body-p" style="margin-bottom: 1.5mm;">
      <strong>1. Understand:</strong> Seamless ingestion of student identity, socioeconomic realities, parental budget constraints, and risk tolerance.
    </p>
    <p class="body-p" style="margin-bottom: 1.5mm;">
      <strong>2. Assess:</strong> Psychometric IRT calibration and automated academic audits uncover latent spikes, quantitative foundations, and AI labor exposure.
    </p>
    <p class="body-p" style="margin-bottom: 0;">
      <strong>3. Decide:</strong> Actuarial decision models establish optimal reach, target, and safety portfolios using individualized Monte Carlo cash yield.
    </p>
  </div>
  
  <div class="card-subtle">
    <div style="font-family: var(--font-mono); font-size: 6.5pt; font-weight: 700; color: var(--accent); margin-bottom: 1mm;">
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
    <div style="font-family: var(--font-mono); font-size: 6.5pt; font-weight: 700; color: var(--accent); margin-bottom: 1mm;">
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
  <div style="font-size: 7.4pt; color: var(--text-main); line-height: 1.45;">
    Every verified action completed by the student (e.g., publishing an SSRN working paper, scoring 1520 on the SAT) immediately 
    feeds back into their central latent profile vector. This update automatically adjusts downstream admissions probabilities, 
    unlocks new scholarship tiers, reweights labor resilience forecasts, and modifies the student's next 30-day priorities. 
    The student is never locked into a dead-end plan.
  </div>
</div>
<!-- SVG lifecycle pipeline -->
<div style="margin-top:3mm;">
  <div class="card-title-sm" style="margin-bottom:1.5mm;">The 9-Stage Immutable State Machine &mdash; Visual Architecture</div>
  <svg viewBox="0 0 580 72" width="100%" xmlns="http://www.w3.org/2000/svg">
    <!-- Stage boxes and arrows for all 9 stages -->
    <!-- Use colors: foundation=#0D9488, scaffolding=#1A6CF6, execution=#7C3AED -->
    <!-- Draw 9 boxes each ~55px wide, with arrows between -->
    <!-- Stage 1 -->
    <rect x="0" y="12" width="56" height="32" rx="3" fill="#F0FDF4" stroke="#0D9488" stroke-width="1"/>
    <text x="28" y="24" font-family="monospace" font-size="7" font-weight="700" fill="#065F46" text-anchor="middle">01</text>
    <text x="28" y="35" font-family="monospace" font-size="6.5" fill="#047857" text-anchor="middle">UNDER-</text>
    <text x="28" y="42" font-family="monospace" font-size="6.5" fill="#047857" text-anchor="middle">STAND</text>
    <polygon points="56,28 62,28 59,24" fill="#0D9488"/>
    <line x1="56" y1="28" x2="62" y2="28" stroke="#0D9488" stroke-width="1"/>
    <!-- Stage 2 -->
    <rect x="62" y="12" width="56" height="32" rx="3" fill="#F0FDF4" stroke="#0D9488" stroke-width="1"/>
    <text x="90" y="24" font-family="monospace" font-size="7" font-weight="700" fill="#065F46" text-anchor="middle">02</text>
    <text x="90" y="35" font-family="monospace" font-size="6.5" fill="#047857" text-anchor="middle">ASSESS</text>
    <polygon points="118,28 124,28 121,24" fill="#0D9488"/>
    <line x1="118" y1="28" x2="124" y2="28" stroke="#0D9488" stroke-width="1"/>
    <!-- Stage 3 -->
    <rect x="124" y="12" width="56" height="32" rx="3" fill="#F0FDF4" stroke="#0D9488" stroke-width="1"/>
    <text x="152" y="24" font-family="monospace" font-size="7" font-weight="700" fill="#065F46" text-anchor="middle">03</text>
    <text x="152" y="35" font-family="monospace" font-size="6.5" fill="#047857" text-anchor="middle">DECIDE</text>
    <polygon points="180,28 186,28 183,24" fill="#1A6CF6"/>
    <line x1="180" y1="28" x2="186" y2="28" stroke="#1A6CF6" stroke-width="1"/>
    <!-- Stage 4 -->
    <rect x="186" y="12" width="56" height="32" rx="3" fill="#EFF6FF" stroke="#1A6CF6" stroke-width="1"/>
    <text x="214" y="24" font-family="monospace" font-size="7" font-weight="700" fill="#1E3A8A" text-anchor="middle">04</text>
    <text x="214" y="35" font-family="monospace" font-size="6.5" fill="#1D4ED8" text-anchor="middle">PLAN</text>
    <polygon points="242,28 248,28 245,24" fill="#1A6CF6"/>
    <line x1="242" y1="28" x2="248" y2="28" stroke="#1A6CF6" stroke-width="1"/>
    <!-- Stage 5 -->
    <rect x="248" y="12" width="56" height="32" rx="3" fill="#EFF6FF" stroke="#1A6CF6" stroke-width="1"/>
    <text x="276" y="24" font-family="monospace" font-size="7" font-weight="700" fill="#1E3A8A" text-anchor="middle">05</text>
    <text x="276" y="35" font-family="monospace" font-size="6.5" fill="#1D4ED8" text-anchor="middle">BUILD</text>
    <polygon points="304,28 310,28 307,24" fill="#1A6CF6"/>
    <line x1="304" y1="28" x2="310" y2="28" stroke="#1A6CF6" stroke-width="1"/>
    <!-- Stage 6 -->
    <rect x="310" y="12" width="56" height="32" rx="3" fill="#EFF6FF" stroke="#1A6CF6" stroke-width="1"/>
    <text x="338" y="24" font-family="monospace" font-size="7" font-weight="700" fill="#1E3A8A" text-anchor="middle">06</text>
    <text x="338" y="35" font-family="monospace" font-size="6.5" fill="#1D4ED8" text-anchor="middle">DISCOVER</text>
    <polygon points="366,28 372,28 369,24" fill="#7C3AED"/>
    <line x1="366" y1="28" x2="372" y2="28" stroke="#7C3AED" stroke-width="1"/>
    <!-- Stage 7 -->
    <rect x="372" y="12" width="56" height="32" rx="3" fill="#F5F3FF" stroke="#7C3AED" stroke-width="1"/>
    <text x="400" y="24" font-family="monospace" font-size="7" font-weight="700" fill="#4C1D95" text-anchor="middle">07</text>
    <text x="400" y="35" font-family="monospace" font-size="6.5" fill="#6D28D9" text-anchor="middle">EXECUTE</text>
    <polygon points="428,28 434,28 431,24" fill="#7C3AED"/>
    <line x1="428" y1="28" x2="434" y2="28" stroke="#7C3AED" stroke-width="1"/>
    <!-- Stage 8 -->
    <rect x="434" y="12" width="56" height="32" rx="3" fill="#F5F3FF" stroke="#7C3AED" stroke-width="1"/>
    <text x="462" y="24" font-family="monospace" font-size="7" font-weight="700" fill="#4C1D95" text-anchor="middle">08</text>
    <text x="462" y="35" font-family="monospace" font-size="6.5" fill="#6D28D9" text-anchor="middle">TRACK</text>
    <polygon points="490,28 496,28 493,24" fill="#7C3AED"/>
    <line x1="490" y1="28" x2="496" y2="28" stroke="#7C3AED" stroke-width="1"/>
    <!-- Stage 9 -->
    <rect x="496" y="12" width="56" height="32" rx="3" fill="#F5F3FF" stroke="#7C3AED" stroke-width="1"/>
    <text x="524" y="24" font-family="monospace" font-size="7" font-weight="700" fill="#4C1D95" text-anchor="middle">09</text>
    <text x="524" y="35" font-family="monospace" font-size="6.5" fill="#6D28D9" text-anchor="middle">ADAPT</text>
    <!-- Circular feedback arrow -->
    <path d="M 552 28 C 570 28 570 60 524 60 C 400 60 180 60 28 60 C 0 60 0 28 0 28" fill="none" stroke="#60A5FA" stroke-width="0.8" stroke-dasharray="3,2" opacity="0.5"/>
    <polygon points="0,24 0,32 -5,28" fill="#60A5FA" opacity="0.5" transform="translate(6,0)"/>
    <text x="290" y="68" font-family="monospace" font-size="6" fill="#60A5FA" text-anchor="middle" opacity="0.7">Continuous Closed-Loop Feedback &rarr; Context State Vector Updates</text>
    <!-- Phase labels -->
    <text x="90" y="8" font-family="monospace" font-size="5.5" fill="#047857" text-anchor="middle" font-weight="700">FOUNDATION</text>
    <text x="252" y="8" font-family="monospace" font-size="5.5" fill="#1D4ED8" text-anchor="middle" font-weight="700">SCAFFOLDING</text>
    <text x="462" y="8" font-family="monospace" font-size="5.5" fill="#6D28D9" text-anchor="middle" font-weight="700">EXECUTION LOOP</text>
  </svg>
</div>
"""
    return wrap_page(content, 6, 32, "The 9-Stage Continuous Student Lifecycle", "PART II &middot; CONCEPTUAL ARCHITECTURE")
