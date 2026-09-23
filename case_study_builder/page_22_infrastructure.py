# case_study_builder/page_22_infrastructure.py
from styles import wrap_page

def get_page_22():
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
        <p class="body-p" style="font-size: 7.2pt; line-height: 1.38; margin-bottom: 1.5mm;">
          The relational schema enforces strict integrity across four isolated data domains:
        </p>
        <div style="font-family: var(--font-mono); font-size: 6.2pt; color: var(--text-muted); line-height: 1.45;">
          <strong>1. Student State:</strong> `students`, `academic_profiles`, `psychometric_traits`, `financial_constraints`, `student_decision_weights`<br>
          <strong>2. Institutional Mesh:</strong> `institutions`, `programs`, `placement_audits`, `historical_cutoffs`, `course_marketplace_items`<br>
          <strong>3. Actuarial Risk:</strong> `actuarial_roi_simulations`, `labor_risk_vectors`, `task_automation_curves`, `cross_border_visa_odds`<br>
          <strong>4. Execution Loop:</strong> `roadmap_nodes`, `milestone_sprints`, `portfolio_artifacts`, `research_projects`, `opportunity_feed_items`, `telemetry_logs`, `advisory_sessions`
        </div>
      </div>
      
      <div style="font-family: var(--font-mono); font-size: 5.8pt; color: var(--accent); border-top: 0.5pt solid var(--border); padding-top: 1mm;">
        STACK: FASTAPI &middot; POSTGRESQL 15 &middot; REDIS CACHE &middot; CELERY AIRFLOW
      </div>
    </div>
  </div>
</div>

<div class="card-dark" style="margin-bottom: 0;">
  <div style="font-family: var(--font-mono); font-size: 6.5pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #60A5FA; margin-bottom: 1mm;">
    Cryptographic Verification &middot; Zero-Hallucination Mandate
  </div>
  <div style="font-size: 7.4pt; color: #E2E8F0; line-height: 1.45;">
    Every placement number and cutoff displayed in the UI is tied to an immutable cryptographic hash of the source government audit filing. 
    If a private college inflates its median salary or hides unplaced batches, the ingestion pipeline automatically flags the divergence 
    and quarantines the record, preserving 100% fiduciary reliability for students and underwriting lenders.
  </div>
