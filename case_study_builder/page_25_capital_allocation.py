# case_study_builder/page_25_capital_allocation.py
from styles import wrap_page

def get_page_25():
    content = """
<div class="kicker">Part XIII &middot; Capital Allocation &amp; Milestones</div>
<h1 class="headline">Series A Capital Deployment &amp; Runway</h1>
<div class="headline-sub">Disciplined deployment of the &#8377;8.5 Cr raise across five capital buckets over an 18-month horizon.</div>

<!-- 5 CAPITAL ALLOCATION BUCKETS -->
<div class="card-title-sm" style="margin-bottom: 1.5mm;">Series A Use of Funds (&#8377;8.50 Cr Total Raise &middot; 18-Month Runway)</div>
<div class="grid-2" style="margin-bottom: 2.2mm;">
  <div class="card" style="border-top: 2.5px solid var(--accent); padding: 2mm 2.8mm;">
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1mm;">
      <span style="font-weight: 700; font-size: 7.2pt; color: var(--text-main);">1. Engineering &amp; AI Infrastructure</span>
      <span style="font-family: var(--font-mono); font-weight: 700; color: var(--accent); font-size: 8pt;">38% &middot; &#8377;3.23 Cr</span>
    </div>
    <div style="font-size: 6.6pt; color: var(--text-muted); line-height: 1.35;">
      Dual-engine model routing (DeepSeek + Sonar), Airflow data ingestion mesh for 18 live sources, 
      in-memory Redis caching, and automated 3PL psychometric testing engines.
    </div>
  </div>

  <div class="card" style="border-top: 2.5px solid var(--green); padding: 2mm 2.8mm;">
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1mm;">
      <span style="font-weight: 700; font-size: 7.2pt; color: var(--text-main);">2. Campus Growth &amp; School Alliances</span>
      <span style="font-family: var(--font-mono); font-weight: 700; color: var(--green); font-size: 8pt;">25% &middot; &#8377;2.12 Cr</span>
    </div>
    <div style="font-size: 6.6pt; color: var(--text-muted); line-height: 1.35;">
      Onboarding 120 premium CBSE/IB schools, funding campus ambassador councils across 14 Tier-1 cities, 
      and sponsoring national STEM olympiad diagnostic tracks.
    </div>
  </div>

  <div class="card" style="border-top: 2.5px solid var(--purple); padding: 2mm 2.8mm;">
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1mm;">
      <span style="font-weight: 700; font-size: 7.2pt; color: var(--text-main);">3. Global PhD Research Mentorship Guild</span>
      <span style="font-family: var(--font-mono); font-weight: 700; color: var(--purple); font-size: 8pt;">16% &middot; &#8377;1.36 Cr</span>
    </div>
    <div style="font-size: 6.6pt; color: var(--text-muted); line-height: 1.35;">
      Recruiting and credentialing 85+ PhD mentors from Oxford, Cambridge, IISc, and IITs to deliver authentic 
      1-on-1 working paper incubation and editorial review.
    </div>
  </div>

  <div class="card" style="border-top: 2.5px solid var(--amber); padding: 2mm 2.8mm;">
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1mm;">
      <span style="font-weight: 700; font-size: 7.2pt; color: var(--text-main);">4. Bank Underwriting Integrations</span>
      <span style="font-family: var(--font-mono); font-weight: 700; color: var(--amber); font-size: 8pt;">12% &middot; &#8377;1.02 Cr</span>
    </div>
    <div style="font-size: 6.6pt; color: var(--text-muted); line-height: 1.35;">
      Building secure bank API gateways, RBI compliance adapters, and underwriting risk model sandboxes 
      with SBI, HDFC Credila, and sovereign educational loan providers.
    </div>
  </div>
</div>

<div class="card-subtle" style="padding: 1.8mm 2.5mm; margin-bottom: 2.2mm;">
  <div style="display: flex; justify-content: space-between; align-items: baseline;">
    <span style="font-weight: 700; font-size: 7.2pt; color: var(--text-main);">5. Legal Governance, DPDP Compliance &amp; Contingency Reserve</span>
    <span style="font-family: var(--font-mono); font-weight: 700; color: #64748B; font-size: 8pt;">9% &middot; &#8377;0.77 Cr</span>
  </div>
  <div style="font-size: 6.5pt; color: var(--text-muted); margin-top: 0.5mm;">
    Zero-leakage data encryption, Indian Digital Personal Data Protection (DPDP) Act compliance, and 6-month operational runway buffer.
  </div>
</div>

<!-- 36-MONTH MILESTONE ROADMAP -->
<div class="card-title-sm" style="margin-bottom: 1.2mm;">36-Month Horizon &middot; Value Creation Milestones</div>
<div class="table-wrap" style="margin-bottom: 0;">
  <table class="editorial-table">
    <thead>
      <tr>
        <th style="width: 14%;">Timeline</th>
        <th style="width: 24%;">Student Traction</th>
        <th style="width: 38%;">Product &amp; Ecosystem Deliverable</th>
        <th style="width: 24%;">Series B Valuation Trigger</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Month 06</strong></td>
        <td>12,000 Active Profiles</td>
        <td>Dual-Engine v2.0 live; 35 school partner pilot agreements locked.</td>
        <td>Validation of CAC &lt; &#8377;450</td>
      </tr>
      <tr>
        <td><strong>Month 12</strong></td>
        <td>24,000 Active Profiles</td>
        <td>2 commercial bank underwriting APIs deployed; &#8377;3.82 Cr Y1 rev hit.</td>
        <td>First 1,000 loan pre-verifications</td>
      </tr>
      <tr>
        <td><strong>Month 18</strong></td>
        <td>52,000 Active Profiles</td>
        <td>120 schools; 85 PhD mentors; Month 19 cashflow breakeven crossed.</td>
        <td>Self-sustaining profitability achieved</td>
      </tr>
      <tr>
        <td><strong>Month 24</strong></td>
        <td>110,000 Active Profiles</td>
        <td>National coaching software rollout; 4 partner banks; &#8377;14.28 Cr Y2 rev.</td>
        <td>Series B institutional raise trigger</td>
      </tr>
      <tr>
        <td><strong>Month 36</strong></td>
        <td>280,000 Active Profiles</td>
        <td>Complete sovereign student credential standard established across India.</td>
        <td>&#8377;42.60 Cr ARR &middot; Market Leadership</td>
      </tr>
    </tbody>
  </table>
</div>
"""
    return wrap_page(content, 25, 26, "Capital Allocation &amp; 36-Month Milestones", "PART XIII &middot; CAPITAL DEPLOYMENT")
