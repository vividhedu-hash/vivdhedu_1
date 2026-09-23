# case_study_builder/page_28_financial_model.py
from styles import wrap_page

def get_page_28():
    content = """
<div class="kicker">Part XII &middot; Financial Roadmap &amp; Projections</div>
<h1 class="headline">Three-Year Financial Trajectory &amp; Breakeven</h1>
<div class="headline-sub">Consolidated P&amp;L model, Month 19 self-sustaining breakeven, and high-margin software economics.</div>

<div class="lead-p">
  Unlike legacy EdTech companies that scaled headcount linearly with revenue, Student OS functions as a software-native 
  clearinghouse. <strong>Gross margins expand from 74.2% in Year 1 to 82.0% in Year 3</strong>, with cashflow breakeven reached at Month 19.
</div>

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
        <td>Stream 1 &middot; Subscriptions &amp; Flagship Portfolio</td>
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
        <td>Stream 3 &middot; Course Marketplace Commissions &amp; Ads</td>
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
<div class="card-accent" style="padding: 2.5mm 3.2mm; margin-bottom: 2.2mm;">
  <div class="card-title" style="color: var(--accent-dark); margin-bottom: 0.8mm;">
    <span style="font-size: 7.8pt; font-weight: 700;">The Month 19 Breakeven Inflection (October 2026)</span>
    <span class="status-pill status-solved">Cashflow Positive</span>
  </div>
  <div style="font-size: 7.2pt; color: var(--text-main); line-height: 1.38;">
    At Month 19, cumulative active student subscribers cross 28,000, monthly research cohort admissions hit 85 seats, 
    and bank loan origination volume scales past &#8377;18 Cr/month. Monthly net revenue (&#8377;68.5 L) overtakes fixed monthly burn (&#8377;54.2 L), 
    achieving self-sustaining profitability without secondary capital dependence.
  </div>
</div>

<div class="grid-2" style="margin-bottom: 0;">
  <div class="card" style="padding: 2.2mm 2.8mm;">
    <div class="card-title-sm">Cash Conversion &amp; Capital Efficiency</div>
    <div style="font-size: 7.0pt; color: var(--text-muted); line-height: 1.38;">
      Upfront annual collections on subscriptions (&#8377;1,999) and flagship admissions fellowships generate positive operating float. 
      Customer acquisition costs are recouped on Day 1, insulating the company from venture debt dependency.
    </div>
  </div>

  <div class="card-subtle" style="padding: 2.2mm 2.8mm;">
    <div class="card-title-sm" style="color: var(--accent-dark);">Operating Leverage Expansion</div>
    <div style="font-size: 7.0pt; color: var(--text-muted); line-height: 1.38;">
      Because inference costs drop by 25% annually while user cohorts compound, EBITDA margins expand by +23.4% 
      between Year 2 and Year 3, reflecting pure software operating leverage.
    </div>
  </div>
</div>
<div style="margin-top:2.5mm;">
  <div class="card-title-sm" style="margin-bottom:1.5mm;">Three-Year Revenue Trajectory &mdash; ₹ Lakhs</div>
  <svg viewBox="0 0 580 80" width="100%" xmlns="http://www.w3.org/2000/svg">
    <!-- Y-axis labels -->
    <text x="28" y="18" font-family="monospace" font-size="6.5" fill="#64748B" text-anchor="end">4,500</text>
    <text x="28" y="40" font-family="monospace" font-size="6.5" fill="#64748B" text-anchor="end">3,000</text>
    <text x="28" y="60" font-family="monospace" font-size="6.5" fill="#64748B" text-anchor="end">1,500</text>
    <!-- Grid lines -->
    <line x1="32" y1="16" x2="575" y2="16" stroke="#E2E8F0" stroke-width="0.5"/>
    <line x1="32" y1="38" x2="575" y2="38" stroke="#E2E8F0" stroke-width="0.5"/>
    <line x1="32" y1="60" x2="575" y2="60" stroke="#E2E8F0" stroke-width="0.5"/>
    <line x1="32" y1="72" x2="575" y2="72" stroke="#CBD5E1" stroke-width="0.75"/>
    <!-- Y1 bars (total 382L) - scaled to max 4500L = 64px height -->
    <!-- Stream 1: 78.5L -->
    <rect x="50" y="70" width="22" height="1" rx="1" fill="#1A6CF6"/>
    <rect x="50" y="59" width="22" height="13" rx="1" fill="#1A6CF6"/>
    <!-- Stream 2: 38L -->
    <rect x="75" y="65" width="22" height="7" rx="1" fill="#0D9488"/>
    <!-- Stream 3: 24L -->
    <rect x="100" y="67" width="22" height="5" rx="1" fill="#7C3AED"/>
    <!-- Stream 4: 12.5L -->
    <rect x="125" y="69" width="22" height="3" rx="1" fill="#D97706"/>
    <!-- Y1 total line + label -->
    <line x1="45" y1="55" x2="155" y2="55" stroke="#1A6CF6" stroke-width="0.8" stroke-dasharray="3,2" opacity="0.6"/>
    <text x="99" y="52" font-family="monospace" font-size="6.5" fill="#1A6CF6" text-anchor="middle" font-weight="700">Y1: &#8377;382 L (&#8377;3.82 Cr)</text>
    <text x="99" y="78" font-family="monospace" font-size="6.5" fill="#334155" text-anchor="middle">FY 2025-26</text>
    <text x="99" y="85" font-family="monospace" font-size="5.5" fill="#64748B" text-anchor="middle">-38% EBITDA</text>
    <!-- Y2 bars (total 1428L) -->
    <!-- Stream 1: 425L -->
    <rect x="225" y="12" width="22" height="60" rx="1" fill="#1A6CF6" opacity="0.85"/>
    <!-- Stream 2: 215L -->
    <rect x="250" y="41" width="22" height="31" rx="1" fill="#0D9488" opacity="0.85"/>
    <!-- Stream 3: 110L -->
    <rect x="275" y="56" width="22" height="16" rx="1" fill="#7C3AED" opacity="0.85"/>
    <!-- Stream 4: 85L -->
    <rect x="300" y="59" width="22" height="13" rx="1" fill="#D97706" opacity="0.85"/>
    <line x1="218" y1="10" x2="330" y2="10" stroke="#0D9488" stroke-width="0.8" stroke-dasharray="3,2" opacity="0.6"/>
    <text x="274" y="7" font-family="monospace" font-size="6.5" fill="#0D9488" text-anchor="middle" font-weight="700">Y2: &#8377;1,428 L (&#8377;14.28 Cr)</text>
    <text x="274" y="78" font-family="monospace" font-size="6.5" fill="#334155" text-anchor="middle">FY 2026-27</text>
    <text x="274" y="85" font-family="monospace" font-size="5.5" fill="#0D9488" text-anchor="middle">+34% EBITDA</text>
    <!-- Y3 bars (total 4260L, max so scale down) -->
    <!-- Stream 1: 1680L = 4260/4500*64 ≈ 60px of a larger scale -->
    <!-- Rescale Y3 to fit: use 64px = 2500L for Y3 -->
    <rect x="400" y="28" width="22" height="44" rx="1" fill="#1A6CF6"/>
    <rect x="425" y="47" width="22" height="25" rx="1" fill="#0D9488"/>
    <rect x="450" y="58" width="22" height="14" rx="1" fill="#7C3AED"/>
    <rect x="475" y="62" width="22" height="10" rx="1" fill="#D97706"/>
    <line x1="393" y1="4" x2="505" y2="4" stroke="#D97706" stroke-width="0.8" stroke-dasharray="3,2" opacity="0.6"/>
    <text x="449" y="2" font-family="monospace" font-size="6.5" fill="#D97706" text-anchor="middle" font-weight="700">Y3: &#8377;4,260 L (&#8377;42.60 Cr)</text>
    <text x="449" y="78" font-family="monospace" font-size="6.5" fill="#334155" text-anchor="middle">FY 2027-28</text>
    <text x="449" y="85" font-family="monospace" font-size="5.5" fill="#D97706" text-anchor="middle">+57% EBITDA</text>
    <!-- Legend -->
    <rect x="525" y="16" width="8" height="8" rx="1" fill="#1A6CF6"/>
    <text x="536" y="23" font-family="monospace" font-size="5.5" fill="#475569">Subscriptions</text>
    <rect x="525" y="28" width="8" height="8" rx="1" fill="#0D9488"/>
    <text x="536" y="35" font-family="monospace" font-size="5.5" fill="#475569">Loan Fees</text>
    <rect x="525" y="40" width="8" height="8" rx="1" fill="#7C3AED"/>
    <text x="536" y="47" font-family="monospace" font-size="5.5" fill="#475569">Marketplace</text>
    <rect x="525" y="52" width="8" height="8" rx="1" fill="#D97706"/>
    <text x="536" y="59" font-family="monospace" font-size="5.5" fill="#475569">Risk APIs</text>
  </svg>
</div>
"""
    return wrap_page(content, 28, 32, "Three-Year Financial Trajectory &amp; Breakeven", "PART XII &middot; FINANCIAL ROADMAP")
