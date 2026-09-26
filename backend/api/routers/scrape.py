"""
/api/scrape — scrape run status + real dispatcher.
"""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from uuid import UUID

from ..db.database import get_db
from ..scraper_jobs import VALID_SOURCES, missing_credentials, run_scraper_job

router = APIRouter()


@router.get("/sources")
async def list_sources():
    """Which scrapers are triggerable, and what each one still needs.

    Declared above `/{run_id}` so the literal path wins: a `str` path param
    matches anything, so `GET /api/scrape/sources` was being routed to
    get_scrape_run and died in Postgres with
    `invalid input for query argument $1: 'sources' (invalid UUID)`.
    """
    return {
        "sources": [
            {
                "name": name,
                "trigger_path": f"/api/scrape/trigger/{name}",
                "missing_credentials": missing_credentials(name),
            }
            for name in VALID_SOURCES
        ],
    }


@router.get("/{run_id}")
async def get_scrape_run(run_id: UUID, db: AsyncSession = Depends(get_db)):
    # UUID-typed so a non-UUID path returns a clean 422 from validation instead
    # of a 500 from asyncpg.
    result = await db.execute(
        text("SELECT * FROM scrape_runs WHERE id = :id"),
        {"id": str(run_id)},
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Scrape run not found")
    return dict(row._mapping)


@router.patch("/{run_id}")
async def update_scrape_run(
    run_id: UUID,
    status: str,
    records_scraped: int = 0,
    records_updated: int = 0,
    records_flagged: int = 0,
    error_message: str = None,
    db: AsyncSession = Depends(get_db),
):
    # `:status` cannot be reused in the CASE expression: asyncpg binds the
    # same named param as `text` in the IN-list but as the `scrape_status`
    # enum in the SET, so Postgres rejects the assignment (42804, "column
    # status is of type scrape_status but expression is of type text") and
    # every PATCH raised. Cast explicitly on both sides. `ELSE completed_at`
    # rather than `ELSE NULL` so patching a run back to 'running' keeps the
    # timestamp it already has instead of blanking it.
    await db.execute(text("""
        UPDATE scrape_runs SET
            status = CAST(:status AS scrape_status),
            records_scraped = :scraped,
            records_updated = :updated,
            records_flagged = :flagged,
            error_message = :error,
            completed_at = CASE WHEN CAST(:status AS text) IN ('success', 'failed', 'partial')
                                THEN NOW() ELSE completed_at END
        WHERE id = :id
    """), {
        "id": str(run_id), "status": status,
        "scraped": records_scraped, "updated": records_updated,
        "flagged": records_flagged, "error": error_message,
    })
    await db.commit()
    return {"status": "updated"}


@router.post("/trigger/{scraper_name}")
async def trigger_scraper_run(
    scraper_name: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    source = scraper_name.lower()
    if source not in VALID_SOURCES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid scraper '{scraper_name}'. Valid options: {VALID_SOURCES}",
        )

    try:
        result = await db.execute(text("""
            INSERT INTO scrape_runs (source_name, status)
            VALUES (:source, 'running')
            RETURNING id
        """), {"source": source})
        run_id = str(result.scalar())
        await db.commit()
    except Exception as e:
        raise HTTPException(status_code=503, detail={"error": "database_unavailable", "reason": str(e)})

    background_tasks.add_task(run_scraper_job, source, run_id)
    return {
        "status": "triggered",
        "run_id": run_id,
        "scraper": source,
        "message": f"Scraper '{source}' queued. Poll GET /api/scrape/{run_id}",
    }
