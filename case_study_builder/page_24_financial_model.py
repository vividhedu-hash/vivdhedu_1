# case_study_builder/page_24_financial_model.py
from styles import wrap_page

def get_page_24():
    content = """
<div class="kicker">Part XII &middot; Financial Roadmap &amp; Projections</div>
<h1 class="headline">Three-Year Financial Trajectory</h1>
<div class="headline-sub">P&amp;L projections, Month 19 breakeven dynamics, and Year 2 downside stress-tests.</div>

<!-- 3-YEAR P&L TABLE -->
<div class="card-title-sm" style="margin-bottom: 1.5mm;">Consolidated 3-Year Profit &amp; Loss Statement (&#8377; Lakhs)</div>
<div class="table-wrap" style="margin-bottom: 2.2mm;">
  <table class="editorial-table">
    <thead>
      <tr>
        <th style="width: 32%;">Financial Metric</th>
        <th style="width: 22%;">Year 1 (FY 2025&ndash;26)</th>
        <th style="width: 22%;">Year 2 (FY 2026&ndash;27)</th>
        <th style="width: 24%;">Year 3 (FY 2027&ndash;28)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Stream 1 &middot; Subscriptions &amp; Research</td>
        <td class="num">&#8377;78.5 L</td>
        <td class="num">&#8377;425.0 L</td>
        <td class="num">&#8377;1,680.0 L</td>
      </tr>
      <tr>
        <td>Stream 2 &middot; Bank Loan Origination Fees</td>
        <td class="num">&#8377;38.0 L</td>
        <td class="num">&#8377;215.0 L</td>
        <td class="num">&#8377;890.0 L</td>
      </tr>
      <tr>
        <td>Stream 3 &middot; Course Marketplace Commissions</td>
        <td class="num">&#8377;24.0 L</td>
        <td class="num">&#8377;110.0 L</td>
        <td class="num">&#8377;420.0 L</td>
      </tr>
      <tr>
        <td>Stream 4 &middot; Risk APIs &amp; Coaching SaaS</td>
        <td class="num">&#8377;12.5 L</td>
        <td class="num">&#8377;85.0 L</td>
        <td class="num">&#8377;380.0 L</td>
      </tr>
      <tr style="background: var(--bg-subtle); font-weight: 700;">
        <td>Total Gross Revenue</td>
        <td class="num accent" style="font-weight: 800;">&#8377;382.0 L (&#8377;3.82 Cr)</td>
        <td class="num accent" style="font-weight: 800;">&#8377;1,428.0 L (&#8377;14.28 Cr)</td>
        <td class="num accent" style="font-weight: 800;">&#8377;4,260.0 L (&#8377;42.60 Cr)</td>
      </tr>
      <tr>
        <td>Cost of Goods Sold (Inference + Mentors)</td>
        <td class="num">&#8377;98.6 L</td>
        <td class="num">&#8377;314.2 L</td>
        <td class="num">&#8377;766.8 L</td>
      </tr>
      <tr style="font-weight: 600;">
        <td>Gross Profit &middot; Margin %</td>
        <td class="num">&#8377;283.4 L (74.2%)</td>
        <td class="num">&#8377;1,113.8 L (78.0%)</td>
        <td class="num">&#8377;3,493.2 L (82.0%)</td>
      </tr>
      <tr>
        <td>Operating Expenses (Engineering, Campus, G&amp;A)</td>
        <td class="num">&#8377;428.4 L</td>
        <td class="num">&#8377;628.8 L</td>
        <td class="num">&#8377;1,048.2 L</td>
      </tr>
      <tr style="background: var(--green-bg); font-weight: 700;">
        <td>Operating EBITDA &middot; Margin %</td>
        <td class="num" style="color: var(--rose);">-&#8377;145.0 L (-38.0%)</td>
        <td class="num green" style="font-weight: 800;">+&#8377;485.0 L (+34.0%)</td>
        <td class="num green" style="font-weight: 800;">+&#8377;2,445.0 L (+57.4%)</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- MONTH 19 BREAKEVEN CALLOUT -->
<div class="card-accent" style="padding: 2mm 3mm; margin-bottom: 2.2mm;">
  <div class="card-title" style="color: var(--accent-dark); margin-bottom: 0.8mm;">
    <span style="font-size: 7.2pt; font-weight: 700;">The Month 19 Breakeven Inflection (October 2026)</span>
    <span class="status-pill status-solved">Cashflow Positive</span>
  </div>
  <div style="font-size: 6.8pt; color: var(--text-main); line-height: 1.35;">
    At Month 19, cumulative active student subscribers cross 28,000, monthly research cohort admissions hit 85 seats, 
    and bank loan origination volume scales past &#8377;18 Cr/month. Monthly net revenue (&#8377;68.5 L) overtakes fixed monthly burn (&#8377;54.2 L), 
    achieving self-sustaining profitability without secondary capital dependence.
  </div>
</div>

<!-- 3 YEAR-2 STRESS TESTS -->
<div class="card-title-sm" style="margin-bottom: 1.2mm;">Year-2 Downside Stress-Test Scenarios</div>
<div class="grid-3" style="margin-bottom: 0;">
  <div class="card" style="border-top: 2px solid var(--rose); padding: 2mm 2.5mm;">
    <div style="font-family: var(--font-mono); font-size: 5.6pt; font-weight: 700; color: var(--rose);">BEAR CASE (P10)</div>
    <div style="font-weight: 700; font-size: 8.5pt; color: var(--text-main); margin: 0.5mm 0;">&#8377;4.80 Cr Rev</div>
    <div style="font-size: 6.4pt; color: var(--text-muted); line-height: 1.3;">
      <strong>Assumptions:</strong> School adoption slows; bank API deals push out 9 months.<br>
      <strong>Mitigation:</strong> Freeze headcount at 14 FTEs; cut campus spending by 60%. Remaining Series A runway extends to 28 months.
    </div>
  </div>

  <div class="card" style="border-top: 2px solid var(--accent); padding: 2mm 2.5mm;">
    <div style="font-family: var(--font-mono); font-size: 5.6pt; font-weight: 700; color: var(--accent);">BASE CASE (P50)</div>
    <div style="font-weight: 700; font-size: 8.5pt; color: var(--accent); margin: 0.5mm 0;">&#8377;14.28 Cr Rev</div>
    <div style="font-size: 6.4pt; color: var(--text-muted); line-height: 1.3;">
      <strong>Assumptions:</strong> Core modeled trajectory across 120 school partners and 3 bank underwriting integrations.<br>
      <strong>Outcome:</strong> 34.0% EBITDA margin; &#8377;4.85 Cr operating profit; prepares for Series B institutional growth round.
    </div>
  </div>

  <div class="card" style="border-top: 2px solid var(--green); padding: 2mm 2.5mm;">
    <div style="font-family: var(--font-mono); font-size: 5.6pt; font-weight: 700; color: var(--green);">BULL CASE (P90)</div>
    <div style="font-weight: 700; font-size: 8.5pt; color: var(--green); margin: 0.5mm 0;">&#8377;22.80 Cr Rev</div>
    <div style="font-size: 6.4pt; color: var(--text-muted); line-height: 1.3;">
      <strong>Assumptions:</strong> Viral portfolio adoption accelerates across Tier-1/2 cities; national bank mandates risk API for all loans.<br>
      <strong>Outcome:</strong> 42.1% EBITDA margin; &#8377;9.60 Cr operating profit; unlocks pre-emptive growth financing.
    </div>
  </div>
</div>
"""
    return wrap_page(content, 24, 26, "Three-Year Financial Trajectory &amp; Breakeven", "PART XII &middot; FINANCIAL ROADMAP")
