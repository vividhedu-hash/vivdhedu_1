"""
Data-integrity regression tests.

These lock in fixes for defects that made the product report numbers it had no
data for, and that broke the scraper pipeline outright:

1.  `compute_roi` defaulted missing fee/placement to ₹10L and 65%, so the 19
    colleges with no scraped data were scored (e.g. "IIM Bangalore — 302% ROI",
    labelled "verified") from invented inputs.
2.  `BaseScraper.update_run_status` bound `:status` as both the `scrape_status`
    enum and a text comparison, so asyncpg raised AmbiguousParameterError and
    EVERY scraper run failed at its first status write.
3.  `scripts/compute_roi.py` wrote fabricated sub-scores (0.35/0.70/0.75/0.80)
    when the model returned nothing.
"""
from pathlib import Path
import re

import pytest

from ml.roi_computer import compute_roi

REPO_BACKEND = Path(__file__).resolve().parent.parent

# Column -> Postgres enum type, from db/schema.sql. Used to tell a genuine
# enum/text param clash from a harmless single-use param.
ENUM_COLUMNS = {
    "status": "scrape_status",  # scrape_runs.status
}


def _iter_sql_literals(source: str):
    """
    Yield every multi-line string literal in a module.

    Uses ast rather than a regex: a regex that pairs an opening triple-quote
    with the *next* quote character happily mis-slices real code, and a guard
    test that silently inspects the wrong string is worse than no guard at all.
    """
    import ast

    try:
        tree = ast.parse(source)
    except SyntaxError:
        return
    for node in ast.walk(tree):
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            if "\n" in node.value and ":" in node.value:
                yield node.value

TRAJECTORY = {
    1: {"p25": 400000.0, "p50": 800000.0, "p75": 1400000.0},
    5: {"p25": 900000.0, "p50": 2400000.0, "p75": 5000000.0},
}

BASE_PROGRAM = {
    "name": "IIT Bombay",
    "degree_field": "engineering-cs",
    "tier": "1",
    "college_type": "public",
    "state": "Maharashtra",
    "nirf_rank": 1,
}


class TestRoiRefusesToFabricate:
    """ROI must be withheld, never invented, when source data is missing."""

    def test_missing_cost_and_placement_yields_no_score(self):
        result = compute_roi(dict(BASE_PROGRAM), TRAJECTORY)

        assert result["data_complete"] is False
        assert result["composite_score"] is None
        assert result["financial_roi_pct"] is None
        assert result["irr_pct"] is None
        assert result["monte_carlo_analytics"] is None
        assert "total_cost_of_degree_inr" in result["data_issues"]
        assert "placement_rate_pct" in result["data_issues"]

    def test_missing_only_cost_is_still_withheld(self):
        program = dict(BASE_PROGRAM, placement_rate_pct=0.98)
        result = compute_roi(program, TRAJECTORY)

        assert result["data_complete"] is False
        assert result["financial_roi_pct"] is None
        assert result["data_issues"] == ["total_cost_of_degree_inr"]

    def test_missing_only_placement_is_still_withheld(self):
        program = dict(BASE_PROGRAM, total_cost_of_degree_inr=1_800_000.0)
        result = compute_roi(program, TRAJECTORY)

        assert result["data_complete"] is False
        assert result["financial_roi_pct"] is None
        assert result["data_issues"] == ["placement_rate_pct"]

    def test_zero_cost_is_rejected_not_treated_as_free(self):
        """A 0 fee would make ROI infinite — it means 'unknown', not 'free'."""
        program = dict(
            BASE_PROGRAM, total_cost_of_degree_inr=0, placement_rate_pct=0.98
        )
        result = compute_roi(program, TRAJECTORY)

        assert result["data_complete"] is False

    def test_real_data_produces_a_score(self):
        program = dict(
            BASE_PROGRAM,
            total_cost_of_degree_inr=1_800_000.0,
            placement_rate_pct=0.98,
        )
        result = compute_roi(program, TRAJECTORY)

        assert result["data_complete"] is True
        assert result["data_issues"] == []
        assert isinstance(result["composite_score"], (int, float))
        assert result["financial_roi_pct"] is not None

    def test_cheaper_program_ranks_better_than_costlier_one(self):
        """Sanity check that cost genuinely drives the result."""
        cheap = dict(
            BASE_PROGRAM,
            name="cheap",
            total_cost_of_degree_inr=800_000.0,
            placement_rate_pct=0.90,
        )
        pricey = dict(
            BASE_PROGRAM,
            name="pricey",
            total_cost_of_degree_inr=3_000_000.0,
            placement_rate_pct=0.90,
        )
        assert (
            compute_roi(cheap, TRAJECTORY)["financial_roi_pct"]
            > compute_roi(pricey, TRAJECTORY)["financial_roi_pct"]
        )


