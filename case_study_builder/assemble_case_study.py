# case_study_builder/assemble_case_study.py
import os
import sys
import subprocess
import time

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from styles import CSS_STYLES
from page_01_cover import get_page_01
from page_02_executive import get_page_02
from page_03_fragmentation import get_page_03
from page_04_competitor_matrix import get_page_04
from page_05_market_size import get_page_05
from page_06_lifecycle import get_page_06
from page_07_context_state import get_page_07
from page_08_onboarding_1 import get_page_08
from page_09_onboarding_2 import get_page_09
from page_10_synthesis import get_page_10
from page_11_flagship_portfolio_1 import get_page_11
from page_12_flagship_portfolio_2 import get_page_12
from page_13_marketplace import get_page_13
from page_14_actuarial_math import get_page_14
from page_15_ai_risk_index import get_page_15
from page_16_psychometrics import get_page_16
from page_17_ai_workspace import get_page_17
from page_18_ai_interface import get_page_18
from page_19_telemetry import get_page_19
from page_20_recent_waves import get_page_20
from page_21_case_study_alex import get_page_21
from page_22_infrastructure import get_page_22
from page_23_business_model import get_page_23
from page_24_commercial_arch import get_page_24
from page_25_trident_strategy import get_page_25
from page_26_gtm_growth import get_page_26
from page_27_operating_partners import get_page_27
from page_28_financial_model import get_page_28
from page_29_stress_tests import get_page_29
from page_30_capital_allocation import get_page_30
from page_31_defensibility_moats import get_page_31
from page_32_vision_synthesis import get_page_32

PROJECT_ROOT = "/Users/indian/Downloads/Adaptive signal project/India Lens"
HTML_OUTPUT = os.path.join(PROJECT_ROOT, "MASTER_CASE_STUDY.html")
PDF_OUTPUT = os.path.join(PROJECT_ROOT, "MASTER_CASE_STUDY.pdf")

def assemble():
    print("Compiling Master Case Study HTML (32 Pages)...")
    
    html_header = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Student OS &middot; Master Product Case Study &amp; Architectural Specification (32 Pages)</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"
          onload="renderMathInElement(document.body, {{delimiters: [{{left: '$$', right: '$$', display: true}}, {{left: '$', right: '$', display: false}}]}});"></script>
  <style>
{CSS_STYLES}
  </style>
</head>
<body>
"""

    pages = [
        get_page_01(),
        get_page_02(),
        get_page_03(),
        get_page_04(),
        get_page_05(),
        get_page_06(),
        get_page_07(),
        get_page_08(),
        get_page_09(),
        get_page_10(),
        get_page_11(),
        get_page_12(),
        get_page_13(),
        get_page_14(),
        get_page_15(),
        get_page_16(),
        get_page_17(),
        get_page_18(),
        get_page_19(),
        get_page_20(),
        get_page_21(),
        get_page_22(),
        get_page_23(),
        get_page_24(),
        get_page_25(),
        get_page_26(),
        get_page_27(),
        get_page_28(),
        get_page_29(),
        get_page_30(),
        get_page_31(),
        get_page_32()
    ]

    html_footer = """
</body>
</html>
"""

    full_html = html_header + "".join(pages) + html_footer

    with open(HTML_OUTPUT, "w", encoding="utf-8") as f:
        f.write(full_html)
    
    html_size = os.path.getsize(HTML_OUTPUT)
    print(f"HTML generated successfully: {HTML_OUTPUT} ({html_size:,} bytes)")
    
    print("Executing Chrome Headless PDF rendering with virtual time budget for fonts & KaTeX...")
    chrome_cmd = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "--headless=new",
        "--disable-gpu",
        "--run-all-compositor-stages-before-draw",
        "--virtual-time-budget=15000",
        f"--print-to-pdf={PDF_OUTPUT}",
        "--print-to-pdf-no-header",
        "--no-pdf-header-footer",
        f"file://{HTML_OUTPUT}"
    ]
    
    res = subprocess.run(chrome_cmd, capture_output=True, text=True)
    if res.returncode == 0 and os.path.exists(PDF_OUTPUT):
        pdf_size = os.path.getsize(PDF_OUTPUT)
        print(f"Master PDF compiled successfully: {PDF_OUTPUT} ({pdf_size:,} bytes)")
        import fitz
        doc = fitz.open(PDF_OUTPUT)
        print(f"PDF Verification: Total Pages = {len(doc)}")
        for i in range(len(doc)):
            print(f"Page {i+1}: size={doc[i].rect}")
    else:
        print(f"PDF Rendering failed. Return code: {res.returncode}")
        print(f"Stdout: {res.stdout}")
        print(f"Stderr: {res.stderr}")

if __name__ == "__main__":
    assemble()
