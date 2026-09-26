"""
Live scraper audit — proves which sources actually return data on the network.

Read-only: db=None, run_id="audit", and persist_results() is never called, so
nothing is written to Postgres. Only scrape() is exercised.
"""
import asyncio
import importlib
import inspect
import sys
import time
import traceback
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

from api.scraper_jobs import SCRAPER_REGISTRY  # noqa: E402
from api.config import settings  # noqa: E402


async def probe(source, module_name, class_name):
    row = {"source": source, "status": "?", "detail": "", "n": 0, "secs": 0.0}
    t0 = time.time()
    try:
        mod = importlib.import_module(module_name)
        cls = getattr(mod, class_name)
        scraper = cls(db=None, run_id="audit", settings=settings)
    except Exception as e:
        row["status"] = "IMPORT"
        row["detail"] = f"{type(e).__name__}: {str(e)[:120]}"
        row["secs"] = time.time() - t0
        return row

    async with scraper:
        try:
            out = scraper.scrape()
            if inspect.isawaitable(out):
                out = await asyncio.wait_for(out, timeout=120)
            out = out or []
            row["n"] = len(out)
            row["status"] = "OK" if out else "EMPTY"
            if out:
                f = out[0]
                row["detail"] = f"e.g. {f.field_name}={str(f.raw_value)[:40]!r} parsed={f.parsed_value}"
        except asyncio.TimeoutError:
            row["status"] = "TIMEOUT"
            row["detail"] = ">120s"
        except Exception as e:
            row["status"] = "RAISED"
            row["detail"] = f"{type(e).__name__}: {str(e)[:150]}"
            tb = traceback.format_exc().strip().splitlines()
            row["frame"] = tb[-3] if len(tb) >= 3 else ""
    row["secs"] = round(time.time() - t0, 1)
    return row


async def main():
    print(f"registered sources: {len(SCRAPER_REGISTRY)}\n")
    rows = []
    for src in sorted(SCRAPER_REGISTRY):
        m, c = SCRAPER_REGISTRY[src]
        r = await probe(src, m, c)
        rows.append(r)
        print(f"[{r['status']:<7}] {r['source']:<18} {r['secs']:>6.1f}s  n={r['n']:<4} {r['detail']}")
        if r.get("frame"):
            print(f"{'':>9}at: {r['frame'].strip()[:150]}")

    ok = [r for r in rows if r["status"] == "OK"]
    print(f"\n=== {len(ok)}/{len(rows)} sources returned live data ===")
    for r in rows:
        if r["status"] != "OK":
            print(f"  NOT-DATA {r['source']:<18} {r['status']}")


asyncio.run(main())