class TestScraperStatusWrite:
    """The enum/text param clash that made every scraper run fail."""

    def test_status_param_is_cast_and_not_reused_raw(self):
        source = (REPO_BACKEND / "scrapers" / "base_scraper.py").read_text()
        match = re.search(
            r"async def update_run_status.*?await self\.db\.commit\(\)",
            source,
            re.S,
        )
        assert match, "update_run_status not found"
        body = match.group(0)

        # `status = :status` binds an enum while `... != 'running'` binds text.
        assert "status = CAST(:status AS scrape_status)" in body
        assert "CAST(:status AS text) != 'running'" in body
        assert "status = :status," not in body

    def test_no_ambiguous_status_binding_elsewhere(self):
        """
        Guard the same mistake in any other status write.

        Scans the whole backend, not just scrapers/. `api/routers/scrape.py`
        (PATCH /api/scrape/{run_id}) carried the identical bug — `:status` in
        both the enum assignment and a text IN-list — and was missed because
        this test only walked the scrapers package. It broke that endpoint on
        every call; verified live as
        `42804: column "status" is of type scrape_status but expression is of
        type text`.

        Only flags params used in BOTH an enum assignment and a text
        comparison/IN-list within one statement. A param that appears once
        (e.g. admin.py's `WHERE a.status = :status` against the anomaly_status
        enum) is inferred cleanly and is not a defect.
        """
        offenders = []
        for path in REPO_BACKEND.rglob("*.py"):
            if "__pycache__" in path.parts or ".venv" in path.parts:
                continue
            if path.resolve() == Path(__file__).resolve():
                continue
            source = path.read_text()
            for stmt in _iter_sql_literals(source):
                for assign in re.finditer(r"\bstatus\s*=\s*:(\w+)", stmt):
                    param = assign.group(1)
                    # A second, text-typed use of the SAME param elsewhere in
                    # this statement. The assignment itself doesn't count, so
                    # drop it before searching.
                    without_assignment = stmt.replace(assign.group(0), " ")
                    reused = re.search(
                        rf":{param}\b\s*(?:=|<>|!=)|"
                        rf"(?:=|!=|<>)\s*:{param}\b|"
                        rf"\bIN\b[^;]*:{param}\b|"
                        rf"CASE\s+WHEN\s+:{param}\b",
                        without_assignment,
                    )
                    if not reused:
                        continue  # single use — inferred cleanly, not a defect
                    if f"CAST(:{param} AS text)" in stmt:
                        continue  # disambiguated already
                    # An explicit cast on the assignment side also resolves it.
                    enum_type = ENUM_COLUMNS.get(param)
                    if enum_type and f"CAST(:{param} AS {enum_type})" in stmt:
                        continue
                    offenders.append(f"{path.relative_to(REPO_BACKEND)}: :{param}")
        assert not offenders, f"ambiguous status binding: {offenders}"


class TestRoiScriptDoesNotInventSubscores:
    def test_script_skips_incomplete_programs(self):
        source = (REPO_BACKEND / "scripts" / "compute_roi.py").read_text()
        assert 'if not scores.get("data_complete")' in source
        # The old fallbacks wrote a score for every program regardless.
        assert 'scores.get("financial_roi_pct", 0.0)' not in source
        assert 'scores.get("risk_score", 0.35)' not in source


class TestSilentZeroRecordRuns:
    """A run that ingests nothing must not be reported as `success`."""

    def test_zero_results_raises(self):
        from scrapers.base_scraper import BaseScraper, ScrapeYieldedNothing

        source = (REPO_BACKEND / "scrapers" / "base_scraper.py").read_text()
        run_src = re.search(r"async def run\(self\).*", source, re.S).group(0)
        assert "ScrapeYieldedNothing" in run_src
        assert ScrapeYieldedNothing is not None
        assert issubclass(ScrapeYieldedNothing, RuntimeError)

    def test_zero_persisted_also_raises(self):
        source = (REPO_BACKEND / "scrapers" / "base_scraper.py").read_text()
        run_src = re.search(r"async def run\(self\).*", source, re.S).group(0)
        assert "records_scraped == 0" in run_src

    def test_scrape_status_write_succeeds_on_live_enum(self):
        """The CAST fix must not be reverted; see TestScraperStatusWrite."""
        from scrapers.base_scraper import BaseScraper

        src = (REPO_BACKEND / "scrapers" / "base_scraper.py").read_text()
        assert "CAST(:status AS scrape_status)" in src
        assert BaseScraper is not None


class TestDecimalSafety:
    """NUMERIC columns arrive as Decimal; arithmetic on them 503'd the API."""

    def test_no_bare_decimal_division_in_colleges_router(self):
        src = (REPO_BACKEND / "api" / "routers" / "colleges.py").read_text()
        # `row.get("placement_rate_pct") or 0) / 100.0` crashed on Decimal.
        assert '(row.get("placement_rate_pct") or 0) / 100.0' not in src
        assert '(row.get("median_salary_inr") or 0) / 2_500_000.0' not in src

    def test_icri_entry_coerces_to_float(self):
        src = (REPO_BACKEND / "api" / "routers" / "colleges.py").read_text()
        assert 'float(row["placement_rate_pct"])' in src
        assert "median_salary = float(" in src


class TestScrapeRouteShadowing:
    """`/{run_id}` must not swallow literal paths declared after it."""

    def test_sources_route_precedes_parameterised_route(self):
        src = (REPO_BACKEND / "api" / "routers" / "scrape.py").read_text()
        assert src.index('@router.get("/sources")') < src.index(
            '@router.get("/{run_id}")'
        ), "declare /sources before /{run_id} or it is unreachable"

    def test_run_id_is_uuid_typed(self):
        src = (REPO_BACKEND / "api" / "routers" / "scrape.py").read_text()
        # A str path param sent 'sources' to Postgres as a UUID and 500'd.
        assert "async def get_scrape_run(run_id: UUID" in src
        assert "async def update_scrape_run(\n    run_id: UUID" in src


class TestDeclaredDependencies:
    """Undeclared imports made whole routers vanish at boot with only a warning."""

    @pytest.mark.parametrize(
        "module", ["jwt", "email_validator", "bs4", "pdfminer"]
    )
    def test_importable_dependency_is_declared(self, module):
        import importlib.util

        assert importlib.util.find_spec(module) is not None, (
            f"{module} is imported by the backend but not installed; "
            f"declare it in requirements.txt"
        )

    def test_requirements_declare_the_imported_cryptos(self):
        reqs = (REPO_BACKEND / "requirements.txt").read_text()
        assert "PyJWT" in reqs
        assert "beautifulsoup4" in reqs
        assert "pdfminer" in reqs
        assert "email-validator" in reqs
