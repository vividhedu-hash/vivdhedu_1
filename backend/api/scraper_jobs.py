"""Dispatch a named scraper against a scrape_runs row. No fake run IDs."""
import logging
from typing import Dict, Tuple


from .db.database import AsyncSessionLocal
from .config import settings

logger = logging.getLogger(__name__)

# source_name → (module, class)
SCRAPER_REGISTRY: Dict[str, Tuple[str, str]] = {
    "worldbank": ("scrapers.worldbank_scraper", "WorldBankScraper"),
    "nirf": ("scrapers.nirf_scraper", "NIRFScraper"),
    "plfs": ("scrapers.plfs_scraper", "PLFSScraper"),
    "reddit": ("scrapers.reddit_scraper", "RedditScraper"),
    "ambitionbox": ("scrapers.ambitionbox_scraper", "AmbitionBoxScraper"),
    "naukri": ("scrapers.naukri_scraper", "NaukriScraper"),
    "tavily": ("scrapers.tavily_scraper", "TavilyScraper"),
    "payscale": ("scrapers.payscale_scraper", "PayscaleScraper"),
    "rbi": ("scrapers.rbi_scraper", "RBIScraper"),
}

VALID_SOURCES = sorted(SCRAPER_REGISTRY.keys())


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
        logger.error("Failed to import scraper %s: %s", source, e)
        return

    async with AsyncSessionLocal() as db:
        scraper = scraper_cls(db=db, run_id=run_id, settings=settings)
        await scraper.run()
