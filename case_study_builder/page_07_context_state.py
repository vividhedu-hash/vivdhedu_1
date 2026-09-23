# case_study_builder/page_07_context_state.py
from styles import wrap_page

def get_page_07():
    content = """
<div class="kicker">Part II &middot; Conceptual Architecture</div>
<h1 class="headline">The Persistent Student Context</h1>
<div class="headline-sub">Why sovereign longitudinal state is the defining technical moat of Student OS.</div>

<div class="lead-p">
  In traditional edtech, every interaction begins at zero. A student enters their details into a college search filter, 
  only to re-enter them on an internship portal, re-explain them to a human counselor, and type them from scratch into a generic chatbot. 
  Student OS replaces this amnesia with a <strong>central, immutable, persistent student context state machine</strong>.
</div>

<div class="col-sidebar" style="margin-bottom: 3mm;">
  <div>
    <div class="card-title-sm">The 8 Ingested Context Vectors</div>
    <p class="body-p">
      During onboarding and subsequent platform telemetry, Student OS constructs a high-dimensional state vector 
      <span style="font-family: var(--font-mono); font-weight: 600; color: var(--accent);">&mathbf;S&sub;t</span> that continuously travels through every platform module:
    </p>
    
    <div class="table-wrap">
      <table class="editorial-table">
        <thead>
          <tr>
            <th style="width: 25%;">Vector Dimension</th>
            <th style="width: 45%;">Calibrated Student Attribute</th>
            <th style="width: 30%;">Downstream Consumer</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Journey Stage</strong></td>
            <td>Class 11&ndash;12 (Undergraduate Trajectory)</td>
            <td>Roadmap, Exam Schedulers</td>
          </tr>
          <tr>
            <td><strong>2. Disciplinary Curiosity</strong></td>
            <td>Quantitative Economics &amp; Applied Econometrics</td>
            <td>Recent Waves, Research Labs</td>
          </tr>
          <tr>
            <td><strong>3. Decision Weights</strong></td>
            <td>Career Outcomes (95%), Affordability (82%), Prestige (70%)</td>
            <td>Actuarial ROI Engine</td>
          </tr>
          <tr>
            <td><strong>4. Financial Constraints</strong></td>
            <td>$35,000&ndash;$65,000 / yr, Need-Aware Scholarship</td>
            <td>Admissions Portfolio Tiers</td>
          </tr>
          <tr>
            <td><strong>5. Geographic Mobility</strong></td>
            <td>UK, Europe &amp; Global Hubs (Tier 2/PSW Viability)</td>
            <td>Cross-Border Actuarial Math</td>
          </tr>
          <tr>
            <td><strong>6. Immediate Focus</strong></td>
            <td>SSRN Working Paper &middot; SAT 1500+ &middot; Lab Mentorship</td>
            <td>AI Workspace, Sprint Pacing</td>
          </tr>
          <tr>
            <td><strong>7. Latent Diagnostic</strong></td>
            <td>Initial AI Resilience 87/100 (Upper Decile Baseline)</td>
            <td>Trajectory Projections</td>
          </tr>
          <tr>
            <td><strong>8. Profile Primary Gap</strong></td>
            <td>Lacks Institutional Faculty Co-Authorship (+2.4x odds)</td>
            <td>Advisory &amp; Opportunity Match</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  
  <div>
    <div class="card-accent" style="height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div class="card-title" style="color: var(--accent-dark); margin-bottom: 1.5mm;">
          <span>Zero-Friction Continuity</span>
          <span class="epistemic-tag tag-response">Core UX Invariant</span>
        </div>
        <p class="body-p" style="color: var(--text-main); font-size: 7.4pt; line-height: 1.45;">
          The student articulates their identity and constraints exactly once. That unified intelligence state is then 
          universally projected across all 9 operating modules:
        </p>
        
        <div style="display: flex; flex-direction: column; gap: 1.5mm; margin-top: 2mm;">
          <div style="font-family: var(--font-mono); font-size: 6.5pt; background: #FFFFFF; padding: 3px 6px; border-radius: 2px; border: 0.5pt solid #BFDBFE;">
            &bull; <strong>Structured AI:</strong> Answers with full knowledge of budget &amp; gaps
          </div>
          <div style="font-family: var(--font-mono); font-size: 6.5pt; background: #FFFFFF; padding: 3px 6px; border-radius: 2px; border: 0.5pt solid #BFDBFE;">
            &bull; <strong>Outcomes/ROI:</strong> Conditions salary projections on latent ability
          </div>
          <div style="font-family: var(--font-mono); font-size: 6.5pt; background: #FFFFFF; padding: 3px 6px; border-radius: 2px; border: 0.5pt solid #BFDBFE;">
            &bull; <strong>Roadmap:</strong> Auto-pauses sprints during pre-board exams
          </div>
          <div style="font-family: var(--font-mono); font-size: 6.5pt; background: #FFFFFF; padding: 3px 6px; border-radius: 2px; border: 0.5pt solid #BFDBFE;">
            &bull; <strong>Recent Waves:</strong> Filters noise out of 10,000 global opportunities
          </div>
        </div>
      </div>
      
      <div style="border-top: 0.5pt solid #BFDBFE; padding-top: 2mm; margin-top: 2mm;">
        <div style="font-family: var(--font-mono); font-size: 6.0pt; font-weight: 700; text-transform: uppercase; color: var(--accent-dark); margin-bottom: 0.8mm;">
          Longitudinal Evolution
        </div>
        <div style="font-size: 7.0pt; color: var(--text-muted); line-height: 1.35;">
          Unlike static forms, <strong>S<sub>t</sub></strong> mutates dynamically as the student executes tasks, unlocks credentials, or updates their financial posture.
        </div>
      </div>
    </div>
  </div>
</div>
"""
    return wrap_page(content, 7, 32, "The Persistent Student Context State Machine", "PART II &middot; CONCEPTUAL ARCHITECTURE")
