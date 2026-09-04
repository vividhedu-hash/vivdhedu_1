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
    SOURCE_NAME = "rbi"
    REQUEST_DELAY = 1.0

    async def scrape(self) -> List[ScrapeResult]:
        url = "https://dbie.rbi.org.in/DBIE/dbie.rbi?site=statistics"
        response = await self.get(url)
        # Live HTML is parsed by future MOSPI/DBIE extractors. Never invent wage series.
        raise RuntimeError(
            f"RBI DBIE has no public JSON API yet (HTTP {response.status_code}). "
            "Use World Bank scraper for CPI / unemployment until a parser is wired."
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
