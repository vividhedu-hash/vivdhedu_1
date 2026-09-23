# case_study_builder/page_14_ai_workspace.py
from styles import wrap_page

def get_page_14():
    content = r"""
<div class="kicker">Part V &middot; The Orchestration Layer</div>
<h1 class="headline">Structured AI Workspace &middot; Not a Chatbot</h1>
<div class="headline-sub">Why conversational chat bubbles fail and how the Dual-Engine Architecture orchestrates action.</div>

<div class="lead-p">
  The edtech landscape is saturated with generic LLM chat wrappers that offer flattering, conversational responses. 
  For a high-stakes educational decision, a chat bubble is fatally flawed: it indulges in sycophancy, hallucinates cutoffs, 
  and terminates in passive text. Student OS re-architects AI as a <strong>structured decision and orchestration workspace</strong>.
</div>

<div class="col-sidebar" style="margin-bottom: 2.5mm;">
  <div>
    <div class="card-title-sm">The 4 Systemic Failures of Conversational Chatbots</div>
    <div class="table-wrap">
      <table class="editorial-table">
        <thead>
          <tr>
            <th style="width: 28%;">Chatbot Failure Mode</th>
            <th style="width: 72%;">Impact on Student Admissions &amp; Career Trajectory</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Sycophantic "Yes-Man" Bias</strong></td>
            <td>Generalist LLMs are trained to be agreeable. If a student proposes writing an obscure essay instead of studying for math, the chatbot compliments the idea, giving dangerous false reassurance.</td>
          </tr>
          <tr>
            <td><strong>2. Hallucinated Cutoffs</strong></td>
            <td>Admissions cutoffs shift annually. Static LLM weights generate outdated or entirely fabricated score thresholds and visa regulations.</td>
          </tr>
          <tr>
            <td><strong>3. Conversational Drift</strong></td>
            <td>Chat bubbles produce sprawling walls of text without structure, forcing the student to manually parse actionable priorities.</td>
          </tr>
          <tr>
            <td><strong>4. Zero Execution Telemetry</strong></td>
            <td>Chatbots cannot directly modify roadmaps, schedule test-prep sprints, or update verified portfolio repositories.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  
  <div>
    <div class="card-accent" style="height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div class="card-title-sm" style="color: var(--accent-dark);">Anti-Yes-Man Fiduciary Directive</div>
        <p class="body-p" style="font-size: 7.2pt; color: var(--text-main); line-height: 1.45;">
          Student OS strictly enforces a zero-sycophancy prompt contract. The AI is forbidden from sugarcoating reality. 
          If an extracurricular project yields diminishing marginal returns compared to entrance test cutoffs, 
          the system issues a direct, uncompromising pivot recommendation.
        </p>
      </div>
      <div style="font-family: var(--font-mono); font-size: 5.8pt; color: var(--accent-dark); border-top: 0.5pt solid #BFDBFE; padding-top: 1.5mm;">
        FIDUCIARY MANDATE: ZERO INSTITUTIONAL KICKBACKS &middot; RADICAL HONESTY
      </div>
    </div>
  </div>
</div>

<div class="card-dark" style="margin-bottom: 0;">
  <div style="font-family: var(--font-mono); font-size: 6.2pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #60A5FA; margin-bottom: 1.5mm;">
    The Dual-Engine Intelligence Hierarchy &middot; 5-Step Fork-and-Join Pipeline
  </div>
  <div class="grid-2" style="font-size: 7.2pt; color: #E2E8F0; line-height: 1.45;">
    <div>
      <strong style="color: #93C5FD;">DeepSeek V4 Flash (The Reasoning Core):</strong> Maintains the complete longitudinal student context 
      vector $\mathbf{S}_t$, latent trait scores $\hat{\theta}$, budget ceilings, and historical sprint velocities. 
      Executes deep trade-off reasoning across multi-year paths.
    </div>
    <div>
      <strong style="color: #93C5FD;">Perplexity Sonar (The Real-Time Detective):</strong> Concurrently forks live web queries to verify latest 
      admissions matrix updates, UK visa post-study work rules, and verified internship application deadlines, joining facts into the mathematical engine.
    </div>
  </div>
  <div style="margin-top: 2mm; padding-top: 1.5mm; border-top: 0.5pt solid rgba(255,255,255,0.1); font-family: var(--font-mono); font-size: 6pt; color: #94A3B8;">
    OPERATIONAL PARADIGM: QUESTION &rarr; DUAL-ENGINE INTELLIGENCE &rarr; PROBABILISTIC DECISION &rarr; DIRECT ROADMAP ACTION
  </div>
</div>
"""
    return wrap_page(content, 14, 26, "Structured AI Workspace vs. Chatbots", "PART V &middot; THE ORCHESTRATION LAYER")
