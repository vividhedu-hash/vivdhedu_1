"""
RBI Macroeconomic Scraper
Extracts wage growth, inflation, and employment indicators from RBI or MOSPI data sources.
"""
import logging
import asyncio
import argparse
from typing import List

from .base_scraper import BaseScraper, ScrapeResult

logger = logging.getLogger(__name__)


class RBIScraper(BaseScraper):
    """
    NOT WIRED INTO SCRAPER_REGISTRY.

    RBI DBIE (dbie.rbi.org.in) publishes only a JS-driven portal and per-series
    CSV downloads; there is no public JSON API to parse. This class previously
    raised RuntimeError unconditionally while still being registered, so
    `POST /api/scrape/trigger/rbi` accepted the request, created a scrape_runs
    row, and then failed 100% of the time — a route that looks healthy and can
    never succeed.

    It is unregistered on purpose. Macro series (CPI, wage index) come from
    WorldBankScraper, which is a real open API. Re-add this only once a real
    CSV/series parser is written.
    """

    SOURCE_NAME = "rbi"
    REQUEST_DELAY = 1.0

    async def scrape(self) -> List[ScrapeResult]:
        raise NotImplementedError(
            "RBIScraper has no working extractor: RBI DBIE exposes no public JSON "
            "API, and no CSV series parser is implemented. Use the 'worldbank' "
            "scraper for CPI/unemployment macro series. This source is "
            "intentionally absent from SCRAPER_REGISTRY."
        )

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true', help='Print output instead of DB write')
    args = parser.parse_args()

    async def main():
        scraper = RBIScraper(db=None, run_id="dry-run")
        async with scraper:
            results = await scraper.scrape()
            if args.dry_run:
                import json
                for r in results:
                    print(json.dumps(r.__dict__))

    asyncio.run(main())
