# case_study_builder/page_19_infrastructure.py
from styles import wrap_page

def get_page_19():
    content = """
<div class="kicker">Part VIII &middot; Enterprise Systems Architecture</div>
<h1 class="headline">Data Mesh &amp; Relational Infrastructure</h1>
<div class="headline-sub">18 automated ingestion connectors and a 21-table production schema powering zero-hallucination telemetry.</div>

<div class="lead-p">
  An intelligence platform is only as credible as its underlying data infrastructure. Rather than relying on crowdsourced forum posts 
  or unverified marketing brochures, Student OS deploys an automated data ingestion mesh querying 18 primary sources, 
  feeding a normalized 21-table PostgreSQL 15+ relational database.
</div>

<div class="col-sidebar" style="margin-bottom: 2.5mm;">
  <div>
    <div class="card-title-sm">The 18 Automated Ingestion Connectors</div>
    <div class="table-wrap">
      <table class="editorial-table">
        <thead>
          <tr>
            <th style="width: 25%;">Connector Group</th>
            <th style="width: 45%;">Primary Data Sources &amp; Protocols</th>
            <th style="width: 30%;">Ingestion Cadence</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Government &amp; Macro</strong></td>
            <td>NIRF API, AICTE Disclosures, MoSPI Economic Data, RBI, World Bank</td>
            <td>Weekly &middot; Apache Airflow</td>
          </tr>
          <tr>
            <td><strong>Live Cutoff Portals</strong></td>
            <td>JoSAA / CSAB Scraper, JAC Delhi, WBJEE, UCAS Admissions Matrix</td>
            <td>Daily during season</td>
          </tr>
          <tr>
            <td><strong>Verified Compensation</strong></td>
            <td>Levels.fyi API, AmbitionBox Salary Mesh, US BLS O*NET Database</td>
            <td>Real-Time &middot; Webhook Sync</td>
          </tr>
          <tr>
            <td><strong>Research &amp; Code</strong></td>
            <td>SSRN Working Papers, arXiv CS/Econ, GitHub GraphQL API</td>
            <td>Live telemetry / OAuth</td>
          </tr>
          <tr>
            <td><strong>Visas &amp; Actuarial FX</strong></td>
            <td>USCIS H-1B Lottery, UK Home Office PSW, Live Forex API</td>
            <td>Weekly / Hourly FX delta</td>
          </tr>
          <tr>
            <td><strong>Opportunity Telemetry</strong></td>
            <td>Unstop, Devpost, Global Fellowship Portals, Faculty Lab feeds</td>
            <td>Daily continuous polling</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  
  <div>
    <div class="card-subtle" style="height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div class="card-title-sm">21 Core PostgreSQL Tables</div>
        <p class="body-p" style="font-size: 6.8pt; line-height: 1.35; margin-bottom: 1.5mm;">
          The relational schema enforces strict integrity across four isolated data domains:
        </p>
        <div style="font-family: var(--font-mono); font-size: 5.8pt; color: var(--text-muted); line-height: 1.45;">
          <strong>1. Student State:</strong> `students`, `academic_profiles`, `psychometric_traits`, `financial_constraints`, `student_decision_weights`<br>
          <strong>2. Institutional Mesh:</strong> `institutions`, `programs`, `placement_audits`, `historical_cutoffs`, `course_marketplace_items`<br>
          <strong>3. Actuarial Risk:</strong> `actuarial_roi_simulations`, `labor_risk_vectors`, `task_automation_curves`, `cross_border_visa_odds`<br>
          <strong>4. Execution Loop:</strong> `roadmap_nodes`, `milestone_sprints`, `portfolio_artifacts`, `research_projects`, `opportunity_feed_items`, `telemetry_logs`, `advisory_sessions`
        </div>
      </div>
      
      <div style="font-family: var(--font-mono); font-size: 5.5pt; color: var(--accent); border-top: 0.5pt solid var(--border); padding-top: 1mm;">
        STACK: FASTAPI &middot; POSTGRESQL 15 &middot; REDIS CACHE &middot; CELERY AIRFLOW
      </div>
    </div>
  </div>
</div>

<div class="card-dark" style="margin-bottom: 0;">
  <div style="font-family: var(--font-mono); font-size: 6.2pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #60A5FA; margin-bottom: 1mm;">
    Cryptographic Verification &middot; Zero-Hallucination Mandate
  </div>
  <div style="font-size: 7.2pt; color: #E2E8F0; line-height: 1.45;">
    Every placement number and cutoff displayed in the UI is tied to an immutable cryptographic hash of the source government audit filing. 
    If a private college inflates its median salary or hides unplaced batches, the ingestion pipeline automatically flags the divergence 
    and quarantines the record, preserving 100% fiduciary reliability for students and underwriting lenders.
  </div>
</div>
"""
    return wrap_page(content, 19, 26, "Enterprise Infrastructure &amp; Ingestion Mesh", "PART VIII &middot; SYSTEM ARCHITECTURE")
