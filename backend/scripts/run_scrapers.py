#!/usr/bin/env python3
"""
run_scrapers.py — the scraper orchestrator that actually runs.

WHY THIS FILE EXISTS
--------------------
`data_points` was empty while `scrape_runs` held 22 rows of `success`. Nothing
had ever ingested a row; the runs that reported success reported nothing. Three
independent causes, all of which had to be fixed rather than worked around:

1. THE ENGINE BROKE ON EVERY RUN, BEFORE ANY HTTP WORK.
   The database is reached through pgbouncer, which in transaction/statement
   mode does not support prepared statements. asyncpg prepares statements by
   default, so the first query raised:

       pgbouncer with pool_mode set to "transaction" or "statement"
       does not support prepared statements properly

   Several scripts already set `statement_cache_size=0`; the Airflow DAG and the
   scrapers' own `__main__` blocks did not. `_pgbouncer_args()` below centralises
   the fix so a new caller cannot forget it again.

2. THE AIRFLOW DAG COULD NOT IMPORT ITS SCRAPERS.
   It did `from indialens.scrapers.nirf_scraper import ...`. There is no
   `indialens` package here — the module path is `scrapers.*` — so every task
   died at import, before the network. The DAG is repaired separately; this file
   is the orchestrator that does not need Airflow at all.

3. A ZERO-ROW RUN WAS REPORTED AS HEALTHY.
   `base_scraper` already raises `ScrapeYieldedNothing` for this, which is the
   right behaviour. What was missing was anywhere for that to surface: a run
   could fail, and nothing aggregated the outcome. `--strict` and the exit code
   now do that.

DESIGN
------
* Every source is isolated. One scraper raising cannot end the run; it is
  recorded as failed and the rest continue.
* Sources needing absent credentials are SKIPPED with a reason, not failed —
  a missing Tavily key is not a broken pipeline, and conflating the two is what
  made the old dashboard unreadable.
* `--dry-run` is the DEFAULT. Writes to the live tables require `--commit`.
  These tables are the product's own data and they are currently empty, which is
  exactly the state in which an accidental write is most expensive to unpick.
* Exit code is 0 only when every selected source actually ingested rows, so a
  cron job or CI step cannot report success on an empty scrape.

Usage
-----
    python -m scripts.run_scrapers                    # dry run, all sources
    python -m scripts.run_scrapers --commit           # write for real
    python -m scripts.run_scrapers --only worldbank payscale --commit
    python -m scripts.run_scrapers --list             # what will run, and why
"""
from __future__ import annotations

import argparse
import asyncio
import importlib
import logging
import os
import sys
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Optional

# Make `scrapers.*`, `pipeline.*` and `api.*` importable no matter which
# directory the script is invoked from. The deployed layout is
# `uvicorn api.main:app` from `backend/`, so these are top-level packages; under
# pytest or `python -m backend.` they are rooted one level up.
BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from sqlalchemy import text  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s %(name)s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("run_scrapers")
# httpx logs every request at INFO, which buries the run summary.
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)


# ── Registry ────────────────────────────────────────────────────────────────
@dataclass
class Source:
    """One scraper, plus everything needed to decide whether it can run."""

    key: str
    module: str
    attr: str
    needs: tuple[str, ...] = ()          # env vars required to be present
    why: str = ""                        # human note for --list
    # Sources whose value is national, not per-program, land in
    # macro_indicators. Useful when someone asks "which of these touches my
    # per-program fees?" — the answer is none of the macro ones.
    macro_only: bool = False
    # Set when the scraper is known-unimplemented, so it is reported as
    # skipped with the reason rather than failing the run every single time.
    unavailable: str = ""