</div>
<div style="margin-top:2mm;">
  <div class="card-title-sm" style="margin-bottom:1.5mm;">The 18-Connector Data Mesh &mdash; Architectural Flow</div>
  <svg viewBox="0 0 580 85" width="100%" xmlns="http://www.w3.org/2000/svg">
    <!-- Central DB node -->
    <rect x="235" y="22" width="110" height="42" rx="5" fill="#090D16" stroke="#1A6CF6" stroke-width="1.5"/>
    <text x="290" y="38" font-family="monospace" font-size="7.5" font-weight="700" fill="#60A5FA" text-anchor="middle">PostgreSQL 15</text>
    <text x="290" y="50" font-family="monospace" font-size="6.5" fill="#94A3B8" text-anchor="middle">21-Table Schema</text>
    <text x="290" y="60" font-family="monospace" font-size="6" fill="#64748B" text-anchor="middle">Redis Cache Layer</text>
    <!-- Left side connectors -->
    <!-- Gov & Macro -->
    <rect x="2" y="4" width="85" height="22" rx="3" fill="#F0FDF4" stroke="#0D9488" stroke-width="0.75"/>
    <text x="44" y="14" font-family="monospace" font-size="6" font-weight="700" fill="#065F46" text-anchor="middle">GOVERNMENT &amp; MACRO</text>
    <text x="44" y="22" font-family="monospace" font-size="5.5" fill="#047857" text-anchor="middle">NIRF · AICTE · RBI · MoSPI</text>
    <line x1="87" y1="15" x2="235" y2="38" stroke="#0D9488" stroke-width="0.7" stroke-dasharray="3,2" opacity="0.6"/>
    <!-- Live Cutoff -->
    <rect x="2" y="32" width="85" height="22" rx="3" fill="#EFF6FF" stroke="#1A6CF6" stroke-width="0.75"/>
    <text x="44" y="42" font-family="monospace" font-size="6" font-weight="700" fill="#1E3A8A" text-anchor="middle">LIVE CUTOFFS</text>
    <text x="44" y="50" font-family="monospace" font-size="5.5" fill="#1D4ED8" text-anchor="middle">JoSAA · CSAB · JAC Delhi</text>
    <line x1="87" y1="43" x2="235" y2="43" stroke="#1A6CF6" stroke-width="0.7" stroke-dasharray="3,2" opacity="0.6"/>
    <!-- Compensation -->
    <rect x="2" y="60" width="85" height="22" rx="3" fill="#FFF7ED" stroke="#D97706" stroke-width="0.75"/>
    <text x="44" y="70" font-family="monospace" font-size="6" font-weight="700" fill="#92400E" text-anchor="middle">COMPENSATION</text>
    <text x="44" y="78" font-family="monospace" font-size="5.5" fill="#B45309" text-anchor="middle">Levels.fyi · AmbitionBox · BLS</text>
    <line x1="87" y1="71" x2="235" y2="50" stroke="#D97706" stroke-width="0.7" stroke-dasharray="3,2" opacity="0.6"/>
    <!-- Right side connectors -->
    <!-- Research & Code -->
    <rect x="493" y="4" width="85" height="22" rx="3" fill="#F5F3FF" stroke="#7C3AED" stroke-width="0.75"/>
    <text x="535" y="14" font-family="monospace" font-size="6" font-weight="700" fill="#4C1D95" text-anchor="middle">RESEARCH &amp; CODE</text>
    <text x="535" y="22" font-family="monospace" font-size="5.5" fill="#6D28D9" text-anchor="middle">SSRN · arXiv · GitHub GraphQL</text>
    <line x1="493" y1="15" x2="345" y2="38" stroke="#7C3AED" stroke-width="0.7" stroke-dasharray="3,2" opacity="0.6"/>
    <!-- Visa & Actuarial -->
    <rect x="493" y="32" width="85" height="22" rx="3" fill="#FEF2F2" stroke="#DC2626" stroke-width="0.75"/>
    <text x="535" y="42" font-family="monospace" font-size="6" font-weight="700" fill="#991B1B" text-anchor="middle">VISA &amp; ACTUARIAL</text>
    <text x="535" y="50" font-family="monospace" font-size="5.5" fill="#DC2626" text-anchor="middle">USCIS H-1B · UK Home · PSW</text>
    <line x1="493" y1="43" x2="345" y2="43" stroke="#DC2626" stroke-width="0.7" stroke-dasharray="3,2" opacity="0.6"/>
    <!-- Opportunity -->
    <rect x="493" y="60" width="85" height="22" rx="3" fill="#FFFBEB" stroke="#D97706" stroke-width="0.75"/>
    <text x="535" y="70" font-family="monospace" font-size="6" font-weight="700" fill="#92400E" text-anchor="middle">OPPORTUNITY</text>
    <text x="535" y="78" font-family="monospace" font-size="5.5" fill="#B45309" text-anchor="middle">Unstop · Devpost · Fellowships</text>
    <line x1="493" y1="71" x2="345" y2="50" stroke="#D97706" stroke-width="0.7" stroke-dasharray="3,2" opacity="0.6"/>
    <!-- Celery + Airflow labels -->
    <text x="145" y="82" font-family="monospace" font-size="6" fill="#64748B" text-anchor="middle">Celery Workers &rarr;</text>
    <text x="435" y="82" font-family="monospace" font-size="6" fill="#64748B" text-anchor="middle">&larr; Apache Airflow DAGs</text>
    <text x="290" y="82" font-family="monospace" font-size="6" fill="#60A5FA" text-anchor="middle" font-weight="600">FastAPI Async Gateway &middot; In-Memory Redis &middot; &le; &#8377;8.20 / Session</text>
  </svg>
</div>
"""
    return wrap_page(content, 22, 32, "Enterprise Infrastructure &amp; Ingestion Mesh", "PART VIII &middot; SYSTEM ARCHITECTURE")
