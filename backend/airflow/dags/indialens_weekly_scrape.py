"""
IndiaLens Weekly Scrape Pipeline — Airflow DAG
Runs every Sunday at 2:00 AM IST (20:30 UTC Saturday)

DAG topology:
  start
   ├── scrape_nirf
   ├── scrape_ambitionbox
   ├── scrape_naukri
   └── scrape_reddit
         ↓ (all complete)
   anomaly_report
         ↓
   retrain_trigger   (conditional — only if anomalies < 10% of total)
         ↓
   compute_roi_scores
         ↓
   invalidate_cache
         ↓
   notify_admin
"""
from __future__ import annotations

import logging
import os
import sys
from datetime import datetime, timedelta
from typing import Any

from airflow import DAG
from airflow.operators.python import PythonOperator, ShortCircuitOperator
from airflow.operators.empty import EmptyOperator
from airflow.utils.trigger_rule import TriggerRule
from airflow.models import Variable

logger = logging.getLogger(__name__)

# ── DAG defaults ────────────────────────────────────────────────────
DEFAULT_ARGS = {
    "owner": "indialens-data",
    "depends_on_past": False,
    "start_date": datetime(2026, 8, 1),
    "email": ["data@indialens.in"],
    "email_on_failure": True,
    "email_on_retry": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
    "execution_timeout": timedelta(hours=2),
}

# ── Config pulled from Airflow Variables (set via UI or CLI) ────────
def get_config() -> dict:
    return {
        "database_url": Variable.get("INDIALENS_DATABASE_URL", default_var="postgresql://indialens:indialens_dev@postgres:5432/indialens"),
        "api_base": Variable.get("INDIALENS_API_BASE", default_var="http://api:8000"),
        "anomaly_threshold": float(Variable.get("ANOMALY_THRESHOLD_PCT", default_var="25.0")),
        "retrain_threshold": float(Variable.get("RETRAIN_ANOMALY_PCT", default_var="0.08")),
        "reddit_client_id": Variable.get("REDDIT_CLIENT_ID", default_var=""),
        "reddit_client_secret": Variable.get("REDDIT_CLIENT_SECRET", default_var=""),
    }


# ── Task functions ──────────────────────────────────────────────────

def _create_scrape_run(source_name: str, config: dict) -> str:
    """Create a scrape_run record and return its UUID."""
    import psycopg2
    import uuid

    run_id = str(uuid.uuid4())
    conn = psycopg2.connect(config["database_url"])
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO scrape_runs (id, source_name, status) VALUES (%s, %s, 'running')",
                (run_id, source_name),
            )
        conn.commit()
    finally:
        conn.close()
    return run_id


