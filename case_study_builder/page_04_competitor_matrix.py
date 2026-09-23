# case_study_builder/page_04_competitor_matrix.py
from styles import wrap_page

def get_page_04():
    content = """
<div class="kicker">Part I &middot; Empirical Research &amp; Market Audit</div>
<h1 class="headline">Competitor Landscape &amp; The Unmet Need</h1>
<div class="headline-sub">Benchmarking incumbent platforms against essential student lifecycle requirements.</div>

<!-- QUERY 02 SCREENSHOT -->
<div class="research-ss-card" style="margin-bottom: 2mm;">
  <div class="research-ss-header">
    <div style="display: flex; align-items: center; gap: 4px;">
      <span style="width: 5px; height: 5px; border-radius: 50%; background: #EF4444; display: inline-block;"></span>
      <span style="width: 5px; height: 5px; border-radius: 50%; background: #F59E0B; display: inline-block;"></span>
      <span style="width: 5px; height: 5px; border-radius: 50%; background: #10B981; display: inline-block;"></span>
      <span style="margin-left: 6px; font-weight: 600; color: #E2E8F0;">EMPIRICAL FIELD AUDIT &middot; QUERY 02: PERSONALIZED COLLEGE COMPARISON &amp; ROI</span>
    </div>
    <div>SOURCE ARTIFACT &middot; SECTION 02.1</div>
  </div>
  <img src="extracted_assets/case_study_p02_img01.png" class="research-ss-img" alt="Query 2 Screenshot" style="max-height: 28mm; object-fit: contain; background: #0B0F19;" />
  <div class="research-ss-caption">
    <strong>AUDIT VERDICT:</strong> <em>"No single platform currently delivers an automated, truly personalized comparison of colleges that calculates tailored Return on Investment (ROI), net cost, and realistic career outcomes for your specific student profile."</em>
  </div>
</div>

<!-- MATRIX SCREENSHOT FROM RESEARCH STUDY -->
<div class="research-ss-card" style="margin-bottom: 2mm;">
  <div class="research-ss-header">
    <span style="font-weight: 600; color: #E2E8F0;">RAW FIELD ARTIFACT &middot; STUDENT NEEDS VS. EXISTING SOLUTIONS MATRIX</span>
    <span style="color: #60A5FA;">BENCHMARK AUDIT</span>
  </div>
  <img src="extracted_assets/case_study_p02_img02.png" class="research-ss-img" alt="Needs vs Solutions Matrix Screenshot" style="max-height: 48mm; object-fit: contain; background: #0B0F19;" />
</div>

<!-- ANALYTICAL DEEP DIVE TABLE -->
<div class="table-wrap" style="margin-bottom: 2mm;">
  <table class="editorial-table">
    <thead>
      <tr>
        <th style="width: 22%;">Student Journey Need</th>
        <th style="width: 22%;">Legacy Providers</th>
        <th style="width: 44%;">Structural Architectural Deficit</th>
        <th style="width: 12%;">Market Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Unbiased College Discovery</strong></td>
        <td>CollegeDunia, Shiksha</td>
        <td>Lead-gen model monetizes by selling student leads; prioritizes paying private colleges over fit.</td>
        <td><span class="status-pill status-broken">Broken</span></td>
      </tr>
      <tr>
        <td><strong>Branch-Level ROI Comparison</strong></td>
        <td>NIRF, Basic Portals</td>
        <td>Compares sticker fees vs. inflated college CTCs; hides base salary, stock grants, and branch dispersion.</td>
        <td><span class="status-pill status-unmet">Unmet</span></td>
      </tr>
      <tr>
        <td><strong>Aptitude &amp; Subject Selection</strong></td>
        <td>Mindler, Edumilestones</td>
        <td>Delivers one-time static PDF reports (Holland codes); fails to track continuous execution velocity.</td>
        <td><span class="status-pill status-partial">Partially Served</span></td>
      </tr>
      <tr>
        <td><strong>Step-by-Step Portfolio Roadmap</strong></td>
        <td>Athena, Crimson</td>
        <td>Prohibitively expensive (&#8377;3L&ndash;&#8377;12L+); inaccessible to 99% of middle-class households.</td>
        <td><span class="status-pill status-underserved">Severely Underserved</span></td>
      </tr>
      <tr>
        <td><strong>Academic Research Mentorship</strong></td>
        <td>Lumiere, Pioneer, Horizon</td>
        <td>Exorbitant fees ($2k&ndash;$8k); flooded with low-credibility vanity preprint publications.</td>
        <td><span class="status-pill status-underserved">Niche / Underserved</span></td>
      </tr>
      <tr>
        <td><strong>Extracurriculars &amp; Competitions</strong></td>
        <td>Unstop, Devpost</td>
        <td>Primarily target college engineers; high-school opportunities remain scattered and untracked.</td>
        <td><span class="status-pill status-fragmented">Fragmented</span></td>
      </tr>
      <tr>
        <td><strong>Age-Appropriate Work Experience</strong></td>
        <td>Forage, Clever Harvey</td>
        <td>Simulations lack true institutional weight; authentic minor internships are legally restricted.</td>
        <td><span class="status-pill status-partial">Underdeveloped</span></td>
      </tr>
    </tbody>
  </table>
</div>

<div class="card-dark" style="padding: 2.2mm 2.8mm; margin-bottom: 0;">
  <div style="font-family: var(--font-mono); font-size: 6.2pt; font-weight: 700; color: #60A5FA; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.8mm;">
    Architectural Solution &middot; The Student OS Paradigm Shift
  </div>
  <div style="font-size: 7.2pt; color: #CBD5E1; line-height: 1.38;">
    By inverting the business model from B2B university lead brokerage to a 100% student-aligned, subscription-based operating system, 
    Student OS reconciles all seven requirements inside a single continuous context engine. Every diagnostic directly seeds a project, 
    every project updates the admissions caliber, and every admissions milestone informs actuarial loan underwriting.
  </div>
</div>
"""
    return wrap_page(content, 4, 32, "Competitor Landscape &amp; Empirical Need Matrix", "PART I &middot; MARKET AUDIT")
