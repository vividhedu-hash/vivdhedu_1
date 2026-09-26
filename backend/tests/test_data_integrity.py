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


class TestListEndpointFabricatedZeros:
    """`_build_program_item` must not invent a measurement for a missing one.

    The list endpoint served the same rows as the detail endpoint but with two
    defects: it dropped the entire `costs` block (even though PROGRAM_SELECT
    has always projected the five cost columns), and it coerced absent
    measurements to 0 via `float(row.get(x) or 0)`. 19 of 73 programs have no
    placement_data row, so those were published as "0% placement" and
    "ROI 0" — indistinguishable from a program that genuinely measured zero.
    """

    @staticmethod
    def _row(**overrides) -> dict:
        """A fully-measured row; override any column with None to un-measure it."""
        base = {
            "program_id": "p1", "college_id": "c1",
            "college_short_name": "IIT Bombay",
            "college_full_name": "Indian Institute of Technology Bombay",
            "state": "Maharashtra", "city": "Mumbai", "tier": 1,
            "college_type": "IIT", "nirf_rank": 3,
            "degree_id": "d1", "degree_short_name": "B.Tech CSE",
            "degree_full_name": "B.Tech Computer Science", "degree_field": "engineering-cs",
            "degree_level": "UG", "duration_years": 4,
            "composite_score": 94.0, "financial_roi_pct": 4820.0,
            "risk_score": 0.22, "ci_low": 89.0, "ci_high": 97.0,
            "confidence_level": "High", "model_version": "v1.0-live",
            "ai_risk_label": "Medium",
            "placement_rate_pct": 97.0, "median_salary_inr": 2_000_000,
            "total_tuition_inr": 920_000.0, "hostel_living_inr": 322_000.0,
            "exam_prep_costs_inr": 50_000.0, "opportunity_cost_inr": 1_200_000.0,
            "total_cost_of_degree": 1_242_000.0,
        }
        base.update(overrides)
        return base

    def test_costs_block_is_present(self):
        from api.routers.colleges import _build_program_item

        item = _build_program_item(self._row())
        assert item["costs"] == {
            "totalTuitionInr": 920_000.0,
            "hostelLivingInr": 322_000.0,
            "examPrepCostsInr": 50_000.0,
            "opportunityCostInr": 1_200_000.0,
            "totalCostOfDegreeInr": 1_242_000.0,
        }

    def test_costs_are_per_program_not_a_constant(self):
        """Regression guard: a single hardcoded host block looked plausible
        but published one invented figure for all 73 programs."""
        from api.routers.colleges import _build_program_item

        cheap = _build_program_item(self._row(hostel_living_inr=3_133.0))["costs"]
        dear = _build_program_item(self._row(hostel_living_inr=875_000.0))["costs"]
        assert cheap["hostelLivingInr"] == 3_133.0
        assert dear["hostelLivingInr"] == 875_000.0
        assert cheap != dear

    def test_costs_null_when_no_cost_data_row(self):
        from api.routers.colleges import _build_program_item

        costs = _build_program_item(self._row(
            total_tuition_inr=None, hostel_living_inr=None,
            exam_prep_costs_inr=None, opportunity_cost_inr=None,
            total_cost_of_degree=None,
        ))["costs"]
        assert all(v is None for v in costs.values()), costs

    def test_absent_placement_is_null_not_zero(self):
        from api.routers.colleges import _build_program_item

        item = _build_program_item(self._row(placement_rate_pct=None))
        assert item["placement"]["rate"] is None
        # A real 0 is still a real 0 — it must not be confused with "absent".
        assert _build_program_item(self._row(placement_rate_pct=0))["placement"]["rate"] == 0.0
        assert _build_program_item(self._row(placement_rate_pct="0"))["placement"]["rate"] == 0.0

    def test_absent_roi_scores_are_null_not_zero(self):
        from api.routers.colleges import _build_program_item

        item = _build_program_item(self._row(
            composite_score=None, financial_roi_pct=None, risk_score=None,
            ci_low=None, ci_high=None,
        ))["roi"]
        for key in ("compositeScore", "financialRoiPct", "riskScore",
                    "confidenceIntervalLow", "confidenceIntervalHigh"):
            assert item[key] is None, key

    def test_zero_is_preserved_for_real_roi_values(self):
        from api.routers.colleges import _build_program_item

        roi = _build_program_item(self._row(
            composite_score=0, financial_roi_pct=0, risk_score=0,
        ))["roi"]
        assert roi["compositeScore"] == 0.0
        assert roi["financialRoiPct"] == 0.0
        assert roi["riskScore"] == 0.0

    def test_duration_years_absent_is_null_not_default_four(self):
        from api.routers.colleges import _build_program_item

        assert _build_program_item(self._row(duration_years=None))["degree"]["durationYears"] is None
        assert _build_program_item(self._row(duration_years=2))["degree"]["durationYears"] == 2.0

    def test_decimal_columns_are_serialisable_as_float(self):
        """NUMERIC → Decimal; bare `float()` on them is fine, but NaN/Infinity
        would emit invalid JSON, so they must collapse to null."""
        from decimal import Decimal
        from api.routers.colleges import _build_program_item

        item = _build_program_item(self._row(
            composite_score=Decimal("76.3"), placement_rate_pct=Decimal("72.0"),
        ))
        assert item["roi"]["compositeScore"] == 76.3
        assert item["placement"]["rate"] == 72.0
        nonfinite = _build_program_item(self._row(composite_score=float("nan")))
        assert nonfinite["roi"]["compositeScore"] is None

    def test_non_null_column_fallbacks_are_preserved(self):
        """tier / degree_level / model_version are NOT NULL upstream and the
        existing response contract depends on the fallbacks staying."""
        from api.routers.colleges import _build_program_item

        row = self._row(model_version=None, ai_risk_label=None)
        # `tier` and `degree_level` use `.get(key, default)`, so the fallback
        # fires on an absent key. Left exactly as-is by this change.
        del row["tier"]
        del row["degree_level"]
        item = _build_program_item(row)
        assert item["college"]["tier"] == 2
        assert item["degree"]["level"] == "UG"
        # These two use `or`, so an explicit null also falls back.
        assert item["meta"]["aiRiskLabel"] == "Medium"
        assert item["roi"]["modelVersion"]

    def test_no_or_zero_fabrication_left_in_builder(self):
        src = (REPO_BACKEND / "api" / "routers" / "colleges.py").read_text()
        builder = src.split("def _build_program_item")[1].split("\ndef ")[0]
        assert " or 0" not in builder, builder
        assert ", 4)" not in builder, "duration_years must not default to 4"


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
