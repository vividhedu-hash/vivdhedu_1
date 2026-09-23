# case_study_builder/page_03_fragmentation.py
from styles import wrap_page

def get_page_03():
    content = """
<div class="kicker">Part I &middot; Empirical Research &amp; Market Audit</div>
<h1 class="headline">The Anatomy of Fragmentation</h1>
<div class="headline-sub">Why the current student journey is fundamentally broken into exploitative, siloed islands.</div>

<div class="lead-p">
  Comprehensive field research across Indian secondary and higher education reveals that the student journey is not an integrated pathway, 
  but a chaotic archipelago of disjointed point solutions. A typical high-school student attempting to build a competitive university profile 
  must simultaneously juggle 8 to 14 disparate services, none of which share data or coordinate long-term strategy.
</div>

<!-- AUDIT SCREENSHOT 1: EMPIRICAL SEARCH QUERY -->
<div class="research-ss-card" style="margin-bottom: 2.2mm;">
  <div class="research-ss-header">
    <div style="display: flex; align-items: center; gap: 4px;">
      <span style="width: 5px; height: 5px; border-radius: 50%; background: #EF4444; display: inline-block;"></span>
      <span style="width: 5px; height: 5px; border-radius: 50%; background: #F59E0B; display: inline-block;"></span>
      <span style="width: 5px; height: 5px; border-radius: 50%; background: #10B981; display: inline-block;"></span>
      <span style="margin-left: 6px; font-weight: 600; color: #E2E8F0;">EMPIRICAL FIELD AUDIT &middot; QUERY 01: HIGH SCHOOL PORTFOLIO BUILDING</span>
    </div>
    <div>SOURCE ARTIFACT &middot; CASE STUDY AUDIT SHEET</div>
  </div>
  <img src="extracted_assets/case_study_p01_img01.png" class="research-ss-img" alt="Case Study Query 1 Screenshot" style="max-height: 48mm; object-fit: contain; background: #0B0F19;" />
  <div class="research-ss-caption">
    <strong>EMPIRICAL RESEARCH FINDING:</strong> When queried for an intelligent platform that takes student profile, interests, and goals to autonomously 
    guide passion projects, research, and internships, the market responds: <em>"No. There is no single, one-stop digital platform available today."</em>
  </div>
</div>

<div class="grid-2" style="margin-bottom: 2mm;">
  <!-- LEFT COLUMN: INCUMBENT FAILURE TAXONOMY -->
  <div>
    <div class="card" style="border-top: 2px solid var(--rose); margin-bottom: 1.6mm; padding: 2.2mm 2.8mm;">
      <div class="card-title" style="margin-bottom: 0.8mm;">
        <span style="font-size: 7.8pt; font-weight: 700;">1. High-End Admissions Agencies</span>
        <span class="status-pill status-broken">&#8377;3L &ndash; &#8377;12L+</span>
      </div>
      <div style="font-family: var(--font-mono); font-size: 5.8pt; color: var(--text-light); margin-bottom: 0.8mm;">
        INCUMBENTS: Athena Education &middot; Crimson &middot; Rostrum
      </div>
      <p class="body-p" style="font-size: 7.4pt; line-height: 1.38; margin-bottom: 0;">
        Manual counseling reserved for top 1% wealth bracket. Relies on billable human counselor hours; advice varies wildly with counselor fatigue and turnover.
      </p>
    </div>

    <div class="card" style="border-top: 2px solid var(--amber); margin-bottom: 1.6mm; padding: 2.2mm 2.8mm;">
      <div class="card-title" style="margin-bottom: 0.8mm;">
        <span style="font-size: 7.8pt; font-weight: 700;">2. Specialized Research Incubators</span>
        <span class="status-pill status-underserved">$2k &ndash; $8k+</span>
      </div>
      <div style="font-family: var(--font-mono); font-size: 5.8pt; color: var(--text-light); margin-bottom: 0.8mm;">
        INCUMBENTS: Lumiere &middot; Pioneer Academics &middot; Horizon &middot; Spike Lab
      </div>
      <p class="body-p" style="font-size: 7.4pt; line-height: 1.38; margin-bottom: 0;">
        Single-purpose 1-on-1 PhD mentorship producing working papers. Ignores exam pacing (CBSE/JEE) and produces vanity preprints lacking true admissions credibility.
      </p>
    </div>

    <div class="card" style="border-top: 2px solid var(--purple); margin-bottom: 1.6mm; padding: 2.2mm 2.8mm;">
      <div class="card-title" style="margin-bottom: 0.8mm;">
        <span style="font-size: 7.8pt; font-weight: 700;">3. Passive Aggregators &amp; Portfolios</span>
        <span class="status-pill status-fragmented">Passive Silos</span>
      </div>
      <div style="font-family: var(--font-mono); font-size: 5.8pt; color: var(--text-light); margin-bottom: 0.8mm;">
        INCUMBENTS: Unstop &middot; Internshala &middot; Fueler &middot; Forage
      </div>
      <p class="body-p" style="font-size: 7.4pt; line-height: 1.38; margin-bottom: 0;">
        Open directories tailored for college grads. No diagnostic gap engine, no step-by-step scaffolding to help a school student build a project from zero.
      </p>
    </div>

    <div class="card" style="border-top: 2px solid var(--rose); margin-bottom: 0; padding: 2.2mm 2.8mm;">
      <div class="card-title" style="margin-bottom: 0.8mm;">
        <span style="font-size: 7.8pt; font-weight: 700;">4. Lead-Generation Discovery Portals</span>
        <span class="status-pill status-broken">Corrupted Fiduciary</span>
      </div>
      <div style="font-family: var(--font-mono); font-size: 5.8pt; color: var(--text-light); margin-bottom: 0.8mm;">
        INCUMBENTS: Shiksha &middot; CollegeDunia &middot; Careers360
      </div>
      <p class="body-p" style="font-size: 7.4pt; line-height: 1.38; margin-bottom: 0;">
        Operate under Cost-Per-Lead (CPL) kickbacks (&#8377;300&ndash;&#8377;2,500/lead). Algorithms steer unsuspecting students to private tier-3 colleges that pay the highest bounties.
      </p>
    </div>
  </div>

  <!-- RIGHT COLUMN: UNMET NEED SCREENSHOT & SYSTEMIC CRITIQUE -->
  <div>
    <div class="research-ss-card" style="margin-bottom: 1.8mm;">
      <div class="research-ss-header">
        <span style="font-weight: 600; color: #E2E8F0;">EMPIRICAL AUDIT &middot; THE UNMET STUDENT NEED</span>
        <span>SECTION 01.3</span>
      </div>
      <img src="extracted_assets/case_study_p01_img03.png" class="research-ss-img" alt="Unmet Needs Screenshot" style="max-height: 44mm; object-fit: contain; background: #0B0F19;" />
    </div>

    <div class="card-subtle" style="margin-bottom: 1.6mm; padding: 2.2mm 2.8mm;">
      <div style="font-family: var(--font-mono); font-size: 6.5pt; font-weight: 700; text-transform: uppercase; color: var(--accent); margin-bottom: 1mm;">
        Triad of Missing Infrastructure
      </div>
      <div style="font-size: 7.2pt; color: var(--text-muted); line-height: 1.4;">
        <div style="margin-bottom: 1mm;">
          <strong style="color: var(--text-main);">&bull; Dynamic Gap Analysis:</strong> Continuous audit of student profile against tier-1 college archetypes (e.g. <em>"Strong STEM, missing verified leadership"</em>).
        </div>
        <div style="margin-bottom: 1mm;">
          <strong style="color: var(--text-main);">&bull; Guided Scaffolding:</strong> Deconstructing massive research goals into weekly micro-sprints with cold-email templates and ethics checks.
        </div>
        <div>
          <strong style="color: var(--text-main);">&bull; Exam-Aware Balancing:</strong> Synchronizing project velocity with grueling Indian board cycles (CBSE/ISC/IB mid-terms and boards) to prevent burnout.
        </div>
      </div>
    </div>

    <div class="card-dark" style="margin-bottom: 0; padding: 2.2mm 2.8mm;">
      <div style="font-family: var(--font-mono); font-size: 6.2pt; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #60A5FA; margin-bottom: 0.8mm;">
        Core Architectural Thesis
      </div>
      <div style="font-size: 7.2pt; color: #E2E8F0; line-height: 1.38;">
        <strong>The market is not empty; it is fatally fragmented.</strong> Whitespace lies in replacing isolated point-tools with an integrated, deterministic feedback loop:
        <span style="color: #93C5FD; font-family: var(--font-mono); font-weight: 600;">ASSESS &rarr; DECIDE &rarr; ROADMAP &rarr; BUILD &rarr; DISCOVER &rarr; EXECUTE &rarr; ADAPT</span>.
      </div>
    </div>
  </div>
</div>
"""
    return wrap_page(content, 3, 32, "Empirical Research &amp; The Fragmentation Crisis", "PART I &middot; MARKET AUDIT")
