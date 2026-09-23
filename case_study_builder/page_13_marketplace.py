# case_study_builder/page_13_marketplace.py
from styles import wrap_page

def get_page_13():
    content = r"""
<div class="kicker">Marketplace Architecture &middot; Upskilling &amp; Affiliate Engine</div>
<h1 class="headline">Curated Course Marketplace &amp; Dynamic Affiliate Engine</h1>
<div class="headline-sub">Connecting diagnostic gaps to targeted upskilling: The $\mathcal{M}(s,c) \ge 0.75$ quality bar, 20&ndash;25% affiliate commissions &amp; match-gated auctions.</div>

<div class="lead-p">
  Traditional educational aggregators bombard students with predatory, uncalibrated course ads based on who pays the highest cost-per-click. 
  <strong>Student OS establishes a deterministic bridge between diagnostic assessment and upskilling execution:</strong> whenever our quantitative 
  gap analysis reveals an outdated university syllabus, a missing technical prerequisite, or an emerging AI automation threat, the platform routes 
  the student to the <strong>Course Marketplace</strong> (<code>studentos.ai/marketplace</code>)&mdash;connecting them to a massive 3rd-party library 
  under strict mathematical fiduciary safeguards.
</div>

<div class="kpi-row">
  <div class="kpi-tile">
    <div class="kpi-val accent">&ge; 0.75</div>
    <div class="kpi-label">Relevance Cutoff</div>
    <div class="kpi-sub">Strict mathematical gate; courses below 75% match are banned</div>
  </div>
  <div class="kpi-tile">
    <div class="kpi-val green">20%&ndash;25%</div>
    <div class="kpi-label">Affiliate Margin</div>
    <div class="kpi-sub">Net revenue share across Coursera, edX, DeepLearning.AI &amp; Udemy</div>
  </div>
  <div class="kpi-tile">
    <div class="kpi-val purple">&#8377;1,500&ndash;8k</div>
    <div class="kpi-label">Test-Prep Bounty</div>
    <div class="kpi-sub">Verified batch referral bounty for Physics Wallah &amp; Allen Digital</div>
  </div>
  <div class="kpi-tile">
    <div class="kpi-val rose">&Delta; S&#770;<sub>Y1</sub></div>
    <div class="kpi-label">Salary Uplift Metric</div>
    <div class="kpi-sub">Econometric wage delta displayed transparently on every course card</div>
  </div>
</div>

<div class="grid-2" style="margin-top: 2mm;">
  <div>
    <div class="card-title-sm">1. Mathematical Course Match Scoring Tensor</div>
    <div class="math-block" style="padding: 2.2mm 2.8mm;">
      <div class="math-title">Equation 13.1 &middot; Dynamic Course Match Scoring Tensor</div>
      <div class="math-eq" style="margin: 1.2mm 0; font-size: 7.8pt;">
        $$\mathcal{M}(s, c) = w_1\cdot\Delta_{\text{skill}}(s,c) + w_2\cdot\text{Align}_{\text{career}}(s,c) + w_3\cdot\rho_{\text{AI}}(c) + w_4\cdot\mathcal{B}_{\text{fit}}(s,c)$$
      </div>
      <div class="math-legend" style="font-size: 6.2pt; line-height: 1.32;">
        <strong>Constituent Tensor Factors:</strong><br>
        &bull; $\Delta_{\text{skill}}(s,c) = 1 - \frac{|\mathbf{k}_s \cap \mathbf{k}_c|}{|\mathbf{k}_c|}$: <em>Missing Skill Factor</em> ($w_1 = 0.35$) &mdash; rewards courses teaching skills student lacks.<br>
        &bull; $\text{Align}_{\text{career}}(s,c) = \cos\left(\mathbf{v}_{\text{target}}(s),\, \mathbf{u}_{\text{syllabus}}(c)\right)$: <em>Career Alignment</em> ($w_2 = 0.25$) &mdash; fit to 10-year goal.<br>
        &bull; $\rho_{\text{AI}}(c) = \sum_{j \in \mathbf{k}_c} \text{Resilience}(j)\cdot \text{Weight}(j)$: <em>AI Defense Metric</em> ($w_3 = 0.25$) &mdash; rewards cognitive resilience.<br>
        &bull; $\mathcal{B}_{\text{fit}}(s,c) = \max\!\left(0,\, 1 - \frac{\text{Price}_{\text{INR}}(c)}{\text{DiscretionaryBudget}(s)}\right)$: <em>Budget Accessibility</em> ($w_4 = 0.15$).
      </div>
    </div>
  </div>

  <div>
    <div class="card-title-sm">2. Promoted Placement Auction &amp; Salary Uplift</div>
    <div class="card" style="padding: 2.2mm 2.8mm; margin-bottom: 1.5mm;">
      <div class="card-title" style="font-size: 7.4pt;">Match-Gated Auction Ranking Mechanics</div>
      <div class="card-p" style="font-size: 6.6pt; line-height: 1.3;">
        Educators bid for sponsored placement within recommendations. However, <strong>fiduciary integrity is enforced by law of code:</strong>
      </div>
      <div style="background: #F8FAFC; border: 0.5pt solid var(--border); padding: 1.4mm 2mm; border-radius: 2px; margin-top: 1mm; font-family: var(--font-mono); font-size: 6.0pt; color: var(--text-muted); line-height: 1.3;">
        <strong>RankScore</strong> = $\mathcal{M}(s, c) \times \text{Bid}_{\text{CPC}}$ &nbsp;|&nbsp; <em>Hard Cutoff: If $\mathcal{M}(s, c) < 0.75$ &rarr; Bid Rejected.</em><br>
        A course with 95% relevance and &#8377;30 bid ranks ABOVE an 80% course with &#8377;35 bid. Zero junk ads.
      </div>
    </div>

    <div class="card-subtle" style="padding: 1.8mm 2.5mm;">
      <div class="card-title-sm" style="font-size: 7.0pt; margin-bottom: 0.6mm;">Transparent Salary Uplift Metric ($\Delta \hat{S}_{Y1}$)</div>
      <div class="card-p" style="font-size: 6.5pt; line-height: 1.3;">
        Every course on <code>studentos.ai/marketplace</code> displays an empirical wage impact score: 
        <strong>&Delta; S&#770;<sub>Y1</sub> = ModelUplift(k<sub>c</sub>)</strong>. E.g., a student completing 
        DeepLearning.AI's <em>Machine Learning Specialization</em> sees an expected entry-level salary uplift 
        of <strong>+&#8377;3,40,000 / year</strong> based on 10,000 historical cohort regressions.
      </div>
    </div>
  </div>
</div>

<div style="margin-top: 2.2mm;">
  <div class="card-title-sm">3. Sourcing Verticals &amp; Commercial Integration Architecture</div>
  <div class="table-wrap">
    <table class="editorial-table" style="font-size: 6.8pt;">
      <thead>
        <tr>
          <th style="width: 22%;">Category Vertical</th>
          <th style="width: 26%;">Integrated Partners</th>
          <th style="width: 26%;">Integration Architecture</th>
          <th style="width: 26%;">Commercial Economics &amp; Monetization</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Technical Upskilling &amp; Micro-Degrees</strong></td>
          <td>Coursera, edX, DeepLearning.AI, Udacity</td>
          <td>Server-to-Server Webhook + Tokenized UUID</td>
          <td><strong>20% &ndash; 45% Net Rev-Share</strong> per subscription</td>
        </tr>
        <tr>
          <td><strong>Vocational Engineering &amp; Data</strong></td>
          <td>Udemy, DataCamp, Pluralsight, Educative</td>
          <td>Impact.com &amp; Rakuten LinkShare Gateway</td>
          <td><strong>20% &ndash; 50% Commission</strong> on transactional checkout</td>
        </tr>
        <tr>
          <td><strong>Competitive Exam Prep (JEE/NEET/CAT)</strong></td>
          <td>Physics Wallah, Allen Digital, Unacademy</td>
          <td>Direct Enterprise Partner OAuth Webhooks</td>
          <td><strong>&#8377;1,500 &ndash; &#8377;8,000 Flat Bounty</strong> per paid enrollment</td>
        </tr>
        <tr>
          <td><strong>Global Language &amp; Relocation</strong></td>
          <td>Duolingo English Test, IELTS, British Council</td>
          <td>Direct Developer Affiliate API Links</td>
          <td><strong>$15 &ndash; $40 CPA</strong> per test/prep voucher sale</td>
        </tr>
        <tr>
          <td><strong>Cloud &amp; Finance Certifications</strong></td>
          <td>AWS, Google Cloud Skills, CFA Institute</td>
          <td>Direct Voucher Sourcing API</td>
          <td><strong>10% &ndash; 18% Net Margin</strong> on bundled exam vouchers</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
"""
    return wrap_page(content, 13, 32, "Curated Course Marketplace &middot; Affiliate &amp; Ad Engine", "MARKETPLACE &amp; MONETIZATION")
