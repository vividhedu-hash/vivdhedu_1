import argparse
import asyncio
import io
import logging
import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime

from .base_scraper import BaseScraper, ScrapeResult

logger = logging.getLogger(__name__)


class ScrapeFailedWithReason(RuntimeError):
    """
    An explicit, recorded failure — not a fallback.

    Distinct from `ScrapeYieldedNothing`, which means "the run completed and
    legitimately found nothing". This one carries a specific, loggable reason
    for why the source produced no data, so an operator reading the run log can
    tell a broken scraper from an exhausted one. Both end up as a `failed` run
    via the `except Exception` in `BaseScraper.run()`; this one explains
    itself in the `error_message` column.
    """


class PLFSScraper(BaseScraper):
    """
    PLFS (Periodic Labour Force Survey) Data Ingester.
    Data is published at: https://mospi.gov.in/web/plfs
    This is free government data.
    """

    SOURCE_NAME = "plfs"
    BASE_URL = "https://mospi.gov.in/sites/default/files/publication_reports/PLFS_Annual_Report"

    # Map PLFS education levels to our degree fields
    DEGREE_MAPPING = {
        'Graduate & above': ['engineering-cs', 'management', 'medicine', 'law'],
        'Higher Secondary': ['commerce', 'social-sciences'],
        'Secondary': ['arts', 'pure-sciences'],
    }

    # PLFS reports its headline indicators as LFPR / WPR / UR, and the annual
    # report prints them as whole-number percentages in narrative tables and as
    # strings like "45.2" in the data tables. Both forms are accepted; anything
    # that is not a bare number in a plausible 0-100 range is rejected rather
    # than coerced, because a mis-parsed cell is a fabricated number with a
    # government URL attached to it.
    METRIC_PATTERNS: Dict[str, re.Pattern] = {
        'lfpr': re.compile(r'\bLFPR\b[^0-9%]{0,40}?(\d{1,3}(?:\.\d+)?)\s*%?', re.I),
        'wpr': re.compile(r'\bWPR\b[^0-9%]{0,40}?(\d{1,3}(?:\.\d+)?)\s*%?', re.I),
        'ur': re.compile(r'\bUR\b[^0-9%]{0,40}?(\d{1,3}(?:\.\d+)?)\s*%?', re.I),
    }

    def _valid_percent(self, raw: str) -> Optional[float]:
        """
        Return `raw` as a percentage, or None if it cannot be one.

        PLFS rates are shares of a population, so anything outside 0-100 is a
        parse error — a year, a page number, or a decimal that lost its point
        to the PDF's column layout. Rejecting is the whole point: the previous
        behaviour for an unparseable document was to substitute a hardcoded
        table, so there was no state in which a bad read turned into a refusal.
        """
        try:
            value = float(raw)
        except (TypeError, ValueError):
            return None
        if not 0.0 <= value <= 100.0:
            logger.warning("Rejected out-of-range PLFS reading: %r", raw)
            return None
        return value

    def parse_labour_force_table(self, text: str) -> Dict[str, Dict[str, float]]:
        """
        Extract per-education-level LFPR / WPR / UR from the report text.

        Returns a mapping keyed by the education-level labels in
        DEGREE_MAPPING. A level is included ONLY if all three of its metrics
        were found and validated. Partial rows are dropped rather than
        completed: emitting a level with one real metric and two absent ones
        would be a row the schema reads as fully measured.

        ROW ISOLATION
        -------------
        Matching the level label and then reading the next N characters looks
        reasonable and is wrong, because "Secondary" is a substring of "Higher
        Secondary". A first attempt at this did exactly that and returned
        Higher Secondary's own figures as Secondary's, with no error and no
        warning — a plausible-looking, completely fabricated number, which is
        the specific failure this rewrite exists to prevent.

        So every level label is located first, all of them, and the text
        between consecutive labels is what gets parsed. Each label's window
        ends where the next one begins, so no row can read another's metrics.
        A window that is empty, or that is only a heading with no metrics in
        it, yields no row.
        """
        if not text:
            return {}

        # 1. Locate every label, longest-first so "Higher Secondary" is
        #    registered before the "Secondary" that would otherwise claim it.
        #    `(?<![A-Za-z])` stops a match inside a longer word; the negative
        #    lookahead and the overlap guard below stop one inside another
        #    label.
        located: List[Tuple[int, int, str]] = []  # (start, end, level)
        for edu_level in self.DEGREE_MAPPING:
            words = [re.escape(w) for w in edu_level.split()]
            pattern = r"(?<![A-Za-z])" + r"\s+".join(words) + r"(?![a-z])"
            for m in re.finditer(pattern, text, re.I):
                # Skip a label that sits entirely inside one already claimed.
                if any(start <= m.start() and m.end() <= end for start, end, _ in located):
                    continue
                located.append((m.start(), m.end(), edu_level))

        located.sort(key=lambda item: item[0])
        if not located:
            return {}

        # 2. Bound each row by the next label, and only accept a row whose
        #    level has not been seen already (first occurrence wins).
        parsed: Dict[str, Dict[str, float]] = {}
        for i, (start, end, edu_level) in enumerate(located):
            if edu_level in parsed:
                continue
            stop = located[i + 1][0] if i + 1 < len(located) else min(len(text), end + 400)
            window = text[end:stop]

            metrics: Dict[str, float] = {}
            for name, metric_re in self.METRIC_PATTERNS.items():
                found = metric_re.search(window)
                if not found:
                    continue
                value = self._valid_percent(found.group(1))
                if value is None:
                    continue
                metrics[name] = value

            if len(metrics) == len(self.METRIC_PATTERNS):
                parsed[edu_level] = metrics
            else:
                logger.warning(
                    "Dropping PLFS row %r — parsed %d of %d metrics (%s). "
                    "A partial row would read as fully measured.",
                    edu_level, len(metrics), len(self.METRIC_PATTERNS),
                    ", ".join(sorted(metrics)) or "none",
                )
        return parsed

    async def fetch_latest_pdf_url(self) -> str:
        """
        Attempt to check if the latest Annual Report PDF exists.
        Since PDFs change URL annually, this guesses the URL for the current/previous year.

        A returned URL is a claim that the document is there. This method
        verifies it with a real request, so an empty string here means "not
        found" rather than "not checked" — which is what the caller needs in
        order to decide between parsing and failing.
        """
        current_year = datetime.now().year
        year_str = f"{current_year - 1}-{str(current_year)[-2:]}"
        url = f"{self.BASE_URL}_{year_str}.pdf"
        try:
            logger.info(f"Checking for latest PLFS PDF at {url}")
            response = await self.get(url)
            if response.status_code == 200:
                logger.info(f"Successfully found latest PLFS PDF at {url}")
                return url
            logger.info(
                f"PLFS annual report not at {url} (HTTP {response.status_code}). "
                f"MoSPI moves these files between publication cycles."
            )
        except Exception as e:
            logger.warning(f"Could not fetch latest PLFS PDF for {year_str}: {e}")
        return ""

    async def scrape(self) -> List[ScrapeResult]:
        """
        Scrape PLFS employment data from the published Annual Report.

        Returns ZERO rows when the document cannot be fetched or parsed, and
        that zero is deliberate: `BaseScraper.run()` converts an empty result
        into `ScrapeYieldedNothing` and records the run as `failed`.

        WHY THIS IS A FAILURE AND NOT A FALLBACK
        -----------------------------------------
        This method previously defined `FALLBACK_DATA_2022_23`, a literal dict
        of LFPR/WPR/UR figures, and returned 33 rows built from it on every
        run. `scrape()` located the PDF, logged "Parsing logic would go here.
        Falling back to pre-extracted data", and then set `source_url` to
        "https://mospi.gov.in/web/plfs" — a real MoSPI page that the scraper
        never read a single byte from.

        The result was 33 labour-market statistics in the database attributing
        themselves to the Government of India, with numbers that no one in this
        codebase obtained from a document. Worse, the run was reported as
        `success`, and `records_scraped` was 33, so the pipeline dashboard
        showed a healthy scraper that had in fact invented its entire output.

        The constants are deleted rather than moved behind a flag. An opt-in
        `USE_STALE_REFERENCE_DATA=1` would be one env var away from being
        turned on by accident, and the resulting rows would be indistinguishable
        in the database from real ones. The figures may well be correct — they
        are published numbers — but this scraper cannot cite what it cannot
        read, and a correct number with a fabricated provenance is still a
        fabricated number.

        TO RESTORE REAL INGESTION: MoSPI's PLFS landing page renders its PDF
        links client-side, so they are not present in the HTML this scraper
        can fetch, and the annual filename pattern above does not resolve. A
        working implementation needs either a stable publication URL or a
        headless-browser fetch of the landing page. Until one of those exists,
        this source correctly reports that it has no data.
        """
        results: List[ScrapeResult] = []

        latest_pdf_url = await self.fetch_latest_pdf_url()
        if not latest_pdf_url:
            raise ScrapeFailedWithReason(
                f"[{self.SOURCE_NAME}] Could not locate the PLFS Annual Report PDF. "
                f"MoSPI renders publication links client-side, so the URL cannot be "
                f"discovered from the public page, and the conventional annual "
                f"filename under {self.BASE_URL} did not resolve. Returning zero "
                f"rows rather than the previous hardcoded reference table, which "
                f"was attributed to a MoSPI URL this scraper never read."
            )

        try:
            from pdfminer.high_level import extract_text

            resp = await self.get(latest_pdf_url)
            text = extract_text(io.BytesIO(resp.content))
        except Exception as e:
            raise ScrapeFailedWithReason(
                f"[{self.SOURCE_NAME}] Found the annual report at {latest_pdf_url} "
                f"but could not extract its text: {e}. No figures are emitted."
            ) from e

        parsed = self.parse_labour_force_table(text or "")
        if not parsed:
            raise ScrapeFailedWithReason(
                f"[{self.SOURCE_NAME}] Downloaded {latest_pdf_url} but no education "
                f"level yielded a complete LFPR/WPR/UR triple. The report layout has "
                f"probably changed. Emitting nothing: an unparsed labour statistic is "
                f"not a reason to publish a remembered one."
            )

        for edu_level, metrics in parsed.items():
            for program in self.DEGREE_MAPPING.get(edu_level, []):
                for metric_name, value in metrics.items():
                    results.append(ScrapeResult(
                        program_id=program,
                        field_name=metric_name,
                        raw_value=str(value),
                        parsed_value=value,
                        unit="pct",
                        # Sourced from the document that was actually downloaded
                        # and parsed, which is the only URL this row can cite.
                        source_url=latest_pdf_url,
                        metadata={
                            'source_name': self.SOURCE_NAME,
                            'education_level': edu_level,
                            'status': 'usual_status',
                            'extracted_from': 'annual_report_pdf',
                        }
                    ))

        logger.info(
            f"[{self.SOURCE_NAME}] Extracted {len(parsed)} education levels from "
            f"{latest_pdf_url}, producing {len(results)} rows."
        )
        return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PLFS Data Scraper")
    parser.add_argument("--dry-run", action="store_true", help="Print results instead of saving to DB")
    args = parser.parse_args()

    async def main():
        if args.dry_run:
            logging.basicConfig(level=logging.INFO)
            logger.info("Starting PLFS Scraper in dry-run mode...")
            async with PLFSScraper(db=None, run_id="dry_run") as scraper:
                try:
                    results = await scraper.scrape()
                except ScrapeFailedWithReason as e:
                    # Printed, not raised, so `--dry-run` reports the failure
                    # instead of dumping a traceback at an operator.
                    logger.error("%s", e)
                    print(f"SCRAPE FAILED: {e}")
                    print("0 rows. No fallback table exists by design.")
                    return
                for result in results:
                    print(result)
        else:
            print("Please run this scraper through the main Airflow pipeline or specify --dry-run")

    asyncio.run(main())
