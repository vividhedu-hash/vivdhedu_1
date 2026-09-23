# case_study_builder/page_24_commercial_arch.py
from styles import wrap_page

def get_page_24():
    content = """
<div class="kicker">Part IX &middot; Business Model &amp; Commercial Architecture</div>
<h1 class="headline">Commercial Architecture &amp; Unit Economics</h1>
<div class="headline-sub">The 5-tier monetization ladder and the underlying unit economics driving 23.4x LTV/CAC.</div>

<!-- 5-TIER COMMERCIAL LADDER INFOGRAPHIC -->
<div class="card-subtle" style="padding: 2.5mm 3.2mm; margin-bottom: 2.5mm;">
  <div style="font-family: var(--font-mono); font-size: 6.5pt; font-weight: 700; text-transform: uppercase; color: var(--accent); margin-bottom: 1.5mm;">
    The 5-Stage Value Ascension Ladder
  </div>
  <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 2mm;">
    <div style="background: #FFFFFF; border: 0.5pt solid var(--border); border-radius: 3px; padding: 2mm;">
      <div style="font-family: var(--font-mono); font-size: 5.8pt; font-weight: 700; color: #64748B;">TIER 01 &middot; FREE</div>
      <div style="font-weight: 700; font-size: 7.6pt; color: var(--text-main); margin: 0.8mm 0;">Zero Friction</div>
      <div style="font-size: 6.4pt; color: var(--text-muted); line-height: 1.28;">Onboarding, basic AI risk score, baseline college discovery, zero ads.</div>
    </div>
    <div style="background: #FFFFFF; border: 0.5pt solid var(--border); border-radius: 3px; padding: 2mm;">
      <div style="font-family: var(--font-mono); font-size: 5.8pt; font-weight: 700; color: var(--accent);">TIER 02 &middot; TRUST</div>
      <div style="font-weight: 700; font-size: 7.6pt; color: var(--accent); margin: 0.8mm 0;">Engagement</div>
      <div style="font-size: 6.4pt; color: var(--text-muted); line-height: 1.28;">High-value execution: 1st sprint roadmap, live Recent Waves telemetry.</div>
    </div>
    <div style="background: #FFFFFF; border: 0.5pt solid var(--border); border-radius: 3px; padding: 2mm;">
      <div style="font-family: var(--font-mono); font-size: 5.8pt; font-weight: 700; color: var(--purple);">TIER 03 &middot; PRO</div>
      <div style="font-weight: 700; font-size: 7.6pt; color: var(--purple); margin: 0.8mm 0;">&#8377;1,999 / yr</div>
      <div style="font-size: 6.4pt; color: var(--text-muted); line-height: 1.28;">Unlimited Monte Carlo simulations, custom exam-sync scheduler, verified portfolio URL.</div>
    </div>
    <div style="background: #FFFFFF; border: 0.5pt solid var(--border); border-radius: 3px; padding: 2mm;">
      <div style="font-family: var(--font-mono); font-size: 5.8pt; font-weight: 700; color: var(--green);">TIER 04 &middot; FLAGSHIP</div>
      <div style="font-weight: 700; font-size: 7.6pt; color: var(--green); margin: 0.8mm 0;">One-Stop Portfolio</div>
      <div style="font-size: 6.4pt; color: var(--text-muted); line-height: 1.28;">India's 1st unified platform: 1-on-1 research, micro-internships, mentorships &amp; industry certs.</div>
    </div>
    <div style="background: #FFFFFF; border: 0.5pt solid var(--border); border-radius: 3px; padding: 2mm;">
      <div style="font-family: var(--font-mono); font-size: 5.8pt; font-weight: 700; color: var(--amber);">TIER 05 &middot; B2B &amp; ADs</div>
      <div style="font-weight: 700; font-size: 7.6pt; color: var(--amber); margin: 0.8mm 0;">Marketplace &amp; APIs</div>
      <div style="font-size: 6.4pt; color: var(--text-muted); line-height: 1.28;">25% course affiliate + promoter ads + 1.5% bank loan fee + &#8377;85 risk APIs.</div>
    </div>
  </div>
</div>

<!-- UNIT ECONOMICS BENCHMARK -->
<div class="kpi-row" style="margin-bottom: 2.5mm;">
  <div class="kpi-tile">
    <div class="kpi-val accent">&#8377;420</div>
    <div class="kpi-label">Blended CAC</div>
    <div class="kpi-sub">Driven by organic school alliances &amp; viral loops</div>
  </div>
  <div class="kpi-tile">
    <div class="kpi-val green">&#8377;9,850</div>
    <div class="kpi-label">Blended LTV</div>
    <div class="kpi-sub">Includes subscription, research &amp; loan fee shares</div>
  </div>
  <div class="kpi-tile">
    <div class="kpi-val accent">23.4x</div>
    <div class="kpi-label">LTV / CAC Ratio</div>
    <div class="kpi-sub">Exceptional software-native capital efficiency</div>
  </div>
  <div class="kpi-tile">
    <div class="kpi-val">&lt; 1.8 mo</div>
    <div class="kpi-label">Payback Period</div>
    <div class="kpi-sub">Rapid cash conversion on annual upfront billing</div>
  </div>
</div>

<div class="grid-2" style="margin-bottom: 0;">
  <!-- COST OF SERVICE & INFERENCE ECONOMICS -->
  <div class="card" style="padding: 2.5mm 3.2mm;">
    <div class="card-title-sm" style="margin-bottom: 1.2mm;">Service Costs &amp; Model Inference Economics</div>
    <div style="font-size: 7.2pt; color: var(--text-muted); line-height: 1.42;">
      <p class="body-p" style="font-size: 7.2pt; margin-bottom: 1.2mm;">
        Legacy edtech companies spend heavily on human counselors (&#8377;25,000&ndash;&#8377;60,000/month/counselor). 
        Student OS achieves software scale through ultra-efficient model routing:
      </p>
      <div style="font-family: var(--font-mono); font-size: 6.2pt; background: var(--bg-subtle); padding: 1.8mm 2.2mm; border-radius: 3px; border: 0.5pt solid var(--border); margin-bottom: 1.2mm;">
        &bull; DeepSeek V4 Reasoning: &#8377;3.40 / session (avg 18k tokens)<br>
        &bull; Perplexity Sonar Web Grounding: &#8377;4.80 / verification query<br>
        &bull; In-Memory Redis Semantic Cache: 42% query hit rate (&#8377;0 marginal cost)<br>
        &bull; <strong>Blended Inference Cost: &#8377;8.20 per active monthly student session</strong>
      </div>
      <div style="font-size: 6.6pt; color: var(--green); font-weight: 600;">
        Software Gross Margin: 86.4% &middot; Blended Gross Margin (with mentors): 74.2%
      </div>
    </div>
  </div>

  <!-- B2B HIGH-MARGIN UPSIDE -->
  <div class="card-subtle" style="padding: 2.5mm 3.2mm;">
    <div class="card-title-sm" style="color: var(--accent-dark); margin-bottom: 1.2mm;">The Negative Working Capital Dynamic</div>
    <p class="body-p" style="font-size: 7.2pt; line-height: 1.42; margin-bottom: 1.5mm;">
      Because students pay their annual &#8377;1,999 subscriptions and flagship program fees upfront, 
      Student OS operates with <strong>negative working capital</strong>. Customer acquisition costs (&#8377;420) 
      are recovered on Day 1 of subscription conversion, providing immediate cash reinvestment into campus growth channels.
    </p>
    <div class="editorial-note" style="margin: 0; font-size: 6.8pt; padding: 1.8mm 2.8mm;">
      &ldquo;By converting an unpredictable human consulting practice into a deterministic quantitative software utility, 
      the operating model decouples revenue growth from linear employee headcount expansion.&rdquo;
    </div>
  </div>
</div>
"""
    return wrap_page(content, 24, 32, "Commercial Architecture &amp; Unit Economics", "PART IX &middot; BUSINESS ARCHITECTURE")
