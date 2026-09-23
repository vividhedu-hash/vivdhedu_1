# case_study_builder/styles.py
# Publication-Grade Editorial CSS Design System & Layout Utilities

CSS_STYLES = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,600&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

:root {
  --bg: #FFFFFF;
  --bg-subtle: #F8FAFC;
  --bg-card: #FFFFFF;
  --bg-dark: #090D16;
  --text-main: #0F172A;
  --text-muted: #334155;
  --text-light: #64748B;
  --accent: #1A6CF6;
  --accent-light: #EFF6FF;
  --accent-dark: #1E40AF;
  --border: #CBD5E1;
  --border-light: #E2E8F0;
  --border-dark: #94A3B8;
  --green: #0D9488;
  --green-bg: #F0FDF4;
  --amber: #D97706;
  --amber-bg: #FFFBEB;
  --rose: #DC2626;
  --rose-bg: #FEF2F2;
  --purple: #7C3AED;
  --purple-bg: #F5F3FF;
  --font-serif: "Newsreader", Georgia, serif;
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

html, body { background: #E2E8F0; font-family: var(--font-sans); color: var(--text-main); line-height: 1.46; font-size: 8.8pt; font-feature-settings: "cv02","cv03","cv04","cv11"; }

@page { size: 210mm 297mm; margin: 0; }

.page { width: 210mm; height: 297mm; padding: 11mm 14mm 9mm 14mm; position: relative; overflow: hidden; page-break-after: always; display: flex; flex-direction: column; background: var(--bg); margin: 0 auto 10px auto; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }

@media print { body { background: transparent; } .page { margin: 0; box-shadow: none; page-break-after: always; } }

.header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 1.8mm; border-bottom: 0.75pt solid var(--border-light); margin-bottom: 2mm; flex-shrink: 0; }
.header-left { font-family: var(--font-mono); font-size: 6.5pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); display: flex; align-items: center; gap: 5px; }
.header-dot { width: 4px; height: 4px; background: var(--accent); border-radius: 50%; display: inline-block; }
.header-title { font-family: var(--font-sans); font-size: 7.0pt; font-weight: 500; color: var(--text-light); letter-spacing: 0.01em; }
.header-meta { font-family: var(--font-mono); font-size: 6.2pt; font-weight: 600; color: var(--text-light); letter-spacing: 0.05em; text-transform: uppercase; background: var(--bg-subtle); border: 0.5pt solid var(--border-light); padding: 1px 4px; border-radius: 2px; }

.footer { display: flex; justify-content: space-between; align-items: center; padding-top: 1.6mm; border-top: 0.75pt solid var(--border-light); margin-top: auto; flex-shrink: 0; font-size: 6.4pt; color: var(--text-light); }
.footer-left { font-weight: 500; color: var(--text-light); }
.footer-center { font-family: var(--font-mono); font-size: 6.0pt; letter-spacing: 0.06em; text-transform: uppercase; color: var(--border-dark); }
.footer-page { font-family: var(--font-mono); font-weight: 700; color: var(--text-main); font-size: 6.6pt; }

.content { flex: 1; display: flex; flex-direction: column; min-height: 0; }

.kicker { font-family: var(--font-mono); font-size: 6.6pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: var(--accent); margin-bottom: 1mm; display: flex; align-items: center; gap: 6px; }
.kicker::before { content: ""; display: inline-block; width: 14px; height: 1.5px; background: var(--accent); flex-shrink: 0; }

