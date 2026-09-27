"""
/api/admin — Admin panel endpoints (protected by API key)
- GET  /admin/anomalies            — list pending anomalies
- POST /admin/anomalies/{id}/review — accept or reject
- GET  /admin/feedback             — educator feedback queue
- POST /admin/feedback             — submit educator correction
- GET  /admin/scrapes              — scrape run history
- POST /admin/scrapes/trigger      — manually trigger a scrape
- GET  /admin/models               — model version history
- POST /admin/stats                — dashboard summary stats
- POST /admin/recompute-roi        — recompute roi_scores from live trajectories
"""
import logging
import uuid
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
import secrets as _secrets

from ..db.database import get_db
from ..schemas import AnomalyReviewRequest, FeedbackCreateRequest
from ..config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


def _program_id_or_none(value: Optional[str]) -> Optional[str]:
    """Keep a correction even when the form's id is not a program UUID.

    A non-UUID is stored as NULL rather than failing the insert. A UUID that
    is not in `programs` still fails the foreign key — that is a real miss,
    and the caller sees an error instead of a saved row pointing nowhere.
    """
    if not value:
        return None
    try:
        return str(uuid.UUID(str(value)))
    except (ValueError, AttributeError, TypeError):
        return None


def _require_admin(x_api_key: Optional[str] = Header(None)):
    """Constant-time admin key check.

    Uses secrets.compare_digest instead of `!=` so the comparison does not leak
    the key byte-by-byte through response timing. An empty configured key is
    rejected outright — otherwise a deployment that forgot to set it would
    accept the literal empty header.
    """
    configured = settings.api_key_admin or ""
    if not configured:
        raise HTTPException(
            status_code=503,
            detail="Admin API is not configured (API_KEY_ADMIN unset)",
        )
    if not x_api_key or not _secrets.compare_digest(x_api_key, configured):
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


@router.get("/anomalies")
async def list_anomalies(
    db: AsyncSession = Depends(get_db),
    status: str = "pending",
    _: None = Depends(_require_admin),
):
    try:
        result = await db.execute(text("""
            SELECT
                a.id, a.program_id, a.field_name, a.prior_value, a.new_value,
                a.delta_pct, a.status, a.created_at,
                c.short_name AS college_name,
                d.short_name AS degree_name
            FROM anomalies a
            JOIN programs p ON p.id = a.program_id
            JOIN colleges c ON c.id = p.college_id
            JOIN degrees d ON d.id = p.degree_id
            WHERE a.status = :status
            ORDER BY a.created_at DESC
            LIMIT 100
        """), {"status": status})

        rows = [dict(r._mapping) for r in result]
        return {"data": rows, "total": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=503, detail={"error": "database_unavailable", "reason": str(e)})


@router.post("/anomalies/{anomaly_id}/review")
async def review_anomaly(
    anomaly_id: str,
    body: AnomalyReviewRequest,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(_require_admin),
):
    try:
        new_status = "accepted" if body.action == "accept" else "rejected"
        result = await db.execute(
            text("""
                UPDATE anomalies
                SET status = :status, review_notes = :notes, reviewed_at = NOW()
                WHERE id = :id
                RETURNING id, status
            """),
            {"status": new_status, "notes": body.notes, "id": anomaly_id},
        )
        row = result.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Anomaly not found")

        await db.commit()

        # If accepted — flip the data_point to is_current
        if body.action == "accept":
            await _apply_anomaly(db, anomaly_id)

        return {"id": anomaly_id, "status": new_status}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def _apply_anomaly(db: AsyncSession, anomaly_id: str):
    """
    When an anomaly is accepted:
    1. Find the data_point for this anomaly's new_value
    2. Flip prior is_current=TRUE to FALSE
    3. Set new data_point is_current=TRUE
    4. Re-trigger ROI score computation (stubbed for Week 2)
    """
    result = await db.execute(
        text("SELECT program_id, field_name, new_value FROM anomalies WHERE id = :id"),
        {"id": anomaly_id},
    )
    row = result.fetchone()
    if not row:
        return

    program_id, field_name, new_value = row.program_id, row.field_name, row.new_value

    # Retire old current value
    await db.execute(text("""
        UPDATE data_points SET is_current = FALSE
        WHERE program_id = :pid AND field_name = :field AND is_current = TRUE
    """), {"pid": program_id, "field": field_name})

    # Mark new value as current
    await db.execute(text("""
        UPDATE data_points SET is_current = TRUE
        WHERE program_id = :pid AND field_name = :field AND raw_value = :val
        AND id = (
            SELECT id FROM data_points
            WHERE program_id = :pid AND field_name = :field AND raw_value = :val
            ORDER BY scraped_at DESC LIMIT 1
        )
    """), {"pid": program_id, "field": field_name, "val": new_value})

    await db.commit()


@router.get("/feedback")
async def list_feedback(
    db: AsyncSession = Depends(get_db),
    status: str = "pending",
    _: None = Depends(_require_admin),
):
    try:
        result = await db.execute(text("""
            SELECT * FROM educator_feedback
            WHERE status = :status
            ORDER BY created_at DESC
            LIMIT 100
        """), {"status": status})
        rows = [dict(r._mapping) for r in result]
        return {"data": rows, "total": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=503, detail={"error": "database_unavailable", "reason": str(e)})


