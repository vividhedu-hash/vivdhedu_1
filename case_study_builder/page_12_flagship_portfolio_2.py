# case_study_builder/page_12_flagship_portfolio_2.py
from styles import wrap_page

def get_page_12():
    content = """
<div class="kicker">Opportunity Architecture &middot; Flagship Portfolio Program II</div>
<h1 class="headline">Micro-Internships, Practitioner Mentorship &amp; Verified Badges</h1>
<div class="headline-sub">Bridging the academia-industry chasm: 4&ndash;8 week corporate sprints, tier-1 practitioner office hours &amp; cryptographic credentials.</div>

<div class="lead-p">
  Over 80% of Indian engineering and commerce graduates are deemed unemployable by corporate recruiters due to a total absence of practical, 
  production-grade experience. While conventional college placement cells rely on unverified claims, <strong>Student OS integrates corporate 
  micro-internships, 1:1 senior practitioner mentorship, and tamper-proof industry certifications</strong> directly into the student&rsquo;s continuous longitudinal ledger.
</div>

<div class="grid-3">
  <div class="card" style="border-top: 2.5px solid var(--accent);">
    <div class="card-title-sm">1. Corporate Micro-Internships</div>
    <div class="card-p">
      <strong>4&ndash;8 Week Vetted Sprints:</strong> Curated project placements with high-growth tech startups, algorithmic funds, 
      biotech labs, and policy think tanks.
    </div>
    <div style="margin-top: 1.5mm; font-size: 6.8pt; color: var(--text-muted); line-height: 1.35;">
      &bull; <strong>Applied Machine Learning:</strong> Fine-tuning open-source LLMs on domain datasets.<br>
      &bull; <strong>Quantitative Backtesting:</strong> Python factor modeling with real market feeds.<br>
      &bull; <strong>Biomedical Data Cleaning:</strong> Processing genomic FASTA sequences for trials.
    </div>
  </div>

  <div class="card" style="border-top: 2.5px solid var(--purple);">
    <div class="card-title-sm" style="color: var(--purple);">2. Senior Practitioner Mentorship</div>
    <div class="card-p">
      <strong>Bi-Weekly Tactical Office Hours:</strong> 1:1 structured guidance from senior practitioners at Google, Meta, Goldman Sachs, 
      McKinsey, and DeepMind.
    </div>
    <div style="margin-top: 1.5mm; font-size: 6.8pt; color: var(--text-muted); line-height: 1.35;">
      &bull; <strong>Architecture Reviews:</strong> Codebase critique and design pattern audits.<br>
      &bull; <strong>Case &amp; Algorithmic Prep:</strong> Real-world technical mock evaluations.<br>
      &bull; <strong>Sovereign Network Access:</strong> Direct referral pathways bypassing ATS filters.
    </div>
  </div>

  <div class="card" style="border-top: 2.5px solid var(--green);">
    <div class="card-title-sm" style="color: var(--green);">3. OpenBadges v3.0 Verified Certs</div>
    <div class="card-p">
      <strong>Tamper-Proof Evidence Ledger:</strong> Cryptographically signed micro-credentials linked to verifiable GitHub commits and pull requests.
    </div>
    <div style="margin-top: 1.5mm; font-size: 6.8pt; color: var(--text-muted); line-height: 1.35;">
      &bull; <strong>Zero Resume Fraud:</strong> Completely solves the 84% resume misrepresentation crisis.<br>
      &bull; <strong>Instant Recruiter Verify:</strong> Public cryptographic verification URL.<br>
      &bull; <strong>ATS-Optimized Embeds:</strong> Structured JSON-LD metadata for LinkedIn.
    </div>
  </div>
</div>

<div class="card-title-sm" style="margin-top: 2.5mm;">Comparative Market Architecture: Student OS vs. Fragmented Alternatives</div>
<div class="table-wrap">
  <table class="editorial-table">
    <thead>
      <tr>
        <th style="width: 20%;">Feature Dimension</th>
        <th style="width: 24%;">Student OS (IndiaLens)</th>
        <th style="width: 20%;">Private Admissions Agencies</th>
        <th style="width: 18%;">EdTech Bootcamps</th>
        <th style="width: 18%;">College Placement Cells</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Annual Student Cost</strong></td>
        <td><strong style="color: var(--green);">&#8377;4,999 / year (Nominal)</strong></td>
        <td>&#8377;3,00,000 &ndash; &#8377;12,00,000</td>
        <td>&#8377;50,000 &ndash; &#8377;2,50,000</td>
        <td>Included in tuition (Zero ROI)</td>
      </tr>
      <tr>
        <td><strong>Research Infrastructure</strong></td>
        <td><strong>1:1 PhD + SSRN/arXiv DOI</strong></td>
        <td>Predatory pay-to-publish papers</td>
        <td>None (Toy capstone code)</td>
        <td>Unpublished campus reports</td>
      </tr>
      <tr>
        <td><strong>Corporate Placements</strong></td>
        <td><strong>Vetted Micro-Internship Sprints</strong></td>
        <td>None (Theoretical essays only)</td>
        <td>Simulated mock exercises</td>
        <td>Mass IT service sweatshops</td>
      </tr>
      <tr>
        <td><strong>Practitioner Mentorship</strong></td>
        <td><strong>1:1 Tier-1 Tech/Finance Mentors</strong></td>
        <td>Sales consultants / counselors</td>
        <td>Junior batch teaching assistants</td>
        <td>Tenured faculty (No industry touch)</td>
      </tr>
      <tr>
        <td><strong>Verification Standard</strong></td>
        <td><strong>OpenBadges v3.0 + Git Ledger</strong></td>
        <td>Self-reported Word documents</td>
        <td>Internal platform PDF certificate</td>
        <td>Printed unverified paper degree</td>
      </tr>
      <tr>
        <td><strong>Fiduciary Alignment</strong></td>
        <td><strong>100% Student-Aligned (Zero Kickbacks)</strong></td>
        <td>Takes undisclosed university kickbacks</td>
        <td>High-pressure loan financing</td>
        <td>Institutional preservation first</td>
      </tr>
    </tbody>
  </table>
</div>

<div class="col-sidebar" style="margin-top: 2mm;">
  <div class="card-subtle">
    <div class="card-title-sm">The Democratic Fiduciary Mandate</div>
    <p class="body-p">
      Prior to Student OS, access to authentic research, elite corporate mentorship, and structured project execution was an exclusive 
      privilege reserved for students at ultra-wealthy international schools (IB/IGCSE) whose parents could afford &#8377;10 Lakh counseling fees. 
      By automating the matching graph, standardizing project milestones, and partnering with institutional research networks, 
      <strong>Student OS compresses the marginal delivery cost by 98.6%</strong>, enabling any ambitious student in Tier-2/3 India 
      to assemble a world-class admissions and employment portfolio.
    </p>
  </div>

  <div class="card" style="border-left: 2.5px solid var(--accent);">
    <div class="card-title-sm">Recruiter Verification Protocol</div>
    <div style="font-family: var(--font-mono); font-size: 6.2pt; color: var(--text-muted); line-height: 1.35;">
      <code>GET /api/v2/verify/badge/{id}</code><br>
      &bull; <strong>Signature:</strong> Ed25519 Cryptographic Proof<br>
      &bull; <strong>Code Commit Hash:</strong> SHA-256 Git Proof<br>
      &bull; <strong>Mentor Validation:</strong> Verified Corporate Domain OAuth<br>
      &bull; <strong>Integrity Score:</strong> 99.4% Plagiarism Resistance
    </div>
  </div>
</div>
"""
    return wrap_page(content, 12, 32, "Flagship Portfolio Studio &middot; Micro-Internships &amp; Certs", "PORTFOLIO &amp; MENTORSHIP")
