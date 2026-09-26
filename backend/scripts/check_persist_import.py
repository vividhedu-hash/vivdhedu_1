"""
Regression guard for the persist-time import that silently killed every scrape.

base_scraper.persist_results() imported AnomalyDetector via `..pipeline`, which
raises ImportError inside package `scrapers`. run() caught it and wrote
status='failed' AFTER the HTTP work, so scrapers looked healthy and produced
zero rows. This asserts the import resolves in BOTH deployed layouts.
"""
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent

failures = []

# Layout A — deployed: `uvicorn api.main:app` from backend/ (top-level packages)
sys.path.insert(0, str(BACKEND))
try:
    from pipeline.anomaly_detector import AnomalyDetector  # noqa: F401
    print("layout A (top-level `pipeline`):        OK")
except Exception as e:
    failures.append(f"layout A: {type(e).__name__}: {e}")
    print(f"layout A (top-level `pipeline`):        FAIL {type(e).__name__}: {e}")

# Layout B — repo root / pytest: `backend.pipeline`
sys.path.insert(0, str(BACKEND.parent))
try:
    from backend.pipeline.anomaly_detector import AnomalyDetector as A2  # noqa: F401
    print("layout B (`backend.pipeline`):          OK")
except Exception as e:
    failures.append(f"layout B: {type(e).__name__}: {e}")
    print(f"layout B (`backend.pipeline`):          FAIL {type(e).__name__}: {e}")

# The real assertion: the try/except inside persist_results must resolve.
src = (BACKEND / "scrapers" / "base_scraper.py").read_text()
if "from ..pipeline" in src:
    failures.append("base_scraper.py still contains the invalid `from ..pipeline` import")
    print("persist_results relative import:        STILL PRESENT (bug)")
else:
    print("persist_results relative import:        removed")

if failures:
    print("\nFAILED:")
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("\nall persist-import checks passed")