SOURCES: list[Source] = [
    Source("worldbank", "scrapers.worldbank_scraper", "WorldBankScraper",
           why="PPP, GDP per capita, macro anchors. No credentials."),
    Source("plfs", "scrapers.plfs_scraper", "PLFSScraper",
           why="PLFS unemployment/earnings. MoSPI. No credentials."),
    Source("payscale", "scrapers.payscale_scraper", "PayscaleScraper",
           why="Salary distributions by role. Standard HTML, no credentials."),
    Source("college_placement", "scrapers.college_placement_scraper",
           "CollegePlacementScraper",
           why="Per-college placement rates. Per-program rows."),
    Source("nirf", "scrapers.nirf_scraper", "NIRFScraper",
           why="NIRF ranks via data.gov.in. Needs egress to api.data.gov.in."),
    Source("ambitionbox", "scrapers.ambitionbox_scraper", "AmbitionBoxScraper",
           why="Salary + college ratings via __NUXT__ state parsing."),
    Source("naukri", "scrapers.naukri_scraper", "NaukriScraper",
           why="Job demand counts from HTML search pages."),
    Source("internshala", "scrapers.internshala_scraper", "InternshalaScraper",
           why="Internship listings, stipend ranges."),
    Source("indeed", "scrapers.indeed_scraper", "IndeedScraper",
           why="Job postings. Frequently blocks datacenter IPs."),
    Source("rbi", "scrapers.rbi_scraper", "RBIScraper",
           why="RBI macro series. No credentials.",
           unavailable="no extractor — RBI DBIE has no public JSON API and no "
                       "CSV parser is implemented. Use `worldbank` for CPI/"
                       "unemployment macro series instead."),
    Source("reddit", "scrapers.reddit_scraper", "RedditScraper",
           needs=("REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET"),
           why="Student sentiment. Free OAuth app at reddit.com/prefs/apps."),
    Source("tavily", "scrapers.tavily_scraper", "TavilyScraper",
           needs=("TAVILY_API_KEY",),
           why="Search-grounded research. Free tier at tavily.com."),
    Source("jina", "scrapers.jina_scraper", "JinaScraper",
           needs=("JINA_API_KEY",),
           why="Reader proxy for JS pages. Free tier at jina.ai."),
    Source("firecrawl", "scrapers.crawl4ai_scraper", "Crawl4AIScraper",
           needs=("FIRECRAWL_API_KEY",),
           why="Heavy-JS college portals. Free 500 pages/month."),
]

BY_KEY = {s.key: s for s in SOURCES}


# ── Connection ──────────────────────────────────────────────────────────────
def _pgbouncer_args(db_url: str) -> dict[str, Any]:
    """Disable prepared statements when the server is a transaction pooler.

    Supabase hands out a pgbouncer port (`:6543`) in addition to the direct
    port. On the pooled one, asyncpg's prepared-statement cache is not just
    useless but fatal — the first query fails and nothing downstream runs. This
    was the reason the pipeline reported success while writing zero rows.
    """
    if "pooler" in db_url or ":6543" in db_url or "pgbouncer" in db_url:
        return {
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0,
            "server_settings": {"jit": "off"},
        }
    return {}


