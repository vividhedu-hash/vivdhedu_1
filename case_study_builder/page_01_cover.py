# case_study_builder/page_01_cover.py

def get_page_01():
    return r"""
<div class="page" style="background:#FAFAF8;padding:12mm 17mm 10mm 17mm;display:flex;flex-direction:column;position:relative;overflow:hidden;">

  <!-- Hairline diagonal accent — top-right -->
  <svg style="position:absolute;top:0;right:0;pointer-events:none;" width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <line x1="120" y1="0" x2="0" y2="120" stroke="#1A6CF6" stroke-width="0.6" opacity="0.12"/>
    <line x1="120" y1="22" x2="22" y2="120" stroke="#1A6CF6" stroke-width="0.4" opacity="0.08"/>
    <line x1="120" y1="44" x2="44" y2="120" stroke="#1A6CF6" stroke-width="0.3" opacity="0.05"/>
    <line x1="120" y1="66" x2="66" y2="120" stroke="#1A6CF6" stroke-width="0.2" opacity="0.03"/>
  </svg>
  <!-- Hairline accent — bottom-left -->
  <svg style="position:absolute;bottom:0;left:0;pointer-events:none;" width="70" height="70" viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg">
    <line x1="0" y1="70" x2="70" y2="0" stroke="#0D9488" stroke-width="0.45" opacity="0.1"/>
    <line x1="0" y1="50" x2="50" y2="0" stroke="#0D9488" stroke-width="0.3" opacity="0.06"/>
  </svg>

  <!-- TOP: Classification bar -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7mm;flex-shrink:0;">
    <div style="display:flex;align-items:center;gap:6px;">
      <div style="width:5px;height:5px;background:#1A6CF6;border-radius:50%;flex-shrink:0;"></div>
      <span style="font-family:'JetBrains Mono',monospace;font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.13em;color:#1A6CF6;">Enterprise Architecture Specification</span>
      <span style="font-family:'JetBrains Mono',monospace;font-size:6.5pt;color:#94A3B8;letter-spacing:0.06em;">&middot; Master Product Case Study</span>
    </div>
    <div style="font-family:'JetBrains Mono',monospace;font-size:6pt;color:#94A3B8;letter-spacing:0.08em;text-transform:uppercase;">IL-OS-PRD-2026-V2.4</div>
  </div>

  <!-- WORDMARK -->
  <div style="margin-bottom:1.5mm;flex-shrink:0;line-height:0.88;">
    <span style="font-family:'Newsreader',Georgia,serif;font-size:60pt;font-weight:600;letter-spacing:-0.04em;color:#0F172A;">Student</span><span style="font-family:'Newsreader',Georgia,serif;font-size:60pt;font-weight:600;letter-spacing:-0.04em;color:#1A6CF6;"> OS</span>
  </div>

  <!-- Rule under title -->
  <div style="width:100%;height:1px;background:linear-gradient(90deg,#CBD5E1 0%,#E2E8F0 55%,transparent 100%);margin-bottom:3.5mm;flex-shrink:0;"></div>

  <!-- SUBTITLE -->
  <div style="font-family:'Newsreader',Georgia,serif;font-size:12pt;font-style:italic;font-weight:400;color:#475569;line-height:1.42;margin-bottom:6mm;flex-shrink:0;">
    A Sovereign Quantitative Intelligence, Continuous Decision &amp; Opportunity Ecosystem for the Modern Indian Student Journey
  </div>

  <!-- BODY: 2-col -->
  <div style="display:grid;grid-template-columns:1fr 62mm;gap:11mm;flex:1;align-items:start;">
    <!-- Left column -->
    <div style="display:flex;flex-direction:column;gap:3mm;">
      <p style="font-size:8.3pt;line-height:1.58;color:#334155;">
        An integrated architectural study examining the systemic failure of the &#8377;180B Indian education discovery market, the mathematical mechanics of student-conditioned asset pricing, and the production operationalization of a persistent longitudinal operating system that unifies college discovery, research mentorship, AI labor risk telemetry, and career trajectory execution.
      </p>
      <!-- Pull quote -->
      <div style="border-left:2px solid #1A6CF6;padding:2.5mm 3.5mm;background:#F1F5F9;border-radius:0 2px 2px 0;">
        <p style="font-family:'Newsreader',Georgia,serif;font-style:italic;font-size:8.8pt;color:#1E3A8A;line-height:1.5;">&ldquo;Traditional rankings evaluate the institution. Student OS evaluates the individual inside it. A degree is a long-duration stochastic capital asset&mdash;not a luxury badge.&rdquo;</p>
      </div>
      <!-- Three key theses -->
      <div style="display:flex;flex-direction:column;gap:1.8mm;margin-top:1mm;">
        <div style="display:flex;gap:2.5mm;align-items:flex-start;">
          <div style="width:3px;height:3px;background:#1A6CF6;border-radius:50%;flex-shrink:0;margin-top:3px;"></div>
          <p style="font-size:7.5pt;color:#334155;line-height:1.45;"><strong style="color:#0F172A;font-weight:600;">Market thesis.</strong> The &#8377;180B education counseling market runs on institutional advertising revenue, creating a structural conflict-of-interest. Student OS is funded 100% by students&mdash;zero institutional kickbacks.</p>
        </div>
        <div style="display:flex;gap:2.5mm;align-items:flex-start;">
          <div style="width:3px;height:3px;background:#0D9488;border-radius:50%;flex-shrink:0;margin-top:3px;"></div>
          <p style="font-size:7.5pt;color:#334155;line-height:1.45;"><strong style="color:#0F172A;font-weight:600;">Technology thesis.</strong> Combining 3PL Item Response Theory, 10,000-path Monte Carlo NPV simulation, and an 8-vector AI labor risk surface creates the first actuarially honest college ROI engine in India.</p>
        </div>
        <div style="display:flex;gap:2.5mm;align-items:flex-start;">
          <div style="width:3px;height:3px;background:#7C3AED;border-radius:50%;flex-shrink:0;margin-top:3px;"></div>
          <p style="font-size:7.5pt;color:#334155;line-height:1.45;"><strong style="color:#0F172A;font-weight:600;">Infrastructure thesis.</strong> The endgame is a national sovereign credential standard&mdash;the Aadhaar of student capability&mdash;enabling commercial banks and NBFCs to underwrite education loans on verified student quality, not institutional brand.</p>
        </div>
      </div>
    </div>

    <!-- Right: stacked metrics -->
    <div style="display:flex;flex-direction:column;gap:0;">
      <div style="border-top:1.5px solid #0F172A;padding-top:2.5mm;padding-bottom:3mm;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:17pt;font-weight:800;color:#0F172A;letter-spacing:-0.03em;line-height:1.0;">&#8377;180B</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:5.8pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#64748B;margin-top:1.2mm;">Addressable Market</div>
        <div style="font-size:6.2pt;color:#94A3B8;margin-top:0.8mm;line-height:1.3;">Annual Indian education spend — test prep, counseling, degrees</div>
      </div>
      <div style="border-top:1px solid #E2E8F0;padding-top:2.5mm;padding-bottom:3mm;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:17pt;font-weight:800;color:#1A6CF6;letter-spacing:-0.03em;line-height:1.0;">32M+</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:5.8pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#64748B;margin-top:1.2mm;">Target Students</div>
        <div style="font-size:6.2pt;color:#94A3B8;margin-top:0.8mm;line-height:1.3;">Class 9 through university, urban &amp; semi-urban India</div>
      </div>
      <div style="border-top:1px solid #E2E8F0;padding-top:2.5mm;padding-bottom:3mm;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:17pt;font-weight:800;color:#0D9488;letter-spacing:-0.03em;line-height:1.0;">&#8377;4,999</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:5.8pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#64748B;margin-top:1.2mm;">Annual Subscription</div>
        <div style="font-size:6.2pt;color:#94A3B8;margin-top:0.8mm;line-height:1.3;">vs. &#8377;3L&ndash;12L charged by private counseling agencies</div>
      </div>
      <div style="border-top:1px solid #E2E8F0;padding-top:2.5mm;padding-bottom:3mm;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:17pt;font-weight:800;color:#7C3AED;letter-spacing:-0.03em;line-height:1.0;">23.4x</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:5.8pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#64748B;margin-top:1.2mm;">LTV / CAC Ratio</div>
        <div style="font-size:6.2pt;color:#94A3B8;margin-top:0.8mm;line-height:1.3;">&#8377;9,850 lifetime value on &#8377;420 blended acquisition cost</div>
      </div>
      <div style="border-top:1px solid #E2E8F0;padding-top:2.5mm;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:17pt;font-weight:800;color:#D97706;letter-spacing:-0.03em;line-height:1.0;">Month 19</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:5.8pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#64748B;margin-top:1.2mm;">Cashflow Breakeven</div>
        <div style="font-size:6.2pt;color:#94A3B8;margin-top:0.8mm;line-height:1.3;">&#8377;42.60 Cr annualised run-rate at Y3 · 82% gross margin</div>
      </div>
    </div>
  </div>

  <!-- DIVIDER -->
  <div style="width:100%;height:1px;background:#E2E8F0;margin-top:4mm;margin-bottom:3.5mm;flex-shrink:0;"></div>

  <!-- META GRID -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2.5mm 9mm;margin-bottom:3.5mm;flex-shrink:0;">
    <div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:5.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94A3B8;margin-bottom:1mm;">System Codename</div>
      <div style="font-size:7.5pt;font-weight:600;color:#0F172A;line-height:1.3;">Project IndiaLens / Student OS v2.4</div>
    </div>
    <div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:5.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94A3B8;margin-bottom:1mm;">Core Engine Architecture</div>
      <div style="font-size:7.5pt;font-weight:600;color:#0F172A;line-height:1.3;">Dual-Engine (DeepSeek V4 + Perplexity Sonar)</div>
    </div>
    <div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:5.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94A3B8;margin-bottom:1mm;">Methodological Axiom</div>
      <div style="font-size:7.5pt;font-weight:600;color:#0F172A;line-height:1.3;">Evaluate the Student Inside the College</div>
    </div>
    <div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:5.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94A3B8;margin-bottom:1mm;">Quantitative Models</div>
      <div style="font-size:7.5pt;font-weight:600;color:#0F172A;line-height:1.3;">3PL IRT CAT &middot; 8-Vector AI Risk &middot; Monte Carlo ROI</div>
    </div>
    <div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:5.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94A3B8;margin-bottom:1mm;">Data Ingestion Mesh</div>
      <div style="font-size:7.5pt;font-weight:600;color:#0F172A;line-height:1.3;">18 Automated Live Government &amp; Industry Feeds</div>
    </div>
    <div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:5.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94A3B8;margin-bottom:1mm;">Document Standard</div>
      <div style="font-size:7.5pt;font-weight:600;color:#0F172A;line-height:1.3;">Research-Led Master Product Case Study</div>
    </div>
  </div>

  <!-- ARCHITECTURE STRIP -->
  <div style="background:#F1F5F9;border:0.75pt solid #E2E8F0;border-radius:3px;padding:2.5mm 3.5mm;flex-shrink:0;">
    <div style="font-family:'JetBrains Mono',monospace;font-size:5.6pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#64748B;margin-bottom:1.8mm;">Platform Architecture &mdash; Five Integrated Layers</div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:2.5mm;">
      <div style="border-left:2px solid #1A6CF6;padding-left:2.5mm;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:5.4pt;font-weight:700;color:#1A6CF6;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.8mm;">01 &middot; Intelligence</div>
        <div style="font-size:6.4pt;font-weight:600;color:#0F172A;margin-bottom:0.5mm;">Quantitative Core</div>
        <div style="font-size:5.8pt;color:#64748B;line-height:1.3;">3PL IRT CAT &middot; Monte Carlo &middot; 8-Vector AI Risk</div>
      </div>
      <div style="border-left:2px solid #0D9488;padding-left:2.5mm;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:5.4pt;font-weight:700;color:#0D9488;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.8mm;">02 &middot; Portfolio</div>
        <div style="font-size:6.4pt;font-weight:600;color:#0F172A;margin-bottom:0.5mm;">Flagship Program</div>
        <div style="font-size:5.8pt;color:#64748B;line-height:1.3;">Research &middot; internships &middot; mentorship &middot; OpenBadges</div>
      </div>
      <div style="border-left:2px solid #7C3AED;padding-left:2.5mm;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:5.4pt;font-weight:700;color:#7C3AED;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.8mm;">03 &middot; Marketplace</div>
        <div style="font-size:6.4pt;font-weight:600;color:#0F172A;margin-bottom:0.5mm;">Affiliate Engine</div>
        <div style="font-size:5.8pt;color:#64748B;line-height:1.3;">M(s,c) &ge; 0.75 gate &middot; 20&ndash;25% affiliate margin</div>
      </div>
      <div style="border-left:2px solid #D97706;padding-left:2.5mm;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:5.4pt;font-weight:700;color:#D97706;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.8mm;">04 &middot; Trident</div>
        <div style="font-size:6.4pt;font-weight:600;color:#0F172A;margin-bottom:0.5mm;">Market Infiltration</div>
        <div style="font-size:5.8pt;color:#64748B;line-height:1.3;">School B2B &middot; organic SEO &middot; college seminars</div>
      </div>
      <div style="border-left:2px solid #0F172A;padding-left:2.5mm;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:5.4pt;font-weight:700;color:#0F172A;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.8mm;">05 &middot; Endgame</div>
        <div style="font-size:6.4pt;font-weight:600;color:#0F172A;margin-bottom:0.5mm;">Sovereign Credential</div>
        <div style="font-size:5.8pt;color:#64748B;line-height:1.3;">Universal student underwriting infrastructure</div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div style="border-top:0.75pt solid #E2E8F0;padding-top:2.5mm;margin-top:3.5mm;display:flex;justify-content:space-between;align-items:center;font-family:'JetBrains Mono',monospace;font-size:5.8pt;color:#94A3B8;letter-spacing:0.06em;flex-shrink:0;">
    <div>&copy; 2026 Sovereign Education Technologies. All rights reserved.</div>
    <div>STRICTLY CONFIDENTIAL &middot; AUTHORIZED PARTNERS ONLY</div>
    <div>DOC-REF: IL-OS-PRD-2026-V2.4 &middot; 32 PAGES</div>
  </div>

</div>
"""
