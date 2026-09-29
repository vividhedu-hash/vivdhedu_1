"""
College Placement Scraper — Scrapes official placement stats from top colleges.
"""
import argparse
import asyncio
import logging
import re
import io
from typing import List
from bs4 import BeautifulSoup
from pdfminer.high_level import extract_text

from .base_scraper import BaseScraper, ScrapeResult

logger = logging.getLogger(__name__)

COLLEGES = {
    "IIT Bombay": "https://www.iitb.ac.in/placements/placement-statistics",
    "IIT Delhi": "https://careers.iitd.ac.in/statistics",
    "IIT Madras": "https://placement.iitm.ac.in/statistics",
    "NIT Trichy": "https://www.nitt.edu/home/academics/placements/placement-statistics.html",
    "BITS Pilani": "https://www.bits-pilani.ac.in/pilani/career-development-centre",
    "IIM Ahmedabad": "https://www.iima.ac.in/placements",
    "AIIMS Delhi": "https://www.aiims.edu"
}

class CollegePlacementScraper(BaseScraper):
    SOURCE_NAME = "college_placement"
    REQUEST_DELAY = 1.0

    def __init__(self, db, run_id: str, settings=None, dry_run: bool = False, college: str = None):
        super().__init__(db, run_id, settings)
        self.dry_run = dry_run
        self.college = college

    async def scrape(self) -> List[ScrapeResult]:
        results = []
        
        targets = {k: v for k, v in COLLEGES.items() if not self.college or k == self.college}
        
        for name, url in targets.items():
            logger.info(f"Scraping {name} placement: {url}")
            try:
                resp = await self.get(url)
                text = ""
                if resp.headers.get("content-type", "").startswith("application/pdf") or url.endswith(".pdf"):
                    text = extract_text(io.BytesIO(resp.content))
                else:
                    soup = BeautifulSoup(resp.text, 'html.parser')
                    text = soup.get_text()

                # Real extraction, not a simulation — the comment used to say
                # "Basic parsing simulation", which was both inaccurate and a
                # licence for the constant that used to sit below it. This
                # branch has always been conditional: it emits only when the
                # document actually states a highest package, and emits
                # nothing otherwise. That is the standard the NIRF branch
                # below now meets too.
                highest_matches = re.findall(r'highest(?: salary| package)?.*?([\d,]+(?:?:\.\d+)?)\s*(?:LPA|lakhs?)', text, re.I)
                if highest_matches:
                    val = float(highest_matches[0].replace(',', ''))
                    results.append(ScrapeResult(
                        program_id=name.lower().replace(" ", "_"),
                        field_name="official_highest_salary",
                        raw_value=str(val),
                        parsed_value=val,
                        unit="LPA",
                        source_url=url,
                    ))
                    
            except Exception as e:
                logger.error(f"Error parsing college {name}: {e}")
                
        # NIRF placement data
        #
        # REMOVED: an unconditional `ScrapeResult(field_name="official_placement_rate",
        # parsed_value=85.0, unit="percent", source_url=nirf_url)` under the
        # comment "Simulated NIRF parsing".
        #
        # It was appended unconditionally, so a run that downloaded the NIRF
        # PDF successfully and one that was served an error page both produced
        # exactly 85.0%, attributed to a real nirfindia.org URL. The document
        # was never parsed. A placement rate is a claim about where a real
        # institution's graduates actually went, and it feeds the composite
        # score and the risk surface on the programme page — so this constant
        # was not inert decoration, it was a fabricated input to the product's
        # central output, published under a Government of India initiative's
        # domain.
        #
        # The replacement extracts the rate from the document. A rate is only
        # emitted when a number and a context word appear together, so a PDF
        # that fails to parse produces no row instead of a remembered one.
        nirf_url = "https://nirfindia.org/nirfpdfcdn/2024/pdf/Engineering.pdf"
        try:
            logger.info(f"Scraping NIRF data: {nirf_url}")
            resp = await self.get(nirf_url)
            text = extract_text(io.BytesIO(resp.content))

            for result in self._extract_placement_rates(text, nirf_url):
                results.append(result)

        except Exception as e:
            logger.error(f"Error parsing NIRF data: {e}")

        return results

    # A placement percentage must appear next to a word that says what the
    # number is. Matching a bare number in a multi-hundred-page document
    # returns whichever integer pdfminer reads first, which for this file is
    # a page number or a student count.
    #
    # Two orders, because both occur in published reports:
    #   "92.5% of students were placed"   (number first)
    #   "students placed: 92.5%"          (number last)
    _PLACEMENT_AFTER = re.compile(
        r"(?:placed|placement(?:\s+rate)?|placed\s+students?|"
        r"students?\s+placed|offered\s+employment)"
        r"[^0-9%]{0,80}?(\d{1,3}(?:\.\d+)?)\s*(?:%|per\s*cent)",
        re.I,
    )
    PLACEMENT_CONTEXT = re.compile(
        r"(\d{1,3}(?:\.\d+)?)\s*(?:%|per\s*cent)\s+of\s+[^.]{0,60}?"
        r"(?:placed|placement|employed|received\s+an?\s+offer)",
        re.I,
    )

    def _extract_placement_rates(self, text: str, source_url: str) -> List[ScrapeResult]:
        """
        Emit one row per placement rate actually stated in `text`.

        Returns an empty list — not a guess — when the document contains no
        figure matching a placement phrase. That empty list is what makes the
        difference between a scraper and a constant: the caller can be told
        "this source yielded nothing" instead of being handed 85.0%.
        """
        if not text:
            return []

        out: List[ScrapeResult] = []
        # One row per distinct rate; a report quotes the same figure in a
        # summary and in a table and both are the same measurement.
        seen = set()
        for pattern in (self._PLACEMENT_AFTER, self.PLACEMENT_CONTEXT):
            for match in pattern.finditer(text):
                try:
                    value = float(match.group(1))
                except (TypeError, ValueError):
                    continue
                # A rate is a share of a cohort. Anything outside 0-100 is a
                # count, a rank, or a parse artefact.
                if not 0.0 <= value <= 100.0:
                    logger.warning("Rejected out-of-range placement reading: %r", match.group(1))
                    continue
                if value in seen:
                    continue
                seen.add(value)
                out.append(ScrapeResult(
                    program_id="nirf_engineering",
                    field_name="official_placement_rate",
                    raw_value=str(value),
                    parsed_value=value,
                    unit="percent",
                    source_url=source_url,
                    metadata={
                        "source_name": self.SOURCE_NAME,
                        "extracted_from": "nirf_pdf",
                    },
                ))

        if not out:
            logger.warning(
                "No placement rate could be read from %s. Emitting none — the "
                "previous implementation returned 85.0%% unconditionally, "
                "which was a constant, not a measurement.",
                source_url,
            )
        return out

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--college", type=str)
    args = parser.parse_args()
    
    async def main():
        logging.basicConfig(level=logging.INFO)
        scraper = CollegePlacementScraper(db=None, run_id="manual", dry_run=args.dry_run, college=args.college)
        async with scraper:
            res = await scraper.scrape()
            if args.dry_run:
                print(res)
    
    asyncio.run(main())