def _update_scrape_run(run_id: str, status: str, stats: dict, config: dict):
    """Update scrape_run status + stats."""
    import psycopg2

    conn = psycopg2.connect(config["database_url"])
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE scrape_runs SET
                    status = %s,
                    records_scraped = %s,
                    records_updated = %s,
                    records_flagged = %s,
                    completed_at = NOW()
                WHERE id = %s
            """, (
                status,
                stats.get("scraped", 0),
                stats.get("updated", 0),
                stats.get("flagged", 0),
                run_id,
            ))
        conn.commit()
    finally:
        conn.close()


# ── Scraping ─────────────────────────────────────────────────────────
#
# These were nine near-identical task functions, each of which:
#
#   * imported `indialens.scrapers.*` — a package that does not exist here.
#     The real path is `scrapers.*`, so every task died at import, before a
#     single HTTP request, and Airflow reported the DAG as failed while the
#     underlying cause stayed buried in the task log.
#   * built its engine with no pgbouncer-safe arguments. Against a Supabase
#     pooled connection the first query raises, so the same task would have
#     failed on the connection even with the import fixed.
#   * hardcoded `status="success"` on the way out, whatever the scraper had
#     actually done. `base_scraper` raises `ScrapeYieldedNothing` on a
#     zero-row run precisely to prevent that, and the DAG was overriding it.
#
# There is now one task. It delegates to `scripts/run_scrapers.py`, which owns
# connection setup, per-source isolation, credential preflight and the
# dry-run/commit split — one implementation to keep correct whether it is
# invoked from Airflow, from cron, or by hand.
#
# The runner is loaded by path rather than by name because the Airflow image
# is not guaranteed to have `backend/` on sys.path as a package root.


def _load_runner():
    import importlib.util

    here = os.path.dirname(os.path.abspath(__file__))
    # airflow/dags/ -> backend/
    backend_root = os.path.abspath(os.path.join(here, "..", ".."))
    if backend_root not in sys.path:
        sys.path.insert(0, backend_root)

    runner_path = os.path.join(backend_root, "scripts", "run_scrapers.py")
    spec = importlib.util.spec_from_file_location("indialens_run_scrapers", runner_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def task_scrape_all(**context):
    """Run the scraper pipeline for this cycle.

    One task rather than nine. The sources are already isolated from each other
    inside the runner, so fanning them out across Airflow tasks bought
    parallelism the polite rate limits could not use, and cost nine copies of
    the same connection and import bugs.
    """
    config = get_config()

    # The Airflow Variable is the source of truth for the connection string, so
    # the DAG does not silently fall back to a local .env.
    if config.get("database_url"):
        os.environ["DATABASE_URL"] = config["database_url"]

    runner = _load_runner()
    argv = ["--commit", "--strict"]
    dag_run = context.get("dag_run")
    conf = getattr(dag_run, "conf", None) or {}
    if isinstance(conf, dict) and conf.get("only"):
        argv += ["--only", *conf["only"]]

    logger.info("[scrape] invoking runner: %s", " ".join(argv))
    exit_code = runner.main(argv)

    if exit_code not in (0, 3):
        raise RuntimeError(
            f"scraper pipeline returned {exit_code} — check scrape_runs for the "
            f"per-source outcome. 0 means at least one source ingested rows, "
            f"3 means every source was skipped for missing credentials."
        )
    return {"exit_code": exit_code}




def task_anomaly_report(**context):
    """
    Summarise all anomalies from this scrape cycle.
    Pushes anomaly_pct to XCom for the retrain gate.
    """
    import psycopg2

    config = get_config()
    conn = psycopg2.connect(config["database_url"])

    with conn.cursor() as cur:
        # Total new records in last 24h
        cur.execute("""
            SELECT COUNT(*) FROM data_points WHERE scraped_at > NOW() - INTERVAL '24 hours'
        """)
        total_new = cur.fetchone()[0] or 1

        # Total anomalies in last 24h
        cur.execute("""
            SELECT COUNT(*) FROM anomalies WHERE created_at > NOW() - INTERVAL '24 hours'
        """)
        total_anomalies = cur.fetchone()[0] or 0

        # Pending anomalies
        cur.execute("SELECT COUNT(*) FROM anomalies WHERE status = 'pending'")
        pending = cur.fetchone()[0] or 0

    conn.close()

    anomaly_pct = total_anomalies / total_new
    logger.info(
        f"[AnomalyReport] new_records={total_new} anomalies={total_anomalies} "
        f"({anomaly_pct:.1%}) pending_queue={pending}"
    )

    context["task_instance"].xcom_push(key="anomaly_pct", value=anomaly_pct)
    context["task_instance"].xcom_push(key="pending_anomalies", value=pending)

    return {
        "total_new_records": total_new,
        "total_anomalies": total_anomalies,
        "anomaly_pct": anomaly_pct,
        "pending_anomalies": pending,
    }


def task_should_retrain(**context) -> bool:
    """
    Gate: only retrain if anomaly rate is low enough that the new data is trustworthy.
    Returns True (proceed) if anomaly_pct < RETRAIN_THRESHOLD.
    """
    config = get_config()
    anomaly_pct = context["task_instance"].xcom_pull(task_ids="anomaly_report", key="anomaly_pct") or 1.0
    retrain_threshold = config["retrain_threshold"]

    should_train = anomaly_pct < retrain_threshold
    logger.info(f"[RetrainGate] anomaly_pct={anomaly_pct:.1%} threshold={retrain_threshold:.1%} → {'GO' if should_train else 'SKIP'}")
    return should_train


def task_compute_roi_scores(**context):
    """
    Week 3: Full XGBoost + LSTM training pipeline.
    Trains a new model version, computes ROI for all programs,
    writes to DB, and conditionally promotes the new model.
    """
    import asyncio
    from datetime import datetime, timezone
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

    config = get_config()
    anomaly_pct = context["task_instance"].xcom_pull(task_ids="anomaly_report", key="anomaly_pct") or 0.0

    async def _run():
        db_url = config["database_url"].replace("postgresql://", "postgresql+asyncpg://")
        engine = create_async_engine(db_url)
        async_session = async_sessionmaker(engine, class_=AsyncSession)

        async with async_session() as db:
            from indialens.ml.training_pipeline import run_training_pipeline

            ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M")
            version_tag = f"v{ts}_airflow"

            result = await run_training_pipeline(
                db=db,
                version_tag=version_tag,
                trigger="scheduled",
                promote_if_better=True,
            )
            return result

    result = asyncio.run(_run())

    logger.info(
        f"[ROI/ML] Training complete — version={result['version_tag']} "
        f"programs={result['n_programs_updated']} "
        f"promoted={result['promoted']}"
    )

    context["task_instance"].xcom_push(key="ml_version_tag", value=result["version_tag"])
    context["task_instance"].xcom_push(key="ml_promoted", value=result["promoted"])

    return result


def task_invalidate_cache(**context):
    """
    Clear Redis cache for updated program IDs so Next.js
    picks up fresh data on next request.
    """
    try:
        import redis

        config = get_config()
        r = redis.from_url(Variable.get("REDIS_URL", default_var="redis://redis:6379/0"))

        # Invalidate all program cache keys
        keys = r.keys("indialens:program:*")
        if keys:
            r.delete(*keys)
        r.delete("indialens:index:*")

        logger.info(f"[Cache] Invalidated {len(keys)} cache keys")
        return {"invalidated_keys": len(keys)}
    except Exception as e:
        logger.warning(f"[Cache] Redis invalidation failed (non-fatal): {e}")
        return {"invalidated_keys": 0, "error": str(e)}


def task_notify_admin(**context):
    """Send email/webhook summary to the admin team."""
    ti = context["task_instance"]
    anomaly_report = ti.xcom_pull(task_ids="anomaly_report") or {}
    roi_result = ti.xcom_pull(task_ids="compute_roi_scores") or {}

    summary = {
        "run_date": context["ds"],
        "anomaly_pct": f"{anomaly_report.get('anomaly_pct', 0):.1%}",
        "pending_anomalies": anomaly_report.get("pending_anomalies", 0),
        "programs_updated": roi_result.get("programs_updated", 0),
    }

    logger.info(f"[Notify] Weekly scrape complete: {summary}")
    # TODO: send to Slack webhook or email in production
    return summary


# ── DAG definition ──────────────────────────────────────────────────

with DAG(
    dag_id="indialens_weekly_scrape",
    default_args=DEFAULT_ARGS,
    description="Weekly data pipeline: scrape → anomaly check → ROI recompute",
    schedule_interval="30 20 * * 6",   # 20:30 UTC Saturday = 02:00 IST Sunday
    catchup=False,
    max_active_runs=1,
    tags=["indialens", "scrape", "weekly"],
) as dag:

    start = EmptyOperator(task_id="start")

    # Parallel scrape tasks
    # One task, not nine. Each of the nine it replaces had its own copy of the
    # engine construction, the import path and the status write, and all three
    # of those copies were wrong. Per-source isolation now lives in the
    # runner, so a single task gets the same fault containment with one place
    # to maintain.
    all_scrapers = PythonOperator(
        task_id="scrape_all",
        python_callable=task_scrape_all,
        pool="scraper_pool",
        execution_timeout=timedelta(hours=3),
    )

    anomaly_report = PythonOperator(
        task_id="anomaly_report",
        python_callable=task_anomaly_report,
        trigger_rule=TriggerRule.ALL_DONE,   # run even if some scrapers fail
    )

    retrain_gate = ShortCircuitOperator(
        task_id="retrain_gate",
        python_callable=task_should_retrain,
    )

    compute_roi = PythonOperator(
        task_id="compute_roi_scores",
        python_callable=task_compute_roi_scores,
    )

    invalidate_cache = PythonOperator(
        task_id="invalidate_cache",
        python_callable=task_invalidate_cache,
    )

    notify = PythonOperator(
        task_id="notify_admin",
        python_callable=task_notify_admin,
        trigger_rule=TriggerRule.ALL_DONE,
    )

    # ── Wire up the DAG ─────────────────────────────────────────────
    start >> all_scrapers >> anomaly_report >> retrain_gate >> compute_roi >> invalidate_cache >> notify
