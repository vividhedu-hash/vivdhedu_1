# case_study_builder/page_29_stress_tests.py
from styles import wrap_page

def get_page_29():
    content = """
<div class="kicker">Risk Governance &middot; Downside Sensitivity</div>
<h1 class="headline">Downside Stress Tests &amp; Enterprise Risk Governance</h1>
<div class="headline-sub">Rigorous 3-scenario Monte Carlo sensitivity analysis, regulatory compliance moats &amp; operational risk mitigation.</div>

<div class="lead-p">
  Prudent institutional underwriting requires testing enterprise solvency under severe market dislocations. 
  <strong>Student OS has been subjected to comprehensive Year-2 stress testing across Bear, Base, and Bull macroeconomic scenarios</strong>, 
  incorporating sharp downturns in domestic IT hiring, currency shocks affecting overseas study, and changes in educational privacy regulations.
</div>

<div class="kpi-row">
  <div class="kpi-tile">
    <div class="kpi-val accent">&#8377;14.28 Cr</div>
    <div class="kpi-label">Base Case (Y2)</div>
    <div class="kpi-sub">Expected revenue with 24.2% operating margin</div>
  </div>
  <div class="kpi-tile">
    <div class="kpi-val rose">&#8377;4.80 Cr</div>
    <div class="kpi-label">Bear Stress Case</div>
    <div class="kpi-sub">Severe downturn: IT hiring freeze + 40% B2B school drop</div>
  </div>
  <div class="kpi-tile">
    <div class="kpi-val green">&#8377;22.80 Cr</div>
    <div class="kpi-label">Bull Upside Case</div>
    <div class="kpi-sub">Accelerated school adoption + 35% portfolio uptake</div>
  </div>
  <div class="kpi-tile">
    <div class="kpi-val purple">21 Months</div>
    <div class="kpi-label">Zero-Rev Runway</div>
    <div class="kpi-sub">Cash preservation buffer under zero revenue assumption</div>
  </div>
</div>

<div class="card-title-sm" style="margin-top: 2mm;">Three-Scenario Year-2 Sensitivity &amp; Operational Matrix</div>
<div class="table-wrap">
  <table class="editorial-table">
    <thead>
      <tr>
        <th style="width: 22%;">Stress Dimension</th>
        <th style="width: 26%;">Bear Scenario (Severe Recession)</th>
        <th style="width: 26%;">Base Case (Planned Trajectory)</th>
        <th style="width: 26%;">Bull Case (Market Outperformance)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Paid Student Subscriptions</strong></td>
        <td>18,000 subscribers (40% below target)</td>
        <td><strong>34,500 active subscribers</strong></td>
        <td>52,000 active subscribers</td>
      </tr>
      <tr>
        <td><strong>Flagship Portfolio Cohort</strong></td>
        <td>1,200 students (High price sensitivity)</td>
        <td><strong>3,800 enrolled fellows</strong></td>
        <td>6,200 enrolled fellows</td>
      </tr>
      <tr>
        <td><strong>Marketplace Transactions</strong></td>
        <td>&#8377;65 Lakhs gross merchandise value</td>
        <td><strong>&#8377;2.10 Crore GMV (22.5% take rate)</strong></td>
        <td>&#8377;4.50 Crore GMV</td>
      </tr>
      <tr>
        <td><strong>Total Annual Revenue</strong></td>
        <td><strong style="color: var(--rose);">&#8377;4.80 Crore</strong></td>
        <td><strong style="color: var(--accent);">&#8377;14.28 Crore</strong></td>
        <td><strong style="color: var(--green);">&#8377;22.80 Crore</strong></td>
      </tr>
      <tr>
        <td><strong>Operating EBITDA</strong></td>
        <td>-&#8377;1.10 Crore (Deficit funded by cash reserves)</td>
        <td><strong>+&#8377;3.46 Crore (+24.2% Margin)</strong></td>
        <td>+&#8377;8.10 Crore (+35.5% Margin)</td>
      </tr>
      <tr>
        <td><strong>Survival &amp; Strategic Pivot</strong></td>
        <td>Freeze hiring at 22 FTEs; prioritize B2B software</td>
        <td>Scale headcount to 34 FTEs; launch global pilot</td>
        <td>Accelerate US/UK cross-border degree expansion</td>
      </tr>
    </tbody>
  </table>
</div>

<div class="grid-2" style="margin-top: 2mm;">
  <div class="card">
    <div class="card-title-sm">1. Regulatory Compliance Moats</div>
    <div class="card-p">
      &bull; <strong>DPDP Act 2023 Compliance:</strong> All student psychometric and financial data encrypted at rest (AES-256) with zero data brokerage.<br>
      &bull; <strong>UGC &amp; AICTE Guidelines:</strong> Software operates strictly as a decision-support advisory system, avoiding accredited degree licensing restrictions.<br>
      &bull; <strong>FERPA / GDPR Parity:</strong> Fully compliant with international student data protection standards for overseas admissions pipelines.
    </div>
  </div>

  <div class="card">
    <div class="card-title-sm">2. AI Model &amp; Supplier Risk Mitigation</div>
    <div class="card-p">
      &bull; <strong>Multi-Model Redundancy:</strong> Orchestration layer designed with hot-failover between DeepSeek V4, Claude 3.5 Sonnet, and local quantized Llama 3 models.<br>
      &bull; <strong>API Cost Caps:</strong> Inference costs mathematically capped at &#8377;8.20 per complex session via semantic caching and prompt compression.<br>
      &bull; <strong>Self-Hosted Embeddings:</strong> Vector search and similarity models hosted in-house to guarantee zero vendor lock-in.
    </div>
  </div>
</div>
"""
    return wrap_page(content, 29, 32, "Macro Sensitivity &amp; Downside Stress Tests", "RISK GOVERNANCE &amp; SENSITIVITY")
