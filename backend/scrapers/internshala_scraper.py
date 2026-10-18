"""
Internshala Scraper — Scrapes internshala.com/internships/ and /jobs/ for stipend ranges and job demand.
"""
import argparse
import asyncio
import logging
import re
from typing import List
from bs4 import BeautifulSoup

from .base_scraper import BaseScraper, ScrapeResult

logger = logging.getLogger(__name__)

CATEGORY_MAP = {
    "web-development-internship": "engineering-cs",
    "data-science-internship": "engineering-cs",
    "finance-internship": "commerce",
    "marketing-internship": "management",
    "civil-engineering-internship": "engineering-non-cs",
    "content-writing-internship": "arts"
}

class InternshalaScraper(BaseScraper):
    SOURCE_NAME = "internshala"
    BASE_URL = "https://internshala.com"
    REQUEST_DELAY = 3.0

    def __init__(self, db, run_id: str, settings=None, dry_run: bool = False, categories: List[str] = None):
        super().__init__(db, run_id, settings)
        self.dry_run = dry_run
        self.categories = categories or list(CATEGORY_MAP.keys())

    async def scrape(self) -> List[ScrapeResult]:
        results = []
        for category in self.categories:
            if category not in CATEGORY_MAP:
                continue
            
            url = f"{self.BASE_URL}/internships/{category}/"
            logger.info(f"Scraping category: {category} -> {url}")
            try:
                resp = await self.get(url)
                soup = BeautifulSoup(resp.text, "html.parser")
                listings = soup.select(
                    "div.individual_internship, div[id^='individual_internship']"
                )
                stipend_nodes = soup.select(
                    "span.stipend, span.stipend_container_text, div.stipend, "
                    "[class*='stipend']"
                )
                stipends = []
                for node in stipend_nodes:
                    stipend_text = node.get_text(strip=True)
                    matches = re.findall(r"(\d[\d,]*)", stipend_text.replace(",", ""))
                    for m in matches:
                        try:
                            val = float(m)
                        except ValueError:
                            continue
                        if 1000 <= val <= 200000:
                            stipends.append(val)

                mapped_field = CATEGORY_MAP[category]
                demand = float(len(listings) or len(stipend_nodes))
                if stipends:
                    stipends.sort()
                    p50 = stipends[len(stipends) // 2]
                    results.append(ScrapeResult(
                        program_id=None,
                        field_name="internshala_stipend_p50",
                        raw_value=str(p50),
                        parsed_value=p50,
                        unit="INR/month",
                        source_url=url,
                        metadata={"degree_field": mapped_field, "category": category},
                    ))

                if demand:
                    results.append(ScrapeResult(
                        program_id=None,
                        field_name="internshala_demand_index",
                        raw_value=str(int(demand)),
                        parsed_value=demand,
                        unit="count",
                        source_url=url,
                        metadata={"degree_field": mapped_field, "category": category},
                    ))

            except Exception as e:
                logger.error(f"Error parsing Internshala category {category}: {e}")
                
        return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--category", type=str, nargs="+")
    args = parser.parse_args()
    
    async def main():
        logging.basicConfig(level=logging.INFO)
        scraper = InternshalaScraper(db=None, run_id="manual", dry_run=args.dry_run, categories=args.category)
        async with scraper:
            res = await scraper.scrape()
            if args.dry_run:
                print(res)
    
    asyncio.run(main())
