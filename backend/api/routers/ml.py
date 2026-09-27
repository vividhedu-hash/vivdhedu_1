"""
/api/ml — ML model management endpoints

GET  /ml/status              — current champion + model health
GET  /ml/feature-importance  — top features from XGBoost
POST /ml/retrain             — trigger retraining (admin)
POST /ml/promote/{version}   — promote a version to champion (admin)
POST /ml/rollback            — rollback to previous champion (admin)
GET  /ml/versions            — list all versions
GET  /ml/compare             — compare two versions

Import convention
-----------------
Every `ml.*` import in this module is ABSOLUTE. This file is `api.routers.ml`,
i.e. package depth 2, so `...ml.salary_predictor` walks one level above the
`api` top-level package and raises ImportError. It previously did, was caught by
the `except Exception` on each route, and the route quietly served invented
numbers instead of real model output. The bare `ml` package is a sibling of
`api` under backend/ and is importable because every deploy target runs
`uvicorn api.main:app` from backend/ (Procfile, render.yaml, Dockerfile.api).
See the same note in api/main.py:110-115.
"""
from fastapi import APIRouter, Depends, HTTPException, Header, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional

from ..db.database import get_db
from ..config import settings

router = APIRouter()


def _require_admin(x_api_key: Optional[str] = Header(None)):
    if not x_api_key or x_api_key != settings.api_key_admin:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


@router.get("/status")
async def model_status(db: AsyncSession = Depends(get_db)):
    """Public: current model version, training metadata, data freshness."""
    # No catch-all fallback here. The old `except Exception` returned
    # `programs_indexed: 15` — a hardcoded constant that happened to equal the
    # seed dataset size, so a dead database was indistinguishable from a healthy
    # one. A DB outage is now a 503 with the reason, which is what the caller
    # needs. (This endpoint is not on the /api/health dependency path; that one
    # does its own guarded `SELECT 1` and keeps working regardless.)
    try:
        result = await db.execute(text("""
            SELECT version_tag, trained_at, training_records,
                   validation_mae, validation_r2, changelog
            FROM model_versions WHERE is_live = TRUE LIMIT 1
        """))
        row = result.fetchone()
        champion = dict(row._mapping) if row else None

        # Data freshness
        result2 = await db.execute(text("""
            SELECT MAX(scraped_at) AS last_scrape FROM data_points
        """))
        last_scrape = result2.scalar()

        # Program count
        result3 = await db.execute(text("SELECT COUNT(*) FROM programs WHERE is_active = TRUE"))
        program_count = result3.scalar() or 0
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={"error": "database_unavailable", "reason": str(e)},
        )

    return {
        "champion": champion,
        "programs_indexed": program_count,
        "last_data_update": last_scrape.isoformat() if last_scrape else None,
        "model_health": "healthy" if champion else "no_model",
    }


@router.get("/feature-importance")
async def feature_importance():
    """Return top feature importances from the current XGBoost model."""
    # The `except Exception` here used to return a hardcoded list of eight
    # fabricated importances. Because the `...ml.salary_predictor` import inside
    # the try always raised, that fabricated list was the ONLY thing this
    # endpoint ever returned — it looked like a working feature-importance
    # report and was pure fiction. A real failure is now a 503 that says why.
    try:
        from ml.salary_predictor import get_predictor
        predictor = get_predictor(settings.current_model_version)
        importances = predictor.feature_importance(top_n=10)
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "model_unavailable",
                "reason": str(e),
                "hint": "POST /api/ml/retrain (admin) to train the salary predictor.",
            },
        )

    return {
        "model_version": settings.current_model_version,
        "features": importances,
        "description": "Importance of each feature in predicting 5-year salary (y5 model). Higher = more influential.",
        "_source": "model",
    }


@router.post("/retrain")
async def trigger_retrain(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    version_tag: Optional[str] = None,
    _: None = Depends(_require_admin),
):
    """Trigger async retraining. Returns immediately; training runs in background."""
    async def _run_pipeline():
        from ml.training_pipeline import run_training_pipeline
        async_result = await run_training_pipeline(
            db=db,
            version_tag=version_tag,
            trigger="manual",
            promote_if_better=True,
        )
        return async_result

    background_tasks.add_task(_run_pipeline)
    return {
        "status": "training_started",
        "version_tag": version_tag or "auto",
        "message": "Training pipeline running in background. Check /ml/versions for progress.",
    }


@router.post("/promote/{version_tag}")
async def promote_version(
    version_tag: str,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(_require_admin),
):
    from ml.model_registry import ModelRegistry
    registry = ModelRegistry(db)
    success = await registry.promote(version_tag)
    if not success:
        raise HTTPException(status_code=404, detail=f"Version {version_tag} not found")
    return {"status": "promoted", "version_tag": version_tag}


@router.post("/rollback")
async def rollback(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(_require_admin),
):
    from ml.model_registry import ModelRegistry
    registry = ModelRegistry(db)
    rolled_back_to = await registry.rollback()
    if not rolled_back_to:
        raise HTTPException(status_code=400, detail="No previous champion found to roll back to")
    return {"status": "rolled_back", "version_tag": rolled_back_to}


@router.get("/versions")
async def list_versions(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(_require_admin),
):
    from ml.model_registry import ModelRegistry
    registry = ModelRegistry(db)
    versions = await registry.list_versions()
    return {"versions": versions, "total": len(versions)}


@router.get("/compare")
async def compare_versions(
    version_a: str,
    version_b: str,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(_require_admin),
):
    from ml.model_registry import ModelRegistry
    registry = ModelRegistry(db)
    comparison = await registry.compare(version_a, version_b)
    return comparison
