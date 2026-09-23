# case_study_builder/page_15_ai_risk_index.py
from styles import wrap_page

def get_page_15():
    content = r"""
<div class="kicker">Part IV &middot; The Quantitative Core</div>
<h1 class="headline">The Flagship AI Labor Risk Index</h1>
<div class="headline-sub">Deconstructing occupations into an 8-vector labor surface to forecast automation decay.</div>

<div class="lead-p">
  Counselors and parents routinely advise students to pursue software engineering or accounting degrees based on 
  compensation tables from 2018. However, large language models and autonomous code-generation agents have fundamentally collapsed 
  entry-level demand for routine programming and financial analysis. Student OS introduces India's first dynamic AI Risk Engine.
</div>

<div class="math-block" style="margin-bottom: 2.5mm;">
  <div class="math-title">
    <span>5.1 &middot; Task-Level S-Curve Automation Decay Engine</span>
    <span>DYNAMICAL SYSTEM</span>
  </div>
  <div class="math-eq">
    $$A_i(t) = \frac{1}{1 + \exp\left(-k_i(t - t_{0,i})\right)} \quad \implies \quad \text{LaborDecay}_b(t) = \sum_{m=1}^M w_m \cdot A_m(t)$$
  </div>
  <div class="math-legend">
    Rather than modeling an entire occupation as binary (automated vs. safe), an occupation is decomposed into $M$ discrete O*NET work tasks. 
    Each task undergoes an empirical logistic decay curve where $k_i$ is determined by benchmarked LLM capability breakthroughs 
    and $t_{0,i}$ represents market adoption inflection.
  </div>
</div>

<div class="card-title-sm">5.2 &middot; The Eight-Vector Labor Risk Surface</div>
<div class="table-wrap" style="margin-bottom: 2.5mm;">
  <table class="editorial-table">
    <thead>
      <tr>
        <th style="width: 25%;">Labor Dimension Vector</th>
        <th style="width: 45%;">Representative Professional Task Scope</th>
        <th style="width: 15%;">Decay Slope ($k$)</th>
        <th style="width: 15%;">Resilience Classification</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>$V_1$ Cognitive Routine</strong></td>
        <td>Syntax translation, unit test writing, basic accounting, ETL scripts</td>
        <td class="num">0.82</td>
        <td><span class="status-pill status-broken">Rapid Decay</span></td>
      </tr>
      <tr>
        <td><strong>$V_2$ Pattern Recognition</strong></td>
        <td>Financial anomaly detection, standard credit scoring, legal discovery</td>
        <td class="num">0.68</td>
        <td><span class="status-pill status-unmet">High Decay</span></td>
      </tr>
      <tr>
        <td><strong>$V_3$ Generative Synthesis</strong></td>
        <td>Drafting quarterly summaries, boilerplate design, content translation</td>
        <td class="num">0.74</td>
        <td><span class="status-pill status-broken">Rapid Decay</span></td>
      </tr>
      <tr>
        <td><strong>$V_4$ Manual Non-Routine</strong></td>
        <td>Physical lab wet chemistry, robotic hardware debugging, surgical craft</td>
        <td class="num">0.12</td>
        <td><span class="status-pill status-solved">High Resilience</span></td>
      </tr>
      <tr>
        <td><strong>$V_5$ Interpersonal Negotiation</strong></td>
        <td>Venture fundraising, institutional client persuasion, diplomacy</td>
        <td class="num">0.18</td>
        <td><span class="status-pill status-solved">High Resilience</span></td>
      </tr>
      <tr>
        <td><strong>$V_6$ Moral Agency &amp; Fiduciary</strong></td>
        <td>Judicial rulings, clinical triage accountability, corporate governance</td>
        <td class="num">0.08</td>
        <td><span class="status-pill status-solved">Maximum Resilience</span></td>
      </tr>
      <tr>
        <td><strong>$V_7$ Embodied Interaction</strong></td>
        <td>Direct athletic coaching, in-person clinical therapy, bespoke artisan</td>
        <td class="num">0.15</td>
        <td><span class="status-pill status-solved">High Resilience</span></td>
      </tr>
      <tr>
        <td><strong>$V_8$ Novel Theoretical Math</strong></td>
        <td>New mathematical conjectures, causal econometrics, frontier AI safety</td>
        <td class="num">0.05</td>
        <td><span class="status-pill status-solved">Maximum Resilience</span></td>
      </tr>
    </tbody>
  </table>
</div>

<div class="grid-2" style="margin-bottom: 0;">
  <div class="card-subtle">
    <div class="card-title-sm">Job Security Score (JSS)</div>
    <p class="body-p" style="font-size: 7.2pt; line-height: 1.42; margin-bottom: 0;">
      Synthesizes the residual task mass into a bounded 0&ndash;100 index:
      $$\text{JSS}_b(t) = 100 \cdot \big(1 - \text{LaborDecay}_b(t)\big) \cdot (1 + \gamma_{\text{licensure}})$$
      Programs heavy in $V_1-V_3$ (generic coding) drop below 35 by 2028, whereas hybrid tracks (Quantitative Economics with $V_5, V_8$) maintain JSS &gt; 80.
    </p>
  </div>
  
  <div class="card-subtle">
    <div class="card-title-sm">Zero-Hardcoding Telemetry</div>
    <p class="body-p" style="font-size: 7.2pt; line-height: 1.42; margin-bottom: 0;">
      Risk parameters are never static. Weekly Apache Airflow DAGs ingest GitHub repository commit trends, arXiv CS/AI preprints, 
      and US Bureau of Labor Statistics reclassifications to dynamically recalibrate decay coefficients in real time.
    </p>
  </div>
</div>
"""
    return wrap_page(content, 15, 32, "AI Labor Risk Index &amp; 8-Vector Surface", "PART IV &middot; THE QUANTITATIVE CORE")
