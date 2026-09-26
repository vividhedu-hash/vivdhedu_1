"""Dispatch a named scraper against a scrape_runs row. No fake run IDs."""
import logging
from typing import Dict, List, Tuple

from sqlalchemy import text

from .db.database import AsyncSessionLocal
from .config import settings

logger = logging.getLogger(__name__)

# source_name → (module, class)
#
# NOTE: this is the single gate on which scrapers are reachable. Anything not
# listed here cannot be triggered by POST /api/scrape/trigger/{name}, no matter
# how complete scrapers/<name>_scraper.py is. Six real scrapers were previously
# missing from this map, so they existed but were unreachable:
# jina, crawl4ai, indeed, internshala, college_placement.
#
# `rbi` is intentionally absent — RBIScraper has no working extractor (RBI DBIE
# exposes no public JSON API) and previously raised on 100% of runs while still
# being registered. See scrapers/rbi_scraper.py.
SCRAPER_REGISTRY: Dict[str, Tuple[str, str]] = {
    "worldbank": ("scrapers.worldbank_scraper", "WorldBankScraper"),
    "nirf": ("scrapers.nirf_scraper", "NIRFScraper"),
    "plfs": ("scrapers.plfs_scraper", "PLFSScraper"),
    "reddit": ("scrapers.reddit_scraper", "RedditScraper"),
    "ambitionbox": ("scrapers.ambitionbox_scraper", "AmbitionBoxScraper"),
    "naukri": ("scrapers.naukri_scraper", "NaukriScraper"),
    "tavily": ("scrapers.tavily_scraper", "TavilyScraper"),
    "payscale": ("scrapers.payscale_scraper", "PayscaleScraper"),
    # --- previously unreachable ---
    "indeed": ("scrapers.indeed_scraper", "IndeedScraper"),
    "internshala": ("scrapers.internshala_scraper", "InternshalaScraper"),
    "college_placement": ("scrapers.college_placement_scraper", "CollegePlacementScraper"),
    "jina": ("scrapers.jina_scraper", "JinaScraper"),
    "crawl4ai": ("scrapers.crawl4ai_scraper", "Crawl4AIScraper"),
}

# Sources that need a key/credential. Triggering one without it should fail
# with a clear message rather than an opaque traceback.
CREDENTIALED_SOURCES: Dict[str, List[str]] = {
    "reddit": ["REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET"],
    "tavily": ["TAVILY_API_KEY"],
}

VALID_SOURCES = sorted(SCRAPER_REGISTRY.keys())


def missing_credentials(source: str) -> List[str]:
    """Env names a source needs that are not currently set."""
    out: List[str] = []
    for name in CREDENTIALED_SOURCES.get(source, []):
        value = getattr(settings, name.lower(), "") or ""
        if not str(value).strip():
            out.append(name)
    return out


async def run_scraper_job(source: str, run_id: str) -> None:
    spec = SCRAPER_REGISTRY.get(source)
    if not spec:
        logger.error("Unknown scraper source: %s", source)
        return

    module_name, class_name = spec
    try:
        module = __import__(module_name, fromlist=[class_name])
        scraper_cls = getattr(module, class_name)
    except Exception as e:
        # Previously this only logged and returned, leaving the scrape_runs row
        # stuck at status='running' forever. Record the failure instead.
        logger.exception("Failed to import scraper %s", source)
        await _mark_run_failed(run_id, f"import_error: {type(e).__name__}: {e}")
        return

    missing = missing_credentials(source)
    if missing:
        logger.warning("Scraper %s missing credentials: %s", source, missing)
        await _mark_run_failed(run_id, f"missing_env: {', '.join(missing)}")
        return

    try:
        async with AsyncSessionLocal() as db:
            scraper = scraper_cls(db=db, run_id=run_id, settings=settings)
            await scraper.run()
    except Exception as e:
        # BaseScraper.run() already handles its own failures; this catches
        # constructor/DB-session errors so the run never hangs in 'running'.
        logger.exception("Scraper %s crashed outside run()", source)
        await _mark_run_failed(run_id, f"{type(e).__name__}: {e}")


async def _mark_run_failed(run_id: str, message: str) -> None:
    """Best-effort status write. Never raise from the failure path."""
    try:
        async with AsyncSessionLocal() as db:
            await db.execute(
                text(
                    """
                    UPDATE scrape_runs SET
                        status = 'failed',
                        error_message = :error,
                        completed_at = NOW()
                    WHERE id = :id
                """
                ),
                {"id": run_id, "error": message[:2000]},
            )
            await db.commit()
    except Exception:
        logger.exception("Could not mark scrape run %s as failed", run_id)