.headline { font-family: var(--font-serif); font-size: 20pt; font-weight: 600; line-height: 1.08; letter-spacing: -0.025em; color: var(--text-main); margin-bottom: 1.2mm; }
.headline-sub { font-family: var(--font-serif); font-size: 10.5pt; font-weight: 400; font-style: italic; color: var(--text-muted); line-height: 1.3; margin-bottom: 2mm; border-bottom: 0.5pt solid var(--border-light); padding-bottom: 2mm; }
.lead-p { font-size: 8.5pt; font-weight: 400; line-height: 1.5; color: var(--text-main); margin-bottom: 2mm; }
.body-p { font-size: 7.8pt; font-weight: 400; line-height: 1.45; color: var(--text-muted); margin-bottom: 1.6mm; }
.body-p strong { font-weight: 600; color: var(--text-main); }
.editorial-note { font-family: var(--font-serif); font-style: italic; font-size: 8.2pt; color: var(--text-muted); padding: 2mm 3mm; border-left: 2.5px solid var(--accent); background: var(--accent-light); border-radius: 0 3px 3px 0; margin: 1.6mm 0; line-height: 1.42; }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 3.5mm; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2.8mm; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2mm; }
.col-sidebar { display: grid; grid-template-columns: 1.65fr 1fr; gap: 4mm; }
.col-sidebar-rev { display: grid; grid-template-columns: 1fr 1.65fr; gap: 4mm; }