@router.post("/feedback")
async def submit_feedback(
    body: FeedbackCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint — educators submit corrections (no auth required)."""
    try:
        await db.execute(text("""
            INSERT INTO educator_feedback
            (program_id, field_name, old_value, new_value, source_url, submitter_confidence, notes, submitter_email)
            VALUES (CAST(:program_id AS uuid), :field, :old, :new, :url, :conf, :notes, :email)
        """), {
            "program_id": _program_id_or_none(body.college_degree_id),
            "field": body.field_name,
            "old": body.old_value,
            "new": body.new_value,
            "url": body.source_url,
            "conf": body.confidence,
            "notes": body.notes,
            "email": body.submitter_email,
        })
        await db.commit()
        return {"status": "received", "message": "Thank you. Your submission is in the review queue."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scrapes")
async def list_scrape_runs(
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
    _: None = Depends(_require_admin),
):
    try:
        result = await db.execute(text("""
            SELECT * FROM scrape_runs
            ORDER BY started_at DESC
            LIMIT :limit
        """), {"limit": limit})
        rows = [dict(r._mapping) for r in result]
        return {"data": rows, "total": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=503, detail={"error": "database_unavailable", "reason": str(e)})


@router.post("/scrapes/trigger")
async def trigger_scrape(
    source: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(_require_admin),
):
    from ..scraper_jobs import VALID_SOURCES, run_scraper_job

    if source not in VALID_SOURCES:
        raise HTTPException(status_code=400, detail=f"Invalid source. Valid: {VALID_SOURCES}")

    try:
        result = await db.execute(text("""
            INSERT INTO scrape_runs (source_name, status)
            VALUES (:source, 'running')
            RETURNING id
        """), {"source": source})
        run_id = str(result.scalar())
        await db.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    background_tasks.add_task(run_scraper_job, source, run_id)
    return {
        "status": "triggered",
        "run_id": run_id,
        "source": source,
        "message": f"Scrape run queued for {source}. Poll GET /api/scrape/{run_id}",
    }


@router.get("/models")
async def list_models(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(_require_admin),
):
    try:
        result = await db.execute(text("""
            SELECT * FROM model_versions ORDER BY trained_at DESC LIMIT 20
        """))
        rows = [dict(r._mapping) for r in result]
        return {"data": rows, "total": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=503, detail={"error": "database_unavailable", "reason": str(e)})


@router.get("/stats")
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(_require_admin),
):
    """Dashboard summary for admin panel overview tab."""
    try:
        stats = {}

        # Program count
        r = await db.execute(text("SELECT COUNT(*) FROM programs WHERE is_active = TRUE"))
        stats["programs_indexed"] = r.scalar() or 0

        # Pending anomalies
        r = await db.execute(text("SELECT COUNT(*) FROM anomalies WHERE status = 'pending'"))
        stats["pending_anomalies"] = r.scalar() or 0

        # Pending feedback
        r = await db.execute(text("SELECT COUNT(*) FROM educator_feedback WHERE status = 'pending'"))
        stats["pending_feedback"] = r.scalar() or 0

        # Latest scrape
        r = await db.execute(text(
            "SELECT source_name, completed_at, status FROM scrape_runs ORDER BY started_at DESC LIMIT 1"
        ))
        row = r.fetchone()
        stats["last_scrape"] = dict(row._mapping) if row else None

        # Student reports
        r = await db.execute(text("SELECT COUNT(*) FROM student_reports"))
        stats["student_reports"] = r.scalar() or 0

        return stats
    except Exception as e:
        raise HTTPException(status_code=503, detail={"error": "database_unavailable", "reason": str(e)})


# ── ROI recompute ─────────────────────────────────────────────────────
# This route existed only as a caller: .github/workflows/weekly_scrape.yml
# POSTs to it at the end of every weekly run. No server-side handler had ever
# implemented it, so the job's last step 404'd on a `--fail` curl every week and
# fresh scrape data was never re-scored. Scraper output lands in cost_data /
# placement_data / salary_trajectories; nothing downstream runs unless something
# recomputes roi_scores, and the only thing that did was the manual
# `python -m scripts.compute_roi`. So the scrape pipeline's whole point —
# fresher ROI numbers — was not happening.
#
# The computation below is the same one scripts/compute_roi.py performs:
# `ml.roi_computer.compute_roi()` over the same current trajectory rows, writing
# the same columns, and applying the same rule that `data_complete=False` scores
# are never persisted (a program missing real fee or placement data is left
# unscored rather than given an invented composite). It is idempotent: each run
# retires the prior is_current row and inserts exactly one fresh one, so running
# it weekly converges on the same state as running it twice.
#
# The admin router is mounted twice by api/main.py (see the MOUNT table there) —
# once at /api/admin and once at /api/v1/admin, because two callers in the repo
# used two different prefixes. Both mounts resolve to this one handler, so
# /api/v1/admin/recompute-roi and /api/admin/recompute-roi are the same code.


@router.post("/recompute-roi")
async def recompute_roi(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(_require_admin),
):
    """Recompute roi_scores for every active program. Admin only.

    Synchronous on purpose: the weekly scrape job calls this with `curl --fail`
    and then exits, so returning before the work finished would report success
    for a recompute that had not happened. At the current data size (tens of
    programs) this is well under a second.
    """
    from ml.roi_computer import compute_roi

    try:
        result = await db.execute(text("""
            SELECT
                p.id AS program_id,
                c.tier, c.college_type, c.state, c.nirf_rank,
                d.field AS degree_field, d.duration_years,
                cd.total_cost_of_degree AS total_cost_of_degree_inr,
                pl.placement_rate_pct,
                ri.ai_automation_prob, ri.salary_volatility, ri.industry_cyclicality,
                ri.credential_inflation, ri.geographic_concentration, ri.work_life_quality
            FROM programs p
            JOIN colleges c ON c.id = p.college_id
            JOIN degrees d ON d.id = p.degree_id
            LEFT JOIN cost_data cd ON cd.program_id = p.id AND cd.is_current = TRUE
            LEFT JOIN placement_data pl ON pl.program_id = p.id AND pl.is_current = TRUE
            LEFT JOIN risk_indicators ri ON ri.program_id = p.id AND ri.is_current = TRUE
            WHERE p.is_active = TRUE
        """))
        programs = [dict(r._mapping) for r in result]
    except Exception as e:
        raise HTTPException(status_code=503, detail={"error": "database_unavailable", "reason": str(e)})

    model_version = settings.current_model_version
    written = 0
    skipped_no_trajectory = 0
    skipped_incomplete_data = 0
    failures: list[dict] = []

    for prog in programs:
        pid = str(prog["program_id"])
        try:
            traj_rows = await db.execute(text("""
                SELECT year_number, p25_inr, p50_inr, p75_inr
                FROM salary_trajectories
                WHERE program_id = :pid AND is_current = TRUE
            """), {"pid": pid})
            traj = {
                f"y{row.year_number}": {
                    "p25": row.p25_inr,
                    "p50": row.p50_inr,
                    "p75": row.p75_inr,
                }
                for row in traj_rows
            }

            # No y1 band means no trajectory was ever computed for this program,
            # so there is nothing to score against. Not an error.
            if "y1" not in traj:
                skipped_no_trajectory += 1
                continue

            placement = float(prog.get("placement_rate_pct") or 0)
            if placement > 1:
                placement = placement / 100.0
            prog["placement_rate_pct"] = placement

            scores = compute_roi(prog, traj)

            # compute_roi returns data_complete=False with None figures when real
            # fee or placement data is missing. Persisting those — or the
            # 0.35/0.70/0.75 defaults this code used to hardcode — is how
            # unmeasured colleges ended up showing confident ROI numbers. Leave
            # them unscored until a scraper supplies the missing inputs.
            if not scores.get("data_complete"):
                skipped_incomplete_data += 1
                continue

            sub = scores.get("sub_scores") or {}
            await db.execute(text("""
                UPDATE roi_scores SET is_current = FALSE
                WHERE program_id = :pid AND is_current = TRUE
            """), {"pid": pid})
            await db.execute(text("""
                INSERT INTO roi_scores
                    (program_id, model_version, composite_score, financial_roi_pct,
                     risk_score, optionality_score, mobility_score, satisfaction_score,
                     network_score, ci_low, ci_high, confidence_level, is_current)
                VALUES
                    (:pid, :mv, :comp, :fin, :risk, :opt, :mob, :sat, :net,
                     :ci_l, :ci_h, :conf, TRUE)
            """), {
                "pid": pid,
                "mv": model_version,
                "comp": scores["composite_score"],
                "fin": scores["financial_roi_pct"],
                "risk": scores["risk_score"],
                "opt": sub.get("optionality", 0.70),
                "mob": sub.get("mobility", 0.70),
                "sat": sub.get("satisfaction", 0.75),
                "net": sub.get("network", 0.80),
                "ci_l": scores.get("ci_low"),
                "ci_h": scores.get("ci_high"),
                "conf": scores.get("confidence_level", "High"),
            })
            written += 1
        except Exception as e:
            # One malformed program must not abandon the rest of the catalog, and
            # the CI log needs to name which ones failed. Recorded and reported.
            logger.error("[Admin] ROI recompute failed for program %s: %s", pid, e, exc_info=True)
            failures.append({"program_id": pid, "error": str(e)})

    await db.commit()

    summary = {
        "status": "ok" if not failures else "completed_with_errors",
        "programs_seen": len(programs),
        "programs_recomputed": written,
        "skipped_no_trajectory": skipped_no_trajectory,
        "skipped_incomplete_data": skipped_incomplete_data,
        "failures": failures,
        "failure_count": len(failures),
        "model_version": model_version,
    }
    if failures:
        # The scrape job runs with --fail, so a partial failure should not read as
        # a clean green post-scrape step. The work that did succeed is committed
        # either way and re-running is safe.
        summary["detail"] = f"{len(failures)} of {len(programs)} programs failed; see failures[]"
    return summary
