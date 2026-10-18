"""Parser and persistence-mapping tests for the scraper package.

Network is not required. These lock in the defects that made a successful
HTTP fetch still ingest nothing.
"""
from scrapers.base_scraper import ScrapeResult, macro_field_key
from scrapers.nirf_scraper import NIRFScraper
from scrapers.payscale_scraper import _salary_from_jsonld
from scrapers.college_placement_scraper import CollegePlacementScraper


WIKI_HTML = """
<html><body>
<h3><span class="mw-headline" id="Engineering">Engineering (Top 10)</span>
<span class="mw-editsection">[edit]</span></h3>
<table class="wikitable">
<tr><th>Rank</th><th>Name</th><th>City</th><th>State</th></tr>
<tr><td>1</td><td>IIT Madras</td><td>Chennai</td><td>Tamil Nadu</td></tr>
<tr><td>2</td><td>IIT Delhi</td><td>Delhi</td><td>Delhi</td></tr>
</table>
<h3><span class="mw-headline">Law (Top 10)</span><span>[edit]</span></h3>
<table class="wikitable">
<tr><th>Rank</th><th>Name</th><th>City</th></tr>
<tr><td>1</td><td>National Law School of India University</td><td>Bengaluru</td></tr>
</table>
</body></html>
"""


class TestMacroFieldKey:
    def test_role_distinguishes_current_rows(self):
        a = ScrapeResult(
            program_id=None, field_name="payscale_median_salary_inr",
            raw_value="1", parsed_value=1, unit="INR", source_url="x",
            metadata={"role": "Software_Engineer"},
        )
        b = ScrapeResult(
            program_id=None, field_name="payscale_median_salary_inr",
            raw_value="2", parsed_value=2, unit="INR", source_url="x",
            metadata={"role": "Lawyer"},
        )
        assert macro_field_key(a) != macro_field_key(b)
        assert len(macro_field_key(a)) <= 64

    def test_worldbank_stays_bare_field_name(self):
        r = ScrapeResult(
            program_id="india_macro", field_name="ppp_factor",
            raw_value="20", parsed_value=20, unit="lcu_per_usd", source_url="x",
        )
        assert macro_field_key(r) == "ppp_factor"


class TestNirfWikipediaParser:
    def test_headings_with_edit_suffix_still_parse(self):
        rows = NIRFScraper(db=None, run_id="t")._parse_wikipedia(WIKI_HTML)
        cats = {r["category"] for r in rows}
        names = {r["name"] for r in rows}
        assert "engineering" in cats
        assert "law" in cats
        assert "IIT Madras" in names
        assert len(rows) == 3


class TestPayscaleJsonLd:
    def test_occupation_distribution(self):
        node = {
            "@type": "Occupation",
            "estimatedSalary": {
                "@type": "MonetaryAmountDistribution",
                "median": 900000,
                "percentile25": 600000,
                "percentile75": 1400000,
            },
        }
        out = _salary_from_jsonld(node)
        assert out["median"] == 900000
        assert out["p25"] == 600000
        assert out["p75"] == 1400000


class TestCollegePlacementRegex:
    def test_median_and_average_from_report_prose(self):
        text = (
            "Average annual CTC Salary Package of students INR 23.50 LPA. "
            "Median Salary INR 17.92 LPA. Highest package 1.20 crore."
        )
        scraper = CollegePlacementScraper(db=None, run_id="t")
        rows = scraper._extract_salary_stats(text, "https://example.test/report.pdf", "IIT Bombay")
        by_field = {r.field_name: r.parsed_value for r in rows}
        assert by_field["official_average_salary"] == 23.5
        assert by_field["official_median_salary"] == 17.92

    def test_broken_highest_regex_no_longer_requires_literal_colon(self):
        text = "The highest package offered was 54.5 LPA this year."
        scraper = CollegePlacementScraper(db=None, run_id="t")
        rows = scraper._extract_salary_stats(text, "u", "X")
        assert any(r.field_name == "official_highest_salary" and r.parsed_value == 54.5 for r in rows)


class TestOrchestratorRegistry:
    def test_crawl4ai_key_matches_api_registry(self):
        from pathlib import Path

        backend = Path(__file__).resolve().parent.parent
        jobs = (backend / "api" / "scraper_jobs.py").read_text(encoding="utf-8")
        runner = (backend / "scripts" / "run_scrapers.py").read_text(encoding="utf-8")
        assert '"crawl4ai":' in jobs
        assert 'Source("crawl4ai"' in runner
        assert 'Source("firecrawl"' not in runner
        assert 'needs=("JINA_API_KEY"' not in runner
        assert 'needs=("FIRECRAWL_API_KEY"' not in runner

    def test_skipped_is_not_a_scrape_status(self):
        from pathlib import Path
        src = (Path(__file__).resolve().parent.parent / "scripts" / "run_scrapers.py").read_text(
            encoding="utf-8"
        )
        assert '_close_run(db, run_id, "skipped"' not in src