.card { background: var(--bg-card); border: 0.75pt solid var(--border); border-radius: 3px; padding: 2.5mm 3mm; margin-bottom: 1.6mm; }
.card-subtle { background: var(--bg-subtle); border: 0.75pt solid var(--border-light); border-radius: 3px; padding: 2.5mm 3mm; margin-bottom: 1.6mm; }
.card-accent { background: var(--accent-light); border: 0.75pt solid #BFDBFE; border-left: 2.5px solid var(--accent); border-radius: 0 3px 3px 0; padding: 2.5mm 3mm; margin-bottom: 1.6mm; }
.card-dark { background: var(--bg-dark); color: #F8FAFC; border-radius: 4px; padding: 3mm 3.5mm; margin-bottom: 1.8mm; border: 0.75pt solid rgba(255,255,255,0.06); }
.card-title { font-size: 7.8pt; font-weight: 700; color: var(--text-main); letter-spacing: 0.01em; margin-bottom: 1mm; display: flex; align-items: center; justify-content: space-between; }
.card-title-sm { font-family: var(--font-mono); font-size: 6.6pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent); margin-bottom: 1mm; }
.card-p { font-size: 7.4pt; color: var(--text-muted); line-height: 1.42; }
.card-p strong { color: var(--text-main); font-weight: 600; }

.epistemic-tag { display: inline-flex; align-items: center; gap: 3px; font-family: var(--font-mono); font-size: 5.8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 1.2px 4.5px; border-radius: 2px; }
.tag-evidence { background: #EFF6FF; color: #1D4ED8; border: 0.5pt solid #BFDBFE; }
.tag-response { background: #F5F3FF; color: #6D28D9; border: 0.5pt solid #DDD6FE; }
.tag-ui { background: #ECFDF5; color: #047857; border: 0.5pt solid #A7F3D0; }
.tag-gap { background: #FEF2F2; color: #B91C1C; border: 0.5pt solid #FECACA; }

.table-wrap { margin: 1.2mm 0 1.8mm 0; border: 0.75pt solid var(--border); border-radius: 3px; overflow: hidden; background: #FFFFFF; }
table.editorial-table { width: 100%; border-collapse: collapse; font-size: 7.0pt; }
table.editorial-table th { background: #0F172A; color: #F1F5F9; font-family: var(--font-mono); font-size: 6.2pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; padding: 3.5px 5.5px; border-bottom: 0.75pt solid #1E293B; text-align: left; }
table.editorial-table td { padding: 3.5px 5.5px; border-bottom: 0.5pt solid var(--border-light); color: var(--text-muted); vertical-align: top; line-height: 1.34; }
table.editorial-table tr:last-child td { border-bottom: none; }
table.editorial-table tr:nth-child(even) td { background: #FAFAFB; }
table.editorial-table td.mono { font-family: var(--font-mono); font-size: 6.8pt; color: var(--text-main); }
table.editorial-table td.num { font-family: var(--font-mono); text-align: right; font-size: 6.8pt; font-weight: 600; }
table.editorial-table td strong { color: var(--text-main); font-weight: 600; }

.status-pill { display: inline-block; font-family: var(--font-mono); font-size: 5.6pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 1.2px 4px; border-radius: 2px; }
.status-broken { background: var(--rose-bg); color: var(--rose); border: 0.5pt solid #FECACA; }
.status-unmet { background: #FFF1F2; color: #E11D48; border: 0.5pt solid #FFE4E6; }
.status-underserved { background: var(--amber-bg); color: #D97706; border: 0.5pt solid #FDE68A; }
.status-fragmented { background: #F3E8FF; color: #7E22CE; border: 0.5pt solid #E9D5FF; }
.status-partial { background: #FEF3C7; color: #92400E; border: 0.5pt solid #FCD34D; }
.status-solved { background: var(--green-bg); color: #059669; border: 0.5pt solid #A7F3D0; }

.screen-frame { background: #FFFFFF; border: 0.75pt solid var(--border-dark); border-radius: 3px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); display: flex; flex-direction: column; margin: 1.2mm 0 1.6mm 0; }
.screen-bar { background: #F1F5F9; padding: 2px 7px; display: flex; align-items: center; justify-content: space-between; border-bottom: 0.5pt solid var(--border); flex-shrink: 0; }
.screen-dots { display: flex; gap: 3px; }
.screen-dot { width: 4px; height: 4px; border-radius: 50%; }
.dot-red { background: #FF5F56; } .dot-yellow { background: #FFBD2E; } .dot-green { background: #27C93F; }
.screen-url { font-family: var(--font-mono); font-size: 5.5pt; color: var(--text-light); letter-spacing: 0.04em; }
.screen-tag { font-family: var(--font-mono); font-size: 5.2pt; font-weight: 700; text-transform: uppercase; color: var(--accent); background: #EFF6FF; padding: 1px 3.5px; border-radius: 2px; }
.screen-img { width: 100%; height: auto; display: block; }
.screen-caption { font-size: 6.6pt; color: var(--text-muted); padding: 1.4mm 2.4mm; background: #FFFFFF; border-top: 0.5pt solid var(--border-light); line-height: 1.32; }
.screen-caption strong { color: var(--text-main); font-family: var(--font-mono); font-size: 6.2pt; }

.annotated-container { position: relative; border: 0.75pt solid var(--border); border-radius: 3px; overflow: hidden; background: #FFFFFF; margin-bottom: 1.8mm; }

.math-block { background: #0B132B; color: #E2E8F0; border-radius: 3px; padding: 2.6mm 3.2mm; margin: 1.4mm 0; font-family: var(--font-mono); font-size: 7.2pt; line-height: 1.45; border-left: 2.5px solid var(--accent); }
.math-title { font-size: 6.4pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #60A5FA; margin-bottom: 1mm; display: flex; justify-content: space-between; }
.math-eq { font-size: 8.5pt; color: #FFFFFF; padding: 1mm 0; font-weight: 600; }
.math-legend { font-size: 6.3pt; color: #94A3B8; margin-top: 1mm; border-top: 0.5pt solid rgba(255,255,255,0.08); padding-top: 1mm; line-height: 1.38; }

.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2mm; margin: 1.2mm 0 2mm 0; }
.kpi-tile { background: #FFFFFF; border: 0.75pt solid var(--border); border-top: 2.5px solid var(--accent); border-radius: 0 0 3px 3px; padding: 2.2mm 2.6mm; }
.kpi-val { font-family: var(--font-mono); font-size: 13pt; font-weight: 800; color: var(--text-main); line-height: 1.1; letter-spacing: -0.025em; }
.kpi-val.accent { color: var(--accent); } .kpi-val.green { color: var(--green); } .kpi-val.rose { color: var(--rose); } .kpi-val.purple { color: var(--purple); }
.kpi-label { font-size: 6.0pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: var(--text-light); margin-top: 0.7mm; }
.kpi-sub { font-size: 5.8pt; color: var(--text-light); line-height: 1.25; margin-top: 0.4mm; }

.flywheel-box { background: #F8FAFC; border: 0.75pt solid var(--border); border-radius: 4px; padding: 2.5mm 3mm; margin: 1.8mm 0; }

.research-ss-card { background: #0B0F19; border: 0.75pt solid #1E293B; border-radius: 4px; overflow: hidden; margin-bottom: 1.8mm; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
.research-ss-header { background: #111827; padding: 1.2mm 2.5mm; display: flex; justify-content: space-between; align-items: center; border-bottom: 0.75pt solid #1F2937; font-family: var(--font-mono); font-size: 5.8pt; color: #94A3B8; }
.research-ss-img { width: 100%; display: block; }
.research-ss-caption { padding: 1.5mm 2.5mm; font-size: 6.6pt; line-height: 1.35; color: #94A3B8; background: #0B0F19; border-top: 0.75pt solid #1E293B; }
.research-ss-caption strong { color: #F8FAFC; font-weight: 600; }

.cover-page { /* overridden by inline styles on the cover page div */ }
.cover-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(26,108,246,0.12); border: 0.75pt solid rgba(26,108,246,0.35); padding: 2.5px 9px; border-radius: 3px; font-family: var(--font-mono); font-size: 6.5pt; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #60A5FA; }
.cover-h1 { font-family: var(--font-serif); font-size: 42pt; font-weight: 600; line-height: 1.0; letter-spacing: -0.03em; color: #FFFFFF; margin-bottom: 3.5mm; }
.cover-h1 span.hl { color: #60A5FA; }
.cover-sub { font-family: var(--font-serif); font-size: 13pt; font-weight: 400; font-style: italic; color: #94A3B8; line-height: 1.38; max-width: 150mm; margin-bottom: 6mm; }
.cover-rule { width: 50mm; height: 2.5px; background: linear-gradient(90deg, #1A6CF6, #60A5FA, transparent); margin-bottom: 7mm; }
.cover-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; border-top: 0.75pt solid rgba(255,255,255,0.1); padding-top: 4mm; margin-top: 4mm; }
.cover-meta-item { display: flex; flex-direction: column; gap: 1mm; }
.cover-meta-label { font-family: var(--font-mono); font-size: 5.8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #475569; }
.cover-meta-val { font-size: 7.6pt; font-weight: 600; color: #CBD5E1; line-height: 1.35; }
.cover-footer { display: flex; justify-content: space-between; align-items: center; border-top: 0.75pt solid rgba(255,255,255,0.07); padding-top: 3mm; margin-top: 4mm; font-family: var(--font-mono); font-size: 6.0pt; color: #334155; }

.svg-diagram { width: 100%; height: auto; display: block; margin: 1.5mm 0; }
.highlight-strip { background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border-radius: 4px; padding: 2.8mm 3.5mm; margin: 1.5mm 0; border-left: 3px solid var(--accent); }
.section-divider { border: none; border-top: 0.75pt solid var(--border-light); margin: 2mm 0; }
.metric-inline { display: inline-flex; align-items: baseline; gap: 2px; font-family: var(--font-mono); font-weight: 800; color: var(--accent); font-size: 11pt; letter-spacing: -0.02em; }
"""

def wrap_page(content, page_num, total_pages=32, section_title="SECTION", kicker="SYSTEM ARCHITECTURE", doc_status="CONFIDENTIAL SPEC"):
    return f"""
<div class="page">
  <div class="header">
    <div class="header-left">
      <span class="header-dot"></span>
      <span>STUDENT OS &middot; {kicker}</span>
    </div>
    <div class="header-title">{section_title}</div>
    <div class="header-meta">{doc_status}</div>
  </div>
  <div class="content">
    {content}
  </div>
  <div class="footer">
    <div class="footer-left">Project IndiaLens &middot; Sovereign Education &amp; Career Intelligence Operating System</div>
    <div class="footer-center">Deterministic Fiduciary Architecture</div>
    <div class="footer-page">Page {page_num:02d} of {total_pages:02d}</div>
  </div>
</div>
"""
