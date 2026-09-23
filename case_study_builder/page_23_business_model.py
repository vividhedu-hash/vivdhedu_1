# case_study_builder/page_23_business_model.py
from styles import wrap_page

def get_page_23():
    content = """
<div class="kicker">Part IX &middot; Business Model &amp; Commercial Architecture</div>
<h1 class="headline">The Multi-Stakeholder Business Model</h1>
<div class="headline-sub">Four diversified, non-conflicting revenue streams monetizing trust, verified underwriting, and execution.</div>

<div class="lead-p">
  Legacy education portals generate 100% of revenue from selling student leads to low-tier private universities, 
  creating a fatal conflict of interest. Student OS eliminates lead bounties entirely. Instead, the platform deploys 
  a multi-sided business model monetizing students, lenders, course providers, and coaching institutions on verified value.
</div>

<div class="grid-2" style="margin-bottom: 2.5mm;">
  <!-- STREAM 1 -->
  <div class="card" style="border-top: 2.5px solid var(--accent); padding: 2.5mm 3.2mm;">
    <div class="card-title" style="margin-bottom: 1mm;">
      <span style="font-size: 7.8pt; font-weight: 700; color: var(--accent);">Stream 1 &middot; Subscriptions &amp; Flagship Portfolio Program</span>
      <span class="status-pill status-solved">&#8377;1,999 / yr + &#8377;35k</span>
    </div>
    <div style="font-size: 7.2pt; color: var(--text-muted); line-height: 1.4;">
      <div style="margin-bottom: 0.8mm;"><strong>&bull; Who Pays:</strong> Aspirational high-school and undergraduate students &amp; families.</div>
      <div style="margin-bottom: 0.8mm;"><strong>&bull; India's First One-Stop Solution:</strong> A comprehensive, democratized portfolio ecosystem providing <strong>authentic research opportunities (SSRN/arXiv), corporate micro-internships, 1-on-1 industry mentorships, and verified industry-level certifications</strong>&mdash;all delivered to a child at a nominal, accessible cost (slashing legacy &#8377;3L&ndash;&#8377;12L agency fees).</div>
      <div style="margin-bottom: 0.8mm;"><strong>&bull; What &amp; How:</strong> &#8377;1,999/yr for Pro Student OS (unlimited simulations, dynamic roadmap, Recent Waves) + &#8377;35,000 for 8-week 1-on-1 PhD Guided Research Fellowships.</div>
      <div><strong>&bull; Trajectory:</strong> Y1: &#8377;78.5L &rarr; Y2: &#8377;425L &rarr; Y3: &#8377;1,680L (41.3% of total revenue).</div>
    </div>
  </div>

  <!-- STREAM 2 -->
  <div class="card" style="border-top: 2.5px solid var(--green); padding: 2.5mm 3.2mm;">
    <div class="card-title" style="margin-bottom: 1mm;">
      <span style="font-size: 7.8pt; font-weight: 700; color: var(--green);">Stream 2 &middot; Bank Loan Origination &amp; Matching Fees</span>
      <span class="status-pill status-solved">1.5% Fee + &#8377;4.5k Lead</span>
    </div>
    <div style="font-size: 7.2pt; color: var(--text-muted); line-height: 1.4;">
      <div style="margin-bottom: 0.8mm;"><strong>&bull; Who Pays:</strong> Partner commercial banks, NBFCs, and sovereign student lenders (e.g. SBI, HDFC Credila).</div>
      <div style="margin-bottom: 0.8mm;"><strong>&bull; What &amp; How:</strong> 1.5% success fee on disbursed education loans (&#8377;18,000&ndash;&#8377;67,500/loan) + &#8377;4,500 for pre-verified student dossiers.</div>
      <div style="margin-bottom: 0.8mm;"><strong>&bull; Why:</strong> Slashes lender acquisition CAC by 60% and default risk by 4.2x via actuarial profile pre-verification.</div>
      <div><strong>&bull; Trajectory:</strong> Y1: &#8377;38.0L &rarr; Y2: &#8377;215L &rarr; Y3: &#8377;890L (21.9% of total revenue).</div>
    </div>
  </div>
</div>

<div class="grid-2" style="margin-bottom: 2.5mm;">
  <!-- STREAM 3 -->
  <div class="card" style="border-top: 2.5px solid var(--purple); padding: 2.5mm 3.2mm;">
    <div class="card-title" style="margin-bottom: 1mm;">
      <span style="font-size: 7.8pt; font-weight: 700; color: var(--purple);">Stream 3 &middot; Course Marketplace Affiliates &amp; Ad Promotions</span>
      <span class="status-pill status-solved">25% Cut + Marketing Bids</span>
    </div>
    <div style="font-size: 7.2pt; color: var(--text-muted); line-height: 1.4;">
      <div style="margin-bottom: 0.8mm;"><strong>&bull; Who Pays:</strong> Online course providers, skilling platforms (Coursera, Emeritus, edX), and premium educators.</div>
      <div style="margin-bottom: 0.8mm;"><strong>&bull; Diagnostic Marketplace Link:</strong> After analyzing student gaps, the engine recommends solutions and routes students directly to our <strong>Marketplace Page</strong> (<code>studentos.ai/marketplace</code>), connecting them to a massive 3rd-party course catalog.</div>
      <div style="margin-bottom: 0.8mm;"><strong>&bull; Dual Monetization:</strong> (1) 20&ndash;25% affiliate commissions on enrollments, plus (2) marketing profits from providers paying to promote high-relevance courses (strictly gated by algorithmic match &ge; 75%).</div>
      <div><strong>&bull; Trajectory:</strong> Y1: &#8377;24.0L &rarr; Y2: &#8377;110L &rarr; Y3: &#8377;420L (10.3% of total revenue).</div>
    </div>
  </div>

  <!-- STREAM 4 -->
  <div class="card" style="border-top: 2.5px solid var(--amber); padding: 2.5mm 3.2mm;">
    <div class="card-title" style="margin-bottom: 1mm;">
      <span style="font-size: 7.8pt; font-weight: 700; color: var(--amber);">Stream 4 &middot; Institutional Risk APIs &amp; Coaching SaaS</span>
      <span class="status-pill status-solved">&#8377;85 / Check + &#8377;500 / Seat</span>
    </div>
    <div style="font-size: 7.2pt; color: var(--text-muted); line-height: 1.4;">
      <div style="margin-bottom: 0.8mm;"><strong>&bull; Who Pays:</strong> Education loan underwriters, test prep chains (Allen, FIITJEE), and private school networks.</div>
      <div style="margin-bottom: 0.8mm;"><strong>&bull; What &amp; How:</strong> &#8377;85 per algorithmic default risk check API call + &#8377;500/student/year white-label telemetry license.</div>
      <div style="margin-bottom: 0.8mm;"><strong>&bull; Why:</strong> Gives coaching institutes high-margin software tracking without building bespoke internal tools.</div>
      <div><strong>&bull; Trajectory:</strong> Y1: &#8377;12.5L &rarr; Y2: &#8377;85L &rarr; Y3: &#8377;380L (9.4% of total revenue).</div>
    </div>
  </div>
</div>

<div class="card-dark" style="margin-bottom: 0; padding: 2.5mm 3.5mm;">
  <div style="font-family: var(--font-mono); font-size: 6.2pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #60A5FA; margin-bottom: 1mm;">
    Fiduciary Architectural Invariant &middot; Zero Sponsored Lead Auctions
  </div>
  <div style="font-size: 7.4pt; color: #E2E8F0; line-height: 1.42;">
    Universities cannot pay to rank higher in student search results. Banks cannot pay to force loan placement. 
    Course promotions are strictly hard-gated behind a 75%+ verified skills-gap match. By monetizing value across the ecosystem 
    rather than selling student contact lists to private brokers, Student OS aligns platform profitability directly with student success.
  </div>
</div>
<div style="margin-top:2mm;">
  <div class="card-title-sm" style="margin-bottom:1.5mm;">Year 3 Revenue Mix &mdash; &#8377;4,260 L Blended Portfolio</div>
  <div style="height:8mm;display:flex;border-radius:3px;overflow:hidden;border:0.75pt solid var(--border);">
    <div style="flex:41.3;background:#1A6CF6;display:flex;align-items:center;justify-content:center;">
      <span style="font-family:monospace;font-size:6pt;font-weight:700;color:white;">Subscriptions 41.3%</span>
    </div>
    <div style="flex:21.9;background:#0D9488;display:flex;align-items:center;justify-content:center;">
      <span style="font-family:monospace;font-size:6pt;font-weight:700;color:white;">Loan Fees 21.9%</span>
    </div>
    <div style="flex:10.3;background:#7C3AED;display:flex;align-items:center;justify-content:center;">
      <span style="font-family:monospace;font-size:5.5pt;font-weight:700;color:white;">Mktpl 10.3%</span>
    </div>
    <div style="flex:9.4;background:#D97706;display:flex;align-items:center;justify-content:center;">
      <span style="font-family:monospace;font-size:5.5pt;font-weight:700;color:white;">Risk 9.4%</span>
    </div>
    <div style="flex:17.1;background:#475569;display:flex;align-items:center;justify-content:center;">
      <span style="font-family:monospace;font-size:5.5pt;font-weight:700;color:white;">Other 17.1%</span>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1.5mm;margin-top:1.5mm;font-family:monospace;font-size:5.8pt;color:var(--text-muted);">
    <div><span style="color:#1A6CF6;font-weight:700;">&#9632;</span> Stream 1: &#8377;1,680 L</div>
    <div><span style="color:#0D9488;font-weight:700;">&#9632;</span> Stream 2: &#8377;890 L</div>
    <div><span style="color:#7C3AED;font-weight:700;">&#9632;</span> Stream 3: &#8377;420 L</div>
    <div><span style="color:#D97706;font-weight:700;">&#9632;</span> Stream 4: &#8377;380 L</div>
  </div>
</div>
"""
    return wrap_page(content, 23, 32, "The Sovereign Multi-Stakeholder Business Model", "PART IX &middot; BUSINESS ARCHITECTURE")