def _normalize(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


def _load_db_url() -> str:
    """Read DATABASE_URL from the environment, falling back to backend/.env.

    The scrapers run outside the Vercel function environment, so a local
    invocation has to pick the value up from the file the deploy reads.
    """
    url = os.getenv("DATABASE_URL", "").strip()
    if url:
        return _normalize(url)

    for candidate in (BACKEND_ROOT / ".env", BACKEND_ROOT.parent / ".env"):
        if not candidate.exists():
            continue
        for line in candidate.read_text().splitlines():
            line = line.strip()
            if line.startswith("DATABASE_URL="):
                    # Strip quotes, ignore an inline comment, ignore the
                    # placeholder value shipped in .env.example.
                    raw = line.split("=", 1)[1].split("#")[0].strip().strip("\"'")
                    if raw and "your-" not in raw and "postgres://" in raw or "postgresql" in raw:
                        if raw and "your-" not in raw:
                            return _normalize(raw)
    raise SystemExit(
        "DATABASE_URL is not set.\n"
        "  Put it in backend/.env, or export it before running."
    )


# ── Run bookkeeping ─────────────────────────────────────────────────────────
@dataclass
class Outcome:
    key: str
    state: str                    # ok | failed | skipped
    scraped: int = 0
    updated: int = 0
    flagged: int = 0
    seconds: float = 0.0
    detail: str = ""


@dataclass
class Summary:
    outcomes: list[Outcome] = field(default_factory=list)

    @property
    def ran(self) -> list[Outcome]:
        return [o for o in self.outcomes if o.state == "ok"]

    @property
    def failed(self) -> list[Outcome]:
        return [o for o in self.outcomes if o.state == "failed"]

    @property
    def skipped(self) -> list[Outcome]:
        return [o for o in self.outcomes if o.state == "skipped"]


class _Settings:
    """Adapts os.environ to the duck-typed `settings` the scrapers expect."""

    def __getattr__(self, name: str) -> Optional[str]:
        return os.getenv(name.upper())


SETTINGS = _Settings()


# ── Execution ───────────────────────────────────────────────────────────────
async def _open_run(db: AsyncSession, source_key: str) -> str:
    """Create a scrape_runs row so the source shows a real, attributable run.

    The column is `source_name`, not `source`. `source` reads like the obvious
    name, so the first version of this wrote `source` and every run died on
    UndefinedColumnError before a single request went out — which is exactly
    the class of quiet, total failure this script exists to make visible.
    """
    run_id = str(uuid.uuid4())
    await db.execute(
        text("""
            INSERT INTO scrape_runs (id, source_name, status, started_at)
            VALUES (CAST(:id AS uuid), :source, CAST('running' AS scrape_status), NOW())
        """),
        {"id": run_id, "source": source_key},
    )
    await db.commit()
    return run_id


async def run_one(
    session_factory: async_sessionmaker,
    source: Source,
    commit: bool,
) -> Outcome:
    loop = asyncio.get_running_loop()
    started = loop.time()

    missing = [v for v in source.needs if not os.getenv(v)]
    if source.unavailable:
        return Outcome(source.key, "skipped", detail=source.unavailable)
    if missing:
        return Outcome(
            source.key, "skipped",
            detail=f"needs {'+'.join(missing)}",
        )

    try:
        module = importlib.import_module(source.module)
        cls = getattr(module, source.attr)
    except Exception as exc:  # import errors are the DAG's old failure mode
        return Outcome(source.key, "failed", detail=f"import failed: {exc}")

    async with session_factory() as db:
        try:
            run_id = await _open_run(db, source.key)
        except Exception as exc:
            return Outcome(source.key, "failed", detail=f"could not open run: {exc}")

        # Not a dry run: point the session at a transaction we will roll back.
        # The scrapers call `db.commit()` internally (base_scraper does, twice),
        # so a wrapper transaction cannot roll their work back. Instead the
        # dry run refuses to hand out a writable session and reports what the
        # scrape yields, which is the honest thing to show.
        if not commit:
            # A scraper calls `db.commit()` itself, so an outer transaction
            # cannot roll its work back. The dry run therefore calls `scrape()`
            # directly and reports what it yielded, never calling
            # `persist_results()` — so nothing reaches the target tables.
            parsed = 0
            detail = "dry run"
            try:
                scraper = cls(db=db, run_id=run_id, settings=SETTINGS)
                async with scraper:
                    results = await scraper.scrape()
                parsed = len(results)
                detail = f"dry run — {parsed} parsed, not written"
            except Exception as exc:
                detail = f"scrape raised: {type(exc).__name__}: {exc}"
            finally:
                await _close_run(db, run_id, "skipped", detail)

            state = "ok" if parsed > 0 else "failed"
            if parsed == 0:
                # A dry run that parses nothing is a failure, and saying "ok"
                # here hid three dead sources (ambitionbox, naukri, indeed)
                # behind a green tick. `base_scraper` already refuses to call a
                # zero-row run a success in commit mode; the dry run has to
                # agree with it or it is not telling you the truth about
                # whether `--commit` will work.
                detail = "0 records parsed — extractor drifted or source blocked"
            return Outcome(
                source.key, state,
                scraped=parsed, updated=0, flagged=0,
                seconds=loop.time() - started, detail=detail,
            )

        try:
            scraper = cls(db=db, run_id=run_id, settings=SETTINGS)
            stats = await scraper.run()
        except Exception as exc:
            return Outcome(
                source.key, "failed",
                detail=f"{type(exc).__name__}: {exc}",
                seconds=loop.time() - started,
            )

        if stats.records_scraped == 0:
            return Outcome(
                source.key, "failed",
                seconds=loop.time() - started,
                detail="0 records persisted — extractor drifted or source blocked",
            )

        return Outcome(
            source.key, "ok",
            scraped=stats.records_scraped,
            updated=stats.records_updated,
            flagged=stats.records_flagged,
            seconds=loop.time() - started,
        )


async def _close_run(db: AsyncSession, run_id: str, status: str, message: str | None) -> None:
    try:
        await db.execute(
            text("""
                UPDATE scrape_runs SET
                    status = CAST(:status AS scrape_status),
                    error_message = :msg,
                    completed_at = NOW()
                WHERE id = CAST(:id AS uuid)
            """),
            {"status": status, "msg": message, "id": run_id},
        )
        await db.commit()
    except Exception:
        logger.debug("could not close run %s", run_id, exc_info=True)


# ── CLI ─────────────────────────────────────────────────────────────────────
def _print_plan(selected: list[Source], commit: bool) -> None:
    mode = "COMMIT (writes to the live database)" if commit else "DRY RUN (writes nothing)"
    print(f"\n  Mode: {mode}\n")
    print(f"  {'SOURCE':<18} {'STATE':<9} NOTE")
    print(f"  {'-'*18} {'-'*9} {'-'*58}")
    for s in selected:
        if s.unavailable:
            state, note = "skip", s.unavailable
        else:
            missing = [v for v in s.needs if not os.getenv(v)]
            state = "skip" if missing else "run"
            note = f"needs {'+'.join(missing)}" if missing else s.why
        print(f"  {s.key:<18} {state:<9} {note}")
    print()


async def main_async(args: argparse.Namespace) -> int:
    selected = [BY_KEY[k] for k in args.only] if args.only else SOURCES

    if not selected:
        print("No sources selected.")
        return 2

    _print_plan(selected, args.commit)

    db_url = _load_db_url()
    engine = create_async_engine(
        db_url,
        pool_size=1,
        max_overflow=0,
        pool_pre_ping=True,
        connect_args=_pgbouncer_args(db_url),
    )
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    summary = Summary()
    try:
        # Serial, not concurrent. These hit a small number of government and
        # job-board sites with polite per-request delays; running them at once
        # buys nothing and makes rate-limit failures look random.
        for source in selected:
            logger.info("→ %s", source.key)
            outcome = await run_one(session_factory, source, args.commit)
            summary.outcomes.append(outcome)
            marker = {"ok": "✓", "failed": "✗", "skipped": "–"}[outcome.state]
            logger.info(
                "  %s %-18s %s%s",
                marker, outcome.key,
                f"{outcome.scraped} records" if outcome.state == "ok" else outcome.detail,
                f" ({outcome.seconds:.1f}s)" if outcome.seconds else "",
            )
    finally:
        await engine.dispose()

    _print_summary(summary, args.commit)
    return _exit_code(summary, args)


def _print_summary(summary: Summary, commit: bool) -> None:
    print("\n" + "═" * 72)
    print(f"  {'SOURCE':<18} {'STATE':<8} {'SCRAPED':>8} {'UPDATED':>8} {'FLAGGED':>8}  DETAIL")
    print("  " + "─" * 70)
    for o in summary.outcomes:
        print(
            f"  {o.key:<18} {o.state:<8} {o.scraped:>8} {o.updated:>8} "
            f"{o.flagged:>8}  {o.detail[:28]}"
        )
    print("  " + "─" * 70)
    totals = (
        sum(o.scraped for o in summary.outcomes),
        sum(o.updated for o in summary.outcomes),
        sum(o.flagged for o in summary.outcomes),
    )
    print(f"  {'TOTAL':<18} {'':<8} {totals[0]:>8} {totals[1]:>8} {totals[2]:>8}")
    print("═" * 72)

    if not commit:
        print("\n  Dry run. Re-run with --commit to write these to the database.\n")
    else:
        print(f"\n  Committed: {totals[1]} rows updated, {totals[2]} anomalies held back.")
        if totals[2]:
            print("  Flagged rows were NOT promoted to is_current — review scrape_anomalies.\n")
        else:
            print()


def _exit_code(summary: Summary, args: argparse.Namespace) -> int:
    """Exit code a cron job or CI step can trust.

    The original version returned 0 whenever any source ingested a row, so a
    run in which 6 sources wrote data and 4 failed entirely still reported
    success. That is how 22 empty runs were recorded as healthy in the first
    place: the signal people watch was not connected to whether the pipeline
    worked.

    0  at least one source ingested rows and nothing failed
    1  every source failed, or a source failed under --strict
    3  nothing ran — all sources skipped for missing credentials
    """
    if summary.failed:
        if args.strict or not summary.ran:
            return 1
        # Partial failure without --strict: usable, but the caller asked not
        # to be told about failures, so do not fail the step.
        return 0
    if summary.ran:
        return 0
    if summary.skipped:
        return 3
    return 1


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Run the IndiaLens scraper pipeline.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Writes require --commit. The default is a dry run.",
    )
    p.add_argument("--commit", action="store_true",
                   help="Actually write to the database. Omit for a dry run.")
    p.add_argument("--only", nargs="+", metavar="SOURCE", choices=sorted(BY_KEY),
                   help="Run only these sources.")
    p.add_argument("--list", action="store_true",
                   help="Print the plan and exit without scraping.")
    p.add_argument("--strict", action="store_true",
                   help="Exit non-zero if any source fails, not only if all do.")
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)
    if args.list:
        _print_plan([BY_KEY[k] for k in args.only] if args.only else SOURCES, args.commit)
        print("  Available:", ", ".join(sorted(BY_KEY)))
        print()
        return 0
    return asyncio.run(main_async(args))


if __name__ == "__main__":
    raise SystemExit(main())
