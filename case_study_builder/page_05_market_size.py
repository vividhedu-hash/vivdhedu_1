# case_study_builder/page_05_market_size.py
from styles import wrap_page

def get_page_05():
    content = """
<div class="kicker">Part I &middot; Empirical Research &amp; Market Audit</div>
<h1 class="headline">Macro Crisis, Market Sizing &amp; Monetization Audit</h1>
<div class="headline-sub">The &#8377;180B addressable education spend, systemic bad loans, and incumbent business model failures.</div>

<!-- MACRO METRIC TILES -->
<div class="kpi-row" style="margin-bottom: 2mm;">
  <div class="kpi-tile">
    <div class="kpi-val accent">&#8377;180B</div>
    <div class="kpi-label">Total Spend TAM</div>
    <div class="kpi-sub">Total annual pool across guidance, loans, skilling &amp; research</div>
  </div>
  <div class="kpi-tile">
    <div class="kpi-val">&#8377;38B</div>
    <div class="kpi-label">Serviceable SAM</div>
    <div class="kpi-sub">Top 20% urban/semi-urban aspirational student households</div>
  </div>
  <div class="kpi-tile">
    <div class="kpi-val rose">&#8377;39k Cr</div>
    <div class="kpi-label">Bank NPA Crisis</div>
    <div class="kpi-sub">Defaulted student loans sitting on Indian bank books (RBI 2025)</div>
  </div>
  <div class="kpi-tile">
    <div class="kpi-val amber">84%</div>
    <div class="kpi-label">Fake Resume Epidemic</div>
    <div class="kpi-sub">Resumes containing unverified claims or LLM-hallucinated projects</div>
  </div>
</div>

<!-- EMBEDDED RESEARCH ARTIFACTS: QUERY 3 & MONETIZATION TABLE -->
<div class="grid-2" style="margin-bottom: 2.2mm;">
  <div class="research-ss-card" style="margin-bottom: 0;">
    <div class="research-ss-header">
      <span style="font-weight: 600; color: #E2E8F0;">RESEARCH ARTIFACT &middot; INCUMBENT SERVICES</span>
      <span>SECTION 03.1</span>
    </div>
    <img src="extracted_assets/case_study_p03_img01.png" class="research-ss-img" alt="Products and Target Users Screenshot" style="max-height: 38mm; object-fit: contain; background: #0B0F19;" />
    <div class="research-ss-caption">
      <strong>RESEARCH VERDICT:</strong> <em>"The gap is not 'there is no portfolio builder.' The gap is that solutions focus on one piece rather than taking a student from assessment &rarr; roadmap &rarr; projects &rarr; completed portfolio in one system."</em>
    </div>
  </div>

  <div class="research-ss-card" style="margin-bottom: 0;">
    <div class="research-ss-header">
      <span style="font-weight: 600; color: #E2E8F0;">RESEARCH ARTIFACT &middot; MONETIZATION MODES</span>
      <span>SECTION 03.2</span>
    </div>
    <img src="extracted_assets/case_study_p03_img02.png" class="research-ss-img" alt="Existing Monetization Modes Screenshot" style="max-height: 38mm; object-fit: contain; background: #0B0F19;" />
    <div class="research-ss-caption">
      <strong>MONETIZATION FLAW:</strong> Most existing players monetize through fragmented program fees (&#8377;50k&ndash;&#8377;2.5L), locking students into expensive point-contracts rather than delivering an integrated, affordable subscription.
    </div>
  </div>
</div>

<!-- 2-COLUMN DEEP DIVE: MARKET POOL BREAKDOWN & 3 MACRO CONVERGENCES -->
<div class="grid-2" style="margin-bottom: 2mm;">
  <!-- LEFT: TAM BREAKDOWN -->
  <div class="card" style="padding: 2.2mm 2.8mm; margin-bottom: 0;">
    <div class="card-title-sm" style="margin-bottom: 1.2mm;">Addressable Market Pool Breakdown (&#8377;180B TAM)</div>
    <div style="font-size: 7.2pt; color: var(--text-muted); line-height: 1.42;">
      <div style="display: flex; justify-content: space-between; border-bottom: 0.5pt solid var(--border); padding-bottom: 0.8mm; margin-bottom: 1mm;">
        <span><strong>1. College Discovery &amp; Admissions Guidance:</strong></span>
        <span style="font-family: var(--font-mono); font-weight: 700; color: var(--accent);">&#8377;62,000 Cr</span>
      </div>
      <div style="display: flex; justify-content: space-between; border-bottom: 0.5pt solid var(--border); padding-bottom: 0.8mm; margin-bottom: 1mm;">
        <span><strong>2. Student Higher-Ed Loan Origination Fees:</strong></span>
        <span style="font-family: var(--font-mono); font-weight: 700; color: var(--accent);">&#8377;78,000 Cr</span>
      </div>
      <div style="display: flex; justify-content: space-between; border-bottom: 0.5pt solid var(--border); padding-bottom: 0.8mm; margin-bottom: 1mm;">
        <span><strong>3. Online Skilling &amp; Vocational Certifications:</strong></span>
        <span style="font-family: var(--font-mono); font-weight: 700; color: var(--accent);">&#8377;28,000 Cr</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding-bottom: 0.5mm;">
        <span><strong>4. High-School Research &amp; Portfolio Mentorship:</strong></span>
        <span style="font-family: var(--font-mono); font-weight: 700; color: var(--accent);">&#8377;12,000 Cr</span>
      </div>
    </div>
    <div style="font-size: 6.6pt; color: var(--text-light); margin-top: 1.2mm; font-style: italic;">
      Student OS establishes revenue capture across all four buckets via a single continuous student relationship.
    </div>
  </div>

  <!-- RIGHT: THE THREE MACRO CATALYSTS -->
  <div class="card-subtle" style="padding: 2.2mm 2.8mm; margin-bottom: 0;">
    <div class="card-title-sm" style="color: var(--accent-dark); margin-bottom: 1.2mm;">The Three Urgent Macro Catalysts</div>
    <div style="font-size: 7.2pt; color: var(--text-muted); line-height: 1.38;">
      <div style="margin-bottom: 1.2mm;">
        <strong style="color: var(--rose);">1. The &#8377;39,000 Cr Banking Default Cliff:</strong> Public and private banks are suffocating under bad student loans generated by fraudulent placement claims. Lenders urgently demand verified, actuarially sound student underwriting.
      </div>
      <div style="margin-bottom: 1.2mm;">
        <strong style="color: var(--amber);">2. The 84% Resume Plagiarism Crisis:</strong> With LLMs flooding admissions offices and recruiters with synthetic resumes, recruiters discount unverified claims. Cryptographically verified GitHub/SSRN work is the only surviving signal.
      </div>
      <div>
        <strong style="color: var(--green);">3. The -78% Model Inference Cost Deflation:</strong> The emergence of DeepSeek V4 and Perplexity Sonar brings high-reasoning inference below &#8377;10 per diagnostic session, making software-delivered elite mentorship economically viable at scale.
      </div>
    </div>
  </div>
</div>
"""
    return wrap_page(content, 5, 32, "Macro Crisis, Market Sizing &amp; Monetization", "PART I &middot; MARKET AUDIT")
