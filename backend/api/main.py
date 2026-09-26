"""
IndiaLens Backend — FastAPI Application
Week 3: ML model loading at startup, new ML management router
"""
import logging
import os
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import uvicorn
import sentry_sdk

from .routers import colleges, analyze, admin, scrape, external as external_router, ai as ai_router, analytics as analytics_router
from .db.database import init_db, AsyncSessionLocal
from .config import settings
from .integrations import integration_status

logger = logging.getLogger(__name__)

if os.getenv('SENTRY_DSN'):
    sentry_sdk.init(dsn=os.getenv('SENTRY_DSN'), traces_sample_rate=0.1)

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="IndiaLens API",
    description="India's quantitative education and career intelligence platform — backend API",
    version="2.0.0-week3",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — allow Next.js dev server and production domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv('FRONTEND_URL', 'http://localhost:3000'),
        "https://indialens.in",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    """
    Startup sequence:
    1. Init DB connection pool
    2. Warm-up ML models (lazy-loaded but cached on first call)
    """
    await init_db()

    # Warm up XGBoost predictor (trains from seed if no artifact exists)
    try:
        from ..ml.salary_predictor import get_predictor
        predictor = get_predictor(settings.current_model_version)
        logger.info(f"[Startup] XGBoost loaded — {len(predictor.models)} horizon models")
    except Exception as e:
        logger.warning(f"[Startup] XGBoost warmup skipped: {e}")

    # Warm up LSTM (may use compound growth fallback)
    try:
        from ..ml.lstm_trajectory import get_lstm_model
        lstm = get_lstm_model(settings.current_model_version)
        logger.info(f"[Startup] LSTM loaded — torch_available={lstm._torch_available}")
    except Exception as e:
        logger.warning(f"[Startup] LSTM warmup skipped: {e}")

    # Warm up BERT NER extractor
    try:
        from ..ml.salary_ner import get_ner_extractor
        ner = get_ner_extractor()
        logger.info(f"[Startup] NER extractor — bert={ner._bert_available}")
    except Exception as e:
        logger.warning(f"[Startup] NER warmup skipped: {e}")

    logger.info("[Startup] IndiaLens API ready")


@app.get("/health")
async def root_health():
    return {"status": "ok", "version": "1.0.0", "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/health")
async def health():
    """Live dependency check — used by Docker, Render, and the Next.js BFF."""
    db_status = "disconnected"
    program_count = None
    try:
        async with AsyncSessionLocal() as db:
            await db.execute(text("SELECT 1"))
            r = await db.execute(text("SELECT COUNT(*) FROM programs WHERE is_active = TRUE"))
            program_count = int(r.scalar() or 0)
            db_status = "connected"
    except Exception:
        db_status = "error"

    try:
        # `ml` is a top-level sibling package; `..ml` is not importable under
        # `uvicorn api.main:app`, so this always fell to "unavailable".
        from ml.salary_predictor import get_predictor
        predictor = get_predictor(settings.current_model_version)
        ml_status = "ready" if predictor.models else "untrained"
    except Exception:
        ml_status = "unavailable"

    integrations = integration_status()
    status = "ok" if db_status == "connected" else "degraded"
    return {
        "status": status,
        "version": "2.0.0",
        "model_version": settings.current_model_version,
        "ml_status": ml_status,
        "db": db_status,
        "programs": program_count,
        # Non-empty means whole feature groups are missing. Alert on this.
        "mount_failures": MOUNT_FAILURES,
        "integrations": integrations,
        "timestamp": datetime.utcnow().isoformat(),
    }


# ── Mount routers ────────────────────────────────────────────────────
app.include_router(colleges.router, prefix="/api",          tags=["colleges"])
app.include_router(analyze.router,  prefix="/api",          tags=["analyze"])
app.include_router(admin.router,    prefix="/api/admin",    tags=["admin"])
app.include_router(scrape.router,   prefix="/api/scrape",   tags=["scrape"])
app.include_router(external_router.router, prefix="/api/v1", tags=["external"])
app.include_router(ai_router.router,       prefix="/api/v1", tags=["ai"])
app.include_router(analytics_router.router, prefix="/api/v1/analytics", tags=["analytics"])

# New Production Routers: Marketplace, Global Degrees, Portfolio Spike Studio, Psychometric, Admissions
#
# These were wrapped in a bare `except Exception` that only logged a warning, so
# a broken import (e.g. the `backend.*` vs top-level package mismatch) silently
# dropped every route in the block. Production served a "healthy" app with whole
# features missing and no error anywhere but one log line. Failures are
# recorded in MOUNT_FAILURES and re-raised at the /health endpoint.
MOUNT_FAILURES: dict[str, str] = {}

try:
    from .routers import marketplace as marketplace_router
    from .routers import global_programs as global_programs_router
    from .routers import portfolio as portfolio_router
    from .routers import psychometric as psychometric_router
    from .routers import admissions as admissions_router

    app.include_router(marketplace_router.router, prefix="/api/v2", tags=["marketplace"])
    app.include_router(global_programs_router.router, prefix="/api/v2", tags=["global_programs"])
    app.include_router(portfolio_router.router, prefix="/api/v2", tags=["portfolio"])
    app.include_router(psychometric_router.router, tags=["psychometric"])
    app.include_router(admissions_router.router, prefix="/api/v2", tags=["admissions"])
    logger.info("[Main] Production routers (Marketplace, Global, Portfolio, Psychometric, Admissions) mounted at /api/v2")
except Exception as e:
    MOUNT_FAILURES["production_routers"] = f"{type(e).__name__}: {e}"
    logger.error("[Main] Production routers NOT mounted: %s", e, exc_info=True)

# Week 3: ML management endpoints
try:
    from .routers import ml as ml_router
    app.include_router(ml_router.router, prefix="/api/ml", tags=["ml"])
    logger.info("[Main] ML router mounted at /api/ml")
except Exception as e:
    MOUNT_FAILURES["ml_router"] = f"{type(e).__name__}: {e}"
    logger.error("[Main] ML router NOT mounted: %s", e, exc_info=True)

# Authentication & OAuth 2.0 Router
try:
    from .routers import auth as auth_router
    app.include_router(auth_router.router, prefix="/api/v1", tags=["auth"])
    logger.info("[Main] Auth & OAuth router mounted at /api/v1/auth")
except Exception as e:
    MOUNT_FAILURES["auth_router"] = f"{type(e).__name__}: {e}"
    logger.error("[Main] Auth router NOT mounted: %s", e, exc_info=True)



if __name__ == "__main__":
    # Was "backend.api.main:app" — that form only resolves when the repo ROOT is
    # on sys.path. Every deploy target runs `uvicorn api.main:app` from backend/
    # (Procfile, render.yaml, railway.toml), where `backend` is not importable.
    # Use the object directly so it works in both layouts.
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
